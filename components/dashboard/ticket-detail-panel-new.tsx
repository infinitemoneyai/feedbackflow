"use client";

import { useState, useCallback, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { X, Bug } from "lucide-react";
import { Icon } from "@/components/ui/icon";
import { api } from "@/convex/_generated/api";
import { useDashboard } from "./dashboard-layout";
import { cn } from "@/lib/utils";
import { Id } from "@/convex/_generated/dataModel";
import { AISuggestionsCard } from "./ai-suggestions-card";
import { AIChatSlideout } from "./ai-chat-slideout";
import { CollapsedDetails } from "./collapsed-details";
import { ExportActions } from "./export-actions";
import { ScreenshotViewer } from "./screenshot-viewer";
import { VideoPlayer } from "./video-player";
import { StatusDropdown } from "./status-dropdown";

type FeedbackStatus = "new" | "triaging" | "drafted" | "exported" | "resolved";

const STATUS_OPTIONS: { value: FeedbackStatus; label: string; color: string }[] = [
  { value: "new", label: "New", color: "bg-retro-blue text-white" },
  { value: "triaging", label: "Triaging", color: "bg-retro-yellow text-retro-black" },
  { value: "drafted", label: "Drafted", color: "bg-retro-lavender text-retro-black" },
  { value: "exported", label: "Exported", color: "bg-retro-green text-white" },
  { value: "resolved", label: "Resolved", color: "bg-stone-400 text-white" },
];

export function TicketDetailPanel() {
  const { selectedFeedbackId, setSelectedFeedbackId } = useDashboard();
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Fetch the selected feedback
  const feedback = useQuery(
    api.feedback.getFeedback,
    selectedFeedbackId ? { feedbackId: selectedFeedbackId } : "skip"
  );

  // Mutation to update feedback
  const updateFeedback = useMutation(api.feedback.updateFeedback);

  // Loading and updating states
  const [isUpdating, setIsUpdating] = useState(false);

  // Handler for updating status
  const handleStatusChange = useCallback(
    async (status: FeedbackStatus) => {
      if (!selectedFeedbackId) return;
      setIsUpdating(true);
      try {
        await updateFeedback({ feedbackId: selectedFeedbackId, status });
      } catch (error) {
        console.error("Failed to update status:", error);
      }
      setIsUpdating(false);
    },
    [selectedFeedbackId, updateFeedback]
  );

  // If no feedback selected, show empty state
  if (!selectedFeedbackId) {
    return (
      <aside className="relative z-10 hidden w-[480px] flex-shrink-0 flex-col border-l-2 border-retro-black bg-retro-paper lg:flex">
        <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-stone-200 bg-stone-50">
            <Bug className="h-8 w-8 text-stone-400" />
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
    <>
      <aside className="relative z-10 hidden w-[480px] flex-shrink-0 flex-col border-l-2 border-retro-black bg-retro-paper lg:flex">
        {/* Compact header with status */}
        <div className="flex h-14 items-center justify-between border-b-2 border-retro-black bg-white px-4">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm font-bold">
              #{selectedFeedbackId.slice(-3).toUpperCase()}
            </span>
            <StatusDropdown
              value={feedback.status}
              options={STATUS_OPTIONS}
              onChange={handleStatusChange}
              disabled={isUpdating}
            />
          </div>
          <button
            onClick={() => setSelectedFeedbackId(null)}
            className="rounded p-1.5 text-stone-500 transition-colors hover:bg-red-50 hover:text-retro-red"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Panel content - streamlined */}
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {/* Title and description - HERO */}
          <div>
            <h2 className="mb-2 text-xl font-semibold leading-tight text-retro-black">
              {feedback.title}
            </h2>
            {feedback.description && (
              <p className="leading-relaxed text-stone-600">{feedback.description}</p>
            )}
          </div>

          {/* Screenshot - prominent */}
          {feedback.screenshotUrl && (
            <div>
              <ScreenshotViewer url={feedback.screenshotUrl} />
            </div>
          )}

          {/* Video - prominent */}
          {feedback.recordingUrl && (
            <div>
              <VideoPlayer url={feedback.recordingUrl} duration={feedback.recordingDuration} />
            </div>
          )}

          {/* AI Suggestions Card */}
          <AISuggestionsCard
            feedbackId={selectedFeedbackId}
            teamId={feedback.teamId}
            feedbackType={feedback.type}
            onOpenChat={() => setIsChatOpen(true)}
          />

          {/* Export Actions */}
          <ExportActions feedbackId={selectedFeedbackId} teamId={feedback.teamId} />

          {/* Collapsed Details */}
          <CollapsedDetails
            metadata={feedback.metadata}
            submitterName={feedback.submitterName}
            submitterEmail={feedback.submitterEmail}
          />
        </div>
      </aside>

      {/* AI Chat Slideout */}
      <AIChatSlideout
        feedbackId={selectedFeedbackId}
        teamId={feedback.teamId}
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />
    </>
  );
}
