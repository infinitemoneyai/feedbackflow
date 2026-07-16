"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useStoreUser } from "@/lib/hooks/use-store-user";

const TERMS_VERSION = "2026-01-26";
const PRIVACY_VERSION = "2026-01-26";

export type OnboardingFlowState =
  | { status: "loading" }
  | { status: "redirect"; to: string }
  | { status: "legal"; onAccept: () => void }
  | {
      status: "ready";
      step: number;
      onStepClick: (targetStep: number) => Promise<void>;
    };

/**
 * Owns the onboarding page's ordered guard sequence (auth → Convex user sync
 * → queries → legal terms → onboarding state) and reduces it to a single
 * discriminated state the page renders from.
 *
 * Guard ORDER is load-bearing — preserved verbatim from the original page:
 * 1. Auth loaded but signed out                    → redirect "/sign-in"
 * 2. Auth loading, or Clerk→Convex sync pending    → loading
 *    (both queries stay "skip" until isUserSynced — new-user race guard)
 * 3. Onboarding/legal queries still loading        → loading
 * 4. User record missing in Convex (query null)    → redirect "/sign-in"
 * 5. Onboarding complete or step >= 4              → redirect "/dashboard"
 * 6. Legal terms not yet accepted                  → legal (acceptance modal)
 * 7. Otherwise                                     → ready at step ?? 1
 *
 * Side effects owned here: starting onboarding for never-started users —
 * but only after they have accepted the legal terms.
 */
export function useOnboardingFlow(): OnboardingFlowState {
  const { user, isLoaded, isUserSynced } = useStoreUser();

  // Only query onboarding state after the user is synced to Convex
  const onboardingState = useQuery(
    api.onboarding.getOnboardingState,
    user && isUserSynced ? {} : "skip"
  );
  const hasAcceptedTerms = useQuery(
    api.users.hasAcceptedLegalTerms,
    user && isUserSynced
      ? {
          requiredTermsVersion: TERMS_VERSION,
          requiredPrivacyVersion: PRIVACY_VERSION,
        }
      : "skip"
  );
  const startOnboarding = useMutation(api.onboarding.startOnboarding);
  const goToStep = useMutation(api.onboarding.goToStep);

  // Closes the legal gate immediately on accept; Convex reactivity then
  // re-delivers hasAcceptedTerms as true once the mutation lands.
  const [legalAccepted, setLegalAccepted] = useState(false);

  useEffect(() => {
    // Start onboarding if the user needs it (never started, no completedAt).
    // Only start once they've accepted legal terms.
    if (onboardingState?.needsOnboarding && hasAcceptedTerms) {
      startOnboarding();
    }
  }, [onboardingState, hasAcceptedTerms, startOnboarding]);

  // 1. Auth loaded but signed out → sign-in
  if (isLoaded && !user) {
    return { status: "redirect", to: "/sign-in" };
  }

  // 2. Auth still loading, or user still syncing to Convex
  if (!isLoaded || (user && !isUserSynced)) {
    return { status: "loading" };
  }

  // 3. Onboarding state / legal terms queries still loading
  if (onboardingState === undefined || hasAcceptedTerms === undefined) {
    return { status: "loading" };
  }

  // 4. User record not found in Convex → sign-in
  if (onboardingState === null) {
    return { status: "redirect", to: "/sign-in" };
  }

  // 5. Already onboarded → dashboard (before step components can render)
  if (
    onboardingState.isComplete ||
    (onboardingState.step && onboardingState.step >= 4)
  ) {
    return { status: "redirect", to: "/dashboard" };
  }

  // 6. Legal acceptance gate
  if (hasAcceptedTerms === false && !legalAccepted) {
    return { status: "legal", onAccept: () => setLegalAccepted(true) };
  }

  // 7. Ready — render the flow at the current step
  return {
    status: "ready",
    step: onboardingState.step ?? 1,
    onStepClick: async (targetStep: number): Promise<void> => {
      await goToStep({ step: targetStep });
    },
  };
}
