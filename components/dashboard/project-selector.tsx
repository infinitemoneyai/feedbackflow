"use client";

import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { ChevronDown, FolderKanban, Globe, MoreVertical } from "lucide-react";
import { Icon } from "@/components/ui/icon";
import { api } from "@/convex/_generated/api";
import { useDashboard } from "./dashboard-layout";
import { cn } from "@/lib/utils";

export function ProjectSelector() {
  const {
    selectedTeamId,
    selectedProjectId,
    setSelectedProjectId,
    setCurrentView,
    setSidebarOpen,
    setIsEditProjectModalOpen,
    setEditingProjectId,
  } = useDashboard();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const teams = useQuery(api.teams.getMyTeams);
  const projects = useQuery(
    api.projects.getProjects,
    selectedTeamId ? { teamId: selectedTeamId } : "skip"
  );

  useEffect(() => {
    if (!selectedProjectId && projects && projects.length > 0) {
      setSelectedProjectId(projects[0]._id);
    }
  }, [projects, selectedProjectId, setSelectedProjectId]);

  useEffect(() => {
    if (!isDropdownOpen && !isActionsOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsDropdownOpen(false);
        setSearch("");
        setIsActionsOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isDropdownOpen, isActionsOpen]);

  const selectedTeam = teams?.find((t) => t?._id === selectedTeamId) ?? null;
  const isAdmin = selectedTeam?.role === "admin";

  const selectedProject = projects?.find((p) => p._id === selectedProjectId) ?? null;
  const showSearch = (projects?.length ?? 0) > 5;
  const normalized = search.trim().toLowerCase();
  const filtered = projects?.filter((p) =>
    normalized === "" ? true : p.name.toLowerCase().includes(normalized)
  ) ?? [];

  if (projects === undefined) {
    return (
      <div className="animate-pulse px-3 py-2 text-center font-mono text-xs text-stone-400">
        Loading...
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="rounded border border-dashed border-stone-300 py-4 text-center">
        <FolderKanban className="mx-auto mb-2 h-6 w-6 text-stone-400" />
        <p className="text-xs text-stone-500">No projects yet</p>
      </div>
    );
  }

  return (
    <div className="relative flex items-center gap-1">
      <button
        type="button"
        onClick={() => {
          setIsActionsOpen(false);
          setIsDropdownOpen((v) => !v);
        }}
        aria-haspopup="listbox"
        aria-expanded={isDropdownOpen}
        className="relative z-20 flex min-w-0 flex-1 items-center gap-2 border-2 border-retro-black bg-white px-3 py-2 text-left text-sm font-medium shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
      >
        <div
          className={cn(
            "h-2 w-2 flex-shrink-0 rounded-full",
            selectedProject && selectedProject.newFeedbackCount > 0
              ? "animate-pulse bg-retro-blue"
              : "bg-stone-300"
          )}
        />
        {selectedProject && selectedProject.feedbackCount > 0 && (
          <span className="flex-shrink-0 rounded border border-retro-black px-1.5 py-0.5 font-mono text-xs leading-none text-retro-black">
            {selectedProject.feedbackCount}
          </span>
        )}
        <span className="min-w-0 flex-1 truncate">
          {selectedProject?.name ?? "Select a project"}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 flex-shrink-0 transition-transform",
            isDropdownOpen && "rotate-180"
          )}
        />
      </button>

      {selectedProject && (
        <button
          type="button"
          aria-label="Project actions"
          aria-haspopup="menu"
          aria-expanded={isActionsOpen}
          onClick={() => {
            setIsDropdownOpen(false);
            setSearch("");
            setIsActionsOpen((v) => !v);
          }}
          className="relative z-20 flex-shrink-0 border-2 border-retro-black bg-white p-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-colors hover:bg-stone-100"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      )}

      {isDropdownOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => {
              setIsDropdownOpen(false);
              setSearch("");
            }}
          />
          <div className="absolute left-0 right-0 top-full z-20 mt-1 rounded border-2 border-retro-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
            {showSearch && (
              <div className="border-b-2 border-retro-black p-2">
                <input
                  type="text"
                  autoFocus
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search projects..."
                  className="w-full rounded border border-stone-300 bg-white px-2 py-1 text-sm focus:border-retro-black focus:outline-none"
                />
              </div>
            )}
            <div className="max-h-80 overflow-y-auto p-1">
              {filtered.length === 0 ? (
                <div className="px-3 py-4 text-center font-mono text-xs text-stone-400">
                  No matches
                </div>
              ) : (
                filtered.map((project) => {
                  const isSelected = selectedProjectId === project._id;
                  return (
                    <div
                      key={project._id}
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        setSelectedProjectId(project._id);
                        setIsDropdownOpen(false);
                        setSearch("");
                        setSidebarOpen(false);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelectedProjectId(project._id);
                          setIsDropdownOpen(false);
                          setSearch("");
                          setSidebarOpen(false);
                        }
                      }}
                      className={cn(
                        "flex w-full cursor-pointer items-center gap-2 rounded px-3 py-2 text-left text-sm transition-colors",
                        isSelected
                          ? "bg-stone-100 font-medium text-retro-black"
                          : "text-stone-600 hover:bg-stone-50 hover:text-retro-black"
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
                            isSelected
                              ? "border-retro-black text-retro-black"
                              : "border-stone-300 text-stone-400"
                          )}
                        >
                          {project.feedbackCount}
                        </span>
                      )}
                      <span className="min-w-0 flex-1 truncate">{project.name}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}

      {isActionsOpen && selectedProject && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsActionsOpen(false)}
          />
          <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded border-2 border-retro-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
            {selectedProject.siteUrl && (
              <button
                type="button"
                onClick={() => {
                  setCurrentView("review");
                  setIsActionsOpen(false);
                  setSidebarOpen(false);
                }}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors hover:bg-stone-50"
              >
                <Globe className="h-4 w-4" />
                Review Site
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setEditingProjectId(selectedProject._id);
                setIsEditProjectModalOpen(true);
                setIsActionsOpen(false);
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
  );
}
