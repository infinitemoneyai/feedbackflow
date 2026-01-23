"use client";

import { useState, useCallback, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { Bug } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { useDashboard } from "../dashboard-layout";
import { Id } from "@/convex/_generated/dataModel";
import {
  feedbackToPrdExport,
  formatPrdExportJson,
  downloadJson,
  type FeedbackForExport,
  type TicketDraftForExport,
} from "@/lib/exports/json";
import { FeedbackFilters, FeedbackItem, BulkExportResult } from "./types";
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

  const [isBulkExporting, setIsBulkExporting] = useState(false);
  const [bulkExportResult, setBulkExportResult] = useState<BulkExportResult | null>(null);

  // Mutation to create export records
  const createExport = useMutation(api.integrations.createExport);
  const updateFeedbackStatus = useMutation(api.feedback.updateFeedbackStatus);

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
  const handleBulkExport = useCallback(
    async (provider: "json" | "linear" | "notion") => {
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

              const endpoint = provider === "linear" ? "/api/integrations/linear" : "/api/integrations/notion";

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
    },
    [displayedFeedback, selectedIds, project, createExport, updateFeedbackStatus, linearIntegration, notionIntegration]
  );

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
          currentView={currentView}
          hasLinear={hasLinear}
          hasNotion={hasNotion}
        />

        {/* Filters */}
        <FeedbackFiltersBar
          filters={filters}
          onFiltersChange={setFilters}
          onClearFilters={clearFilters}
          currentView={currentView}
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
          currentView={currentView}
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
