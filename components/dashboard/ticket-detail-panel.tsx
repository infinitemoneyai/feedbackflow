"use client";

import { X, Bug, Lightbulb, MoreHorizontal, Wand2 } from "lucide-react";
import { useDashboard } from "./dashboard-layout";

export function TicketDetailPanel() {
  const { selectedFeedbackId, setSelectedFeedbackId } = useDashboard();

  // If no feedback selected, show empty state
  if (!selectedFeedbackId) {
    return (
      <aside className="hidden w-[480px] flex-col border-l-2 border-retro-black bg-white lg:flex">
        <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-stone-200 bg-stone-50">
            <Bug className="h-8 w-8 text-stone-400" />
          </div>
          <h3 className="mb-2 font-medium text-retro-black">No ticket selected</h3>
          <p className="text-sm text-stone-500">
            Select a feedback item from the list to view details and take actions
          </p>
        </div>
      </aside>
    );
  }

  // Placeholder for when a ticket is selected
  // This will be populated in a future story (FF-014)
  return (
    <aside className="hidden w-[480px] flex-col border-l-2 border-retro-black bg-white lg:flex">
      {/* Panel header */}
      <div className="flex items-center justify-between border-b-2 border-retro-black px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="rounded border border-retro-red/20 bg-retro-red/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-retro-red">
            Bug
          </span>
          <h2 className="font-medium text-retro-black">Ticket Details</h2>
        </div>
        <div className="flex items-center gap-1">
          <button className="rounded p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-retro-black">
            <MoreHorizontal className="h-4 w-4" />
          </button>
          <button
            onClick={() => setSelectedFeedbackId(null)}
            className="rounded p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-retro-black"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Panel content placeholder */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-6 rounded border-2 border-dashed border-stone-200 p-8 text-center">
          <p className="font-mono text-xs text-stone-400">
            Ticket detail view will be implemented in FF-014
          </p>
        </div>

        {/* AI Actions placeholder */}
        <div className="rounded border-2 border-retro-lavender bg-retro-lavender/10 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Wand2 className="h-4 w-4 text-retro-lavender" />
            <h3 className="text-sm font-medium text-retro-black">AI Actions</h3>
          </div>
          <div className="space-y-2">
            <button className="w-full rounded border border-stone-200 bg-white px-3 py-2 text-left text-sm text-stone-600 transition-colors hover:border-retro-black hover:text-retro-black">
              Auto-categorize
            </button>
            <button className="w-full rounded border border-stone-200 bg-white px-3 py-2 text-left text-sm text-stone-600 transition-colors hover:border-retro-black hover:text-retro-black">
              Suggest solutions
            </button>
            <button className="w-full rounded border-2 border-retro-black bg-retro-black px-3 py-2 text-left text-sm font-medium text-white shadow-[2px_2px_0px_0px_#888] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#888]">
              Draft Ticket
            </button>
          </div>
        </div>
      </div>

      {/* Comment input placeholder */}
      <div className="border-t-2 border-retro-black p-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Add a comment..."
            className="w-full rounded border-2 border-stone-200 bg-stone-50 py-2.5 pl-4 pr-10 text-sm outline-none transition-colors focus:border-retro-blue"
          />
          <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-stone-400 transition-colors hover:text-retro-blue">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}
