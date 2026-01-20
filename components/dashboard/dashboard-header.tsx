"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery } from "convex/react";
import { Menu, X } from "lucide-react";
import { Icon } from "@/components/ui/icon";
import { api } from "@/convex/_generated/api";
import { useDashboard } from "./dashboard-layout";
import { NotificationDropdown } from "./notification-dropdown";
import { cn } from "@/lib/utils";

export function DashboardHeader() {
  const {
    selectedProjectId,
    currentView,
    setSidebarOpen,
    searchQuery,
    setSearchQuery,
    setSelectedFeedbackId,
  } = useDashboard();

  // Mobile search expanded state
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const desktopInputRef = useRef<HTMLInputElement>(null);

  // Focus mobile input when opened
  useEffect(() => {
    if (mobileSearchOpen && mobileInputRef.current) {
      mobileInputRef.current.focus();
    }
  }, [mobileSearchOpen]);

  // Get project name
  const project = useQuery(
    api.projects.getProject,
    selectedProjectId ? { projectId: selectedProjectId } : "skip"
  );

  const viewTitles = {
    inbox: "Inbox",
    backlog: "Backlog",
    resolved: "Resolved",
  };

  const viewDescriptions = {
    inbox: "New and triaging feedback",
    backlog: "Drafted tickets ready for export",
    resolved: "Exported and resolved feedback",
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    desktopInputRef.current?.focus();
  };

  const handleMobileClearSearch = () => {
    setSearchQuery("");
    mobileInputRef.current?.focus();
  };

  const handleMobileSearchClose = () => {
    setMobileSearchOpen(false);
    if (!searchQuery) {
      setSearchQuery("");
    }
  };

  // Filter type state for header filter pills
  const [filterType, setFilterType] = useState<"all" | "bugs" | "features">("all");

  return (
    <header className="flex h-16 flex-shrink-0 items-center justify-between border-b-2 border-retro-black bg-white px-6">
      {/* Mobile search overlay */}
      {mobileSearchOpen && (
        <div className="absolute inset-0 z-10 flex items-center bg-white px-4 sm:hidden">
          <div className="relative flex-1">
            <Icon name="solar:magnifer-linear" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              ref={mobileInputRef}
              type="text"
              placeholder="Search title, description, comments, tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full border-2 border-retro-black bg-stone-50 py-2 pl-9 pr-10 text-sm outline-none"
            />
            {searchQuery && (
              <button
                onClick={handleMobileClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-stone-400 hover:bg-stone-200 hover:text-retro-black"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <button
            onClick={handleMobileSearchClose}
            className="ml-2 rounded p-2 text-stone-600 hover:bg-stone-100 hover:text-retro-black"
          >
            <span className="text-sm font-medium">Done</span>
          </button>
        </div>
      )}

      {/* Left side - menu button (mobile), title, and filter pills */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setSidebarOpen(true)}
          className="rounded p-2 text-stone-600 transition-colors hover:bg-stone-100 hover:text-retro-black lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <h1 className="text-lg font-semibold tracking-tight text-retro-black">
          {searchQuery ? "Search Results" : viewTitles[currentView]}
        </h1>

        {/* Divider */}
        <div className="hidden h-6 w-px bg-stone-300 sm:block" />

        {/* Filter pills */}
        <div className="hidden gap-2 sm:flex">
          <button
            onClick={() => setFilterType("all")}
            className={cn(
              "rounded px-2 py-1 font-mono text-xs transition-colors",
              filterType === "all"
                ? "bg-retro-black text-white"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            )}
          >
            All (12)
          </button>
          <button
            onClick={() => setFilterType("bugs")}
            className={cn(
              "rounded px-2 py-1 font-mono text-xs transition-colors",
              filterType === "bugs"
                ? "bg-retro-black text-white"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            )}
          >
            Bugs
          </button>
          <button
            onClick={() => setFilterType("features")}
            className={cn(
              "rounded px-2 py-1 font-mono text-xs transition-colors",
              filterType === "features"
                ? "bg-retro-black text-white"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            )}
          >
            Features
          </button>
        </div>
      </div>

      {/* Right side - search and actions */}
      <div className="flex items-center gap-3">
        {/* Search input (desktop) */}
        <div className="relative hidden sm:block">
          <Icon name="solar:magnifer-linear" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            ref={desktopInputRef}
            type="text"
            placeholder="Search tickets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-48 rounded-full border-2 border-stone-200 bg-stone-50 py-1.5 pl-9 pr-4 text-sm outline-none transition-colors focus:border-retro-black"
          />
          {searchQuery && (
            <button
              onClick={handleClearSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-stone-400 hover:bg-stone-200 hover:text-retro-black"
              title="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Search button (mobile) */}
        <button
          onClick={() => setMobileSearchOpen(true)}
          className={cn(
            "rounded p-2 transition-colors sm:hidden",
            searchQuery
              ? "bg-retro-yellow/20 text-retro-black"
              : "text-stone-600 hover:bg-stone-100 hover:text-retro-black"
          )}
        >
          <Icon name="solar:magnifer-linear" size={20} />
        </button>

        {/* Sort button */}
        <button className="rounded border border-transparent p-2 text-stone-600 transition-colors hover:border-stone-200 hover:bg-stone-100">
          <Icon name="solar:sort-vertical-linear" size={20} />
        </button>

        {/* Notifications */}
        <NotificationDropdown
          onNotificationClick={(feedbackId) => {
            if (feedbackId) {
              setSelectedFeedbackId(feedbackId);
            }
          }}
        />
      </div>
    </header>
  );
}
