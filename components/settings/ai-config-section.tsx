"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import {
  Bot,
  Key,
  Eye,
  EyeOff,
  Check,
  X,
  Loader2,
  Trash2,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

interface AiConfigSectionProps {
  teamId: Id<"teams">;
}

const OPENAI_MODELS = [
  { id: "gpt-4o", name: "GPT-4o (Recommended)", description: "Most capable, best for complex tasks" },
  { id: "gpt-4o-mini", name: "GPT-4o Mini", description: "Fast and cost-effective" },
  { id: "gpt-4-turbo", name: "GPT-4 Turbo", description: "Previous generation, still powerful" },
  { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo", description: "Fast, good for simple tasks" },
];

const ANTHROPIC_MODELS = [
  { id: "claude-opus-4-20250514", name: "Claude Opus 4 (Latest)", description: "Most capable Claude model" },
  { id: "claude-sonnet-4-20250514", name: "Claude Sonnet 4", description: "Balanced performance and cost" },
  { id: "claude-3-5-sonnet-20241022", name: "Claude 3.5 Sonnet", description: "Great balance of speed and quality" },
  { id: "claude-3-5-haiku-20241022", name: "Claude 3.5 Haiku", description: "Fastest, most cost-effective" },
  { id: "claude-3-opus-20240229", name: "Claude 3 Opus", description: "Previous generation, very capable" },
];

type Provider = "openai" | "anthropic";

export function AiConfigSection({ teamId }: AiConfigSectionProps) {
  const apiKeys = useQuery(api.apiKeys.getApiKeys, { teamId });
  const saveApiKeyMutation = useMutation(api.apiKeys.saveApiKey);
  const deleteApiKeyMutation = useMutation(api.apiKeys.deleteApiKey);
  const updateModelMutation = useMutation(api.apiKeys.updateApiKeyModel);

  const openaiKey = apiKeys?.find((k: { provider: string }) => k.provider === "openai");
  const anthropicKey = apiKeys?.find((k: { provider: string }) => k.provider === "anthropic");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded border-2 border-retro-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border-2 border-retro-blue bg-retro-blue/10">
            <Bot className="h-6 w-6 text-retro-blue" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-retro-black">
              AI Configuration
            </h2>
            <p className="mt-1 text-sm text-stone-600">
              Configure your AI provider API keys to enable AI-powered features like
              auto-categorization, solution suggestions, and ticket drafting. Your
              API keys are encrypted and stored securely.
            </p>
          </div>
        </div>
      </div>

      {/* OpenAI Configuration */}
      <ApiKeyCard
        teamId={teamId}
        provider="openai"
        title="OpenAI"
        description="Use GPT-4 models for AI features"
        keyData={openaiKey}
        models={OPENAI_MODELS}
        keyPlaceholder="sk-..."
        keyPrefix="sk-"
        onSave={saveApiKeyMutation}
        onDelete={deleteApiKeyMutation}
        onUpdateModel={updateModelMutation}
      />

      {/* Anthropic Configuration */}
      <ApiKeyCard
        teamId={teamId}
        provider="anthropic"
        title="Anthropic"
        description="Use Claude models for AI features"
        keyData={anthropicKey}
        models={ANTHROPIC_MODELS}
        keyPlaceholder="sk-ant-..."
        keyPrefix="sk-ant-"
        onSave={saveApiKeyMutation}
        onDelete={deleteApiKeyMutation}
        onUpdateModel={updateModelMutation}
      />

      {/* Info section */}
      <div className="rounded border border-stone-200 bg-stone-50 p-4">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 h-5 w-5 text-retro-yellow" />
          <div className="text-sm text-stone-600">
            <p className="font-medium text-stone-700">
              Using your own API keys
            </p>
            <p className="mt-1">
              FeedbackFlow uses your API keys to make AI requests directly to
              OpenAI or Anthropic. This means you have full control over costs
              and usage. You only pay for what you use, directly to the provider.
            </p>
            <p className="mt-2">
              <span className="font-medium">Security:</span> Your API keys are
              encrypted before being stored and are only decrypted server-side
              when making API requests. They are never exposed to the browser.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ApiKeyCardProps {
  teamId: Id<"teams">;
  provider: Provider;
  title: string;
  description: string;
  keyData?: {
    _id: Id<"apiKeys">;
    provider: string;
    keyHint: string;
    model?: string;
    isValid: boolean;
    lastValidatedAt?: number;
  };
  models: Array<{ id: string; name: string; description: string }>;
  keyPlaceholder: string;
  keyPrefix: string;
  onSave: (args: {
    teamId: Id<"teams">;
    provider: Provider;
    apiKey: string;
    model?: string;
  }) => Promise<{ id: Id<"apiKeys">; updated: boolean }>;
  onDelete: (args: {
    teamId: Id<"teams">;
    provider: Provider;
  }) => Promise<{ success: boolean; message?: string }>;
  onUpdateModel: (args: {
    teamId: Id<"teams">;
    provider: Provider;
    model: string;
  }) => Promise<{ success: boolean }>;
}

function ApiKeyCard({
  teamId,
  provider,
  title,
  description,
  keyData,
  models,
  keyPlaceholder,
  keyPrefix,
  onSave,
  onDelete,
  onUpdateModel,
}: ApiKeyCardProps) {
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [selectedModel, setSelectedModel] = useState(
    keyData?.model || models[0].id
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [testResult, setTestResult] = useState<{
    valid: boolean;
    error?: string;
  } | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const hasKey = !!keyData;

  const handleTestConnection = useCallback(async () => {
    if (!apiKey && !hasKey) return;

    setIsTesting(true);
    setTestResult(null);

    try {
      const response = await fetch("/api/ai/test-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          apiKey: apiKey || "test", // Will use stored key server-side if needed
        }),
      });

      const result = await response.json();
      setTestResult({ valid: result.valid, error: result.error });
    } catch (error) {
      setTestResult({
        valid: false,
        error: error instanceof Error ? error.message : "Connection failed",
      });
    } finally {
      setIsTesting(false);
    }
  }, [apiKey, hasKey, provider]);

  const handleSaveKey = useCallback(async () => {
    if (!apiKey) return;

    // Validate key format
    if (!apiKey.startsWith(keyPrefix)) {
      setSaveError(`Invalid key format. ${title} keys should start with "${keyPrefix}"`);
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setTestResult(null);

    try {
      // First test the key
      const testResponse = await fetch("/api/ai/test-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, apiKey }),
      });

      const testResult = await testResponse.json();

      if (!testResult.valid) {
        setSaveError(testResult.error || "Invalid API key");
        setTestResult({ valid: false, error: testResult.error });
        return;
      }

      // Save the key
      await onSave({
        teamId,
        provider,
        apiKey,
        model: selectedModel,
      });

      setApiKey("");
      setTestResult({ valid: true });
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Failed to save API key"
      );
    } finally {
      setIsSaving(false);
    }
  }, [apiKey, keyPrefix, title, provider, teamId, selectedModel, onSave]);

  const handleDeleteKey = useCallback(async () => {
    if (!confirm(`Are you sure you want to delete your ${title} API key?`)) {
      return;
    }

    setIsDeleting(true);

    try {
      await onDelete({ teamId, provider });
      setTestResult(null);
    } catch (error) {
      console.error("Failed to delete key:", error);
    } finally {
      setIsDeleting(false);
    }
  }, [teamId, provider, title, onDelete]);

  const handleModelChange = useCallback(
    async (newModel: string) => {
      setSelectedModel(newModel);

      if (hasKey) {
        try {
          await onUpdateModel({ teamId, provider, model: newModel });
        } catch (error) {
          console.error("Failed to update model:", error);
        }
      }
    },
    [hasKey, teamId, provider, onUpdateModel]
  );

  return (
    <div className="rounded border-2 border-retro-black bg-white shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-retro-black bg-stone-50 px-6 py-4">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
              provider === "openai"
                ? "border-green-600 bg-green-100"
                : "border-orange-500 bg-orange-100"
            }`}
          >
            <Key
              className={`h-5 w-5 ${
                provider === "openai" ? "text-green-600" : "text-orange-500"
              }`}
            />
          </div>
          <div>
            <h3 className="font-semibold text-retro-black">{title}</h3>
            <p className="text-xs text-stone-500">{description}</p>
          </div>
        </div>

        {hasKey && (
          <div className="flex items-center gap-2">
            {keyData.isValid ? (
              <span className="flex items-center gap-1 rounded bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                <Check className="h-3 w-3" />
                Connected
              </span>
            ) : (
              <span className="flex items-center gap-1 rounded bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-700">
                <RefreshCw className="h-3 w-3" />
                Not validated
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
                  ••••••••••••••••{keyData.keyHint}
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

            {/* Model selector */}
            <div>
              <label className="mb-2 block text-sm font-medium text-stone-700">
                Preferred Model
              </label>
              <select
                value={selectedModel}
                onChange={(e) => handleModelChange(e.target.value)}
                className="w-full rounded border-2 border-stone-200 bg-white px-4 py-2.5 text-sm transition-colors focus:border-retro-black focus:outline-none"
              >
                {models.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-stone-500">
                {models.find((m) => m.id === selectedModel)?.description}
              </p>
            </div>

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
                    placeholder={keyPlaceholder}
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
                  placeholder={keyPlaceholder}
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
                {provider === "openai" ? (
                  <a
                    href="https://platform.openai.com/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-retro-blue hover:underline"
                  >
                    OpenAI dashboard
                  </a>
                ) : (
                  <a
                    href="https://console.anthropic.com/account/keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-retro-blue hover:underline"
                  >
                    Anthropic console
                  </a>
                )}
              </p>
            </div>

            {/* Model selector */}
            <div>
              <label className="mb-2 block text-sm font-medium text-stone-700">
                Preferred Model
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full rounded border-2 border-stone-200 bg-white px-4 py-2.5 text-sm transition-colors focus:border-retro-black focus:outline-none"
              >
                {models.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-stone-500">
                {models.find((m) => m.id === selectedModel)?.description}
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
                Save API Key
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
            className={`mt-4 flex items-center gap-2 rounded border px-4 py-3 text-sm ${
              testResult?.valid
                ? "border-green-200 bg-green-50 text-green-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {testResult?.valid ? (
              <>
                <Check className="h-4 w-4" />
                API key is valid and working
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
