"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bug, Lightbulb, Check } from "lucide-react";
import { Icon } from "@/components/ui/icon";
import { Skeleton } from "@/components/ui/skeleton";
import { Toast } from "@/components/dashboard/ticket-detail/modals";
import { buildAgentInstallPrompt } from "@/lib/widget-snippet";

interface EmptyStateProps {
  currentView: "inbox" | "backlog" | "resolved";
  searchQuery: string;
  hasAnyFeedback: boolean;
  /** Widget key for the Agent Install Prompt; undefined while the widget query loads. */
  widgetKey?: string;
  widgetKeyLoading?: boolean;
}

export function EmptyState({
  currentView,
  searchQuery,
  hasAnyFeedback,
  widgetKey,
  widgetKeyLoading,
}: EmptyStateProps) {
  const [toast, setToast] = useState<{ kind: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const handleCopyAgentPrompt = useCallback(async () => {
    if (!widgetKey) return;
    const prompt = buildAgentInstallPrompt({
      widgetKey,
      widgetUrl: `${window.location.origin}/widget.js`,
      apiUrl: `${window.location.origin}/api/widget/submit`,
    });
    try {
      await navigator.clipboard.writeText(prompt);
      setToast({ kind: "success", message: "Prompt copied — paste it into your coding agent." });
    } catch (error) {
      console.error("Failed to copy Agent Install Prompt", error);
      setToast({ kind: "error", message: "Couldn't copy the prompt. Try again." });
    }
  }, [widgetKey]);

  const getIcon = () => {
    if (currentView === "inbox") return <Bug className="h-8 w-8 text-stone-400" />;
    if (currentView === "backlog") return <Lightbulb className="h-8 w-8 text-stone-400" />;
    return <Check className="h-8 w-8 text-stone-400" />;
  };

  const getTitle = () => {
    if (searchQuery) return "No matching feedback";
    if (currentView === "inbox") return "Inbox is empty";
    if (currentView === "backlog") return "Backlog is empty";
    return "No resolved feedback";
  };

  const getDescription = () => {
    if (searchQuery) return "Try adjusting your search or filters";
    if (currentView === "inbox") return "New feedback will appear here";
    if (currentView === "backlog") return "Draft tickets to move them here";
    return "Exported feedback will appear here";
  };

  return (
    <div className="relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-stone-300 bg-white p-12 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-stone-200 bg-stone-50">
        {getIcon()}
      </div>
      <h3 className="mb-2 font-medium text-retro-black">{getTitle()}</h3>
      <p className="mb-4 text-sm text-stone-500">{getDescription()}</p>

      {/* Show widget installation CTA if project has no feedback at all */}
      {!searchQuery && currentView === "inbox" && !hasAnyFeedback && (
        <div className="mt-5 w-full max-w-lg border-2 border-retro-black bg-retro-paper text-left shadow-[6px_6px_0px_0px_rgba(26,26,26,1)]">
          <div className="flex items-center justify-between border-b-2 border-retro-black bg-retro-yellow px-4 py-3">
            <div className="flex items-center gap-2">
              <Icon name="solar:widget-linear" size={18} />
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-retro-black">
                Install Widget
              </span>
            </div>
            <span className="font-mono text-xs text-stone-600">Start collecting feedback</span>
          </div>

          <div className="p-5">
            <h4 className="text-base font-semibold text-retro-black">
              Add widget to start getting feedback
            </h4>
            <p className="mt-1 text-sm text-stone-600">
              Add one script tag to your site. New feedback will instantly show up in this Inbox.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              {widgetKeyLoading ? (
                <Skeleton className="h-[38px] w-72 rounded-none border-2 border-stone-200" />
              ) : (
                widgetKey && (
                  <button
                    onClick={handleCopyAgentPrompt}
                    className="inline-flex items-center gap-2 border-2 border-retro-black bg-retro-blue px-4 py-2 text-sm font-medium text-white shadow-[3px_3px_0px_0px_rgba(26,26,26,1)] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]"
                  >
                    <Icon name="solar:magic-stick-3-linear" size={16} />
                    Install with Cursor / Claude Code / Agents
                  </button>
                )
              )}

              <Link
                href="/settings?tab=widget"
                className="inline-flex items-center gap-2 border-2 border-retro-black bg-white px-4 py-2 text-sm font-medium text-retro-black shadow-[3px_3px_0px_0px_rgba(26,26,26,1)] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]"
              >
                <Icon name="solar:code-square-linear" size={16} />
                Get install snippet
              </Link>

              <Link
                href="/docs/installation"
                className="text-sm font-medium text-retro-blue underline underline-offset-2 hover:text-retro-black"
              >
                View install docs
              </Link>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast kind={toast.kind} message={toast.message} />}
    </div>
  );
}
