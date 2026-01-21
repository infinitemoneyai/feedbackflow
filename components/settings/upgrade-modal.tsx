"use client";

import { X, Crown, Check } from "lucide-react";
import Link from "next/link";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature: string;
  teamId?: string;
}

export function UpgradeModal({ isOpen, onClose, feature, teamId }: UpgradeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-lg rounded border-2 border-retro-black bg-white shadow-[8px_8px_0px_0px_rgba(26,26,26,1)]">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded p-1 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="border-b-2 border-retro-black bg-retro-yellow/10 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-retro-yellow bg-retro-yellow/20">
              <Crown className="h-6 w-6 text-retro-yellow" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-retro-black">
                Upgrade to Pro
              </h2>
              <p className="text-sm text-stone-600">
                Unlock unlimited team members
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="mb-6 text-stone-600">
            You need to upgrade to Pro to {feature}. The Free plan is limited to 1 team member.
          </p>

          {/* Pro features */}
          <div className="mb-6 space-y-3 rounded border border-stone-200 bg-stone-50 p-4">
            <h3 className="font-semibold text-retro-black">Pro Plan includes:</h3>
            <ul className="space-y-2">
              {[
                "Unlimited team members",
                "Unlimited feedback submissions",
                "Advanced AI features",
                "Priority support",
                "Custom integrations",
              ].map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm text-stone-600">
                  <Check className="h-4 w-4 flex-shrink-0 text-retro-blue" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Link
              href={teamId ? `/settings?tab=billing` : "/settings"}
              className="flex flex-1 items-center justify-center gap-2 rounded border-2 border-retro-black bg-retro-black px-4 py-2.5 text-sm font-medium text-white shadow-[4px_4px_0px_0px_#888] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000]"
            >
              <Crown className="h-4 w-4" />
              Upgrade to Pro
            </Link>
            <button
              onClick={onClose}
              className="rounded border-2 border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 transition-colors hover:border-stone-300 hover:bg-stone-50"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
