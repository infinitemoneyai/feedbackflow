/**
 * Ticket draft service - handles ticket draft generation
 */

import type { Id } from "../../_generated/dataModel";
import type { ActionCtx } from "../../_generated/server";
import type { AIProvider as AIProviderType, TicketDraftResult } from "../types";
import { api, internal } from "../../_generated/api";
import { createAIProvider } from "../providers";
import { fetchScreenshotAsBase64 } from "../utils";

export interface GenerateTicketDraftParams {
  feedbackId: Id<"feedback">;
  teamId: Id<"teams">;
  userId: Id<"users">;
  provider: AIProviderType;
  model: string;
  apiKey: string;
  currentDraft?: Partial<TicketDraftResult>;
}

/**
 * Generate a ticket draft for feedback
 */
export async function generateTicketDraft(ctx: ActionCtx, params: GenerateTicketDraftParams) {
  // Fetch feedback data
  const feedback = await ctx.runQuery(api.feedback.getFeedback, {
    feedbackId: params.feedbackId,
  });

  if (!feedback) {
    throw new Error("Feedback not found");
  }

  // Get existing AI analysis if available
  const existingAnalysis = await ctx.runQuery(api.ai.getAnalysis, {
    feedbackId: params.feedbackId,
  });

  // Get existing solution suggestions if available
  const existingSuggestions = await ctx.runQuery(api.ai.getSolutionSuggestions, {
    feedbackId: params.feedbackId,
  });

  const feedbackData = {
    title: feedback.title,
    description: feedback.description,
    type: feedback.type,
    metadata: {
      browser: feedback.metadata.browser,
      os: feedback.metadata.os,
      url: feedback.metadata.url,
    },
  };

  // Fetch screenshot if available
  let screenshotData = null;
  if (feedback.screenshotUrl) {
    screenshotData = await fetchScreenshotAsBase64(feedback.screenshotUrl);
  }

  // Create AI provider and generate ticket draft
  const aiProvider = createAIProvider(params.provider, {
    apiKey: params.apiKey,
    model: params.model,
  });

  const draftResult = await aiProvider.generateTicketDraft({
    feedback: feedbackData,
    existingAnalysis: existingAnalysis
      ? {
          summary: existingAnalysis.summary,
          potentialCauses: existingAnalysis.potentialCauses,
          affectedComponent: existingAnalysis.affectedComponent,
          suggestedSolutions: existingAnalysis.suggestedSolutions,
        }
      : undefined,
    existingSuggestions: existingSuggestions
      ? {
          summary: existingSuggestions.summary,
          suggestions: existingSuggestions.suggestions?.map((s: { title: string; description: string }) => ({
            title: s.title,
            description: s.description,
          })),
          nextSteps: existingSuggestions.nextSteps,
        }
      : undefined,
    currentDraft: params.currentDraft,
    screenshotBase64: screenshotData?.base64,
    screenshotMediaType: screenshotData?.mediaType,
  });

  // Store the ticket draft
  await ctx.runMutation(internal.ai.storeTicketDraft, {
    feedbackId: params.feedbackId,
    userId: params.userId,
    title: draftResult.title,
    description: draftResult.description,
    acceptanceCriteria: draftResult.acceptanceCriteria,
    reproSteps: draftResult.reproSteps,
    expectedBehavior: draftResult.expectedBehavior,
    actualBehavior: draftResult.actualBehavior,
    provider: params.provider,
    model: params.model,
  });

  return { success: true, draft: draftResult };
}

/**
 * Trigger ticket draft generation (fire and forget)
 */
export async function triggerTicketDraftGeneration(
  ctx: ActionCtx,
  feedbackId: Id<"feedback">,
  teamId: Id<"teams">,
  userId: Id<"users">
) {
  // Get AI config for the team
  const aiConfig = await ctx.runQuery(api.ai.getTeamAiConfig, { teamId });

  if (!aiConfig?.isConfigured || !aiConfig.preferredProvider || !aiConfig.preferredModel) {
    return { success: false, error: "AI not configured" };
  }

  // Get the API key
  const apiKeyData = await ctx.runQuery(api.apiKeys.getDecryptedApiKey, {
    teamId,
    provider: aiConfig.preferredProvider,
  });

  if (!apiKeyData?.key) {
    return { success: false, error: "API key not found" };
  }

  // Schedule the ticket draft generation action
  await ctx.scheduler.runAfter(0, internal.aiActions.generateTicketDraftAction, {
    feedbackId,
    teamId,
    userId,
    provider: aiConfig.preferredProvider,
    model: aiConfig.preferredModel,
    apiKey: apiKeyData.key,
  });

  return { success: true };
}
