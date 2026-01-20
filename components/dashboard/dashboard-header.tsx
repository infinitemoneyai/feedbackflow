"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery } from "convex/react";
import { Menu, Search, Bell, Filter, X } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { useDashboard } from "./dashboard-layout";

export function DashboardHeader() {
  const {
    selectedProjectId,
    currentView,
    setSidebarOpen,
    searchQuery,
    setSearchQuery,
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

  return (
    <header className="flex h-16 items-center justify-between border-b-2 border-retro-black bg-white px-4 lg:px-6">
      {/* Mobile search overlay */}
      {mobileSearchOpen && (
        <div className="absolute inset-0 z-10 flex items-center bg-white px-4 sm:hidden">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
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

      {/* Left side - menu button (mobile) and title */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setSidebarOpen(true)}
          className="rounded p-2 text-stone-600 transition-colors hover:bg-stone-100 hover:text-retro-black lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-medium tracking-tight text-retro-black lg:text-xl">
              {searchQuery ? "Search Results" : viewTitles[currentView]}
            </h1>
            {project && !searchQuery && (
              <span className="hidden rounded border border-stone-200 bg-stone-100 px-2 py-0.5 font-mono text-xs text-stone-500 sm:inline">
                {project.name}
              </span>
            )}
            {searchQuery && (
              <span className="rounded border border-retro-yellow/30 bg-retro-yellow/10 px-2 py-0.5 font-mono text-xs text-retro-black">
                &ldquo;{searchQuery}&rdquo;
              </span>
            )}
          </div>
          <p className="hidden text-xs text-stone-500 sm:block">
            {searchQuery
              ? "Searching across title, description, comments, and tags"
              : viewDescriptions[currentView]}
          </p>
        </div>
      </div>

      {/* Right side - search and actions */}
      <div className="flex items-center gap-2">
        {/* Search input (desktop) */}
        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            ref={desktopInputRef}
            type="text"
            placeholder="Search feedback..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-48 rounded-full border-2 border-stone-200 bg-stone-50 py-1.5 pl-9 pr-8 text-sm outline-none transition-colors focus:border-retro-black lg:w-64"
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
          className={`rounded p-2 transition-colors sm:hidden ${
            searchQuery
              ? "bg-retro-yellow/20 text-retro-black"
              : "text-stone-600 hover:bg-stone-100 hover:text-retro-black"
          }`}
        >
          <Search className="h-5 w-5" />
        </button>

        {/* Filter button */}
        <button className="rounded p-2 text-stone-600 transition-colors hover:bg-stone-100 hover:text-retro-black">
          <Filter className="h-5 w-5" />
        </button>

        {/* Notifications */}
        <button className="relative rounded p-2 text-stone-600 transition-colors hover:bg-stone-100 hover:text-retro-black">
          <Bell className="h-5 w-5" />
          {/* Notification badge */}
          <span className="absolute right-1 top-1 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-retro-red opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-retro-red" />
          </span>
        </button>
      </div>
    </header>
  );
}
