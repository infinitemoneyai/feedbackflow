import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Get the next ticket number for a project
 */
async function getNextTicketNumber(
  ctx: { db: any },
  projectId: any
): Promise<number> {
  // Get all feedback for this project
  const allFeedback = await ctx.db
    .query("feedback")
    .withIndex("by_project", (q: any) => q.eq("projectId", projectId))
    .collect();

  // Find the max ticket number
  let maxTicketNumber = 0;
  for (const feedback of allFeedback) {
    if (feedback.ticketNumber && feedback.ticketNumber > maxTicketNumber) {
      maxTicketNumber = feedback.ticketNumber;
    }
  }

  return maxTicketNumber + 1;
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

    // Get the next ticket number for this project
    const ticketNumber = await getNextTicketNumber(ctx, widget.projectId);

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
      ticketNumber,
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

    // Generate feedback reference (e.g., FF-0001)
    const feedbackRef = `FF-${ticketNumber.toString().padStart(4, "0")}`;

    return {
      feedbackId,
      ticketNumber,
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
 * Update feedback status
 */
export const updateFeedbackStatus = mutation({
  args: {
    feedbackId: v.id("feedback"),
    status: v.union(
      v.literal("new"),
      v.literal("triaging"),
      v.literal("drafted"),
      v.literal("exported"),
      v.literal("resolved")
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
      throw new Error("Not a member of this team");
    }

    // Update the status
    await ctx.db.patch(args.feedbackId, {
      status: args.status,
      updatedAt: Date.now(),
    });

    // Create activity log entry
    await ctx.db.insert("activityLog", {
      feedbackId: args.feedbackId,
      userId: user._id,
      action: "status_changed",
      details: {
        from: feedback.status,
        to: args.status,
      },
      createdAt: Date.now(),
    });

    return { success: true };
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
 * Search feedback using full-text search across title, description, comments, and tags
 * Returns results ranked by relevance with match information for highlighting
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

    const searchLower = args.searchQuery.toLowerCase().trim();
    if (searchLower.length === 0) {
      return [];
    }

    // Search terms for multi-word queries
    const searchTerms = searchLower.split(/\s+/).filter((t) => t.length > 0);

    // Get all feedback for the project
    const allFeedback = await ctx.db
      .query("feedback")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    // Get all comments for feedback in this project
    const allComments = await Promise.all(
      allFeedback.map(async (f) => {
        const comments = await ctx.db
          .query("comments")
          .withIndex("by_feedback", (q) => q.eq("feedbackId", f._id))
          .collect();
        return { feedbackId: f._id, comments };
      })
    );

    // Create a map of feedbackId to comments
    const commentsMap = new Map(
      allComments.map((c) => [c.feedbackId.toString(), c.comments])
    );

    // Score each feedback item based on search matches
    type FeedbackWithScore = {
      feedback: (typeof allFeedback)[0];
      score: number;
      matchedFields: string[];
      matchedCommentIds: string[];
    };

    const scoredResults: FeedbackWithScore[] = [];

    for (const feedback of allFeedback) {
      // Apply filters first
      if (args.type && feedback.type !== args.type) continue;
      if (args.status && feedback.status !== args.status) continue;
      if (args.priority && feedback.priority !== args.priority) continue;

      let score = 0;
      const matchedFields: string[] = [];
      const matchedCommentIds: string[] = [];

      // Check title (highest weight: 10 points per term)
      const titleLower = feedback.title.toLowerCase();
      for (const term of searchTerms) {
        if (titleLower.includes(term)) {
          score += 10;
          if (!matchedFields.includes("title")) matchedFields.push("title");
        }
      }
      // Bonus for exact phrase match in title
      if (titleLower.includes(searchLower)) {
        score += 5;
      }

      // Check description (medium weight: 5 points per term)
      if (feedback.description) {
        const descLower = feedback.description.toLowerCase();
        for (const term of searchTerms) {
          if (descLower.includes(term)) {
            score += 5;
            if (!matchedFields.includes("description")) matchedFields.push("description");
          }
        }
        // Bonus for exact phrase match in description
        if (descLower.includes(searchLower)) {
          score += 3;
        }
      }

      // Check tags (medium weight: 4 points per term)
      if (feedback.tags && feedback.tags.length > 0) {
        for (const tag of feedback.tags) {
          const tagLower = tag.toLowerCase();
          for (const term of searchTerms) {
            if (tagLower.includes(term)) {
              score += 4;
              if (!matchedFields.includes("tags")) matchedFields.push("tags");
            }
          }
        }
      }

      // Check submitter info (lower weight: 3 points per term)
      if (feedback.submitterName) {
        const nameLower = feedback.submitterName.toLowerCase();
        for (const term of searchTerms) {
          if (nameLower.includes(term)) {
            score += 3;
            if (!matchedFields.includes("submitter")) matchedFields.push("submitter");
          }
        }
      }
      if (feedback.submitterEmail) {
        const emailLower = feedback.submitterEmail.toLowerCase();
        for (const term of searchTerms) {
          if (emailLower.includes(term)) {
            score += 3;
            if (!matchedFields.includes("submitter")) matchedFields.push("submitter");
          }
        }
      }

      // Check comments (lower weight: 2 points per term)
      const comments = commentsMap.get(feedback._id.toString()) || [];
      for (const comment of comments) {
        const contentLower = comment.content.toLowerCase();
        let commentMatched = false;
        for (const term of searchTerms) {
          if (contentLower.includes(term)) {
            score += 2;
            commentMatched = true;
          }
        }
        if (commentMatched) {
          matchedCommentIds.push(comment._id.toString());
          if (!matchedFields.includes("comments")) matchedFields.push("comments");
        }
      }

      // Only include if there's at least one match
      if (score > 0) {
        scoredResults.push({
          feedback,
          score,
          matchedFields,
          matchedCommentIds,
        });
      }
    }

    // Sort by score (descending)
    scoredResults.sort((a, b) => b.score - a.score);

    // Return feedback with match info for highlighting
    return scoredResults.map((r) => ({
      ...r.feedback,
      _searchMeta: {
        score: r.score,
        matchedFields: r.matchedFields,
        matchedCommentIds: r.matchedCommentIds,
      },
    }));
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

    // Track assignee for notification
    let newAssigneeId: typeof args.assigneeId | undefined;

    if (args.assigneeId !== undefined) {
      if (args.assigneeId && args.assigneeId !== feedback.assigneeId) {
        const assignee = await ctx.db.get(args.assigneeId);
        updates.assigneeId = args.assigneeId;
        newAssigneeId = args.assigneeId;
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

    // Create in-app notification for assignment
    if (newAssigneeId && newAssigneeId !== user._id) {
      // Don't notify yourself when you assign to yourself
      // Check assignee's notification preferences
      const assigneePrefs = await ctx.db
        .query("notificationPreferences")
        .withIndex("by_user", (q) => q.eq("userId", newAssigneeId))
        .first();

      const shouldNotify =
        !assigneePrefs ||
        assigneePrefs.inAppEnabled !== false ||
        (assigneePrefs.events && assigneePrefs.events.assignment !== false);

      if (shouldNotify) {
        await ctx.db.insert("notifications", {
          userId: newAssigneeId,
          type: "assignment",
          title: `You were assigned to: ${feedback.title}`,
          body: feedback.description
            ? feedback.description.substring(0, 200)
            : undefined,
          feedbackId: args.feedbackId,
          isRead: false,
          createdAt: Date.now(),
        });
      }
    }

    return { success: true };
  },
});

/**
 * Add a comment to feedback
 */
export const addComment = mutation({
  args: {
    feedbackId: v.id("feedback"),
    content: v.string(),
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

    // Create the comment
    const commentId = await ctx.db.insert("comments", {
      feedbackId: args.feedbackId,
      userId: user._id,
      content: args.content,
      createdAt: Date.now(),
    });

    // Create activity log entry
    await ctx.db.insert("activityLog", {
      feedbackId: args.feedbackId,
      userId: user._id,
      action: "commented",
      details: {
        extra: args.content.length > 100
          ? args.content.substring(0, 100) + "..."
          : args.content,
      },
      createdAt: Date.now(),
    });

    // Notify assignee of new comment (if they're not the commenter)
    if (feedback.assigneeId && feedback.assigneeId !== user._id) {
      const assigneePrefs = await ctx.db
        .query("notificationPreferences")
        .withIndex("by_user", (q) => q.eq("userId", feedback.assigneeId!))
        .first();

      const shouldNotify =
        !assigneePrefs ||
        assigneePrefs.inAppEnabled !== false ||
        (assigneePrefs.events && assigneePrefs.events.comments !== false);

      if (shouldNotify) {
        await ctx.db.insert("notifications", {
          userId: feedback.assigneeId,
          type: "comment",
          title: `${user.name || user.email} commented on: ${feedback.title}`,
          body: args.content.length > 200
            ? args.content.substring(0, 200) + "..."
            : args.content,
          feedbackId: args.feedbackId,
          isRead: false,
          createdAt: Date.now(),
        });
      }
    }

    return { commentId };
  },
});

/**
 * Get comments for a feedback item
 */
export const getComments = query({
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

    // Check if user is a member of the team
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("teamId"), feedback.teamId))
      .first();

    if (!membership) {
      return [];
    }

    // Get comments ordered by creation time
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_feedback_and_created", (q) => q.eq("feedbackId", args.feedbackId))
      .collect();

    // Get user details for each comment
    const commentsWithUsers = await Promise.all(
      comments.map(async (comment) => {
        const commentUser = await ctx.db.get(comment.userId);
        return {
          _id: comment._id,
          content: comment.content,
          createdAt: comment.createdAt,
          updatedAt: comment.updatedAt,
          user: commentUser
            ? {
                _id: commentUser._id,
                name: commentUser.name,
                email: commentUser.email,
                avatar: commentUser.avatar,
              }
            : null,
        };
      })
    );

    return commentsWithUsers;
  },
});

/**
 * Get activity log for a feedback item
 */
export const getActivityLog = query({
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

    // Check if user is a member of the team
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("teamId"), feedback.teamId))
      .first();

    if (!membership) {
      return [];
    }

    // Get activity log entries ordered by creation time
    const activityLog = await ctx.db
      .query("activityLog")
      .withIndex("by_feedback_and_created", (q) => q.eq("feedbackId", args.feedbackId))
      .collect();

    // Get user details for each activity entry
    const activityWithUsers = await Promise.all(
      activityLog.map(async (activity) => {
        let activityUser = null;
        if (activity.userId) {
          activityUser = await ctx.db.get(activity.userId);
        }
        return {
          _id: activity._id,
          action: activity.action,
          details: activity.details,
          createdAt: activity.createdAt,
          user: activityUser
            ? {
                _id: activityUser._id,
                name: activityUser.name,
                email: activityUser.email,
                avatar: activityUser.avatar,
              }
            : null,
        };
      })
    );

    return activityWithUsers;
  },
});

/**
 * Get combined comments and activity (interleaved by time)
 */
export const getCommentsAndActivity = query({
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

    // Check if user is a member of the team
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("teamId"), feedback.teamId))
      .first();

    if (!membership) {
      return [];
    }

    // Get comments
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_feedback_and_created", (q) => q.eq("feedbackId", args.feedbackId))
      .collect();

    // Get activity log (excluding "commented" actions since we have the actual comments)
    const activityLog = await ctx.db
      .query("activityLog")
      .withIndex("by_feedback_and_created", (q) => q.eq("feedbackId", args.feedbackId))
      .collect();

    // Filter out "commented" activity entries since we show actual comments
    const filteredActivity = activityLog.filter((a) => a.action !== "commented");

    // Get user details and combine
    const commentsWithUsers = await Promise.all(
      comments.map(async (comment) => {
        const commentUser = await ctx.db.get(comment.userId);
        return {
          _id: comment._id,
          type: "comment" as const,
          content: comment.content,
          createdAt: comment.createdAt,
          user: commentUser
            ? {
                _id: commentUser._id,
                name: commentUser.name,
                email: commentUser.email,
                avatar: commentUser.avatar,
              }
            : null,
        };
      })
    );

    const activityWithUsers = await Promise.all(
      filteredActivity.map(async (activity) => {
        let activityUser = null;
        if (activity.userId) {
          activityUser = await ctx.db.get(activity.userId);
        }
        return {
          _id: activity._id,
          type: "activity" as const,
          action: activity.action,
          details: activity.details,
          createdAt: activity.createdAt,
          user: activityUser
            ? {
                _id: activityUser._id,
                name: activityUser.name,
                email: activityUser.email,
                avatar: activityUser.avatar,
              }
            : null,
        };
      })
    );

    // Combine and sort by creation time
    const combined = [...commentsWithUsers, ...activityWithUsers].sort(
      (a, b) => a.createdAt - b.createdAt
    );

    return combined;
  },
});

/**
 * Get feedback for internal use (no auth required - for background jobs)
 */
export const getFeedbackInternal = query({
  args: {
    feedbackId: v.id("feedback"),
  },
  handler: async (ctx, args) => {
    const feedback = await ctx.db.get(args.feedbackId);
    return feedback;
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

/**
 * Add feedback to JSON export queue
 */
export const addToJsonExportQueue = mutation({
  args: {
    feedbackId: v.id("feedback"),
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

    // Check if already in queue
    const existingExport = await ctx.db
      .query("exports")
      .withIndex("by_feedback", (q) => q.eq("feedbackId", args.feedbackId))
      .filter((q) => q.eq(q.field("provider"), "json"))
      .first();

    if (existingExport) {
      throw new Error("Already in JSON export queue");
    }

    // Add to export queue
    await ctx.db.insert("exports", {
      feedbackId: args.feedbackId,
      userId: user._id,
      provider: "json",
      status: "success",
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Get JSON export queue for a team
 */
export const getJsonExportQueue = query({
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

    // Check membership
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("teamId"), args.teamId))
      .first();

    if (!membership) {
      return null;
    }

    // Get all JSON exports for this team
    const jsonExports = await ctx.db
      .query("exports")
      .filter((q) => q.eq(q.field("provider"), "json"))
      .collect();

    // Filter for this team's feedback and get feedback details
    const queueItems = await Promise.all(
      jsonExports.map(async (exp) => {
        const feedback = await ctx.db.get(exp.feedbackId);
        if (feedback && feedback.teamId === args.teamId) {
          return {
            exportId: exp._id,
            feedbackId: exp.feedbackId,
            feedback: feedback,
            createdAt: exp.createdAt,
          };
        }
        return null;
      })
    );

    return queueItems.filter(Boolean);
  },
});

/**
 * Clear JSON export queue for a team
 */
export const clearJsonExportQueue = mutation({
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

    // Check membership
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("teamId"), args.teamId))
      .first();

    if (!membership) {
      throw new Error("You are not a member of this team");
    }

    // Get all JSON exports for this team
    const jsonExports = await ctx.db
      .query("exports")
      .filter((q) => q.eq(q.field("provider"), "json"))
      .collect();

    // Delete exports for this team's feedback
    for (const exp of jsonExports) {
      const feedback = await ctx.db.get(exp.feedbackId);
      if (feedback && feedback.teamId === args.teamId) {
        await ctx.db.delete(exp._id);
      }
    }

    return { success: true };
  },
});

/**
 * Delete a feedback item
 */
export const deleteFeedback = mutation({
  args: {
    feedbackId: v.id("feedback"),
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

    // Get the feedback
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

    // Delete related data
    // 1. Delete AI analysis
    const analysis = await ctx.db
      .query("aiAnalysis")
      .withIndex("by_feedback", (q) => q.eq("feedbackId", args.feedbackId))
      .first();
    if (analysis) {
      await ctx.db.delete(analysis._id);
    }

    // 2. Delete solution suggestions
    const suggestions = await ctx.db
      .query("solutionSuggestions")
      .withIndex("by_feedback", (q) => q.eq("feedbackId", args.feedbackId))
      .first();
    if (suggestions) {
      await ctx.db.delete(suggestions._id);
    }

    // 3. Delete ticket drafts
    const drafts = await ctx.db
      .query("ticketDrafts")
      .withIndex("by_feedback", (q) => q.eq("feedbackId", args.feedbackId))
      .collect();
    for (const draft of drafts) {
      await ctx.db.delete(draft._id);
    }

    // 4. Delete conversation messages
    const messages = await ctx.db
      .query("conversations")
      .withIndex("by_feedback", (q) => q.eq("feedbackId", args.feedbackId))
      .collect();
    for (const message of messages) {
      await ctx.db.delete(message._id);
    }

    // 5. Delete comments
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_feedback", (q) => q.eq("feedbackId", args.feedbackId))
      .collect();
    for (const comment of comments) {
      await ctx.db.delete(comment._id);
    }

    // 6. Delete exports
    const exports = await ctx.db
      .query("exports")
      .withIndex("by_feedback", (q) => q.eq("feedbackId", args.feedbackId))
      .collect();
    for (const exp of exports) {
      await ctx.db.delete(exp._id);
    }

    // Finally, delete the feedback itself
    await ctx.db.delete(args.feedbackId);

    return { success: true };
  },
});
