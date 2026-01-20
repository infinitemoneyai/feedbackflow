import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Simple encryption for storing API keys
 * In production, use proper AES-256 encryption with a secure key
 */
function encryptKey(key: string): string {
  return "encrypted:" + Buffer.from(key).toString("base64");
}

function decryptKey(encryptedKey: string): string {
  if (!encryptedKey.startsWith("encrypted:")) {
    return encryptedKey;
  }
  return Buffer.from(encryptedKey.slice("encrypted:".length), "base64").toString();
}

/**
 * Save or update a Linear integration
 */
export const saveLinearIntegration = mutation({
  args: {
    teamId: v.id("teams"),
    apiKey: v.string(),
    linearTeamId: v.optional(v.string()),
    linearProjectId: v.optional(v.string()),
    linearLabelIds: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Check if user is an admin of the team
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("teamId"), args.teamId))
      .first();

    if (!membership || membership.role !== "admin") {
      throw new Error("Only admins can configure integrations");
    }

    // Check if Linear integration already exists
    const existing = await ctx.db
      .query("integrations")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .filter((q) => q.eq(q.field("provider"), "linear"))
      .first();

    const encryptedKey = encryptKey(args.apiKey);
    const now = Date.now();

    if (existing) {
      // Update existing
      await ctx.db.patch(existing._id, {
        accessToken: encryptedKey,
        settings: {
          linearTeamId: args.linearTeamId,
          linearProjectId: args.linearProjectId,
          linearLabelIds: args.linearLabelIds,
        },
        isActive: true,
        updatedAt: now,
      });
      return { id: existing._id, updated: true };
    } else {
      // Create new
      const id = await ctx.db.insert("integrations", {
        teamId: args.teamId,
        provider: "linear",
        accessToken: encryptedKey,
        settings: {
          linearTeamId: args.linearTeamId,
          linearProjectId: args.linearProjectId,
          linearLabelIds: args.linearLabelIds,
        },
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
      return { id, updated: false };
    }
  },
});

/**
 * Update Linear integration settings (team, project, labels)
 */
export const updateLinearSettings = mutation({
  args: {
    teamId: v.id("teams"),
    linearTeamId: v.optional(v.string()),
    linearProjectId: v.optional(v.string()),
    linearLabelIds: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Check if user is an admin
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("teamId"), args.teamId))
      .first();

    if (!membership || membership.role !== "admin") {
      throw new Error("Only admins can configure integrations");
    }

    // Get integration
    const integration = await ctx.db
      .query("integrations")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .filter((q) => q.eq(q.field("provider"), "linear"))
      .first();

    if (!integration) {
      throw new Error("Linear integration not found");
    }

    // Update settings
    await ctx.db.patch(integration._id, {
      settings: {
        ...integration.settings,
        linearTeamId: args.linearTeamId,
        linearProjectId: args.linearProjectId,
        linearLabelIds: args.linearLabelIds,
      },
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Delete a Linear integration
 */
export const deleteLinearIntegration = mutation({
  args: {
    teamId: v.id("teams"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Check if user is an admin
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("teamId"), args.teamId))
      .first();

    if (!membership || membership.role !== "admin") {
      throw new Error("Only admins can configure integrations");
    }

    // Get and delete integration
    const integration = await ctx.db
      .query("integrations")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .filter((q) => q.eq(q.field("provider"), "linear"))
      .first();

    if (integration) {
      await ctx.db.delete(integration._id);
    }

    return { success: true };
  },
});

/**
 * Get Linear integration for a team (public data only)
 */
export const getLinearIntegration = query({
  args: {
    teamId: v.id("teams"),
  },
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
      return null;
    }

    const integration = await ctx.db
      .query("integrations")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .filter((q) => q.eq(q.field("provider"), "linear"))
      .first();

    if (!integration) {
      return null;
    }

    // Return public info only (no API key)
    return {
      _id: integration._id,
      isActive: integration.isActive,
      settings: integration.settings,
      createdAt: integration.createdAt,
      updatedAt: integration.updatedAt,
      // Show that key exists but mask it
      hasApiKey: !!integration.accessToken,
    };
  },
});

/**
 * Get decrypted API key for server-side use
 */
export const getLinearApiKey = query({
  args: {
    teamId: v.id("teams"),
  },
  handler: async (ctx, args) => {
    // This should only be called from internal actions
    const integration = await ctx.db
      .query("integrations")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .filter((q) => q.eq(q.field("provider"), "linear"))
      .first();

    if (!integration || !integration.isActive) {
      return null;
    }

    return {
      apiKey: decryptKey(integration.accessToken),
      settings: integration.settings,
    };
  },
});

/**
 * Create an export record for Linear
 */
export const createExport = mutation({
  args: {
    feedbackId: v.id("feedback"),
    provider: v.union(v.literal("linear"), v.literal("notion"), v.literal("json")),
    externalId: v.optional(v.string()),
    externalUrl: v.optional(v.string()),
    exportedData: v.optional(v.any()),
    status: v.union(v.literal("success"), v.literal("failed")),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const feedback = await ctx.db.get(args.feedbackId);
    if (!feedback) {
      throw new Error("Feedback not found");
    }

    // Check membership
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("teamId"), feedback.teamId))
      .first();

    if (!membership) {
      throw new Error("You are not a member of this team");
    }

    // Create export record
    const exportId = await ctx.db.insert("exports", {
      feedbackId: args.feedbackId,
      userId: user._id,
      provider: args.provider,
      externalId: args.externalId,
      externalUrl: args.externalUrl,
      exportedData: args.exportedData,
      status: args.status,
      errorMessage: args.errorMessage,
      createdAt: Date.now(),
    });

    // Create activity log entry
    await ctx.db.insert("activityLog", {
      feedbackId: args.feedbackId,
      userId: user._id,
      action: "exported",
      details: {
        to: args.provider,
        extra: args.status === "success"
          ? args.externalUrl
          : args.errorMessage,
      },
      createdAt: Date.now(),
    });

    // Update feedback status to "exported" if successful
    if (args.status === "success") {
      await ctx.db.patch(args.feedbackId, {
        status: "exported",
        updatedAt: Date.now(),
      });
    }

    return { exportId };
  },
});

/**
 * Get exports for a feedback item
 */
export const getExportsForFeedback = query({
  args: {
    feedbackId: v.id("feedback"),
  },
  handler: async (ctx, args) => {
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

    const feedback = await ctx.db.get(args.feedbackId);
    if (!feedback) {
      return [];
    }

    // Check membership
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("teamId"), feedback.teamId))
      .first();

    if (!membership) {
      return [];
    }

    const exports = await ctx.db
      .query("exports")
      .withIndex("by_feedback", (q) => q.eq("feedbackId", args.feedbackId))
      .collect();

    // Get user details for each export
    const exportsWithUsers = await Promise.all(
      exports.map(async (exp) => {
        const exportUser = await ctx.db.get(exp.userId);
        return {
          ...exp,
          user: exportUser
            ? {
                _id: exportUser._id,
                name: exportUser.name,
                email: exportUser.email,
              }
            : null,
        };
      })
    );

    return exportsWithUsers;
  },
});

// =============================================================================
// Notion Integration
// =============================================================================

/**
 * Save or update a Notion integration
 */
export const saveNotionIntegration = mutation({
  args: {
    teamId: v.id("teams"),
    apiKey: v.string(),
    notionDatabaseId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Check if user is an admin of the team
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("teamId"), args.teamId))
      .first();

    if (!membership || membership.role !== "admin") {
      throw new Error("Only admins can configure integrations");
    }

    // Check if Notion integration already exists
    const existing = await ctx.db
      .query("integrations")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .filter((q) => q.eq(q.field("provider"), "notion"))
      .first();

    const encryptedKey = encryptKey(args.apiKey);
    const now = Date.now();

    if (existing) {
      // Update existing
      await ctx.db.patch(existing._id, {
        accessToken: encryptedKey,
        settings: {
          notionDatabaseId: args.notionDatabaseId,
        },
        isActive: true,
        updatedAt: now,
      });
      return { id: existing._id, updated: true };
    } else {
      // Create new
      const id = await ctx.db.insert("integrations", {
        teamId: args.teamId,
        provider: "notion",
        accessToken: encryptedKey,
        settings: {
          notionDatabaseId: args.notionDatabaseId,
        },
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
      return { id, updated: false };
    }
  },
});

/**
 * Update Notion integration settings (database ID)
 */
export const updateNotionSettings = mutation({
  args: {
    teamId: v.id("teams"),
    notionDatabaseId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Check if user is an admin
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("teamId"), args.teamId))
      .first();

    if (!membership || membership.role !== "admin") {
      throw new Error("Only admins can configure integrations");
    }

    // Get integration
    const integration = await ctx.db
      .query("integrations")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .filter((q) => q.eq(q.field("provider"), "notion"))
      .first();

    if (!integration) {
      throw new Error("Notion integration not found");
    }

    // Update settings
    await ctx.db.patch(integration._id, {
      settings: {
        ...integration.settings,
        notionDatabaseId: args.notionDatabaseId,
      },
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Delete a Notion integration
 */
export const deleteNotionIntegration = mutation({
  args: {
    teamId: v.id("teams"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Check if user is an admin
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("teamId"), args.teamId))
      .first();

    if (!membership || membership.role !== "admin") {
      throw new Error("Only admins can configure integrations");
    }

    // Get and delete integration
    const integration = await ctx.db
      .query("integrations")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .filter((q) => q.eq(q.field("provider"), "notion"))
      .first();

    if (integration) {
      await ctx.db.delete(integration._id);
    }

    return { success: true };
  },
});

/**
 * Get Notion integration for a team (public data only)
 */
export const getNotionIntegration = query({
  args: {
    teamId: v.id("teams"),
  },
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
      return null;
    }

    const integration = await ctx.db
      .query("integrations")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .filter((q) => q.eq(q.field("provider"), "notion"))
      .first();

    if (!integration) {
      return null;
    }

    // Return public info only (no API key)
    return {
      _id: integration._id,
      isActive: integration.isActive,
      settings: integration.settings,
      createdAt: integration.createdAt,
      updatedAt: integration.updatedAt,
      // Show that key exists but mask it
      hasApiKey: !!integration.accessToken,
    };
  },
});

/**
 * Get decrypted Notion API key for server-side use
 */
export const getNotionApiKey = query({
  args: {
    teamId: v.id("teams"),
  },
  handler: async (ctx, args) => {
    // This should only be called from internal actions
    const integration = await ctx.db
      .query("integrations")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .filter((q) => q.eq(q.field("provider"), "notion"))
      .first();

    if (!integration || !integration.isActive) {
      return null;
    }

    return {
      apiKey: decryptKey(integration.accessToken),
      settings: integration.settings,
    };
  },
});
