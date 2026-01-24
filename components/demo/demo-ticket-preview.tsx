"use client";

import { useState, useCallback } from "react";
import { Icon } from "@/components/ui/icon";
import type { DemoTicket } from "@/lib/demo/types";

interface DemoTicketPreviewProps {
  ticket: DemoTicket;
  screenshot: string | null;
}

export function DemoTicketPreview({ ticket, screenshot }: DemoTicketPreviewProps) {
  const [copied, setCopied] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState<"json" | "markdown" | null>(null);

  // Create clean JSON for export (without metadata for cleaner output)
  const exportTicket = {
    id: ticket.id,
    issue: ticket.issue,
    acceptanceCriteria: ticket.acceptanceCriteria,
    priority: ticket.priority,
    type: ticket.type,
    tags: ticket.tags,
    notes: ticket.notes,
  };

  const handleCopyJson = useCallback(async () => {
    const json = JSON.stringify(exportTicket, null, 2);
    await navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [exportTicket]);

  const handleDownload = useCallback(
    (format: "json" | "markdown") => {
      setDownloadFormat(format);

      let content: string;
      let filename: string;
      let mimeType: string;

      if (format === "json") {
        content = JSON.stringify(exportTicket, null, 2);
        filename = `${ticket.id}.json`;
        mimeType = "application/json";
      } else {
        content = generateMarkdown(ticket);
        filename = `${ticket.id}.md`;
        mimeType = "text/markdown";
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setTimeout(() => setDownloadFormat(null), 1000);
    },
    [ticket, exportTicket]
  );

  // Priority label helper
  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 1: return "P1 - Critical";
      case 2: return "P2 - High";
      case 3: return "P3 - Medium";
      case 4: return "P4 - Low";
      default: return `P${priority}`;
    }
  };

  const getPriorityStyle = (priority: number) => {
    switch (priority) {
      case 1: return "border-retro-red bg-retro-red text-white";
      case 2: return "border-retro-red/30 bg-retro-red/10 text-retro-red";
      case 3: return "border-retro-peach/30 bg-retro-peach/10 text-retro-peach";
      default: return "border-stone-300 bg-stone-100 text-stone-500";
    }
  };

  return (
    <div className="space-y-6">
      {/* Success Header */}
      <div className="flex items-center justify-center gap-3 rounded border-2 border-green-500/30 bg-green-500/10 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500 text-white">
          <Icon name="solar:check-linear" size={24} />
        </div>
        <div>
          <p className="font-medium text-green-700">Ticket Generated!</p>
          <p className="text-sm text-green-600">Ready to copy or download.</p>
        </div>
      </div>

      {/* Ticket Card */}
      <div className="overflow-hidden border-2 border-retro-black shadow-retro">
        {/* Ticket Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-retro-black bg-stone-50 px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded border-2 border-retro-black bg-white px-3 py-1 font-mono text-sm font-bold">
              {ticket.id}
            </span>
            <span
              className={`rounded border px-2 py-1 text-xs font-bold uppercase ${
                ticket.type === "bug"
                  ? "border-retro-red/30 bg-retro-red/10 text-retro-red"
                  : "border-retro-blue/30 bg-retro-blue/10 text-retro-blue"
              }`}
            >
              {ticket.type}
            </span>
            <span className={`rounded border px-2 py-1 text-xs font-bold uppercase ${getPriorityStyle(ticket.priority)}`}>
              {getPriorityLabel(ticket.priority)}
            </span>
          </div>
          <span className="font-mono text-xs text-stone-400">
            {new Date(ticket.metadata.timestamp).toLocaleString()}
          </span>
        </div>

        {/* Ticket Content */}
        <div className="p-6 space-y-6">
          {/* Issue Title */}
          <div>
            <h4 className="mb-2 font-mono text-xs uppercase tracking-wider text-stone-400">
              Issue
            </h4>
            <h3 className="text-xl font-medium">{ticket.issue}</h3>
          </div>

          {/* Screenshot */}
          {screenshot && (
            <div>
              <h4 className="mb-2 font-mono text-xs uppercase tracking-wider text-stone-400">
                Screenshot
              </h4>
              <div className="overflow-hidden rounded border border-stone-200">
                <img
                  src={screenshot}
                  alt="Issue screenshot"
                  className="h-auto max-h-64 w-full object-contain bg-stone-50"
                />
              </div>
            </div>
          )}

          {/* Acceptance Criteria */}
          <div>
            <h4 className="mb-2 font-mono text-xs uppercase tracking-wider text-stone-400">
              Acceptance Criteria
            </h4>
            <ul className="space-y-2 rounded border border-stone-200 bg-stone-50 p-4">
              {ticket.acceptanceCriteria.map((criteria, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border border-stone-300 bg-white">
                    <Icon name="solar:check-linear" size={12} className="text-stone-400" />
                  </div>
                  {criteria}
                </li>
              ))}
            </ul>
          </div>

          {/* Notes */}
          <div>
            <h4 className="mb-2 font-mono text-xs uppercase tracking-wider text-stone-400">
              Notes
            </h4>
            <div className="rounded border border-stone-200 bg-stone-50 p-4 text-sm text-stone-600">
              {ticket.notes}
            </div>
          </div>

          {/* Reproduction Steps */}
          {ticket.reproSteps.length > 0 && (
            <div>
              <h4 className="mb-2 font-mono text-xs uppercase tracking-wider text-stone-400">
                Reproduction Steps
              </h4>
              <ol className="list-inside list-decimal space-y-1 rounded border border-stone-200 bg-stone-50 p-4 text-sm">
                {ticket.reproSteps.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </div>
          )}

          {/* Tags */}
          <div>
            <h4 className="mb-2 font-mono text-xs uppercase tracking-wider text-stone-400">
              Tags
            </h4>
            <div className="flex flex-wrap gap-2">
              {ticket.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded border border-stone-200 bg-stone-100 px-2 py-1 font-mono text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Metadata */}
          <div>
            <h4 className="mb-2 font-mono text-xs uppercase tracking-wider text-stone-400">
              Technical Context
            </h4>
            <div className="grid grid-cols-3 gap-2 rounded border border-stone-200 bg-stone-50 p-4 font-mono text-xs">
              <div>
                <span className="text-stone-400">Browser</span>
                <p>{ticket.metadata.browser}</p>
              </div>
              <div>
                <span className="text-stone-400">OS</span>
                <p>{ticket.metadata.os}</p>
              </div>
              <div>
                <span className="text-stone-400">Screen</span>
                <p>{ticket.metadata.screenSize}</p>
              </div>
            </div>
          </div>
        </div>

        {/* JSON Preview */}
        <div className="border-t-2 border-retro-black bg-retro-black p-4">
          <h4 className="mb-2 font-mono text-xs uppercase tracking-wider text-stone-400">
            JSON Output
          </h4>
          <pre className="overflow-x-auto rounded bg-stone-900 p-4 font-mono text-xs text-green-400">
            {JSON.stringify(exportTicket, null, 2)}
          </pre>
        </div>

        {/* Actions */}
        <div className="border-t-2 border-retro-black bg-stone-50 p-4">
          <div className="flex flex-wrap gap-3">
            {/* Download Options */}
            <button
              onClick={() => handleDownload("json")}
              className="flex items-center gap-2 rounded border-2 border-retro-black bg-white px-4 py-2 text-sm font-medium transition-all hover:bg-stone-50 shadow-retro-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
            >
              <Icon
                name={downloadFormat === "json" ? "solar:check-linear" : "solar:file-download-linear"}
                size={18}
              />
              Download JSON
            </button>
            <button
              onClick={() => handleDownload("markdown")}
              className="flex items-center gap-2 rounded border-2 border-retro-black bg-white px-4 py-2 text-sm font-medium transition-all hover:bg-stone-50 shadow-retro-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
            >
              <Icon
                name={downloadFormat === "markdown" ? "solar:check-linear" : "solar:file-download-linear"}
                size={18}
              />
              Download Markdown
            </button>
            <button
              onClick={handleCopyJson}
              className="flex items-center gap-2 rounded border-2 border-retro-black bg-retro-yellow px-4 py-2 text-sm font-medium transition-all hover:bg-retro-yellow/80 shadow-retro-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
            >
              <Icon name={copied ? "solar:check-linear" : "solar:copy-linear"} size={18} />
              {copied ? "Copied!" : "Copy JSON"}
            </button>

            {/* Locked Export Options */}
            <div className="flex gap-3 opacity-60">
              <button
                disabled
                className="flex cursor-not-allowed items-center gap-2 rounded border-2 border-stone-300 bg-stone-100 px-4 py-2 text-sm font-medium text-stone-400"
              >
                <Icon name="solar:lock-linear" size={18} />
                Export to Linear
              </button>
              <button
                disabled
                className="flex cursor-not-allowed items-center gap-2 rounded border-2 border-stone-300 bg-stone-100 px-4 py-2 text-sm font-medium text-stone-400"
              >
                <Icon name="solar:lock-linear" size={18} />
                Export to Notion
              </button>
            </div>
          </div>
          <p className="mt-3 text-xs text-stone-500">
            <Icon name="solar:info-circle-linear" size={12} className="mr-1 inline" />
            Sign up to unlock direct exports to Linear, Notion, and more
          </p>
        </div>
      </div>
    </div>
  );
}

// Generate markdown from ticket
function generateMarkdown(ticket: DemoTicket): string {
  const priorityLabel = ticket.priority === 1 ? "Critical" : ticket.priority === 2 ? "High" : ticket.priority === 3 ? "Medium" : "Low";
  
  return `# ${ticket.id}: ${ticket.issue}

**Type:** ${ticket.type}
**Priority:** P${ticket.priority} - ${priorityLabel}
**Tags:** ${ticket.tags.join(", ")}

## Acceptance Criteria

${ticket.acceptanceCriteria.map((c) => `- [ ] ${c}`).join("\n")}

## Notes

${ticket.notes}

## Reproduction Steps

${ticket.reproSteps.map((step, i) => `${i + 1}. ${step}`).join("\n")}

## Technical Context

| Field | Value |
|-------|-------|
| Browser | ${ticket.metadata.browser} |
| OS | ${ticket.metadata.os} |
| Screen Size | ${ticket.metadata.screenSize} |
| Timestamp | ${ticket.metadata.timestamp} |

---
*Generated by FeedbackFlow Demo*
`;
}
