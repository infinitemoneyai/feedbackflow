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
  searchQuery: string;
  setSearchQuery: (query: string) => void;
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
  const [searchQuery, setSearchQuery] = useState("");

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
    </DashboardContext.Provider>
  );
}
