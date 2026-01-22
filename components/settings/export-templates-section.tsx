"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import {
  FileCode,
  FileJson,
  FileText,
  Loader2,
  Check,
  X,
  RotateCcw,
  Save,
  Eye,
  EyeOff,
  Copy,
  ChevronDown,
  ChevronUp,
  Info,
  AlertTriangle,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

interface ExportTemplatesSectionProps {
  projectId: Id<"projects">;
}

type Provider = "linear" | "notion" | "json";

interface TemplateVariable {
  name: string;
  description: string;
  example: string;
}

// Sample feedback data for preview
const SAMPLE_FEEDBACK = {
  id: "FF-ABC123",
  title: "Login button not responding on mobile",
  description: "When I try to tap the login button on my iPhone, nothing happens. I have to tap multiple times for it to work.",
  type: "bug" as const,
  priority: "high" as const,
  priorityNumber: 2,
  status: "new" as const,
  tags: ["mobile", "auth", "urgent"],
  submitterName: "Jane Smith",
  submitterEmail: "jane@example.com",
  screenshotUrl: "https://storage.feedbackflow.cc/screenshots/abc123.png",
  recordingUrl: "https://storage.feedbackflow.cc/recordings/abc123.webm",
  metadata: {
    url: "https://app.example.com/login",
    browser: "Safari 17.0",
    os: "iOS 17.1",
    screenWidth: 390,
    screenHeight: 844,
  },
  acceptanceCriteria: [
    "Login button responds to first tap on mobile devices",
    "No visual lag or delay when button is tapped",
    "Button shows pressed state immediately on touch",
  ],
  reproSteps: [
    "Open the app on an iPhone",
    "Navigate to the login page",
    "Tap the login button",
    "Observe that nothing happens",
  ],
  expectedBehavior: "The login form should submit and user should be redirected to the dashboard",
  actualBehavior: "Nothing happens on first tap, requires multiple attempts",
  createdAt: new Date().toISOString(),
  notes: "This is affecting multiple users on iOS devices. Seems to have started after the last release.",
};

/**
 * Simple Handlebars-like template rendering
 * Supports: {{variable}}, {{#if}}, {{#each}}, {{#unless}}, {{@index}}, {{@last}}, {{join array "sep"}}
 */
function renderTemplate(template: string, data: Record<string, unknown>): string {
  let result = template;

  // Handle {{#each array}}...{{/each}}
  result = result.replace(
    /\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g,
    (_, arrayName, content) => {
      const array = getNestedValue(data, arrayName) as unknown[];
      if (!Array.isArray(array) || array.length === 0) return "";

      return array
        .map((item, index) => {
          let itemContent = content;
          // Replace {{this}}
          itemContent = itemContent.replace(/\{\{this\}\}/g, String(item));
          // Replace {{@index}}
          itemContent = itemContent.replace(/\{\{@index\}\}/g, String(index + 1));
          // Replace {{#unless @last}}...{{/unless}}
          const isLast = index === array.length - 1;
          itemContent = itemContent.replace(
            /\{\{#unless\s+@last\}\}([\s\S]*?)\{\{\/unless\}\}/g,
            isLast ? "" : "$1"
          );
          return itemContent;
        })
        .join("");
    }
  );

  // Handle {{#if variable}}...{{/if}}
  result = result.replace(
    /\{\{#if\s+(\S+)\}\}([\s\S]*?)\{\{\/if\}\}/g,
    (_, varName, content) => {
      const value = getNestedValue(data, varName);
      if (value && (Array.isArray(value) ? value.length > 0 : true)) {
        return content;
      }
      return "";
    }
  );

  // Handle {{join array "separator"}}
  result = result.replace(
    /\{\{join\s+(\w+)\s+"([^"]+)"\}\}/g,
    (_, arrayName, separator) => {
      const array = getNestedValue(data, arrayName) as string[];
      if (Array.isArray(array)) {
        return array.join(separator);
      }
      return "";
    }
  );

  // Handle simple {{variable}} replacements
  result = result.replace(/\{\{(\S+?)\}\}/g, (_, varName) => {
    const value = getNestedValue(data, varName);
    if (value === undefined || value === null) return "";
    return String(value);
  });

  // Clean up empty lines (multiple newlines become double)
  result = result.replace(/\n{3,}/g, "\n\n");

  return result;
}

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce((current: unknown, key) => {
    if (current && typeof current === "object" && key in (current as Record<string, unknown>)) {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

const PROVIDER_CONFIG: Record<Provider, { icon: typeof FileCode; label: string; color: string; bgColor: string; borderColor: string }> = {
  linear: {
    icon: FileCode,
    label: "Linear",
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
  },
  notion: {
    icon: FileText,
    label: "Notion",
    color: "text-stone-700",
    bgColor: "bg-stone-50",
    borderColor: "border-stone-200",
  },
  json: {
    icon: FileJson,
    label: "JSON (prd.json)",
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
  },
};

export function ExportTemplatesSection({ projectId }: ExportTemplatesSectionProps) {
  const [selectedProvider, setSelectedProvider] = useState<Provider>("linear");
  const [editedTemplate, setEditedTemplate] = useState("");
  const [editedName, setEditedName] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [showVariables, setShowVariables] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Fetch template for selected provider
  const template = useQuery(api.exportTemplates.getExportTemplate, {
    projectId,
    provider: selectedProvider,
  });

  // Fetch available variables
  const variables = useQuery(api.exportTemplates.getTemplateVariables);

  // Mutations
  const saveTemplateMutation = useMutation(api.exportTemplates.saveExportTemplate);
  const resetTemplateMutation = useMutation(api.exportTemplates.resetExportTemplate);

  // Update local state when template data changes
  useEffect(() => {
    if (template) {
      setEditedTemplate(template.template);
      setEditedName(template.name);
      setHasUnsavedChanges(false);
    }
  }, [template]);

  // Check for unsaved changes
  useEffect(() => {
    if (template) {
      const hasChanges =
        editedTemplate !== template.template || editedName !== template.name;
      setHasUnsavedChanges(hasChanges);
    }
  }, [editedTemplate, editedName, template]);

  // Render preview
  const previewContent = useMemo(() => {
    if (!editedTemplate) return "";
    try {
      return renderTemplate(editedTemplate, SAMPLE_FEEDBACK);
    } catch {
      return "Error rendering preview. Check your template syntax.";
    }
  }, [editedTemplate]);

  // Show message with auto-clear
  const showMessage = useCallback((type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  }, []);

  // Handle save
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      await saveTemplateMutation({
        projectId,
        provider: selectedProvider,
        name: editedName,
        template: editedTemplate,
      });
      showMessage("success", "Template saved successfully");
      setHasUnsavedChanges(false);
    } catch (err) {
      showMessage("error", err instanceof Error ? err.message : "Failed to save template");
    } finally {
      setIsSaving(false);
    }
  }, [projectId, selectedProvider, editedName, editedTemplate, saveTemplateMutation, showMessage]);

  // Handle reset
  const handleReset = useCallback(async () => {
    if (!confirm("Are you sure you want to reset this template to the default? This cannot be undone.")) {
      return;
    }

    setIsResetting(true);
    try {
      await resetTemplateMutation({
        projectId,
        provider: selectedProvider,
      });
      showMessage("success", "Template reset to default");
    } catch (err) {
      showMessage("error", err instanceof Error ? err.message : "Failed to reset template");
    } finally {
      setIsResetting(false);
    }
  }, [projectId, selectedProvider, resetTemplateMutation, showMessage]);

  // Copy variable to clipboard
  const handleCopyVariable = useCallback(async (varName: string) => {
    try {
      await navigator.clipboard.writeText(`{{${varName}}}`);
      showMessage("success", `Copied {{${varName}}}`);
    } catch {
      showMessage("error", "Failed to copy to clipboard");
    }
  }, [showMessage]);

  // Handle provider change with unsaved changes warning
  const handleProviderChange = useCallback((provider: Provider) => {
    if (hasUnsavedChanges) {
      if (!confirm("You have unsaved changes. Switch template anyway?")) {
        return;
      }
    }
    setSelectedProvider(provider);
    setShowPreview(false);
  }, [hasUnsavedChanges]);

  if (!template || !variables) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-stone-400" />
      </div>
    );
  }

  const providerConfig = PROVIDER_CONFIG[selectedProvider];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded border-2 border-retro-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border-2 border-retro-peach bg-retro-peach/10">
            <FileCode className="h-6 w-6 text-retro-peach" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-retro-black">
              Export Templates
            </h2>
            <p className="mt-1 text-sm text-stone-600">
              Customize how feedback is formatted when exported to Linear, Notion, or JSON.
              Use template variables to include feedback data.
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      {message && (
        <div
          className={`flex items-center gap-2 rounded border p-3 text-sm ${
            message.type === "success"
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {message.type === "success" ? (
            <Check className="h-4 w-4" />
          ) : (
            <X className="h-4 w-4" />
          )}
          {message.text}
        </div>
      )}

      {/* Provider Tabs */}
      <div className="flex gap-2">
        {(Object.keys(PROVIDER_CONFIG) as Provider[]).map((provider) => {
          const config = PROVIDER_CONFIG[provider];
          const Icon = config.icon;
          const isSelected = selectedProvider === provider;

          return (
            <button
              key={provider}
              onClick={() => handleProviderChange(provider)}
              className={`flex items-center gap-2 rounded border-2 px-4 py-2.5 text-sm font-medium transition-all ${
                isSelected
                  ? `${config.borderColor} ${config.bgColor} ${config.color} border-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]`
                  : "border-stone-200 bg-white text-stone-600 hover:border-stone-300"
              }`}
            >
              <Icon className="h-4 w-4" />
              {config.label}
            </button>
          );
        })}
      </div>

      {/* Template Editor */}
      <div className={`rounded border-2 ${providerConfig.borderColor} bg-white`}>
        {/* Editor Header */}
        <div className={`flex items-center justify-between border-b ${providerConfig.borderColor} ${providerConfig.bgColor} px-4 py-3`}>
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              className="rounded border border-stone-200 bg-white px-3 py-1.5 text-sm font-medium focus:border-retro-black focus:outline-none"
              placeholder="Template name"
            />
            {template.isDefault && (
              <span className="rounded bg-stone-200 px-2 py-0.5 text-xs text-stone-500">
                Default
              </span>
            )}
            {hasUnsavedChanges && (
              <span className="rounded bg-yellow-100 px-2 py-0.5 text-xs text-yellow-700">
                Unsaved changes
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowVariables(!showVariables)}
              className={`flex items-center gap-1.5 rounded border px-3 py-1.5 text-xs font-medium transition-colors ${
                showVariables
                  ? "border-retro-blue bg-retro-blue/10 text-retro-blue"
                  : "border-stone-200 text-stone-600 hover:border-stone-300"
              }`}
            >
              <Info className="h-3 w-3" />
              Variables
              {showVariables ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </button>
            <button
              onClick={() => setShowPreview(!showPreview)}
              className={`flex items-center gap-1.5 rounded border px-3 py-1.5 text-xs font-medium transition-colors ${
                showPreview
                  ? "border-retro-black bg-retro-black text-white"
                  : "border-stone-200 text-stone-600 hover:border-stone-300"
              }`}
            >
              {showPreview ? (
                <>
                  <EyeOff className="h-3 w-3" />
                  Hide Preview
                </>
              ) : (
                <>
                  <Eye className="h-3 w-3" />
                  Preview
                </>
              )}
            </button>
          </div>
        </div>

        {/* Variables Panel */}
        {showVariables && (
          <div className="border-b border-stone-200 bg-stone-50 p-4">
            <p className="mb-3 text-xs text-stone-500">
              Click a variable to copy it. Use <code className="rounded bg-white px-1">{"{{variable}}"}</code> in your template.
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {variables.map((variable: TemplateVariable) => (
                <button
                  key={variable.name}
                  onClick={() => handleCopyVariable(variable.name)}
                  className="group flex items-start gap-2 rounded border border-stone-200 bg-white p-2 text-left transition-colors hover:border-retro-black"
                >
                  <code className="flex-shrink-0 rounded bg-stone-100 px-1.5 py-0.5 font-mono text-xs text-stone-700 group-hover:bg-retro-yellow/20">
                    {`{{${variable.name}}}`}
                  </code>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs text-stone-600">
                      {variable.description}
                    </p>
                    <p className="truncate font-mono text-[10px] text-stone-400">
                      e.g. {variable.example}
                    </p>
                  </div>
                  <Copy className="h-3 w-3 flex-shrink-0 text-stone-400 opacity-0 transition-opacity group-hover:opacity-100" />
                </button>
              ))}
            </div>
            <div className="mt-3 rounded border border-stone-200 bg-white p-2 text-xs text-stone-500">
              <strong>Template syntax:</strong> Use <code>{"{{#if variable}}...{{/if}}"}</code> for conditionals,{" "}
              <code>{"{{#each array}}...{{/each}}"}</code> for loops (with <code>{"{{this}}"}</code> and{" "}
              <code>{"{{@index}}"}</code>), and <code>{"{{join array \", \"}}"}</code> to join arrays.
            </div>
          </div>
        )}

        {/* Editor Content */}
        <div className={`${showPreview ? "grid grid-cols-2 divide-x divide-stone-200" : ""}`}>
          {/* Template Editor */}
          <div className="p-4">
            <textarea
              value={editedTemplate}
              onChange={(e) => setEditedTemplate(e.target.value)}
              className="h-96 w-full resize-none rounded border border-stone-200 bg-stone-50 p-4 font-mono text-sm focus:border-retro-black focus:bg-white focus:outline-none"
              placeholder="Enter your template..."
              spellCheck={false}
            />
          </div>

          {/* Preview */}
          {showPreview && (
            <div className="p-4">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-xs font-medium text-stone-500">Preview</span>
                <span className="rounded bg-stone-100 px-1.5 py-0.5 text-[10px] text-stone-400">
                  Sample data
                </span>
              </div>
              <pre className="h-96 overflow-auto whitespace-pre-wrap rounded border border-stone-200 bg-stone-50 p-4 font-mono text-xs text-stone-700">
                {previewContent}
              </pre>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between border-t border-stone-200 bg-stone-50 px-4 py-3">
          <button
            onClick={handleReset}
            disabled={isResetting || template.isDefault}
            className="flex items-center gap-2 rounded border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-600 transition-colors hover:border-stone-400 disabled:opacity-50"
          >
            {isResetting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RotateCcw className="h-4 w-4" />
            )}
            Reset to Default
          </button>
          <div className="flex items-center gap-2">
            {hasUnsavedChanges && (
              <span className="flex items-center gap-1 text-xs text-yellow-600">
                <AlertTriangle className="h-3 w-3" />
                Unsaved changes
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={isSaving || !hasUnsavedChanges}
              className="flex items-center gap-2 rounded border-2 border-retro-black bg-retro-black px-6 py-2 text-sm font-medium text-white shadow-[4px_4px_0px_0px_#888] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000] disabled:opacity-50 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[4px_4px_0px_0px_#888]"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Template
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
