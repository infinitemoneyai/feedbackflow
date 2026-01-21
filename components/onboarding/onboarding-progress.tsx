"use client";

import { cn } from "@/lib/utils";

interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
  onStepClick?: (step: number) => void;
}

export function OnboardingProgress({ currentStep, totalSteps, onStepClick }: OnboardingProgressProps) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => {
        const isCompleted = step < currentStep;
        const isCurrent = step === currentStep;
        const isClickable = isCompleted && onStepClick;

        return (
          <button
            key={step}
            onClick={() => isClickable && onStepClick(step)}
            disabled={!isClickable}
            className={cn(
              "h-2.5 w-2.5 rounded-full border-2 border-retro-black transition-all duration-300",
              isCurrent && "scale-125 bg-retro-yellow",
              isCompleted && "bg-retro-black",
              !isCurrent && !isCompleted && "bg-transparent",
              isClickable && "cursor-pointer hover:scale-150 hover:ring-2 hover:ring-retro-blue hover:ring-offset-2",
              !isClickable && "cursor-default"
            )}
            title={isClickable ? `Go to step ${step}` : undefined}
            aria-label={`Step ${step}${isCurrent ? ' (current)' : isCompleted ? ' (completed)' : ''}`}
          />
        );
      })}
    </div>
  );
}
