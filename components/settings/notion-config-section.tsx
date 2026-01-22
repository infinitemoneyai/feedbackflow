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

interface NotionConfigSectionProps {
  teamId: Id<"teams">;
}

interface NotionDatabase {
  id: string;
  title: string;
  url: string;
  icon?: string;
}

export function NotionConfigSection({ teamId }: NotionConfigSectionProps) {
  const integration = useQuery(api.integrations.getNotionIntegration, { teamId });
  const saveIntegration = useMutation(api.integrations.saveNotionIntegration);
  const updateSettings = useMutation(api.integrations.updateNotionSettings);
  const deleteIntegration = useMutation(api.integrations.deleteNotionIntegration);

  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [testResult, setTestResult] = useState<{
    valid: boolean;
    botName?: string;
    error?: string;
  } | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Notion data
  const [notionDatabases, setNotionDatabases] = useState<NotionDatabase[]>([]);
  const [isLoadingDatabases, setIsLoadingDatabases] = useState(false);

  // Selected values
  const [selectedDatabaseId, setSelectedDatabaseId] = useState<string>("");

  const hasKey = integration?.hasApiKey;

  // Debug: log integration state
  useEffect(() => {
    // Integration state updated
  }, [integration, hasKey]);

  // Load existing settings
  useEffect(() => {
    if (integration?.settings) {
      if (integration.settings.notionDatabaseId) {
        setSelectedDatabaseId(integration.settings.notionDatabaseId);
      }
    }
  }, [integration]);

  // Fetch databases when key is saved
  const fetchDatabases = useCallback(async (key?: string) => {
    setIsLoadingDatabases(true);
    try {
      const response = await fetch("/api/integrations/notion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "getDatabases",
          apiKey: key || "stored",
          teamId: teamId,
        }),
      });
      const data = await response.json();
      if (data.databases) {
        setNotionDatabases(data.databases);
      } else if (data.error) {
        console.error("Error fetching databases:", data.error);
      }
    } catch (error) {
      console.error("Failed to fetch Notion databases:", error);
    } finally {
      setIsLoadingDatabases(false);
    }
  }, [teamId]);

  // Test connection
  const handleTestConnection = useCallback(async () => {
    if (!apiKey && !hasKey) return;

    setIsTesting(true);
    setTestResult(null);

    try {
      const response = await fetch("/api/integrations/notion", {
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

      // If successful and we have a new key, fetch databases
      if (result.valid && apiKey) {
        await fetchDatabases(apiKey);
      }
    } catch (error) {
      setTestResult({
        valid: false,
        error: error instanceof Error ? error.message : "Connection failed",
      });
    } finally {
      setIsTesting(false);
    }
  }, [apiKey, hasKey, fetchDatabases]);

  // Save API key
  const handleSaveKey = useCallback(async () => {
    if (!apiKey) return;

    // Validate key format (Notion internal integration keys start with "secret_" or "ntn_")
    if (!apiKey.startsWith("secret_") && !apiKey.startsWith("ntn_")) {
      setSaveError(
        "Invalid key format. Notion API keys should start with 'secret_' or 'ntn_'"
      );
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setTestResult(null);

    try {
      // First test the key
      const testResponse = await fetch("/api/integrations/notion", {
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
        notionDatabaseId: selectedDatabaseId || undefined,
      });

      setApiKey("");
      setTestResult({ valid: true, botName: testResultData.botName });

      // Fetch databases after saving
      await fetchDatabases(apiKey);
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Failed to save API key"
      );
    } finally {
      setIsSaving(false);
    }
  }, [apiKey, teamId, selectedDatabaseId, saveIntegration, fetchDatabases]);

  // Update settings
  const handleUpdateSettings = useCallback(async () => {
    try {
      await updateSettings({
        teamId,
        notionDatabaseId: selectedDatabaseId || undefined,
      });
    } catch (error) {
      console.error("Failed to update settings:", error);
    }
  }, [teamId, selectedDatabaseId, updateSettings]);

  // Delete integration
  const handleDeleteKey = useCallback(async () => {
    if (!confirm("Are you sure you want to delete your Notion integration?")) {
      return;
    }

    setIsDeleting(true);

    try {
      await deleteIntegration({ teamId });
      setTestResult(null);
      setNotionDatabases([]);
      setSelectedDatabaseId("");
    } catch (error) {
      console.error("Failed to delete integration:", error);
    } finally {
      setIsDeleting(false);
    }
  }, [teamId, deleteIntegration]);

  // Auto-load databases when integration exists
  useEffect(() => {
    if (hasKey && notionDatabases.length === 0) {
      fetchDatabases();
    }
  }, [hasKey, notionDatabases.length, fetchDatabases]);

  // Notion icon component
  const NotionIcon = () => (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5 text-stone-800"
      fill="currentColor"
    >
      <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.98-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.84-.046.933-.56.933-1.167V6.354c0-.606-.233-.933-.746-.886l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.746 0-.933-.234-1.494-.933l-4.577-7.186v6.952l1.448.327s0 .84-1.168.84l-3.22.186c-.094-.187 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.454-.233 4.764 7.279v-6.44l-1.215-.14c-.093-.513.28-.886.747-.933zM2.1 1.408l13.028-.887c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.933.653.933 1.213v15.063c0 .933-.327 1.493-1.494 1.586L5.79 23.086c-.886.047-1.306-.093-1.773-.7L.944 18.107c-.56-.746-.793-1.306-.793-1.96V2.529c0-.653.327-1.214 1.166-1.12z" />
    </svg>
  );

  return (
    <div className="rounded border-2 border-retro-black bg-white shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-retro-black bg-stone-50 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-stone-600 bg-stone-100">
            <NotionIcon />
          </div>
          <div>
            <h3 className="font-semibold text-retro-black">Notion</h3>
            <p className="text-xs text-stone-500">Export pages to Notion</p>
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
                Integration Token
              </label>
              <div className="flex items-center gap-3">
                <div className="flex-1 rounded border-2 border-stone-200 bg-stone-50 px-4 py-2.5 font-mono text-sm text-stone-600">
                  secret_••••••••••••
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

            {/* Database selector */}
            <div>
              <label className="mb-2 block text-sm font-medium text-stone-700">
                Default Database
              </label>
              <div className="relative">
                <select
                  value={selectedDatabaseId}
                  onChange={(e) => setSelectedDatabaseId(e.target.value)}
                  onBlur={handleUpdateSettings}
                  disabled={isLoadingDatabases}
                  className="w-full appearance-none rounded border-2 border-stone-200 bg-white px-4 py-2.5 pr-10 text-sm transition-colors focus:border-retro-black focus:outline-none disabled:opacity-50"
                >
                  <option value="">Select a database...</option>
                  {notionDatabases.map((db) => (
                    <option key={db.id} value={db.id}>
                      {db.icon ? `${db.icon} ` : ""}
                      {db.title}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              </div>
              {isLoadingDatabases && (
                <p className="mt-1 flex items-center gap-1 text-xs text-stone-500">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Loading databases...
                </p>
              )}
              {!isLoadingDatabases && notionDatabases.length === 0 && hasKey && (
                <button
                  onClick={() => fetchDatabases()}
                  className="mt-1 text-xs text-retro-blue hover:underline"
                >
                  Load databases
                </button>
              )}
              <p className="mt-1 text-xs text-stone-500">
                Make sure your integration has access to this database in Notion
              </p>
            </div>

            {/* Update key section */}
            <div className="border-t border-stone-200 pt-4">
              <p className="mb-2 text-sm text-stone-500">
                Need to update your integration token?
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
                    placeholder="secret_..."
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
                Internal Integration Token
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
                  placeholder="secret_..."
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
              <p className="mt-2 text-xs text-stone-500">
                Create an internal integration at{" "}
                <a
                  href="https://www.notion.so/my-integrations"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-0.5 text-retro-blue hover:underline"
                >
                  notion.so/my-integrations
                  <ExternalLink className="h-3 w-3" />
                </a>
              </p>
              <p className="mt-1 text-xs text-stone-500">
                Then share your target database with the integration
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
                Connect Notion
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
                Connected as {testResult.botName || "Notion Integration"}
              </>
            ) : (
              <>
                <X className="h-4 w-4" />
                {saveError || testResult?.error || "Invalid integration token"}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
