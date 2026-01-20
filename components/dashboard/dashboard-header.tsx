"use client";

import { useQuery } from "convex/react";
import { Menu, Search, Bell, Filter } from "lucide-react";
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

  return (
    <header className="flex h-16 items-center justify-between border-b-2 border-retro-black bg-white px-4 lg:px-6">
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
              {viewTitles[currentView]}
            </h1>
            {project && (
              <span className="hidden rounded border border-stone-200 bg-stone-100 px-2 py-0.5 font-mono text-xs text-stone-500 sm:inline">
                {project.name}
              </span>
            )}
          </div>
          <p className="hidden text-xs text-stone-500 sm:block">
            {viewDescriptions[currentView]}
          </p>
        </div>
      </div>

      {/* Right side - search and actions */}
      <div className="flex items-center gap-2">
        {/* Search input */}
        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Search feedback..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-48 rounded-full border-2 border-stone-200 bg-stone-50 py-1.5 pl-9 pr-4 text-sm outline-none transition-colors focus:border-retro-black lg:w-64"
          />
        </div>

        {/* Search button (mobile) */}
        <button className="rounded p-2 text-stone-600 transition-colors hover:bg-stone-100 hover:text-retro-black sm:hidden">
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
