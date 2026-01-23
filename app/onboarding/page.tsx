"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { useStoreUser } from "@/lib/hooks/use-store-user";
import { OnboardingStepTeam } from "@/components/onboarding/onboarding-step-team";
import { OnboardingStepWalkthrough } from "@/components/onboarding/onboarding-step-walkthrough";
import { OnboardingStepProject } from "@/components/onboarding/onboarding-step-project";
import { OnboardingProgress } from "@/components/onboarding/onboarding-progress";
import { Id } from "@/convex/_generated/dataModel";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isLoaded, isUserSynced } = useStoreUser();
  
  // Only query onboarding state after user is synced to Convex
  const onboardingState = useQuery(
    api.onboarding.getOnboardingState,
    user && isUserSynced ? {} : "skip"
  );
  const startOnboarding = useMutation(api.onboarding.startOnboarding);
  const goToStep = useMutation(api.onboarding.goToStep);

  const [teamId, setTeamId] = useState<Id<"teams"> | null>(null);

  const handleStepClick = async (targetStep: number) => {
    await goToStep({ step: targetStep });
  };

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/sign-in");
    }
  }, [isLoaded, user, router]);

  useEffect(() => {
    // Start onboarding if user needs it (never started, no completedAt)
    if (onboardingState?.needsOnboarding) {
      startOnboarding();
    }
  }, [onboardingState, startOnboarding]);

  useEffect(() => {
    // Redirect to dashboard if onboarding complete or on step 4+
    if (onboardingState?.isComplete) {
      router.push("/dashboard");
    } else if (onboardingState?.step && onboardingState.step >= 4) {
      router.push("/dashboard");
    }
  }, [onboardingState, router]);

  // Show loading while auth is loading or user is syncing
  if (!isLoaded || (user && !isUserSynced)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse font-mono text-sm text-stone-500">Loading...</div>
      </div>
    );
  }

  // Show loading while onboarding state is loading
  if (!onboardingState) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse font-mono text-sm text-stone-500">Loading...</div>
      </div>
    );
  }

  const currentStep = onboardingState.step ?? 1;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <OnboardingProgress 
        currentStep={currentStep} 
        totalSteps={7} 
        onStepClick={handleStepClick}
      />

      <div className="mt-8 w-full max-w-lg">
        {currentStep === 1 && (
          <OnboardingStepTeam onComplete={(id) => setTeamId(id)} />
        )}
        {currentStep === 2 && <OnboardingStepWalkthrough />}
        {currentStep === 3 && teamId && (
          <OnboardingStepProject teamId={teamId} />
        )}
      </div>
    </div>
  );
}
