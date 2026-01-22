"use client";

import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { X, Loader2 } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: Id<"teams">;
  onSuccess?: (projectId: Id<"projects">) => void;
}

type ProjectType = "web_app" | "marketing_site" | "mobile_app" | "other";

/**
 * Generate a project code from the project name
 */
function generateProjectCode(name: string): string {
  // Remove special characters and split into words
  const words = name
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 0);

  if (words.length === 0) {
    return "";
  }

  // Take first letter of each word, up to 4 chars
  let code = words.map((w) => w[0]).join("").slice(0, 4);

  // If too short, pad with more letters from first word
  if (code.length < 2 && words[0].length >= 2) {
    code = words[0].slice(0, 2);
  }

  return code;
}

export function CreateProjectModal({
  isOpen,
  onClose,
  teamId,
  onSuccess,
}: CreateProjectModalProps) {
  const [projectName, setProjectName] = useState("");
  const [projectCode, setProjectCode] = useState("");
  const [siteUrl, setSiteUrl] = useState("");
  const [projectType, setProjectType] = useState<ProjectType>("web_app");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [codeManuallyEdited, setCodeManuallyEdited] = useState(false);

  const createProject = useMutation(api.projects.createProject);

  // Auto-generate code from name if not manually edited
  useEffect(() => {
    if (!codeManuallyEdited && projectName) {
      const generated = generateProjectCode(projectName);
      setProjectCode(generated);
    }
  }, [projectName, codeManuallyEdited]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      // Ensure URL has protocol if provided
      let formattedUrl = siteUrl.trim();
      if (formattedUrl && !formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
        formattedUrl = `https://${formattedUrl}`;
      }

      const result = await createProject({
        teamId,
        name: projectName.trim(),
        code: projectCode.trim() || undefined,
        siteUrl: formattedUrl || undefined,
        projectType,
        description: description.trim() || undefined,
      });

      // Success - call callback and close
      if (onSuccess && result.projectId) {
        onSuccess(result.projectId);
      }
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project");
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setProjectName("");
      setProjectCode("");
      setSiteUrl("");
      setProjectType("web_app");
      setDescription("");
      setError(null);
      setCodeManuallyEdited(false);
      onClose();
    }
  };

  const handleCodeChange = (value: string) => {
    setCodeManuallyEdited(true);
    // Only allow uppercase alphanumeric, max 4 chars
    const sanitized = value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4);
    setProjectCode(sanitized);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-lg border-2 border-retro-black bg-retro-paper shadow-[8px_8px_0px_0px_rgba(26,26,26,1)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-retro-black bg-retro-yellow p-4">
          <h2 className="text-lg font-bold uppercase tracking-tight text-retro-black">
            Create New Project
          </h2>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="text-retro-black transition-colors hover:text-stone-600 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Error message */}
          {error && (
            <div className="rounded border-2 border-retro-red bg-retro-red/10 p-3 text-sm text-retro-red">
              {error}
            </div>
          )}

          {/* Project Name */}
          <div>
            <label className="mb-2 block font-mono text-sm uppercase tracking-wider text-stone-600">
              Project Name <span className="text-retro-red">*</span>
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g., FounderFlow"
              disabled={isLoading}
              className="w-full border-2 border-retro-black bg-stone-50 px-4 py-2.5 text-sm transition-shadow focus:outline-none focus:ring-0 focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50"
              required
            />
          </div>

          {/* Project Code */}
          <div>
            <label className="mb-2 block font-mono text-sm uppercase tracking-wider text-stone-600">
              Project Code <span className="text-retro-red">*</span>
            </label>
            <input
              type="text"
              value={projectCode}
              onChange={(e) => handleCodeChange(e.target.value)}
              placeholder="FF"
              disabled={isLoading}
              maxLength={4}
              className="w-full border-2 border-retro-black bg-stone-50 px-4 py-2.5 font-mono text-sm uppercase transition-shadow focus:outline-none focus:ring-0 focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50"
              required
            />
            <p className="mt-1 font-mono text-xs text-stone-500">
              2-4 uppercase letters/numbers. {projectCode && `Tickets will be tagged #${projectCode}-1, #${projectCode}-2...`}
            </p>
          </div>

          {/* Site URL */}
          <div>
            <label className="mb-2 block font-mono text-sm uppercase tracking-wider text-stone-600">
              Site URL
            </label>
            <input
              type="text"
              value={siteUrl}
              onChange={(e) => setSiteUrl(e.target.value)}
              placeholder="https://yoursite.com"
              disabled={isLoading}
              className="w-full border-2 border-retro-black bg-stone-50 px-4 py-2.5 text-sm transition-shadow focus:outline-none focus:ring-0 focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50"
            />
          </div>

          {/* Project Type */}
          <div>
            <label className="mb-2 block font-mono text-sm uppercase tracking-wider text-stone-600">
              Project Type
            </label>
            <select
              value={projectType}
              onChange={(e) => setProjectType(e.target.value as ProjectType)}
              disabled={isLoading}
              className="w-full border-2 border-retro-black bg-stone-50 px-4 py-2.5 text-sm transition-shadow focus:outline-none focus:ring-0 focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50"
            >
              <option value="web_app">Web App</option>
              <option value="marketing_site">Marketing Site</option>
              <option value="mobile_app">Mobile App</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="mb-2 block font-mono text-sm uppercase tracking-wider text-stone-600">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional project description..."
              disabled={isLoading}
              rows={3}
              className="w-full border-2 border-retro-black bg-stone-50 px-4 py-2.5 text-sm transition-shadow focus:outline-none focus:ring-0 focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 border-2 border-retro-black bg-white px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-retro-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !projectName.trim() || !projectCode.trim()}
              className="flex flex-1 items-center justify-center gap-2 border-2 border-retro-black bg-retro-blue px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:bg-retro-blue/90 hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] disabled:translate-x-0 disabled:translate-y-0 disabled:opacity-50 disabled:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Project"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
