"use client";

import { useCallback, useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  feedbackToPrdExport,
  formatPrdExportJson,
  downloadJson,
  type FeedbackForExport,
  type TicketDraftForExport,
} from "@/lib/exports/json";

export type BulkExportProvider = "json" | "linear" | "notion";

export type BulkExportItemStatus = "pending" | "exporting" | "success" | "error";

export interface BulkExportResult {
  success: boolean;
  count: number;
  error?: string;
  provider?: string;
}

/** The slice of a feedback item the export engine needs (FeedbackItem satisfies it). */
export interface BulkExportItem {
  _id: Id<"feedback">;
  type: "bug" | "feature";
  title: string;
  description?: string;
  priority: "low" | "medium" | "high" | "critical";
  status: "new" | "triaging" | "drafted" | "exported" | "resolved";
  tags: string[];
  screenshotUrl?: string;
  recordingUrl?: string;
  submitterEmail?: string;
  submitterName?: string;
  createdAt: number;
  metadata?: unknown;
}

export interface BulkExportProject {
  teamId: Id<"teams">;
  name: string;
  description?: string;
}

export interface BulkExportIntegration {
  settings?: {
    linearTeamId?: string;
    notionDatabaseId?: string;
  } | null;
}

export interface UseBulkExportOptions {
  project: BulkExportProject | null | undefined;
  linearIntegration: BulkExportIntegration | null | undefined;
  notionIntegration: BulkExportIntegration | null | undefined;
  /** Called after a successful export (e.g. to clear the selection). */
  onExportComplete?: () => void;
  /** How long the result toast stays before auto-clearing. */
  resultResetMs?: number;
}

export interface UseBulkExportReturn {
  /** Run the bulk export for the given items against a provider. */
  startExport: (provider: BulkExportProvider, items: BulkExportItem[]) => Promise<void>;
  /** Per-item progress, keyed by feedback id. */
  itemStatuses: Record<string, BulkExportItemStatus>;
  isExporting: boolean;
  /** Outcome toast payload; auto-clears after `resultResetMs`. */
  result: BulkExportResult | null;
}

const RESULT_RESET_MS = 5000;

/**
 * The bulk-export engine relocated out of feedback-list.tsx: per-provider
 * request assembly, response interpretation, and per-item status bookkeeping
 * for JSON download, Linear, and Notion exports. Endpoints, request bodies,
 * status transitions, and error semantics are preserved verbatim.
 */
export function useBulkExport(options: UseBulkExportOptions): UseBulkExportReturn {
  const {
    project,
    linearIntegration,
    notionIntegration,
    onExportComplete,
    resultResetMs = RESULT_RESET_MS,
  } = options;

  const [isExporting, setIsExporting] = useState(false);
  const [result, setResult] = useState<BulkExportResult | null>(null);
  const [itemStatuses, setItemStatuses] = useState<Record<string, BulkExportItemStatus>>({});

  const createExport = useMutation(api.integrations.createExport);
  const updateFeedbackStatus = useMutation(api.feedback.updateFeedbackStatus);

  // Clear the export result after a delay (relocated from feedback-list.tsx).
  useEffect(() => {
    if (result) {
      const timer = setTimeout(() => setResult(null), resultResetMs);
      return () => clearTimeout(timer);
    }
  }, [result, resultResetMs]);

  const setItemStatus = useCallback((id: string, status: BulkExportItemStatus) => {
    setItemStatuses((prev) => ({ ...prev, [id]: status }));
  }, []);

  const startExport = useCallback(
    async (provider: BulkExportProvider, items: BulkExportItem[]) => {
      if (items.length === 0 || !project) return;

      setIsExporting(true);
      setResult(null);
      setItemStatuses(
        Object.fromEntries(items.map((item) => [item._id, "pending" as const]))
      );

      try {
        if (provider === "json") {
          // Fetch ticket drafts for each feedback (if available)
          const feedbackWithDrafts: Array<{
            feedback: FeedbackForExport;
            ticketDraft: TicketDraftForExport | null;
          }> = [];

          for (const fb of items) {
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
            setItemStatus(feedback._id, "exporting");
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

          for (const fb of items) {
            setItemStatus(fb._id, "exporting");
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

              const requestBody: Record<string, unknown> = {
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
                setItemStatus(fb._id, "success");
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
                setItemStatus(fb._id, "success");
              } else {
                errors.push(`${fb.title}: ${data.error || "Export failed"}`);
                setItemStatus(fb._id, "error");
              }
            } catch (err) {
              errors.push(`${fb.title}: ${err instanceof Error ? err.message : "Export failed"}`);
              setItemStatus(fb._id, "error");
            }
          }

          if (successCount === 0) {
            throw new Error(errors.join("; "));
          }

          // Move successfully exported tickets to exported status
          for (const fb of items) {
            await updateFeedbackStatus({
              feedbackId: fb._id,
              status: "exported",
            });
          }

          setResult({
            success: true,
            count: successCount,
            provider,
            error: errors.length > 0 ? `${errors.length} failed` : undefined,
          });

          // Clear selection after successful export
          onExportComplete?.();
          return;
        }

        // Move tickets to resolved status (for JSON export)
        for (const fb of items) {
          await updateFeedbackStatus({
            feedbackId: fb._id,
            status: "resolved",
          });
          setItemStatus(fb._id, "success");
        }

        setResult({
          success: true,
          count: items.length,
          provider: "json",
        });

        // Clear selection after successful export
        onExportComplete?.();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Bulk export failed";
        setResult({
          success: false,
          count: 0,
          error: errorMessage,
        });
      } finally {
        setIsExporting(false);
      }
    },
    [
      project,
      linearIntegration,
      notionIntegration,
      createExport,
      updateFeedbackStatus,
      onExportComplete,
      setItemStatus,
    ]
  );

  return {
    startExport,
    itemStatuses,
    isExporting,
    result,
  };
}
