"use client";

import { useState, useCallback, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import {
  ExternalLink,
  Loader2,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Settings,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface LinearExportSectionProps {
  feedbackId: Id<"feedback">;
  teamId: Id<"teams">;
}

interface LinearTeam {
  id: string;
  name: string;
  key: string;
}

interface LinearProject {
  id: string;
  name: string;
}

interface LinearLabel {
  id: string;
  name: string;
  color: string;
}

export function LinearExportSection({ feedbackId, teamId }: LinearExportSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportResult, setExportResult] = useState<{
    success: boolean;
    issueUrl?: string;
    issueIdentifier?: string;
    error?: string;
  } | null>(null);

  // Linear integration data
  const integration = useQuery(api.integrations.getLinearIntegration, { teamId });
  const exports = useQuery(api.integrations.getExportsForFeedback, { feedbackId });
  const feedback = useQuery(api.feedback.getFeedback, { feedbackId });
  const ticketDraft = useQuery(api.ai.getTicketDraft, { feedbackId });
  const createExport = useMutation(api.integrations.createExport);

  // Linear data for overrides
  const [linearTeams, setLinearTeams] = useState<LinearTeam[]>([]);
  const [linearProjects, setLinearProjects] = useState<LinearProject[]>([]);
  const [linearLabels, setLinearLabels] = useState<LinearLabel[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Selected values (can override defaults)
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);
  const [showOptions, setShowOptions] = useState(false);

  // Initialize with default values from integration
  useEffect(() => {
    if (integration?.settings) {
      if (integration.settings.linearTeamId && !selectedTeamId) {
        setSelectedTeamId(integration.settings.linearTeamId);
      }
      if (integration.settings.linearProjectId && !selectedProjectId) {
        setSelectedProjectId(integration.settings.linearProjectId);
      }
      if (integration.settings.linearLabelIds && selectedLabelIds.length === 0) {
        setSelectedLabelIds(integration.settings.linearLabelIds);
      }
    }
  }, [integration, selectedTeamId, selectedProjectId, selectedLabelIds.length]);

  // Check if there's an existing export to Linear
  const existingLinearExport = exports?.find(
    (e: { provider: string; status: string }) => e.provider === "linear" && e.status === "success"
  );

  // Fetch Linear teams when options are shown
  const fetchLinearData = useCallback(async () => {
    if (!integration?.hasApiKey) return;

    setIsLoadingData(true);
    try {
      // Fetch teams
      const teamsResponse = await fetch("/api/integrations/linear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "getTeams", apiKey: "stored" }),
      });
      const teamsData = await teamsResponse.json();
      if (teamsData.teams) {
        setLinearTeams(teamsData.teams);
      }

      // If we have a selected team, fetch projects and labels
      const teamIdToUse = selectedTeamId || integration?.settings?.linearTeamId;
      if (teamIdToUse) {
        const [projectsRes, labelsRes] = await Promise.all([
          fetch("/api/integrations/linear", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "getProjects",
              apiKey: "stored",
              teamId: teamIdToUse,
            }),
          }),
          fetch("/api/integrations/linear", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "getLabels",
              apiKey: "stored",
              teamId: teamIdToUse,
            }),
          }),
        ]);

        const projectsData = await projectsRes.json();
        const labelsData = await labelsRes.json();

        if (projectsData.projects) setLinearProjects(projectsData.projects);
        if (labelsData.labels) setLinearLabels(labelsData.labels);
      }
    } catch (error) {
      console.error("Failed to fetch Linear data:", error);
    } finally {
      setIsLoadingData(false);
    }
  }, [integration, selectedTeamId]);

  // Fetch when options are expanded
  useEffect(() => {
    if (showOptions && linearTeams.length === 0) {
      fetchLinearData();
    }
  }, [showOptions, linearTeams.length, fetchLinearData]);

  // Handle team change
  const handleTeamChange = useCallback(async (newTeamId: string) => {
    setSelectedTeamId(newTeamId);
    setSelectedProjectId("");
    setSelectedLabelIds([]);

    if (newTeamId) {
      setIsLoadingData(true);
      try {
        const [projectsRes, labelsRes] = await Promise.all([
          fetch("/api/integrations/linear", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "getProjects",
              apiKey: "stored",
              teamId: newTeamId,
            }),
          }),
          fetch("/api/integrations/linear", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "getLabels",
              apiKey: "stored",
              teamId: newTeamId,
            }),
          }),
        ]);

        const projectsData = await projectsRes.json();
        const labelsData = await labelsRes.json();

        if (projectsData.projects) setLinearProjects(projectsData.projects);
        if (labelsData.labels) setLinearLabels(labelsData.labels);
      } catch (error) {
        console.error("Failed to fetch Linear data:", error);
      } finally {
        setIsLoadingData(false);
      }
    }
  }, []);

  // Handle export
  const handleExport = useCallback(async () => {
    if (!integration?.hasApiKey || !feedback || !selectedTeamId) return;

    setIsExporting(true);
    setExportResult(null);

    try {
      // Build the feedback payload with ticket draft if available
      const feedbackPayload = {
        title: feedback.title,
        description: feedback.description,
        type: feedback.type,
        priority: feedback.priority,
        screenshotUrl: feedback.screenshotUrl,
        recordingUrl: feedback.recordingUrl,
        metadata: feedback.metadata,
        submitterName: feedback.submitterName,
        submitterEmail: feedback.submitterEmail,
        tags: feedback.tags,
        ticketDraft: ticketDraft
          ? {
              title: ticketDraft.title,
              description: ticketDraft.description,
              acceptanceCriteria: ticketDraft.acceptanceCriteria,
              reproSteps: ticketDraft.reproSteps,
              expectedBehavior: ticketDraft.expectedBehavior,
              actualBehavior: ticketDraft.actualBehavior,
            }
          : undefined,
      };

      const response = await fetch("/api/integrations/linear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "createIssue",
          apiKey: "stored",
          linearTeamId: selectedTeamId,
          linearProjectId: selectedProjectId || undefined,
          linearLabelIds: selectedLabelIds.length > 0 ? selectedLabelIds : undefined,
          feedback: feedbackPayload,
        }),
      });

      const data = await response.json();

      if (data.issue) {
        // Create export record
        await createExport({
          feedbackId,
          provider: "linear",
          externalId: data.issue.id,
          externalUrl: data.issue.url,
          exportedData: {
            identifier: data.issue.identifier,
            title: data.issue.title,
          },
          status: "success",
        });

        setExportResult({
          success: true,
          issueUrl: data.issue.url,
          issueIdentifier: data.issue.identifier,
        });
      } else {
        throw new Error(data.error || "Failed to create issue");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Export failed";

      // Log failed export
      await createExport({
        feedbackId,
        provider: "linear",
        status: "failed",
        errorMessage,
      });

      setExportResult({
        success: false,
        error: errorMessage,
      });
    } finally {
      setIsExporting(false);
    }
  }, [
    integration,
    feedback,
    ticketDraft,
    selectedTeamId,
    selectedProjectId,
    selectedLabelIds,
    feedbackId,
    createExport,
  ]);

  // Toggle label selection
  const handleLabelToggle = (labelId: string) => {
    setSelectedLabelIds((prev) =>
      prev.includes(labelId)
        ? prev.filter((id) => id !== labelId)
        : [...prev, labelId]
    );
  };

  // Not connected state
  if (!integration?.hasApiKey) {
    return (
      <div className="rounded border border-stone-200 bg-stone-50 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-purple-200 bg-purple-50">
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5 text-purple-400"
              fill="currentColor"
            >
              <path d="M21.41 8.64v6.72h-5.76v-3.36h2.88V8.64a1.44 1.44 0 0 0-1.44-1.44H8.64a1.44 1.44 0 0 0-1.44 1.44V12h2.88v3.36H4.32V8.64A4.32 4.32 0 0 1 8.64 4.32h8.45a4.32 4.32 0 0 1 4.32 4.32z" />
              <path d="M17.09 15.36v-3.36H7.2v3.36a1.44 1.44 0 0 0 1.44 1.44h8.45a4.32 4.32 0 0 1-4.32 4.32H4.32a4.32 4.32 0 0 1 4.32-4.32h8.45z" />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-medium text-stone-600">Export to Linear</h4>
            <p className="text-xs text-stone-400">
              Connect Linear in settings to export issues
            </p>
          </div>
          <Link
            href="/settings"
            className="flex items-center gap-1 rounded border border-stone-300 px-3 py-1.5 text-xs font-medium text-stone-600 transition-colors hover:border-stone-400"
          >
            <Settings className="h-3 w-3" />
            Connect
          </Link>
        </div>
      </div>
    );
  }

  // Already exported state
  if (existingLinearExport) {
    return (
      <div className="rounded border-2 border-green-200 bg-green-50 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-green-300 bg-green-100">
            <Check className="h-5 w-5 text-green-600" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-medium text-green-700">
              Routed to Linear
            </h4>
            <p className="text-xs text-green-600">
              Issue {existingLinearExport.exportedData?.identifier || "created"}
            </p>
          </div>
          {existingLinearExport.externalUrl && (
            <a
              href={existingLinearExport.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 rounded border-2 border-green-300 bg-white px-3 py-1.5 text-xs font-medium text-green-700 transition-colors hover:bg-green-50"
            >
              View in Linear
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
      {/* Header */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsExpanded(!isExpanded);
        }}
        className="flex w-full items-center gap-3 rounded border-2 border-purple-200 bg-purple-50 p-3 text-left transition-colors hover:border-purple-300"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-purple-300 bg-purple-100">
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5 text-purple-600"
            fill="currentColor"
          >
            <path d="M21.41 8.64v6.72h-5.76v-3.36h2.88V8.64a1.44 1.44 0 0 0-1.44-1.44H8.64a1.44 1.44 0 0 0-1.44 1.44V12h2.88v3.36H4.32V8.64A4.32 4.32 0 0 1 8.64 4.32h8.45a4.32 4.32 0 0 1 4.32 4.32z" />
            <path d="M17.09 15.36v-3.36H7.2v3.36a1.44 1.44 0 0 0 1.44 1.44h8.45a4.32 4.32 0 0 1-4.32 4.32H4.32a4.32 4.32 0 0 1 4.32-4.32h8.45z" />
          </svg>
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-medium text-purple-700">Route to Linear</h4>
          <p className="text-xs text-purple-500">
            {ticketDraft
              ? "Use ticket draft to create Linear issue"
              : "Create a Linear issue from this feedback"}
          </p>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-purple-400" />
        ) : (
          <ChevronDown className="h-5 w-5 text-purple-400" />
        )}
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="rounded border-2 border-purple-200 bg-white p-4">
          {/* Options toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowOptions(!showOptions);
            }}
            className="mb-3 flex items-center gap-1 text-xs text-purple-600 hover:underline"
          >
            <Settings className="h-3 w-3" />
            {showOptions ? "Hide options" : "Show options"}
          </button>

          {/* Options */}
          {showOptions && (
            <div className="mb-4 space-y-3 rounded border border-stone-200 bg-stone-50 p-3">
              {isLoadingData ? (
                <div className="flex items-center gap-2 text-xs text-stone-500">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Loading Linear data...
                </div>
              ) : (
                <>
                  {/* Team selector */}
                  <div>
                    <label className="mb-1 block text-xs font-medium text-stone-600">
                      Team
                    </label>
                    <div className="relative">
                      <select
                        value={selectedTeamId}
                        onChange={(e) => handleTeamChange(e.target.value)}
                        className="w-full appearance-none rounded border border-stone-200 bg-white px-3 py-1.5 pr-8 text-sm focus:border-purple-400 focus:outline-none"
                      >
                        <option value="">Select team...</option>
                        {linearTeams.map((team) => (
                          <option key={team.id} value={team.id}>
                            {team.name} ({team.key})
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                    </div>
                  </div>

                  {/* Project selector */}
                  {selectedTeamId && linearProjects.length > 0 && (
                    <div>
                      <label className="mb-1 block text-xs font-medium text-stone-600">
                        Project <span className="text-stone-400">(optional)</span>
                      </label>
                      <div className="relative">
                        <select
                          value={selectedProjectId}
                          onChange={(e) => setSelectedProjectId(e.target.value)}
                          className="w-full appearance-none rounded border border-stone-200 bg-white px-3 py-1.5 pr-8 text-sm focus:border-purple-400 focus:outline-none"
                        >
                          <option value="">No project</option>
                          {linearProjects.map((project) => (
                            <option key={project.id} value={project.id}>
                              {project.name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                      </div>
                    </div>
                  )}

                  {/* Label selector */}
                  {selectedTeamId && linearLabels.length > 0 && (
                    <div>
                      <label className="mb-1 block text-xs font-medium text-stone-600">
                        Labels <span className="text-stone-400">(optional)</span>
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {linearLabels.map((label) => (
                          <button
                            key={label.id}
                            onClick={() => handleLabelToggle(label.id)}
                            className={cn(
                              "flex items-center gap-1 rounded border px-2 py-0.5 text-xs transition-all",
                              selectedLabelIds.includes(label.id)
                                ? "border-purple-400 bg-purple-100 text-purple-700"
                                : "border-stone-200 bg-white text-stone-600 hover:border-stone-300"
                            )}
                          >
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: label.color }}
                            />
                            {label.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Export button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleExport();
            }}
            disabled={isExporting || !selectedTeamId}
            className="flex w-full items-center justify-center gap-2 rounded border-2 border-purple-600 bg-purple-600 px-4 py-2.5 text-sm font-medium text-white shadow-[4px_4px_0px_0px_rgba(107,70,193,0.5)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(107,70,193,0.5)] disabled:opacity-50 disabled:hover:translate-x-0 disabled:hover:translate-y-0"
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Routing to Linear...
              </>
            ) : (
              <>
                <ExternalLink className="h-4 w-4" />
                Route to Linear
              </>
            )}
          </button>

          {!selectedTeamId && !showOptions && (
            <p className="mt-2 text-center text-xs text-stone-500">
              Click &quot;Show options&quot; to select a team
            </p>
          )}

          {/* Export result */}
          {exportResult && (
            <div
              className={cn(
                "mt-3 flex items-center gap-2 rounded border p-3 text-sm",
                exportResult.success
                  ? "border-green-200 bg-green-50 text-green-700"
                  : "border-red-200 bg-red-50 text-red-700"
              )}
            >
              {exportResult.success ? (
                <>
                  <Check className="h-4 w-4" />
                  <span className="flex-1">
                    Created {exportResult.issueIdentifier}
                  </span>
                  {exportResult.issueUrl && (
                    <a
                      href={exportResult.issueUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-green-600 hover:underline"
                    >
                      View <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </>
              ) : (
                <>
                  <X className="h-4 w-4" />
                  <span>{exportResult.error}</span>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
