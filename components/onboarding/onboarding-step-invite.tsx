"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Icon } from "@/components/ui/icon";

interface OnboardingStepInviteProps {
  teamId: Id<"teams">;
}

export function OnboardingStepInvite({ teamId }: OnboardingStepInviteProps) {
  const [email, setEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invitedEmails, setInvitedEmails] = useState<string[]>([]);

  const inviteToTeam = useMutation(api.teams.inviteToTeam);
  const completeStep = useMutation(api.onboarding.completeStep);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsInviting(true);
    setError(null);

    try {
      await inviteToTeam({
        teamId,
        email: email.trim(),
        role: "member",
      });
      setInvitedEmails([...invitedEmails, email.trim()]);
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send invite");
    } finally {
      setIsInviting(false);
    }
  };

  const handleContinue = async () => {
    await completeStep({ step: 6 });
  };

  const handleSkip = async () => {
    await completeStep({ step: 6 });
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center border-2 border-retro-black bg-retro-pink">
          <Icon name="solar:users-group-rounded-linear" size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-retro-black">Invite your team</h2>
          <p className="text-sm text-stone-600">Collaboration makes feedback better</p>
        </div>
      </div>

      <form onSubmit={handleInvite} className="mb-6">
        <div className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="teammate@company.com"
            className="flex-1 border-2 border-retro-black bg-stone-50 px-4 py-3 transition-shadow focus:outline-none focus:ring-0 focus:shadow-[4px_4px_0px_0px_rgba(107,154,196,1)]"
            disabled={isInviting}
          />
          <button
            type="submit"
            disabled={!email.trim() || isInviting}
            className="flex items-center gap-2 border-2 border-retro-black bg-white px-4 py-3 font-medium transition-all hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isInviting ? (
              <Icon name="solar:refresh-linear" size={18} className="animate-spin" />
            ) : (
              <Icon name="solar:letter-linear" size={18} />
            )}
            Invite
          </button>
        </div>

        {error && (
          <p className="mt-2 text-sm text-red-600">{error}</p>
        )}
      </form>

      {/* Invited list */}
      {invitedEmails.length > 0 && (
        <div className="mb-6 space-y-2">
          <p className="font-mono text-xs uppercase tracking-wider text-stone-500">Invited</p>
          {invitedEmails.map((invitedEmail) => (
            <div
              key={invitedEmail}
              className="flex items-center gap-2 rounded border border-green-200 bg-green-50 px-3 py-2 text-sm"
            >
              <Icon name="solar:check-circle-linear" size={16} className="text-green-600" />
              <span className="text-stone-700">{invitedEmail}</span>
              <span className="text-stone-500">- Invite sent</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <button
          onClick={handleSkip}
          className="text-sm text-stone-500 transition-colors hover:text-retro-black"
        >
          I&apos;ll do this later
        </button>

        <button
          onClick={handleContinue}
          className="flex items-center gap-2 border-2 border-retro-black bg-retro-yellow px-6 py-3 font-bold uppercase tracking-wide transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]"
        >
          Continue
          <Icon name="solar:arrow-right-linear" size={20} />
        </button>
      </div>
    </div>
  );
}
