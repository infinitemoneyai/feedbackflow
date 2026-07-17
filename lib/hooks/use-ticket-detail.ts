"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import type { ReactAction, ReactMutation } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useAvailableModels } from "@/lib/use-available-models";

export interface AvailableModel {
  id: string;
  name: string;
  provider: string;
}

export interface UseTicketDetailResult {
  // Core data
  feedback: FunctionReturnType<typeof api.feedback.getFeedback> | undefined;
  project: FunctionReturnType<typeof api.projects.getProject> | undefined;
  conversationHistory:
    | FunctionReturnType<typeof api.ai.getConversationHistory>
    | undefined;
  ticketDraft: FunctionReturnType<typeof api.ai.getTicketDraft> | undefined;
  solutionSuggestions:
    | FunctionReturnType<typeof api.ai.getSolutionSuggestions>
    | undefined;
  exports:
    | FunctionReturnType<typeof api.integrations.getExportsByFeedback>
    | undefined;
  // AI availability
  aiConfig: FunctionReturnType<typeof api.ai.getTeamAiConfig> | undefined;
  apiKeyStatus: FunctionReturnType<typeof api.apiKeys.getAiConfig> | undefined;
  // Integration availability
  linearIntegration:
    | FunctionReturnType<typeof api.integrations.getLinearIntegration>
    | undefined;
  notionIntegration:
    | FunctionReturnType<typeof api.integrations.getNotionIntegration>
    | undefined;
  hasLinear: boolean;
  hasNotion: boolean;
  // Model selection
  availableModels: AvailableModel[];
  selectedModel: string | null;
  setSelectedModel: (model: string | null) => void;
  // Actions
  sendConversationMessage: ReactAction<
    typeof api.aiActions.sendConversationMessage
  >;
  updateFeedbackStatus: ReactMutation<typeof api.feedback.updateFeedbackStatus>;
  deleteFeedback: ReactMutation<typeof api.feedback.deleteFeedback>;
  createExport: ReactMutation<typeof api.integrations.createExport>;
}

/**
 * The data seam for the ticket detail panel: every Convex query the panel
 * needs (gated with "skip" until its inputs exist), the mutations/actions it
 * fires, and the model-list merge glue that used to live inline in the
 * component. The panel stays pure presentation on top of this.
 */
export function useTicketDetail(
  feedbackId: Id<"feedback"> | null
): UseTicketDetailResult {
  // Fetch the selected feedback
  const feedback = useQuery(
    api.feedback.getFeedback,
    feedbackId ? { feedbackId } : "skip"
  );

  // Fetch the project to get the code
  const project = useQuery(
    api.projects.getProject,
    feedback ? { projectId: feedback.projectId } : "skip"
  );

  // Fetch conversation history
  const conversationHistory = useQuery(
    api.ai.getConversationHistory,
    feedbackId ? { feedbackId } : "skip"
  );

  // Mutations and actions
  const sendConversationMessage = useAction(
    api.aiActions.sendConversationMessage
  );
  const updateFeedbackStatus = useMutation(api.feedback.updateFeedbackStatus);
  const deleteFeedback = useMutation(api.feedback.deleteFeedback);
  const createExport = useMutation(api.integrations.createExport);

  // Check AI configuration
  const aiConfig = useQuery(
    api.ai.getTeamAiConfig,
    feedback ? { teamId: feedback.teamId } : "skip"
  );

  // Check which API keys are configured
  const apiKeyStatus = useQuery(
    api.apiKeys.getAiConfig,
    feedback ? { teamId: feedback.teamId } : "skip"
  );

  // Fetch live model lists from each configured provider
  const openaiModels = useAvailableModels(
    feedback?.teamId,
    "openai",
    !!apiKeyStatus?.hasOpenAI && !!apiKeyStatus?.openAIValid
  );
  const anthropicModels = useAvailableModels(
    feedback?.teamId,
    "anthropic",
    !!apiKeyStatus?.hasAnthropic && !!apiKeyStatus?.anthropicValid
  );

  // Build the combined available-models list
  const availableModels = useMemo(() => {
    const models: AvailableModel[] = [];
    if (apiKeyStatus?.hasOpenAI && apiKeyStatus?.openAIValid) {
      models.push(
        ...openaiModels.map((m) => ({
          id: m.id,
          name: m.name,
          provider: "OpenAI",
        }))
      );
    }
    if (apiKeyStatus?.hasAnthropic && apiKeyStatus?.anthropicValid) {
      models.push(
        ...anthropicModels.map((m) => ({
          id: m.id,
          name: m.name,
          provider: "Anthropic",
        }))
      );
    }
    return models;
  }, [apiKeyStatus, openaiModels, anthropicModels]);

  // Seed selected model; reset if the saved one isn't in the live list
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  useEffect(() => {
    if (!aiConfig || availableModels.length === 0) return;
    const validIds = new Set(availableModels.map((m) => m.id));
    const saved = aiConfig.preferredModel;
    if (!selectedModel) {
      setSelectedModel(saved && validIds.has(saved) ? saved : availableModels[0].id);
    } else if (!validIds.has(selectedModel)) {
      setSelectedModel(availableModels[0].id);
    }
  }, [aiConfig, selectedModel, availableModels]);

  // Check which integrations are connected
  const linearIntegration = useQuery(
    api.integrations.getLinearIntegration,
    feedback ? { teamId: feedback.teamId } : "skip"
  );
  const notionIntegration = useQuery(
    api.integrations.getNotionIntegration,
    feedback ? { teamId: feedback.teamId } : "skip"
  );

  // Check if already exported
  const exports = useQuery(
    api.integrations.getExportsByFeedback,
    feedbackId ? { feedbackId } : "skip"
  );

  // Fetch ticket draft for routing
  const ticketDraft = useQuery(
    api.ai.getTicketDraft,
    feedbackId ? { feedbackId } : "skip"
  );

  // Fetch solution suggestions (used in resolved view)
  const solutionSuggestions = useQuery(
    api.ai.getSolutionSuggestions,
    feedbackId ? { feedbackId } : "skip"
  );

  const hasLinear = !!(linearIntegration?.hasApiKey && linearIntegration?.isActive);
  const hasNotion = !!(notionIntegration?.hasApiKey && notionIntegration?.isActive);

  return {
    feedback,
    project,
    conversationHistory,
    ticketDraft,
    solutionSuggestions,
    exports,
    aiConfig,
    apiKeyStatus,
    linearIntegration,
    notionIntegration,
    hasLinear,
    hasNotion,
    availableModels,
    selectedModel,
    setSelectedModel,
    sendConversationMessage,
    updateFeedbackStatus,
    deleteFeedback,
    createExport,
  };
}
