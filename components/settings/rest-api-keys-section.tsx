"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import {
  Key,
  Plus,
  Trash2,
  Copy,
  Check,
  Loader2,
  Shield,
  Clock,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

interface RestApiKeysSectionProps {
  teamId: Id<"teams">;
}

interface ApiKeyData {
  _id: Id<"restApiKeys">;
  name: string;
  keyPrefix: string;
  permissions: string[];
  lastUsedAt?: number;
  expiresAt?: number;
  isActive: boolean;
  createdAt: number;
  createdBy: {
    name?: string;
    email?: string;
  } | null;
}

type Permission =
  | "read:feedback"
  | "write:feedback"
  | "read:projects"
  | "write:projects";

const PERMISSIONS: Array<{
  id: Permission;
  label: string;
  description: string;
}> = [
  {
    id: "read:feedback",
    label: "Read Feedback",
    description: "List and view feedback items",
  },
  {
    id: "write:feedback",
    label: "Write Feedback",
    description: "Update feedback status, priority, tags, and add comments",
  },
  {
    id: "read:projects",
    label: "Read Projects",
    description: "List and view projects",
  },
  {
    id: "write:projects",
    label: "Write Projects",
    description: "Create and update projects (coming soon)",
  },
];

export function RestApiKeysSection({ teamId }: RestApiKeysSectionProps) {
  const apiKeys = useQuery(api.restApiKeys.listApiKeys, { teamId });
  const createApiKeyMutation = useMutation(api.restApiKeys.createApiKey);
  const revokeApiKeyMutation = useMutation(api.restApiKeys.revokeApiKey);
  const deleteApiKeyMutation = useMutation(api.restApiKeys.deleteApiKey);

  const [isCreating, setIsCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<Permission[]>([
    "read:feedback",
    "read:projects",
  ]);
  const [newKeyValue, setNewKeyValue] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateKey = useCallback(async () => {
    if (!newKeyName.trim()) {
      setError("Please enter a name for the API key");
      return;
    }

    if (selectedPermissions.length === 0) {
      setError("Please select at least one permission");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await createApiKeyMutation({
        teamId,
        name: newKeyName.trim(),
        permissions: selectedPermissions,
      });

      setNewKeyValue(result.key);
      setNewKeyName("");
      setSelectedPermissions(["read:feedback", "read:projects"]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create API key");
    } finally {
      setIsSubmitting(false);
    }
  }, [newKeyName, selectedPermissions, teamId, createApiKeyMutation]);

  const handleCopyKey = useCallback(async () => {
    if (newKeyValue) {
      await navigator.clipboard.writeText(newKeyValue);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  }, [newKeyValue]);

  const handleRevokeKey = useCallback(
    async (keyId: Id<"restApiKeys">) => {
      if (!confirm("Are you sure you want to revoke this API key? It will no longer be able to authenticate.")) {
        return;
      }

      try {
        await revokeApiKeyMutation({ keyId });
      } catch (err) {
        console.error("Failed to revoke key:", err);
      }
    },
    [revokeApiKeyMutation]
  );

  const handleDeleteKey = useCallback(
    async (keyId: Id<"restApiKeys">) => {
      if (!confirm("Are you sure you want to permanently delete this API key?")) {
        return;
      }

      try {
        await deleteApiKeyMutation({ keyId });
      } catch (err) {
        console.error("Failed to delete key:", err);
      }
    },
    [deleteApiKeyMutation]
  );

  const togglePermission = useCallback((permission: Permission) => {
    setSelectedPermissions((prev) =>
      prev.includes(permission)
        ? prev.filter((p) => p !== permission)
        : [...prev, permission]
    );
  }, []);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatRelativeTime = (timestamp: number | undefined) => {
    if (!timestamp) return "Never";
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return formatDate(timestamp);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded border-2 border-retro-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border-2 border-retro-peach bg-retro-peach/10">
            <Key className="h-6 w-6 text-retro-peach" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-retro-black">
              REST API Keys
            </h2>
            <p className="mt-1 text-sm text-stone-600">
              Create API keys to access the FeedbackFlow REST API programmatically.
              Use these keys to integrate with your own tools and workflows.
            </p>
          </div>
          <a
            href="/docs/api"
            className="flex items-center gap-1 text-sm text-retro-blue hover:underline"
          >
            View API Docs
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* New Key Form or Success Message */}
      {newKeyValue ? (
        <div className="rounded border-2 border-green-500 bg-green-50 p-6">
          <div className="flex items-start gap-3">
            <Check className="mt-0.5 h-5 w-5 text-green-600" />
            <div className="flex-1">
              <h3 className="font-semibold text-green-800">
                API Key Created Successfully
              </h3>
              <p className="mt-1 text-sm text-green-700">
                Copy your API key now. You will not be able to see it again.
              </p>
              <div className="mt-4 flex items-center gap-2">
                <code className="flex-1 rounded border border-green-200 bg-white px-4 py-2 font-mono text-sm">
                  {newKeyValue}
                </code>
                <button
                  onClick={handleCopyKey}
                  className="flex items-center gap-2 rounded border-2 border-green-600 bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
                >
                  {copiedKey ? (
                    <>
                      <Check className="h-4 w-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy
                    </>
                  )}
                </button>
              </div>
              <button
                onClick={() => setNewKeyValue(null)}
                className="mt-4 text-sm text-green-700 underline hover:text-green-800"
              >
                Done, I have copied the key
              </button>
            </div>
          </div>
        </div>
      ) : isCreating ? (
        <div className="rounded border-2 border-retro-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
          <h3 className="mb-4 font-semibold text-retro-black">
            Create New API Key
          </h3>

          <div className="space-y-4">
            {/* Key Name */}
            <div>
              <label className="mb-2 block text-sm font-medium text-stone-700">
                Key Name
              </label>
              <input
                type="text"
                value={newKeyName}
                onChange={(e) => {
                  setNewKeyName(e.target.value);
                  setError(null);
                }}
                placeholder="e.g., Production Integration"
                className="w-full rounded border-2 border-stone-200 bg-stone-50 px-4 py-2.5 text-sm transition-colors focus:border-retro-black focus:bg-white focus:outline-none"
              />
              <p className="mt-1 text-xs text-stone-500">
                A descriptive name to identify this key
              </p>
            </div>

            {/* Permissions */}
            <div>
              <label className="mb-2 block text-sm font-medium text-stone-700">
                Permissions
              </label>
              <div className="grid gap-2 sm:grid-cols-2">
                {PERMISSIONS.map((permission) => (
                  <label
                    key={permission.id}
                    className={`flex cursor-pointer items-start gap-3 rounded border-2 p-3 transition-colors ${
                      selectedPermissions.includes(permission.id)
                        ? "border-retro-blue bg-retro-blue/5"
                        : "border-stone-200 hover:border-stone-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedPermissions.includes(permission.id)}
                      onChange={() => togglePermission(permission.id)}
                      className="mt-0.5 h-4 w-4 rounded border-stone-300"
                    />
                    <div>
                      <div className="text-sm font-medium text-stone-700">
                        {permission.label}
                      </div>
                      <div className="text-xs text-stone-500">
                        {permission.description}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertTriangle className="h-4 w-4" />
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleCreateKey}
                disabled={isSubmitting}
                className="flex items-center gap-2 rounded border-2 border-retro-black bg-retro-black px-6 py-2.5 text-sm font-medium text-white shadow-[4px_4px_0px_0px_#888] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000] disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Key className="h-4 w-4" />
                )}
                Create API Key
              </button>
              <button
                onClick={() => {
                  setIsCreating(false);
                  setError(null);
                }}
                className="rounded border-2 border-stone-200 px-4 py-2.5 text-sm font-medium text-stone-600 hover:border-stone-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsCreating(true)}
          className="flex w-full items-center justify-center gap-2 rounded border-2 border-dashed border-stone-300 bg-white py-4 text-sm font-medium text-stone-600 transition-colors hover:border-retro-black hover:text-retro-black"
        >
          <Plus className="h-4 w-4" />
          Create New API Key
        </button>
      )}

      {/* Existing Keys */}
      {apiKeys && apiKeys.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-stone-700">
            Existing API Keys ({apiKeys.length})
          </h3>
          {apiKeys.map((key: ApiKeyData) => (
            <div
              key={key._id}
              className={`rounded border-2 bg-white p-4 ${
                key.isActive
                  ? "border-stone-200"
                  : "border-red-200 bg-red-50/50"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-stone-800">
                      {key.name}
                    </span>
                    {!key.isActive && (
                      <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                        Revoked
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-4 text-xs text-stone-500">
                    <span className="font-mono">{key.keyPrefix}...</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Created {formatDate(key.createdAt)}
                    </span>
                    {key.lastUsedAt && (
                      <span>Last used {formatRelativeTime(key.lastUsedAt)}</span>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {key.permissions.map((perm: string) => (
                      <span
                        key={perm}
                        className="flex items-center gap-1 rounded bg-stone-100 px-2 py-0.5 text-xs text-stone-600"
                      >
                        <Shield className="h-3 w-3" />
                        {perm}
                      </span>
                    ))}
                  </div>
                  {key.createdBy && (
                    <p className="mt-2 text-xs text-stone-400">
                      Created by {key.createdBy.name || key.createdBy.email}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {key.isActive ? (
                    <button
                      onClick={() => handleRevokeKey(key._id)}
                      className="flex items-center gap-1 rounded border border-yellow-300 bg-yellow-50 px-3 py-1.5 text-xs font-medium text-yellow-700 transition-colors hover:bg-yellow-100"
                    >
                      <AlertTriangle className="h-3 w-3" />
                      Revoke
                    </button>
                  ) : (
                    <button
                      onClick={() => handleDeleteKey(key._id)}
                      className="flex items-center gap-1 rounded border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-100"
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Security Note */}
      <div className="rounded border border-stone-200 bg-stone-50 p-4">
        <div className="flex items-start gap-3">
          <Shield className="mt-0.5 h-5 w-5 text-stone-400" />
          <div className="text-sm text-stone-600">
            <p className="font-medium text-stone-700">Security Best Practices</p>
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>Store API keys securely and never commit them to version control</li>
              <li>Use environment variables for API keys in your applications</li>
              <li>Rotate keys periodically and revoke any compromised keys immediately</li>
              <li>Only grant the minimum permissions required for each integration</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
