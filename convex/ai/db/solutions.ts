/**
 * Database operations for solution suggestions
 */

import { v } from "convex/values";
import { query, internalMutation } from "../../_generated/server";
import {
  incrementAiUsage,
  logFeedbackActivity,
  getAuthenticatedUser,
} from "./helpers";

/**
 * Store solution suggestions (internal mutation)
 */
export const storeSolutionSuggestions = internalMutation({
  args: {
    feedbackId: v.id("feedback"),
    suggestions: v.array(
      v.object({
        title: v.string(),
        description: v.string(),
        type: v.union(
          v.literal("investigation"),
          v.literal("fix"),
          v.literal("workaround"),
          v.literal("implementation"),
          v.literal("consideration")
        ),
        effort: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
        impact: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
      })
    ),
    summary: v.string(),
    nextSteps: v.array(v.string()),
    provider: v.union(v.literal("openai"), v.literal("anthropic")),
    model: v.string(),
  },
  handler: async (ctx, args) => {
    const feedback = await ctx.db.get(args.feedbackId);
    if (!feedback) {
      throw new Error("Feedback not found");
    }

    const now = Date.now();

    // Check if there's an existing solution for this feedback
    const existingSolution = await ctx.db
      .query("solutionSuggestions")
      .withIndex("by_feedback", (q) => q.eq("feedbackId", args.feedbackId))
      .first();

    if (existingSolution) {
      // Update existing
      await ctx.db.patch(existingSolution._id, {
        suggestions: args.suggestions,
        summary: args.summary,
        nextSteps: args.nextSteps,
        provider: args.provider,
        model: args.model,
        createdAt: now,
      });
    } else {
      // Create new
      await ctx.db.insert("solutionSuggestions", {
        feedbackId: args.feedbackId,
        suggestions: args.suggestions,
        summary: args.summary,
        nextSteps: args.nextSteps,
        provider: args.provider,
        model: args.model,
        createdAt: now,
      });
    }

    // Log activity
    await logFeedbackActivity(ctx, {
      feedbackId: args.feedbackId,
      action: "ai_analyzed",
      details: {
        extra: `Generated solution suggestions using ${args.provider} (${args.model})`,
      },
    });

    // Update usage tracking
    await incrementAiUsage(ctx, feedback.teamId);

    return { success: true };
  },
});

/**
 * Get solution suggestions for a feedback item
 */
export const getSolutionSuggestions = query({
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

    // Get the solution suggestions
    const solutions = await ctx.db
      .query("solutionSuggestions")
      .withIndex("by_feedback", (q) => q.eq("feedbackId", args.feedbackId))
      .first();

    return solutions;
  },
});
