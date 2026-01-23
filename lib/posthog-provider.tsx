"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider, usePostHog } from "posthog-js/react";
import { useEffect, ReactNode } from "react";
import { useUser } from "@clerk/nextjs";

// Initialize PostHog only if configured
const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const posthogHost =
  process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

// Track if PostHog has been initialized
let posthogInitialized = false;

function initPostHog() {
  if (
    typeof window === "undefined" ||
    posthogInitialized ||
    !posthogKey ||
    posthogKey === "disabled"
  ) {
    return;
  }

  posthog.init(posthogKey, {
    // Use reverse proxy to avoid ad blockers
    api_host: "/ingest",
    ui_host: posthogHost,
    // Use recommended defaults for Next.js
    defaults: "2025-11-30",
    // Enable exception capture for error tracking
    capture_exceptions: true,
    // Respect Do Not Track browser setting
    respect_dnt: true,
    // Capture pageviews automatically
    capture_pageview: true,
    // Capture pageleaves for session duration
    capture_pageleave: true,
    // Disable session recording by default (privacy-first)
    disable_session_recording: true,
    // Mask all text in session recordings if enabled
    session_recording: {
      maskAllInputs: true,
      maskTextSelector: "*",
    },
    // Persistence - use localStorage, not cookies
    persistence: "localStorage",
    // Don't track until user opts in (for GDPR compliance)
    // Set to false if you want opt-out model instead
    opt_out_capturing_by_default: false,
    // Disable automatic capturing of clicks/inputs for privacy
    autocapture: false,
    // Load feature flags
    bootstrap: {
      featureFlags: {},
    },
  });

  posthogInitialized = true;
}

/**
 * Identifies the current user in PostHog
 * Called automatically when user signs in
 */
function PostHogUserIdentifier() {
  const { user, isSignedIn } = useUser();
  const ph = usePostHog();

  useEffect(() => {
    if (!ph || !posthogKey || posthogKey === "disabled") return;

    if (isSignedIn && user) {
      // Identify user with minimal PII
      ph.identify(user.id, {
        // Only include non-sensitive data
        created_at: user.createdAt?.toISOString(),
        // Hash email domain for aggregate analytics without exposing email
        email_domain: user.primaryEmailAddress?.emailAddress?.split("@")[1],
      });
    } else {
      // Reset identity on sign out
      ph.reset();
    }
  }, [ph, user, isSignedIn]);

  return null;
}

interface PostHogProviderProps {
  children: ReactNode;
}

export function PostHogProvider({ children }: PostHogProviderProps) {
  useEffect(() => {
    initPostHog();
  }, []);

  // If PostHog is not configured, just render children
  if (!posthogKey || posthogKey === "disabled") {
    return <>{children}</>;
  }

  return (
    <PHProvider client={posthog}>
      <PostHogUserIdentifier />
      {children}
    </PHProvider>
  );
}

// =============================================================================
// Analytics Event Helpers
// =============================================================================

/**
 * Track a custom event
 * Use this for important user actions
 */
export function trackEvent(
  eventName: string,
  properties?: Record<string, unknown>
) {
  if (!posthogKey || posthogKey === "disabled") return;
  posthog.capture(eventName, properties);
}

/**
 * Track page view (usually automatic, but can be called manually for SPAs)
 */
export function trackPageView(url?: string) {
  if (!posthogKey || posthogKey === "disabled") return;
  posthog.capture("$pageview", url ? { $current_url: url } : undefined);
}

// =============================================================================
// Pre-defined Events for FeedbackFlow
// =============================================================================

export const Analytics = {
  // Onboarding events
  onboardingStarted: () => trackEvent("onboarding_started"),
  onboardingStepCompleted: (step: string) =>
    trackEvent("onboarding_step_completed", { step }),
  onboardingCompleted: () => trackEvent("onboarding_completed"),
  onboardingSkipped: (step: string) =>
    trackEvent("onboarding_skipped", { step }),

  // Team events
  teamCreated: () => trackEvent("team_created"),
  teamMemberInvited: () => trackEvent("team_member_invited"),

  // Project events
  projectCreated: (projectType?: string) =>
    trackEvent("project_created", projectType ? { project_type: projectType } : undefined),
  projectDeleted: () => trackEvent("project_deleted"),

  // Widget events
  widgetInstalled: () => trackEvent("widget_installed"),
  widgetConfigured: () => trackEvent("widget_configured"),

  // Feedback events
  feedbackReceived: (type: "bug" | "feature" | "general") =>
    trackEvent("feedback_received", { type }),
  feedbackViewed: () => trackEvent("feedback_viewed"),
  feedbackStatusChanged: (status: string) =>
    trackEvent("feedback_status_changed", { status }),
  feedbackExported: (destination: string) =>
    trackEvent("feedback_exported", { destination }),

  // Integration events
  integrationConnected: (integration: string) =>
    trackEvent("integration_connected", { integration }),
  integrationDisconnected: (integration: string) =>
    trackEvent("integration_disconnected", { integration }),

  // AI events
  aiAnalysisRun: () => trackEvent("ai_analysis_run"),
  aiSuggestionAccepted: () => trackEvent("ai_suggestion_accepted"),
  aiSuggestionRejected: () => trackEvent("ai_suggestion_rejected"),

  // Billing events
  subscriptionStarted: (plan: string) =>
    trackEvent("subscription_started", { plan }),
  subscriptionCancelled: () => trackEvent("subscription_cancelled"),
  subscriptionUpgraded: (from: string, to: string) =>
    trackEvent("subscription_upgraded", { from_plan: from, to_plan: to }),

  // Feature usage
  featureUsed: (feature: string) => trackEvent("feature_used", { feature }),
} as const;

// =============================================================================
// Feature Flags
// =============================================================================

/**
 * Check if a feature flag is enabled
 */
export function isFeatureEnabled(flagKey: string): boolean {
  if (!posthogKey || posthogKey === "disabled") return false;
  return posthog.isFeatureEnabled(flagKey) ?? false;
}

/**
 * Get feature flag value (for multivariate flags)
 */
export function getFeatureFlag(flagKey: string): string | boolean | undefined {
  if (!posthogKey || posthogKey === "disabled") return undefined;
  return posthog.getFeatureFlag(flagKey);
}

// =============================================================================
// Consent Management
// =============================================================================

/**
 * Opt user into analytics tracking
 */
export function optInAnalytics() {
  if (!posthogKey || posthogKey === "disabled") return;
  posthog.opt_in_capturing();
}

/**
 * Opt user out of analytics tracking
 */
export function optOutAnalytics() {
  if (!posthogKey || posthogKey === "disabled") return;
  posthog.opt_out_capturing();
}

/**
 * Check if user has opted out
 */
export function hasOptedOut(): boolean {
  if (!posthogKey || posthogKey === "disabled") return true;
  return posthog.has_opted_out_capturing();
}
