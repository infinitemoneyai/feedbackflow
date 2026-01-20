"use client";

import { useState, useCallback, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import {
  ExternalLink,
  Loader2,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Settings,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface NotionExportSectionProps {
  feedbackId: Id<"feedback">;
  teamId: Id<"teams">;
}

interface NotionDatabase {
  id: string;
  title: string;
  url: string;
  icon?: string;
}

export function NotionExportSection({ feedbackId, teamId }: NotionExportSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportResult, setExportResult] = useState<{
    success: boolean;
    pageUrl?: string;
    pageTitle?: string;
    error?: string;
  } | null>(null);

  // Notion integration data
  const integration = useQuery(api.integrations.getNotionIntegration, { teamId });
  const exports = useQuery(api.integrations.getExportsForFeedback, { feedbackId });
  const feedback = useQuery(api.feedback.getFeedback, { feedbackId });
  const ticketDraft = useQuery(api.ai.getTicketDraft, { feedbackId });
  const createExport = useMutation(api.integrations.createExport);

  // Notion data for overrides
  const [notionDatabases, setNotionDatabases] = useState<NotionDatabase[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Selected values (can override defaults)
  const [selectedDatabaseId, setSelectedDatabaseId] = useState<string>("");
  const [showOptions, setShowOptions] = useState(false);

  // Initialize with default values from integration
  useEffect(() => {
    if (integration?.settings) {
      if (integration.settings.notionDatabaseId && !selectedDatabaseId) {
        setSelectedDatabaseId(integration.settings.notionDatabaseId);
      }
    }
  }, [integration, selectedDatabaseId]);

  // Check if there's an existing export to Notion
  const existingNotionExport = exports?.find(
    (e: { provider: string; status: string }) => e.provider === "notion" && e.status === "success"
  );

  // Fetch Notion databases when options are shown
  const fetchNotionData = useCallback(async () => {
    if (!integration?.hasApiKey) return;

    setIsLoadingData(true);
    try {
      const response = await fetch("/api/integrations/notion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "getDatabases", apiKey: "stored" }),
      });
      const data = await response.json();
      if (data.databases) {
        setNotionDatabases(data.databases);
      }
    } catch (error) {
      console.error("Failed to fetch Notion data:", error);
    } finally {
      setIsLoadingData(false);
    }
  }, [integration]);

  // Fetch when options are expanded
  useEffect(() => {
    if (showOptions && notionDatabases.length === 0) {
      fetchNotionData();
    }
  }, [showOptions, notionDatabases.length, fetchNotionData]);

  // Handle export
  const handleExport = useCallback(async () => {
    if (!integration?.hasApiKey || !feedback || !selectedDatabaseId) return;

    setIsExporting(true);
    setExportResult(null);

    try {
      // Build the feedback payload with ticket draft if available
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

      const response = await fetch("/api/integrations/notion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "createPage",
          apiKey: "stored",
          databaseId: selectedDatabaseId,
          feedback: feedbackPayload,
        }),
      });

      const data = await response.json();

      if (data.page) {
        // Create export record
        await createExport({
          feedbackId,
          provider: "notion",
          externalId: data.page.id,
          externalUrl: data.page.url,
          exportedData: {
            title: data.page.title,
          },
          status: "success",
        });

        setExportResult({
          success: true,
          pageUrl: data.page.url,
          pageTitle: data.page.title,
        });
      } else {
        throw new Error(data.error || "Failed to create page");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Export failed";

      // Log failed export
      await createExport({
        feedbackId,
        provider: "notion",
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
  }, [
    integration,
    feedback,
    ticketDraft,
    selectedDatabaseId,
    feedbackId,
    createExport,
  ]);

  // Notion icon component
  const NotionIcon = () => (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="currentColor"
    >
      <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.98-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.84-.046.933-.56.933-1.167V6.354c0-.606-.233-.933-.746-.886l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.746 0-.933-.234-1.494-.933l-4.577-7.186v6.952l1.448.327s0 .84-1.168.84l-3.22.186c-.094-.187 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.454-.233 4.764 7.279v-6.44l-1.215-.14c-.093-.513.28-.886.747-.933zM2.1 1.408l13.028-.887c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.933.653.933 1.213v15.063c0 .933-.327 1.493-1.494 1.586L5.79 23.086c-.886.047-1.306-.093-1.773-.7L.944 18.107c-.56-.746-.793-1.306-.793-1.96V2.529c0-.653.327-1.214 1.166-1.12z" />
    </svg>
  );

  // Not connected state
  if (!integration?.hasApiKey) {
    return (
      <div className="rounded border border-stone-200 bg-stone-50 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-stone-200 bg-white">
            <NotionIcon />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-medium text-stone-600">Export to Notion</h4>
            <p className="text-xs text-stone-400">
              Connect Notion in settings to export pages
            </p>
          </div>
          <Link
            href="/settings"
            className="flex items-center gap-1 rounded border border-stone-300 px-3 py-1.5 text-xs font-medium text-stone-600 transition-colors hover:border-stone-400"
          >
            <Settings className="h-3 w-3" />
            Connect
          </Link>
        </div>
      </div>
    );
  }

  // Already exported state
  if (existingNotionExport) {
    return (
      <div className="rounded border-2 border-green-200 bg-green-50 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-green-300 bg-green-100">
            <Check className="h-5 w-5 text-green-600" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-medium text-green-700">
              Exported to Notion
            </h4>
            <p className="text-xs text-green-600">
              {existingNotionExport.exportedData?.title || "Page created"}
            </p>
          </div>
          {existingNotionExport.externalUrl && (
            <a
              href={existingNotionExport.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded border-2 border-green-300 bg-white px-3 py-1.5 text-xs font-medium text-green-700 transition-colors hover:bg-green-50"
            >
              View in Notion
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center gap-3 rounded border-2 border-stone-300 bg-stone-50 p-3 text-left transition-colors hover:border-stone-400"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-stone-400 bg-white">
          <NotionIcon />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-medium text-stone-700">Export to Notion</h4>
          <p className="text-xs text-stone-500">
            {ticketDraft
              ? "Use ticket draft to create Notion page"
              : "Create a Notion page from this feedback"}
          </p>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-stone-400" />
        ) : (
          <ChevronDown className="h-5 w-5 text-stone-400" />
        )}
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="rounded border-2 border-stone-300 bg-white p-4">
          {/* Options toggle */}
          <button
            onClick={() => setShowOptions(!showOptions)}
            className="mb-3 flex items-center gap-1 text-xs text-stone-600 hover:underline"
          >
            <Settings className="h-3 w-3" />
            {showOptions ? "Hide options" : "Show options"}
          </button>

          {/* Options */}
          {showOptions && (
            <div className="mb-4 space-y-3 rounded border border-stone-200 bg-stone-50 p-3">
              {isLoadingData ? (
                <div className="flex items-center gap-2 text-xs text-stone-500">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Loading Notion databases...
                </div>
              ) : (
                <>
                  {/* Database selector */}
                  <div>
                    <label className="mb-1 block text-xs font-medium text-stone-600">
                      Database
                    </label>
                    <div className="relative">
                      <select
                        value={selectedDatabaseId}
                        onChange={(e) => setSelectedDatabaseId(e.target.value)}
                        className="w-full appearance-none rounded border border-stone-200 bg-white px-3 py-1.5 pr-8 text-sm focus:border-stone-400 focus:outline-none"
                      >
                        <option value="">Select database...</option>
                        {notionDatabases.map((db) => (
                          <option key={db.id} value={db.id}>
                            {db.icon ? `${db.icon} ` : ""}
                            {db.title}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                    </div>
                    <p className="mt-1 text-xs text-stone-400">
                      Make sure the integration has access to this database
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Export button */}
          <button
            onClick={handleExport}
            disabled={isExporting || !selectedDatabaseId}
            className="flex w-full items-center justify-center gap-2 rounded border-2 border-stone-700 bg-stone-700 px-4 py-2.5 text-sm font-medium text-white shadow-[4px_4px_0px_0px_rgba(168,162,158,0.5)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(168,162,158,0.5)] disabled:opacity-50 disabled:hover:translate-x-0 disabled:hover:translate-y-0"
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating page...
              </>
            ) : (
              <>
                <ExternalLink className="h-4 w-4" />
                Export to Notion
              </>
            )}
          </button>

          {!selectedDatabaseId && !showOptions && (
            <p className="mt-2 text-center text-xs text-stone-500">
              Click &quot;Show options&quot; to select a database
            </p>
          )}

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
                  <span className="flex-1">
                    Created &quot;{exportResult.pageTitle}&quot;
                  </span>
                  {exportResult.pageUrl && (
                    <a
                      href={exportResult.pageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-green-600 hover:underline"
                    >
                      View <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
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
