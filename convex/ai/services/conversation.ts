/**
 * Conversation service - handles AI conversation operations
 */

import type { Id } from "../../_generated/dataModel";
import type { ActionCtx } from "../../_generated/server";
import type { AIProvider as AIProviderType, ConversationMessage } from "../types";
import { api, internal } from "../../_generated/api";
import { createAIProvider } from "../providers";
import { fetchScreenshotAsBase64 } from "../utils";
import { buildFeedbackContextForConversation } from "../prompts";

export interface ProcessConversationParams {
  feedbackId: Id<"feedback">;
  teamId: Id<"teams">;
  userId: Id<"users">;
  userMessage: string;
  provider: AIProviderType;
  model: string;
  apiKey: string;
}

/**
 * Process a conversation message
 */
export async function processConversationMessage(ctx: ActionCtx, params: ProcessConversationParams) {
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

  // Get conversation history
  const conversationHistory = await ctx.runQuery(api.ai.getConversationHistory, {
    feedbackId: params.feedbackId,
  });

  // Filter to just user and assistant messages
  const historyMessages: ConversationMessage[] = conversationHistory.map(
    (msg: { role: string; content: string }) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    })
  );

  // Build feedback context
  const feedbackContext = buildFeedbackContextForConversation({
    title: feedback.title,
    description: feedback.description,
    type: feedback.type,
    priority: feedback.priority,
    tags: feedback.tags,
    metadata: {
      browser: feedback.metadata.browser,
      os: feedback.metadata.os,
      url: feedback.metadata.url,
    },
    existingAnalysis: existingAnalysis
      ? {
          summary: existingAnalysis.summary,
          potentialCauses: existingAnalysis.potentialCauses,
          affectedComponent: existingAnalysis.affectedComponent,
          suggestedSolutions: existingAnalysis.suggestedSolutions,
        }
      : undefined,
  });

  // Fetch screenshot if available
  let screenshotData = null;
  if (feedback.screenshotUrl) {
    screenshotData = await fetchScreenshotAsBase64(feedback.screenshotUrl);
  }

  // Create AI provider and process conversation
  const aiProvider = createAIProvider(params.provider, {
    apiKey: params.apiKey,
    model: params.model,
  });

  const assistantResponse = await aiProvider.processConversation({
    feedbackContext,
    conversationHistory: historyMessages,
    userMessage: params.userMessage,
    screenshotBase64: screenshotData?.base64,
    screenshotMediaType: screenshotData?.mediaType,
  });

  // Store the assistant's response
  await ctx.runMutation(internal.ai.storeAssistantMessage, {
    feedbackId: params.feedbackId,
    userId: params.userId,
    content: assistantResponse,
    provider: params.provider,
    model: params.model,
  });

  return { success: true, response: assistantResponse };
}

/**
 * Send a conversation message
 */
export async function sendConversationMessage(
  ctx: ActionCtx,
  feedbackId: Id<"feedback">,
  teamId: Id<"teams">,
  userId: Id<"users">,
  userMessage: string,
  model?: string
): Promise<{ success: boolean; error?: string }> {
  // Get AI config for the team
  const aiConfig = await ctx.runQuery(api.ai.getTeamAiConfig, { teamId });

  if (!aiConfig?.isConfigured || !aiConfig.preferredProvider || !aiConfig.preferredModel) {
    return { success: false, error: "AI not configured" };
  }

  // Use provided model or fall back to preferred model
  const modelToUse = model || aiConfig.preferredModel;

  // Determine which provider to use based on the model
  let providerToUse: AIProviderType;
  if (modelToUse.startsWith("gpt-")) {
    providerToUse = "openai";
  } else if (modelToUse.startsWith("claude-")) {
    providerToUse = "anthropic";
  } else {
    providerToUse = aiConfig.preferredProvider;
  }

  // Get the API key for the determined provider
  const apiKeyData = await ctx.runQuery(api.apiKeys.getDecryptedApiKey, {
    teamId,
    provider: providerToUse,
  });

  if (!apiKeyData?.key) {
    return { success: false, error: `API key not found for ${providerToUse}` };
  }

  // First, store the user's message
  await ctx.runMutation(api.ai.addUserMessage, {
    feedbackId,
    content: userMessage,
  });

  // Call the conversation processing action directly
  await ctx.runAction(internal.aiActions.processConversationMessage, {
    feedbackId,
    teamId,
    userId,
    userMessage,
    provider: providerToUse,
    model: modelToUse,
    apiKey: apiKeyData.key,
  });

  return { success: true };
}
