"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Icon } from "@/components/ui/icon";
import { PLANS } from "@/lib/stripe-config";

export function OnboardingStepUpgrade() {
  const [isLoading, setIsLoading] = useState(false);
  const skipToComplete = useMutation(api.onboarding.skipToComplete);

  const handleUpgrade = async () => {
    setIsLoading(true);
    // Redirect to billing/upgrade page
    window.location.href = `/settings/billing?upgrade=true`;
  };

  const handleStartFree = async () => {
    await skipToComplete();
  };

  return (
    <div className="p-8">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center border-2 border-retro-black bg-retro-yellow">
          <Icon name="solar:crown-linear" size={28} />
        </div>
        <h2 className="text-2xl font-bold text-retro-black">Unlock the full power</h2>
      </div>

      {/* Comparison */}
      <div className="mb-6 grid grid-cols-2 gap-4">
        {/* Free */}
        <div className="border-2 border-stone-200 bg-stone-50 p-4">
          <h3 className="mb-2 font-bold text-stone-600">Free</h3>
          <p className="mb-4 text-2xl font-bold text-stone-400">$0</p>
          <ul className="space-y-2 text-sm text-stone-500">
            {PLANS.free.features.map((feature, i) => (
              <li key={i} className="flex items-start gap-2">
                <Icon name="solar:minus-circle-linear" size={16} className="mt-0.5 shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* Pro */}
        <div className="border-2 border-retro-blue bg-white p-4 shadow-[4px_4px_0px_0px_rgba(107,154,196,1)]">
          <h3 className="mb-2 font-bold text-retro-black">Pro</h3>
          <p className="mb-4">
            <span className="text-2xl font-bold text-retro-black">${PLANS.pro.pricePerSeat}</span>
            <span className="text-sm text-stone-500">/seat/mo</span>
          </p>
          <ul className="space-y-2 text-sm text-stone-700">
            {PLANS.pro.features.map((feature, i) => (
              <li key={i} className="flex items-start gap-2">
                <Icon name="solar:check-circle-linear" size={16} className="mt-0.5 shrink-0 text-retro-blue" />
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <button
          onClick={handleUpgrade}
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-2 border-2 border-retro-black bg-retro-yellow px-6 py-3 font-bold uppercase tracking-wide transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] disabled:opacity-50"
        >
          {isLoading ? (
            <Icon name="solar:refresh-linear" size={20} className="animate-spin" />
          ) : (
            <>
              Upgrade to Pro
              <Icon name="solar:arrow-right-linear" size={20} />
            </>
          )}
        </button>

        <button
          onClick={handleStartFree}
          className="w-full py-2 text-center text-sm text-stone-500 transition-colors hover:text-retro-black"
        >
          Start with Free
        </button>
      </div>
    </div>
  );
}
