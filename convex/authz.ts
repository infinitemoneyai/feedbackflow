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
 * Resolve the authenticated user, or null (query soft-fail paths).
 */
export async function getAuthUser(
  ctx: QueryCtx | MutationCtx
): Promise<Doc<"users"> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    return null;
  }

  return ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
    .unique();
}

/**
 * Resolve the authenticated user, or throw.
 * - "Unauthenticated" — no identity on the request
 * - "User not found" — identity exists but the Clerk→Convex sync hasn't
 *   landed (new-user race)
 */
export async function requireUser(
  ctx: QueryCtx | MutationCtx
): Promise<Doc<"users">> {
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

  return user;
}

/**
 * Resolve the authenticated user's membership in a team, or throw.
 *
 * Errors (message is the contract, kept stable for callers/UI):
 * - "Unauthenticated" / "User not found" — see requireUser
 * - "Not a member of this team"
 * - "Admin access required" — membership exists but role is insufficient
 */
export async function requireTeamMember(
  ctx: QueryCtx | MutationCtx,
  teamId: Id<"teams">,
  options: RequireTeamMemberOptions = {}
): Promise<TeamMemberResult> {
  const user = await requireUser(ctx);

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

/**
 * Non-throwing companion for query soft-fail paths (queries return
 * null/[] for unauthenticated or non-member callers instead of erroring
 * the client subscription). Same lookup sequence as requireTeamMember.
 */
export async function getTeamMembership(
  ctx: QueryCtx | MutationCtx,
  teamId: Id<"teams">
): Promise<TeamMemberResult | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    return null;
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
    .unique();
  if (!user) {
    return null;
  }

  const membership = await ctx.db
    .query("teamMembers")
    .withIndex("by_user_and_team", (q) =>
      q.eq("userId", user._id).eq("teamId", teamId)
    )
    .unique();
  if (!membership) {
    return null;
  }

  return { user, membership };
}
