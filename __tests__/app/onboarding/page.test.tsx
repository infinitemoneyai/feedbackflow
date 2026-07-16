/**
 * Tests for the onboarding page at its single seam: useOnboardingFlow.
 *
 * Mock surface is exactly two modules — lib/hooks/use-onboarding-flow and
 * next/navigation. Child step components render for real (wrapped in a
 * ConvexProvider so their useMutation hooks mount); no generated-api Symbol
 * mocks, no convex/react mock, no child-component stubs.
 *
 * @see app/onboarding/page.tsx
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import OnboardingPage from "@/app/onboarding/page";
import type { OnboardingFlowState } from "@/lib/hooks/use-onboarding-flow";

const { mockUseOnboardingFlow, mockReplace } = vi.hoisted(() => ({
  mockUseOnboardingFlow: vi.fn(),
  mockReplace: vi.fn(),
}));

vi.mock("@/lib/hooks/use-onboarding-flow", () => ({
  useOnboardingFlow: () => mockUseOnboardingFlow(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

// Real client (never connects — no subscriptions or mutation calls fire)
// so the real child components' useMutation hooks can mount.
const convex = new ConvexReactClient("https://test.convex.cloud");

function renderPage(state: OnboardingFlowState) {
  mockUseOnboardingFlow.mockReturnValue(state);
  return render(
    <ConvexProvider client={convex}>
      <OnboardingPage />
    </ConvexProvider>
  );
}

describe("OnboardingPage", () => {
  describe("loading", () => {
    it("renders the content-shaped skeleton and does not redirect", () => {
      renderPage({ status: "loading" });

      expect(screen.getByTestId("onboarding-skeleton")).toBeDefined();
      expect(mockReplace).not.toHaveBeenCalled();
    });
  });

  describe("redirect", () => {
    it("fires router.replace to the dashboard and shows the skeleton meanwhile", () => {
      renderPage({ status: "redirect", to: "/dashboard" });

      expect(mockReplace).toHaveBeenCalledWith("/dashboard");
      expect(screen.getByTestId("onboarding-skeleton")).toBeDefined();
    });

    it("fires router.replace to sign-in", () => {
      renderPage({ status: "redirect", to: "/sign-in" });

      expect(mockReplace).toHaveBeenCalledWith("/sign-in");
    });
  });

  describe("legal gate", () => {
    it("renders the legal acceptance modal", () => {
      renderPage({ status: "legal", onAccept: vi.fn() });

      expect(screen.getByText("Accept Legal Terms")).toBeDefined();
      expect(mockReplace).not.toHaveBeenCalled();
    });
  });

  describe("ready", () => {
    it("renders the progress dots and the team step at step 1", () => {
      renderPage({
        status: "ready",
        step: 1,
        onStepClick: vi.fn(async () => {}),
      });

      expect(mockReplace).not.toHaveBeenCalled();
      // 7 progress dots render as buttons
      expect(screen.getAllByRole("button").length).toBeGreaterThanOrEqual(7);
      expect(
        screen.getByText("Let's set up your workspace")
      ).toBeDefined();
    });

    it("renders no skeleton once ready", () => {
      renderPage({
        status: "ready",
        step: 1,
        onStepClick: vi.fn(async () => {}),
      });

      expect(screen.queryByTestId("onboarding-skeleton")).toBeNull();
    });
  });
});
