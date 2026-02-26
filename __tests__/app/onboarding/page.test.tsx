import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// Hoisted mocks — accessible inside vi.mock factories
const { mockPush, mockUseQuery, mockUseMutation } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockUseQuery: vi.fn(),
  mockUseMutation: vi.fn(() => vi.fn()),
}));

// Stable references to distinguish useQuery calls
const { ONBOARDING_QUERY, LEGAL_QUERY } = vi.hoisted(() => ({
  ONBOARDING_QUERY: Symbol("getOnboardingState"),
  LEGAL_QUERY: Symbol("hasAcceptedLegalTerms"),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("convex/react", () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
  useMutation: () => mockUseMutation(),
}));

vi.mock("@/convex/_generated/api", () => ({
  api: {
    onboarding: {
      getOnboardingState: ONBOARDING_QUERY,
      startOnboarding: Symbol("startOnboarding"),
      goToStep: Symbol("goToStep"),
    },
    users: {
      hasAcceptedLegalTerms: LEGAL_QUERY,
    },
  },
}));

vi.mock("@/lib/hooks/use-store-user", () => ({
  useStoreUser: () => ({
    user: { id: "user_1" },
    isLoaded: true,
    isUserSynced: true,
  }),
}));

// Mock child components to isolate redirect logic
vi.mock("@/components/onboarding/onboarding-step-team", () => ({
  OnboardingStepTeam: () => <div data-testid="step-team">Team Step</div>,
}));
vi.mock("@/components/onboarding/onboarding-step-walkthrough", () => ({
  OnboardingStepWalkthrough: () => (
    <div data-testid="step-walkthrough">Walkthrough</div>
  ),
}));
vi.mock("@/components/onboarding/onboarding-step-project", () => ({
  OnboardingStepProject: () => (
    <div data-testid="step-project">Project Step</div>
  ),
}));
vi.mock("@/components/onboarding/onboarding-progress", () => ({
  OnboardingProgress: () => <div data-testid="progress">Progress</div>,
}));
vi.mock("@/components/auth/legal-acceptance-modal", () => ({
  LegalAcceptanceModal: () => <div data-testid="legal-modal">Legal Modal</div>,
}));

import OnboardingPage from "@/app/onboarding/page";

/**
 * Configure useQuery mock to return specific values based on which query is called.
 * Uses symbol references to distinguish getOnboardingState from hasAcceptedLegalTerms.
 */
function setupQueries(
  onboardingState: unknown,
  hasAcceptedTerms: unknown
): void {
  mockUseQuery.mockImplementation((queryFn: unknown, args: unknown) => {
    if (args === "skip") return undefined;
    if (queryFn === ONBOARDING_QUERY) return onboardingState;
    if (queryFn === LEGAL_QUERY) return hasAcceptedTerms;
    return undefined;
  });
}

describe("OnboardingPage", () => {
  describe("redirect guards", () => {
    it("redirects completed users to /dashboard", () => {
      setupQueries(
        {
          step: undefined,
          completedAt: 1234567890,
          isComplete: true,
          needsOnboarding: false,
          data: undefined,
        },
        true
      );

      render(<OnboardingPage />);

      expect(mockPush).toHaveBeenCalledWith("/dashboard");
      expect(screen.getByText("Redirecting...")).toBeDefined();
    });

    it("redirects step 4 users to /dashboard", () => {
      setupQueries(
        {
          step: 4,
          completedAt: undefined,
          isComplete: false,
          needsOnboarding: false,
          data: undefined,
        },
        true
      );

      render(<OnboardingPage />);

      expect(mockPush).toHaveBeenCalledWith("/dashboard");
      expect(screen.getByText("Redirecting...")).toBeDefined();
    });

    it("redirects step 7 users to /dashboard", () => {
      setupQueries(
        {
          step: 7,
          completedAt: undefined,
          isComplete: false,
          needsOnboarding: false,
          data: undefined,
        },
        true
      );

      render(<OnboardingPage />);

      expect(mockPush).toHaveBeenCalledWith("/dashboard");
      expect(screen.getByText("Redirecting...")).toBeDefined();
    });

    it("redirects to /sign-in when onboardingState is null (user not found)", () => {
      setupQueries(null, true);

      render(<OnboardingPage />);

      expect(mockPush).toHaveBeenCalledWith("/sign-in");
      expect(screen.getByText("Redirecting...")).toBeDefined();
    });
  });

  describe("loading states", () => {
    it("shows loading when onboardingState is undefined (still loading)", () => {
      setupQueries(undefined, undefined);

      render(<OnboardingPage />);

      expect(mockPush).not.toHaveBeenCalled();
      expect(screen.getByText("Loading...")).toBeDefined();
    });

    it("shows loading when only hasAcceptedTerms is undefined", () => {
      setupQueries(
        {
          step: 1,
          completedAt: undefined,
          isComplete: false,
          needsOnboarding: false,
          data: undefined,
        },
        undefined
      );

      render(<OnboardingPage />);

      expect(mockPush).not.toHaveBeenCalled();
      expect(screen.getByText("Loading...")).toBeDefined();
    });
  });

  describe("normal onboarding flow", () => {
    it("renders step 1 (team creation) for users in onboarding", () => {
      setupQueries(
        {
          step: 1,
          completedAt: undefined,
          isComplete: false,
          needsOnboarding: false,
          data: undefined,
        },
        true
      );

      render(<OnboardingPage />);

      expect(mockPush).not.toHaveBeenCalled();
      expect(screen.getByTestId("step-team")).toBeDefined();
    });

    it("renders step 2 (walkthrough) for users on that step", () => {
      setupQueries(
        {
          step: 2,
          completedAt: undefined,
          isComplete: false,
          needsOnboarding: false,
          data: undefined,
        },
        true
      );

      render(<OnboardingPage />);

      expect(mockPush).not.toHaveBeenCalled();
      expect(screen.getByTestId("step-walkthrough")).toBeDefined();
    });

    it("does not redirect step 3 users", () => {
      setupQueries(
        {
          step: 3,
          completedAt: undefined,
          isComplete: false,
          needsOnboarding: false,
          data: undefined,
        },
        true
      );

      render(<OnboardingPage />);

      expect(mockPush).not.toHaveBeenCalled();
    });
  });
});
