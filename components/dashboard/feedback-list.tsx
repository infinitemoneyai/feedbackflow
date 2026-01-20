"use client";

import { useState, useCallback, useEffect } from "react";
import { useQuery } from "convex/react";
import {
  Bug,
  Lightbulb,
  Clock,
  MoreHorizontal,
  Check,
  Image as ImageIcon,
  Video,
  ArrowUpDown,
  X,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import { useDashboard } from "./dashboard-layout";
import { cn } from "@/lib/utils";
import { Id } from "@/convex/_generated/dataModel";

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
        {/* Bulk selection indicator */}
        {selectedIds.size > 0 && (
          <div className="mr-2 flex items-center gap-2 rounded border-2 border-retro-blue bg-retro-blue/10 px-3 py-1.5">
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
        <div className="space-y-2">
          {displayedFeedback.map((feedback: FeedbackItem) => (
            <button
              key={feedback._id}
              onClick={() => setSelectedFeedbackId(feedback._id)}
              className={cn(
                "group w-full rounded border-2 bg-white p-4 text-left transition-all",
                selectedFeedbackId === feedback._id
                  ? "translate-x-[2px] translate-y-[2px] border-retro-blue shadow-[4px_4px_0px_0px_#6B9AC4]"
                  : "border-transparent hover:border-retro-black hover:shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]"
              )}
            >
              <div className="flex items-start gap-3">
                {/* Checkbox */}
                <div
                  onClick={(e) => handleToggleSelect(feedback._id, e)}
                  className={cn(
                    "mt-1 flex h-5 w-5 flex-shrink-0 cursor-pointer items-center justify-center rounded border-2 transition-colors",
                    selectedIds.has(feedback._id)
                      ? "border-retro-blue bg-retro-blue"
                      : "border-stone-300 bg-white group-hover:border-stone-400"
                  )}
                >
                  {selectedIds.has(feedback._id) && (
                    <Check className="h-3 w-3 text-white" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    {/* Type badge */}
                    {feedback.type === "bug" ? (
                      <span className="flex items-center gap-1 rounded border border-retro-red/20 bg-retro-red/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-retro-red">
                        <Bug className="h-3 w-3" />
                        Bug
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 rounded border border-retro-blue/20 bg-retro-blue/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-retro-blue">
                        <Lightbulb className="h-3 w-3" />
                        Feature
                      </span>
                    )}

                    {/* Priority badge */}
                    <span
                      className={cn(
                        "rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                        priorityColors[feedback.priority]
                      )}
                    >
                      {feedback.priority}
                    </span>

                    {/* Media indicators */}
                    {feedback.screenshotUrl && (
                      <span className="flex items-center rounded border border-stone-200 bg-stone-100 px-1 py-0.5">
                        <ImageIcon className="h-3 w-3 text-stone-500" />
                      </span>
                    )}
                    {feedback.recordingUrl && (
                      <span className="flex items-center rounded border border-stone-200 bg-stone-100 px-1 py-0.5">
                        <Video className="h-3 w-3 text-stone-500" />
                      </span>
                    )}
                  </div>

                  <h3 className="mb-1 truncate font-medium text-retro-black">
                    {feedback.title}
                  </h3>

                  {feedback.description && (
                    <p className="line-clamp-2 text-sm text-stone-500">
                      {feedback.description}
                    </p>
                  )}

                  {/* Tags */}
                  {feedback.tags && feedback.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {feedback.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="rounded border border-retro-lavender/30 bg-retro-lavender/10 px-1.5 py-0.5 text-[10px] font-medium text-retro-lavender"
                        >
                          {tag}
                        </span>
                      ))}
                      {feedback.tags.length > 3 && (
                        <span className="text-[10px] text-stone-400">
                          +{feedback.tags.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Thumbnail */}
                {feedback.screenshotUrl ? (
                  <div className="hidden h-16 w-24 flex-shrink-0 overflow-hidden rounded border border-stone-200 sm:block">
                    <img
                      src={feedback.screenshotUrl}
                      alt="Screenshot"
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="hidden h-16 w-24 flex-shrink-0 rounded border border-stone-200 bg-stone-100 sm:block">
                    <div className="flex h-full w-full items-center justify-center text-stone-400">
                      <svg
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
                        <path d="M21 15l-5-5L5 21" strokeWidth="2" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer with metadata */}
              <div className="mt-3 flex items-center justify-between border-t border-stone-100 pt-3">
                <div className="flex items-center gap-2 text-xs text-stone-500">
                  <Clock className="h-3 w-3" />
                  <span>{formatTimeAgo(feedback.createdAt, currentTime)}</span>
                  {(feedback.submitterName || feedback.submitterEmail) && (
                    <>
                      <span className="text-stone-300">•</span>
                      <span>
                        {feedback.submitterName || feedback.submitterEmail}
                      </span>
                    </>
                  )}
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // TODO: Open actions menu
                  }}
                  className="rounded p-1 text-stone-400 transition-colors hover:bg-stone-100 hover:text-retro-black"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </div>
            </button>
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
