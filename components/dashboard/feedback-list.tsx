"use client";

import { useState, useCallback, useEffect, ReactNode } from "react";
import { useQuery, useMutation } from "convex/react";
import Image from "next/image";
import {
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
  const { selectedProjectId, currentView, selectedFeedbackId, setSelectedFeedbackId, searchQuery } =
    useDashboard();

  const [selectedIds, setSelectedIds] = useState<Set<Id<"feedback">>>(new Set());
  const [filters, setFilters] = useState<FeedbackFilters>({
    type: null,
    status: null,
    priority: null,
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const [isBulkExporting, setIsBulkExporting] = useState(false);
  const [bulkExportResult, setBulkExportResult] = useState<{
    success: boolean;
    count: number;
    error?: string;
  } | null>(null);

  // Mutation to create export records
  const createExport = useMutation(api.integrations.createExport);

  // Get project details for export
  const project = useQuery(
    api.projects.getProject,
    selectedProjectId ? { projectId: selectedProjectId } : "skip"
  );

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
        }
      : "skip"
  );

  // Use search results if searching, otherwise use the regular list
  const displayedFeedback = effectiveSearchQuery.length > 0 ? searchResults : feedbackList;

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
  const handleBulkExport = useCallback(async () => {
    if (!displayedFeedback || selectedIds.size === 0 || !project) return;

    setIsBulkExporting(true);
    setBulkExportResult(null);

    try {
      // Get selected feedback items
      const selectedFeedback = displayedFeedback.filter((f: FeedbackItem) =>
        selectedIds.has(f._id)
      );

      // Fetch ticket drafts for each feedback (if available)
      // Note: We need to fetch these one by one since we don't have a bulk query
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
          ticketDraft: null, // Ticket drafts would need individual fetches
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

      setBulkExportResult({
        success: true,
        count: selectedFeedback.length,
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
  }, [displayedFeedback, selectedIds, project, createExport]);

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
            {/* Bulk export button */}
            <button
              onClick={handleBulkExport}
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
                <span>Exported {bulkExportResult.count} items as prd.json</span>
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
          <p className="text-sm text-stone-500">
            {effectiveSearchQuery
              ? "Try adjusting your search or filters"
              : currentView === "inbox"
                ? "New feedback will appear here"
                : currentView === "backlog"
                  ? "Draft tickets to move them here"
                  : "Exported feedback will appear here"}
          </p>
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
                      #{feedback._id.slice(-3).toUpperCase()} • {formatTimeAgo(feedback.createdAt, currentTime)}
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
