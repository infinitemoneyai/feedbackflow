/**
 * Database operations for AI conversations
 */

import { v } from "convex/values";
import { mutation, query, internalMutation } from "../../_generated/server";
import {
  verifyFeedbackAccess,
  incrementAiUsage,
  getAuthenticatedUser,
} from "./helpers";

/**
 * Get conversation history for a feedback item
 */
export const getConversationHistory = query({
  args: {
    feedbackId: v.id("feedback"),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
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

    // Get all conversation messages for this feedback, ordered by creation time
    const messages = await ctx.db
      .query("conversations")
      .withIndex("by_feedback_and_created", (q) => q.eq("feedbackId", args.feedbackId))
      .collect();

    return messages;
  },
});

/**
 * Add a user message to the conversation
 */
export const addUserMessage = mutation({
  args: {
    feedbackId: v.id("feedback"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const { user } = await verifyFeedbackAccess(ctx, args.feedbackId);

    const now = Date.now();

    // Insert the user message
    const messageId = await ctx.db.insert("conversations", {
      feedbackId: args.feedbackId,
      userId: user._id,
      role: "user",
      content: args.content,
      createdAt: now,
    });

    return { messageId, userId: user._id };
  },
});

/**
 * Store an assistant message (internal mutation for use in actions)
 */
export const storeAssistantMessage = internalMutation({
  args: {
    feedbackId: v.id("feedback"),
    userId: v.id("users"),
    content: v.string(),
    provider: v.union(v.literal("openai"), v.literal("anthropic")),
    model: v.string(),
  },
  handler: async (ctx, args) => {
    const feedback = await ctx.db.get(args.feedbackId);
    if (!feedback) {
      throw new Error("Feedback not found");
    }

    const now = Date.now();

    // Insert the assistant message
    const messageId = await ctx.db.insert("conversations", {
      feedbackId: args.feedbackId,
      userId: args.userId,
      role: "assistant",
      content: args.content,
      provider: args.provider,
      model: args.model,
      createdAt: now,
    });

    // Update usage tracking
    await incrementAiUsage(ctx, feedback.teamId);

    return { messageId };
  },
});

/**
 * Clear conversation history for a feedback item
 */
export const clearConversationHistory = mutation({
  args: {
    feedbackId: v.id("feedback"),
  },
  handler: async (ctx, args) => {
    await verifyFeedbackAccess(ctx, args.feedbackId);

    // Get all messages for this feedback
    const messages = await ctx.db
      .query("conversations")
      .withIndex("by_feedback", (q) => q.eq("feedbackId", args.feedbackId))
      .collect();

    // Delete all messages
    for (const message of messages) {
      await ctx.db.delete(message._id);
    }

    return { success: true, deletedCount: messages.length };
  },
});
