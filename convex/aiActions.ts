/**
 * AI Actions - Convex actions for AI operations
 * 
 * This file provides the public and internal action interfaces for AI operations.
 * The actual implementation is delegated to specialized service modules.
 */

import { v } from "convex/values";
import { action, internalAction } from "./_generated/server";
import { api } from "./_generated/api";
import * as analysisService from "./ai/services/analysis";
import * as solutionsService from "./ai/services/solutions";
import * as ticketDraftService from "./ai/services/ticketDraft";
import * as conversationService from "./ai/services/conversation";

// =============================================================================
// Analysis Actions
// =============================================================================

/**
 * Internal action to analyze feedback
 */
export const analyzeFeedbackAction = internalAction({
  args: {
    feedbackId: v.id("feedback"),
    teamId: v.id("teams"),
    provider: v.union(v.literal("openai"), v.literal("anthropic")),
    model: v.string(),
    apiKey: v.string(),
  },
  handler: async (ctx, args) => {
    return await analysisService.analyzeFeedback(ctx, args);
  },
});

/**
 * Public action to trigger analysis
 */
export const triggerAnalysis = action({
  args: {
    feedbackId: v.id("feedback"),
    teamId: v.id("teams"),
  },
  handler: async (ctx, args) => {
    return await analysisService.triggerAnalysis(ctx, args.feedbackId, args.teamId);
  },
});

// =============================================================================
// Solution Suggestions Actions
// =============================================================================

/**
 * Internal action to generate solution suggestions
 */
export const generateSolutionsAction = internalAction({
  args: {
    feedbackId: v.id("feedback"),
    teamId: v.id("teams"),
    provider: v.union(v.literal("openai"), v.literal("anthropic")),
    model: v.string(),
    apiKey: v.string(),
  },
  handler: async (ctx, args) => {
    return await solutionsService.generateSolutions(ctx, args);
  },
});

/**
 * Public action to trigger solution generation
 */
export const triggerSolutionGeneration = action({
  args: {
    feedbackId: v.id("feedback"),
    teamId: v.id("teams"),
  },
  handler: async (ctx, args) => {
    return await solutionsService.triggerSolutionGeneration(ctx, args.feedbackId, args.teamId);
  },
});

// =============================================================================
// Ticket Draft Actions
// =============================================================================

/**
 * Internal action to generate ticket draft
 */
export const generateTicketDraftAction = internalAction({
  args: {
    feedbackId: v.id("feedback"),
    teamId: v.id("teams"),
    userId: v.id("users"),
    provider: v.union(v.literal("openai"), v.literal("anthropic")),
    model: v.string(),
    apiKey: v.string(),
  },
  handler: async (ctx, args) => {
    return await ticketDraftService.generateTicketDraft(ctx, args);
  },
});

/**
 * Public action to trigger ticket draft generation (fire and forget)
 */
export const triggerTicketDraftGeneration = action({
  args: {
    feedbackId: v.id("feedback"),
    teamId: v.id("teams"),
  },
  handler: async (ctx, args): Promise<{ success: boolean; error?: string }> => {
    // Get current user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { success: false, error: "Unauthenticated" };
    }

    const user = await ctx.runQuery(api.users.getCurrentUser);
    if (!user) {
      return { success: false, error: "User not found" };
    }

    return await ticketDraftService.triggerTicketDraftGeneration(
      ctx,
      args.feedbackId,
      args.teamId,
      user._id
    );
  },
});

/**
 * Public action to generate ticket draft and return it immediately
 */
export const generateTicketDraft = action({
  args: {
    feedbackId: v.id("feedback"),
    teamId: v.id("teams"),
    currentDraft: v.optional(
      v.object({
        title: v.string(),
        description: v.string(),
        acceptanceCriteria: v.array(v.string()),
        reproSteps: v.optional(v.array(v.string())),
        expectedBehavior: v.optional(v.string()),
        actualBehavior: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args): Promise<{ success: boolean; error?: string; draft?: unknown }> => {
    // Get current user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { success: false, error: "Unauthenticated" };
    }

    const user = await ctx.runQuery(api.users.getCurrentUser);
    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Get AI config for the team
    const aiConfig = await ctx.runQuery(api.ai.getTeamAiConfig, {
      teamId: args.teamId,
    });

    if (!aiConfig?.isConfigured || !aiConfig.preferredProvider || !aiConfig.preferredModel) {
      return { success: false, error: "AI not configured" };
    }

    // Get the API key
    const apiKeyData = await ctx.runQuery(api.apiKeys.getDecryptedApiKey, {
      teamId: args.teamId,
      provider: aiConfig.preferredProvider,
    });

    if (!apiKeyData?.key) {
      return { success: false, error: "API key not found" };
    }

    // Generate the ticket draft
    return await ticketDraftService.generateTicketDraft(ctx, {
      feedbackId: args.feedbackId,
      teamId: args.teamId,
      userId: user._id,
      provider: aiConfig.preferredProvider,
      model: aiConfig.preferredModel,
      apiKey: apiKeyData.key,
      currentDraft: args.currentDraft,
    });
  },
});

// =============================================================================
// Conversation Actions
// =============================================================================

/**
 * Internal action to process a conversation message
 */
export const processConversationMessage = internalAction({
  args: {
    feedbackId: v.id("feedback"),
    teamId: v.id("teams"),
    userId: v.id("users"),
    userMessage: v.string(),
    provider: v.union(v.literal("openai"), v.literal("anthropic")),
    model: v.string(),
    apiKey: v.string(),
  },
  handler: async (ctx, args) => {
    return await conversationService.processConversationMessage(ctx, args);
  },
});

/**
 * Public action to send a conversation message
 */
export const sendConversationMessage = action({
  args: {
    feedbackId: v.id("feedback"),
    teamId: v.id("teams"),
    userMessage: v.string(),
    model: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ success: boolean; error?: string }> => {
    // Get current user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { success: false, error: "Unauthenticated" };
    }

    const user = await ctx.runQuery(api.users.getCurrentUser);
    if (!user) {
      return { success: false, error: "User not found" };
    }

    return await conversationService.sendConversationMessage(
      ctx,
      args.feedbackId,
      args.teamId,
      user._id,
      args.userMessage,
      args.model
    );
  },
});
