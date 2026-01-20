import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Notification types matching schema
export type NotificationType =
  | "new_feedback"
  | "assignment"
  | "comment"
  | "mention"
  | "export_complete"
  | "export_failed";

/**
 * Generate a random token for unsubscribe links
 */
function generateUnsubscribeToken(): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * Get notification preferences for the current user
 */
export const getNotificationPreferences = query({
  args: {},
  handler: async (ctx) => {
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

    return await ctx.db
      .query("notificationPreferences")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();
  },
});

/**
 * Get notification preferences by user ID (for internal use)
 */
export const getPreferencesByUserId = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("notificationPreferences")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
  },
});

/**
 * Create or update notification preferences
 */
export const upsertNotificationPreferences = mutation({
  args: {
    emailEnabled: v.boolean(),
    emailFrequency: v.union(
      v.literal("instant"),
      v.literal("daily"),
      v.literal("weekly")
    ),
    inAppEnabled: v.boolean(),
    events: v.object({
      newFeedback: v.boolean(),
      assignment: v.boolean(),
      comments: v.boolean(),
      mentions: v.boolean(),
      exports: v.boolean(),
    }),
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

    const existing = await ctx.db
      .query("notificationPreferences")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        emailEnabled: args.emailEnabled,
        emailFrequency: args.emailFrequency,
        inAppEnabled: args.inAppEnabled,
        events: args.events,
        updatedAt: now,
      });
      return existing._id;
    }

    const id = await ctx.db.insert("notificationPreferences", {
      userId: user._id,
      emailEnabled: args.emailEnabled,
      emailFrequency: args.emailFrequency,
      inAppEnabled: args.inAppEnabled,
      events: args.events,
      unsubscribeToken: generateUnsubscribeToken(),
      createdAt: now,
      updatedAt: now,
    });

    return id;
  },
});

/**
 * Disable all email notifications via unsubscribe token
 * This is used by the unsubscribe link in emails
 */
export const unsubscribeByToken = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const prefs = await ctx.db
      .query("notificationPreferences")
      .withIndex("by_unsubscribe_token", (q) =>
        q.eq("unsubscribeToken", args.token)
      )
      .first();

    if (!prefs) {
      throw new Error("Invalid unsubscribe token");
    }

    await ctx.db.patch(prefs._id, {
      emailEnabled: false,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Create a notification record
 * This is called internally when events occur
 */
export const createNotification = internalMutation({
  args: {
    userId: v.id("users"),
    type: v.union(
      v.literal("new_feedback"),
      v.literal("assignment"),
      v.literal("comment"),
      v.literal("mention"),
      v.literal("export_complete"),
      v.literal("export_failed")
    ),
    title: v.string(),
    body: v.optional(v.string()),
    feedbackId: v.optional(v.id("feedback")),
  },
  handler: async (ctx, args) => {
    // Get user preferences
    const prefs = await ctx.db
      .query("notificationPreferences")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    // Check if user has this notification type enabled for in-app
    const eventMap: Record<NotificationType, keyof typeof prefs.events> = {
      new_feedback: "newFeedback",
      assignment: "assignment",
      comment: "comments",
      mention: "mentions",
      export_complete: "exports",
      export_failed: "exports",
    };

    // Default to enabled if no preferences set
    const shouldNotify =
      !prefs ||
      prefs.inAppEnabled === true ||
      (prefs.events && prefs.events[eventMap[args.type]] !== false);

    if (!shouldNotify) {
      return null;
    }

    // Create in-app notification
    const id = await ctx.db.insert("notifications", {
      userId: args.userId,
      type: args.type,
      title: args.title,
      body: args.body,
      feedbackId: args.feedbackId,
      isRead: false,
      createdAt: Date.now(),
    });

    return id;
  },
});

/**
 * Queue a notification for email digest
 * Called when email frequency is daily/weekly
 */
export const queueForDigest = internalMutation({
  args: {
    userId: v.id("users"),
    notificationType: v.union(
      v.literal("new_feedback"),
      v.literal("assignment"),
      v.literal("comment"),
      v.literal("mention"),
      v.literal("export_complete"),
      v.literal("export_failed")
    ),
    feedbackId: v.optional(v.id("feedback")),
    title: v.string(),
    body: v.optional(v.string()),
    projectName: v.optional(v.string()),
    metadata: v.optional(
      v.object({
        feedbackTitle: v.optional(v.string()),
        actorName: v.optional(v.string()),
        commentPreview: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("emailDigestQueue", {
      userId: args.userId,
      notificationType: args.notificationType,
      feedbackId: args.feedbackId,
      title: args.title,
      body: args.body,
      projectName: args.projectName,
      metadata: args.metadata,
      createdAt: Date.now(),
      sentAt: undefined,
    });
    return id;
  },
});

/**
 * Get pending digest items for a user
 */
export const getPendingDigestItems = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query("emailDigestQueue")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Filter for items not yet sent
    return items.filter((item) => item.sentAt === undefined);
  },
});

/**
 * Mark digest items as sent
 */
export const markDigestItemsSent = internalMutation({
  args: {
    itemIds: v.array(v.id("emailDigestQueue")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    for (const id of args.itemIds) {
      await ctx.db.patch(id, { sentAt: now });
    }
  },
});

/**
 * Get users who need daily/weekly digests
 */
export const getUsersForDigest = query({
  args: {
    frequency: v.union(v.literal("daily"), v.literal("weekly")),
  },
  handler: async (ctx, args) => {
    // Get all preferences with the specified frequency that have email enabled
    const allPrefs = await ctx.db.query("notificationPreferences").collect();

    const matchingPrefs = allPrefs.filter(
      (p) => p.emailEnabled && p.emailFrequency === args.frequency
    );

    // Get user details for each
    const results = [];
    for (const pref of matchingPrefs) {
      const user = await ctx.db.get(pref.userId);
      if (user) {
        // Check if they have pending items
        const allItems = await ctx.db
          .query("emailDigestQueue")
          .withIndex("by_user", (q) => q.eq("userId", pref.userId))
          .collect();

        // Filter for items not yet sent
        const pendingItems = allItems.filter((item) => item.sentAt === undefined);

        if (pendingItems.length > 0) {
          results.push({
            user,
            preferences: pref,
            pendingCount: pendingItems.length,
          });
        }
      }
    }

    return results;
  },
});

/**
 * Initialize default notification preferences for a new user
 */
export const initializePreferences = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Check if preferences already exist
    const existing = await ctx.db
      .query("notificationPreferences")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (existing) {
      return existing._id;
    }

    const now = Date.now();
    const id = await ctx.db.insert("notificationPreferences", {
      userId: args.userId,
      emailEnabled: true,
      emailFrequency: "instant",
      inAppEnabled: true,
      events: {
        newFeedback: true,
        assignment: true,
        comments: true,
        mentions: true,
        exports: true,
      },
      unsubscribeToken: generateUnsubscribeToken(),
      createdAt: now,
      updatedAt: now,
    });

    return id;
  },
});

/**
 * Get user by unsubscribe token (for verification on unsubscribe page)
 */
export const getUserByUnsubscribeToken = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const prefs = await ctx.db
      .query("notificationPreferences")
      .withIndex("by_unsubscribe_token", (q) =>
        q.eq("unsubscribeToken", args.token)
      )
      .first();

    if (!prefs) {
      return null;
    }

    const user = await ctx.db.get(prefs.userId);
    return user
      ? { email: user.email, emailEnabled: prefs.emailEnabled }
      : null;
  },
});
