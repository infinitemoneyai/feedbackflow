"use client";

import { ArrowUpDown } from "lucide-react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { FeedbackFilters, FeedbackType, FeedbackPriority, SortBy } from "./types";

interface FeedbackFiltersProps {
  filters: FeedbackFilters;
  onFiltersChange: (filters: FeedbackFilters) => void;
  onClearFilters: () => void;
  currentView: "inbox" | "backlog" | "resolved";
  showArchived: boolean;
  onToggleArchived: () => void;
  hasActiveFilters: boolean;
}

export function FeedbackFiltersBar({
  filters,
  onFiltersChange,
  onClearFilters,
  currentView,
  showArchived,
  onToggleArchived,
  hasActiveFilters,
}: FeedbackFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Type filter */}
      <select
        value={filters.type || ""}
        onChange={(e) =>
          onFiltersChange({
            ...filters,
            type: (e.target.value as FeedbackType) || null,
          })
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
          onFiltersChange({
            ...filters,
            priority: (e.target.value as FeedbackPriority) || null,
          })
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
            onFiltersChange({
              ...filters,
              sortBy: e.target.value as SortBy,
            })
          }
          className="rounded border-2 border-stone-200 bg-white px-3 py-1.5 text-sm outline-none transition-colors hover:border-stone-300 focus:border-retro-black"
        >
          <option value="createdAt">Date</option>
          <option value="priority">Priority</option>
          <option value="status">Status</option>
        </select>
        <button
          onClick={() =>
            onFiltersChange({
              ...filters,
              sortOrder: filters.sortOrder === "asc" ? "desc" : "asc",
            })
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
          onClick={onToggleArchived}
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
          onClick={onClearFilters}
          className="text-sm text-stone-500 underline hover:text-retro-black"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
