"use client";

import { useState, useCallback, useEffect, ReactNode } from "react";
import { useQuery, useMutation } from "convex/react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpDown,
  Bug,
  Lightbulb,
  Check,
  X,
  MessageSquare,
  Tag,
  User,
  FileJson,
  Loader2,
} from "lucide-react";
import { Icon } from "@/components/ui/icon";
import { api } from "@/convex/_generated/api";
import { useDashboard } from "./dashboard-layout";
import { cn } from "@/lib/utils";
import { Id } from "@/convex/_generated/dataModel";
import {
  feedbackToPrdExport,
  formatPrdExportJson,
  downloadJson,
  type FeedbackForExport,
  type TicketDraftForExport,
} from "@/lib/exports/json";

/**
 * Highlight matching search terms in text
 * Returns ReactNode with <mark> elements wrapping matched terms
 */
function highlightText(text: string, searchQuery: string): ReactNode {
  if (!searchQuery || searchQuery.trim().length === 0) {
    return text;
  }

  const terms = searchQuery.toLowerCase().split(/\s+/).filter((t) => t.length > 0);
  if (terms.length === 0) {
    return text;
  }

  // Create a regex pattern that matches any of the search terms (case-insensitive)
  const pattern = new RegExp(`(${terms.map(escapeRegex).join("|")})`, "gi");
  const parts = text.split(pattern);

  return parts.map((part, index) => {
    const isMatch = terms.some((term) => part.toLowerCase() === term);
    if (isMatch) {
      return (
        <mark
          key={index}
          className="bg-retro-yellow/40 text-retro-black rounded px-0.5"
        >
          {part}
        </mark>
      );
    }
    return part;
  });
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Routing badges component - shows where a ticket was exported to
 */
function RoutingBadges({ feedbackId }: { feedbackId: Id<"feedback"> }) {
  const exports = useQuery(api.integrations.getExportsByFeedback, { feedbackId });

  if (!exports || exports.length === 0) return null;

  const successfulExports = exports.filter((exp) => exp.status === "success" && exp.provider !== "json");

  if (successfulExports.length === 0) return null;

  return (
    <div className="mt-2 flex items-center gap-1.5">
      {successfulExports.map((exp) => {
        const providerConfig = {
          linear: {
            label: "Linear",
            icon: (
              <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor">
                <path d="M21.41 8.64v6.72h-5.76v-3.36h2.88V8.64a1.44 1.44 0 0 0-1.44-1.44H8.64a1.44 1.44 0 0 0-1.44 1.44V12h2.88v3.36H4.32V8.64A4.32 4.32 0 0 1 8.64 4.32h8.45a4.32 4.32 0 0 1 4.32 4.32z" />
                <path d="M17.09 15.36v-3.36H7.2v3.36a1.44 1.44 0 0 0 1.44 1.44h8.45a4.32 4.32 0 0 1-4.32 4.32H4.32a4.32 4.32 0 0 1 4.32-4.32h8.45z" />
              </svg>
            ),
            color: "border-purple-300 bg-purple-50 text-purple-700 hover:bg-purple-100",
          },
          notion: {
            label: "Notion",
            icon: (
              <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor">
                <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.98-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.84-.046.933-.56.933-1.167V6.354c0-.606-.233-.933-.746-.886l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.746 0-.933-.234-1.494-.933l-4.577-7.186v6.952l1.448.327s0 .84-1.168.84l-3.22.186c-.094-.187 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.454-.233 4.764 7.279v-6.44l-1.215-.14c-.093-.513.28-.886.747-.933zM2.1 1.408l13.028-.887c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.933.653.933 1.213v15.063c0 .933-.327 1.493-1.494 1.586L5.79 23.086c-.886.047-1.306-.093-1.773-.7L.944 18.107c-.56-.746-.793-1.306-.793-1.96V2.529c0-.653.327-1.214 1.166-1.12z" />
              </svg>
            ),
            color: "border-stone-300 bg-stone-50 text-stone-700 hover:bg-stone-100",
          },
        };

        const config = providerConfig[exp.provider as keyof typeof providerConfig];
        if (!config) return null;

        const badge = (
          <span
            className={cn(
              "flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-medium transition-colors",
              config.color
            )}
            title={`Routed to ${config.label}`}
          >
            {config.icon}
            <span>{config.label}</span>
          </span>
        );

        if (exp.externalUrl) {
          return (
            <a
              key={exp._id}
              href={exp.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              {badge}
            </a>
          );
        }

        return <span key={exp._id}>{badge}</span>;
      })}
    </div>
  );
}

/**
 * Format a timestamp as a human-readable time ago string
 */
function formatTimeAgo(timestamp: number, now: number): string {
  const diff = now - timestamp;
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "Just now";
}

type FeedbackType = "bug" | "feature";
type FeedbackStatus = "new" | "triaging" | "drafted" | "exported" | "resolved";
type FeedbackPriority = "low" | "medium" | "high" | "critical";
type SortBy = "createdAt" | "priority" | "status";
type SortOrder = "asc" | "desc";

interface FeedbackFilters {
  type: FeedbackType | null;
  status: FeedbackStatus | null;
  priority: FeedbackPriority | null;
  sortBy: SortBy;
  sortOrder: SortOrder;
}

interface SearchMeta {
  score: number;
  matchedFields: string[];
  matchedCommentIds: string[];
}

interface FeedbackItem {
  _id: Id<"feedback">;
  ticketNumber?: number;
  type: FeedbackType;
  title: string;
  description?: string;
  priority: FeedbackPriority;
  status: FeedbackStatus;
  createdAt: number;
  submitterName?: string;
  submitterEmail?: string;
  screenshotUrl?: string;
  recordingUrl?: string;
  tags: string[];
  _searchMeta?: SearchMeta;
}

export function FeedbackList() {
  const { selectedProjectId, currentView, selectedFeedbackId, setSelectedFeedbackId, searchQuery, filterType } =
    useDashboard();

  const [selectedIds, setSelectedIds] = useState<Set<Id<"feedback">>>(new Set());
  const [showArchived, setShowArchived] = useState(false);
  const [filters, setFilters] = useState<FeedbackFilters>({
    type: filterType,
    status: null,
    priority: null,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  // Update local filters when context filterType changes
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      type: filterType,
    }));
  }, [filterType]);
  const [isBulkExporting, setIsBulkExporting] = useState(false);
  const [bulkExportResult, setBulkExportResult] = useState<{
    success: boolean;
    count: number;
    error?: string;
    provider?: string;
  } | null>(null);

  // Mutation to create export records
  const createExport = useMutation(api.integrations.createExport);
  const updateFeedbackStatus = useMutation(api.feedback.updateFeedbackStatus);

  // Get project details for export
  const project = useQuery(
    api.projects.getProject,
    selectedProjectId ? { projectId: selectedProjectId } : "skip"
  );

  // Check which integrations are connected
  // Check integrations for bulk export buttons
  const linearIntegration = useQuery(
    api.integrations.getLinearIntegration,
    project ? { teamId: project.teamId } : "skip"
  );
  const notionIntegration = useQuery(
    api.integrations.getNotionIntegration,
    project ? { teamId: project.teamId } : "skip"
  );

  const hasLinear = linearIntegration?.hasApiKey && linearIntegration?.isActive;
  const hasNotion = notionIntegration?.hasApiKey && notionIntegration?.isActive;

  // Use searchQuery from dashboard context
  const effectiveSearchQuery = searchQuery || "";

  // Get the current time for formatTimeAgo calculations (stable across render)
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  // Update time every minute to refresh relative timestamps
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Clear selection when view changes
  useEffect(() => {
    setSelectedIds(new Set());
  }, [currentView]);

  // Fetch feedback using Convex real-time query
  const feedbackList = useQuery(
    api.feedback.listFeedback,
    selectedProjectId
      ? {
          projectId: selectedProjectId,
          type: filters.type ?? undefined,
          status: filters.status ?? undefined,
          priority: filters.priority ?? undefined,
          sortBy: filters.sortBy,
          sortOrder: filters.sortOrder,
          view: currentView,
          showArchived,
        }
      : "skip"
  );

  // Search results (only used when searchQuery is set)
  const searchResults = useQuery(
    api.feedback.searchFeedback,
    selectedProjectId && effectiveSearchQuery.length > 0
      ? {
          projectId: selectedProjectId,
          searchQuery: effectiveSearchQuery,
          type: filters.type ?? undefined,
          status: filters.status ?? undefined,
          priority: filters.priority ?? undefined,
          showArchived,
        }
      : "skip"
  );

  // Use search results if searching, otherwise use the regular list
  const displayedFeedback = effectiveSearchQuery.length > 0 ? searchResults : feedbackList;

  // Check if project has ANY feedback at all (across Inbox/Backlog/Resolved)
  // This helps us show the "install widget" CTA only for truly empty projects.
  const anyInboxFeedback = useQuery(
    api.feedback.listFeedback,
    selectedProjectId
      ? {
          projectId: selectedProjectId,
          sortBy: "createdAt",
          sortOrder: "desc",
          view: "inbox",
        }
      : "skip"
  );
  const anyBacklogFeedback = useQuery(
    api.feedback.listFeedback,
    selectedProjectId
      ? {
          projectId: selectedProjectId,
          sortBy: "createdAt",
          sortOrder: "desc",
          view: "backlog",
        }
      : "skip"
  );
  const anyResolvedFeedback = useQuery(
    api.feedback.listFeedback,
    selectedProjectId
      ? {
          projectId: selectedProjectId,
          sortBy: "createdAt",
          sortOrder: "desc",
          view: "resolved",
        }
      : "skip"
  );

  const hasAnyFeedback =
    (anyInboxFeedback?.length ?? 0) +
      (anyBacklogFeedback?.length ?? 0) +
      (anyResolvedFeedback?.length ?? 0) >
    0;

  const priorityColors = {
    low: "border-stone-200 bg-stone-100 text-stone-500",
    medium: "border-retro-peach/20 bg-retro-peach/10 text-retro-peach",
    high: "border-retro-red/20 bg-retro-red/10 text-retro-red",
    critical: "border-retro-red bg-retro-red/20 text-retro-red",
  };

  const handleSelectAll = useCallback(() => {
    if (!displayedFeedback) return;

    if (selectedIds.size === displayedFeedback.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(displayedFeedback.map((f: FeedbackItem) => f._id)));
    }
  }, [displayedFeedback, selectedIds.size]);

  const handleToggleSelect = useCallback(
    (id: Id<"feedback">, event: React.MouseEvent) => {
      event.stopPropagation();
      setSelectedIds((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(id)) {
          newSet.delete(id);
        } else {
          newSet.add(id);
        }
        return newSet;
      });
    },
    []
  );

  const clearFilters = useCallback(() => {
    setFilters({
      type: null,
      status: null,
      priority: null,
      sortBy: "createdAt",
      sortOrder: "desc",
    });
  }, []);

  // Bulk export handler
  const handleBulkExport = useCallback(async (provider: "json" | "linear" | "notion") => {
    if (!displayedFeedback || selectedIds.size === 0 || !project) return;

    setIsBulkExporting(true);
    setBulkExportResult(null);

    try {
      // Get selected feedback items
      const selectedFeedback = displayedFeedback.filter((f: FeedbackItem) =>
        selectedIds.has(f._id)
      );

      if (provider === "json") {
        // Fetch ticket drafts for each feedback (if available)
        const feedbackWithDrafts: Array<{
          feedback: FeedbackForExport;
          ticketDraft: TicketDraftForExport | null;
        }> = [];

        for (const fb of selectedFeedback) {
          const feedbackForExport: FeedbackForExport = {
            _id: fb._id,
            type: fb.type,
            title: fb.title,
            description: fb.description,
            priority: fb.priority,
            status: fb.status,
            tags: fb.tags || [],
            screenshotUrl: fb.screenshotUrl,
            recordingUrl: fb.recordingUrl,
            submitterEmail: fb.submitterEmail,
            submitterName: fb.submitterName,
            createdAt: fb.createdAt,
          };

          feedbackWithDrafts.push({
            feedback: feedbackForExport,
            ticketDraft: null,
          });
        }

        // Generate prd.json export
        const prdExport = feedbackToPrdExport(
          feedbackWithDrafts,
          project.name,
          project.description
        );

        const jsonContent = formatPrdExportJson(prdExport);
        const filename = `${project.name.toLowerCase().replace(/\s+/g, "-")}-feedback-export.json`;

        // Download the file
        downloadJson(jsonContent, filename);

        // Create export records for each feedback item
        for (const { feedback } of feedbackWithDrafts) {
          await createExport({
            feedbackId: feedback._id,
            provider: "json",
            exportedData: { bulkExport: true, projectName: project.name },
            status: "success",
          });
        }
      } else if (provider === "linear" || provider === "notion") {
        // For Linear/Notion, call the API for each selected item
        // First, get the integration settings to get the default team/database
        const integration = provider === "linear" ? linearIntegration : notionIntegration;
        
        if (!integration?.settings) {
          throw new Error(
            `${provider === "linear" ? "Linear" : "Notion"} integration not properly configured. Please configure it in Settings.`
          );
        }

        // Get the default team/database from settings
        const linearTeamId = provider === "linear" ? integration.settings.linearTeamId : undefined;
        const notionDatabaseId = provider === "notion" ? integration.settings.notionDatabaseId : undefined;

        if (provider === "linear" && !linearTeamId) {
          throw new Error("No Linear team selected. Please configure Linear integration in Settings.");
        }
        if (provider === "notion" && !notionDatabaseId) {
          throw new Error("No Notion database selected. Please configure Notion integration in Settings.");
        }

        let successCount = 0;
        const errors: string[] = [];

        for (const fb of selectedFeedback) {
          try {
            const feedbackPayload = {
              title: fb.title,
              description: fb.description,
              type: fb.type,
              priority: fb.priority,
              screenshotUrl: fb.screenshotUrl,
              recordingUrl: fb.recordingUrl,
              metadata: fb.metadata,
              submitterName: fb.submitterName,
              submitterEmail: fb.submitterEmail,
              tags: fb.tags,
            };

            const endpoint = provider === "linear" 
              ? "/api/integrations/linear"
              : "/api/integrations/notion";

            const requestBody: any = {
              action: provider === "linear" ? "createIssue" : "createPage",
              apiKey: "stored",
              teamId: project.teamId,
              feedback: feedbackPayload,
            };

            // Add provider-specific parameters
            if (provider === "linear") {
              requestBody.linearTeamId = linearTeamId;
            } else if (provider === "notion") {
              requestBody.databaseId = notionDatabaseId;
            }

            const response = await fetch(endpoint, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(requestBody),
            });

            const data = await response.json();

            if (provider === "linear" && data.issue) {
              await createExport({
                feedbackId: fb._id,
                provider: "linear",
                externalId: data.issue.id,
                externalUrl: data.issue.url,
                exportedData: { identifier: data.issue.identifier, title: data.issue.title },
                status: "success",
              });
              successCount++;
            } else if (provider === "notion" && data.page) {
              await createExport({
                feedbackId: fb._id,
                provider: "notion",
                externalId: data.page.id,
                externalUrl: data.page.url,
                exportedData: { title: data.page.title },
                status: "success",
              });
              successCount++;
            } else {
              errors.push(`${fb.title}: ${data.error || "Export failed"}`);
            }
          } catch (err) {
            errors.push(`${fb.title}: ${err instanceof Error ? err.message : "Export failed"}`);
          }
        }

        if (successCount === 0) {
          throw new Error(errors.join("; "));
        }

        // Move successfully exported tickets to exported status
        for (const fb of selectedFeedback) {
          await updateFeedbackStatus({
            feedbackId: fb._id,
            status: "exported",
          });
        }

        setBulkExportResult({
          success: true,
          count: successCount,
          provider,
          error: errors.length > 0 ? `${errors.length} failed` : undefined,
        });

        // Clear selection after successful export
        setSelectedIds(new Set());
        return;
      }

      // Move tickets to resolved status (for JSON export)
      for (const fb of selectedFeedback) {
        await updateFeedbackStatus({
          feedbackId: fb._id,
          status: "resolved",
        });
      }

      setBulkExportResult({
        success: true,
        count: selectedFeedback.length,
        provider: "json",
      });

      // Clear selection after successful export
      setSelectedIds(new Set());
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Bulk export failed";
      setBulkExportResult({
        success: false,
        count: 0,
        error: errorMessage,
      });
    } finally {
      setIsBulkExporting(false);
    }
  }, [displayedFeedback, selectedIds, project, createExport, updateFeedbackStatus]);

  // Clear bulk export result after a delay
  useEffect(() => {
    if (bulkExportResult) {
      const timer = setTimeout(() => setBulkExportResult(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [bulkExportResult]);

  const hasActiveFilters =
    filters.type !== null ||
    filters.status !== null ||
    filters.priority !== null ||
    filters.sortBy !== "createdAt" ||
    filters.sortOrder !== "desc";

  if (!selectedProjectId) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center rounded-lg border-2 border-dashed border-stone-300 bg-white p-12 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-stone-200 bg-stone-50">
          <Bug className="h-8 w-8 text-stone-400" />
        </div>
        <h3 className="mb-2 font-medium text-retro-black">No project selected</h3>
        <p className="text-sm text-stone-500">
          Select a project from the sidebar to view feedback
        </p>
      </div>
    );
  }

  if (displayedFeedback === undefined) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="animate-pulse rounded border-2 border-stone-200 bg-white p-4"
          >
            <div className="mb-2 flex gap-2">
              <div className="h-5 w-12 rounded bg-stone-200" />
              <div className="h-5 w-16 rounded bg-stone-200" />
            </div>
            <div className="mb-2 h-5 w-3/4 rounded bg-stone-200" />
            <div className="h-4 w-1/2 rounded bg-stone-200" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Bulk selection indicator and actions */}
        {selectedIds.size > 0 && (
          <div className="mr-2 flex items-center gap-2">
            <div className="flex items-center gap-2 rounded border-2 border-retro-blue bg-retro-blue/10 px-3 py-1.5">
              <span className="text-sm font-medium text-retro-blue">
                {selectedIds.size} selected
              </span>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="text-retro-blue hover:text-retro-black"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {/* Bulk export buttons */}
            {currentView === "backlog" ? (
              <>
                {hasLinear && (
                  <button
                    onClick={() => handleBulkExport("linear")}
                    disabled={isBulkExporting}
                    className="flex items-center gap-1.5 rounded border-2 border-retro-black bg-retro-black px-3 py-1.5 text-sm font-medium text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,0.3)] disabled:opacity-50 disabled:hover:translate-x-0 disabled:hover:translate-y-0"
                  >
                    {isBulkExporting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Icon name="solar:export-linear" size={16} />
                    )}
                    Route to Linear
                  </button>
                )}
                {hasNotion && (
                  <button
                    onClick={() => handleBulkExport("notion")}
                    disabled={isBulkExporting}
                    className="flex items-center gap-1.5 rounded border-2 border-retro-black bg-retro-black px-3 py-1.5 text-sm font-medium text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,0.3)] disabled:opacity-50 disabled:hover:translate-x-0 disabled:hover:translate-y-0"
                  >
                    {isBulkExporting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Icon name="solar:export-linear" size={16} />
                    )}
                    Route to Notion
                  </button>
                )}
                <button
                  onClick={() => handleBulkExport("json")}
                  disabled={isBulkExporting}
                  className="flex items-center gap-1.5 rounded border-2 border-emerald-600 bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white shadow-[2px_2px_0px_0px_rgba(5,150,105,0.5)] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(5,150,105,0.5)] disabled:opacity-50 disabled:hover:translate-x-0 disabled:hover:translate-y-0"
                >
                  {isBulkExporting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileJson className="h-4 w-4" />
                  )}
                  Download PRD
                </button>
              </>
            ) : (
              <button
                onClick={() => handleBulkExport("json")}
                disabled={isBulkExporting}
                className="flex items-center gap-1.5 rounded border-2 border-emerald-600 bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white shadow-[2px_2px_0px_0px_rgba(5,150,105,0.5)] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(5,150,105,0.5)] disabled:opacity-50 disabled:hover:translate-x-0 disabled:hover:translate-y-0"
              >
                {isBulkExporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileJson className="h-4 w-4" />
                )}
                Export JSON
              </button>
            )}
          </div>
        )}

        {/* Bulk export result toast */}
        {bulkExportResult && (
          <div
            className={cn(
              "flex items-center gap-2 rounded border-2 px-3 py-1.5 text-sm",
              bulkExportResult.success
                ? "border-green-300 bg-green-50 text-green-700"
                : "border-red-300 bg-red-50 text-red-700"
            )}
          >
            {bulkExportResult.success ? (
              <>
                <Check className="h-4 w-4" />
                <span>
                  {bulkExportResult.provider === "json"
                    ? `Downloaded ${bulkExportResult.count} items as PRD JSON`
                    : `Routed ${bulkExportResult.count} items to ${bulkExportResult.provider === "linear" ? "Linear" : "Notion"}`}
                </span>
              </>
            ) : (
              <>
                <X className="h-4 w-4" />
                <span>{bulkExportResult.error}</span>
              </>
            )}
          </div>
        )}

        {/* Type filter */}
        <select
          value={filters.type || ""}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              type: (e.target.value as FeedbackType) || null,
            }))
          }
          className="rounded border-2 border-stone-200 bg-white px-3 py-1.5 text-sm outline-none transition-colors hover:border-stone-300 focus:border-retro-black"
        >
          <option value="">All Types</option>
          <option value="bug">Bugs</option>
          <option value="feature">Features</option>
        </select>

        {/* Priority filter */}
        <select
          value={filters.priority || ""}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              priority: (e.target.value as FeedbackPriority) || null,
            }))
          }
          className="rounded border-2 border-stone-200 bg-white px-3 py-1.5 text-sm outline-none transition-colors hover:border-stone-300 focus:border-retro-black"
        >
          <option value="">All Priorities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        {/* Sort */}
        <div className="flex items-center gap-1">
          <select
            value={filters.sortBy}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                sortBy: e.target.value as SortBy,
              }))
            }
            className="rounded border-2 border-stone-200 bg-white px-3 py-1.5 text-sm outline-none transition-colors hover:border-stone-300 focus:border-retro-black"
          >
            <option value="createdAt">Date</option>
            <option value="priority">Priority</option>
            <option value="status">Status</option>
          </select>
          <button
            onClick={() =>
              setFilters((prev) => ({
                ...prev,
                sortOrder: prev.sortOrder === "asc" ? "desc" : "asc",
              }))
            }
            className={cn(
              "rounded border-2 border-stone-200 bg-white p-1.5 transition-colors hover:border-stone-300",
              filters.sortOrder === "asc" && "rotate-180"
            )}
            title={filters.sortOrder === "asc" ? "Ascending" : "Descending"}
          >
            <ArrowUpDown className="h-4 w-4 text-stone-500" />
          </button>
        </div>

        {/* Show archived toggle (only in resolved view) */}
        {currentView === "resolved" && (
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={cn(
              "flex items-center gap-1.5 rounded border-2 px-3 py-1.5 text-sm font-medium transition-all",
              showArchived
                ? "border-retro-blue bg-retro-blue text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]"
                : "border-stone-200 bg-white text-stone-600 hover:border-stone-300"
            )}
          >
            <Icon 
              name={showArchived ? "solar:eye-linear" : "solar:eye-closed-linear"} 
              size={16} 
            />
            {showArchived ? "Hide archived" : "Show archived"}
          </button>
        )}

        {/* Clear filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-stone-500 underline hover:text-retro-black"
          >
            Clear filters
          </button>
        )}

        {/* Select all */}
        {displayedFeedback && displayedFeedback.length > 0 && (
          <button
            onClick={handleSelectAll}
            className="ml-auto text-sm text-stone-500 hover:text-retro-black"
          >
            {selectedIds.size === displayedFeedback.length ? "Deselect all" : "Select all"}
          </button>
        )}
      </div>

      {/* Feedback list */}
      {displayedFeedback.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-stone-300 bg-white p-12 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-stone-200 bg-stone-50">
            {currentView === "inbox" ? (
              <Bug className="h-8 w-8 text-stone-400" />
            ) : currentView === "backlog" ? (
              <Lightbulb className="h-8 w-8 text-stone-400" />
            ) : (
              <Check className="h-8 w-8 text-stone-400" />
            )}
          </div>
          <h3 className="mb-2 font-medium text-retro-black">
            {effectiveSearchQuery
              ? "No matching feedback"
              : currentView === "inbox"
                ? "Inbox is empty"
                : currentView === "backlog"
                  ? "Backlog is empty"
                  : "No resolved feedback"}
          </h3>
          <p className="mb-4 text-sm text-stone-500">
            {effectiveSearchQuery
              ? "Try adjusting your search or filters"
              : currentView === "inbox"
                ? "New feedback will appear here"
                : currentView === "backlog"
                  ? "Draft tickets to move them here"
                  : "Exported feedback will appear here"}
          </p>

          {/* Show widget installation CTA if project has no feedback at all */}
          {!effectiveSearchQuery && currentView === "inbox" && !hasAnyFeedback && (
            <div className="mt-5 w-full max-w-lg border-2 border-retro-black bg-retro-paper text-left shadow-[6px_6px_0px_0px_rgba(26,26,26,1)]">
              <div className="flex items-center justify-between border-b-2 border-retro-black bg-retro-yellow px-4 py-3">
                <div className="flex items-center gap-2">
                  <Icon name="solar:widget-linear" size={18} />
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-retro-black">
                    Install Widget
                  </span>
                </div>
                <span className="font-mono text-xs text-stone-600">Start collecting feedback</span>
              </div>

              <div className="p-5">
                <h4 className="text-base font-semibold text-retro-black">
                  Add widget to start getting feedback
                </h4>
                <p className="mt-1 text-sm text-stone-600">
                  Add one script tag to your site. New feedback will instantly show up in this Inbox.
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <Link
                    href="/settings?tab=widget"
                    className="inline-flex items-center gap-2 border-2 border-retro-black bg-retro-blue px-4 py-2 text-sm font-medium text-white shadow-[3px_3px_0px_0px_rgba(26,26,26,1)] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]"
                  >
                    <Icon name="solar:code-square-linear" size={16} />
                    Get install snippet
                  </Link>

                  <Link
                    href="/docs/installation"
                    className="text-sm font-medium text-retro-blue underline underline-offset-2 hover:text-retro-black"
                  >
                    View install docs
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {displayedFeedback.map((feedback: FeedbackItem) => (
            <div
              key={feedback._id}
              onClick={() => setSelectedFeedbackId(feedback._id)}
              className={cn(
                "group relative cursor-pointer border-2 bg-white p-4 transition-all",
                selectedFeedbackId === feedback._id
                  ? "translate-x-[2px] translate-y-[2px] border-retro-blue shadow-[4px_4px_0px_0px_#6B9AC4]"
                  : "border-transparent hover:border-retro-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
                selectedFeedbackId !== feedback._id && "border-b border-stone-200"
              )}
            >
              <div className="flex items-start gap-4">
                {/* Status indicator */}
                <div className="mt-1">
                  <div
                    onClick={(e) => handleToggleSelect(feedback._id, e)}
                    className={cn(
                      "flex h-4 w-4 cursor-pointer items-center justify-center rounded-full border transition-colors",
                      selectedIds.has(feedback._id)
                        ? "border-retro-blue bg-retro-blue"
                        : feedback.priority === "critical" || feedback.priority === "high"
                          ? "border-retro-black bg-retro-red"
                          : "border-stone-300 hover:border-retro-black"
                    )}
                  >
                    {selectedIds.has(feedback._id) && (
                      <Check className="h-2.5 w-2.5 text-white" />
                    )}
                    {!selectedIds.has(feedback._id) && (feedback.priority === "critical" || feedback.priority === "high") && (
                      <div className="h-1.5 w-1.5 rounded-full bg-white" />
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="font-mono text-xs text-stone-400">
                      {project?.code && feedback.ticketNumber ? `#${project.code}-${feedback.ticketNumber}` : `#${feedback._id.slice(-3).toUpperCase()}`} • {formatTimeAgo(feedback.createdAt, currentTime)}
                    </span>
                    <div className="flex gap-2">
                      {/* Priority badge */}
                      <span
                        className={cn(
                          "rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                          priorityColors[feedback.priority]
                        )}
                      >
                        {feedback.priority === "critical" ? "High Priority" : feedback.priority}
                      </span>
                    </div>
                  </div>

                  <h3 className="mb-1 truncate text-base font-medium text-retro-black">
                    {effectiveSearchQuery
                      ? highlightText(feedback.title, effectiveSearchQuery)
                      : feedback.title}
                  </h3>

                  {feedback.description && (
                    <p className="truncate text-sm text-stone-500">
                      {effectiveSearchQuery
                        ? highlightText(feedback.description, effectiveSearchQuery)
                        : feedback.description}
                    </p>
                  )}

                  {/* Search match indicators (only show when searching) */}
                  {effectiveSearchQuery && feedback._searchMeta && (
                    <div className="mt-2 flex items-center gap-1">
                      {feedback._searchMeta.matchedFields.includes("comments") && (
                        <span
                          className="flex items-center rounded border border-retro-yellow/30 bg-retro-yellow/10 px-1 py-0.5"
                          title="Match found in comments"
                        >
                          <MessageSquare className="h-3 w-3 text-retro-yellow" />
                        </span>
                      )}
                      {feedback._searchMeta.matchedFields.includes("tags") && (
                        <span
                          className="flex items-center rounded border border-retro-yellow/30 bg-retro-yellow/10 px-1 py-0.5"
                          title="Match found in tags"
                        >
                          <Tag className="h-3 w-3 text-retro-yellow" />
                        </span>
                      )}
                      {feedback._searchMeta.matchedFields.includes("submitter") && (
                        <span
                          className="flex items-center rounded border border-retro-yellow/30 bg-retro-yellow/10 px-1 py-0.5"
                          title="Match found in submitter info"
                        >
                          <User className="h-3 w-3 text-retro-yellow" />
                        </span>
                      )}
                    </div>
                  )}

                  {/* Routing badges (show for exported/resolved tickets) */}
                  {(feedback.status === "exported" || feedback.status === "resolved") && (
                    <RoutingBadges feedbackId={feedback._id} />
                  )}
                </div>

                {/* Thumbnail */}
                {feedback.screenshotUrl ? (
                  <div className="relative hidden h-12 w-16 flex-shrink-0 overflow-hidden border border-stone-200 bg-stone-100 sm:block">
                    <Image
                      src={feedback.screenshotUrl}
                      alt="Screenshot thumbnail"
                      fill
                      sizes="64px"
                      className="object-cover"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div className="hidden h-12 w-16 flex-shrink-0 items-center justify-center border border-stone-200 bg-stone-100 text-stone-300 sm:flex">
                    <Icon name="solar:gallery-wide-linear" size={16} />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Results count */}
      {displayedFeedback && displayedFeedback.length > 0 && (
        <div className="text-center font-mono text-xs text-stone-400">
          {displayedFeedback.length} feedback item
          {displayedFeedback.length !== 1 ? "s" : ""}
          {effectiveSearchQuery && ` matching "${effectiveSearchQuery}"`}
        </div>
      )}
    </div>
  );
}
