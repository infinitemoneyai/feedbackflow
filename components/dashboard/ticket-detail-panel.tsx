"use client";

import { useState, useCallback, useEffect } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { X } from "lucide-react";
import { Icon } from "@/components/ui/icon";
import { api } from "@/convex/_generated/api";
import { useDashboard } from "./dashboard-layout";
import { Id } from "@/convex/_generated/dataModel";
import { DraftTicketModal } from "./draft-ticket-modal";
import {
  TicketHeader,
  TicketContentArea,
  ResolvedFooter,
  BacklogFooter,
  InboxFooter,
  Toast,
  ShareModal,
  DeleteConfirmModal,
} from "./ticket-detail";

type FeedbackStatus = "new" | "triaging" | "drafted" | "exported" | "resolved";

const OPENAI_MODELS = [
  { id: "gpt-5.2", name: "GPT-5.2 (Best for coding/agents)" },
  { id: "gpt-4.1", name: "GPT-4.1 (Smartest non-reasoning)" },
  { id: "gpt-4o", name: "GPT-4o" },
  { id: "gpt-4o-mini", name: "GPT-4o Mini" },
];

const ANTHROPIC_MODELS = [
  { id: "claude-sonnet-4-5-20250929", name: "Claude Sonnet 4.5 (Best for agents/coding)" },
  { id: "claude-opus-4-5-20251101", name: "Claude Opus 4.5 (Max intelligence)" },
  { id: "claude-haiku-4-5-20251001", name: "Claude Haiku 4.5 (Fast & economical)" },
  { id: "claude-3-5-sonnet-20241022", name: "Claude 3.5 Sonnet" },
  { id: "claude-3-5-haiku-20241022", name: "Claude 3.5 Haiku" },
];

export function TicketDetailPanel() {
  const { selectedFeedbackId, setSelectedFeedbackId, currentView } = useDashboard();
  const [messageInput, setMessageInput] = useState("");
  const [isSolutionExpanded, setIsSolutionExpanded] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [isDraftModalOpen, setIsDraftModalOpen] = useState(false);
  const [inputMode, setInputMode] = useState<"write" | "chat">("write");
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [toast, setToast] = useState<{ kind: "success" | "error"; message: string } | null>(null);
  const [shareModal, setShareModal] = useState<{ open: boolean; url: string }>({
    open: false,
    url: "",
  });
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  // Backlog routing state
  const [selectedRoutingDestination, setSelectedRoutingDestination] = useState<
    "linear" | "notion" | "prd" | null
  >(null);
  const [isRouting, setIsRouting] = useState(false);

  // Fetch the selected feedback
  const feedback = useQuery(
    api.feedback.getFeedback,
    selectedFeedbackId ? { feedbackId: selectedFeedbackId } : "skip"
  );

  // Fetch the project to get the code
  const project = useQuery(
    api.projects.getProject,
    feedback ? { projectId: feedback.projectId } : "skip"
  );

  // Fetch conversation history
  const conversationHistory = useQuery(
    api.ai.getConversationHistory,
    selectedFeedbackId ? { feedbackId: selectedFeedbackId } : "skip"
  );

  // Mutations and actions
  const sendConversationMessage = useAction(api.aiActions.sendConversationMessage);
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

  // Set default model when AI config loads
  useEffect(() => {
    if (aiConfig && !selectedModel) {
      setSelectedModel(aiConfig.preferredModel);
    }
  }, [aiConfig, selectedModel]);

  // Get available models based on which providers have keys
  const getAvailableModels = () => {
    const models: Array<{ id: string; name: string; provider: string }> = [];

    if (apiKeyStatus?.hasOpenAI && apiKeyStatus?.openAIValid) {
      models.push(...OPENAI_MODELS.map((m) => ({ ...m, provider: "OpenAI" })));
    }

    if (apiKeyStatus?.hasAnthropic && apiKeyStatus?.anthropicValid) {
      models.push(...ANTHROPIC_MODELS.map((m) => ({ ...m, provider: "Anthropic" })));
    }

    return models;
  };

  const availableModels = getAvailableModels();

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
    selectedFeedbackId ? { feedbackId: selectedFeedbackId } : "skip"
  );

  // Fetch ticket draft for routing
  const ticketDraft = useQuery(
    api.ai.getTicketDraft,
    selectedFeedbackId ? { feedbackId: selectedFeedbackId } : "skip"
  );

  // Fetch solution suggestions (used in resolved view)
  const solutionSuggestions = useQuery(
    api.ai.getSolutionSuggestions,
    selectedFeedbackId ? { feedbackId: selectedFeedbackId } : "skip"
  );

  const hasLinear = linearIntegration?.hasApiKey && linearIntegration?.isActive;
  const hasNotion = notionIntegration?.hasApiKey && notionIntegration?.isActive;

  // Turn off thinking state when AI responds or after timeout
  useEffect(() => {
    if (isAiThinking && conversationHistory && conversationHistory.length > 0) {
      const lastMessage = conversationHistory[conversationHistory.length - 1];

      if (lastMessage.role === "assistant") {
        setIsAiThinking(false);
      }
    }

    // Timeout after 30 seconds
    if (isAiThinking) {
      const timeout = setTimeout(() => {
        setIsAiThinking(false);
      }, 30000);

      return () => clearTimeout(timeout);
    }
  }, [conversationHistory, isAiThinking]);

  // Auto-dismiss toast after 3 seconds
  useEffect(() => {
    if (toast) {
      const timeout = setTimeout(() => {
        setToast(null);
      }, 3000);

      return () => clearTimeout(timeout);
    }
  }, [toast]);

  // Handle sending message (works for both chat and write modes)
  const handleSendMessage = useCallback(async () => {
    if (!messageInput.trim() || !selectedFeedbackId || !feedback) return;

    if (inputMode === "chat") {
      // Chat mode: send to AI
      setIsAiThinking(true);
      setIsSolutionExpanded(true);

      try {
        const result = await sendConversationMessage({
          feedbackId: selectedFeedbackId,
          teamId: feedback.teamId,
          userMessage: messageInput,
          model: selectedModel || undefined,
        });

        if (result && !result.success) {
          console.error("AI Error:", result.error);
          alert(`AI Error: ${result.error || "Failed to send message"}`);
          setIsAiThinking(false);
        } else {
          setMessageInput("");
          // Keep thinking state on - AI is processing
          // It will turn off when we detect the response in conversation history
        }
      } catch (error) {
        console.error("Error chatting with AI:", error);
        alert("Failed to send message to AI. Please check the console for details.");
        setIsAiThinking(false);
      }
    }
    // Write mode: just keep the text in the input for drafting
  }, [messageInput, selectedFeedbackId, feedback, inputMode, sendConversationMessage, selectedModel]);

  // Handle Enter key in textarea
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey && inputMode === "chat") {
        e.preventDefault();
        handleSendMessage();
      }
    },
    [inputMode, handleSendMessage]
  );

  // Handle draft ticket
  const handleDraftTicket = useCallback(() => {
    setIsDraftModalOpen(true);
  }, []);

  // Handle draft ticket success
  const handleDraftSuccess = useCallback(async () => {
    if (!selectedFeedbackId) return;

    try {
      await updateFeedbackStatus({
        feedbackId: selectedFeedbackId,
        status: "drafted",
      });
    } catch (error) {
      console.error("Error updating feedback status:", error);
    }
  }, [selectedFeedbackId, updateFeedbackStatus]);

  // Handle delete feedback
  const handleDelete = useCallback(async () => {
    if (!selectedFeedbackId) return;
    setConfirmDeleteOpen(true);
  }, [selectedFeedbackId]);

  const handleConfirmDelete = useCallback(async () => {
    if (!selectedFeedbackId) return;
    try {
      await deleteFeedback({ feedbackId: selectedFeedbackId });
      setSelectedFeedbackId(null);
      setIsMenuOpen(false);
      setConfirmDeleteOpen(false);
      setToast({ kind: "success", message: "Ticket deleted." });
    } catch (error) {
      console.error("Error deleting feedback:", error);
      setToast({ kind: "error", message: "Failed to delete ticket." });
      setConfirmDeleteOpen(false);
    }
  }, [selectedFeedbackId, deleteFeedback, setSelectedFeedbackId]);

  // Handle share/copy link
  const handleShare = useCallback(async () => {
    if (!selectedFeedbackId) return;

    const url = `${window.location.origin}/dashboard?feedback=${selectedFeedbackId}`;

    try {
      await navigator.clipboard.writeText(url);
      setToast({ kind: "success", message: "Link copied." });
    } catch (error) {
      console.error("Error copying to clipboard:", error);
      setShareModal({ open: true, url });
      setToast({ kind: "error", message: "Clipboard blocked — copy manually." });
    }
  }, [selectedFeedbackId]);

  // Handle routing from backlog
  const handleRouteTicket = useCallback(async () => {
    if (!selectedFeedbackId || !feedback || !selectedRoutingDestination || !project) return;

    setIsRouting(true);
    try {
      const feedbackPayload = {
        title: feedback.title,
        description: feedback.description,
        type: feedback.type,
        priority: feedback.priority,
        screenshotUrl: feedback.screenshotUrl,
        recordingUrl: feedback.recordingUrl,
        metadata: feedback.metadata,
        submitterName: feedback.submitterName,
        submitterEmail: feedback.submitterEmail,
        tags: feedback.tags,
        ticketDraft: ticketDraft
          ? {
              title: ticketDraft.title,
              description: ticketDraft.description,
              acceptanceCriteria: ticketDraft.acceptanceCriteria,
              reproSteps: ticketDraft.reproSteps,
              expectedBehavior: ticketDraft.expectedBehavior,
              actualBehavior: ticketDraft.actualBehavior,
            }
          : undefined,
      };

      if (selectedRoutingDestination === "linear") {
        // Validate integration settings
        if (!linearIntegration?.settings?.linearTeamId) {
          throw new Error(
            "Linear integration not properly configured. Please configure it in Settings."
          );
        }

        const response = await fetch("/api/integrations/linear", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "createIssue",
            apiKey: "stored",
            teamId: project.teamId,
            linearTeamId: linearIntegration.settings.linearTeamId,
            feedback: feedbackPayload,
          }),
        });

        const data = await response.json();

        if (data.issue) {
          await createExport({
            feedbackId: selectedFeedbackId,
            provider: "linear",
            externalId: data.issue.id,
            externalUrl: data.issue.url,
            exportedData: {
              identifier: data.issue.identifier,
              title: data.issue.title,
            },
            status: "success",
          });

          await updateFeedbackStatus({
            feedbackId: selectedFeedbackId,
            status: "exported",
          });

          setToast({ kind: "success", message: `Routed to Linear: ${data.issue.identifier}` });
          setSelectedRoutingDestination(null);
        } else {
          throw new Error(data.error || "Failed to create Linear issue");
        }
      } else if (selectedRoutingDestination === "notion") {
        // Validate integration settings
        if (!notionIntegration?.settings?.notionDatabaseId) {
          throw new Error(
            "Notion integration not properly configured. Please configure it in Settings."
          );
        }

        const response = await fetch("/api/integrations/notion", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "createPage",
            apiKey: "stored",
            teamId: project.teamId,
            databaseId: notionIntegration.settings.notionDatabaseId,
            feedback: feedbackPayload,
          }),
        });

        const data = await response.json();

        if (data.page) {
          await createExport({
            feedbackId: selectedFeedbackId,
            provider: "notion",
            externalId: data.page.id,
            externalUrl: data.page.url,
            exportedData: {
              title: data.page.title,
            },
            status: "success",
          });

          await updateFeedbackStatus({
            feedbackId: selectedFeedbackId,
            status: "exported",
          });

          setToast({ kind: "success", message: "Routed to Notion" });
          setSelectedRoutingDestination(null);
        } else {
          throw new Error(data.error || "Failed to create Notion page");
        }
      } else if (selectedRoutingDestination === "prd") {
        // Handle PRD JSON export - this will be triggered by the download button
        // We'll handle the actual download in a separate function
        return;
      }
    } catch (error) {
      console.error("Error routing ticket:", error);
      setToast({
        kind: "error",
        message: error instanceof Error ? error.message : "Failed to route ticket",
      });
    } finally {
      setIsRouting(false);
    }
  }, [
    selectedFeedbackId,
    feedback,
    selectedRoutingDestination,
    project,
    ticketDraft,
    createExport,
    updateFeedbackStatus,
    setToast,
    linearIntegration,
    notionIntegration,
  ]);

  // Handle PRD JSON download
  const handleDownloadPrd = useCallback(async () => {
    if (!selectedFeedbackId || !feedback || !project) return;

    setIsRouting(true);
    try {
      const { feedbackToPrdExport, formatPrdExportJson, downloadJson } = await import(
        "@/lib/exports/json"
      );

      const feedbackForExport = {
        _id: feedback._id,
        type: feedback.type,
        title: feedback.title,
        description: feedback.description,
        priority: feedback.priority,
        status: feedback.status,
        tags: feedback.tags || [],
        screenshotUrl: feedback.screenshotUrl,
        recordingUrl: feedback.recordingUrl,
        submitterEmail: feedback.submitterEmail,
        submitterName: feedback.submitterName,
        createdAt: feedback.createdAt,
      };

      const ticketDraftForExport = ticketDraft
        ? {
            title: ticketDraft.title,
            description: ticketDraft.description,
            acceptanceCriteria: ticketDraft.acceptanceCriteria || [],
            reproSteps: ticketDraft.reproSteps,
            expectedBehavior: ticketDraft.expectedBehavior,
            actualBehavior: ticketDraft.actualBehavior,
          }
        : null;

      const prdExport = feedbackToPrdExport(
        [{ feedback: feedbackForExport, ticketDraft: ticketDraftForExport }],
        project.name,
        project.description
      );

      const jsonContent = formatPrdExportJson(prdExport);
      const filename = `${feedback.title.toLowerCase().replace(/\s+/g, "-")}-prd.json`;

      downloadJson(jsonContent, filename);

      await createExport({
        feedbackId: selectedFeedbackId,
        provider: "json",
        exportedData: { prdExport: true },
        status: "success",
      });

      await updateFeedbackStatus({
        feedbackId: selectedFeedbackId,
        status: "resolved",
      });

      setToast({ kind: "success", message: "PRD JSON downloaded" });
      setSelectedRoutingDestination(null);
    } catch (error) {
      console.error("Error downloading PRD:", error);
      setToast({
        kind: "error",
        message: error instanceof Error ? error.message : "Failed to download PRD",
      });
    } finally {
      setIsRouting(false);
    }
  }, [
    selectedFeedbackId,
    feedback,
    project,
    ticketDraft,
    createExport,
    updateFeedbackStatus,
    setToast,
  ]);

  // If no feedback selected, show empty state
  if (!selectedFeedbackId) {
    return (
      <aside className="relative z-10 hidden w-[480px] flex-shrink-0 flex-col border-l-2 border-retro-black bg-retro-paper lg:flex">
        <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-stone-200 bg-stone-50">
            <Icon name="solar:bug-linear" className="h-8 w-8 text-stone-400" />
          </div>
          <h3 className="mb-2 font-medium text-retro-black">No ticket selected</h3>
          <p className="text-sm text-stone-500">
            Select a feedback item from the list to view details and take actions
          </p>
        </div>
      </aside>
    );
  }

  // Loading state
  if (feedback === undefined) {
    return (
      <aside className="fixed inset-0 z-50 flex w-full flex-col border-l-2 border-retro-black bg-retro-paper lg:relative lg:z-10 lg:flex lg:w-[480px] lg:flex-shrink-0">
        <div className="flex flex-1 flex-col items-center justify-center p-8">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-200 border-t-retro-black" />
          <p className="mt-4 text-sm text-stone-500">Loading feedback...</p>
        </div>
      </aside>
    );
  }

  // Error state - feedback not found
  if (feedback === null) {
    return (
      <aside className="fixed inset-0 z-50 flex w-full flex-col border-l-2 border-retro-black bg-retro-paper lg:relative lg:z-10 lg:flex lg:w-[480px] lg:flex-shrink-0">
        <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-retro-red/20 bg-retro-red/10">
            <X className="h-8 w-8 text-retro-red" />
          </div>
          <h3 className="mb-2 font-medium text-retro-black">Feedback not found</h3>
          <p className="text-sm text-stone-500">
            This feedback may have been deleted or you don&apos;t have access to it.
          </p>
          <button
            onClick={() => setSelectedFeedbackId(null)}
            className="mt-4 rounded border-2 border-retro-black bg-white px-4 py-2 text-sm font-medium transition-colors hover:bg-stone-50"
          >
            Close
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside className="fixed inset-0 z-50 flex w-full flex-col border-l-2 border-retro-black bg-retro-paper lg:relative lg:z-10 lg:flex lg:w-[480px] lg:flex-shrink-0">
      {/* Toast */}
      {toast && <Toast kind={toast.kind} message={toast.message} />}

      {/* Share modal (clipboard fallback) */}
      {shareModal.open && (
        <ShareModal url={shareModal.url} onClose={() => setShareModal({ open: false, url: "" })} />
      )}

      {/* Delete confirmation modal */}
      {confirmDeleteOpen && (
        <DeleteConfirmModal
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmDeleteOpen(false)}
        />
      )}

      {/* Ticket Header */}
      <TicketHeader
        feedback={feedback}
        project={project}
        selectedFeedbackId={selectedFeedbackId}
        exports={exports}
        onShare={handleShare}
        onDelete={handleDelete}
        onClose={() => setSelectedFeedbackId(null)}
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
      />

      {/* Content Scroll Area */}
      <TicketContentArea
        currentView={currentView}
        feedback={feedback}
        ticketDraft={ticketDraft}
        solutionSuggestions={solutionSuggestions}
        exports={exports}
        conversationHistory={conversationHistory}
        aiConfig={aiConfig}
        isAiThinking={isAiThinking}
        isSolutionExpanded={isSolutionExpanded}
        onToggleSolution={setIsSolutionExpanded}
      />

      {/* Footer: Different based on view */}
      {currentView === "resolved" ? (
        <ResolvedFooter
          feedback={feedback}
          exports={exports}
          onClose={() => setSelectedFeedbackId(null)}
        />
      ) : currentView === "backlog" ? (
        <BacklogFooter
          selectedRoutingDestination={selectedRoutingDestination}
          isRouting={isRouting}
          hasLinear={!!hasLinear}
          hasNotion={!!hasNotion}
          onSelectDestination={setSelectedRoutingDestination}
          onRoute={handleRouteTicket}
          onDownloadPrd={handleDownloadPrd}
        />
      ) : (
        <InboxFooter
          inputMode={inputMode}
          messageInput={messageInput}
          isAiThinking={isAiThinking}
          aiConfig={aiConfig}
          selectedModel={selectedModel}
          availableModels={availableModels}
          apiKeyStatus={apiKeyStatus}
          conversationHistory={conversationHistory}
          onInputModeChange={setInputMode}
          onMessageChange={setMessageInput}
          onModelChange={setSelectedModel}
          onSendMessage={handleSendMessage}
          onDraftTicket={handleDraftTicket}
          onKeyDown={handleKeyDown}
        />
      )}

      {/* Draft Ticket Modal */}
      {feedback && (
        <DraftTicketModal
          feedbackId={selectedFeedbackId}
          teamId={feedback.teamId}
          isOpen={isDraftModalOpen}
          onClose={() => setIsDraftModalOpen(false)}
          onSuccess={handleDraftSuccess}
          initialFeedback={{
            title: feedback.title,
            description: feedback.description,
            type: feedback.type,
          }}
          solutionNotes={messageInput}
        />
      )}
    </aside>
  );
}

/* Tailwind needs a keyframes definition; we rely on arbitrary animation name in class.
   This is a no-op comment for readability. */
