import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Generate a short feedback reference ID
 */
function generateFeedbackRef(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // No I, O, 0, 1 for clarity
  let ref = "FF-";
  for (let i = 0; i < 6; i++) {
    ref += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return ref;
}

/**
 * Submit feedback from widget (public, no auth required)
 * Called by the API route after validation and rate limiting
 */
export const submitFromWidget = mutation({
  args: {
    widgetKey: v.string(),
    type: v.union(v.literal("bug"), v.literal("feature")),
    title: v.string(),
    description: v.optional(v.string()),
    submitterEmail: v.optional(v.string()),
    submitterName: v.optional(v.string()),
    screenshotStorageId: v.optional(v.id("_storage")),
    recordingUrl: v.optional(v.string()),
    recordingDuration: v.optional(v.number()),
    metadata: v.object({
      browser: v.optional(v.string()),
      os: v.optional(v.string()),
      url: v.optional(v.string()),
      screenWidth: v.optional(v.number()),
      screenHeight: v.optional(v.number()),
      userAgent: v.optional(v.string()),
      timestamp: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    // Find the widget by key
    const widget = await ctx.db
      .query("widgets")
      .withIndex("by_widget_key", (q) => q.eq("widgetKey", args.widgetKey))
      .first();

    if (!widget) {
      throw new Error("Invalid widget key");
    }

    if (!widget.isActive) {
      throw new Error("Widget is not active");
    }

    // Get the project to find the team
    const project = await ctx.db.get(widget.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Generate a unique reference ID
    const feedbackRef = generateFeedbackRef();

    // Get screenshot URL if storage ID is provided
    let screenshotUrl: string | undefined;
    if (args.screenshotStorageId) {
      const url = await ctx.storage.getUrl(args.screenshotStorageId);
      if (url) {
        screenshotUrl = url;
      }
    }

    // Create the feedback record
    const feedbackId = await ctx.db.insert("feedback", {
      widgetId: widget._id,
      projectId: widget.projectId,
      teamId: project.teamId,
      type: args.type,
      title: args.title,
      description: args.description,
      screenshotUrl: screenshotUrl ?? undefined,
      screenshotStorageId: args.screenshotStorageId,
      recordingUrl: args.recordingUrl,
      recordingDuration: args.recordingDuration,
      status: "new",
      priority: project.settings?.defaultPriority ?? "medium",
      tags: [],
      submitterEmail: args.submitterEmail,
      submitterName: args.submitterName,
      metadata: args.metadata,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create activity log entry
    await ctx.db.insert("activityLog", {
      feedbackId,
      action: "created",
      details: {
        extra: `Submitted via widget`,
      },
      createdAt: Date.now(),
    });

    // Update usage tracking for the team
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const existingUsage = await ctx.db
      .query("usageTracking")
      .withIndex("by_team", (q) => q.eq("teamId", project.teamId))
      .filter((q) =>
        q.and(q.eq(q.field("year"), year), q.eq(q.field("month"), month))
      )
      .first();

    if (existingUsage) {
      await ctx.db.patch(existingUsage._id, {
        feedbackCount: existingUsage.feedbackCount + 1,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("usageTracking", {
        teamId: project.teamId,
        year,
        month,
        feedbackCount: 1,
        aiCallCount: 0,
        storageUsedBytes: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    return {
      feedbackId,
      feedbackRef,
    };
  },
});

/**
 * Get widget by key (public query for validation)
 */
export const getWidgetByKey = query({
  args: { widgetKey: v.string() },
  handler: async (ctx, args) => {
    const widget = await ctx.db
      .query("widgets")
      .withIndex("by_widget_key", (q) => q.eq("widgetKey", args.widgetKey))
      .first();

    if (!widget) {
      return null;
    }

    return {
      widgetId: widget._id,
      projectId: widget.projectId,
      isActive: widget.isActive,
      siteUrl: widget.siteUrl,
    };
  },
});

/**
 * Generate upload URL for screenshots (Convex file storage)
 */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Get daily submission count for a widget (for rate limiting)
 */
export const getWidgetDailyCount = query({
  args: { widgetKey: v.string() },
  handler: async (ctx, args) => {
    const widget = await ctx.db
      .query("widgets")
      .withIndex("by_widget_key", (q) => q.eq("widgetKey", args.widgetKey))
      .first();

    if (!widget) {
      return { count: 0, widgetId: null };
    }

    // Count feedback submitted today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfDay = today.getTime();

    const feedbackToday = await ctx.db
      .query("feedback")
      .withIndex("by_widget", (q) => q.eq("widgetId", widget._id))
      .filter((q) => q.gte(q.field("createdAt"), startOfDay))
      .collect();

    return {
      count: feedbackToday.length,
      widgetId: widget._id,
    };
  },
});
