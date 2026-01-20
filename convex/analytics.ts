import { v } from "convex/values";
import { query } from "./_generated/server";

/**
 * Get analytics data for a project
 * Includes volume trends, type/status breakdowns, time metrics, and top tags
 */
export const getAnalytics = query({
  args: {
    projectId: v.id("projects"),
    startDate: v.optional(v.number()), // Unix timestamp in ms
    endDate: v.optional(v.number()), // Unix timestamp in ms
    granularity: v.optional(
      v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly"))
    ),
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

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      return null;
    }

    // Check if user is a member of the team
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("teamId"), project.teamId))
      .first();

    if (!membership) {
      return null;
    }

    // Set default date range (last 30 days)
    const now = Date.now();
    const startDate = args.startDate ?? now - 30 * 24 * 60 * 60 * 1000;
    const endDate = args.endDate ?? now;
    const granularity = args.granularity ?? "daily";

    // Get all feedback for the project within date range
    const allFeedback = await ctx.db
      .query("feedback")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .filter((q) =>
        q.and(
          q.gte(q.field("createdAt"), startDate),
          q.lte(q.field("createdAt"), endDate)
        )
      )
      .collect();

    // Calculate volume by time period
    const volumeData = calculateVolumeByPeriod(allFeedback, startDate, endDate, granularity);

    // Calculate type breakdown
    const typeBreakdown = {
      bugs: allFeedback.filter((f) => f.type === "bug").length,
      features: allFeedback.filter((f) => f.type === "feature").length,
    };

    // Calculate status breakdown
    const statusBreakdown = {
      new: allFeedback.filter((f) => f.status === "new").length,
      triaging: allFeedback.filter((f) => f.status === "triaging").length,
      drafted: allFeedback.filter((f) => f.status === "drafted").length,
      exported: allFeedback.filter((f) => f.status === "exported").length,
      resolved: allFeedback.filter((f) => f.status === "resolved").length,
    };

    // Calculate priority breakdown
    const priorityBreakdown = {
      critical: allFeedback.filter((f) => f.priority === "critical").length,
      high: allFeedback.filter((f) => f.priority === "high").length,
      medium: allFeedback.filter((f) => f.priority === "medium").length,
      low: allFeedback.filter((f) => f.priority === "low").length,
    };

    // Calculate top tags
    const tagCounts: Record<string, number> = {};
    for (const feedback of allFeedback) {
      for (const tag of feedback.tags || []) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      }
    }
    const topTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));

    // Calculate time to resolution (for resolved feedback)
    const resolvedFeedback = allFeedback.filter(
      (f) => f.status === "resolved" && f.resolvedAt
    );
    let avgTimeToResolution = 0;
    if (resolvedFeedback.length > 0) {
      const totalResolutionTime = resolvedFeedback.reduce((sum, f) => {
        return sum + (f.resolvedAt! - f.createdAt);
      }, 0);
      avgTimeToResolution = totalResolutionTime / resolvedFeedback.length;
    }

    // Calculate time to first response (first comment or status change from "new")
    const feedbackIds = allFeedback.map((f) => f._id);
    let avgTimeToFirstResponse = 0;

    if (feedbackIds.length > 0) {
      // Get first activity (excluding "created") for each feedback
      const firstResponseTimes: number[] = [];

      for (const feedback of allFeedback) {
        // Get first activity after creation that's not the "created" event
        const firstActivity = await ctx.db
          .query("activityLog")
          .withIndex("by_feedback_and_created", (q) =>
            q.eq("feedbackId", feedback._id)
          )
          .filter((q) => q.neq(q.field("action"), "created"))
          .first();

        // Also check for first comment
        const firstComment = await ctx.db
          .query("comments")
          .withIndex("by_feedback_and_created", (q) =>
            q.eq("feedbackId", feedback._id)
          )
          .first();

        // Find the earliest response
        const responseTimes: number[] = [];
        if (firstActivity) {
          responseTimes.push(firstActivity.createdAt);
        }
        if (firstComment) {
          responseTimes.push(firstComment.createdAt);
        }

        if (responseTimes.length > 0) {
          const firstResponseTime = Math.min(...responseTimes);
          firstResponseTimes.push(firstResponseTime - feedback.createdAt);
        }
      }

      if (firstResponseTimes.length > 0) {
        avgTimeToFirstResponse =
          firstResponseTimes.reduce((a, b) => a + b, 0) / firstResponseTimes.length;
      }
    }

    return {
      summary: {
        totalFeedback: allFeedback.length,
        totalBugs: typeBreakdown.bugs,
        totalFeatures: typeBreakdown.features,
        avgTimeToResolution, // in milliseconds
        avgTimeToFirstResponse, // in milliseconds
      },
      volumeData,
      typeBreakdown,
      statusBreakdown,
      priorityBreakdown,
      topTags,
      dateRange: {
        startDate,
        endDate,
        granularity,
      },
    };
  },
});

/**
 * Calculate volume data grouped by time period
 */
function calculateVolumeByPeriod(
  feedback: Array<{ createdAt: number; type: string }>,
  startDate: number,
  endDate: number,
  granularity: "daily" | "weekly" | "monthly"
): Array<{ date: string; total: number; bugs: number; features: number }> {
  const data: Map<string, { total: number; bugs: number; features: number }> =
    new Map();

  // Initialize all periods in range
  const currentDate = new Date(startDate);
  while (currentDate.getTime() <= endDate) {
    const key = getDateKey(currentDate.getTime(), granularity);
    data.set(key, { total: 0, bugs: 0, features: 0 });

    if (granularity === "daily") {
      currentDate.setDate(currentDate.getDate() + 1);
    } else if (granularity === "weekly") {
      currentDate.setDate(currentDate.getDate() + 7);
    } else {
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
  }

  // Count feedback for each period
  for (const item of feedback) {
    const key = getDateKey(item.createdAt, granularity);
    const existing = data.get(key);
    if (existing) {
      existing.total += 1;
      if (item.type === "bug") {
        existing.bugs += 1;
      } else {
        existing.features += 1;
      }
    }
  }

  // Convert to sorted array
  return Array.from(data.entries())
    .map(([date, counts]) => ({
      date,
      ...counts,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Get a date key for grouping based on granularity
 */
function getDateKey(
  timestamp: number,
  granularity: "daily" | "weekly" | "monthly"
): string {
  const date = new Date(timestamp);

  if (granularity === "daily") {
    return date.toISOString().split("T")[0]; // YYYY-MM-DD
  } else if (granularity === "weekly") {
    // Get the start of the week (Sunday)
    const dayOfWeek = date.getDay();
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - dayOfWeek);
    return `Week of ${startOfWeek.toISOString().split("T")[0]}`;
  } else {
    // Monthly
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  }
}

/**
 * Export analytics data as CSV-compatible format
 */
export const exportAnalytics = query({
  args: {
    projectId: v.id("projects"),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
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

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      return null;
    }

    // Check if user is a member of the team
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("teamId"), project.teamId))
      .first();

    if (!membership) {
      return null;
    }

    // Set default date range
    const now = Date.now();
    const startDate = args.startDate ?? now - 30 * 24 * 60 * 60 * 1000;
    const endDate = args.endDate ?? now;

    // Get all feedback for the project within date range
    const allFeedback = await ctx.db
      .query("feedback")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .filter((q) =>
        q.and(
          q.gte(q.field("createdAt"), startDate),
          q.lte(q.field("createdAt"), endDate)
        )
      )
      .collect();

    // Format for CSV export
    const csvData = allFeedback.map((f) => ({
      id: f._id,
      title: f.title,
      type: f.type,
      status: f.status,
      priority: f.priority,
      tags: (f.tags || []).join("; "),
      submitterEmail: f.submitterEmail || "",
      submitterName: f.submitterName || "",
      browser: f.metadata?.browser || "",
      os: f.metadata?.os || "",
      url: f.metadata?.url || "",
      createdAt: new Date(f.createdAt).toISOString(),
      resolvedAt: f.resolvedAt ? new Date(f.resolvedAt).toISOString() : "",
      timeToResolution: f.resolvedAt
        ? Math.round((f.resolvedAt - f.createdAt) / (1000 * 60 * 60))
        : "", // hours
    }));

    return {
      projectName: project.name,
      dateRange: {
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
      },
      totalRecords: csvData.length,
      data: csvData,
    };
  },
});
