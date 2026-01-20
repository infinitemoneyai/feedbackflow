"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import {
  Webhook,
  Plus,
  Trash2,
  Check,
  X,
  Loader2,
  Eye,
  EyeOff,
  RefreshCw,
  Copy,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle,
  Clock,
  ExternalLink,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";

interface WebhookConfigSectionProps {
  teamId: Id<"teams">;
}

type WebhookEvent = "new_feedback" | "status_changed" | "exported";

interface WebhookData {
  _id: Id<"webhooks">;
  _creationTime: number;
  teamId: Id<"teams">;
  url: string;
  secret: string;
  events: WebhookEvent[];
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

interface WebhookLogData {
  _id: Id<"webhookLogs">;
  _creationTime: number;
  webhookId: Id<"webhooks">;
  feedbackId?: Id<"feedback">;
  event: string;
  payload: unknown;
  responseStatus?: number;
  responseBody?: string;
  attempt: number;
  status: "pending" | "success" | "failed";
  error?: string;
  createdAt: number;
}

const EVENT_LABELS: Record<WebhookEvent, string> = {
  new_feedback: "New Feedback",
  status_changed: "Status Changed",
  exported: "Exported",
};

const EVENT_DESCRIPTIONS: Record<WebhookEvent, string> = {
  new_feedback: "Triggered when new feedback is submitted",
  status_changed: "Triggered when feedback status changes",
  exported: "Triggered when feedback is exported to Linear, Notion, or JSON",
};

export function WebhookConfigSection({ teamId }: WebhookConfigSectionProps) {
  const webhooks = useQuery(api.webhooks.getWebhooks, { teamId });
  const createWebhook = useMutation(api.webhooks.createWebhook);
  const updateWebhook = useMutation(api.webhooks.updateWebhook);
  const deleteWebhook = useMutation(api.webhooks.deleteWebhook);
  const regenerateSecret = useMutation(api.webhooks.regenerateSecret);
  const testWebhook = useAction(api.webhookActions.testWebhook);

  const [isAdding, setIsAdding] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [newEvents, setNewEvents] = useState<WebhookEvent[]>(["new_feedback"]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [newSecret, setNewSecret] = useState<string | null>(null);

  // Expanded states
  const [expandedWebhook, setExpandedWebhook] = useState<Id<"webhooks"> | null>(null);

  // Handle creating a new webhook
  const handleCreate = useCallback(async () => {
    if (!newUrl || newEvents.length === 0) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      const result = await createWebhook({
        teamId,
        url: newUrl,
        events: newEvents,
      });

      setNewSecret(result.secret);
      setNewUrl("");
      setNewEvents(["new_feedback"]);
      setIsAdding(false);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Failed to create webhook");
    } finally {
      setIsSaving(false);
    }
  }, [newUrl, newEvents, teamId, createWebhook]);

  // Toggle event selection
  const toggleEvent = (event: WebhookEvent) => {
    setNewEvents((prev) =>
      prev.includes(event)
        ? prev.filter((e) => e !== event)
        : [...prev, event]
    );
  };

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <div className="rounded border-2 border-retro-black bg-white shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
        <div className="flex items-center justify-between border-b-2 border-retro-black bg-stone-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-retro-blue bg-retro-blue/10">
              <Webhook className="h-5 w-5 text-retro-blue" />
            </div>
            <div>
              <h3 className="font-semibold text-retro-black">Webhooks</h3>
              <p className="text-xs text-stone-500">
                Send real-time notifications to your services
              </p>
            </div>
          </div>

          {!isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-2 rounded border-2 border-retro-black bg-retro-black px-4 py-2 text-sm font-medium text-white transition-all hover:bg-stone-800"
            >
              <Plus className="h-4 w-4" />
              Add Webhook
            </button>
          )}
        </div>

        <div className="p-6">
          <p className="text-sm text-stone-600">
            Webhooks allow you to receive real-time HTTP notifications when events
            happen in FeedbackFlow. Configure webhook URLs to integrate with your
            own services or automation tools.
          </p>
        </div>
      </div>

      {/* New Secret Display */}
      {newSecret && (
        <div className="rounded border-2 border-green-500 bg-green-50 p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="mt-0.5 h-5 w-5 text-green-600" />
            <div className="flex-1">
              <h4 className="font-medium text-green-900">Webhook Created!</h4>
              <p className="mt-1 text-sm text-green-700">
                Copy your webhook secret now. It will only be shown once.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <code className="flex-1 rounded border border-green-300 bg-white px-3 py-2 font-mono text-sm">
                  {newSecret}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(newSecret);
                  }}
                  className="flex items-center gap-1 rounded border-2 border-green-600 bg-green-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
                >
                  <Copy className="h-4 w-4" />
                  Copy
                </button>
              </div>
              <button
                onClick={() => setNewSecret(null)}
                className="mt-3 text-sm text-green-600 hover:underline"
              >
                I have saved my secret
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Webhook Form */}
      {isAdding && (
        <div className="rounded border-2 border-retro-black bg-white shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
          <div className="border-b-2 border-retro-black bg-stone-50 px-6 py-4">
            <h4 className="font-semibold text-retro-black">Add New Webhook</h4>
          </div>
          <div className="space-y-4 p-6">
            {/* URL Input */}
            <div>
              <label className="mb-2 block text-sm font-medium text-stone-700">
                Webhook URL
              </label>
              <input
                type="url"
                value={newUrl}
                onChange={(e) => {
                  setNewUrl(e.target.value);
                  setSaveError(null);
                }}
                placeholder="https://your-service.com/webhook"
                className="w-full rounded border-2 border-stone-200 bg-stone-50 px-4 py-2.5 text-sm transition-colors focus:border-retro-black focus:bg-white focus:outline-none"
              />
              <p className="mt-1 text-xs text-stone-500">
                Must be a valid HTTPS URL
              </p>
            </div>

            {/* Event Selection */}
            <div>
              <label className="mb-2 block text-sm font-medium text-stone-700">
                Events to Subscribe
              </label>
              <div className="space-y-2">
                {(Object.keys(EVENT_LABELS) as WebhookEvent[]).map((event) => (
                  <label
                    key={event}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded border-2 p-3 transition-all",
                      newEvents.includes(event)
                        ? "border-retro-black bg-stone-50"
                        : "border-stone-200 bg-white hover:border-stone-300"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={newEvents.includes(event)}
                      onChange={() => toggleEvent(event)}
                      className="mt-0.5 h-4 w-4 rounded border-stone-300"
                    />
                    <div>
                      <span className="font-medium text-retro-black">
                        {EVENT_LABELS[event]}
                      </span>
                      <p className="text-xs text-stone-500">
                        {EVENT_DESCRIPTIONS[event]}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Error */}
            {saveError && (
              <div className="flex items-center gap-2 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <X className="h-4 w-4" />
                {saveError}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleCreate}
                disabled={!newUrl || newEvents.length === 0 || isSaving}
                className="flex items-center gap-2 rounded border-2 border-retro-black bg-retro-black px-6 py-2.5 text-sm font-medium text-white shadow-[4px_4px_0px_0px_#888] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000] disabled:opacity-50 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[4px_4px_0px_0px_#888]"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Create Webhook
              </button>
              <button
                onClick={() => {
                  setIsAdding(false);
                  setNewUrl("");
                  setNewEvents(["new_feedback"]);
                  setSaveError(null);
                }}
                className="rounded border-2 border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-600 transition-colors hover:border-stone-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Webhooks List */}
      {webhooks && webhooks.length > 0 && (
        <div className="space-y-4">
          {webhooks.map((webhook: WebhookData) => (
            <WebhookItem
              key={webhook._id}
              webhook={webhook}
              isExpanded={expandedWebhook === webhook._id}
              onToggleExpand={() =>
                setExpandedWebhook(
                  expandedWebhook === webhook._id ? null : webhook._id
                )
              }
              onUpdate={updateWebhook}
              onDelete={deleteWebhook}
              onRegenerateSecret={regenerateSecret}
              onTest={testWebhook}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {webhooks && webhooks.length === 0 && !isAdding && (
        <div className="rounded border-2 border-dashed border-stone-300 bg-stone-50 p-8 text-center">
          <Webhook className="mx-auto h-12 w-12 text-stone-300" />
          <p className="mt-4 text-sm text-stone-500">
            No webhooks configured yet. Add your first webhook to receive
            real-time notifications.
          </p>
        </div>
      )}
    </div>
  );
}

interface WebhookItemProps {
  webhook: WebhookData;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdate: (args: {
    webhookId: Id<"webhooks">;
    url?: string;
    events?: ("new_feedback" | "status_changed" | "exported")[];
    isActive?: boolean;
  }) => Promise<{ success: boolean }>;
  onDelete: (args: { webhookId: Id<"webhooks"> }) => Promise<{ success: boolean }>;
  onRegenerateSecret: (args: { webhookId: Id<"webhooks"> }) => Promise<{ secret: string }>;
  onTest: (args: { webhookId: Id<"webhooks"> }) => Promise<{
    success: boolean;
    status?: number;
    error?: string;
    message?: string;
  }>;
}

function WebhookItem({
  webhook,
  isExpanded,
  onToggleExpand,
  onUpdate,
  onDelete,
  onRegenerateSecret,
  onTest,
}: WebhookItemProps) {
  const [showSecret, setShowSecret] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message?: string;
    error?: string;
  } | null>(null);
  const [newSecret, setNewSecret] = useState<string | null>(null);

  const logs = useQuery(
    api.webhooks.getWebhookLogs,
    isExpanded ? { webhookId: webhook._id, limit: 10 } : "skip"
  );

  const handleToggleActive = async () => {
    await onUpdate({
      webhookId: webhook._id,
      isActive: !webhook.isActive,
    });
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this webhook?")) return;
    setIsDeleting(true);
    try {
      await onDelete({ webhookId: webhook._id });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRegenerate = async () => {
    if (
      !confirm(
        "Are you sure you want to regenerate the secret? The old secret will stop working immediately."
      )
    )
      return;
    setIsRegenerating(true);
    try {
      const result = await onRegenerateSecret({ webhookId: webhook._id });
      setNewSecret(result.secret);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const result = await onTest({ webhookId: webhook._id });
      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : "Test failed",
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="rounded border-2 border-retro-black bg-white shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
      {/* Header */}
      <div
        className="flex cursor-pointer items-center justify-between border-b-2 border-retro-black bg-stone-50 px-6 py-4"
        onClick={onToggleExpand}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "h-3 w-3 rounded-full",
              webhook.isActive ? "bg-green-500" : "bg-stone-300"
            )}
          />
          <div>
            <code className="text-sm font-medium text-retro-black">
              {webhook.url}
            </code>
            <div className="mt-1 flex items-center gap-2">
              {webhook.events.map((event: WebhookEvent) => (
                <span
                  key={event}
                  className="rounded bg-stone-200 px-2 py-0.5 text-xs text-stone-600"
                >
                  {EVENT_LABELS[event]}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-stone-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-stone-400" />
          )}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-6">
          {/* New Secret Display */}
          {newSecret && (
            <div className="mb-4 rounded border-2 border-green-500 bg-green-50 p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="mt-0.5 h-5 w-5 text-green-600" />
                <div className="flex-1">
                  <h4 className="font-medium text-green-900">
                    Secret Regenerated!
                  </h4>
                  <p className="mt-1 text-sm text-green-700">
                    Copy your new webhook secret now. It will only be shown once.
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <code className="flex-1 rounded border border-green-300 bg-white px-3 py-2 font-mono text-sm">
                      {newSecret}
                    </code>
                    <button
                      onClick={() => navigator.clipboard.writeText(newSecret)}
                      className="flex items-center gap-1 rounded border-2 border-green-600 bg-green-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
                    >
                      <Copy className="h-4 w-4" />
                      Copy
                    </button>
                  </div>
                  <button
                    onClick={() => setNewSecret(null)}
                    className="mt-3 text-sm text-green-600 hover:underline"
                  >
                    I have saved my secret
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Secret */}
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-stone-700">
              Signing Secret
            </label>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded border-2 border-stone-200 bg-stone-50 px-4 py-2 font-mono text-sm">
                {showSecret ? webhook.secret : "whsec_••••••••••••••••••••••"}
              </code>
              <button
                onClick={() => setShowSecret(!showSecret)}
                className="rounded border-2 border-stone-200 bg-white p-2 text-stone-500 transition-colors hover:border-stone-300 hover:text-stone-700"
              >
                {showSecret ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
              <button
                onClick={() => navigator.clipboard.writeText(webhook.secret)}
                className="rounded border-2 border-stone-200 bg-white p-2 text-stone-500 transition-colors hover:border-stone-300 hover:text-stone-700"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-1 text-xs text-stone-500">
              Use this secret to verify webhook signatures in your server.
            </p>
          </div>

          {/* Actions */}
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <button
              onClick={handleToggleActive}
              className={cn(
                "flex items-center gap-2 rounded border-2 px-4 py-2 text-sm font-medium transition-colors",
                webhook.isActive
                  ? "border-stone-200 bg-white text-stone-600 hover:border-stone-300"
                  : "border-green-600 bg-green-600 text-white hover:bg-green-700"
              )}
            >
              {webhook.isActive ? (
                <>
                  <X className="h-4 w-4" />
                  Disable
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Enable
                </>
              )}
            </button>

            <button
              onClick={handleTest}
              disabled={isTesting}
              className="flex items-center gap-2 rounded border-2 border-retro-blue bg-white px-4 py-2 text-sm font-medium text-retro-blue transition-colors hover:bg-retro-blue/10 disabled:opacity-50"
            >
              {isTesting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ExternalLink className="h-4 w-4" />
              )}
              Test Webhook
            </button>

            <button
              onClick={handleRegenerate}
              disabled={isRegenerating}
              className="flex items-center gap-2 rounded border-2 border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-600 transition-colors hover:border-stone-300 disabled:opacity-50"
            >
              {isRegenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Regenerate Secret
            </button>

            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center gap-2 rounded border-2 border-retro-red bg-white px-4 py-2 text-sm font-medium text-retro-red transition-colors hover:bg-retro-red/10 disabled:opacity-50"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Delete
            </button>
          </div>

          {/* Test Result */}
          {testResult && (
            <div
              className={cn(
                "mb-6 flex items-center gap-2 rounded border px-4 py-3 text-sm",
                testResult.success
                  ? "border-green-200 bg-green-50 text-green-700"
                  : "border-red-200 bg-red-50 text-red-700"
              )}
            >
              {testResult.success ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  {testResult.message || "Test webhook sent successfully"}
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4" />
                  {testResult.error || "Test failed"}
                </>
              )}
            </div>
          )}

          {/* Recent Deliveries */}
          <div>
            <h4 className="mb-3 text-sm font-medium text-stone-700">
              Recent Deliveries
            </h4>
            {logs && logs.length > 0 ? (
              <div className="space-y-2">
                {logs.map((log: WebhookLogData) => (
                  <div
                    key={log._id}
                    className="flex items-center justify-between rounded border border-stone-200 bg-stone-50 px-4 py-2 text-sm"
                  >
                    <div className="flex items-center gap-3">
                      {log.status === "success" ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : log.status === "pending" ? (
                        <Clock className="h-4 w-4 text-yellow-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="font-medium text-stone-700">
                        {log.event}
                      </span>
                      {log.responseStatus && (
                        <span
                          className={cn(
                            "rounded px-2 py-0.5 text-xs font-medium",
                            log.responseStatus >= 200 && log.responseStatus < 300
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          )}
                        >
                          {log.responseStatus}
                        </span>
                      )}
                      {log.error && (
                        <span className="text-xs text-red-600">{log.error}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-stone-500">
                      <span>Attempt {log.attempt}</span>
                      <span>
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-stone-500">No deliveries yet</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
