"use client";

import { useState, useCallback, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import {
  Key,
  Eye,
  EyeOff,
  Check,
  X,
  Loader2,
  Trash2,
  RefreshCw,
  ExternalLink,
  ChevronDown,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";

interface LinearConfigSectionProps {
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
  description?: string;
}

interface LinearLabel {
  id: string;
  name: string;
  color: string;
}

export function LinearConfigSection({ teamId }: LinearConfigSectionProps) {
  const integration = useQuery(api.integrations.getLinearIntegration, { teamId });
  const saveIntegration = useMutation(api.integrations.saveLinearIntegration);
  const updateSettings = useMutation(api.integrations.updateLinearSettings);
  const deleteIntegration = useMutation(api.integrations.deleteLinearIntegration);

  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [testResult, setTestResult] = useState<{
    valid: boolean;
    organization?: string;
    error?: string;
  } | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Linear data
  const [linearTeams, setLinearTeams] = useState<LinearTeam[]>([]);
  const [linearProjects, setLinearProjects] = useState<LinearProject[]>([]);
  const [linearLabels, setLinearLabels] = useState<LinearLabel[]>([]);
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [isLoadingLabels, setIsLoadingLabels] = useState(false);

  // Selected values
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);

  const hasKey = integration?.hasApiKey;

  // Debug: log integration state
  useEffect(() => {
    // Integration state updated
  }, [integration, hasKey]);

  // Load existing settings
  useEffect(() => {
    if (integration?.settings) {
      if (integration.settings.linearTeamId) {
        setSelectedTeamId(integration.settings.linearTeamId);
      }
      if (integration.settings.linearProjectId) {
        setSelectedProjectId(integration.settings.linearProjectId);
      }
      if (integration.settings.linearLabelIds) {
        setSelectedLabelIds(integration.settings.linearLabelIds);
      }
    }
  }, [integration]);

  // Fetch teams when key is saved
  const fetchTeams = useCallback(async (key?: string) => {
    setIsLoadingTeams(true);
    try {
      const response = await fetch("/api/integrations/linear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "getTeams",
          apiKey: key || "stored", // "stored" signals to use saved key
          teamId: teamId, // Convex team ID for retrieving stored key
        }),
      });
      const data = await response.json();
      if (data.teams) {
        setLinearTeams(data.teams);
      }
    } catch (error) {
      console.error("Failed to fetch Linear teams:", error);
    } finally {
      setIsLoadingTeams(false);
    }
  }, []);

  // Fetch projects when team is selected
  const fetchProjects = useCallback(async (linearTeamId: string) => {
    setIsLoadingProjects(true);
    try {
      const response = await fetch("/api/integrations/linear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "getProjects",
          apiKey: apiKey || "stored",
          teamId: teamId, // Convex team ID for retrieving stored key
          linearTeamId: linearTeamId, // Linear team ID for filtering
        }),
      });
      const data = await response.json();
      if (data.projects) {
        setLinearProjects(data.projects);
      }
    } catch (error) {
      console.error("Failed to fetch Linear projects:", error);
    } finally {
      setIsLoadingProjects(false);
    }
  }, [apiKey]);

  // Fetch labels when team is selected
  const fetchLabels = useCallback(async (linearTeamId: string) => {
    setIsLoadingLabels(true);
    try {
      const response = await fetch("/api/integrations/linear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "getLabels",
          apiKey: apiKey || "stored",
          teamId: teamId, // Convex team ID for retrieving stored key
          linearTeamId: linearTeamId, // Linear team ID for filtering
        }),
      });
      const data = await response.json();
      if (data.labels) {
        setLinearLabels(data.labels);
      }
    } catch (error) {
      console.error("Failed to fetch Linear labels:", error);
    } finally {
      setIsLoadingLabels(false);
    }
  }, [apiKey]);

  // When team selection changes
  const handleTeamChange = useCallback(async (newTeamId: string) => {
    setSelectedTeamId(newTeamId);
    setSelectedProjectId("");
    setSelectedLabelIds([]);
    setLinearProjects([]);
    setLinearLabels([]);

    if (newTeamId) {
      await Promise.all([
        fetchProjects(newTeamId),
        fetchLabels(newTeamId),
      ]);
    }
  }, [fetchProjects, fetchLabels]);

  // Test connection
  const handleTestConnection = useCallback(async () => {
    if (!apiKey && !hasKey) return;

    setIsTesting(true);
    setTestResult(null);

    try {
      const response = await fetch("/api/integrations/linear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "test",
          apiKey: apiKey || "stored",
          teamId: teamId, // Convex team ID for retrieving stored key
        }),
      });

      const result = await response.json();
      setTestResult(result);

      // If successful and we have a new key, fetch teams
      if (result.valid && apiKey) {
        await fetchTeams(apiKey);
      }
    } catch (error) {
      setTestResult({
        valid: false,
        error: error instanceof Error ? error.message : "Connection failed",
      });
    } finally {
      setIsTesting(false);
    }
  }, [apiKey, hasKey, fetchTeams]);

  // Save API key
  const handleSaveKey = useCallback(async () => {
    if (!apiKey) return;

    // Validate key format (Linear keys start with "lin_api_")
    if (!apiKey.startsWith("lin_api_")) {
      setSaveError("Invalid key format. Linear API keys should start with 'lin_api_'");
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setTestResult(null);

    try {
      // First test the key
      const testResponse = await fetch("/api/integrations/linear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test", apiKey }),
      });

      const testResultData = await testResponse.json();

      if (!testResultData.valid) {
        setSaveError(testResultData.error || "Invalid API key");
        setTestResult({ valid: false, error: testResultData.error });
        return;
      }

      // Save the key
      await saveIntegration({
        teamId,
        apiKey,
        linearTeamId: selectedTeamId || undefined,
        linearProjectId: selectedProjectId || undefined,
        linearLabelIds: selectedLabelIds.length > 0 ? selectedLabelIds : undefined,
      });

      setApiKey("");
      setTestResult({ valid: true, organization: testResultData.organization });

      // Fetch teams after saving
      await fetchTeams(apiKey);
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Failed to save API key"
      );
    } finally {
      setIsSaving(false);
    }
  }, [apiKey, teamId, selectedTeamId, selectedProjectId, selectedLabelIds, saveIntegration, fetchTeams]);

  // Update settings
  const handleUpdateSettings = useCallback(async () => {
    try {
      await updateSettings({
        teamId,
        linearTeamId: selectedTeamId || undefined,
        linearProjectId: selectedProjectId || undefined,
        linearLabelIds: selectedLabelIds.length > 0 ? selectedLabelIds : undefined,
      });
    } catch (error) {
      console.error("Failed to update settings:", error);
    }
  }, [teamId, selectedTeamId, selectedProjectId, selectedLabelIds, updateSettings]);

  // Delete integration
  const handleDeleteKey = useCallback(async () => {
    if (!confirm("Are you sure you want to delete your Linear integration?")) {
      return;
    }

    setIsDeleting(true);

    try {
      await deleteIntegration({ teamId });
      setTestResult(null);
      setLinearTeams([]);
      setLinearProjects([]);
      setLinearLabels([]);
      setSelectedTeamId("");
      setSelectedProjectId("");
      setSelectedLabelIds([]);
    } catch (error) {
      console.error("Failed to delete integration:", error);
    } finally {
      setIsDeleting(false);
    }
  }, [teamId, deleteIntegration]);

  // Auto-load teams when integration exists
  useEffect(() => {
    if (hasKey && linearTeams.length === 0) {
      fetchTeams();
    }
  }, [hasKey, linearTeams.length, fetchTeams]);

  // Auto-load projects and labels when saved team is loaded
  useEffect(() => {
    if (hasKey && selectedTeamId && linearProjects.length === 0 && linearLabels.length === 0) {
      Promise.all([
        fetchProjects(selectedTeamId),
        fetchLabels(selectedTeamId),
      ]);
    }
  }, [hasKey, selectedTeamId, linearProjects.length, linearLabels.length, fetchProjects, fetchLabels]);

  // Toggle label selection
  const handleLabelToggle = (labelId: string) => {
    setSelectedLabelIds((prev) =>
      prev.includes(labelId)
        ? prev.filter((id) => id !== labelId)
        : [...prev, labelId]
    );
  };

  return (
    <div className="rounded border-2 border-retro-black bg-white shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-retro-black bg-stone-50 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-purple-600 bg-purple-100">
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5 text-purple-600"
              fill="currentColor"
            >
              <path d="M21.41 8.64v6.72h-5.76v-3.36h2.88V8.64a1.44 1.44 0 0 0-1.44-1.44H8.64a1.44 1.44 0 0 0-1.44 1.44V12h2.88v3.36H4.32V8.64A4.32 4.32 0 0 1 8.64 4.32h8.45a4.32 4.32 0 0 1 4.32 4.32z" />
              <path d="M17.09 15.36v-3.36H7.2v3.36a1.44 1.44 0 0 0 1.44 1.44h8.45a4.32 4.32 0 0 1-4.32 4.32H4.32a4.32 4.32 0 0 1 4.32-4.32h8.45z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-retro-black">Linear</h3>
            <p className="text-xs text-stone-500">Export issues to Linear</p>
          </div>
        </div>

        {hasKey && (
          <div className="flex items-center gap-2">
            {integration?.isActive ? (
              <span className="flex items-center gap-1 rounded bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                <Check className="h-3 w-3" />
                Connected
              </span>
            ) : (
              <span className="flex items-center gap-1 rounded bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-700">
                <RefreshCw className="h-3 w-3" />
                Not active
              </span>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        {hasKey ? (
          <div className="space-y-4">
            {/* Existing key display */}
            <div>
              <label className="mb-2 block text-sm font-medium text-stone-700">
                API Key
              </label>
              <div className="flex items-center gap-3">
                <div className="flex-1 rounded border-2 border-stone-200 bg-stone-50 px-4 py-2.5 font-mono text-sm text-stone-600">
                  lin_api_••••••••••••
                </div>
                <button
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  className="flex items-center gap-2 rounded border-2 border-retro-black bg-white px-4 py-2 text-sm font-medium transition-all hover:bg-stone-50 disabled:opacity-50"
                >
                  {isTesting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  Test
                </button>
                <button
                  onClick={handleDeleteKey}
                  disabled={isDeleting}
                  className="flex items-center gap-2 rounded border-2 border-retro-red bg-white px-4 py-2 text-sm font-medium text-retro-red transition-all hover:bg-retro-red/10 disabled:opacity-50"
                >
                  {isDeleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  Delete
                </button>
              </div>
            </div>

            {/* Team selector */}
            <div>
              <label className="mb-2 block text-sm font-medium text-stone-700">
                Default Team
              </label>
              <div className="relative">
                <select
                  value={selectedTeamId}
                  onChange={(e) => handleTeamChange(e.target.value)}
                  onBlur={handleUpdateSettings}
                  disabled={isLoadingTeams}
                  className="w-full appearance-none rounded border-2 border-stone-200 bg-white px-4 py-2.5 pr-10 text-sm transition-colors focus:border-retro-black focus:outline-none disabled:opacity-50"
                >
                  <option value="">Select a team...</option>
                  {linearTeams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name} ({team.key})
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              </div>
              {isLoadingTeams && (
                <p className="mt-1 flex items-center gap-1 text-xs text-stone-500">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Loading teams...
                </p>
              )}
              {!isLoadingTeams && linearTeams.length === 0 && hasKey && (
                <button
                  onClick={() => fetchTeams()}
                  className="mt-1 text-xs text-retro-blue hover:underline"
                >
                  Load teams
                </button>
              )}
            </div>

            {/* Project selector */}
            {selectedTeamId && (
              <div>
                <label className="mb-2 block text-sm font-medium text-stone-700">
                  Default Project <span className="text-stone-400">(optional)</span>
                </label>
                <div className="relative">
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    onBlur={handleUpdateSettings}
                    disabled={isLoadingProjects}
                    className="w-full appearance-none rounded border-2 border-stone-200 bg-white px-4 py-2.5 pr-10 text-sm transition-colors focus:border-retro-black focus:outline-none disabled:opacity-50"
                  >
                    <option value="">No project</option>
                    {linearProjects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                </div>
                {isLoadingProjects && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-stone-500">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Loading projects...
                  </p>
                )}
              </div>
            )}

            {/* Label selector */}
            {selectedTeamId && (
              <div>
                <label className="mb-2 block text-sm font-medium text-stone-700">
                  Default Labels <span className="text-stone-400">(optional)</span>
                </label>
                {isLoadingLabels ? (
                  <p className="flex items-center gap-1 text-xs text-stone-500">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Loading labels...
                  </p>
                ) : linearLabels.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {linearLabels.map((label) => (
                      <button
                        key={label.id}
                        onClick={() => {
                          handleLabelToggle(label.id);
                          // Save after a short delay to batch changes
                          setTimeout(handleUpdateSettings, 100);
                        }}
                        className={cn(
                          "flex items-center gap-1.5 rounded border px-2 py-1 text-xs transition-all",
                          selectedLabelIds.includes(label.id)
                            ? "border-retro-black bg-retro-black text-white"
                            : "border-stone-200 bg-white text-stone-600 hover:border-stone-300"
                        )}
                      >
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: label.color }}
                        />
                        {label.name}
                        {selectedLabelIds.includes(label.id) && (
                          <Check className="h-3 w-3" />
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-stone-500">No labels found</p>
                )}
              </div>
            )}

            {/* Update key section */}
            <div className="border-t border-stone-200 pt-4">
              <p className="mb-2 text-sm text-stone-500">
                Need to update your API key?
              </p>
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <input
                    type={showKey ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => {
                      setApiKey(e.target.value);
                      setSaveError(null);
                      setTestResult(null);
                    }}
                    placeholder="lin_api_..."
                    className="w-full rounded border-2 border-stone-200 bg-stone-50 px-4 py-2.5 pr-10 font-mono text-sm transition-colors focus:border-retro-black focus:bg-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                  >
                    {showKey ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <button
                  onClick={handleSaveKey}
                  disabled={!apiKey || isSaving}
                  className="flex items-center gap-2 rounded border-2 border-retro-black bg-retro-black px-4 py-2 text-sm font-medium text-white transition-all hover:bg-stone-800 disabled:opacity-50"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  Update
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* New key input */}
            <div>
              <label className="mb-2 block text-sm font-medium text-stone-700">
                API Key
              </label>
              <div className="relative">
                <input
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                    setSaveError(null);
                    setTestResult(null);
                  }}
                  placeholder="lin_api_..."
                  className="w-full rounded border-2 border-stone-200 bg-stone-50 px-4 py-2.5 pr-10 font-mono text-sm transition-colors focus:border-retro-black focus:bg-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  {showKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="mt-1 text-xs text-stone-500">
                Get your API key from the{" "}
                <a
                  href="https://linear.app/settings/api"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-0.5 text-retro-blue hover:underline"
                >
                  Linear settings
                  <ExternalLink className="h-3 w-3" />
                </a>
              </p>
            </div>

            {/* Save button */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleSaveKey}
                disabled={!apiKey || isSaving}
                className="flex items-center gap-2 rounded border-2 border-retro-black bg-retro-black px-6 py-2.5 text-sm font-medium text-white shadow-[4px_4px_0px_0px_#888] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000] disabled:opacity-50 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[4px_4px_0px_0px_#888]"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Key className="h-4 w-4" />
                )}
                Connect Linear
              </button>
              <button
                onClick={handleTestConnection}
                disabled={!apiKey || isTesting}
                className="flex items-center gap-2 rounded border-2 border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 transition-all hover:border-retro-black disabled:opacity-50"
              >
                {isTesting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Test Connection
              </button>
            </div>
          </div>
        )}

        {/* Test result / Error message */}
        {(testResult || saveError) && (
          <div
            className={cn(
              "mt-4 flex items-center gap-2 rounded border px-4 py-3 text-sm",
              testResult?.valid
                ? "border-green-200 bg-green-50 text-green-700"
                : "border-red-200 bg-red-50 text-red-700"
            )}
          >
            {testResult?.valid ? (
              <>
                <Check className="h-4 w-4" />
                Connected to {testResult.organization}
              </>
            ) : (
              <>
                <X className="h-4 w-4" />
                {saveError || testResult?.error || "Invalid API key"}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
