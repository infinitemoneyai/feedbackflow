/**
 * Solutions service - handles solution suggestions generation
 */

import type { Id } from "../../_generated/dataModel";
import type { ActionCtx } from "../../_generated/server";
import type { AIProvider as AIProviderType } from "../types";
import { api, internal } from "../../_generated/api";
import { createAIProvider } from "../providers";
import { fetchScreenshotAsBase64 } from "../utils";

export interface GenerateSolutionsParams {
  feedbackId: Id<"feedback">;
  teamId: Id<"teams">;
  provider: AIProviderType;
  model: string;
  apiKey: string;
}

/**
 * Generate solution suggestions for feedback
 */
export async function generateSolutions(ctx: ActionCtx, params: GenerateSolutionsParams) {
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

  // Create AI provider and generate solutions
  const aiProvider = createAIProvider(params.provider, {
    apiKey: params.apiKey,
    model: params.model,
  });

  const solutionsResult = await aiProvider.generateSolutions({
    feedback: feedbackData,
    existingAnalysis: existingAnalysis
      ? {
          summary: existingAnalysis.summary,
          potentialCauses: existingAnalysis.potentialCauses,
          affectedComponent: existingAnalysis.affectedComponent,
        }
      : undefined,
    screenshotBase64: screenshotData?.base64,
    screenshotMediaType: screenshotData?.mediaType,
  });

  // Store the solution suggestions
  await ctx.runMutation(internal.ai.storeSolutionSuggestions, {
    feedbackId: params.feedbackId,
    suggestions: solutionsResult.suggestions,
    summary: solutionsResult.summary,
    nextSteps: solutionsResult.nextSteps,
    provider: params.provider,
    model: params.model,
  });

  return { success: true };
}

/**
 * Trigger solution generation for a feedback item
 */
export async function triggerSolutionGeneration(
  ctx: ActionCtx,
  feedbackId: Id<"feedback">,
  teamId: Id<"teams">
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

  // Schedule the solution generation action
  await ctx.scheduler.runAfter(0, internal.aiActions.generateSolutionsAction, {
    feedbackId,
    teamId,
    provider: aiConfig.preferredProvider,
    model: aiConfig.preferredModel,
    apiKey: apiKeyData.key,
  });

  return { success: true };
}
