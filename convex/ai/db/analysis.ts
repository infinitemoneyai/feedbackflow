/**
 * Database operations for AI analysis
 */

import { v } from "convex/values";
import { mutation, query, internalMutation } from "../../_generated/server";
import {
  verifyFeedbackAccess,
  incrementAiUsage,
  logFeedbackActivity,
  getAuthenticatedUser,
} from "./helpers";

/**
 * Store AI analysis results for a feedback item
 */
export const storeAnalysis = mutation({
  args: {
    feedbackId: v.id("feedback"),
    analysis: v.object({
      suggestedType: v.union(v.literal("bug"), v.literal("feature")),
      typeConfidence: v.number(),
      suggestedPriority: v.union(
        v.literal("low"),
        v.literal("medium"),
        v.literal("high"),
        v.literal("critical")
      ),
      priorityConfidence: v.number(),
      suggestedTags: v.array(v.string()),
      summary: v.optional(v.string()),
      affectedComponent: v.optional(v.string()),
      potentialCauses: v.array(v.string()),
      suggestedSolutions: v.array(v.string()),
    }),
    provider: v.union(v.literal("openai"), v.literal("anthropic")),
    model: v.string(),
  },
  handler: async (ctx, args) => {
    const { user, feedback } = await verifyFeedbackAccess(ctx, args.feedbackId);

    // Check if there's an existing analysis for this feedback
    const existingAnalysis = await ctx.db
      .query("aiAnalysis")
      .withIndex("by_feedback", (q) => q.eq("feedbackId", args.feedbackId))
      .first();

    const now = Date.now();

    if (existingAnalysis) {
      // Update existing analysis
      await ctx.db.patch(existingAnalysis._id, {
        suggestedType: args.analysis.suggestedType,
        typeConfidence: args.analysis.typeConfidence,
        suggestedPriority: args.analysis.suggestedPriority,
        priorityConfidence: args.analysis.priorityConfidence,
        suggestedTags: args.analysis.suggestedTags,
        summary: args.analysis.summary,
        affectedComponent: args.analysis.affectedComponent,
        potentialCauses: args.analysis.potentialCauses,
        suggestedSolutions: args.analysis.suggestedSolutions,
        provider: args.provider,
        model: args.model,
        createdAt: now,
      });
    } else {
      // Create new analysis
      await ctx.db.insert("aiAnalysis", {
        feedbackId: args.feedbackId,
        suggestedType: args.analysis.suggestedType,
        typeConfidence: args.analysis.typeConfidence,
        suggestedPriority: args.analysis.suggestedPriority,
        priorityConfidence: args.analysis.priorityConfidence,
        suggestedTags: args.analysis.suggestedTags,
        summary: args.analysis.summary,
        affectedComponent: args.analysis.affectedComponent,
        potentialCauses: args.analysis.potentialCauses,
        suggestedSolutions: args.analysis.suggestedSolutions,
        provider: args.provider,
        model: args.model,
        createdAt: now,
      });
    }

    // Log the activity
    await logFeedbackActivity(ctx, {
      feedbackId: args.feedbackId,
      userId: user._id,
      action: "ai_analyzed",
      details: {
        extra: `Analyzed using ${args.provider} (${args.model})`,
      },
    });

    // Update usage tracking
    await incrementAiUsage(ctx, feedback.teamId);

    return { success: true };
  },
});

/**
 * Internal mutation for storing analysis (used by scheduled jobs)
 */
export const storeAnalysisInternal = internalMutation({
  args: {
    feedbackId: v.id("feedback"),
    analysis: v.object({
      suggestedType: v.union(v.literal("bug"), v.literal("feature")),
      typeConfidence: v.number(),
      suggestedPriority: v.union(
        v.literal("low"),
        v.literal("medium"),
        v.literal("high"),
        v.literal("critical")
      ),
      priorityConfidence: v.number(),
      suggestedTags: v.array(v.string()),
      summary: v.optional(v.string()),
      affectedComponent: v.optional(v.string()),
      potentialCauses: v.array(v.string()),
      suggestedSolutions: v.array(v.string()),
    }),
    provider: v.union(v.literal("openai"), v.literal("anthropic")),
    model: v.string(),
  },
  handler: async (ctx, args) => {
    const feedback = await ctx.db.get(args.feedbackId);
    if (!feedback) {
      throw new Error("Feedback not found");
    }

    const now = Date.now();

    // Check if there's an existing analysis
    const existingAnalysis = await ctx.db
      .query("aiAnalysis")
      .withIndex("by_feedback", (q) => q.eq("feedbackId", args.feedbackId))
      .first();

    if (existingAnalysis) {
      await ctx.db.patch(existingAnalysis._id, {
        suggestedType: args.analysis.suggestedType,
        typeConfidence: args.analysis.typeConfidence,
        suggestedPriority: args.analysis.suggestedPriority,
        priorityConfidence: args.analysis.priorityConfidence,
        suggestedTags: args.analysis.suggestedTags,
        summary: args.analysis.summary,
        affectedComponent: args.analysis.affectedComponent,
        potentialCauses: args.analysis.potentialCauses,
        suggestedSolutions: args.analysis.suggestedSolutions,
        provider: args.provider,
        model: args.model,
        createdAt: now,
      });
    } else {
      await ctx.db.insert("aiAnalysis", {
        feedbackId: args.feedbackId,
        suggestedType: args.analysis.suggestedType,
        typeConfidence: args.analysis.typeConfidence,
        suggestedPriority: args.analysis.suggestedPriority,
        priorityConfidence: args.analysis.priorityConfidence,
        suggestedTags: args.analysis.suggestedTags,
        summary: args.analysis.summary,
        affectedComponent: args.analysis.affectedComponent,
        potentialCauses: args.analysis.potentialCauses,
        suggestedSolutions: args.analysis.suggestedSolutions,
        provider: args.provider,
        model: args.model,
        createdAt: now,
      });
    }

    // Log activity (system action - no user)
    await logFeedbackActivity(ctx, {
      feedbackId: args.feedbackId,
      action: "ai_analyzed",
      details: {
        extra: `Auto-analyzed using ${args.provider} (${args.model})`,
      },
    });

    // Update usage tracking
    await incrementAiUsage(ctx, feedback.teamId);

    return { success: true };
  },
});

/**
 * Get AI analysis for a feedback item
 */
export const getAnalysis = query({
  args: {
    feedbackId: v.id("feedback"),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
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

    // Get the analysis
    const analysis = await ctx.db
      .query("aiAnalysis")
      .withIndex("by_feedback", (q) => q.eq("feedbackId", args.feedbackId))
      .first();

    return analysis;
  },
});

/**
 * Apply AI suggestions to feedback (accept suggestions)
 */
export const applyAnalysisSuggestions = mutation({
  args: {
    feedbackId: v.id("feedback"),
    applyType: v.optional(v.boolean()),
    applyPriority: v.optional(v.boolean()),
    applyTags: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { user, feedback } = await verifyFeedbackAccess(ctx, args.feedbackId);

    // Get the AI analysis
    const analysis = await ctx.db
      .query("aiAnalysis")
      .withIndex("by_feedback", (q) => q.eq("feedbackId", args.feedbackId))
      .first();

    if (!analysis) {
      throw new Error("No AI analysis found for this feedback");
    }

    const updates: Record<string, unknown> = {
      updatedAt: Date.now(),
    };
    const activityLogs: Array<{
      action: string;
      details: { from?: string; to?: string; extra?: string };
    }> = [];

    // Apply type if requested and different
    if (args.applyType && analysis.suggestedType && analysis.suggestedType !== feedback.type) {
      updates.type = analysis.suggestedType;
      activityLogs.push({
        action: "status_changed",
        details: {
          from: feedback.type,
          to: analysis.suggestedType,
          extra: "Applied AI suggestion",
        },
      });
    }

    // Apply priority if requested and different
    if (
      args.applyPriority &&
      analysis.suggestedPriority &&
      analysis.suggestedPriority !== feedback.priority
    ) {
      updates.priority = analysis.suggestedPriority;
      activityLogs.push({
        action: "priority_changed",
        details: {
          from: feedback.priority,
          to: analysis.suggestedPriority,
          extra: "Applied AI suggestion",
        },
      });
    }

    // Apply tags if requested
    if (args.applyTags && analysis.suggestedTags && analysis.suggestedTags.length > 0) {
      // Merge with existing tags (remove duplicates)
      const existingTags = new Set(feedback.tags);
      const newTags = analysis.suggestedTags.filter((t: string) => !existingTags.has(t));

      if (newTags.length > 0) {
        updates.tags = [...feedback.tags, ...newTags];
        activityLogs.push({
          action: "tagged",
          details: {
            extra: `Added AI-suggested tags: ${newTags.join(", ")}`,
          },
        });
      }
    }

    // Apply updates if any
    if (Object.keys(updates).length > 1) {
      // More than just updatedAt
      await ctx.db.patch(args.feedbackId, updates);

      // Create activity log entries
      for (const log of activityLogs) {
        await logFeedbackActivity(ctx, {
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
        });
      }
    }

    return { success: true };
  },
});
