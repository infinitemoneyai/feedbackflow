"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import {
  X,
  Bug,
  Lightbulb,
  MoreHorizontal,
  Wand2,
  ChevronDown,
  User,
  Clock,
  Globe,
  Monitor,
  Smartphone,
  Mail,
  Plus,
  Check,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Play,
  Pause,
  Volume2,
  VolumeX,
  ExternalLink,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import { useDashboard } from "./dashboard-layout";
import { cn } from "@/lib/utils";
import { Id } from "@/convex/_generated/dataModel";

type FeedbackStatus = "new" | "triaging" | "drafted" | "exported" | "resolved";
type FeedbackPriority = "low" | "medium" | "high" | "critical";

interface TeamMember {
  _id: Id<"users">;
  name?: string;
  email: string;
  avatar?: string;
  role: "admin" | "member";
}

const STATUS_OPTIONS: { value: FeedbackStatus; label: string; color: string }[] = [
  { value: "new", label: "New", color: "bg-retro-blue text-white" },
  { value: "triaging", label: "Triaging", color: "bg-retro-yellow text-retro-black" },
  { value: "drafted", label: "Drafted", color: "bg-retro-lavender text-retro-black" },
  { value: "exported", label: "Exported", color: "bg-stone-400 text-white" },
  { value: "resolved", label: "Resolved", color: "bg-green-500 text-white" },
];

const PRIORITY_OPTIONS: { value: FeedbackPriority; label: string; color: string }[] = [
  { value: "critical", label: "Critical", color: "border-retro-red bg-retro-red/20 text-retro-red" },
  { value: "high", label: "High", color: "border-retro-red/20 bg-retro-red/10 text-retro-red" },
  { value: "medium", label: "Medium", color: "border-retro-peach/20 bg-retro-peach/10 text-retro-peach" },
  { value: "low", label: "Low", color: "border-stone-200 bg-stone-100 text-stone-500" },
];

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

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

// Screenshot viewer with zoom
function ScreenshotViewer({ url }: { url: string }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  const handleZoomIn = () => setZoomLevel((z) => Math.min(z + 0.25, 3));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(z - 0.25, 0.5));
  const handleResetZoom = () => setZoomLevel(1);

  return (
    <>
      <div className="group relative overflow-hidden rounded border-2 border-stone-200 bg-stone-100">
        <img
          src={url}
          alt="Screenshot"
          className="h-auto w-full cursor-pointer object-contain"
          onClick={() => setIsFullscreen(true)}
        />
        <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={() => setIsFullscreen(true)}
            className="rounded border border-stone-300 bg-white p-1.5 shadow-sm transition-colors hover:bg-stone-50"
            title="View fullscreen"
          >
            <Maximize2 className="h-4 w-4 text-stone-600" />
          </button>
        </div>
      </div>

      {/* Fullscreen modal */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={() => setIsFullscreen(false)}
        >
          <div className="absolute right-4 top-4 z-10 flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleZoomOut();
              }}
              className="rounded border border-white/20 bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
              title="Zoom out"
            >
              <ZoomOut className="h-5 w-5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleResetZoom();
              }}
              className="rounded border border-white/20 bg-white/10 px-3 py-2 font-mono text-sm text-white transition-colors hover:bg-white/20"
            >
              {Math.round(zoomLevel * 100)}%
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleZoomIn();
              }}
              className="rounded border border-white/20 bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
              title="Zoom in"
            >
              <ZoomIn className="h-5 w-5" />
            </button>
            <button
              onClick={() => setIsFullscreen(false)}
              className="ml-2 rounded border border-white/20 bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
              title="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div
            className="max-h-[90vh] max-w-[90vw] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={url}
              alt="Screenshot fullscreen"
              style={{ transform: `scale(${zoomLevel})`, transformOrigin: "center center" }}
              className="transition-transform duration-200"
            />
          </div>
        </div>
      )}
    </>
  );
}

// Video player with controls
function VideoPlayer({ url, duration }: { url: string; duration?: number }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(duration || 0);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setVideoDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="overflow-hidden rounded border-2 border-stone-200 bg-black">
      <video
        ref={videoRef}
        src={url}
        className="h-auto w-full"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
      />
      <div className="flex items-center gap-2 bg-stone-900 p-2">
        <button
          onClick={togglePlay}
          className="rounded p-1.5 text-white transition-colors hover:bg-white/10"
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>
        <span className="min-w-[45px] font-mono text-xs text-white">
          {formatTime(currentTime)}
        </span>
        <input
          type="range"
          min={0}
          max={videoDuration || 100}
          value={currentTime}
          onChange={handleSeek}
          className="h-1 flex-1 cursor-pointer appearance-none rounded bg-white/20 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
        />
        <span className="min-w-[45px] font-mono text-xs text-white">
          {formatTime(videoDuration)}
        </span>
        <button
          onClick={toggleMute}
          className="rounded p-1.5 text-white transition-colors hover:bg-white/10"
        >
          {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

// Dropdown component for status and priority
function Dropdown<T extends string>({
  value,
  options,
  onChange,
  disabled,
}: {
  value: T;
  options: { value: T; label: string; color: string }[];
  onChange: (value: T) => void;
  disabled?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((o) => o.value === value);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "flex items-center gap-1.5 rounded border px-2 py-1 text-xs font-medium transition-colors",
          selectedOption?.color,
          disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:opacity-80"
        )}
      >
        {selectedOption?.label}
        <ChevronDown className="h-3 w-3" />
      </button>
      {isOpen && (
        <div className="absolute left-0 top-full z-10 mt-1 min-w-[120px] rounded border-2 border-retro-black bg-white py-1 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors hover:bg-stone-50",
                value === option.value && "bg-stone-100"
              )}
            >
              <span className={cn("rounded px-1.5 py-0.5 text-xs", option.color)}>
                {option.label}
              </span>
              {value === option.value && <Check className="ml-auto h-3 w-3 text-retro-black" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Assignee selector
function AssigneeSelector({
  currentAssignee,
  teamId,
  onAssign,
  disabled,
}: {
  currentAssignee: { _id: Id<"users">; name?: string; email: string; avatar?: string } | null;
  teamId: Id<"teams">;
  onAssign: (userId: Id<"users"> | undefined) => void;
  disabled?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const teamMembers = useQuery(api.feedback.getTeamMembersForAssignment, { teamId });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "flex items-center gap-2 rounded border-2 border-stone-200 px-3 py-2 text-sm transition-colors",
          disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:border-stone-300"
        )}
      >
        {currentAssignee ? (
          <>
            {currentAssignee.avatar ? (
              <img
                src={currentAssignee.avatar}
                alt={currentAssignee.name || currentAssignee.email}
                className="h-5 w-5 rounded-full"
              />
            ) : (
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-retro-lavender text-xs font-medium text-retro-black">
                {(currentAssignee.name || currentAssignee.email).charAt(0).toUpperCase()}
              </div>
            )}
            <span className="text-retro-black">{currentAssignee.name || currentAssignee.email}</span>
          </>
        ) : (
          <>
            <User className="h-4 w-4 text-stone-400" />
            <span className="text-stone-400">Unassigned</span>
          </>
        )}
        <ChevronDown className="ml-auto h-4 w-4 text-stone-400" />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-10 mt-1 max-h-60 w-full min-w-[200px] overflow-y-auto rounded border-2 border-retro-black bg-white py-1 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
          <button
            onClick={() => {
              onAssign(undefined);
              setIsOpen(false);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-stone-500 transition-colors hover:bg-stone-50"
          >
            <User className="h-4 w-4" />
            <span>Unassigned</span>
            {!currentAssignee && <Check className="ml-auto h-3 w-3 text-retro-black" />}
          </button>
          <div className="my-1 border-t border-stone-200" />
          {teamMembers?.map((member: TeamMember) => (
            <button
              key={member._id}
              onClick={() => {
                onAssign(member._id);
                setIsOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-stone-50",
                currentAssignee?._id === member._id && "bg-stone-100"
              )}
            >
              {member.avatar ? (
                <img src={member.avatar} alt={member.name || member.email} className="h-5 w-5 rounded-full" />
              ) : (
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-retro-lavender text-xs font-medium text-retro-black">
                  {(member.name || member.email).charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-retro-black">{member.name || member.email}</span>
              {currentAssignee?._id === member._id && <Check className="ml-auto h-3 w-3 text-retro-black" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Tags input
function TagsInput({
  tags,
  onChange,
  disabled,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  disabled?: boolean;
}) {
  const [inputValue, setInputValue] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAddTag = () => {
    const trimmed = inputValue.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setInputValue("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onChange(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    } else if (e.key === "Backspace" && inputValue === "" && tags.length > 0) {
      onChange(tags.slice(0, -1));
    } else if (e.key === "Escape") {
      setIsEditing(false);
    }
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 rounded border border-retro-lavender/30 bg-retro-lavender/10 px-2 py-0.5 text-xs font-medium text-retro-lavender"
          >
            {tag}
            {!disabled && (
              <button
                onClick={() => handleRemoveTag(tag)}
                className="text-retro-lavender/70 transition-colors hover:text-retro-lavender"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </span>
        ))}
        {!disabled && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-1 rounded border border-dashed border-stone-300 px-2 py-0.5 text-xs text-stone-400 transition-colors hover:border-stone-400 hover:text-stone-500"
          >
            <Plus className="h-3 w-3" />
            Add tag
          </button>
        )}
      </div>
      {isEditing && (
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              handleAddTag();
              setIsEditing(false);
            }}
            placeholder="Type tag and press Enter"
            className="flex-1 rounded border-2 border-stone-200 px-2 py-1 text-sm outline-none transition-colors focus:border-retro-black"
          />
        </div>
      )}
    </div>
  );
}

// Metadata section
function MetadataSection({
  metadata,
}: {
  metadata: {
    browser?: string;
    os?: string;
    url?: string;
    screenWidth?: number;
    screenHeight?: number;
    userAgent?: string;
    timestamp: number;
  };
}) {
  const getDeviceIcon = () => {
    const isMobile =
      metadata.userAgent?.toLowerCase().includes("mobile") ||
      metadata.userAgent?.toLowerCase().includes("android") ||
      metadata.userAgent?.toLowerCase().includes("iphone");
    return isMobile ? <Smartphone className="h-4 w-4" /> : <Monitor className="h-4 w-4" />;
  };

  return (
    <div className="space-y-2 rounded border border-stone-200 bg-stone-50 p-3">
      <h4 className="font-mono text-[10px] font-bold uppercase tracking-wider text-stone-400">
        Metadata
      </h4>
      <div className="grid gap-2 text-sm">
        {metadata.url && (
          <div className="flex items-start gap-2">
            <Globe className="mt-0.5 h-4 w-4 flex-shrink-0 text-stone-400" />
            <a
              href={metadata.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 truncate text-retro-blue hover:underline"
            >
              {metadata.url}
              <ExternalLink className="h-3 w-3 flex-shrink-0" />
            </a>
          </div>
        )}
        {metadata.browser && (
          <div className="flex items-center gap-2">
            {getDeviceIcon()}
            <span className="text-stone-600">{metadata.browser}</span>
          </div>
        )}
        {metadata.os && (
          <div className="flex items-center gap-2">
            <Monitor className="h-4 w-4 text-stone-400" />
            <span className="text-stone-600">{metadata.os}</span>
          </div>
        )}
        {metadata.screenWidth && metadata.screenHeight && (
          <div className="flex items-center gap-2">
            <Monitor className="h-4 w-4 text-stone-400" />
            <span className="text-stone-600">
              {metadata.screenWidth} x {metadata.screenHeight}
            </span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-stone-400" />
          <span className="text-stone-600">{formatDate(metadata.timestamp)}</span>
        </div>
      </div>
    </div>
  );
}

// Submitter info section
function SubmitterSection({
  name,
  email,
}: {
  name?: string;
  email?: string;
}) {
  if (!name && !email) return null;

  return (
    <div className="space-y-2 rounded border border-stone-200 bg-stone-50 p-3">
      <h4 className="font-mono text-[10px] font-bold uppercase tracking-wider text-stone-400">
        Submitted by
      </h4>
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-retro-lavender text-lg font-medium text-retro-black">
          {(name || email || "?").charAt(0).toUpperCase()}
        </div>
        <div>
          {name && <div className="font-medium text-retro-black">{name}</div>}
          {email && (
            <a
              href={`mailto:${email}`}
              className="flex items-center gap-1 text-sm text-retro-blue hover:underline"
            >
              <Mail className="h-3 w-3" />
              {email}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export function TicketDetailPanel() {
  const { selectedFeedbackId, setSelectedFeedbackId } = useDashboard();

  // Fetch the selected feedback
  const feedback = useQuery(
    api.feedback.getFeedback,
    selectedFeedbackId ? { feedbackId: selectedFeedbackId } : "skip"
  );

  // Mutation to update feedback
  const updateFeedback = useMutation(api.feedback.updateFeedback);

  // Loading and updating states
  const [isUpdating, setIsUpdating] = useState(false);

  // Handlers for updating feedback
  const handleStatusChange = useCallback(
    async (status: FeedbackStatus) => {
      if (!selectedFeedbackId) return;
      setIsUpdating(true);
      try {
        await updateFeedback({ feedbackId: selectedFeedbackId, status });
      } catch (error) {
        console.error("Failed to update status:", error);
      }
      setIsUpdating(false);
    },
    [selectedFeedbackId, updateFeedback]
  );

  const handlePriorityChange = useCallback(
    async (priority: FeedbackPriority) => {
      if (!selectedFeedbackId) return;
      setIsUpdating(true);
      try {
        await updateFeedback({ feedbackId: selectedFeedbackId, priority });
      } catch (error) {
        console.error("Failed to update priority:", error);
      }
      setIsUpdating(false);
    },
    [selectedFeedbackId, updateFeedback]
  );

  const handleAssigneeChange = useCallback(
    async (assigneeId: Id<"users"> | undefined) => {
      if (!selectedFeedbackId) return;
      setIsUpdating(true);
      try {
        await updateFeedback({
          feedbackId: selectedFeedbackId,
          assigneeId: assigneeId as Id<"users"> | undefined,
        });
      } catch (error) {
        console.error("Failed to update assignee:", error);
      }
      setIsUpdating(false);
    },
    [selectedFeedbackId, updateFeedback]
  );

  const handleTagsChange = useCallback(
    async (tags: string[]) => {
      if (!selectedFeedbackId) return;
      setIsUpdating(true);
      try {
        await updateFeedback({ feedbackId: selectedFeedbackId, tags });
      } catch (error) {
        console.error("Failed to update tags:", error);
      }
      setIsUpdating(false);
    },
    [selectedFeedbackId, updateFeedback]
  );

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

  // Loading state
  if (feedback === undefined) {
    return (
      <aside className="hidden w-[480px] flex-col border-l-2 border-retro-black bg-white lg:flex">
        <div className="flex flex-1 flex-col items-center justify-center p-8">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-200 border-t-retro-black" />
          <p className="mt-4 text-sm text-stone-500">Loading feedback...</p>
        </div>
      </aside>
    );
  }

  // Error state - feedback not found
  if (feedback === null) {
    return (
      <aside className="hidden w-[480px] flex-col border-l-2 border-retro-black bg-white lg:flex">
        <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-retro-red/20 bg-retro-red/10">
            <X className="h-8 w-8 text-retro-red" />
          </div>
          <h3 className="mb-2 font-medium text-retro-black">Feedback not found</h3>
          <p className="text-sm text-stone-500">
            This feedback may have been deleted or you don&apos;t have access to it.
          </p>
          <button
            onClick={() => setSelectedFeedbackId(null)}
            className="mt-4 rounded border-2 border-retro-black bg-white px-4 py-2 text-sm font-medium transition-colors hover:bg-stone-50"
          >
            Close
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside className="hidden w-[480px] flex-col border-l-2 border-retro-black bg-white lg:flex">
      {/* Panel header */}
      <div className="flex items-center justify-between border-b-2 border-retro-black px-4 py-3">
        <div className="flex items-center gap-2">
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
          <span className="font-mono text-xs text-stone-400">
            {formatTimeAgo(feedback.createdAt)}
          </span>
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

      {/* Panel content */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {/* Title and description */}
        <div>
          <h2 className="mb-2 text-lg font-medium text-retro-black">{feedback.title}</h2>
          {feedback.description && (
            <p className="text-sm leading-relaxed text-stone-600">{feedback.description}</p>
          )}
        </div>

        {/* Status and Priority dropdowns */}
        <div className="flex items-center gap-3">
          <div>
            <label className="mb-1 block font-mono text-[10px] font-bold uppercase tracking-wider text-stone-400">
              Status
            </label>
            <Dropdown
              value={feedback.status}
              options={STATUS_OPTIONS}
              onChange={handleStatusChange}
              disabled={isUpdating}
            />
          </div>
          <div>
            <label className="mb-1 block font-mono text-[10px] font-bold uppercase tracking-wider text-stone-400">
              Priority
            </label>
            <Dropdown
              value={feedback.priority}
              options={PRIORITY_OPTIONS}
              onChange={handlePriorityChange}
              disabled={isUpdating}
            />
          </div>
        </div>

        {/* Assignee */}
        <div>
          <label className="mb-1 block font-mono text-[10px] font-bold uppercase tracking-wider text-stone-400">
            Assignee
          </label>
          <AssigneeSelector
            currentAssignee={feedback.assignee}
            teamId={feedback.teamId}
            onAssign={handleAssigneeChange}
            disabled={isUpdating}
          />
        </div>

        {/* Tags */}
        <div>
          <label className="mb-1 block font-mono text-[10px] font-bold uppercase tracking-wider text-stone-400">
            Tags
          </label>
          <TagsInput
            tags={feedback.tags}
            onChange={handleTagsChange}
            disabled={isUpdating}
          />
        </div>

        {/* Screenshot */}
        {feedback.screenshotUrl && (
          <div>
            <label className="mb-2 block font-mono text-[10px] font-bold uppercase tracking-wider text-stone-400">
              Screenshot
            </label>
            <ScreenshotViewer url={feedback.screenshotUrl} />
          </div>
        )}

        {/* Video */}
        {feedback.recordingUrl && (
          <div>
            <label className="mb-2 block font-mono text-[10px] font-bold uppercase tracking-wider text-stone-400">
              Recording
            </label>
            <VideoPlayer url={feedback.recordingUrl} duration={feedback.recordingDuration} />
          </div>
        )}

        {/* Metadata */}
        <MetadataSection metadata={feedback.metadata} />

        {/* Submitter info */}
        <SubmitterSection name={feedback.submitterName} email={feedback.submitterEmail} />

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

      {/* Comment input placeholder (to be implemented in FF-015) */}
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
