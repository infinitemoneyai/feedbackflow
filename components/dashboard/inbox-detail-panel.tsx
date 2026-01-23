"use client";

import { useState, useCallback, useEffect } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { X } from "lucide-react";
import { Icon } from "@/components/ui/icon";
import { api } from "@/convex/_generated/api";
import { useDashboard } from "./dashboard-layout";
import { Id } from "@/convex/_generated/dataModel";
import { ScreenshotViewer } from "./screenshot-viewer";
import { VideoPlayer } from "./video-player";
import { DraftTicketModal } from "./draft-ticket-modal";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type FeedbackStatus = "new" | "triaging" | "drafted" | "exported" | "resolved";

const OPENAI_MODELS = [
  { id: "gpt-5.2", name: "GPT-5.2 (Best for coding/agents)" },
  { id: "gpt-5-mini", name: "GPT-5 Mini (Fast & cost-efficient)" },
  { id: "gpt-5-nano", name: "GPT-5 Nano (Fastest)" },
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
  const { selectedFeedbackId, setSelectedFeedbackId } = useDashboard();
  const [messageInput, setMessageInput] = useState("");
  const [isSolutionExpanded, setIsSolutionExpanded] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [isDraftModalOpen, setIsDraftModalOpen] = useState(false);
  const [inputMode, setInputMode] = useState<"write" | "chat">("write");
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [toast, setToast] = useState<{ kind: "success" | "error"; message: string } | null>(null);
  const [shareModal, setShareModal] = useState<{ open: boolean; url: string }>({ open: false, url: "" });
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

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
      models.push(...OPENAI_MODELS.map(m => ({ ...m, provider: "OpenAI" })));
    }
    
    if (apiKeyStatus?.hasAnthropic && apiKeyStatus?.anthropicValid) {
      models.push(...ANTHROPIC_MODELS.map(m => ({ ...m, provider: "Anthropic" })));
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
  const linearExport = exports?.find((e) => e.provider === "linear");
  const notionExport = exports?.find((e) => e.provider === "notion");

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
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && inputMode === "chat") {
      e.preventDefault();
      handleSendMessage();
    }
  }, [inputMode, handleSendMessage]);

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
      <aside className="relative z-10 hidden w-[480px] flex-shrink-0 flex-col border-l-2 border-retro-black bg-retro-paper lg:flex">
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
      <aside className="relative z-10 hidden w-[480px] flex-shrink-0 flex-col border-l-2 border-retro-black bg-retro-paper lg:flex">
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
    <aside className="relative z-10 hidden w-[480px] flex-shrink-0 flex-col border-l-2 border-retro-black bg-retro-paper lg:flex">
      {/* Toast */}
      {toast && (
        <div className="pointer-events-none absolute bottom-4 left-4 right-4 z-50 animate-ff-fade-up">
          <div
            className={`pointer-events-auto flex items-center justify-between gap-3 rounded border-2 border-retro-black bg-white px-3 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] ${
              toast.kind === "success" ? "" : "bg-retro-red/5"
            }`}
          >
            <div className="flex items-center gap-2">
              <Icon
                name={toast.kind === "success" ? "solar:check-circle-linear" : "solar:danger-triangle-linear"}
                size={16}
                className={toast.kind === "success" ? "text-retro-blue" : "text-retro-red"}
              />
              <span className="text-xs font-medium text-stone-700">{toast.message}</span>
            </div>
          </div>
        </div>
      )}

      {/* Share modal (clipboard fallback) */}
      {shareModal.open && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-retro-black/20 p-6">
          <div className="w-full max-w-[420px] rounded border-2 border-retro-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,0.25)]">
            <div className="flex items-center justify-between border-b-2 border-retro-black px-4 py-3">
              <div className="font-mono text-xs font-bold uppercase tracking-wider text-stone-700">
                Share link
              </div>
              <button
                onClick={() => setShareModal({ open: false, url: "" })}
                className="rounded p-1 text-stone-500 transition-colors hover:bg-stone-100 hover:text-retro-black"
              >
                <Icon name="solar:close-square-linear" size={18} />
              </button>
            </div>
            <div className="space-y-3 p-4">
              <p className="text-xs text-stone-600">
                Clipboard access is blocked by your browser. Copy the link below:
              </p>
              <div className="rounded border-2 border-stone-200 bg-stone-50 p-3">
                <code className="block select-all break-all font-mono text-[11px] text-stone-700">
                  {shareModal.url}
                </code>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShareModal({ open: false, url: "" })}
                  className="rounded border-2 border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 transition-colors hover:bg-stone-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {confirmDeleteOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-retro-black/20 p-6">
          <div className="w-full max-w-[420px] rounded border-2 border-retro-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,0.25)]">
            <div className="flex items-center justify-between border-b-2 border-retro-black px-4 py-3">
              <div className="font-mono text-xs font-bold uppercase tracking-wider text-stone-700">
                Delete ticket
              </div>
              <button
                onClick={() => setConfirmDeleteOpen(false)}
                className="rounded p-1 text-stone-500 transition-colors hover:bg-stone-100 hover:text-retro-black"
              >
                <Icon name="solar:close-square-linear" size={18} />
              </button>
            </div>
            <div className="space-y-3 p-4">
              <p className="text-sm font-semibold text-stone-800">This cannot be undone.</p>
              <p className="text-xs text-stone-600">
                This will delete the ticket and associated drafts, exports, comments, and conversation.
              </p>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => setConfirmDeleteOpen(false)}
                  className="rounded border-2 border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 transition-colors hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="rounded border-2 border-retro-black bg-retro-red px-3 py-1.5 text-xs font-medium text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)] transition-transform hover:translate-x-[1px] hover:translate-y-[1px]"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Header */}
      <div className="flex h-16 items-center justify-between border-b-2 border-retro-black bg-white px-6">
        <div className="flex items-center gap-3">
          <span className="font-mono text-lg font-bold">
            {project?.code && feedback.ticketNumber ? `#${project.code}-${feedback.ticketNumber}` : `#${selectedFeedbackId.slice(-3).toUpperCase()}`}
          </span>
          <span className="h-4 w-px bg-stone-300" />
          <span
            className={`rounded px-2 py-0.5 text-xs font-medium ${
              feedback.type === "bug"
                ? "bg-retro-red/10 text-retro-red"
                : "bg-retro-blue/10 text-retro-blue"
            }`}
          >
            {feedback.type === "bug" ? "Bug" : "Feature"}
          </span>
          <span className="h-4 w-px bg-stone-300" />
          <div className="flex items-center gap-2 text-sm text-stone-500">
            <Icon name="solar:user-circle-linear" size={16} />
            <span>{feedback.submitterName || feedback.submitterEmail || "Anonymous"}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleShare}
            className="rounded p-2 text-stone-500 transition-colors hover:bg-stone-100 hover:text-retro-black"
            title="Copy link to clipboard"
          >
            <Icon name="solar:link-linear" size={20} />
          </button>
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="rounded p-2 text-stone-500 transition-colors hover:bg-stone-100 hover:text-retro-black"
            >
              <Icon name="solar:menu-dots-linear" size={20} />
            </button>
            {isMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsMenuOpen(false)}
                />
                <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded border-2 border-retro-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
                  <button
                    onClick={handleDelete}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-retro-red transition-colors hover:bg-retro-red/10"
                  >
                    <Icon name="solar:trash-bin-trash-linear" size={16} />
                    Delete Ticket
                  </button>
                </div>
              </>
            )}
          </div>
          <button
            onClick={() => setSelectedFeedbackId(null)}
            className="rounded p-2 text-stone-500 transition-colors hover:bg-red-50 hover:text-retro-red"
          >
            <Icon name="solar:close-square-linear" size={20} />
          </button>
        </div>
      </div>

      {/* Content Scroll Area */}
      <div className="flex-grow space-y-6 overflow-y-auto p-6">
        {/* Ticket Title & Description */}
        <div>
          <h2 className="mb-3 text-2xl font-semibold leading-tight tracking-tight text-retro-black">
            {feedback.title}
          </h2>
          {/* Device tags */}
          {(feedback.metadata?.browser || feedback.metadata?.os) && (
            <div className="mb-4 flex gap-2">
              {feedback.metadata.browser && (
                <span className="border border-retro-black bg-white px-2 py-1 font-mono text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  {feedback.metadata.browser}
                </span>
              )}
              {feedback.metadata.os && (
                <span className="border border-retro-black bg-white px-2 py-1 font-mono text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  {feedback.metadata.os}
                </span>
              )}
            </div>
          )}
          {feedback.description && (
            <p className="leading-relaxed text-stone-600">{feedback.description}</p>
          )}

          {/* Contact & Metadata - Collapsible */}
          <details className="group mt-4 rounded border-2 border-stone-200 bg-stone-50">
            <summary className="flex cursor-pointer items-center justify-between p-3 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-100">
              <div className="flex items-center gap-2">
                <Icon name="solar:info-circle-linear" size={16} />
                <span>Contact & Technical Details</span>
              </div>
              <Icon
                name="solar:alt-arrow-down-linear"
                size={16}
                className="transition-transform group-open:rotate-180"
              />
            </summary>
            <div className="space-y-3 border-t-2 border-stone-200 p-3">
              {/* Contact Info */}
              {(feedback.submitterName || feedback.submitterEmail) && (
                <div>
                  <h4 className="mb-2 font-mono text-[10px] font-bold uppercase tracking-wider text-stone-400">
                    Contact
                  </h4>
                  <div className="space-y-1.5 text-sm">
                    {feedback.submitterName && (
                      <div className="flex items-center gap-2">
                        <Icon name="solar:user-linear" size={14} className="text-stone-400" />
                        <span className="text-stone-600">{feedback.submitterName}</span>
                      </div>
                    )}
                    {feedback.submitterEmail && (
                      <div className="flex items-center gap-2">
                        <Icon name="solar:letter-linear" size={14} className="text-stone-400" />
                        <a
                          href={`mailto:${feedback.submitterEmail}`}
                          className="text-retro-blue hover:underline"
                        >
                          {feedback.submitterEmail}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Technical Details */}
              <div>
                <h4 className="mb-2 font-mono text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  Technical Details
                </h4>
                <div className="space-y-1.5 text-sm">
                  {feedback.metadata.url && (
                    <div className="flex items-start gap-2">
                      <Icon name="solar:link-linear" size={14} className="mt-0.5 flex-shrink-0 text-stone-400" />
                      <a
                        href={feedback.metadata.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate text-retro-blue hover:underline"
                      >
                        {feedback.metadata.url}
                      </a>
                    </div>
                  )}
                  {feedback.metadata.screenWidth && feedback.metadata.screenHeight && (
                    <div className="flex items-center gap-2">
                      <Icon name="solar:monitor-linear" size={14} className="text-stone-400" />
                      <span className="text-stone-600">
                        {feedback.metadata.screenWidth} × {feedback.metadata.screenHeight}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Icon name="solar:calendar-linear" size={14} className="text-stone-400" />
                    <span className="text-stone-600">
                      {new Date(feedback.metadata.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </details>
        </div>

        {/* Screenshot */}
        {feedback.screenshotUrl && (
          <div>
            <ScreenshotViewer url={feedback.screenshotUrl} />
          </div>
        )}

        {/* Video */}
        {feedback.recordingUrl && (
          <div>
            <VideoPlayer url={feedback.recordingUrl} duration={feedback.recordingDuration} />
          </div>
        )}

        {/* Solution Discussion - Collapsible */}
        <details
          open={isSolutionExpanded}
          onToggle={(e) => setIsSolutionExpanded((e.target as HTMLDetailsElement).open)}
          className="group rounded border-2 border-retro-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]"
        >
          <summary className="flex cursor-pointer items-center justify-between p-4 transition-colors hover:bg-stone-50">
            <div className="flex items-center gap-2">
              <Icon name="solar:chat-round-dots-linear" className="text-retro-blue" size={18} />
              <span className="font-mono text-sm font-bold uppercase tracking-wider text-retro-blue">
                Solution Discussion
              </span>
              {conversationHistory && conversationHistory.length > 0 && (
                <span className="ml-2 rounded-full bg-retro-blue/10 px-2 py-0.5 text-xs font-medium text-retro-blue">
                  {conversationHistory.length}
                </span>
              )}
            </div>
            <Icon
              name="solar:alt-arrow-down-linear"
              size={18}
              className="text-stone-400 transition-transform group-open:rotate-180"
            />
          </summary>

          <div className="space-y-3 border-t-2 border-stone-200 p-4">
            {!aiConfig?.isConfigured ? (
              <div className="rounded border-2 border-retro-yellow/30 bg-retro-yellow/10 p-4 text-center">
                <Icon name="solar:danger-triangle-linear" className="mx-auto mb-2 text-retro-yellow" size={32} />
                <p className="mb-2 text-sm font-semibold text-stone-700">AI Not Configured</p>
                <p className="mb-3 text-xs text-stone-600">
                  Add an OpenAI or Anthropic API key in Settings to use AI features.
                </p>
                <a
                  href="/settings?tab=ai"
                  className="inline-flex items-center gap-1 rounded border-2 border-retro-black bg-white px-3 py-1.5 text-xs font-medium transition-colors hover:bg-stone-50"
                >
                  <Icon name="solar:settings-linear" size={14} />
                  Go to Settings
                </a>
              </div>
            ) : conversationHistory && conversationHistory.length > 0 ? (
              conversationHistory.map((message, idx) => (
                <div
                  key={message._id}
                  className={`flex items-start gap-3 min-w-0 ${
                    message.role === "user" ? "flex-row-reverse" : ""
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
                      message.role === "assistant"
                        ? "border border-retro-blue bg-retro-blue/20 text-retro-blue"
                        : "bg-retro-black text-white"
                    }`}
                  >
                    {message.role === "assistant" ? (
                      <Icon name="solar:robot-2-linear" size={16} />
                    ) : (
                      <span className="font-mono text-[10px] font-bold">ME</span>
                    )}
                  </div>

                  {/* Message bubble */}
                  <div
                    className={`min-w-0 flex-1 overflow-hidden rounded-lg border p-3 text-sm ${
                      message.role === "assistant"
                        ? "rounded-tl-none border-stone-200 bg-white shadow-sm"
                        : "rounded-tr-none border-retro-yellow bg-retro-yellow/20"
                    }`}
                  >
                    {message.role === "assistant" ? (
                      <div className="prose prose-sm prose-stone max-w-none overflow-wrap-anywhere break-words leading-relaxed [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_*]:break-words [&_code]:break-all [&_code]:rounded [&_code]:border [&_code]:border-stone-200 [&_code]:bg-stone-50 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-xs [&_code]:font-mono [&_code]:text-stone-700 [&_pre]:overflow-x-auto [&_pre]:rounded [&_pre]:border-2 [&_pre]:border-retro-black [&_pre]:bg-stone-50 [&_pre]:p-3 [&_pre_code]:border-0 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:break-normal [&_ul]:my-2 [&_ol]:my-2 [&_li]:my-1 [&_strong]:font-semibold [&_strong]:text-stone-900 [&_h1]:text-lg [&_h1]:font-bold [&_h1]:text-stone-900 [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-stone-900 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-stone-800">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="break-words whitespace-pre-wrap leading-relaxed">{message.content}</p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center">
                <div className="mb-3 flex justify-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-stone-200 bg-stone-50">
                    <Icon name="solar:chat-line-linear" className="text-stone-400" size={24} />
                  </div>
                </div>
                <p className="text-sm text-stone-500">
                  No conversation yet. Start discussing the solution below.
                </p>
              </div>
            )}

            {/* AI Thinking indicator */}
            {isAiThinking && (
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-retro-blue bg-retro-blue/20 text-retro-blue">
                  <Icon name="solar:robot-2-linear" size={16} />
                </div>
                <div className="flex-1 rounded-bl-lg rounded-br-lg rounded-tr-lg border border-stone-200 bg-white p-3 shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 animate-bounce rounded-full bg-retro-blue" style={{ animationDelay: "0ms" }} />
                    <div className="h-2 w-2 animate-bounce rounded-full bg-retro-blue" style={{ animationDelay: "150ms" }} />
                    <div className="h-2 w-2 animate-bounce rounded-full bg-retro-blue" style={{ animationDelay: "300ms" }} />
                    <span className="ml-2 text-xs text-stone-500">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </details>
      </div>

      {/* Footer: Solution Input & Actions */}
      <div className="z-20 space-y-3 border-t-2 border-retro-black bg-white p-4 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
        {/* Mode Toggle */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-stone-400">
            How should we fix this?
          </span>
          <div className="ml-auto flex rounded border-2 border-stone-200 bg-stone-50">
            <button
              onClick={() => setInputMode("write")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                inputMode === "write"
                  ? "bg-retro-black text-white"
                  : "text-stone-600 hover:bg-stone-100"
              }`}
            >
              <Icon name="solar:pen-linear" size={14} />
              Write
            </button>
            <button
              onClick={() => aiConfig?.isConfigured && setInputMode("chat")}
              disabled={!aiConfig?.isConfigured}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                inputMode === "chat"
                  ? "bg-retro-blue text-white"
                  : "text-stone-600 hover:bg-stone-100"
              } disabled:cursor-not-allowed disabled:opacity-50`}
              title={!aiConfig?.isConfigured ? "Configure AI in Settings first" : ""}
            >
              <Icon name="solar:chat-round-dots-linear" size={14} />
              Chat with AI
            </button>
          </div>
        </div>

        {/* Model Selector - Only show in chat mode */}
        {inputMode === "chat" && aiConfig?.isConfigured && availableModels.length > 0 && (
          <div className="flex items-center gap-2">
            <Icon name="solar:cpu-linear" size={14} className="text-stone-400" />
            <span className="text-xs font-medium text-stone-600">Model:</span>
            <select
              value={selectedModel || aiConfig.preferredModel || ""}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="flex-1 rounded border-2 border-stone-200 bg-white px-2 py-1.5 text-xs font-medium text-stone-700 outline-none transition-colors hover:border-stone-300 focus:border-retro-blue"
            >
              {/* Group by provider if multiple providers available */}
              {apiKeyStatus?.hasOpenAI && apiKeyStatus?.openAIValid && (
                <optgroup label="OpenAI">
                  {OPENAI_MODELS.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name}
                    </option>
                  ))}
                </optgroup>
              )}
              {apiKeyStatus?.hasAnthropic && apiKeyStatus?.anthropicValid && (
                <optgroup label="Anthropic">
                  {ANTHROPIC_MODELS.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>
        )}

        {/* Input Area */}
        <div className="relative">
          <textarea
            placeholder={
              inputMode === "write"
                ? "Describe the solution and how to implement it..."
                : "Ask AI about the issue or discuss the solution..."
            }
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={4}
            className="w-full resize-none rounded border-2 border-stone-200 bg-stone-50 p-3 text-sm outline-none transition-colors focus:border-retro-blue"
          />
          {inputMode === "chat" && (
            <button
              onClick={handleSendMessage}
              disabled={!messageInput.trim() || isAiThinking}
              className="absolute bottom-3 right-2 rounded border-2 border-retro-blue bg-retro-blue p-2 text-white transition-all hover:translate-x-[1px] hover:translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-50"
              title="Send message (Enter)"
            >
              <Icon name="solar:arrow-right-linear" size={16} />
            </button>
          )}
        </div>

        {/* Draft Ticket Button */}
        <button
          onClick={handleDraftTicket}
          disabled={!messageInput.trim() && (!conversationHistory || conversationHistory.length === 0)}
          className="group flex w-full items-center justify-center gap-2 border-2 border-retro-black bg-retro-black p-3 text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:border-retro-blue hover:bg-retro-blue hover:shadow-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-x-0 disabled:hover:translate-y-0"
          title="Generate a ticket from the solution"
        >
          <Icon name="solar:document-text-linear" size={18} />
          <span className="font-medium">Draft Ticket</span>
        </button>
      </div>

      {/* Draft Ticket Modal */}
      {feedback && (
        <DraftTicketModal
          feedbackId={selectedFeedbackId}
          teamId={feedback.teamId}
          isOpen={isDraftModalOpen}
          onClose={() => setIsDraftModalOpen(false)}
          onSuccess={handleDraftSuccess}
        />
      )}
    </aside>
  );
}

/* Tailwind needs a keyframes definition; we rely on arbitrary animation name in class.
   This is a no-op comment for readability. */
