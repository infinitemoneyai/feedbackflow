"use client";

import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { useUser, UserButton } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Settings, BarChart3 } from "lucide-react";
import { Icon } from "@/components/ui/icon";
import { api } from "@/convex/_generated/api";
import { useDashboard } from "./dashboard-layout";
import { cn } from "@/lib/utils";
import { UsageIndicator } from "./usage-indicator";
import { UpgradeModal } from "@/components/settings";
import { ProjectSelector } from "./project-selector";

export function DashboardSidebar() {
  const { user } = useUser();
  const pathname = usePathname();
  const teams = useQuery(api.teams.getMyTeams);
  const {
    selectedTeamId,
    setSelectedTeamId,
    selectedProjectId,
    currentView,
    setCurrentView,
    sidebarOpen,
    setSidebarOpen,
    setIsCreateProjectModalOpen,
  } = useDashboard();

  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Get view counts for sidebar badges
  const viewCounts = useQuery(
    api.feedback.getViewCounts,
    selectedProjectId ? { projectId: selectedProjectId } : "skip"
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
        "fixed inset-y-0 left-0 z-50 flex w-64 max-w-[85vw] flex-shrink-0 flex-col border-b-2 border-retro-black bg-stone-50 transition-transform md:relative md:max-w-none md:translate-x-0 md:border-b-0 md:border-r-2",
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

          <ProjectSelector />
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
                  <span className="flex-1">{item.label}</span>
                  {viewCounts && viewCounts[item.id] > 0 && (
                    <span
                      className={cn(
                        "rounded border px-1.5 py-0.5 font-mono text-xs leading-none",
                        isActive
                          ? "border-retro-lavender/50 text-retro-black"
                          : "border-stone-300 text-stone-400"
                      )}
                    >
                      {viewCounts[item.id]}
                    </span>
                  )}
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
