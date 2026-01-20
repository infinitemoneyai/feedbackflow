"use client";

import { cn } from "@/lib/utils";

interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
}

export function OnboardingProgress({ currentStep, totalSteps }: OnboardingProgressProps) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
        <div
          key={step}
          className={cn(
            "h-2.5 w-2.5 rounded-full border-2 border-retro-black transition-all duration-300",
            step === currentStep
              ? "scale-125 bg-retro-yellow"
              : step < currentStep
                ? "bg-retro-black"
                : "bg-transparent"
          )}
        />
      ))}
    </div>
  );
}
