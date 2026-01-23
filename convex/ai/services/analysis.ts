/**
 * Analysis service - handles feedback analysis operations
 */

import type { Id } from "../../_generated/dataModel";
import type { ActionCtx } from "../../_generated/server";
import type { AIProvider as AIProviderType } from "../types";
import { api, internal } from "../../_generated/api";
import { createAIProvider } from "../providers";
import { fetchScreenshotAsBase64 } from "../utils";

export interface AnalyzeFeedbackParams {
  feedbackId: Id<"feedback">;
  teamId: Id<"teams">;
  provider: AIProviderType;
  model: string;
  apiKey: string;
}

/**
 * Analyze feedback using AI
 */
export async function analyzeFeedback(ctx: ActionCtx, params: AnalyzeFeedbackParams) {
  // Fetch feedback data
  const feedback = await ctx.runQuery(api.feedback.getFeedback, {
    feedbackId: params.feedbackId,
  });

  if (!feedback) {
    throw new Error("Feedback not found");
  }

  // Build feedback data
  const feedbackData = {
    title: feedback.title,
    description: feedback.description,
    type: feedback.type,
    metadata: {
      browser: feedback.metadata.browser,
      os: feedback.metadata.os,
      url: feedback.metadata.url,
      screenWidth: feedback.metadata.screenWidth,
      screenHeight: feedback.metadata.screenHeight,
    },
  };

  // Fetch screenshot if available
  let screenshotData = null;
  if (feedback.screenshotUrl) {
    screenshotData = await fetchScreenshotAsBase64(feedback.screenshotUrl);
  }

  // Create AI provider and analyze
  const aiProvider = createAIProvider(params.provider, {
    apiKey: params.apiKey,
    model: params.model,
  });

  const analysisResult = await aiProvider.analyzeFeedback({
    feedback: feedbackData,
    screenshotBase64: screenshotData?.base64,
    screenshotMediaType: screenshotData?.mediaType,
  });

  // Store the analysis result
  await ctx.runMutation(internal.ai.storeAnalysisInternal, {
    feedbackId: params.feedbackId,
    analysis: {
      suggestedType: analysisResult.suggestedType,
      typeConfidence: analysisResult.typeConfidence,
      suggestedPriority: analysisResult.suggestedPriority,
      priorityConfidence: analysisResult.priorityConfidence,
      suggestedTags: analysisResult.suggestedTags,
      summary: analysisResult.summary,
      affectedComponent: analysisResult.affectedComponent,
      potentialCauses: analysisResult.potentialCauses,
      suggestedSolutions: analysisResult.suggestedSolutions,
    },
    provider: params.provider,
    model: params.model,
  });

  return { success: true };
}

/**
 * Trigger analysis for a feedback item
 */
export async function triggerAnalysis(
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

  // Schedule the analysis action
  await ctx.scheduler.runAfter(0, internal.aiActions.analyzeFeedbackAction, {
    feedbackId,
    teamId,
    provider: aiConfig.preferredProvider,
    model: aiConfig.preferredModel,
    apiKey: apiKeyData.key,
  });

  return { success: true };
}
