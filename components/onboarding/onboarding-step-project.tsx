"use client";

import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

type ProjectType = "web_app" | "marketing_site" | "mobile_app" | "other";

const projectTypes: { value: ProjectType; label: string; icon: string }[] = [
  { value: "web_app", label: "Web App", icon: "solar:window-frame-linear" },
  { value: "marketing_site", label: "Marketing Site", icon: "solar:global-linear" },
  { value: "mobile_app", label: "Mobile App", icon: "solar:smartphone-linear" },
  { value: "other", label: "Other", icon: "solar:widget-linear" },
];

interface OnboardingStepProjectProps {
  teamId: Id<"teams">;
}

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

export function OnboardingStepProject({ teamId }: OnboardingStepProjectProps) {
  const router = useRouter();
  const [projectName, setProjectName] = useState("");
  const [projectCode, setProjectCode] = useState("");
  const [siteUrl, setSiteUrl] = useState("");
  const [projectType, setProjectType] = useState<ProjectType>("web_app");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [codeManuallyEdited, setCodeManuallyEdited] = useState(false);

  const createProject = useMutation(api.onboarding.createOnboardingProject);

  // Auto-generate code from name if not manually edited
  useEffect(() => {
    if (!codeManuallyEdited && projectName) {
      const generated = generateProjectCode(projectName);
      setProjectCode(generated);
    }
  }, [projectName, codeManuallyEdited]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim() || !siteUrl.trim() || !projectCode.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      // Ensure URL has protocol
      let formattedUrl = siteUrl.trim();
      if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
        formattedUrl = `https://${formattedUrl}`;
      }

      await createProject({
        teamId,
        name: projectName.trim(),
        code: projectCode.trim(),
        siteUrl: formattedUrl,
        projectType,
      });

      // Redirect to dashboard where modal will take over
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project");
      setIsLoading(false);
    }
  };

  const handleCodeChange = (value: string) => {
    setCodeManuallyEdited(true);
    // Only allow uppercase alphanumeric, max 4 chars
    const sanitized = value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4);
    setProjectCode(sanitized);
  };

  return (
    <div className="border-2 border-retro-black bg-white p-8 shadow-[8px_8px_0px_0px_rgba(26,26,26,1)]">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center border-2 border-retro-black bg-retro-lavender">
          <Icon name="solar:folder-with-files-linear" size={24} />
        </div>
        <h1 className="text-2xl font-bold text-retro-black">
          Create your first project
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Project Name */}
        <div>
          <label
            htmlFor="projectName"
            className="mb-2 block font-mono text-sm uppercase tracking-wider text-stone-600"
          >
            Project Name
          </label>
          <input
            id="projectName"
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="My App"
            className="w-full border-2 border-retro-black bg-stone-50 px-4 py-3 transition-shadow focus:outline-none focus:ring-0 focus:shadow-[4px_4px_0px_0px_rgba(107,154,196,1)]"
            autoFocus
            disabled={isLoading}
          />
        </div>

        {/* Project Code */}
        <div>
          <label
            htmlFor="projectCode"
            className="mb-2 block font-mono text-sm uppercase tracking-wider text-stone-600"
          >
            Project Code
          </label>
          <input
            id="projectCode"
            type="text"
            value={projectCode}
            onChange={(e) => handleCodeChange(e.target.value)}
            placeholder="MA"
            maxLength={4}
            className="w-full border-2 border-retro-black bg-stone-50 px-4 py-3 font-mono uppercase transition-shadow focus:outline-none focus:ring-0 focus:shadow-[4px_4px_0px_0px_rgba(107,154,196,1)]"
            disabled={isLoading}
          />
          <p className="mt-2 text-sm text-stone-500">
            2-4 uppercase letters/numbers. {projectCode && `Tickets will be tagged #${projectCode}-1, #${projectCode}-2...`}
          </p>
        </div>

        {/* Site URL */}
        <div>
          <label
            htmlFor="siteUrl"
            className="mb-2 block font-mono text-sm uppercase tracking-wider text-stone-600"
          >
            Site URL
          </label>
          <input
            id="siteUrl"
            type="text"
            value={siteUrl}
            onChange={(e) => setSiteUrl(e.target.value)}
            placeholder="https://myapp.com"
            className="w-full border-2 border-retro-black bg-stone-50 px-4 py-3 transition-shadow focus:outline-none focus:ring-0 focus:shadow-[4px_4px_0px_0px_rgba(107,154,196,1)]"
            disabled={isLoading}
          />
        </div>

        {/* Project Type */}
        <div>
          <label className="mb-2 block font-mono text-sm uppercase tracking-wider text-stone-600">
            Project Type
          </label>
          <div className="grid grid-cols-2 gap-3">
            {projectTypes.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setProjectType(type.value)}
                disabled={isLoading}
                className={cn(
                  "flex items-center gap-2 border-2 px-4 py-3 transition-all",
                  projectType === type.value
                    ? "border-retro-black bg-retro-yellow shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]"
                    : "border-stone-200 bg-white hover:border-retro-black"
                )}
              >
                <Icon name={type.icon} size={20} />
                <span className="text-sm font-medium">{type.label}</span>
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <button
          type="submit"
          disabled={!projectName.trim() || !siteUrl.trim() || isLoading}
          className="flex w-full items-center justify-center gap-2 border-2 border-retro-black bg-retro-yellow px-6 py-3 font-bold uppercase tracking-wide transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-none"
        >
          {isLoading ? (
            <>
              <Icon name="solar:refresh-linear" size={20} className="animate-spin" />
              Creating...
            </>
          ) : (
            <>
              Create Project
              <Icon name="solar:arrow-right-linear" size={20} />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
