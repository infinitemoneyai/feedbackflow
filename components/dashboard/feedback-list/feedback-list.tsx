"use client";

import { useState, useCallback, useEffect } from "react";
import { useQuery } from "convex/react";
import { Bug } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useBulkExport, type BulkExportProvider } from "@/lib/hooks/use-bulk-export";
import { useDashboard } from "../dashboard-layout";
import { FeedbackFilters, FeedbackItem } from "./types";
import { FeedbackFiltersBar } from "./feedback-filters";
import { BulkActions } from "./bulk-actions";
import { FeedbackCard } from "./feedback-card";
import { EmptyState } from "./empty-state";

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

  // Get project details for export
  const project = useQuery(
    api.projects.getProject,
    selectedProjectId ? { projectId: selectedProjectId } : "skip"
  );

  // Check integrations for bulk export buttons
  const linearIntegration = useQuery(
    api.integrations.getLinearIntegration,
    project ? { teamId: project.teamId } : "skip"
  );
  const notionIntegration = useQuery(
    api.integrations.getNotionIntegration,
    project ? { teamId: project.teamId } : "skip"
  );

  const hasLinear = !!(linearIntegration?.hasApiKey && linearIntegration?.isActive);
  const hasNotion = !!(notionIntegration?.hasApiKey && notionIntegration?.isActive);

  // Bulk-export engine (request assembly, response interpretation,
  // per-item status bookkeeping) lives in the hook.
  const {
    startExport,
    isExporting: isBulkExporting,
    result: bulkExportResult,
  } = useBulkExport({
    project,
    linearIntegration,
    notionIntegration,
    onExportComplete: () => setSelectedIds(new Set()),
  });

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
          view: currentView as "inbox" | "backlog" | "resolved",
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

  // Check if project has ANY feedback at all (across Inbox/Backlog/Resolved).
  // One counts query replaces the three boolean-only listFeedback queries.
  const viewCounts = useQuery(
    api.feedback.getViewCounts,
    selectedProjectId ? { projectId: selectedProjectId } : "skip"
  );

  const hasAnyFeedback =
    (viewCounts?.inbox ?? 0) + (viewCounts?.backlog ?? 0) + (viewCounts?.resolved ?? 0) > 0;

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

  // Bulk export handler — selection resolution here, the engine in the hook
  const handleBulkExport = useCallback(
    async (provider: BulkExportProvider) => {
      if (!displayedFeedback || selectedIds.size === 0) return;

      const selectedFeedback = displayedFeedback.filter((f: FeedbackItem) =>
        selectedIds.has(f._id)
      );

      await startExport(provider, selectedFeedback);
    },
    [displayedFeedback, selectedIds, startExport]
  );

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
        <p className="text-sm text-stone-500">Select a project from the sidebar to view feedback</p>
      </div>
    );
  }

  if (displayedFeedback === undefined) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse rounded border-2 border-stone-200 bg-white p-4">
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
        <BulkActions
          selectedCount={selectedIds.size}
          onClearSelection={() => setSelectedIds(new Set())}
          onBulkExport={handleBulkExport}
          isBulkExporting={isBulkExporting}
          bulkExportResult={bulkExportResult}
          currentView={currentView as "inbox" | "backlog" | "resolved"}
          hasLinear={hasLinear}
          hasNotion={hasNotion}
        />

        {/* Filters */}
        <FeedbackFiltersBar
          filters={filters}
          onFiltersChange={setFilters}
          onClearFilters={clearFilters}
          currentView={currentView as "inbox" | "backlog" | "resolved"}
          showArchived={showArchived}
          onToggleArchived={() => setShowArchived(!showArchived)}
          hasActiveFilters={hasActiveFilters}
        />

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
        <EmptyState
          currentView={currentView as "inbox" | "backlog" | "resolved"}
          searchQuery={effectiveSearchQuery}
          hasAnyFeedback={hasAnyFeedback}
        />
      ) : (
        <div className="space-y-3">
          {displayedFeedback.map((feedback: FeedbackItem) => (
            <FeedbackCard
              key={feedback._id}
              feedback={feedback}
              isSelected={selectedIds.has(feedback._id)}
              isHighlighted={selectedFeedbackId === feedback._id}
              onSelect={handleToggleSelect}
              onClick={() => setSelectedFeedbackId(feedback._id)}
              searchQuery={effectiveSearchQuery}
              projectCode={project?.code}
              currentTime={currentTime}
            />
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
