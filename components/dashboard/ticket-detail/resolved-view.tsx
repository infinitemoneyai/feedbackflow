"use client";

import { Icon } from "@/components/ui/icon";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Id } from "@/convex/_generated/dataModel";
import { useState } from "react";

interface TicketDraft {
  title: string;
  description: string;
  acceptanceCriteria?: string[];
}

interface SolutionSuggestions {
  summary: string;
  nextSteps?: string[];
}

interface Export {
  _id: Id<"exports">;
  provider: string;
  status: string;
  externalUrl?: string;
  errorMessage?: string;
  createdAt: number;
}

interface Feedback {
  status: string;
  resolvedAt?: number;
}

interface ResolvedViewProps {
  feedback: Feedback;
  ticketDraft?: TicketDraft | null;
  solutionSuggestions?: SolutionSuggestions | null;
  exports?: Export[] | null;
}

export function ResolvedView({
  feedback,
  ticketDraft,
  solutionSuggestions,
  exports,
}: ResolvedViewProps) {
  const hasSolution = ticketDraft || solutionSuggestions;
  const hasRouting = exports && exports.length > 0;
  
  const [isSolutionExpanded, setIsSolutionExpanded] = useState(!!hasSolution);
  const [isRoutingExpanded, setIsRoutingExpanded] = useState(!!hasRouting);

  const formatDateTime = (timestamp: number) => {
    try {
      return new Intl.DateTimeFormat(undefined, {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(timestamp));
    } catch {
      return new Date(timestamp).toLocaleString();
    }
  };

  return (
    <>
      {/* Solution (read-only) */}
      <details
        open={isSolutionExpanded}
        onToggle={(e) => setIsSolutionExpanded((e.target as HTMLDetailsElement).open)}
        className="group rounded border-2 border-retro-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] transition-all duration-300 ease-in-out"
      >
        <summary className={`flex cursor-pointer items-center justify-between transition-all duration-200 ${
          hasSolution ? 'p-4 hover:bg-stone-50' : 'p-2 hover:bg-stone-50/50'
        }`}>
          <div className="flex items-center gap-2">
            <Icon 
              name="solar:check-circle-linear" 
              className={`transition-all duration-200 ${
                hasSolution ? 'text-retro-blue' : 'text-stone-400'
              }`}
              size={hasSolution ? 18 : 16} 
            />
            <span className={`font-mono uppercase tracking-wider transition-all duration-200 ${
              hasSolution
                ? 'text-sm font-bold text-stone-700'
                : 'text-xs font-medium text-stone-500'
            }`}>
              {hasSolution ? 'Solution' : 'Solution (Empty)'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {hasSolution && (
              <div className="text-xs text-stone-500">
                {feedback.status === "resolved"
                  ? feedback.resolvedAt
                    ? `Resolved ${formatDateTime(feedback.resolvedAt)}`
                    : "Resolved"
                  : exports && exports.length > 0
                    ? `Exported ${formatDateTime(Math.max(...exports.map((e) => e.createdAt)))}`
                    : "Exported"}
              </div>
            )}
            <Icon
              name="solar:alt-arrow-down-linear"
              size={hasSolution ? 18 : 14}
              className="text-stone-400 transition-transform duration-200 group-open:rotate-180"
            />
          </div>
        </summary>
        <div className="space-y-4 border-t-2 border-stone-200 p-4 animate-in fade-in slide-in-from-top-2 duration-300">
          {ticketDraft ? (
            <>
              <div className="text-sm font-semibold text-stone-800">{ticketDraft.title}</div>
              <div className="prose prose-sm prose-stone max-w-none overflow-wrap-anywhere break-words leading-relaxed [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_*]:break-words [&_code]:break-all [&_code]:rounded [&_code]:border [&_code]:border-stone-200 [&_code]:bg-stone-50 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-xs [&_code]:font-mono [&_code]:text-stone-700 [&_pre]:overflow-x-auto [&_pre]:rounded [&_pre]:border-2 [&_pre]:border-retro-black [&_pre]:bg-stone-50 [&_pre]:p-3 [&_pre_code]:border-0 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:break-normal [&_ul]:my-2 [&_ol]:my-2 [&_li]:my-1 [&_strong]:font-semibold [&_strong]:text-stone-900 [&_h1]:text-lg [&_h1]:font-bold [&_h1]:text-stone-900 [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-stone-900 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-stone-800">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {ticketDraft.description}
                </ReactMarkdown>
              </div>
              {ticketDraft.acceptanceCriteria && ticketDraft.acceptanceCriteria.length > 0 && (
                <div className="rounded border-2 border-stone-200 bg-stone-50 p-3">
                  <div className="mb-2 font-mono text-[10px] font-bold uppercase tracking-wider text-stone-400">
                    Acceptance Criteria
                  </div>
                  <ul className="space-y-1.5">
                    {ticketDraft.acceptanceCriteria.map((criterion: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-stone-700">
                        <Icon
                          name="solar:check-circle-linear"
                          size={16}
                          className="mt-0.5 flex-shrink-0 text-stone-400"
                        />
                        <span className="min-w-0 break-words">{criterion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : solutionSuggestions ? (
            <>
              <div className="text-sm font-medium text-stone-800">
                {solutionSuggestions.summary}
              </div>
              {solutionSuggestions.nextSteps && solutionSuggestions.nextSteps.length > 0 && (
                <div className="rounded border border-stone-200 bg-stone-50 p-3">
                  <div className="mb-2 font-mono text-[10px] font-bold uppercase tracking-wider text-stone-400">
                    Next steps
                  </div>
                  <ul className="list-disc space-y-1 pl-5 text-sm text-stone-700">
                    {solutionSuggestions.nextSteps.map((s: string, idx: number) => (
                      <li key={idx} className="break-words">
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <div className="py-6 text-center">
              <div className="mb-3 flex justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-stone-200 bg-stone-50">
                  <Icon name="solar:document-text-linear" className="text-stone-400" size={24} />
                </div>
              </div>
              <p className="text-sm text-stone-500">
                No solution captured for this ticket yet.
              </p>
            </div>
          )}
        </div>
      </details>

      {/* Routing timeline */}
      <details
        open={isRoutingExpanded}
        onToggle={(e) => setIsRoutingExpanded((e.target as HTMLDetailsElement).open)}
        className="group rounded border-2 border-retro-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] transition-all duration-300 ease-in-out"
      >
        <summary className={`flex cursor-pointer items-center justify-between transition-all duration-200 ${
          hasRouting ? 'p-4 hover:bg-stone-50' : 'p-2 hover:bg-stone-50/50'
        }`}>
          <div className="flex items-center gap-2">
            <Icon 
              name="solar:route-linear" 
              className={`transition-all duration-200 ${
                hasRouting ? 'text-stone-600' : 'text-stone-400'
              }`}
              size={hasRouting ? 18 : 16} 
            />
            <span className={`font-mono uppercase tracking-wider transition-all duration-200 ${
              hasRouting
                ? 'text-sm font-bold text-stone-700'
                : 'text-xs font-medium text-stone-500'
            }`}>
              {hasRouting ? 'Routing timeline' : 'Routing timeline (Empty)'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {hasRouting && (
              <div className="text-xs text-stone-500">
                {exports.length} event{exports.length === 1 ? "" : "s"}
              </div>
            )}
            <Icon
              name="solar:alt-arrow-down-linear"
              size={hasRouting ? 18 : 14}
              className="text-stone-400 transition-transform duration-200 group-open:rotate-180"
            />
          </div>
        </summary>
        <div className="border-t-2 border-stone-200 p-4 animate-in fade-in slide-in-from-top-2 duration-300">
          {exports && exports.length > 0 ? (
            <ul className="space-y-2">
              {[...exports]
                .sort((a, b) => a.createdAt - b.createdAt)
                .map((exp) => {
                  const providerLabel =
                    exp.provider === "linear"
                      ? "Linear"
                      : exp.provider === "notion"
                        ? "Notion"
                        : "prd.json";

                  return (
                    <li
                      key={exp._id}
                      className="flex items-start justify-between gap-3 rounded border border-stone-200 bg-stone-50 p-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-stone-800">
                            Routed to {providerLabel}
                          </span>
                          <span
                            className={`rounded px-2 py-0.5 text-[11px] font-medium ${
                              exp.status === "success"
                                ? "bg-retro-blue/10 text-retro-blue"
                                : "bg-retro-red/10 text-retro-red"
                            }`}
                          >
                            {exp.status === "success" ? "Success" : "Failed"}
                          </span>
                        </div>
                        {exp.externalUrl && (
                          <a
                            href={exp.externalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="mt-1 inline-flex items-center gap-1 text-xs text-retro-blue hover:underline"
                          >
                            Open {providerLabel}
                            <Icon name="solar:arrow-right-up-linear" size={12} />
                          </a>
                        )}
                        {exp.errorMessage && exp.status === "failed" && (
                          <div className="mt-1 text-xs text-retro-red">{exp.errorMessage}</div>
                        )}
                      </div>
                      <div className="whitespace-nowrap text-xs text-stone-500">
                        {formatDateTime(exp.createdAt)}
                      </div>
                    </li>
                  );
                })}

              {feedback.resolvedAt && (
                <li className="flex items-start justify-between gap-3 rounded border border-stone-200 bg-white p-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-stone-800">Resolved</span>
                      <span className="rounded bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-600">
                        Closed
                      </span>
                    </div>
                  </div>
                  <div className="whitespace-nowrap text-xs text-stone-500">
                    {formatDateTime(feedback.resolvedAt)}
                  </div>
                </li>
              )}
            </ul>
          ) : (
            <div className="py-6 text-center">
              <div className="mb-3 flex justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-stone-200 bg-stone-50">
                  <Icon name="solar:route-linear" className="text-stone-400" size={24} />
                </div>
              </div>
              <p className="text-sm text-stone-500">
                No routing history found for this ticket.
              </p>
            </div>
          )}
        </div>
      </details>
    </>
  );
}
