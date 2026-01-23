"use client";

import Image from "next/image";
import { Check, MessageSquare, Tag, User } from "lucide-react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { Id } from "@/convex/_generated/dataModel";
import { FeedbackItem } from "./types";
import { highlightText, formatTimeAgo, priorityColors } from "./utils";
import { RoutingBadges } from "./routing-badges";

interface FeedbackCardProps {
  feedback: FeedbackItem;
  isSelected: boolean;
  isHighlighted: boolean;
  onSelect: (id: Id<"feedback">, event: React.MouseEvent) => void;
  onClick: () => void;
  searchQuery: string;
  projectCode?: string;
  currentTime: number;
}

export function FeedbackCard({
  feedback,
  isSelected,
  isHighlighted,
  onSelect,
  onClick,
  searchQuery,
  projectCode,
  currentTime,
}: FeedbackCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative cursor-pointer border-2 bg-white p-4 transition-all",
        isHighlighted
          ? "translate-x-[2px] translate-y-[2px] border-retro-blue shadow-[4px_4px_0px_0px_#6B9AC4]"
          : "border-transparent hover:border-retro-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
        !isHighlighted && "border-b border-stone-200"
      )}
    >
      <div className="flex items-start gap-4">
        {/* Status indicator / Checkbox */}
        <div className="mt-1">
          <div
            onClick={(e) => onSelect(feedback._id, e)}
            className={cn(
              "flex h-4 w-4 cursor-pointer items-center justify-center rounded-full border transition-colors",
              isSelected
                ? "border-retro-blue bg-retro-blue"
                : feedback.priority === "critical" || feedback.priority === "high"
                  ? "border-retro-black bg-retro-red"
                  : "border-stone-300 hover:border-retro-black"
            )}
          >
            {isSelected && <Check className="h-2.5 w-2.5 text-white" />}
            {!isSelected && (feedback.priority === "critical" || feedback.priority === "high") && (
              <div className="h-1.5 w-1.5 rounded-full bg-white" />
            )}
          </div>
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center justify-between">
            <span className="font-mono text-xs text-stone-400">
              {projectCode && feedback.ticketNumber 
                ? `#${projectCode}-${feedback.ticketNumber}` 
                : `#${feedback._id.slice(-3).toUpperCase()}`} • {formatTimeAgo(feedback.createdAt, currentTime)}
            </span>
            <div className="flex gap-2">
              {/* Priority badge */}
              <span
                className={cn(
                  "rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                  priorityColors[feedback.priority]
                )}
              >
                {feedback.priority === "critical" ? "High Priority" : feedback.priority}
              </span>
            </div>
          </div>

          <h3 className="mb-1 truncate text-base font-medium text-retro-black">
            {searchQuery
              ? highlightText(feedback.title, searchQuery)
              : feedback.title}
          </h3>

          {feedback.description && (
            <p className="truncate text-sm text-stone-500">
              {searchQuery
                ? highlightText(feedback.description, searchQuery)
                : feedback.description}
            </p>
          )}

          {/* Search match indicators (only show when searching) */}
          {searchQuery && feedback._searchMeta && (
            <div className="mt-2 flex items-center gap-1">
              {feedback._searchMeta.matchedFields.includes("comments") && (
                <span
                  className="flex items-center rounded border border-retro-yellow/30 bg-retro-yellow/10 px-1 py-0.5"
                  title="Match found in comments"
                >
                  <MessageSquare className="h-3 w-3 text-retro-yellow" />
                </span>
              )}
              {feedback._searchMeta.matchedFields.includes("tags") && (
                <span
                  className="flex items-center rounded border border-retro-yellow/30 bg-retro-yellow/10 px-1 py-0.5"
                  title="Match found in tags"
                >
                  <Tag className="h-3 w-3 text-retro-yellow" />
                </span>
              )}
              {feedback._searchMeta.matchedFields.includes("submitter") && (
                <span
                  className="flex items-center rounded border border-retro-yellow/30 bg-retro-yellow/10 px-1 py-0.5"
                  title="Match found in submitter info"
                >
                  <User className="h-3 w-3 text-retro-yellow" />
                </span>
              )}
            </div>
          )}

          {/* Routing badges (show for exported/resolved tickets) */}
          {(feedback.status === "exported" || feedback.status === "resolved") && (
            <RoutingBadges feedbackId={feedback._id} />
          )}
        </div>

        {/* Thumbnail */}
        {feedback.screenshotUrl ? (
          <div className="relative hidden h-12 w-16 flex-shrink-0 overflow-hidden border border-stone-200 bg-stone-100 sm:block">
            <Image
              src={feedback.screenshotUrl}
              alt="Screenshot thumbnail"
              fill
              sizes="64px"
              className="object-cover"
              loading="lazy"
            />
          </div>
        ) : feedback.recordingUrl ? (
          <div className="relative hidden h-12 w-16 flex-shrink-0 overflow-hidden border border-stone-200 bg-stone-100 sm:block">
            <video
              src={feedback.recordingUrl}
              className="h-full w-full object-cover"
              preload="metadata"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <Icon name="solar:play-circle-bold" size={20} className="text-white drop-shadow-md" />
            </div>
          </div>
        ) : (
          <div className="hidden h-12 w-16 flex-shrink-0 items-center justify-center border border-stone-200 bg-stone-100 text-stone-300 sm:flex">
            <Icon name="solar:gallery-wide-linear" size={16} />
          </div>
        )}
      </div>
    </div>
  );
}
