"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useOnboardingFlow } from "@/lib/hooks/use-onboarding-flow";
import { OnboardingStepTeam } from "@/components/onboarding/onboarding-step-team";
import { OnboardingStepWalkthrough } from "@/components/onboarding/onboarding-step-walkthrough";
import { OnboardingStepProject } from "@/components/onboarding/onboarding-step-project";
import { OnboardingProgress } from "@/components/onboarding/onboarding-progress";
import { LegalAcceptanceModal } from "@/components/auth/legal-acceptance-modal";
import { Id } from "@/convex/_generated/dataModel";

/**
 * Content-shaped skeleton for the onboarding screen: progress dots plus a
 * step-card placeholder (house rule: never a bare spinner).
 */
function OnboardingSkeleton(): ReactNode {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center p-4"
      role="status"
      aria-label="Loading onboarding"
      data-testid="onboarding-skeleton"
    >
      <div className="flex items-center gap-2">
        {Array.from({ length: 7 }, (_, index) => (
          <div
            key={index}
            className="h-2.5 w-2.5 animate-pulse rounded-full bg-stone-200"
          />
        ))}
      </div>
      <div className="mt-8 w-full max-w-lg border-2 border-stone-200 bg-white p-8">
        <div className="h-7 w-56 animate-pulse rounded bg-stone-200" />
        <div className="mt-3 h-4 w-72 animate-pulse rounded bg-stone-100" />
        <div className="mt-6 h-12 w-full animate-pulse rounded bg-stone-100" />
        <div className="mt-4 h-12 w-full animate-pulse rounded bg-stone-100" />
      </div>
    </div>
  );
}

export default function OnboardingPage(): ReactNode {
  const router = useRouter();
  const flow = useOnboardingFlow();
  const [teamId, setTeamId] = useState<Id<"teams"> | null>(null);

  const redirectTo = flow.status === "redirect" ? flow.to : null;
  useEffect(() => {
    if (redirectTo) {
      router.replace(redirectTo);
    }
  }, [redirectTo, router]);

  if (flow.status === "loading" || flow.status === "redirect") {
    return <OnboardingSkeleton />;
  }

  if (flow.status === "legal") {
    return <LegalAcceptanceModal onAccept={flow.onAccept} />;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <OnboardingProgress
        currentStep={flow.step}
        totalSteps={7}
        onStepClick={flow.onStepClick}
      />

      <div className="mt-8 w-full max-w-lg">
        {flow.step === 1 && (
          <OnboardingStepTeam onComplete={(id) => setTeamId(id)} />
        )}
        {flow.step === 2 && <OnboardingStepWalkthrough />}
        {flow.step === 3 && teamId && <OnboardingStepProject teamId={teamId} />}
      </div>
    </div>
  );
}
