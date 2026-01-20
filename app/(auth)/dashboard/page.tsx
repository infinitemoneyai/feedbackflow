"use client";

import { useQuery } from "convex/react";
import { Bug, Lightbulb, Clock, MoreHorizontal } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { DashboardLayout, useDashboard } from "@/components/dashboard";
import { cn } from "@/lib/utils";

function FeedbackList() {
  const { selectedProjectId, currentView, selectedFeedbackId, setSelectedFeedbackId } =
    useDashboard();

  // This is placeholder data - will be replaced with actual query in FF-013
  const mockFeedback = [
    {
      _id: "1" as const,
      type: "bug" as const,
      title: "Login button not working on mobile Safari",
      description: "When I try to tap the login button on my iPhone, nothing happens...",
      priority: "high" as const,
      status: "new" as const,
      createdAt: Date.now() - 1000 * 60 * 30, // 30 min ago
      submitterName: "John D.",
    },
    {
      _id: "2" as const,
      type: "feature" as const,
      title: "Add dark mode support",
      description: "Would be great to have a dark mode option for night-time use...",
      priority: "medium" as const,
      status: "triaging" as const,
      createdAt: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
      submitterName: "Sarah M.",
    },
    {
      _id: "3" as const,
      type: "bug" as const,
      title: "Images not loading in gallery view",
      description: "The product images in the gallery section show broken image icons...",
      priority: "critical" as const,
      status: "new" as const,
      createdAt: Date.now() - 1000 * 60 * 60 * 5, // 5 hours ago
      submitterEmail: "customer@example.com",
    },
  ];

  const formatTimeAgo = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return "Just now";
  };

  const priorityColors = {
    low: "border-stone-200 bg-stone-100 text-stone-500",
    medium: "border-retro-peach/20 bg-retro-peach/10 text-retro-peach",
    high: "border-retro-red/20 bg-retro-red/10 text-retro-red",
    critical: "border-retro-red bg-retro-red/20 text-retro-red",
  };

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

  return (
    <div className="space-y-2">
      {mockFeedback.map((feedback) => (
        <button
          key={feedback._id}
          onClick={() => setSelectedFeedbackId(feedback._id as any)}
          className={cn(
            "w-full rounded border-2 bg-white p-4 text-left transition-all",
            selectedFeedbackId === feedback._id
              ? "translate-x-[2px] translate-y-[2px] border-retro-blue shadow-[4px_4px_0px_0px_#6B9AC4]"
              : "border-transparent hover:border-retro-black hover:shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]"
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
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
              </div>

              <h3 className="mb-1 truncate font-medium text-retro-black">
                {feedback.title}
              </h3>

              <p className="line-clamp-2 text-sm text-stone-500">
                {feedback.description}
              </p>
            </div>

            {/* Thumbnail placeholder */}
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
          </div>

          {/* Footer with metadata */}
          <div className="mt-3 flex items-center justify-between border-t border-stone-100 pt-3">
            <div className="flex items-center gap-2 text-xs text-stone-500">
              <Clock className="h-3 w-3" />
              <span>{formatTimeAgo(feedback.createdAt)}</span>
              {feedback.submitterName && (
                <>
                  <span className="text-stone-300">•</span>
                  <span>{feedback.submitterName}</span>
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

      {/* Empty state hint */}
      <div className="rounded border border-dashed border-stone-300 p-4 text-center">
        <p className="font-mono text-xs text-stone-400">
          This is placeholder data. Real feedback will appear when the widget is
          integrated (FF-012).
        </p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <FeedbackList />
    </DashboardLayout>
  );
}
