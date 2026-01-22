"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { X, Loader2, Trash2 } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";

interface EditProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: Id<"projects">;
  isAdmin?: boolean;
  onSuccess?: () => void;
  onDelete?: () => void;
}

type ProjectType = "web_app" | "marketing_site" | "mobile_app" | "other";

export function EditProjectModal({
  isOpen,
  onClose,
  projectId,
  isAdmin = true,
  onSuccess,
  onDelete,
}: EditProjectModalProps) {
  const [projectName, setProjectName] = useState("");
  const [siteUrl, setSiteUrl] = useState("");
  const [projectType, setProjectType] = useState<ProjectType>("web_app");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateProject = useMutation(api.projects.updateProject);
  const deleteProject = useMutation(api.projects.deleteProject);
  const project = useQuery(api.projects.getProject, { projectId });

  // Populate form when project data loads
  useEffect(() => {
    if (project) {
      setProjectName(project.name || "");
      setSiteUrl(project.siteUrl || "");
      setProjectType(project.projectType || "web_app");
      setDescription(project.description || "");
      setError(null);
    }
  }, [project]);

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

      await updateProject({
        projectId,
        name: projectName.trim(),
        siteUrl: formattedUrl || undefined,
        projectType,
        description: description.trim() || undefined,
      });

      // Success - call callback and close
      if (onSuccess) {
        onSuccess();
      }
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update project");
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${project?.name}"?\n\nThis will permanently delete:\n- The project\n- All feedback/tickets\n- All widgets\n- All associated data\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    setIsDeleting(true);
    setError(null);

    try {
      await deleteProject({ projectId });
      
      // Success - call callback and close
      if (onDelete) {
        onDelete();
      }
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete project");
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (!isLoading && !isDeleting) {
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  // Show loading state while project data is loading
  if (!project) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="relative w-full max-w-lg border-2 border-retro-black bg-retro-paper shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] p-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-retro-black" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-lg border-2 border-retro-black bg-retro-paper shadow-[8px_8px_0px_0px_rgba(26,26,26,1)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-retro-black bg-retro-yellow p-4">
          <h2 className="text-lg font-bold uppercase tracking-tight text-retro-black">
            {isAdmin ? "Edit Project" : "Project Details"}
          </h2>
          <button
            onClick={handleClose}
            disabled={isLoading || isDeleting}
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
              Project Name {isAdmin && <span className="text-retro-red">*</span>}
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g., FounderFlow"
              disabled={!isAdmin || isLoading || isDeleting}
              className={cn(
                "w-full border-2 border-retro-black px-4 py-2.5 text-sm transition-shadow focus:outline-none focus:ring-0",
                isAdmin
                  ? "bg-stone-50 focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50"
                  : "bg-stone-200 opacity-60 cursor-not-allowed"
              )}
              required={isAdmin}
            />
          </div>

          {/* Project Code (Read-only) */}
          <div>
            <label className="mb-2 block font-mono text-sm uppercase tracking-wider text-stone-600">
              Project Code
            </label>
            <input
              type="text"
              value={project.code || ""}
              disabled
              className="w-full border-2 border-retro-black bg-stone-200 px-4 py-2.5 font-mono text-sm uppercase opacity-60 cursor-not-allowed"
            />
            <p className="mt-1 font-mono text-xs text-stone-500">
              Project code cannot be changed as it's used in ticket IDs (#
              {project.code}-1, #{project.code}-2...)
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
              disabled={!isAdmin || isLoading || isDeleting}
              className={cn(
                "w-full border-2 border-retro-black px-4 py-2.5 text-sm transition-shadow focus:outline-none focus:ring-0",
                isAdmin
                  ? "bg-stone-50 focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50"
                  : "bg-stone-200 opacity-60 cursor-not-allowed"
              )}
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
              disabled={!isAdmin || isLoading || isDeleting}
              className={cn(
                "w-full border-2 border-retro-black px-4 py-2.5 text-sm transition-shadow focus:outline-none focus:ring-0",
                isAdmin
                  ? "bg-stone-50 focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50"
                  : "bg-stone-200 opacity-60 cursor-not-allowed"
              )}
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
              disabled={!isAdmin || isLoading || isDeleting}
              rows={3}
              className={cn(
                "w-full border-2 border-retro-black px-4 py-2.5 text-sm transition-shadow focus:outline-none focus:ring-0",
                isAdmin
                  ? "bg-stone-50 focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50"
                  : "bg-stone-200 opacity-60 cursor-not-allowed"
              )}
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 pt-2">
            {isAdmin ? (
              <>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isLoading || isDeleting}
                    className="flex-1 border-2 border-retro-black bg-white px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-retro-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || isDeleting || !projectName.trim()}
                    className="flex flex-1 items-center justify-center gap-2 border-2 border-retro-black bg-retro-blue px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:bg-retro-blue/90 hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] disabled:translate-x-0 disabled:translate-y-0 disabled:opacity-50 disabled:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </button>
                </div>

                {/* Delete Button */}
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isLoading || isDeleting}
                  className="flex w-full items-center justify-center gap-2 border-2 border-retro-red bg-white px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-retro-red shadow-[2px_2px_0px_0px_rgba(220,38,38,1)] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:bg-retro-red/10 hover:shadow-[1px_1px_0px_0px_rgba(220,38,38,1)] disabled:translate-x-0 disabled:translate-y-0 disabled:opacity-50 disabled:shadow-[2px_2px_0px_0px_rgba(220,38,38,1)]"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      Delete Project
                    </>
                  )}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleClose}
                className="w-full border-2 border-retro-black bg-retro-blue px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:bg-retro-blue/90 hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
              >
                Close
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
