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
  const [error, setError] = useState<string | null>(null);
  const [pendingInvites, setPendingInvites] = useState<string[]>([]);

  const completeStep = useMutation(api.onboarding.completeStep);
  const setOnboardingData = useMutation(api.onboarding.setOnboardingData);

  const handleAddEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Please enter a valid email address");
      return;
    }

    // Check for duplicates
    if (pendingInvites.includes(email.trim())) {
      setError("This email is already in your list");
      return;
    }

    setPendingInvites([...pendingInvites, email.trim()]);
    setEmail("");
    setError(null);
  };

  const handleRemoveEmail = (emailToRemove: string) => {
    setPendingInvites(pendingInvites.filter(e => e !== emailToRemove));
  };

  const handleContinue = async () => {
    // Save pending invites to onboarding data for the upgrade step
    if (pendingInvites.length > 0) {
      await setOnboardingData({ 
        key: "pendingInvites", 
        value: JSON.stringify(pendingInvites) 
      });
    }
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

      <form onSubmit={handleAddEmail} className="mb-6">
        <div className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="teammate@company.com"
            className="flex-1 border-2 border-retro-black bg-stone-50 px-4 py-3 transition-shadow focus:outline-none focus:ring-0 focus:shadow-[4px_4px_0px_0px_rgba(107,154,196,1)]"
          />
          <button
            type="submit"
            disabled={!email.trim()}
            className="flex items-center gap-2 border-2 border-retro-black bg-white px-4 py-3 font-medium transition-all hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Icon name="solar:add-circle-linear" size={18} />
            Add
          </button>
        </div>

        {error && (
          <p className="mt-2 text-sm text-red-600">{error}</p>
        )}
      </form>

      {/* Pending invites list */}
      {pendingInvites.length > 0 && (
        <div className="mb-6 space-y-2">
          <p className="font-mono text-xs uppercase tracking-wider text-stone-500">
            Team members to invite ({pendingInvites.length})
          </p>
          {pendingInvites.map((inviteEmail) => (
            <div
              key={inviteEmail}
              className="flex items-center justify-between rounded border-2 border-stone-200 bg-white px-3 py-2 text-sm"
            >
              <div className="flex items-center gap-2">
                <Icon name="solar:user-linear" size={16} className="text-stone-400" />
                <span className="text-stone-700">{inviteEmail}</span>
              </div>
              <button
                onClick={() => handleRemoveEmail(inviteEmail)}
                className="text-stone-400 transition-colors hover:text-red-600"
                title="Remove"
              >
                <Icon name="solar:trash-bin-minimalistic-linear" size={16} />
              </button>
            </div>
          ))}
          <p className="text-xs text-stone-500">
            💡 Invites will be sent after you complete onboarding
          </p>
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
