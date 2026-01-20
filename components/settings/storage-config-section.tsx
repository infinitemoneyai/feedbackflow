"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import {
  HardDrive,
  Cloud,
  Key,
  Eye,
  EyeOff,
  Check,
  X,
  Loader2,
  Trash2,
  RefreshCw,
  AlertTriangle,
  Server,
  Info,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

interface StorageConfigSectionProps {
  teamId: Id<"teams">;
}

type StorageProvider = "s3" | "r2" | "gcs";

const STORAGE_PROVIDERS = [
  {
    id: "s3" as StorageProvider,
    name: "Amazon S3",
    description: "AWS S3 or S3-compatible storage",
    icon: Cloud,
    color: "text-orange-500",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
  },
  {
    id: "r2" as StorageProvider,
    name: "Cloudflare R2",
    description: "S3-compatible, zero egress fees",
    icon: Cloud,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
  },
  {
    id: "gcs" as StorageProvider,
    name: "Google Cloud Storage",
    description: "Google Cloud Platform storage",
    icon: Cloud,
    color: "text-blue-500",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
];

const S3_REGIONS = [
  { value: "us-east-1", label: "US East (N. Virginia)" },
  { value: "us-east-2", label: "US East (Ohio)" },
  { value: "us-west-1", label: "US West (N. California)" },
  { value: "us-west-2", label: "US West (Oregon)" },
  { value: "eu-west-1", label: "EU (Ireland)" },
  { value: "eu-west-2", label: "EU (London)" },
  { value: "eu-central-1", label: "EU (Frankfurt)" },
  { value: "ap-northeast-1", label: "Asia Pacific (Tokyo)" },
  { value: "ap-southeast-1", label: "Asia Pacific (Singapore)" },
  { value: "ap-southeast-2", label: "Asia Pacific (Sydney)" },
];

export function StorageConfigSection({ teamId }: StorageConfigSectionProps) {
  const storageConfig = useQuery(api.storageConfig.getStorageConfig, { teamId });
  const saveConfigMutation = useMutation(api.storageConfig.saveStorageConfig);
  const deleteConfigMutation = useMutation(api.storageConfig.deleteStorageConfig);
  const markTestedMutation = useMutation(api.storageConfig.markStorageConfigTested);

  // Form state
  const [provider, setProvider] = useState<StorageProvider>("s3");
  const [bucket, setBucket] = useState("");
  const [region, setRegion] = useState("us-east-1");
  const [endpoint, setEndpoint] = useState("");
  // S3/R2 credentials
  const [accessKeyId, setAccessKeyId] = useState("");
  const [secretAccessKey, setSecretAccessKey] = useState("");
  // GCS credentials
  const [clientEmail, setClientEmail] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [projectId, setProjectId] = useState("");

  const [showSecretKey, setShowSecretKey] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Update form when config loads
  useState(() => {
    if (storageConfig) {
      setProvider(storageConfig.provider as StorageProvider);
      setBucket(storageConfig.bucket);
      setRegion(storageConfig.region || "us-east-1");
      setEndpoint(storageConfig.endpoint || "");
    }
  });

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);
    setTestResult(null);

    try {
      await saveConfigMutation({
        teamId,
        provider,
        bucket,
        region: provider === "s3" || provider === "r2" ? region : undefined,
        endpoint: provider === "r2" || endpoint ? endpoint : undefined,
        accessKeyId:
          provider === "s3" || provider === "r2" ? accessKeyId : undefined,
        secretAccessKey:
          provider === "s3" || provider === "r2" ? secretAccessKey : undefined,
        clientEmail: provider === "gcs" ? clientEmail : undefined,
        privateKey: provider === "gcs" ? privateKey : undefined,
        projectId: provider === "gcs" ? projectId : undefined,
      });
      setSaveSuccess(true);
      // Clear sensitive fields after save
      setSecretAccessKey("");
      setPrivateKey("");
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save configuration");
    } finally {
      setIsSaving(false);
    }
  }, [
    teamId,
    provider,
    bucket,
    region,
    endpoint,
    accessKeyId,
    secretAccessKey,
    clientEmail,
    privateKey,
    projectId,
    saveConfigMutation,
  ]);

  const handleDelete = useCallback(async () => {
    if (!confirm("Are you sure you want to remove the storage configuration?")) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      await deleteConfigMutation({ teamId });
      // Reset form
      setProvider("s3");
      setBucket("");
      setRegion("us-east-1");
      setEndpoint("");
      setAccessKeyId("");
      setSecretAccessKey("");
      setClientEmail("");
      setPrivateKey("");
      setProjectId("");
      setTestResult(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete configuration");
    } finally {
      setIsDeleting(false);
    }
  }, [teamId, deleteConfigMutation]);

  const handleTestConnection = useCallback(async () => {
    setIsTesting(true);
    setTestResult(null);
    setError(null);

    try {
      const response = await fetch("/api/storage/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          bucket,
          region: provider === "s3" ? region : undefined,
          endpoint: provider === "r2" || endpoint ? endpoint : undefined,
          accessKeyId:
            provider === "s3" || provider === "r2" ? accessKeyId : undefined,
          secretAccessKey:
            provider === "s3" || provider === "r2" ? secretAccessKey : undefined,
          clientEmail: provider === "gcs" ? clientEmail : undefined,
          privateKey: provider === "gcs" ? privateKey : undefined,
          projectId: provider === "gcs" ? projectId : undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setTestResult({ success: true, message: data.message });
        // Mark the config as tested
        await markTestedMutation({ teamId, isActive: true });
      } else {
        setTestResult({ success: false, message: data.error || "Connection test failed" });
      }
    } catch (err) {
      setTestResult({
        success: false,
        message: err instanceof Error ? err.message : "Connection test failed",
      });
    } finally {
      setIsTesting(false);
    }
  }, [
    provider,
    bucket,
    region,
    endpoint,
    accessKeyId,
    secretAccessKey,
    clientEmail,
    privateKey,
    projectId,
    teamId,
    markTestedMutation,
  ]);

  const selectedProvider = STORAGE_PROVIDERS.find((p) => p.id === provider);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded border-2 border-retro-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border-2 border-retro-peach bg-retro-peach/10">
            <HardDrive className="h-6 w-6 text-retro-peach" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-retro-black">
              External Storage
            </h2>
            <p className="mt-1 text-sm text-stone-600">
              Configure external storage for video recordings. If not configured,
              FeedbackFlow will use Convex storage (limited to 50MB per file).
              External storage is recommended for video recordings.
            </p>
          </div>
        </div>
      </div>

      {/* Current Configuration Status */}
      {storageConfig && (
        <div className={`rounded border-2 p-4 ${
          storageConfig.isActive
            ? "border-green-300 bg-green-50"
            : "border-yellow-300 bg-yellow-50"
        }`}>
          <div className="flex items-start gap-3">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
              storageConfig.isActive ? "bg-green-200" : "bg-yellow-200"
            }`}>
              {storageConfig.isActive ? (
                <Check className="h-4 w-4 text-green-700" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-yellow-700" />
              )}
            </div>
            <div className="flex-1">
              <p className={`font-medium ${
                storageConfig.isActive ? "text-green-800" : "text-yellow-800"
              }`}>
                {storageConfig.isActive
                  ? "External storage is active"
                  : "Configuration not tested"}
              </p>
              <p className="mt-1 text-sm text-stone-600">
                Provider: <strong>{storageConfig.provider.toUpperCase()}</strong>
                {" | "}
                Bucket: <strong>{storageConfig.bucket}</strong>
                {storageConfig.credentialHint && (
                  <>
                    {" | "}
                    Credentials: <code className="rounded bg-stone-100 px-1">{storageConfig.credentialHint}</code>
                  </>
                )}
              </p>
              {storageConfig.lastTestedAt && (
                <p className="mt-1 text-xs text-stone-500">
                  Last tested: {new Date(storageConfig.lastTestedAt).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Provider Selection */}
      <div className="rounded border-2 border-retro-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
        <h3 className="mb-4 font-semibold text-retro-black">Storage Provider</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          {STORAGE_PROVIDERS.map((p) => {
            const Icon = p.icon;
            const isSelected = provider === p.id;

            return (
              <button
                key={p.id}
                onClick={() => setProvider(p.id)}
                className={`flex items-start gap-3 rounded border-2 p-4 text-left transition-all ${
                  isSelected
                    ? "border-retro-black bg-retro-yellow/10 shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]"
                    : "border-stone-200 hover:border-stone-300"
                }`}
              >
                <div className={`rounded-full p-2 ${p.bgColor}`}>
                  <Icon className={`h-5 w-5 ${p.color}`} />
                </div>
                <div>
                  <div className="font-medium text-retro-black">{p.name}</div>
                  <div className="text-xs text-stone-500">{p.description}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Configuration Form */}
      <div className="rounded border-2 border-retro-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
        <h3 className="mb-4 font-semibold text-retro-black">Configuration</h3>

        <div className="space-y-4">
          {/* Bucket Name */}
          <div>
            <label className="mb-2 block text-sm font-medium text-stone-700">
              Bucket Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={bucket}
              onChange={(e) => setBucket(e.target.value)}
              placeholder="my-feedback-bucket"
              className="w-full rounded border-2 border-stone-200 bg-stone-50 px-4 py-2.5 text-sm transition-colors focus:border-retro-black focus:bg-white focus:outline-none"
            />
          </div>

          {/* S3-specific fields */}
          {(provider === "s3" || provider === "r2") && (
            <>
              {/* Region (S3 only) */}
              {provider === "s3" && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-stone-700">
                    Region
                  </label>
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="w-full rounded border-2 border-stone-200 bg-stone-50 px-4 py-2.5 text-sm transition-colors focus:border-retro-black focus:bg-white focus:outline-none"
                  >
                    {S3_REGIONS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Custom Endpoint (R2 or custom S3) */}
              <div>
                <label className="mb-2 block text-sm font-medium text-stone-700">
                  {provider === "r2" ? "R2 Endpoint" : "Custom Endpoint (Optional)"}
                  {provider === "r2" && <span className="text-red-500"> *</span>}
                </label>
                <input
                  type="text"
                  value={endpoint}
                  onChange={(e) => setEndpoint(e.target.value)}
                  placeholder={
                    provider === "r2"
                      ? "https://<account_id>.r2.cloudflarestorage.com"
                      : "https://s3.custom-endpoint.com"
                  }
                  className="w-full rounded border-2 border-stone-200 bg-stone-50 px-4 py-2.5 text-sm transition-colors focus:border-retro-black focus:bg-white focus:outline-none"
                />
                {provider === "r2" && (
                  <p className="mt-1 text-xs text-stone-500">
                    Find this in your Cloudflare R2 bucket settings
                  </p>
                )}
              </div>

              {/* Access Key ID */}
              <div>
                <label className="mb-2 block text-sm font-medium text-stone-700">
                  Access Key ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={accessKeyId}
                  onChange={(e) => setAccessKeyId(e.target.value)}
                  placeholder="AKIA..."
                  className="w-full rounded border-2 border-stone-200 bg-stone-50 px-4 py-2.5 font-mono text-sm transition-colors focus:border-retro-black focus:bg-white focus:outline-none"
                />
              </div>

              {/* Secret Access Key */}
              <div>
                <label className="mb-2 block text-sm font-medium text-stone-700">
                  Secret Access Key <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showSecretKey ? "text" : "password"}
                    value={secretAccessKey}
                    onChange={(e) => setSecretAccessKey(e.target.value)}
                    placeholder={storageConfig?.credentialHint ? "••••••••••••" : "Enter secret key"}
                    className="w-full rounded border-2 border-stone-200 bg-stone-50 py-2.5 pr-10 pl-4 font-mono text-sm transition-colors focus:border-retro-black focus:bg-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecretKey(!showSecretKey)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                  >
                    {showSecretKey ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {storageConfig && (
                  <p className="mt-1 text-xs text-stone-500">
                    Leave blank to keep existing key
                  </p>
                )}
              </div>
            </>
          )}

          {/* GCS-specific fields */}
          {provider === "gcs" && (
            <>
              {/* Project ID */}
              <div>
                <label className="mb-2 block text-sm font-medium text-stone-700">
                  Project ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  placeholder="my-gcp-project"
                  className="w-full rounded border-2 border-stone-200 bg-stone-50 px-4 py-2.5 text-sm transition-colors focus:border-retro-black focus:bg-white focus:outline-none"
                />
              </div>

              {/* Client Email */}
              <div>
                <label className="mb-2 block text-sm font-medium text-stone-700">
                  Service Account Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="sa@project.iam.gserviceaccount.com"
                  className="w-full rounded border-2 border-stone-200 bg-stone-50 px-4 py-2.5 text-sm transition-colors focus:border-retro-black focus:bg-white focus:outline-none"
                />
              </div>

              {/* Private Key */}
              <div>
                <label className="mb-2 block text-sm font-medium text-stone-700">
                  Private Key <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <textarea
                    value={privateKey}
                    onChange={(e) => setPrivateKey(e.target.value)}
                    placeholder={storageConfig?.provider === "gcs" ? "••••••••••••" : "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"}
                    rows={4}
                    className="w-full rounded border-2 border-stone-200 bg-stone-50 px-4 py-2.5 font-mono text-xs transition-colors focus:border-retro-black focus:bg-white focus:outline-none"
                    style={{ fontFamily: "monospace" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPrivateKey(!showPrivateKey)}
                    className="absolute top-3 right-3 text-stone-400 hover:text-stone-600"
                  >
                    {showPrivateKey ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <p className="mt-1 text-xs text-stone-500">
                  Paste the private key from your service account JSON file
                </p>
              </div>
            </>
          )}
        </div>

        {/* Test Result */}
        {testResult && (
          <div
            className={`mt-4 flex items-center gap-2 rounded border p-3 ${
              testResult.success
                ? "border-green-200 bg-green-50 text-green-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {testResult.success ? (
              <Check className="h-4 w-4" />
            ) : (
              <X className="h-4 w-4" />
            )}
            <span className="text-sm">{testResult.message}</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-4 flex items-center gap-2 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <X className="h-4 w-4" />
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            onClick={handleTestConnection}
            disabled={isTesting || !bucket}
            className="flex items-center gap-2 rounded border-2 border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 transition-all hover:border-retro-black disabled:opacity-50"
          >
            {isTesting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Test Connection
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !bucket}
            className="flex items-center gap-2 rounded border-2 border-retro-black bg-retro-black px-6 py-2.5 text-sm font-medium text-white shadow-[4px_4px_0px_0px_#888] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000] disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : saveSuccess ? (
              <Check className="h-4 w-4" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            {saveSuccess ? "Saved!" : "Save Configuration"}
          </button>
          {storageConfig && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center gap-2 rounded border-2 border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-600 transition-all hover:border-red-300 hover:bg-red-50 disabled:opacity-50"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Remove
            </button>
          )}
        </div>
      </div>

      {/* Info Box */}
      <div className="rounded border border-retro-blue/30 bg-retro-blue/5 p-4">
        <div className="flex gap-3">
          <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-retro-blue" />
          <div className="text-sm text-stone-600">
            <p className="font-medium text-retro-blue">About External Storage</p>
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>
                Screenshots are always stored in Convex (fast and reliable)
              </li>
              <li>
                Video recordings can be stored externally for better scalability
              </li>
              <li>
                If no external storage is configured, videos use Convex storage
                (50MB file size limit)
              </li>
              <li>
                Credentials are encrypted at rest
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
