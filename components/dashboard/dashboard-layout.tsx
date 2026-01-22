"use client";

import { useState, createContext, useContext, ReactNode, useEffect } from "react";
import { useQuery } from "convex/react";
import { useSearchParams } from "next/navigation";
import { DashboardSidebar } from "./dashboard-sidebar";
import { DashboardHeader } from "./dashboard-header";
import { TicketDetailPanel } from "./ticket-detail-panel";
import { OnboardingModal } from "../onboarding/onboarding-modal";
import { CreateProjectModal } from "./create-project-modal";
import { EditProjectModal } from "./edit-project-modal";
import { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";

interface DashboardContextType {
  selectedTeamId: Id<"teams"> | null;
  setSelectedTeamId: (id: Id<"teams"> | null) => void;
  selectedProjectId: Id<"projects"> | null;
  setSelectedProjectId: (id: Id<"projects"> | null) => void;
  selectedFeedbackId: Id<"feedback"> | null;
  setSelectedFeedbackId: (id: Id<"feedback"> | null) => void;
  currentView: "inbox" | "backlog" | "resolved";
  setCurrentView: (view: "inbox" | "backlog" | "resolved") => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterType: "bug" | "feature" | null;
  setFilterType: (type: "bug" | "feature" | null) => void;
  isCreateProjectModalOpen: boolean;
  setIsCreateProjectModalOpen: (open: boolean) => void;
  isEditProjectModalOpen: boolean;
  setIsEditProjectModalOpen: (open: boolean) => void;
  editingProjectId: Id<"projects"> | null;
  setEditingProjectId: (id: Id<"projects"> | null) => void;
}

const DashboardContext = createContext<DashboardContextType | null>(null);

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
}

export const DashboardProvider = DashboardContext.Provider;

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const searchParams = useSearchParams();
  const [selectedTeamId, setSelectedTeamId] = useState<Id<"teams"> | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<Id<"projects"> | null>(null);
  const [selectedFeedbackId, setSelectedFeedbackId] = useState<Id<"feedback"> | null>(null);
  const [currentView, setCurrentView] = useState<"inbox" | "backlog" | "resolved">("inbox");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"bug" | "feature" | null>(null);
  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false);
  const [isEditProjectModalOpen, setIsEditProjectModalOpen] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<Id<"projects"> | null>(null);

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
    <DashboardContext.Provider
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
        filterType,
        setFilterType,
        isCreateProjectModalOpen,
        setIsCreateProjectModalOpen,
        isEditProjectModalOpen,
        setIsEditProjectModalOpen,
        editingProjectId,
        setEditingProjectId,
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

        {/* Main application shell with retro border and shadow */}
        <div className="mx-auto flex w-full max-w-[1800px] flex-1 flex-col overflow-hidden border-2 border-retro-black bg-retro-paper shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] md:flex-row">
          {/* Left sidebar */}
          <DashboardSidebar />

          {/* Main content area */}
          <main className="flex min-w-0 flex-1 flex-col bg-stone-100">
            <DashboardHeader />
            <div className="flex-1 overflow-y-auto p-4">{children}</div>
          </main>

          {/* Right sidebar for ticket detail (desktop only) */}
          <TicketDetailPanel />
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

      {/* Edit Project Modal */}
      {editingProjectId && selectedTeamId && (
        <EditProjectModal
          isOpen={isEditProjectModalOpen}
          onClose={() => {
            setIsEditProjectModalOpen(false);
            setEditingProjectId(null);
          }}
          projectId={editingProjectId}
          isAdmin={teams?.find((t) => t?._id === selectedTeamId)?.role === "admin"}
          onSuccess={() => {
            // Modal will close itself
          }}
          onDelete={() => {
            // If the deleted project was selected, select another one
            if (selectedProjectId === editingProjectId) {
              const otherProject = projects?.find((p) => p._id !== editingProjectId);
              setSelectedProjectId(otherProject?._id || null);
            }
          }}
        />
      )}
    </DashboardContext.Provider>
  );
}
