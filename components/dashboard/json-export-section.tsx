"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import {
  Download,
  Copy,
  Loader2,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  FileJson,
  Clipboard,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import {
  feedbackToUserStory,
  formatUserStoryJson,
  downloadJson,
  copyJsonToClipboard,
  type FeedbackForExport,
  type TicketDraftForExport,
} from "@/lib/exports/json";

interface JsonExportSectionProps {
  feedbackId: Id<"feedback">;
  teamId: Id<"teams">;
}

export function JsonExportSection({ feedbackId }: JsonExportSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportResult, setExportResult] = useState<{
    success: boolean;
    action?: "download" | "copy";
    error?: string;
  } | null>(null);

  // Fetch required data
  const exports = useQuery(api.integrations.getExportsForFeedback, { feedbackId });
  const feedback = useQuery(api.feedback.getFeedback, { feedbackId });
  const ticketDraft = useQuery(api.ai.getTicketDraft, { feedbackId });
  const createExport = useMutation(api.integrations.createExport);

  // Check if there's an existing JSON export
  const existingJsonExport = exports?.find(
    (e: { provider: string; status: string }) => e.provider === "json" && e.status === "success"
  );

  // Convert feedback to export format
  const getFeedbackForExport = useCallback((): FeedbackForExport | null => {
    if (!feedback) return null;

    return {
      _id: feedbackId,
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
      metadata: feedback.metadata,
      createdAt: feedback.createdAt,
    };
  }, [feedback, feedbackId]);

  // Convert ticket draft to export format
  const getTicketDraftForExport = useCallback((): TicketDraftForExport | null => {
    if (!ticketDraft) return null;

    return {
      title: ticketDraft.title,
      description: ticketDraft.description,
      acceptanceCriteria: ticketDraft.acceptanceCriteria || [],
      reproSteps: ticketDraft.reproSteps,
      expectedBehavior: ticketDraft.expectedBehavior,
      actualBehavior: ticketDraft.actualBehavior,
    };
  }, [ticketDraft]);

  // Handle download
  const handleDownload = useCallback(async () => {
    const feedbackData = getFeedbackForExport();
    if (!feedbackData) return;

    setIsExporting(true);
    setExportResult(null);

    try {
      const ticketDraftData = getTicketDraftForExport();
      const userStory = feedbackToUserStory(feedbackData, ticketDraftData);
      const jsonContent = formatUserStoryJson(userStory);

      // Download the file
      const filename = `feedback-${userStory.id}.json`;
      downloadJson(jsonContent, filename);

      // Create export record
      await createExport({
        feedbackId,
        provider: "json",
        exportedData: userStory,
        status: "success",
      });

      setExportResult({
        success: true,
        action: "download",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Export failed";

      await createExport({
        feedbackId,
        provider: "json",
        status: "failed",
        errorMessage,
      });

      setExportResult({
        success: false,
        error: errorMessage,
      });
    } finally {
      setIsExporting(false);
    }
  }, [feedbackId, getFeedbackForExport, getTicketDraftForExport, createExport]);

  // Handle copy to clipboard
  const handleCopy = useCallback(async () => {
    const feedbackData = getFeedbackForExport();
    if (!feedbackData) return;

    setIsExporting(true);
    setExportResult(null);

    try {
      const ticketDraftData = getTicketDraftForExport();
      const userStory = feedbackToUserStory(feedbackData, ticketDraftData);
      const jsonContent = formatUserStoryJson(userStory);

      const copied = await copyJsonToClipboard(jsonContent);
      if (!copied) {
        throw new Error("Failed to copy to clipboard");
      }

      // Create export record
      await createExport({
        feedbackId,
        provider: "json",
        exportedData: userStory,
        status: "success",
      });

      setExportResult({
        success: true,
        action: "copy",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Copy failed";

      await createExport({
        feedbackId,
        provider: "json",
        status: "failed",
        errorMessage,
      });

      setExportResult({
        success: false,
        error: errorMessage,
      });
    } finally {
      setIsExporting(false);
    }
  }, [feedbackId, getFeedbackForExport, getTicketDraftForExport, createExport]);

  // Already exported state
  if (existingJsonExport) {
    return (
      <div className="rounded border-2 border-green-200 bg-green-50 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-green-300 bg-green-100">
            <Check className="h-5 w-5 text-green-600" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-medium text-green-700">Exported as JSON</h4>
            <p className="text-xs text-green-600">
              {existingJsonExport.exportedData?.id || "prd.json format"}
            </p>
          </div>
          <button
            onClick={handleCopy}
            disabled={isExporting}
            className="flex items-center gap-1.5 rounded border-2 border-green-300 bg-white px-3 py-1.5 text-xs font-medium text-green-700 transition-colors hover:bg-green-50"
          >
            {isExporting ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
            Copy Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center gap-3 rounded border-2 border-emerald-200 bg-emerald-50 p-3 text-left transition-colors hover:border-emerald-300"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-emerald-300 bg-emerald-100">
          <FileJson className="h-5 w-5 text-emerald-600" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-medium text-emerald-700">Export as JSON</h4>
          <p className="text-xs text-emerald-500">
            {ticketDraft
              ? "Export with AI-generated acceptance criteria"
              : "Export in prd.json format for AI workflows"}
          </p>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-emerald-400" />
        ) : (
          <ChevronDown className="h-5 w-5 text-emerald-400" />
        )}
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="rounded border-2 border-emerald-200 bg-white p-4">
          {/* Info box */}
          <div className="mb-4 rounded border border-emerald-100 bg-emerald-50 p-3 text-xs text-emerald-700">
            <p className="mb-2">
              <strong>prd.json format</strong> exports feedback as user stories with:
            </p>
            <ul className="ml-4 list-disc space-y-0.5">
              <li>Unique ID (FF-XXXXXX)</li>
              <li>Title {ticketDraft && "(from ticket draft)"}</li>
              <li>
                Acceptance criteria{" "}
                {ticketDraft ? "(AI-generated)" : "(auto-generated from feedback)"}
              </li>
              <li>Priority (1-4 scale)</li>
              <li>Notes with description, environment, and media links</li>
            </ul>
          </div>

          {/* Export buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleDownload}
              disabled={isExporting}
              className="flex flex-1 items-center justify-center gap-2 rounded border-2 border-emerald-600 bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-[4px_4px_0px_0px_rgba(5,150,105,0.5)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(5,150,105,0.5)] disabled:opacity-50 disabled:hover:translate-x-0 disabled:hover:translate-y-0"
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Download JSON
            </button>
            <button
              onClick={handleCopy}
              disabled={isExporting}
              className="flex items-center justify-center gap-2 rounded border-2 border-emerald-600 bg-white px-4 py-2.5 text-sm font-medium text-emerald-600 transition-colors hover:bg-emerald-50 disabled:opacity-50"
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Clipboard className="h-4 w-4" />
              )}
              Copy
            </button>
          </div>

          {/* Export result */}
          {exportResult && (
            <div
              className={cn(
                "mt-3 flex items-center gap-2 rounded border p-3 text-sm",
                exportResult.success
                  ? "border-green-200 bg-green-50 text-green-700"
                  : "border-red-200 bg-red-50 text-red-700"
              )}
            >
              {exportResult.success ? (
                <>
                  <Check className="h-4 w-4" />
                  <span>
                    {exportResult.action === "download"
                      ? "Downloaded as JSON file"
                      : "Copied to clipboard"}
                  </span>
                </>
              ) : (
                <>
                  <X className="h-4 w-4" />
                  <span>{exportResult.error}</span>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
