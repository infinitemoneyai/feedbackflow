"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { OnboardingProgress } from "./onboarding-progress";
import { OnboardingStepInstall } from "./onboarding-step-install";
import { OnboardingStepVerify } from "./onboarding-step-verify";
import { OnboardingStepInvite } from "./onboarding-step-invite";
import { OnboardingStepUpgrade } from "./onboarding-step-upgrade";
import { cn } from "@/lib/utils";
import { Id } from "@/convex/_generated/dataModel";

interface OnboardingModalProps {
  teamId: Id<"teams">;
  projectId: Id<"projects">;
  widgetKey: string;
}

export function OnboardingModal({ teamId, projectId, widgetKey }: OnboardingModalProps) {
  const onboardingState = useQuery(api.onboarding.getOnboardingState);
  const goToStep = useMutation(api.onboarding.goToStep);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleStepClick = async (targetStep: number) => {
    await goToStep({ step: targetStep });
  };

  if (!onboardingState || onboardingState.isComplete) {
    return null;
  }

  const step = onboardingState.step ?? 4;

  // Only show modal for steps 4-7
  if (step < 4 || step > 7) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-300",
          isVisible ? "opacity-100" : "opacity-0"
        )}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className={cn(
            "w-full max-w-xl transform transition-all duration-300",
            isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"
          )}
        >
          {/* Progress */}
          <div className="mb-4 flex justify-center">
            <OnboardingProgress 
              currentStep={step} 
              totalSteps={7} 
              onStepClick={handleStepClick}
            />
          </div>

          {/* Content */}
          <div className="border-2 border-retro-black bg-white shadow-[8px_8px_0px_0px_rgba(26,26,26,1)]">
            {step === 4 && <OnboardingStepInstall widgetKey={widgetKey} projectId={projectId} />}
            {step === 5 && <OnboardingStepVerify projectId={projectId} />}
            {step === 6 && <OnboardingStepInvite teamId={teamId} />}
            {step === 7 && <OnboardingStepUpgrade />}
          </div>
        </div>
      </div>
    </>
  );
}
