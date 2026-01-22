"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { useSearchParams } from "next/navigation";
import { DashboardSidebar, DashboardHeader, DashboardProvider } from "@/components/dashboard";
import { OnboardingModal } from "@/components/onboarding/onboarding-modal";
import { CreateProjectModal } from "@/components/dashboard/create-project-modal";
import { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";

// Dynamic import for heavy analytics dashboard with recharts
const AnalyticsDashboard = dynamic(
  () => import("@/components/dashboard/analytics-dashboard").then((mod) => ({ default: mod.AnalyticsDashboard })),
  {
    loading: () => (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-stone-400" />
          <p className="mt-2 font-mono text-sm text-stone-500">Loading analytics...</p>
        </div>
      </div>
    ),
    ssr: false,
  }
);

export default function AnalyticsPage() {
  const searchParams = useSearchParams();
  const [selectedTeamId, setSelectedTeamId] = useState<Id<"teams"> | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<Id<"projects"> | null>(null);
  const [selectedFeedbackId, setSelectedFeedbackId] = useState<Id<"feedback"> | null>(null);
  const [currentView, setCurrentView] = useState<"inbox" | "backlog" | "resolved">("inbox");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false);

  // Handle feedback URL parameter
  useEffect(() => {
    const feedbackParam = searchParams.get("feedback");
    if (feedbackParam) {
      setSelectedFeedbackId(feedbackParam as Id<"feedback">);
    }
  }, [searchParams]);

  // Get onboarding state
  const onboardingState = useQuery(api.onboarding.getOnboardingState);
  const teams = useQuery(api.teams.getMyTeams);

  // Get first team and project for onboarding modal
  const firstTeam = teams?.[0];
  const projects = useQuery(
    api.projects.getProjects,
    firstTeam ? { teamId: firstTeam._id } : "skip"
  );
  const firstProject = projects?.[0];

  // Get widget key for first project
  const widgets = useQuery(
    api.projects.getWidgets,
    firstProject ? { projectId: firstProject._id } : "skip"
  );
  const widgetKey = widgets?.[0]?.widgetKey;

  // Show onboarding modal for steps 4-7
  const showOnboardingModal =
    onboardingState &&
    !onboardingState.isComplete &&
    onboardingState.step !== undefined &&
    onboardingState.step >= 4 &&
    onboardingState.step <= 7 &&
    firstTeam &&
    firstProject &&
    widgetKey;

  return (
    <DashboardProvider
      value={{
        selectedTeamId,
        setSelectedTeamId,
        selectedProjectId,
        setSelectedProjectId,
        selectedFeedbackId,
        setSelectedFeedbackId,
        currentView,
        setCurrentView,
        sidebarOpen,
        setSidebarOpen,
        searchQuery,
        setSearchQuery,
        filterType: null,
        setFilterType: () => {},
        isCreateProjectModalOpen: false,
        setIsCreateProjectModalOpen: () => {},
        isEditProjectModalOpen: false,
        setIsEditProjectModalOpen: () => {},
        editingProjectId: null,
        setEditingProjectId: () => {},
      }}
    >
      {/* Outer wrapper with retro background */}
      <div className="flex h-screen flex-col bg-[#e8e6e1] p-2 font-sans antialiased overflow-hidden">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main application shell with retro border and shadow - no ticket panel */}
        <div className="mx-auto flex w-full max-w-[1800px] flex-1 flex-col overflow-hidden border-2 border-retro-black bg-retro-paper shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] md:flex-row">
          {/* Left sidebar */}
          <DashboardSidebar />

          {/* Main content area - full width without ticket panel */}
          <main className="flex min-w-0 flex-1 flex-col bg-stone-100">
            <DashboardHeader />
            <div className="flex-1 overflow-y-auto p-4">
              <AnalyticsDashboard />
            </div>
          </main>
        </div>
      </div>

      {/* Onboarding modal for steps 4-7 */}
      {showOnboardingModal && (
        <OnboardingModal
          teamId={firstTeam._id}
          projectId={firstProject._id}
          widgetKey={widgetKey}
        />
      )}

      {/* Create Project Modal */}
      {selectedTeamId && (
        <CreateProjectModal
          isOpen={isCreateProjectModalOpen}
          onClose={() => setIsCreateProjectModalOpen(false)}
          teamId={selectedTeamId}
          onSuccess={(projectId) => {
            setSelectedProjectId(projectId);
            setSidebarOpen(false);
          }}
        />
      )}
    </DashboardProvider>
  );
}
