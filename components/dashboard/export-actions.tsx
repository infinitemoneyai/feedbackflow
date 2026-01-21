"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { ExternalLink, FileJson, Loader2, Check, AlertCircle } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface ExportActionsProps {
  feedbackId: Id<"feedback">;
  teamId: Id<"teams">;
}

export function ExportActions({ feedbackId, teamId }: ExportActionsProps) {
  const [exportingTo, setExportingTo] = useState<"linear" | "notion" | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [addingToQueue, setAddingToQueue] = useState(false);

  // Check which integrations are connected
  const linearIntegration = useQuery(api.integrations.getLinearIntegration, { teamId });
  const notionIntegration = useQuery(api.integrations.getNotionIntegration, { teamId });

  // Check if already exported
  const exports = useQuery(api.integrations.getExportsByFeedback, { feedbackId });

  // Mutations (we'll need to import the actual export functions)
  const addToJsonQueue = useMutation(api.feedback.addToJsonExportQueue);

  const hasLinear = linearIntegration?.hasApiKey && linearIntegration?.isActive;
  const hasNotion = notionIntegration?.hasApiKey && notionIntegration?.isActive;
  const hasAnyIntegration = hasLinear || hasNotion;

  // Check if already exported to each platform
  const linearExport = exports?.find((e) => e.provider === "linear");
  const notionExport = exports?.find((e) => e.provider === "notion");

  const handleAddToJsonQueue = async () => {
    setAddingToQueue(true);
    setExportError(null);
    try {
      await addToJsonQueue({ feedbackId });
    } catch (error) {
      setExportError(error instanceof Error ? error.message : "Failed to add to export queue");
    } finally {
      setAddingToQueue(false);
    }
  };

  // If no integrations are connected
  if (!hasAnyIntegration) {
    return (
      <div className="space-y-3">
        <div className="rounded border-2 border-stone-200 bg-stone-50 p-4 text-center">
          <AlertCircle className="mx-auto mb-2 h-8 w-8 text-stone-400" />
          <h4 className="mb-1 font-medium text-stone-600">No Integrations Connected</h4>
          <p className="mb-3 text-sm text-stone-500">
            Connect Linear or Notion to export issues
          </p>
          <Link
            href="/settings"
            className="inline-flex items-center gap-2 rounded border-2 border-retro-black bg-white px-4 py-2 text-sm font-medium transition-colors hover:bg-stone-50"
          >
            Connect Integration
          </Link>
        </div>

        {/* JSON export option */}
        <button
          onClick={handleAddToJsonQueue}
          disabled={addingToQueue}
          className="flex w-full items-center justify-center gap-2 rounded border-2 border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-600 transition-colors hover:border-stone-300 hover:bg-stone-50 disabled:opacity-50"
        >
          {addingToQueue ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Adding...
            </>
          ) : (
            <>
              <FileJson className="h-4 w-4" />
              Add to JSON Export Queue
            </>
          )}
        </button>
        {exportError && (
          <p className="text-xs text-red-600">{exportError}</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Linear export */}
      {hasLinear && (
        <div>
          {linearExport ? (
            <div className="flex items-center justify-between rounded border-2 border-green-200 bg-green-50 px-4 py-3">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">Exported to Linear</span>
              </div>
              {linearExport.externalUrl && (
                <a
                  href={linearExport.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-green-600 hover:text-green-700 hover:underline"
                >
                  View
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          ) : (
            <Link
              href={`#linear-export-${feedbackId}`}
              className="flex w-full items-center justify-center gap-2 rounded border-2 border-retro-black bg-retro-black px-4 py-3 text-sm font-medium text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="currentColor"
              >
                <path d="M21.41 8.64v6.72h-5.76v-3.36h2.88V8.64a1.44 1.44 0 0 0-1.44-1.44H8.64a1.44 1.44 0 0 0-1.44 1.44V12h2.88v3.36H4.32V8.64A4.32 4.32 0 0 1 8.64 4.32h8.45a4.32 4.32 0 0 1 4.32 4.32z" />
                <path d="M17.09 15.36v-3.36H7.2v3.36a1.44 1.44 0 0 0 1.44 1.44h8.45a4.32 4.32 0 0 1-4.32 4.32H4.32a4.32 4.32 0 0 1 4.32-4.32h8.45z" />
              </svg>
              Send to Linear
            </Link>
          )}
        </div>
      )}

      {/* Notion export */}
      {hasNotion && (
        <div>
          {notionExport ? (
            <div className="flex items-center justify-between rounded border-2 border-green-200 bg-green-50 px-4 py-3">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">Exported to Notion</span>
              </div>
              {notionExport.externalUrl && (
                <a
                  href={notionExport.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-green-600 hover:text-green-700 hover:underline"
                >
                  View
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          ) : (
            <Link
              href={`#notion-export-${feedbackId}`}
              className={cn(
                "flex w-full items-center justify-center gap-2 rounded border-2 px-4 py-3 text-sm font-medium transition-all",
                hasLinear
                  ? "border-stone-200 bg-white text-stone-700 hover:border-stone-300 hover:bg-stone-50"
                  : "border-retro-black bg-retro-black text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
              )}
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="currentColor"
              >
                <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.139c-.093-.514.28-.887.747-.933zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.447-1.632z" />
              </svg>
              Send to Notion
            </Link>
          )}
        </div>
      )}

      {/* JSON export option */}
      <button
        onClick={handleAddToJsonQueue}
        disabled={addingToQueue}
        className="flex w-full items-center justify-center gap-2 rounded border-2 border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-600 transition-colors hover:border-stone-300 hover:bg-stone-50 disabled:opacity-50"
      >
        {addingToQueue ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Adding...
          </>
        ) : (
          <>
            <FileJson className="h-4 w-4" />
            Add to JSON Export Queue
          </>
        )}
      </button>
      {exportError && (
        <p className="text-xs text-red-600">{exportError}</p>
      )}
    </div>
  );
}
