"use client";

import { X, Check, FileJson, Loader2 } from "lucide-react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { BulkExportResult } from "./types";

interface BulkActionsProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkExport: (provider: "json" | "linear" | "notion") => void;
  isBulkExporting: boolean;
  bulkExportResult: BulkExportResult | null;
  currentView: "inbox" | "backlog" | "resolved";
  hasLinear: boolean;
  hasNotion: boolean;
}

export function BulkActions({
  selectedCount,
  onClearSelection,
  onBulkExport,
  isBulkExporting,
  bulkExportResult,
  currentView,
  hasLinear,
  hasNotion,
}: BulkActionsProps) {
  if (selectedCount === 0) return null;

  return (
    <>
      <div className="mr-2 flex items-center gap-2">
        <div className="flex items-center gap-2 rounded border-2 border-retro-blue bg-retro-blue/10 px-3 py-1.5">
          <span className="text-sm font-medium text-retro-blue">
            {selectedCount} selected
          </span>
          <button
            onClick={onClearSelection}
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
                onClick={() => onBulkExport("linear")}
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
                onClick={() => onBulkExport("notion")}
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
              onClick={() => onBulkExport("json")}
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
            onClick={() => onBulkExport("json")}
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
    </>
  );
}
