"use client";

import { useState, createContext, useContext, ReactNode } from "react";
import { DashboardSidebar } from "./dashboard-sidebar";
import { DashboardHeader } from "./dashboard-header";
import { TicketDetailPanel } from "./ticket-detail-panel";
import { Id } from "@/convex/_generated/dataModel";

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
}

const DashboardContext = createContext<DashboardContextType | null>(null);

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
}

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [selectedTeamId, setSelectedTeamId] = useState<Id<"teams"> | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<Id<"projects"> | null>(null);
  const [selectedFeedbackId, setSelectedFeedbackId] = useState<Id<"feedback"> | null>(null);
  const [currentView, setCurrentView] = useState<"inbox" | "backlog" | "resolved">("inbox");
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      }}
    >
      <div className="flex h-screen bg-stone-100">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Left sidebar */}
        <DashboardSidebar />

        {/* Main content area */}
        <main className="flex flex-1 flex-col overflow-hidden">
          <DashboardHeader />
          <div className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</div>
        </main>

        {/* Right sidebar for ticket detail (desktop only) */}
        <TicketDetailPanel />
      </div>
    </DashboardContext.Provider>
  );
}
