"use client";

import { useEffect } from "react";
import { useQuery } from "convex/react";
import { useUser, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import {
  Inbox,
  Bookmark,
  CheckCircle2,
  ChevronDown,
  Plus,
  Settings,
  FolderKanban,
  BarChart3,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import { useDashboard } from "./dashboard-layout";
import { cn } from "@/lib/utils";
import { Id } from "@/convex/_generated/dataModel";
import { UsageIndicator } from "./usage-indicator";

export function DashboardSidebar() {
  const { user } = useUser();
  const teams = useQuery(api.teams.getMyTeams);
  const {
    selectedTeamId,
    setSelectedTeamId,
    selectedProjectId,
    setSelectedProjectId,
    currentView,
    setCurrentView,
    sidebarOpen,
    setSidebarOpen,
  } = useDashboard();

  // Get projects for selected team
  const projects = useQuery(
    api.projects.getProjects,
    selectedTeamId ? { teamId: selectedTeamId } : "skip"
  );

  // Auto-select first team if none selected
  useEffect(() => {
    if (!selectedTeamId && teams && teams.length > 0) {
      setSelectedTeamId(teams[0]._id);
    }
  }, [teams, selectedTeamId, setSelectedTeamId]);

  // Auto-select first project if none selected
  useEffect(() => {
    if (!selectedProjectId && projects && projects.length > 0) {
      setSelectedProjectId(projects[0]._id);
    }
  }, [projects, selectedProjectId, setSelectedProjectId]);

  const selectedTeam = teams?.find((t: { _id: Id<"teams">; name: string }) => t._id === selectedTeamId);

  const navItems = [
    {
      id: "inbox" as const,
      label: "Inbox",
      icon: Inbox,
      description: "New and triaging feedback",
    },
    {
      id: "backlog" as const,
      label: "Backlog",
      icon: Bookmark,
      description: "Drafted tickets",
    },
    {
      id: "resolved" as const,
      label: "Resolved",
      icon: CheckCircle2,
      description: "Exported and resolved",
    },
  ];

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r-2 border-retro-black bg-stone-50 transition-transform lg:relative lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      {/* Brand header */}
      <div className="border-b-2 border-retro-black bg-retro-yellow p-4">
        <Link
          href="/dashboard"
          className="font-mono text-lg font-bold tracking-tight text-retro-black"
          onClick={() => setSidebarOpen(false)}
        >
          FeedbackFlow
        </Link>
      </div>

      {/* Team selector */}
      <div className="border-b-2 border-retro-black bg-white p-3">
        <button className="flex w-full items-center justify-between rounded border-2 border-stone-200 bg-stone-50 px-3 py-2 text-sm font-medium text-retro-black transition-colors hover:border-retro-black">
          <span className="truncate">{selectedTeam?.name || "Select Team"}</span>
          <ChevronDown className="h-4 w-4 flex-shrink-0 text-stone-500" />
        </button>
      </div>

      {/* Projects section */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Projects header */}
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-stone-500">
            Projects
          </h3>
          <button
            className="rounded p-1 text-stone-400 transition-colors hover:bg-stone-100 hover:text-retro-black"
            title="Create project"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* Projects list */}
        <div className="mb-6 space-y-1">
          {projects === undefined ? (
            <div className="animate-pulse py-2 text-center font-mono text-xs text-stone-400">
              Loading...
            </div>
          ) : projects.length === 0 ? (
            <div className="rounded border border-dashed border-stone-300 py-4 text-center">
              <FolderKanban className="mx-auto mb-2 h-6 w-6 text-stone-400" />
              <p className="text-xs text-stone-500">No projects yet</p>
            </div>
          ) : (
            projects.map((project: { _id: Id<"projects">; name: string; feedbackCount: number; newFeedbackCount: number }) => (
              <button
                key={project._id}
                onClick={() => {
                  setSelectedProjectId(project._id);
                  setSidebarOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-3 rounded px-3 py-2 text-left text-sm transition-all",
                  selectedProjectId === project._id
                    ? "border-2 border-retro-black bg-white font-medium shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]"
                    : "border-2 border-transparent hover:border-stone-200 hover:bg-white"
                )}
              >
                <div
                  className={cn(
                    "h-2 w-2 rounded-full",
                    project.newFeedbackCount > 0
                      ? "animate-pulse bg-retro-blue"
                      : "bg-stone-300"
                  )}
                />
                <span className="truncate">{project.name}</span>
                {project.feedbackCount > 0 && (
                  <span className="ml-auto rounded border border-stone-200 bg-stone-100 px-1.5 font-mono text-xs text-stone-600">
                    {project.feedbackCount}
                  </span>
                )}
              </button>
            ))
          )}
        </div>

        {/* Views section */}
        <div className="mb-3">
          <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-stone-500">
            Views
          </h3>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentView(item.id);
                  setSidebarOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-3 rounded px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "border border-retro-lavender bg-retro-lavender/30 text-retro-black"
                    : "text-stone-500 hover:bg-stone-100 hover:text-retro-black"
                )}
              >
                <Icon className="h-[18px] w-[18px]" />
                {item.label}
              </button>
            );
          })}

          {/* Analytics link */}
          <Link
            href="/analytics"
            onClick={() => setSidebarOpen(false)}
            className="flex w-full items-center gap-3 rounded px-3 py-2 text-sm font-medium text-stone-500 transition-colors hover:bg-stone-100 hover:text-retro-black"
          >
            <BarChart3 className="h-[18px] w-[18px]" />
            Analytics
          </Link>
        </nav>
      </div>

      {/* Usage indicator */}
      {selectedTeamId && <UsageIndicator teamId={selectedTeamId} />}

      {/* User footer */}
      <div className="border-t border-stone-200 bg-white p-4">
        <div className="flex items-center gap-3">
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: {
                avatarBox:
                  "h-9 w-9 border-2 border-retro-black shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]",
              },
            }}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-retro-black">
              {user?.fullName || user?.primaryEmailAddress?.emailAddress}
            </p>
            <p className="truncate text-xs text-stone-500">
              {user?.primaryEmailAddress?.emailAddress}
            </p>
          </div>
          <Link
            href="/settings"
            className="rounded p-2 text-stone-400 transition-colors hover:bg-stone-100 hover:text-retro-black"
            onClick={() => setSidebarOpen(false)}
          >
            <Settings className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </aside>
  );
}
