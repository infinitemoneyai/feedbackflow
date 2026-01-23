"use client";

import { useStoreUser } from "@/lib/hooks/use-store-user";
import { useQuery } from "convex/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/convex/_generated/api";
import { OnboardingModal } from "@/components/onboarding/onboarding-modal";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoaded, isUserSynced } = useStoreUser();
  const router = useRouter();
  const pathname = usePathname();
  const [hasRedirected, setHasRedirected] = useState(false);

  // Get onboarding state - only query after user is synced to Convex
  const onboardingState = useQuery(
    api.onboarding.getOnboardingState,
    user && isUserSynced ? {} : "skip"
  );

  // Get user's team and project for onboarding modal
  const teams = useQuery(api.teams.getMyTeams, user && isUserSynced ? {} : "skip");
  const projects = useQuery(
    api.projects.getProjects,
    teams && teams.length > 0 && teams[0]?._id ? { teamId: teams[0]._id } : "skip"
  );
  const widgets = useQuery(
    api.projects.getWidgets,
    projects && projects.length > 0 && projects[0]?._id ? { projectId: projects[0]._id } : "skip"
  );

  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/sign-in");
    }
  }, [isLoaded, user, router]);

  // Redirect to onboarding if needed (steps 1-3 or needs onboarding)
  useEffect(() => {
    // Wait for user to be synced and onboarding state to load
    if (!isUserSynced || onboardingState === undefined) return;
    
    // If onboardingState is null, user record doesn't exist yet - redirect to onboarding
    // This handles the case where the query runs before upsertUser completes
    if (onboardingState === null) {
      if (pathname !== "/onboarding" && !hasRedirected) {
        setHasRedirected(true);
        router.push("/onboarding");
      }
      return;
    }

    const step = onboardingState.step;
    const isComplete = onboardingState.isComplete;
    const needsOnboarding = onboardingState.needsOnboarding;

    // Redirect to onboarding if:
    // 1. User needs onboarding (never started, no completedAt)
    // 2. User is in steps 1-3
    if (needsOnboarding || (!isComplete && step !== undefined && step >= 1 && step <= 3)) {
      if (pathname !== "/onboarding" && !hasRedirected) {
        setHasRedirected(true);
        router.push("/onboarding");
      }
    }
  }, [onboardingState, pathname, router, isUserSynced, hasRedirected]);

  // Reset redirect flag when pathname changes (user navigated elsewhere)
  useEffect(() => {
    setHasRedirected(false);
  }, [pathname]);

  // Show loading while checking auth or syncing user
  if (!isLoaded || (user && !isUserSynced)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-retro-paper">
        <div className="animate-pulse font-mono text-sm text-stone-500">
          Loading...
        </div>
      </div>
    );
  }

  // Prepare data for onboarding modal (steps 4-7)
  const shouldShowModal =
    onboardingState &&
    !onboardingState.isComplete &&
    onboardingState.step &&
    onboardingState.step >= 4 &&
    onboardingState.step <= 7;

  const teamId = teams?.[0]?._id;
  const projectId = projects?.[0]?._id;
  const widgetKey = widgets?.[0]?.widgetKey;

  // User is authenticated, render children with optional onboarding modal
  return (
    <>
      {children}
      {shouldShowModal && teamId && projectId && widgetKey && (
        <OnboardingModal teamId={teamId} projectId={projectId} widgetKey={widgetKey} />
      )}
    </>
  );
}
