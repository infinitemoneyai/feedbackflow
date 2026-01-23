"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Icon } from "@/components/ui/icon";
import { Analytics } from "@/lib/posthog-provider";

interface OnboardingStepTeamProps {
  onComplete: (teamId: Id<"teams">) => void;
}

export function OnboardingStepTeam({ onComplete }: OnboardingStepTeamProps) {
  const [teamName, setTeamName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createTeam = useMutation(api.onboarding.createOnboardingTeam);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await createTeam({ name: teamName.trim() });
      Analytics.teamCreated();
      Analytics.onboardingStepCompleted("team");
      onComplete(result.teamId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create team");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="border-2 border-retro-black bg-white p-8 shadow-[8px_8px_0px_0px_rgba(26,26,26,1)]">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center border-2 border-retro-black bg-retro-yellow">
          <Icon name="solar:buildings-2-linear" size={24} />
        </div>
        <h1 className="text-2xl font-bold text-retro-black">
          Let&apos;s set up your workspace
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="teamName"
            className="mb-2 block font-mono text-sm uppercase tracking-wider text-stone-600"
          >
            What&apos;s your team or company name?
          </label>
          <input
            id="teamName"
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="Acme Inc."
            className="w-full border-2 border-retro-black bg-stone-50 px-4 py-3 text-lg transition-shadow focus:outline-none focus:ring-0 focus:shadow-[4px_4px_0px_0px_rgba(107,154,196,1)]"
            autoFocus
            disabled={isLoading}
          />
        </div>

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <button
          type="submit"
          disabled={!teamName.trim() || isLoading}
          className="flex w-full items-center justify-center gap-2 border-2 border-retro-black bg-retro-yellow px-6 py-3 font-bold uppercase tracking-wide transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-none"
        >
          {isLoading ? (
            <>
              <Icon name="solar:refresh-linear" size={20} className="animate-spin" />
              Creating...
            </>
          ) : (
            <>
              Continue
              <Icon name="solar:arrow-right-linear" size={20} />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
