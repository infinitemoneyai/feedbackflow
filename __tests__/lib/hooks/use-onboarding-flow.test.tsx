/**
 * Tests for the onboarding guard-sequence hook at its interface.
 *
 * Mocks exactly two seams — convex/react and use-store-user — and asserts
 * the discriminated state machine plus the load-bearing guard ORDER:
 * signed-out → sync gate → query loading → missing user → dashboard
 * redirect → legal gate → ready.
 *
 * @see lib/hooks/use-onboarding-flow.ts
 */

import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { getFunctionName } from "convex/server";
import { useOnboardingFlow } from "@/lib/hooks/use-onboarding-flow";

const { mockUseQuery, mockUseMutation, mockUseStoreUser } = vi.hoisted(() => ({
  mockUseQuery: vi.fn(),
  mockUseMutation: vi.fn(),
  mockUseStoreUser: vi.fn(),
}));

vi.mock("convex/react", () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
  useMutation: (...args: unknown[]) => mockUseMutation(...args),
}));

vi.mock("@/lib/hooks/use-store-user", () => ({
  useStoreUser: () => mockUseStoreUser(),
}));

// Real generated function references flow through the hook; the mocks
// dispatch on their canonical names instead of Symbol stand-ins.
const ONBOARDING_QUERY = "onboarding:getOnboardingState";
const TERMS_QUERY = "users:hasAcceptedLegalTerms";
const START_ONBOARDING = "onboarding:startOnboarding";

const mockStartOnboarding = vi.fn();
const mockGoToStep = vi.fn();

interface OnboardingStateFixture {
  step: number | undefined;
  completedAt: number | undefined;
  isComplete: boolean;
  needsOnboarding: boolean;
  data: undefined;
}

function onboardingState(
  partial: Partial<OnboardingStateFixture> = {}
): OnboardingStateFixture {
  return {
    step: undefined,
    completedAt: undefined,
    isComplete: false,
    needsOnboarding: false,
    data: undefined,
    ...partial,
  };
}

interface SetupOptions {
  user?: { id: string } | null;
  isLoaded?: boolean;
  isUserSynced?: boolean;
  onboarding?: OnboardingStateFixture | null | undefined;
  hasAcceptedTerms?: boolean | undefined;
}

function configureMocks({
  user = { id: "user_1" },
  isLoaded = true,
  isUserSynced = true,
  onboarding = undefined,
  hasAcceptedTerms = undefined,
}: SetupOptions): void {
  mockUseStoreUser.mockReturnValue({ user, isLoaded, isUserSynced });
  mockUseQuery.mockImplementation((ref: never, args: unknown) => {
    if (args === "skip") return undefined;
    const name = getFunctionName(ref);
    if (name === ONBOARDING_QUERY) return onboarding;
    if (name === TERMS_QUERY) return hasAcceptedTerms;
    return undefined;
  });
  mockUseMutation.mockImplementation((ref: never) =>
    getFunctionName(ref) === START_ONBOARDING
      ? mockStartOnboarding
      : mockGoToStep
  );
}

function setup(options: SetupOptions = {}) {
  configureMocks(options);
  return renderHook(() => useOnboardingFlow());
}

describe("useOnboardingFlow", () => {
  describe("auth and sync guards", () => {
    it("returns loading while auth is still loading", () => {
      const { result } = setup({ user: null, isLoaded: false });

      expect(result.current).toEqual({ status: "loading" });
    });

    it("redirects to /sign-in when auth is loaded and there is no user", () => {
      const { result } = setup({ user: null, isLoaded: true });

      expect(result.current).toEqual({ status: "redirect", to: "/sign-in" });
    });

    it("returns loading and skips both queries until the user is synced to Convex", () => {
      const { result } = setup({
        isUserSynced: false,
        onboarding: onboardingState({ step: 1 }),
        hasAcceptedTerms: true,
      });

      expect(result.current).toEqual({ status: "loading" });
      // The "skip"-until-synced gating: every useQuery call must pass "skip"
      expect(mockUseQuery).toHaveBeenCalled();
      for (const call of mockUseQuery.mock.calls) {
        expect(call[1]).toBe("skip");
      }
    });
  });

  describe("query loading guards", () => {
    it("returns loading while both queries are unresolved", () => {
      const { result } = setup({
        onboarding: undefined,
        hasAcceptedTerms: undefined,
      });

      expect(result.current).toEqual({ status: "loading" });
    });

    it("returns loading while only the terms query is unresolved, even if onboarding state loaded", () => {
      const { result } = setup({
        onboarding: onboardingState({ step: 1 }),
        hasAcceptedTerms: undefined,
      });

      expect(result.current).toEqual({ status: "loading" });
    });
  });

  describe("redirect matrix", () => {
    it("redirects to /sign-in when the Convex user record is missing (null state)", () => {
      const { result } = setup({ onboarding: null, hasAcceptedTerms: true });

      expect(result.current).toEqual({ status: "redirect", to: "/sign-in" });
    });

    it("redirects completed users to /dashboard", () => {
      const { result } = setup({
        onboarding: onboardingState({ isComplete: true, completedAt: 123 }),
        hasAcceptedTerms: true,
      });

      expect(result.current).toEqual({ status: "redirect", to: "/dashboard" });
    });

    it("redirects step >= 4 users to /dashboard", () => {
      for (const step of [4, 7]) {
        const { result } = setup({
          onboarding: onboardingState({ step }),
          hasAcceptedTerms: true,
        });

        expect(result.current).toEqual({
          status: "redirect",
          to: "/dashboard",
        });
      }
    });
  });

  describe("legal terms gate", () => {
    it("returns the legal gate instead of ready when terms are pending and onboarding is incomplete", () => {
      const { result } = setup({
        onboarding: onboardingState({ step: 1 }),
        hasAcceptedTerms: false,
      });

      expect(result.current).toMatchObject({ status: "legal" });
    });

    it("dashboard redirect wins over pending terms (guard order)", () => {
      const { result } = setup({
        onboarding: onboardingState({ isComplete: true, completedAt: 123 }),
        hasAcceptedTerms: false,
      });

      expect(result.current).toEqual({ status: "redirect", to: "/dashboard" });
    });

    it("does not start onboarding for never-started users until terms are accepted", () => {
      setup({
        onboarding: onboardingState({ needsOnboarding: true }),
        hasAcceptedTerms: false,
      });

      expect(mockStartOnboarding).not.toHaveBeenCalled();
    });

    it("closes the gate immediately on accept, without starting onboarding until terms confirm", () => {
      const { result } = setup({
        onboarding: onboardingState({ needsOnboarding: true }),
        hasAcceptedTerms: false,
      });
      const state = result.current;
      if (state.status !== "legal") {
        throw new Error(`expected legal, got ${state.status}`);
      }

      act(() => state.onAccept());

      expect(result.current).toMatchObject({ status: "ready", step: 1 });
      // startOnboarding still gated on the server-confirmed terms value
      expect(mockStartOnboarding).not.toHaveBeenCalled();
    });

    it("becomes ready once the terms query flips to accepted", () => {
      const view = setup({
        onboarding: onboardingState({ step: 1 }),
        hasAcceptedTerms: false,
      });
      expect(view.result.current).toMatchObject({ status: "legal" });

      // User accepts; Convex reactivity re-delivers the terms query as true
      configureMocks({
        onboarding: onboardingState({ step: 1 }),
        hasAcceptedTerms: true,
      });
      view.rerender();

      expect(view.result.current).toMatchObject({ status: "ready", step: 1 });
    });
  });

  describe("ready state", () => {
    it("is ready at the current step when terms are accepted and onboarding is in progress", () => {
      const { result } = setup({
        onboarding: onboardingState({ step: 2 }),
        hasAcceptedTerms: true,
      });

      expect(result.current).toMatchObject({ status: "ready", step: 2 });
    });

    it("defaults to step 1 and starts onboarding for never-started users with accepted terms", () => {
      const { result } = setup({
        onboarding: onboardingState({ needsOnboarding: true }),
        hasAcceptedTerms: true,
      });

      expect(result.current).toMatchObject({ status: "ready", step: 1 });
      expect(mockStartOnboarding).toHaveBeenCalledTimes(1);
    });

    it("proxies onStepClick to the goToStep mutation", async () => {
      const { result } = setup({
        onboarding: onboardingState({ step: 3 }),
        hasAcceptedTerms: true,
      });
      const state = result.current;
      if (state.status !== "ready") {
        throw new Error(`expected ready, got ${state.status}`);
      }

      await act(async () => {
        await state.onStepClick(2);
      });

      expect(mockGoToStep).toHaveBeenCalledWith({ step: 2 });
    });
  });
});
