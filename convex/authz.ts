/**
 * Authorization — the ONE module for the identity → user → team membership
 * → role sequence. Every team-scoped Convex function derives authorization
 * here instead of inlining the block (the inline copies are being migrated
 * out; never add a new one).
 *
 * Identity is always derived server-side from ctx.auth — NEVER from a
 * client-supplied userId/clerkId arg.
 */

import { QueryCtx, MutationCtx } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

export interface TeamMemberResult {
  user: Doc<"users">;
  membership: Doc<"teamMembers">;
}

export interface RequireTeamMemberOptions {
  /** Require an elevated role; omit to admit any member. */
  role?: "admin";
}

/**
 * Resolve the authenticated user's membership in a team, or throw.
 *
 * Errors (message is the contract, kept stable for callers/UI):
 * - "Unauthenticated" — no identity on the request
 * - "User not found" — identity exists but the Clerk→Convex sync hasn't
 *   landed (new-user race)
 * - "Not a member of this team"
 * - "Admin access required" — membership exists but role is insufficient
 */
export async function requireTeamMember(
  ctx: QueryCtx | MutationCtx,
  teamId: Id<"teams">,
  options: RequireTeamMemberOptions = {}
): Promise<TeamMemberResult> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Unauthenticated");
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
    .unique();
  if (!user) {
    throw new Error("User not found");
  }

  const membership = await ctx.db
    .query("teamMembers")
    .withIndex("by_user_and_team", (q) =>
      q.eq("userId", user._id).eq("teamId", teamId)
    )
    .unique();
  if (!membership) {
    throw new Error("Not a member of this team");
  }

  if (options.role === "admin" && membership.role !== "admin") {
    throw new Error("Admin access required");
  }

  return { user, membership };
}
