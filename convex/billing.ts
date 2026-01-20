import { v } from "convex/values";
import {
  mutation,
  query,
  internalMutation,
  internalQuery,
  MutationCtx,
} from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ============================================================================
// Public Queries
// ============================================================================

/**
 * Get subscription for a team
 */
export const getSubscription = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    // Get the user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      return null;
    }

    // Verify user is a member of the team
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("teamId"), args.teamId))
      .first();

    if (!membership) {
      return null;
    }

    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .first();

    return subscription;
  },
});

/**
 * Get subscription for a team (public, for use in API routes)
 */
export const getSubscriptionPublic = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .first();

    return subscription;
  },
});

/**
 * Check if a team can submit feedback (public, for widget API)
 * This is used by the API route to check limits before submission
 */
export const checkCanSubmitFeedback = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .first();

    if (!subscription) {
      return {
        allowed: false,
        reason: "No subscription found for this team",
        plan: "free" as const,
        currentCount: 0,
        limit: 25,
        percentUsed: 0,
      };
    }

    // Pro plan has unlimited feedback
    if (subscription.plan === "pro" && subscription.status === "active") {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;

      const usage = await ctx.db
        .query("usageTracking")
        .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
        .filter((q) =>
          q.and(q.eq(q.field("year"), year), q.eq(q.field("month"), month))
        )
        .first();

      return {
        allowed: true,
        plan: "pro" as const,
        currentCount: usage?.feedbackCount ?? 0,
        limit: null,
        percentUsed: 0,
      };
    }

    // Free plan: check current month's feedback count
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const usage = await ctx.db
      .query("usageTracking")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .filter((q) =>
        q.and(q.eq(q.field("year"), year), q.eq(q.field("month"), month))
      )
      .first();

    const currentCount = usage?.feedbackCount ?? 0;
    const limit = 25;
    const percentUsed = Math.round((currentCount / limit) * 100);

    if (currentCount >= limit) {
      return {
        allowed: false,
        reason: `Monthly feedback limit reached (${limit}). Upgrade to Pro for unlimited feedback.`,
        plan: "free" as const,
        currentCount,
        limit,
        percentUsed: 100,
      };
    }

    return {
      allowed: true,
      plan: "free" as const,
      currentCount,
      limit,
      percentUsed,
      nearLimit: percentUsed >= 80,
    };
  },
});

/**
 * Get current usage for a team
 */
export const getUsage = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    // Get the user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      return null;
    }

    // Verify user is a member of the team
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("teamId"), args.teamId))
      .first();

    if (!membership) {
      return null;
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const usage = await ctx.db
      .query("usageTracking")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .filter((q) =>
        q.and(q.eq(q.field("year"), year), q.eq(q.field("month"), month))
      )
      .first();

    // Get team member count for seat usage
    const members = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();

    return {
      feedbackCount: usage?.feedbackCount ?? 0,
      aiCallCount: usage?.aiCallCount ?? 0,
      storageUsedBytes: usage?.storageUsedBytes ?? 0,
      memberCount: members.length,
      year,
      month,
    };
  },
});

// ============================================================================
// Public Mutations
// ============================================================================

/**
 * Update Stripe customer ID for a team
 */
export const updateStripeCustomerId = mutation({
  args: {
    teamId: v.id("teams"),
    stripeCustomerId: v.string(),
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

    // Verify user is an admin of the team
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("teamId"), args.teamId))
      .first();

    if (!membership || membership.role !== "admin") {
      throw new Error("Only admins can update billing");
    }

    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .first();

    if (!subscription) {
      throw new Error("Subscription not found");
    }

    await ctx.db.patch(subscription._id, {
      stripeCustomerId: args.stripeCustomerId,
      updatedAt: Date.now(),
    });
  },
});

// ============================================================================
// Internal Mutations (for webhooks)
// ============================================================================

/**
 * Update subscription from Stripe webhook
 */
export const updateSubscriptionFromStripe = internalMutation({
  args: {
    stripeCustomerId: v.string(),
    stripeSubscriptionId: v.string(),
    stripePriceId: v.string(),
    plan: v.union(v.literal("free"), v.literal("pro")),
    seats: v.number(),
    status: v.union(
      v.literal("active"),
      v.literal("canceled"),
      v.literal("past_due"),
      v.literal("trialing")
    ),
    currentPeriodStart: v.number(),
    currentPeriodEnd: v.number(),
    cancelAtPeriodEnd: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Find subscription by Stripe customer ID
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_stripe_customer", (q) =>
        q.eq("stripeCustomerId", args.stripeCustomerId)
      )
      .first();

    if (!subscription) {
      console.error(
        "Subscription not found for customer:",
        args.stripeCustomerId
      );
      return;
    }

    await ctx.db.patch(subscription._id, {
      stripeSubscriptionId: args.stripeSubscriptionId,
      stripePriceId: args.stripePriceId,
      plan: args.plan,
      seats: args.seats,
      status: args.status,
      currentPeriodStart: args.currentPeriodStart,
      currentPeriodEnd: args.currentPeriodEnd,
      cancelAtPeriodEnd: args.cancelAtPeriodEnd,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Mark subscription as cancelled (from webhook)
 */
export const cancelSubscriptionFromStripe = internalMutation({
  args: {
    stripeSubscriptionId: v.string(),
  },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_stripe_subscription", (q) =>
        q.eq("stripeSubscriptionId", args.stripeSubscriptionId)
      )
      .first();

    if (!subscription) {
      console.error(
        "Subscription not found for:",
        args.stripeSubscriptionId
      );
      return;
    }

    // Downgrade to free plan when subscription is cancelled
    await ctx.db.patch(subscription._id, {
      plan: "free",
      seats: 1,
      status: "canceled",
      stripeSubscriptionId: undefined,
      stripePriceId: undefined,
      currentPeriodStart: undefined,
      currentPeriodEnd: undefined,
      cancelAtPeriodEnd: false,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Create subscription for a team from webhook (in case team was created without one)
 */
export const createSubscriptionFromStripe = internalMutation({
  args: {
    teamId: v.id("teams"),
    stripeCustomerId: v.string(),
    stripeSubscriptionId: v.string(),
    stripePriceId: v.string(),
    plan: v.union(v.literal("free"), v.literal("pro")),
    seats: v.number(),
    status: v.union(
      v.literal("active"),
      v.literal("canceled"),
      v.literal("past_due"),
      v.literal("trialing")
    ),
    currentPeriodStart: v.number(),
    currentPeriodEnd: v.number(),
    cancelAtPeriodEnd: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Check if subscription already exists
    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .first();

    if (existing) {
      // Update existing subscription
      await ctx.db.patch(existing._id, {
        stripeCustomerId: args.stripeCustomerId,
        stripeSubscriptionId: args.stripeSubscriptionId,
        stripePriceId: args.stripePriceId,
        plan: args.plan,
        seats: args.seats,
        status: args.status,
        currentPeriodStart: args.currentPeriodStart,
        currentPeriodEnd: args.currentPeriodEnd,
        cancelAtPeriodEnd: args.cancelAtPeriodEnd,
        updatedAt: Date.now(),
      });
      return existing._id;
    }

    // Create new subscription
    const id = await ctx.db.insert("subscriptions", {
      teamId: args.teamId,
      stripeCustomerId: args.stripeCustomerId,
      stripeSubscriptionId: args.stripeSubscriptionId,
      stripePriceId: args.stripePriceId,
      plan: args.plan,
      seats: args.seats,
      status: args.status,
      currentPeriodStart: args.currentPeriodStart,
      currentPeriodEnd: args.currentPeriodEnd,
      cancelAtPeriodEnd: args.cancelAtPeriodEnd,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return id;
  },
});

/**
 * Update subscription status from invoice payment events
 */
export const updateSubscriptionStatus = internalMutation({
  args: {
    stripeSubscriptionId: v.string(),
    status: v.union(
      v.literal("active"),
      v.literal("canceled"),
      v.literal("past_due"),
      v.literal("trialing")
    ),
  },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_stripe_subscription", (q) =>
        q.eq("stripeSubscriptionId", args.stripeSubscriptionId)
      )
      .first();

    if (!subscription) {
      return;
    }

    await ctx.db.patch(subscription._id, {
      status: args.status,
      updatedAt: Date.now(),
    });
  },
});

// ============================================================================
// Internal Queries
// ============================================================================

/**
 * Check if a team can submit more feedback (for API routes)
 * Returns usage status and limit info
 */
export const checkUsageLimit = internalQuery({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .first();

    if (!subscription) {
      return {
        allowed: false,
        reason: "No subscription found",
        plan: "free" as const,
        currentCount: 0,
        limit: 25,
        percentUsed: 0,
      };
    }

    // Pro plan has unlimited feedback
    if (subscription.plan === "pro" && subscription.status === "active") {
      // Get current count for display purposes
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;

      const usage = await ctx.db
        .query("usageTracking")
        .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
        .filter((q) =>
          q.and(q.eq(q.field("year"), year), q.eq(q.field("month"), month))
        )
        .first();

      return {
        allowed: true,
        plan: "pro" as const,
        currentCount: usage?.feedbackCount ?? 0,
        limit: null, // Unlimited
        percentUsed: 0,
      };
    }

    // Free plan: check current month's feedback count
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const usage = await ctx.db
      .query("usageTracking")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .filter((q) =>
        q.and(q.eq(q.field("year"), year), q.eq(q.field("month"), month))
      )
      .first();

    const currentCount = usage?.feedbackCount ?? 0;
    const limit = 25; // Free tier limit
    const percentUsed = Math.round((currentCount / limit) * 100);

    if (currentCount >= limit) {
      return {
        allowed: false,
        reason: `Free plan is limited to ${limit} feedback submissions per month. Upgrade to Pro for unlimited feedback.`,
        plan: "free" as const,
        currentCount,
        limit,
        percentUsed: 100,
      };
    }

    return {
      allowed: true,
      plan: "free" as const,
      currentCount,
      limit,
      percentUsed,
      nearLimit: percentUsed >= 80,
    };
  },
});

/**
 * Check if a team can add more seats (for API routes)
 */
export const checkSeatLimit = internalQuery({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .first();

    if (!subscription) {
      return {
        allowed: false,
        reason: "No subscription found",
        plan: "free" as const,
        currentSeats: 0,
        maxSeats: 1,
      };
    }

    // Pro plan - check against purchased seats
    if (subscription.plan === "pro" && subscription.status === "active") {
      const members = await ctx.db
        .query("teamMembers")
        .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
        .collect();

      return {
        allowed: members.length < subscription.seats,
        plan: "pro" as const,
        currentSeats: members.length,
        maxSeats: subscription.seats,
        reason:
          members.length >= subscription.seats
            ? `You've used all ${subscription.seats} seats. Add more seats in billing settings.`
            : undefined,
      };
    }

    // Free plan: 1 seat only
    const members = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();

    return {
      allowed: members.length < 1,
      reason:
        members.length >= 1
          ? "Free plan is limited to 1 seat. Upgrade to Pro for unlimited seats."
          : undefined,
      plan: "free" as const,
      currentSeats: members.length,
      maxSeats: 1,
    };
  },
});

/**
 * Get subscription by Stripe customer ID (for webhook handling)
 */
export const getSubscriptionByStripeCustomer = internalQuery({
  args: { stripeCustomerId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("subscriptions")
      .withIndex("by_stripe_customer", (q) =>
        q.eq("stripeCustomerId", args.stripeCustomerId)
      )
      .first();
  },
});

/**
 * Get subscription by Stripe subscription ID (for webhook handling)
 */
export const getSubscriptionByStripeSubscription = internalQuery({
  args: { stripeSubscriptionId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("subscriptions")
      .withIndex("by_stripe_subscription", (q) =>
        q.eq("stripeSubscriptionId", args.stripeSubscriptionId)
      )
      .first();
  },
});

/**
 * Get team by ID (for webhook handling)
 */
export const getTeamById = internalQuery({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.teamId);
  },
});

// ============================================================================
// Helper functions
// ============================================================================

/**
 * Check if a team can add more seats based on subscription
 */
export async function canAddSeat(
  ctx: MutationCtx,
  teamId: Id<"teams">
): Promise<{ allowed: boolean; reason?: string }> {
  const subscription = await ctx.db
    .query("subscriptions")
    .withIndex("by_team", (q) => q.eq("teamId", teamId))
    .first();

  if (!subscription) {
    return { allowed: false, reason: "No subscription found" };
  }

  // Pro plan has unlimited seats
  if (subscription.plan === "pro") {
    return { allowed: true };
  }

  // Free plan: check current member count
  const members = await ctx.db
    .query("teamMembers")
    .withIndex("by_team", (q) => q.eq("teamId", teamId))
    .collect();

  if (members.length >= subscription.seats) {
    return {
      allowed: false,
      reason: `Free plan is limited to ${subscription.seats} seat(s). Upgrade to Pro for unlimited seats.`,
    };
  }

  return { allowed: true };
}

/**
 * Check if a team can submit more feedback this month
 */
export async function canSubmitFeedback(
  ctx: MutationCtx,
  teamId: Id<"teams">
): Promise<{ allowed: boolean; reason?: string; currentCount?: number; limit?: number }> {
  const subscription = await ctx.db
    .query("subscriptions")
    .withIndex("by_team", (q) => q.eq("teamId", teamId))
    .first();

  if (!subscription) {
    return { allowed: false, reason: "No subscription found" };
  }

  // Pro plan has unlimited feedback
  if (subscription.plan === "pro") {
    return { allowed: true };
  }

  // Free plan: check current month's feedback count
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const usage = await ctx.db
    .query("usageTracking")
    .withIndex("by_team", (q) => q.eq("teamId", teamId))
    .filter((q) =>
      q.and(q.eq(q.field("year"), year), q.eq(q.field("month"), month))
    )
    .first();

  const currentCount = usage?.feedbackCount ?? 0;
  const limit = 25; // Free tier limit

  if (currentCount >= limit) {
    return {
      allowed: false,
      reason: `Free plan is limited to ${limit} feedback submissions per month. Upgrade to Pro for unlimited feedback.`,
      currentCount,
      limit,
    };
  }

  return { allowed: true, currentCount, limit };
}
