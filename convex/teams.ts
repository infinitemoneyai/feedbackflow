import { v } from "convex/values";
import { mutation, query, MutationCtx } from "./_generated/server";

/**
 * Generate a URL-friendly slug from a team name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
}

/**
 * Generate a unique team slug by appending numbers if needed
 */
async function generateUniqueSlug(
  ctx: MutationCtx,
  baseName: string
): Promise<string> {
  const baseSlug = generateSlug(baseName);
  let slug = baseSlug;
  let counter = 1;

  // Keep checking until we find a unique slug
  while (true) {
    const existing = await ctx.db
      .query("teams")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();

    if (!existing) {
      return slug;
    }

    counter++;
    slug = `${baseSlug}-${counter}`;
  }
}

/**
 * Generate a random invite token
 */
function generateInviteToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * Create a new team and add the creator as admin
 */
export const createTeam = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    // Get the user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Generate unique slug
    const slug = await generateUniqueSlug(ctx, args.name);

    // Create the team
    const teamId = await ctx.db.insert("teams", {
      name: args.name,
      slug,
      ownerId: user._id,
      createdAt: Date.now(),
    });

    // Add creator as admin
    await ctx.db.insert("teamMembers", {
      userId: user._id,
      teamId,
      role: "admin",
      joinedAt: Date.now(),
    });

    // Create free subscription for the team
    await ctx.db.insert("subscriptions", {
      teamId,
      stripeCustomerId: "", // Will be set when Stripe customer is created
      plan: "free",
      seats: 1,
      status: "active",
      cancelAtPeriodEnd: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return teamId;
  },
});

/**
 * Invite a user to a team by email
 * Note: Email sending is handled separately via Resend
 */
export const inviteToTeam = mutation({
  args: {
    teamId: v.id("teams"),
    email: v.string(),
    role: v.union(v.literal("admin"), v.literal("member")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    // Get the user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Check if user is admin of the team
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("teamId"), args.teamId))
      .first();

    if (!membership || membership.role !== "admin") {
      throw new Error("Only admins can invite members");
    }

    // Check if email is already a member
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existingUser) {
      const existingMember = await ctx.db
        .query("teamMembers")
        .withIndex("by_user", (q) => q.eq("userId", existingUser._id))
        .filter((q) => q.eq(q.field("teamId"), args.teamId))
        .first();

      if (existingMember) {
        throw new Error("User is already a team member");
      }
    }

    // Check for existing pending invite
    const existingInvite = await ctx.db
      .query("teamInvites")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .filter((q) =>
        q.and(
          q.eq(q.field("teamId"), args.teamId),
          q.gt(q.field("expiresAt"), Date.now())
        )
      )
      .first();

    if (existingInvite) {
      throw new Error("An invite for this email is already pending");
    }

    // Create invite (expires in 7 days)
    const token = generateInviteToken();
    const inviteId = await ctx.db.insert("teamInvites", {
      teamId: args.teamId,
      email: args.email,
      role: args.role,
      invitedBy: user._id,
      token,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
      createdAt: Date.now(),
    });

    return { inviteId, token };
  },
});

/**
 * Accept a team invitation
 */
export const acceptInvite = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    // Get the user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Find the invite
    const invite = await ctx.db
      .query("teamInvites")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!invite) {
      throw new Error("Invalid invite token");
    }

    if (invite.expiresAt < Date.now()) {
      // Clean up expired invite
      await ctx.db.delete(invite._id);
      throw new Error("Invite has expired");
    }

    // Verify email matches (case-insensitive)
    if (invite.email.toLowerCase() !== user.email.toLowerCase()) {
      throw new Error("This invite is for a different email address");
    }

    // Check if already a member
    const existingMember = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("teamId"), invite.teamId))
      .first();

    if (existingMember) {
      // Clean up invite since user is already a member
      await ctx.db.delete(invite._id);
      throw new Error("You are already a member of this team");
    }

    // Add user as team member
    await ctx.db.insert("teamMembers", {
      userId: user._id,
      teamId: invite.teamId,
      role: invite.role,
      joinedAt: Date.now(),
    });

    // Delete the invite
    await ctx.db.delete(invite._id);

    return invite.teamId;
  },
});

/**
 * Update a team member's role
 */
export const updateMemberRole = mutation({
  args: {
    teamId: v.id("teams"),
    userId: v.id("users"),
    role: v.union(v.literal("admin"), v.literal("member")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    // Get the current user
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!currentUser) {
      throw new Error("User not found");
    }

    // Check if current user is admin
    const currentMembership = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", currentUser._id))
      .filter((q) => q.eq(q.field("teamId"), args.teamId))
      .first();

    if (!currentMembership || currentMembership.role !== "admin") {
      throw new Error("Only admins can change member roles");
    }

    // Get the team to check owner
    const team = await ctx.db.get(args.teamId);
    if (!team) {
      throw new Error("Team not found");
    }

    // Cannot change owner's role
    if (args.userId === team.ownerId) {
      throw new Error("Cannot change the owner's role");
    }

    // Find the target member
    const targetMembership = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("teamId"), args.teamId))
      .first();

    if (!targetMembership) {
      throw new Error("Member not found");
    }

    // Update role
    await ctx.db.patch(targetMembership._id, { role: args.role });

    return { success: true };
  },
});

/**
 * Remove a member from a team
 */
export const removeMember = mutation({
  args: {
    teamId: v.id("teams"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    // Get the current user
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!currentUser) {
      throw new Error("User not found");
    }

    // Get the team
    const team = await ctx.db.get(args.teamId);
    if (!team) {
      throw new Error("Team not found");
    }

    // Cannot remove the owner
    if (args.userId === team.ownerId) {
      throw new Error("Cannot remove the team owner");
    }

    // Check if current user is admin (or removing themselves)
    const currentMembership = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", currentUser._id))
      .filter((q) => q.eq(q.field("teamId"), args.teamId))
      .first();

    const isSelf = currentUser._id === args.userId;
    const isAdmin = currentMembership?.role === "admin";

    if (!isSelf && !isAdmin) {
      throw new Error("Only admins can remove members");
    }

    // Find the membership to remove
    const targetMembership = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("teamId"), args.teamId))
      .first();

    if (!targetMembership) {
      throw new Error("Member not found");
    }

    // Delete membership
    await ctx.db.delete(targetMembership._id);

    return { success: true };
  },
});

/**
 * Get a team by ID
 */
export const getTeam = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      return null;
    }

    // Check if user is a member
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("teamId"), args.teamId))
      .first();

    if (!membership) {
      return null; // Not a member, can't see team
    }

    const team = await ctx.db.get(args.teamId);
    if (!team) {
      return null;
    }

    // Get owner info
    const owner = await ctx.db.get(team.ownerId);

    return {
      ...team,
      owner,
      currentUserRole: membership.role,
      isOwner: team.ownerId === user._id,
    };
  },
});

/**
 * Get all teams for the current user
 */
export const getMyTeams = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      return [];
    }

    // Get all memberships
    const memberships = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Get team details
    const teams = await Promise.all(
      memberships.map(async (membership) => {
        const team = await ctx.db.get(membership.teamId);
        if (!team) return null;

        return {
          ...team,
          role: membership.role,
          isOwner: team.ownerId === user._id,
        };
      })
    );

    return teams.filter(Boolean);
  },
});

/**
 * Get all members of a team
 */
export const getTeamMembers = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!currentUser) {
      return [];
    }

    // Check if user is a member
    const currentMembership = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", currentUser._id))
      .filter((q) => q.eq(q.field("teamId"), args.teamId))
      .first();

    if (!currentMembership) {
      return []; // Not a member, can't see members
    }

    // Get team to determine owner
    const team = await ctx.db.get(args.teamId);
    if (!team) {
      return [];
    }

    // Get all memberships
    const memberships = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();

    // Get user details for each member
    const members = await Promise.all(
      memberships.map(async (membership) => {
        const user = await ctx.db.get(membership.userId);
        if (!user) return null;

        return {
          ...user,
          role: membership.role,
          joinedAt: membership.joinedAt,
          isOwner: user._id === team.ownerId,
          membershipId: membership._id,
        };
      })
    );

    return members.filter(Boolean);
  },
});

/**
 * Get team members (public query for API routes)
 * Returns basic user info for notifications
 */
export const getTeamMembersPublic = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    // Get all memberships for the team
    const memberships = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();

    // Get basic user info for each member
    const members = await Promise.all(
      memberships.map(async (membership) => {
        const user = await ctx.db.get(membership.userId);
        if (!user) return null;

        return {
          userId: user._id,
          email: user.email,
          name: user.name,
          role: membership.role,
        };
      })
    );

    return members.filter(Boolean);
  },
});

/**
 * Get pending invites for a team
 */
export const getTeamInvites = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!currentUser) {
      return [];
    }

    // Check if user is admin
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", currentUser._id))
      .filter((q) => q.eq(q.field("teamId"), args.teamId))
      .first();

    if (!membership || membership.role !== "admin") {
      return []; // Only admins can see invites
    }

    // Get pending invites (not expired)
    const invites = await ctx.db
      .query("teamInvites")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .filter((q) => q.gt(q.field("expiresAt"), Date.now()))
      .collect();

    // Add inviter details
    const invitesWithDetails = await Promise.all(
      invites.map(async (invite) => {
        const inviter = await ctx.db.get(invite.invitedBy);
        return {
          ...invite,
          inviterName: inviter?.name || inviter?.email,
        };
      })
    );

    return invitesWithDetails;
  },
});

/**
 * Cancel a pending invite
 */
export const cancelInvite = mutation({
  args: {
    inviteId: v.id("teamInvites"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!currentUser) {
      throw new Error("User not found");
    }

    // Get the invite
    const invite = await ctx.db.get(args.inviteId);
    if (!invite) {
      throw new Error("Invite not found");
    }

    // Check if user is admin of the team
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", currentUser._id))
      .filter((q) => q.eq(q.field("teamId"), invite.teamId))
      .first();

    if (!membership || membership.role !== "admin") {
      throw new Error("Only admins can cancel invites");
    }

    // Delete the invite
    await ctx.db.delete(args.inviteId);

    return { success: true };
  },
});

/**
 * Update team name
 */
export const updateTeam = mutation({
  args: {
    teamId: v.id("teams"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!currentUser) {
      throw new Error("User not found");
    }

    // Check if user is admin
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", currentUser._id))
      .filter((q) => q.eq(q.field("teamId"), args.teamId))
      .first();

    if (!membership || membership.role !== "admin") {
      throw new Error("Only admins can update team settings");
    }

    // Generate new slug if name changed
    const team = await ctx.db.get(args.teamId);
    if (!team) {
      throw new Error("Team not found");
    }

    let slug = team.slug;
    if (args.name !== team.name) {
      slug = await generateUniqueSlug(ctx, args.name);
    }

    // Update team
    await ctx.db.patch(args.teamId, {
      name: args.name,
      slug,
    });

    return { success: true };
  },
});

/**
 * Delete a team (owner only)
 */
export const deleteTeam = mutation({
  args: {
    teamId: v.id("teams"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!currentUser) {
      throw new Error("User not found");
    }

    // Get the team
    const team = await ctx.db.get(args.teamId);
    if (!team) {
      throw new Error("Team not found");
    }

    // Only owner can delete
    if (team.ownerId !== currentUser._id) {
      throw new Error("Only the team owner can delete the team");
    }

    // Delete all team invites
    const invites = await ctx.db
      .query("teamInvites")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();
    for (const invite of invites) {
      await ctx.db.delete(invite._id);
    }

    // Delete all team memberships
    const memberships = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();
    for (const membership of memberships) {
      await ctx.db.delete(membership._id);
    }

    // Delete the team
    await ctx.db.delete(args.teamId);

    return { success: true };
  },
});
