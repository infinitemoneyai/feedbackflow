"use client";

import { useEffect } from "react";
import { useQuery } from "convex/react";
import { useUser, UserButton } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Plus, Settings, FolderKanban, BarChart3 } from "lucide-react";
import { Icon } from "@/components/ui/icon";
import { api } from "@/convex/_generated/api";
import { useDashboard } from "./dashboard-layout";
import { cn } from "@/lib/utils";
import { Id } from "@/convex/_generated/dataModel";
import { UsageIndicator } from "./usage-indicator";

export function DashboardSidebar() {
  const { user } = useUser();
  const pathname = usePathname();
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
    setIsCreateProjectModalOpen,
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
      description: "New and triaging feedback",
    },
    {
      id: "backlog" as const,
      label: "Backlog",
      description: "Drafted tickets",
    },
    {
      id: "resolved" as const,
      label: "Resolved",
      description: "Exported and resolved",
    },
  ];

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-64 flex-shrink-0 flex-col border-b-2 border-retro-black bg-stone-50 transition-transform md:relative md:translate-x-0 md:border-b-0 md:border-r-2",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      {/* Brand header */}
      <div className="flex items-center gap-2 border-b-2 border-retro-black bg-retro-yellow p-4">
        <Icon name="solar:infinite-linear" size={24} />
        <Link
          href="/dashboard"
          className="text-sm font-bold uppercase tracking-tight text-retro-black"
          onClick={() => setSidebarOpen(false)}
        >
          Feedback Flow
        </Link>
      </div>

      {/* Projects section */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Projects */}
        <div>
          <div className="mb-3 flex items-center justify-between px-2">
            <span className="font-mono text-xs uppercase tracking-wider text-stone-500">
              Projects
            </span>
            <button
              onClick={() => setIsCreateProjectModalOpen(true)}
              className="rounded p-1 transition-colors hover:bg-stone-200"
              title="Create project"
            >
              <Icon name="solar:add-circle-linear" size={16} />
            </button>
          </div>

          <div className="space-y-2">
            {projects === undefined ? (
              <div className="animate-pulse px-3 py-2 text-center font-mono text-xs text-stone-400">
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
                    "group relative flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-all",
                    selectedProjectId === project._id
                      ? "border-2 border-retro-black bg-white font-medium shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                      : "border-2 border-transparent text-stone-500 hover:border-stone-200 hover:bg-white hover:text-retro-black hover:shadow-sm"
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
                    <span className={cn(
                      "ml-auto font-mono text-xs",
                      selectedProjectId === project._id
                        ? "rounded border border-stone-200 bg-stone-100 px-1"
                        : "opacity-50"
                    )}>
                      {project.feedbackCount}
                    </span>
                  )}
                </button>
              ))
            )}

            {/* Add Project Button */}
            <button
              onClick={() => setIsCreateProjectModalOpen(true)}
              className="mt-2 flex w-full items-center justify-center gap-2 border-2 border-dashed border-stone-300 px-3 py-2 text-sm text-stone-400 transition-colors hover:border-retro-black hover:bg-stone-100 hover:text-retro-black"
            >
              <Icon name="solar:add-square-linear" size={16} />
              <span>Add Project</span>
            </button>
          </div>
        </div>

        {/* Views section */}
        <div>
          <div className="mb-3 px-2">
            <span className="font-mono text-xs uppercase tracking-wider text-stone-500">
              Views
            </span>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === "/dashboard" && currentView === item.id;
              const iconName = item.id === "inbox"
                ? "solar:inbox-linear"
                : item.id === "backlog"
                  ? "solar:bookmark-linear"
                  : "solar:check-circle-linear";

              return (
                <Link
                  key={item.id}
                  href="/dashboard"
                  onClick={() => {
                    setCurrentView(item.id);
                    setSidebarOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded px-3 py-1.5 text-sm font-medium transition-colors",
                    isActive
                      ? "border border-retro-lavender bg-retro-lavender/30 text-retro-black"
                      : "text-stone-500 hover:bg-stone-100 hover:text-retro-black"
                  )}
                >
                  <Icon name={iconName} size={18} />
                  {item.label}
                </Link>
              );
            })}

            {/* Analytics link */}
            <Link
              href="/analytics"
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex w-full items-center gap-3 rounded px-3 py-1.5 text-sm font-medium transition-colors",
                pathname === "/analytics"
                  ? "border border-retro-lavender bg-retro-lavender/30 text-retro-black"
                  : "text-stone-500 hover:bg-stone-100 hover:text-retro-black"
              )}
            >
              <BarChart3 className="h-[18px] w-[18px]" />
              Analytics
            </Link>
          </nav>
        </div>
      </div>

      {/* Usage indicator */}
      {selectedTeamId && <UsageIndicator teamId={selectedTeamId} />}

      {/* User footer */}
      <div className="border-t-2 border-retro-black bg-white p-4">
        <div className="flex items-center gap-3">
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: {
                avatarBox:
                  "h-8 w-8 rounded-full",
              },
            }}
          />
          <div className="min-w-0 flex-1 overflow-hidden">
            <p className="truncate text-sm font-bold text-retro-black">
              {user?.fullName || user?.primaryEmailAddress?.emailAddress}
            </p>
            <p className="truncate text-xs text-stone-500">
              {user?.primaryEmailAddress?.emailAddress}
            </p>
          </div>
          <Link
            href="/settings"
            className="text-stone-400 transition-colors hover:text-retro-black"
            onClick={() => setSidebarOpen(false)}
          >
            <Icon name="solar:settings-linear" size={20} />
          </Link>
        </div>
      </div>
    </aside>
  );
}
