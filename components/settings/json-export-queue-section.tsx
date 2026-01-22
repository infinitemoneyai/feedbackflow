"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { FileJson, Download, Trash2, Loader2, X } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

interface JsonExportQueueSectionProps {
  teamId: Id<"teams">;
}

export function JsonExportQueueSection({ teamId }: JsonExportQueueSectionProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  // Get JSON export queue
  const queueItems = useQuery(api.feedback.getJsonExportQueue, { teamId });

  // Clear queue mutation
  const clearQueue = useMutation(api.feedback.clearJsonExportQueue);

  const handleDownload = async () => {
    if (!queueItems || queueItems.length === 0) return;

    setIsDownloading(true);
    try {
      // Format data for export
      const exportData = queueItems.filter(item => item !== null).map((item) => ({
        id: item!.feedbackId,
        ref: item!.feedback.ticketNumber || `FB-${item!.feedbackId}`,
        type: item!.feedback.type,
        status: item!.feedback.status,
        priority: item!.feedback.priority,
        title: item!.feedback.title,
        description: item!.feedback.description,
        submitterName: item!.feedback.submitterName,
        submitterEmail: item!.feedback.submitterEmail,
        screenshotUrl: item!.feedback.screenshotUrl,
        recordingUrl: item!.feedback.recordingUrl,
        metadata: item!.feedback.metadata,
        tags: item!.feedback.tags,
        createdAt: new Date(item!.feedback.createdAt).toISOString(),
        updatedAt: new Date(item!.feedback.updatedAt || item!.feedback.createdAt).toISOString(),
      }));

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `feedbackflow-export-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleClear = async () => {
    if (!confirm("Clear the export queue? This will remove all items from the list.")) {
      return;
    }

    setIsClearing(true);
    try {
      await clearQueue({ teamId });
    } catch (error) {
      console.error("Failed to clear queue:", error);
    } finally {
      setIsClearing(false);
    }
  };

  const queueCount = queueItems?.length || 0;

  return (
    <div className="rounded border-2 border-retro-black bg-white shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-retro-black bg-stone-50 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-stone-600 bg-stone-100">
            <FileJson className="h-5 w-5 text-stone-600" />
          </div>
          <div>
            <h3 className="font-semibold text-retro-black">JSON Export Queue</h3>
            <p className="text-xs text-stone-500">
              {queueCount === 0
                ? "No items in queue"
                : `${queueCount} item${queueCount === 1 ? "" : "s"} ready to export`}
            </p>
          </div>
        </div>

        {queueCount > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="flex items-center gap-2 rounded border-2 border-retro-black bg-retro-black px-4 py-2 text-sm font-medium text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.25)] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none disabled:opacity-50"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Download JSON
                </>
              )}
            </button>
            <button
              onClick={handleClear}
              disabled={isClearing}
              className="flex items-center gap-2 rounded border-2 border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:border-red-300 hover:bg-red-50 disabled:opacity-50"
            >
              {isClearing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        {queueCount === 0 ? (
          <div className="py-8 text-center">
            <FileJson className="mx-auto mb-3 h-12 w-12 text-stone-300" />
            <h4 className="mb-1 font-medium text-stone-600">No items in queue</h4>
            <p className="text-sm text-stone-500">
              Use &quot;Add to JSON Export Queue&quot; from the ticket sidebar to add items
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="mb-3 text-sm text-stone-600">
              Items in queue will be exported as a single JSON file. Download the file and then
              clear the queue to start fresh.
            </p>
            <div className="max-h-[300px] space-y-2 overflow-y-auto">
              {queueItems?.filter(item => item !== null).map((item) => (
                <div
                  key={item!.exportId}
                  className="flex items-start justify-between rounded border border-stone-200 bg-stone-50 p-3"
                >
                  <div className="flex-1">
                    <div className="font-medium text-retro-black">{item!.feedback.title}</div>
                    <div className="mt-0.5 text-xs text-stone-500">
                      {item!.feedback.ticketNumber || `FB-${item!.feedbackId}`} • Added{" "}
                      {new Date(item!.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <span
                    className={`ml-2 rounded px-2 py-0.5 text-xs font-medium ${
                      item!.feedback.type === "bug"
                        ? "bg-red-100 text-red-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {item.feedback.type}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
