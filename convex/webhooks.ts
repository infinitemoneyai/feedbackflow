import { v } from "convex/values";
import { mutation, query, internalMutation, internalQuery } from "./_generated/server";

/**
 * Generate a random secret for HMAC signing
 */
function generateSecret(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let secret = "whsec_";
  for (let i = 0; i < 32; i++) {
    secret += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return secret;
}

/**
 * Create a new webhook
 */
export const createWebhook = mutation({
  args: {
    teamId: v.id("teams"),
    url: v.string(),
    events: v.array(
      v.union(
        v.literal("new_feedback"),
        v.literal("status_changed"),
        v.literal("exported")
      )
    ),
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
      throw new Error("Only admins can configure webhooks");
    }

    // Validate URL
    try {
      new URL(args.url);
    } catch {
      throw new Error("Invalid webhook URL");
    }

    // Require HTTPS
    if (!args.url.startsWith("https://")) {
      throw new Error("Webhook URL must use HTTPS");
    }

    // Generate secret
    const secret = generateSecret();
    const now = Date.now();

    const webhookId = await ctx.db.insert("webhooks", {
      teamId: args.teamId,
      url: args.url,
      secret,
      events: args.events,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    return { webhookId, secret };
  },
});

/**
 * Update a webhook
 */
export const updateWebhook = mutation({
  args: {
    webhookId: v.id("webhooks"),
    url: v.optional(v.string()),
    events: v.optional(
      v.array(
        v.union(
          v.literal("new_feedback"),
          v.literal("status_changed"),
          v.literal("exported")
        )
      )
    ),
    isActive: v.optional(v.boolean()),
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

    const webhook = await ctx.db.get(args.webhookId);
    if (!webhook) {
      throw new Error("Webhook not found");
    }

    // Check if user is an admin of the team
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("teamId"), webhook.teamId))
      .first();

    if (!membership || membership.role !== "admin") {
      throw new Error("Only admins can configure webhooks");
    }

    // Validate URL if provided
    if (args.url) {
      try {
        new URL(args.url);
      } catch {
        throw new Error("Invalid webhook URL");
      }
      if (!args.url.startsWith("https://")) {
        throw new Error("Webhook URL must use HTTPS");
      }
    }

    await ctx.db.patch(args.webhookId, {
      ...(args.url && { url: args.url }),
      ...(args.events && { events: args.events }),
      ...(args.isActive !== undefined && { isActive: args.isActive }),
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Delete a webhook
 */
export const deleteWebhook = mutation({
  args: {
    webhookId: v.id("webhooks"),
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

    const webhook = await ctx.db.get(args.webhookId);
    if (!webhook) {
      throw new Error("Webhook not found");
    }

    // Check if user is an admin of the team
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("teamId"), webhook.teamId))
      .first();

    if (!membership || membership.role !== "admin") {
      throw new Error("Only admins can configure webhooks");
    }

    // Delete webhook and its logs
    const logs = await ctx.db
      .query("webhookLogs")
      .withIndex("by_webhook", (q) => q.eq("webhookId", args.webhookId))
      .collect();

    for (const log of logs) {
      await ctx.db.delete(log._id);
    }

    await ctx.db.delete(args.webhookId);

    return { success: true };
  },
});

/**
 * Regenerate webhook secret
 */
export const regenerateSecret = mutation({
  args: {
    webhookId: v.id("webhooks"),
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

    const webhook = await ctx.db.get(args.webhookId);
    if (!webhook) {
      throw new Error("Webhook not found");
    }

    // Check if user is an admin of the team
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("teamId"), webhook.teamId))
      .first();

    if (!membership || membership.role !== "admin") {
      throw new Error("Only admins can configure webhooks");
    }

    const newSecret = generateSecret();

    await ctx.db.patch(args.webhookId, {
      secret: newSecret,
      updatedAt: Date.now(),
    });

    return { secret: newSecret };
  },
});

/**
 * Get webhooks for a team
 */
export const getWebhooks = query({
  args: {
    teamId: v.id("teams"),
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

    // Check if user is a member of the team
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("teamId"), args.teamId))
      .first();

    if (!membership) {
      return [];
    }

    const webhooks = await ctx.db
      .query("webhooks")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();

    // Return webhooks with masked secrets (only admins see full secret)
    return webhooks.map((webhook) => ({
      ...webhook,
      secret: membership.role === "admin" ? webhook.secret : "whsec_••••••••",
    }));
  },
});

/**
 * Get webhook logs
 */
export const getWebhookLogs = query({
  args: {
    webhookId: v.id("webhooks"),
    limit: v.optional(v.number()),
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

    const webhook = await ctx.db.get(args.webhookId);
    if (!webhook) {
      return [];
    }

    // Check if user is a member of the team
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("teamId"), webhook.teamId))
      .first();

    if (!membership) {
      return [];
    }

    const logs = await ctx.db
      .query("webhookLogs")
      .withIndex("by_webhook", (q) => q.eq("webhookId", args.webhookId))
      .order("desc")
      .take(args.limit || 50);

    return logs;
  },
});

/**
 * Internal mutation to create a webhook log entry
 */
export const createWebhookLog = internalMutation({
  args: {
    webhookId: v.id("webhooks"),
    feedbackId: v.optional(v.id("feedback")),
    event: v.string(),
    payload: v.any(),
    attempt: v.number(),
    status: v.union(v.literal("pending"), v.literal("success"), v.literal("failed")),
    responseStatus: v.optional(v.number()),
    responseBody: v.optional(v.string()),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("webhookLogs", {
      webhookId: args.webhookId,
      feedbackId: args.feedbackId,
      event: args.event,
      payload: args.payload,
      attempt: args.attempt,
      status: args.status,
      responseStatus: args.responseStatus,
      responseBody: args.responseBody,
      error: args.error,
      createdAt: Date.now(),
    });
  },
});

/**
 * Internal mutation to update a webhook log entry
 */
export const updateWebhookLog = internalMutation({
  args: {
    logId: v.id("webhookLogs"),
    status: v.union(v.literal("pending"), v.literal("success"), v.literal("failed")),
    responseStatus: v.optional(v.number()),
    responseBody: v.optional(v.string()),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.logId, {
      status: args.status,
      responseStatus: args.responseStatus,
      responseBody: args.responseBody,
      error: args.error,
    });
  },
});

/**
 * Internal query to get webhooks for an event
 */
export const getWebhooksForEvent = internalQuery({
  args: {
    teamId: v.id("teams"),
    event: v.string(),
  },
  handler: async (ctx, args) => {
    const webhooks = await ctx.db
      .query("webhooks")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();

    // Filter for active webhooks that subscribe to this event
    return webhooks.filter(
      (webhook) =>
        webhook.isActive &&
        webhook.events.includes(args.event as "new_feedback" | "status_changed" | "exported")
    );
  },
});

/**
 * Internal query to get a webhook by ID
 */
export const getWebhookById = internalQuery({
  args: {
    webhookId: v.id("webhooks"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.webhookId);
  },
});

/**
 * Trigger a webhook for automation rules (public mutation for API)
 * This creates a log entry and the actual send is done via scheduled action
 */
export const triggerWebhookForAutomation = mutation({
  args: {
    webhookId: v.id("webhooks"),
    feedbackId: v.id("feedback"),
    event: v.string(),
    payload: v.any(),
  },
  handler: async (ctx, args) => {
    // Get the webhook
    const webhook = await ctx.db.get(args.webhookId);
    if (!webhook) {
      throw new Error("Webhook not found");
    }

    if (!webhook.isActive) {
      throw new Error("Webhook is not active");
    }

    // Create log entry
    const logId = await ctx.db.insert("webhookLogs", {
      webhookId: args.webhookId,
      feedbackId: args.feedbackId,
      event: args.event,
      payload: args.payload,
      attempt: 1,
      status: "pending",
      createdAt: Date.now(),
    });

    // Note: The actual webhook send is triggered by the scheduler from webhookActions.ts
    // For automation, we'll rely on the API route to trigger it

    return { logId, scheduled: true };
  },
});
