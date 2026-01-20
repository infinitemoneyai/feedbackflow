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

/**
 * List feedback for a project with filters and sorting
 */
export const listFeedback = query({
  args: {
    projectId: v.id("projects"),
    type: v.optional(v.union(v.literal("bug"), v.literal("feature"))),
    status: v.optional(
      v.union(
        v.literal("new"),
        v.literal("triaging"),
        v.literal("drafted"),
        v.literal("exported"),
        v.literal("resolved")
      )
    ),
    priority: v.optional(
      v.union(
        v.literal("low"),
        v.literal("medium"),
        v.literal("high"),
        v.literal("critical")
      )
    ),
    sortBy: v.optional(
      v.union(v.literal("createdAt"), v.literal("priority"), v.literal("status"))
    ),
    sortOrder: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
    view: v.optional(
      v.union(v.literal("inbox"), v.literal("backlog"), v.literal("resolved"))
    ),
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

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      return [];
    }

    // Check if user is a member of the team
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("teamId"), project.teamId))
      .first();

    if (!membership) {
      return [];
    }

    // Get all feedback for the project
    let feedbackList = await ctx.db
      .query("feedback")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    // Apply view filter (inbox, backlog, resolved)
    if (args.view) {
      switch (args.view) {
        case "inbox":
          feedbackList = feedbackList.filter(
            (f) => f.status === "new" || f.status === "triaging"
          );
          break;
        case "backlog":
          feedbackList = feedbackList.filter((f) => f.status === "drafted");
          break;
        case "resolved":
          feedbackList = feedbackList.filter(
            (f) => f.status === "exported" || f.status === "resolved"
          );
          break;
      }
    }

    // Apply type filter
    if (args.type) {
      feedbackList = feedbackList.filter((f) => f.type === args.type);
    }

    // Apply status filter
    if (args.status) {
      feedbackList = feedbackList.filter((f) => f.status === args.status);
    }

    // Apply priority filter
    if (args.priority) {
      feedbackList = feedbackList.filter((f) => f.priority === args.priority);
    }

    // Sort the results
    const sortBy = args.sortBy || "createdAt";
    const sortOrder = args.sortOrder || "desc";

    const priorityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    const statusOrder: Record<string, number> = { new: 0, triaging: 1, drafted: 2, exported: 3, resolved: 4 };

    feedbackList.sort((a, b) => {
      let comparison = 0;

      if (sortBy === "createdAt") {
        comparison = a.createdAt - b.createdAt;
      } else if (sortBy === "priority") {
        comparison = (priorityOrder[a.priority] ?? 99) - (priorityOrder[b.priority] ?? 99);
      } else if (sortBy === "status") {
        comparison = (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99);
      }

      return sortOrder === "desc" ? -comparison : comparison;
    });

    return feedbackList;
  },
});

/**
 * Search feedback using full-text search
 */
export const searchFeedback = query({
  args: {
    projectId: v.id("projects"),
    searchQuery: v.string(),
    type: v.optional(v.union(v.literal("bug"), v.literal("feature"))),
    status: v.optional(
      v.union(
        v.literal("new"),
        v.literal("triaging"),
        v.literal("drafted"),
        v.literal("exported"),
        v.literal("resolved")
      )
    ),
    priority: v.optional(
      v.union(
        v.literal("low"),
        v.literal("medium"),
        v.literal("high"),
        v.literal("critical")
      )
    ),
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

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      return [];
    }

    // Check if user is a member of the team
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("teamId"), project.teamId))
      .first();

    if (!membership) {
      return [];
    }

    // Search feedback with text search
    let searchResults = await ctx.db
      .query("feedback")
      .withSearchIndex("search_content", (q) => {
        let search = q.search("title", args.searchQuery);
        search = search.eq("projectId", args.projectId);
        if (args.status) {
          search = search.eq("status", args.status);
        }
        if (args.type) {
          search = search.eq("type", args.type);
        }
        if (args.priority) {
          search = search.eq("priority", args.priority);
        }
        return search;
      })
      .collect();

    // Also search in descriptions (manual filter since search index is on title)
    // Get all feedback and filter by description if no results from title search
    if (searchResults.length === 0 && args.searchQuery.length > 0) {
      const allFeedback = await ctx.db
        .query("feedback")
        .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
        .collect();

      const searchLower = args.searchQuery.toLowerCase();
      searchResults = allFeedback.filter((f) => {
        const titleMatch = f.title.toLowerCase().includes(searchLower);
        const descMatch = f.description?.toLowerCase().includes(searchLower);
        return titleMatch || descMatch;
      });

      // Apply filters
      if (args.type) {
        searchResults = searchResults.filter((f) => f.type === args.type);
      }
      if (args.status) {
        searchResults = searchResults.filter((f) => f.status === args.status);
      }
      if (args.priority) {
        searchResults = searchResults.filter((f) => f.priority === args.priority);
      }
    }

    return searchResults;
  },
});

/**
 * Get a single feedback item by ID
 */
export const getFeedback = query({
  args: {
    feedbackId: v.id("feedback"),
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

    const feedback = await ctx.db.get(args.feedbackId);
    if (!feedback) {
      return null;
    }

    // Check if user is a member of the team
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("teamId"), feedback.teamId))
      .first();

    if (!membership) {
      return null;
    }

    // Get assignee info if assigned
    let assignee = null;
    if (feedback.assigneeId) {
      assignee = await ctx.db.get(feedback.assigneeId);
    }

    return {
      ...feedback,
      assignee: assignee
        ? {
            _id: assignee._id,
            name: assignee.name,
            email: assignee.email,
            avatar: assignee.avatar,
          }
        : null,
    };
  },
});

/**
 * Update feedback status, priority, tags, or assignment
 */
export const updateFeedback = mutation({
  args: {
    feedbackId: v.id("feedback"),
    status: v.optional(
      v.union(
        v.literal("new"),
        v.literal("triaging"),
        v.literal("drafted"),
        v.literal("exported"),
        v.literal("resolved")
      )
    ),
    priority: v.optional(
      v.union(
        v.literal("low"),
        v.literal("medium"),
        v.literal("high"),
        v.literal("critical")
      )
    ),
    tags: v.optional(v.array(v.string())),
    assigneeId: v.optional(v.id("users")),
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

    // Check if user is a member of the team
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("teamId"), feedback.teamId))
      .first();

    if (!membership) {
      throw new Error("You are not a member of this team");
    }

    // Build update object and track changes for activity log
    const updates: Record<string, unknown> = {
      updatedAt: Date.now(),
    };
    const activityLogs: Array<{
      action: string;
      details: { from?: string; to?: string; extra?: string };
    }> = [];

    if (args.status !== undefined && args.status !== feedback.status) {
      updates.status = args.status;
      activityLogs.push({
        action: "status_changed",
        details: { from: feedback.status, to: args.status },
      });
      // Set resolvedAt if status is resolved
      if (args.status === "resolved") {
        updates.resolvedAt = Date.now();
      }
    }

    if (args.priority !== undefined && args.priority !== feedback.priority) {
      updates.priority = args.priority;
      activityLogs.push({
        action: "priority_changed",
        details: { from: feedback.priority, to: args.priority },
      });
    }

    if (args.tags !== undefined) {
      updates.tags = args.tags;
      activityLogs.push({
        action: "tagged",
        details: { extra: args.tags.join(", ") },
      });
    }

    if (args.assigneeId !== undefined) {
      if (args.assigneeId && args.assigneeId !== feedback.assigneeId) {
        const assignee = await ctx.db.get(args.assigneeId);
        updates.assigneeId = args.assigneeId;
        activityLogs.push({
          action: "assigned",
          details: { to: assignee?.name || assignee?.email || "Unknown user" },
        });
      } else if (!args.assigneeId && feedback.assigneeId) {
        updates.assigneeId = undefined;
        activityLogs.push({
          action: "unassigned",
          details: {},
        });
      }
    }

    // Apply updates
    await ctx.db.patch(args.feedbackId, updates);

    // Create activity log entries
    for (const log of activityLogs) {
      await ctx.db.insert("activityLog", {
        feedbackId: args.feedbackId,
        userId: user._id,
        action: log.action as
          | "created"
          | "status_changed"
          | "priority_changed"
          | "assigned"
          | "unassigned"
          | "tagged"
          | "exported"
          | "commented"
          | "ai_analyzed"
          | "ticket_drafted",
        details: log.details,
        createdAt: Date.now(),
      });
    }

    return { success: true };
  },
});

/**
 * Get team members for assignment dropdown
 */
export const getTeamMembersForAssignment = query({
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

    // Get all team members
    const teamMembers = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();

    // Get user details for each member
    const membersWithDetails = await Promise.all(
      teamMembers.map(async (member) => {
        const memberUser = await ctx.db.get(member.userId);
        return memberUser
          ? {
              _id: memberUser._id,
              name: memberUser.name,
              email: memberUser.email,
              avatar: memberUser.avatar,
              role: member.role,
            }
          : null;
      })
    );

    return membersWithDetails.filter(Boolean);
  },
});
