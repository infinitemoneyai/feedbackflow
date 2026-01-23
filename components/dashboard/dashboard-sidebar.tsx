"use client";

import { useEffect, useState } from "react";
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
import { UpgradeModal } from "@/components/settings";

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
    setIsEditProjectModalOpen,
    setEditingProjectId,
  } = useDashboard();

  const [openMenuProjectId, setOpenMenuProjectId] = useState<Id<"projects"> | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Get projects for selected team
  const projects = useQuery(
    api.projects.getProjects,
    selectedTeamId ? { teamId: selectedTeamId } : "skip"
  );

  // Get subscription to check if user is on free plan
  const subscription = useQuery(
    api.billing.getSubscription,
    selectedTeamId ? { teamId: selectedTeamId } : "skip"
  );

  // Auto-select first team if none selected
  useEffect(() => {
    const firstTeam = teams?.find((t) => t !== null);
    if (!selectedTeamId && firstTeam) {
      setSelectedTeamId(firstTeam._id);
    }
  }, [teams, selectedTeamId, setSelectedTeamId]);

  // Auto-select first project if none selected
  useEffect(() => {
    if (!selectedProjectId && projects && projects.length > 0) {
      setSelectedProjectId(projects[0]._id);
    }
  }, [projects, selectedProjectId, setSelectedProjectId]);

  const selectedTeam = teams?.find((t) => t?._id === selectedTeamId) ?? null;
  const isAdmin = selectedTeam?.role === "admin";
  const isFreeAccount = subscription?.plan === "free" || !subscription?.plan;

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
    <>
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
              onClick={() => {
                if (isFreeAccount) {
                  setShowUpgradeModal(true);
                } else {
                  setIsCreateProjectModalOpen(true);
                }
              }}
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
                <div key={project._id} className="relative">
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      setSelectedProjectId(project._id);
                      setSidebarOpen(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedProjectId(project._id);
                        setSidebarOpen(false);
                      }
                    }}
                    className={cn(
                      "group relative flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-all",
                      selectedProjectId === project._id
                        ? "border-2 border-retro-black bg-white font-medium shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                        : "border-2 border-transparent text-stone-500 hover:border-stone-200 hover:bg-white hover:text-retro-black hover:shadow-sm"
                    )}
                  >
                    <div
                      className={cn(
                        "h-2 w-2 flex-shrink-0 rounded-full",
                        project.newFeedbackCount > 0
                          ? "animate-pulse bg-retro-blue"
                          : "bg-stone-300"
                      )}
                    />
                    {project.feedbackCount > 0 && (
                      <span
                        className={cn(
                          "flex-shrink-0 rounded border px-1.5 py-0.5 font-mono text-xs leading-none",
                          selectedProjectId === project._id
                            ? "border-retro-black text-retro-black"
                            : "border-stone-300 text-stone-400"
                        )}
                      >
                        {project.feedbackCount}
                      </span>
                    )}
                    <span className="min-w-0 flex-1 truncate">{project.name}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuProjectId(openMenuProjectId === project._id ? null : project._id);
                      }}
                      className={cn(
                        "flex-shrink-0 rounded p-1 transition-colors hover:bg-stone-200",
                        "opacity-0 group-hover:opacity-100",
                        selectedProjectId === project._id && "opacity-100"
                      )}
                    >
                      <Icon name="solar:menu-dots-bold" size={16} />
                    </button>
                  </div>

                  {/* Dropdown menu */}
                  {openMenuProjectId === project._id && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setOpenMenuProjectId(null)}
                      />
                      <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded border-2 border-retro-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
                        <button
                          onClick={() => {
                            setEditingProjectId(project._id);
                            setIsEditProjectModalOpen(true);
                            setOpenMenuProjectId(null);
                          }}
                          className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors hover:bg-stone-50"
                        >
                          <Icon name="solar:eye-linear" size={16} />
                          {isAdmin ? "Edit Project" : "View Details"}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}

            {/* Add Project Button */}
            <button
              onClick={() => {
                if (isFreeAccount) {
                  setShowUpgradeModal(true);
                } else {
                  setIsCreateProjectModalOpen(true);
                }
              }}
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

    {/* Upgrade Modal - rendered outside sidebar */}
    <UpgradeModal
      isOpen={showUpgradeModal}
      onClose={() => setShowUpgradeModal(false)}
      feature="create additional projects"
      teamId={selectedTeamId || undefined}
    />
  </>
  );
}
