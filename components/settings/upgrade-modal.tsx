"use client";

import { X, Crown, Check } from "lucide-react";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";

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
      <div className="relative w-full max-w-lg border-2 border-retro-black bg-retro-paper shadow-[8px_8px_0px_0px_rgba(26,26,26,1)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-retro-black bg-retro-yellow p-4">
          <div className="flex items-center gap-2">
            <Icon name="solar:crown-star-bold" size={24} className="text-retro-black" />
            <h2 className="text-lg font-bold uppercase tracking-tight text-retro-black">
              Upgrade to Pro
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-retro-black transition-colors hover:text-stone-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <h3 className="mb-2 font-bold text-retro-black">
              Unlock Unlimited Potential
            </h3>
            <p className="text-sm text-stone-600">
              You need to upgrade to Pro to <span className="font-bold">{feature}</span>. The Free plan is limited to 1 team member and 25 feedback submissions per month.
            </p>
          </div>

          {/* Pro features */}
          <div className="mb-6 space-y-3 border-2 border-dashed border-stone-300 bg-white/50 p-4">
            <h4 className="font-mono text-xs uppercase tracking-wider text-stone-500 mb-3">
              Pro Plan includes:
            </h4>
            <ul className="space-y-2">
              {[
                "Unlimited team members",
                "Unlimited feedback submissions",
                "Advanced AI features",
                "Priority support",
                "Custom integrations",
              ].map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm text-stone-700">
                  <Icon name="solar:check-circle-bold" size={16} className="flex-shrink-0 text-retro-blue" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 border-2 border-retro-black bg-white px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-retro-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
            >
              Maybe Later
            </button>
            <Link
              href={teamId ? `/settings?tab=billing` : "/settings"}
              className="flex flex-1 items-center justify-center gap-2 border-2 border-retro-black bg-retro-blue px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:bg-retro-blue/90 hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
            >
              <Icon name="solar:crown-star-bold" size={16} />
              Upgrade Now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
