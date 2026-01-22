"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import {
  MessageSquare,
  Activity,
  Send,
  Clock,
  ArrowRight,
  User,
  Tag,
  CheckCircle,
  UserPlus,
  UserMinus,
  FileOutput,
  Wand2,
  FileText,
  Plus,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";

type ViewMode = "all" | "comments" | "activity";

type ActivityAction =
  | "created"
  | "status_changed"
  | "priority_changed"
  | "assigned"
  | "unassigned"
  | "tagged"
  | "exported"
  | "commented"
  | "ai_analyzed"
  | "ticket_drafted"
  | "automation_executed";

interface UserInfo {
  _id: Id<"users">;
  name?: string;
  email: string;
  avatar?: string;
}

interface CommentEntry {
  _id: Id<"comments">;
  type: "comment";
  content: string;
  createdAt: number;
  user: UserInfo | null;
}

interface ActivityEntry {
  _id: Id<"activityLog">;
  type: "activity";
  action: ActivityAction;
  details?: {
    from?: string;
    to?: string;
    extra?: string;
  };
  createdAt: number;
  user: UserInfo | null;
}

type TimelineEntry = CommentEntry | ActivityEntry;

function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "Just now";
}

function formatDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// Get icon for activity action
function getActivityIcon(action: ActivityAction) {
  switch (action) {
    case "created":
      return <Plus className="h-3.5 w-3.5" />;
    case "status_changed":
      return <ArrowRight className="h-3.5 w-3.5" />;
    case "priority_changed":
      return <Activity className="h-3.5 w-3.5" />;
    case "assigned":
      return <UserPlus className="h-3.5 w-3.5" />;
    case "unassigned":
      return <UserMinus className="h-3.5 w-3.5" />;
    case "tagged":
      return <Tag className="h-3.5 w-3.5" />;
    case "exported":
      return <FileOutput className="h-3.5 w-3.5" />;
    case "commented":
      return <MessageSquare className="h-3.5 w-3.5" />;
    case "ai_analyzed":
      return <Wand2 className="h-3.5 w-3.5" />;
    case "ticket_drafted":
      return <FileText className="h-3.5 w-3.5" />;
    default:
      return <CheckCircle className="h-3.5 w-3.5" />;
  }
}

// Get description for activity action
function getActivityDescription(
  action: ActivityAction,
  details?: { from?: string; to?: string; extra?: string },
  userName?: string
): string {
  const actor = userName || "Someone";

  switch (action) {
    case "created":
      return `${actor} created this feedback`;
    case "status_changed":
      return `${actor} changed status from ${details?.from || "unknown"} to ${details?.to || "unknown"}`;
    case "priority_changed":
      return `${actor} changed priority from ${details?.from || "unknown"} to ${details?.to || "unknown"}`;
    case "assigned":
      return `${actor} assigned this to ${details?.to || "someone"}`;
    case "unassigned":
      return `${actor} removed the assignee`;
    case "tagged":
      return `${actor} updated tags${details?.extra ? `: ${details.extra}` : ""}`;
    case "exported":
      return `${actor} exported this feedback${details?.extra ? ` to ${details.extra}` : ""}`;
    case "commented":
      return `${actor} commented`;
    case "ai_analyzed":
      return `AI analyzed this feedback`;
    case "ticket_drafted":
      return `${actor} drafted a ticket`;
    default:
      return `${actor} performed an action`;
  }
}

// User avatar component
function UserAvatar({ user, size = "sm" }: { user: UserInfo | null; size?: "sm" | "md" }) {
  const sizeClasses = size === "sm" ? "h-6 w-6 text-[10px]" : "h-8 w-8 text-xs";

  if (!user) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-full bg-stone-200 text-stone-500",
          sizeClasses
        )}
      >
        <User className={size === "sm" ? "h-3 w-3" : "h-4 w-4"} />
      </div>
    );
  }

  if (user.avatar) {
    return (
      <img
        src={user.avatar}
        alt={user.name || user.email}
        className={cn("rounded-full object-cover", sizeClasses)}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full bg-retro-lavender font-medium text-retro-black",
        sizeClasses
      )}
    >
      {(user.name || user.email).charAt(0).toUpperCase()}
    </div>
  );
}

// Comment entry component
function CommentItem({ entry }: { entry: CommentEntry }) {
  return (
    <div className="group flex gap-3">
      <UserAvatar user={entry.user} size="md" />
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <span className="font-medium text-retro-black">
            {entry.user?.name || entry.user?.email || "Unknown"}
          </span>
          <span
            className="text-xs text-stone-400"
            title={formatDateTime(entry.createdAt)}
          >
            {formatTimeAgo(entry.createdAt)}
          </span>
        </div>
        <div className="rounded border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-700">
          {entry.content}
        </div>
      </div>
    </div>
  );
}

// Activity entry component
function ActivityItem({ entry }: { entry: ActivityEntry }) {
  const userName = entry.user?.name || entry.user?.email;
  const description = getActivityDescription(entry.action, entry.details, userName);

  return (
    <div className="flex items-start gap-3">
      <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-stone-200 bg-stone-50 text-stone-500">
        {getActivityIcon(entry.action)}
      </div>
      <div className="flex flex-1 items-center gap-2 py-0.5">
        <span className="text-sm text-stone-600">{description}</span>
        <span
          className="text-xs text-stone-400"
          title={formatDateTime(entry.createdAt)}
        >
          {formatTimeAgo(entry.createdAt)}
        </span>
      </div>
    </div>
  );
}

// Comment input component
function CommentInput({
  feedbackId,
  onSubmitSuccess,
}: {
  feedbackId: Id<"feedback">;
  onSubmitSuccess?: () => void;
}) {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addComment = useMutation(api.feedback.addComment);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await addComment({ feedbackId, content: content.trim() });
      setContent("");
      onSubmitSuccess?.();
    } catch (error) {
      console.error("Failed to add comment:", error);
    }
    setIsSubmitting(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <input
        ref={inputRef}
        type="text"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Add a comment..."
        disabled={isSubmitting}
        className="w-full rounded border-2 border-stone-200 bg-stone-50 py-2.5 pl-4 pr-10 text-sm outline-none transition-colors focus:border-retro-blue disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={!content.trim() || isSubmitting}
        className={cn(
          "absolute right-2 top-1/2 -translate-y-1/2 p-1.5 transition-colors",
          content.trim() && !isSubmitting
            ? "text-retro-blue hover:text-retro-black"
            : "text-stone-300"
        )}
      >
        {isSubmitting ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-stone-300 border-t-retro-blue" />
        ) : (
          <Send className="h-4 w-4" />
        )}
      </button>
    </form>
  );
}

// Main comments and activity component
export function CommentsAndActivity({ feedbackId }: { feedbackId: Id<"feedback"> }) {
  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const timelineRef = useRef<HTMLDivElement>(null);

  // Fetch combined data
  const timeline = useQuery(api.feedback.getCommentsAndActivity, { feedbackId });

  // Filter based on view mode
  const filteredTimeline = timeline?.filter((entry: TimelineEntry) => {
    if (viewMode === "all") return true;
    if (viewMode === "comments") return entry.type === "comment";
    if (viewMode === "activity") return entry.type === "activity";
    return true;
  });

  // Scroll to bottom when new comments are added
  const scrollToBottom = () => {
    if (timelineRef.current) {
      timelineRef.current.scrollTop = timelineRef.current.scrollHeight;
    }
  };

  // Auto-scroll on initial load and when timeline changes
  useEffect(() => {
    scrollToBottom();
  }, [timeline?.length]);

  // Count comments and activity
  const commentCount = timeline?.filter((e: TimelineEntry) => e.type === "comment").length || 0;
  const activityCount = timeline?.filter((e: TimelineEntry) => e.type === "activity").length || 0;

  return (
    <div className="flex flex-col border-t-2 border-retro-black">
      {/* Tabs header */}
      <div className="flex items-center border-b border-stone-200 bg-stone-50">
        <button
          onClick={() => setViewMode("all")}
          className={cn(
            "flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors",
            viewMode === "all"
              ? "border-b-2 border-retro-black text-retro-black"
              : "text-stone-500 hover:text-retro-black"
          )}
        >
          All
          <span className="rounded bg-stone-200 px-1.5 text-[10px] font-bold">
            {(commentCount + activityCount) || 0}
          </span>
        </button>
        <button
          onClick={() => setViewMode("comments")}
          className={cn(
            "flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors",
            viewMode === "comments"
              ? "border-b-2 border-retro-black text-retro-black"
              : "text-stone-500 hover:text-retro-black"
          )}
        >
          <MessageSquare className="h-4 w-4" />
          Comments
          {commentCount > 0 && (
            <span className="rounded bg-retro-blue/10 px-1.5 text-[10px] font-bold text-retro-blue">
              {commentCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setViewMode("activity")}
          className={cn(
            "flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors",
            viewMode === "activity"
              ? "border-b-2 border-retro-black text-retro-black"
              : "text-stone-500 hover:text-retro-black"
          )}
        >
          <Activity className="h-4 w-4" />
          Activity
          {activityCount > 0 && (
            <span className="rounded bg-stone-200 px-1.5 text-[10px] font-bold text-stone-600">
              {activityCount}
            </span>
          )}
        </button>
      </div>

      {/* Timeline content */}
      <div
        ref={timelineRef}
        className="max-h-[300px] flex-1 space-y-4 overflow-y-auto p-4"
      >
        {timeline === undefined ? (
          // Loading state
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-stone-200 border-t-retro-black" />
          </div>
        ) : filteredTimeline?.length === 0 ? (
          // Empty state
          <div className="flex flex-col items-center justify-center py-8 text-center">
            {viewMode === "comments" ? (
              <>
                <MessageSquare className="mb-2 h-8 w-8 text-stone-300" />
                <p className="text-sm text-stone-500">No comments yet</p>
                <p className="text-xs text-stone-400">Be the first to comment</p>
              </>
            ) : viewMode === "activity" ? (
              <>
                <Activity className="mb-2 h-8 w-8 text-stone-300" />
                <p className="text-sm text-stone-500">No activity yet</p>
              </>
            ) : (
              <>
                <Clock className="mb-2 h-8 w-8 text-stone-300" />
                <p className="text-sm text-stone-500">No comments or activity</p>
              </>
            )}
          </div>
        ) : (
          // Timeline entries
          filteredTimeline?.map((entry: TimelineEntry) =>
            entry.type === "comment" ? (
              <CommentItem key={`comment-${entry._id}`} entry={entry} />
            ) : (
              <ActivityItem key={`activity-${entry._id}`} entry={entry} />
            )
          )
        )}
      </div>

      {/* Comment input */}
      <div className="border-t border-stone-200 p-4">
        <CommentInput feedbackId={feedbackId} onSubmitSuccess={scrollToBottom} />
      </div>
    </div>
  );
}
