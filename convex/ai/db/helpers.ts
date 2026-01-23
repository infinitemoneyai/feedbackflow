/**
 * Shared database helpers for AI operations
 * Reduces duplication across AI mutation/query handlers
 */

import { QueryCtx, MutationCtx } from "../../_generated/server";
import { Id } from "../../_generated/dataModel";

/**
 * Get authenticated user from context
 */
export async function getAuthenticatedUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    return null;
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
    .first();

  return user;
}

/**
 * Verify user has access to feedback (via team membership)
 * Returns { user, feedback, membership } or throws error
 */
export async function verifyFeedbackAccess(
  ctx: QueryCtx | MutationCtx,
  feedbackId: Id<"feedback">
) {
  const user = await getAuthenticatedUser(ctx);
  if (!user) {
    throw new Error("Unauthenticated");
  }

  const feedback = await ctx.db.get(feedbackId);
  if (!feedback) {
    throw new Error("Feedback not found");
  }

  const membership = await ctx.db
    .query("teamMembers")
    .withIndex("by_user", (q) => q.eq("userId", user._id))
    .filter((q) => q.eq(q.field("teamId"), feedback.teamId))
    .first();

  if (!membership) {
    throw new Error("Not a member of this team");
  }

  return { user, feedback, membership };
}

/**
 * Verify user has access to team
 * Returns { user, membership } or throws error
 */
export async function verifyTeamAccess(
  ctx: QueryCtx | MutationCtx,
  teamId: Id<"teams">
) {
  const user = await getAuthenticatedUser(ctx);
  if (!user) {
    throw new Error("Unauthenticated");
  }

  const membership = await ctx.db
    .query("teamMembers")
    .withIndex("by_user", (q) => q.eq("userId", user._id))
    .filter((q) => q.eq(q.field("teamId"), teamId))
    .first();

  if (!membership) {
    throw new Error("Not a member of this team");
  }

  return { user, membership };
}

/**
 * Increment AI usage tracking for a team
 */
export async function incrementAiUsage(
  ctx: MutationCtx,
  teamId: Id<"teams">
) {
  const now = Date.now();
  const date = new Date();
  const year = date.getFullYear();
  const month = date.getMonth() + 1;

  const usageRecord = await ctx.db
    .query("usageTracking")
    .withIndex("by_team", (q) => q.eq("teamId", teamId))
    .filter((q) =>
      q.and(q.eq(q.field("year"), year), q.eq(q.field("month"), month))
    )
    .first();

  if (usageRecord) {
    await ctx.db.patch(usageRecord._id, {
      aiCallCount: usageRecord.aiCallCount + 1,
      updatedAt: now,
    });
  } else {
    await ctx.db.insert("usageTracking", {
      teamId,
      year,
      month,
      feedbackCount: 0,
      aiCallCount: 1,
      storageUsedBytes: 0,
      createdAt: now,
      updatedAt: now,
    });
  }
}

/**
 * Log activity for feedback
 */
export async function logFeedbackActivity(
  ctx: MutationCtx,
  params: {
    feedbackId: Id<"feedback">;
    userId?: Id<"users">;
    action:
      | "created"
      | "status_changed"
      | "priority_changed"
      | "assigned"
      | "unassigned"
      | "tagged"
      | "exported"
      | "commented"
      | "ai_analyzed"
      | "ticket_drafted";
    details: {
      from?: string;
      to?: string;
      extra?: string;
    };
  }
) {
  await ctx.db.insert("activityLog", {
    feedbackId: params.feedbackId,
    userId: params.userId,
    action: params.action,
    details: params.details,
    createdAt: Date.now(),
  });
}
