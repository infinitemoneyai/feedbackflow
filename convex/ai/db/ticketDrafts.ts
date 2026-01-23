/**
 * Database operations for ticket drafts
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
 * Store a ticket draft (internal mutation)
 */
export const storeTicketDraft = internalMutation({
  args: {
    feedbackId: v.id("feedback"),
    userId: v.id("users"),
    title: v.string(),
    description: v.string(),
    acceptanceCriteria: v.array(v.string()),
    reproSteps: v.optional(v.array(v.string())),
    expectedBehavior: v.optional(v.string()),
    actualBehavior: v.optional(v.string()),
    provider: v.union(v.literal("openai"), v.literal("anthropic")),
    model: v.string(),
  },
  handler: async (ctx, args) => {
    const feedback = await ctx.db.get(args.feedbackId);
    if (!feedback) {
      throw new Error("Feedback not found");
    }

    const now = Date.now();

    // Check if there's an existing draft for this feedback
    const existingDraft = await ctx.db
      .query("ticketDrafts")
      .withIndex("by_feedback", (q) => q.eq("feedbackId", args.feedbackId))
      .first();

    if (existingDraft) {
      // Update existing draft
      await ctx.db.patch(existingDraft._id, {
        title: args.title,
        description: args.description,
        acceptanceCriteria: args.acceptanceCriteria,
        reproSteps: args.reproSteps,
        expectedBehavior: args.expectedBehavior,
        actualBehavior: args.actualBehavior,
        provider: args.provider,
        model: args.model,
        updatedAt: now,
      });
    } else {
      // Create new draft
      await ctx.db.insert("ticketDrafts", {
        feedbackId: args.feedbackId,
        userId: args.userId,
        title: args.title,
        description: args.description,
        acceptanceCriteria: args.acceptanceCriteria,
        reproSteps: args.reproSteps,
        expectedBehavior: args.expectedBehavior,
        actualBehavior: args.actualBehavior,
        provider: args.provider,
        model: args.model,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Update feedback status to drafted
    await ctx.db.patch(args.feedbackId, {
      status: "drafted",
      updatedAt: now,
    });

    // Log activity
    await logFeedbackActivity(ctx, {
      feedbackId: args.feedbackId,
      userId: args.userId,
      action: "ticket_drafted",
      details: {
        extra: `Drafted using ${args.provider} (${args.model})`,
      },
    });

    // Update usage tracking
    await incrementAiUsage(ctx, feedback.teamId);

    return { success: true };
  },
});

/**
 * Get ticket draft for a feedback item
 */
export const getTicketDraft = query({
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

    // Get the ticket draft
    const draft = await ctx.db
      .query("ticketDrafts")
      .withIndex("by_feedback", (q) => q.eq("feedbackId", args.feedbackId))
      .first();

    return draft;
  },
});

/**
 * Save (upsert) a ticket draft from client-side edits.
 *
 * Note: This is intentionally separate from the AI draft flow so it does NOT
 * increment AI usage tracking and does not require an AI provider/model.
 */
export const saveTicketDraft = mutation({
  args: {
    feedbackId: v.id("feedback"),
    title: v.string(),
    description: v.string(),
    acceptanceCriteria: v.array(v.string()),
    reproSteps: v.optional(v.array(v.string())),
    expectedBehavior: v.optional(v.string()),
    actualBehavior: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { user } = await verifyFeedbackAccess(ctx, args.feedbackId);

    const now = Date.now();

    // Upsert draft for this feedback (one draft per feedback, latest wins)
    const existingDraft = await ctx.db
      .query("ticketDrafts")
      .withIndex("by_feedback", (q) => q.eq("feedbackId", args.feedbackId))
      .first();

    if (existingDraft) {
      await ctx.db.patch(existingDraft._id, {
        title: args.title,
        description: args.description,
        acceptanceCriteria: args.acceptanceCriteria,
        reproSteps: args.reproSteps,
        expectedBehavior: args.expectedBehavior,
        actualBehavior: args.actualBehavior,
        // Keep provider/model from original (AI) draft if present
        updatedAt: now,
      });

      return { success: true, draftId: existingDraft._id };
    }

    const draftId = await ctx.db.insert("ticketDrafts", {
      feedbackId: args.feedbackId,
      userId: user._id,
      title: args.title,
      description: args.description,
      acceptanceCriteria: args.acceptanceCriteria,
      reproSteps: args.reproSteps,
      expectedBehavior: args.expectedBehavior,
      actualBehavior: args.actualBehavior,
      provider: "openai",
      model: "manual",
      createdAt: now,
      updatedAt: now,
    });

    return { success: true, draftId };
  },
});

/**
 * Update ticket draft (user edits)
 */
export const updateTicketDraft = mutation({
  args: {
    draftId: v.id("ticketDrafts"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    acceptanceCriteria: v.optional(v.array(v.string())),
    reproSteps: v.optional(v.array(v.string())),
    expectedBehavior: v.optional(v.string()),
    actualBehavior: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user) {
      throw new Error("Unauthenticated");
    }

    const draft = await ctx.db.get(args.draftId);
    if (!draft) {
      throw new Error("Draft not found");
    }

    const feedback = await ctx.db.get(draft.feedbackId);
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

    const updates: Record<string, unknown> = {
      updatedAt: Date.now(),
    };

    if (args.title !== undefined) updates.title = args.title;
    if (args.description !== undefined) updates.description = args.description;
    if (args.acceptanceCriteria !== undefined) updates.acceptanceCriteria = args.acceptanceCriteria;
    if (args.reproSteps !== undefined) updates.reproSteps = args.reproSteps;
    if (args.expectedBehavior !== undefined) updates.expectedBehavior = args.expectedBehavior;
    if (args.actualBehavior !== undefined) updates.actualBehavior = args.actualBehavior;

    await ctx.db.patch(args.draftId, updates);

    return { success: true };
  },
});

/**
 * Delete ticket draft
 */
export const deleteTicketDraft = mutation({
  args: {
    draftId: v.id("ticketDrafts"),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user) {
      throw new Error("Unauthenticated");
    }

    const draft = await ctx.db.get(args.draftId);
    if (!draft) {
      throw new Error("Draft not found");
    }

    const feedback = await ctx.db.get(draft.feedbackId);
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

    await ctx.db.delete(args.draftId);

    // Update feedback status back to triaging
    await ctx.db.patch(draft.feedbackId, {
      status: "triaging",
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});
