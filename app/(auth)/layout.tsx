"use client";

import { useStoreUser } from "@/lib/hooks/use-store-user";
import { useQuery } from "convex/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { api } from "@/convex/_generated/api";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoaded } = useStoreUser();
  const router = useRouter();
  const pathname = usePathname();

  // Get onboarding state (skip if no user)
  const onboardingState = useQuery(
    api.onboarding.getOnboardingState,
    user ? {} : "skip"
  );

  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/sign-in");
    }
  }, [isLoaded, user, router]);

  // Redirect to onboarding if needed (steps 1-3)
  useEffect(() => {
    if (!onboardingState) return;

    const step = onboardingState.step;
    const isComplete = onboardingState.isComplete;

    // If onboarding is in steps 1-3 and we're not on /onboarding, redirect
    if (!isComplete && step !== undefined && step >= 1 && step <= 3) {
      if (pathname !== "/onboarding") {
        router.push("/onboarding");
      }
    }
  }, [onboardingState, pathname, router]);

  // Show loading while checking auth
  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-retro-paper">
        <div className="animate-pulse font-mono text-sm text-stone-500">
          Loading...
        </div>
      </div>
    );
  }

  // User is authenticated, render children
  return <>{children}</>;
}
