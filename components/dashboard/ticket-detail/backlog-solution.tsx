"use client";

import { Icon } from "@/components/ui/icon";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface TicketDraft {
  title: string;
  description: string;
  acceptanceCriteria?: string[];
}

interface BacklogSolutionProps {
  ticketDraft: TicketDraft;
}

export function BacklogSolution({ ticketDraft }: BacklogSolutionProps) {
  return (
    <div className="rounded border-2 border-retro-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
      <div className="flex items-center justify-between border-b-2 border-stone-200 p-4">
        <div className="flex items-center gap-2">
          <Icon name="solar:check-circle-linear" className="text-retro-blue" size={18} />
          <span className="font-mono text-sm font-bold uppercase tracking-wider text-stone-700">
            Solution
          </span>
        </div>
      </div>
      <div className="space-y-4 p-4">
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
      </div>
    </div>
  );
}
