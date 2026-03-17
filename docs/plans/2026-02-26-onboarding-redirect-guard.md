# Onboarding Redirect Guard Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Prevent already-onboarded users from getting stuck on the `/onboarding` page by adding an early return guard before step components render.

**Architecture:** Add an `isComplete` check that returns a redirecting/loading state before any `OnboardingStep*` components mount. This prevents crashes from step components receiving invalid state for completed users. Also handle the edge case where `onboardingState === null` (user record not found) to prevent infinite loading.

**Tech Stack:** Next.js App Router, Convex (useQuery), React, Vitest + @testing-library/react

---

### Task 1: Add early-return guard in onboarding page

**Files:**
- Modify: `app/onboarding/page.tsx:83-97`

**Context:** Currently, the loading guard at line 84 passes `onboardingState` through if it's any truthy value (including `{ isComplete: true }`). The redirect fires in a `useEffect` (line 65-72), but the component still renders step components on the same tick — `OnboardingStepTeam` likely crashes because the user already has a team.

**Step 1: Add isComplete guard after the loading checks**

In `app/onboarding/page.tsx`, insert a new guard block between the existing loading guard (line 84-90) and the legal modal check (line 92-95). This catches completed users BEFORE any step components render:

```typescript
// --- EXISTING CODE (lines 83-90) - do not change ---
// Show loading while onboarding state is loading
if (!onboardingState || hasAcceptedTerms === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse font-mono text-sm text-stone-500">Loading...</div>
      </div>
    );
  }

// --- INSERT THIS BLOCK ---
// Redirect already-onboarded users to dashboard immediately
// This prevents step components from rendering for completed users
if (onboardingState.isComplete || (onboardingState.step && onboardingState.step >= 4)) {
    router.push("/dashboard");
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse font-mono text-sm text-stone-500">Redirecting...</div>
      </div>
    );
  }

// --- EXISTING CODE continues (line 92+) ---
```

**Step 2: Commit**

```bash
git add app/onboarding/page.tsx
git commit -m "fix: redirect already-onboarded users away from /onboarding page"
```

---

### Task 2: Remove redundant useEffect redirect

**Files:**
- Modify: `app/onboarding/page.tsx:65-72`

**Context:** The `useEffect` redirect at lines 65-72 is now redundant — the early return guard handles both `isComplete` and `step >= 4` cases synchronously. Removing it simplifies the component and eliminates a potential source of double-navigation.

**Step 1: Remove the useEffect**

Delete this entire block from `app/onboarding/page.tsx`:

```typescript
  useEffect(() => {
    // Redirect to dashboard if onboarding complete or on step 4+
    if (onboardingState?.isComplete) {
      router.push("/dashboard");
    } else if (onboardingState?.step && onboardingState.step >= 4) {
      router.push("/dashboard");
    }
  }, [onboardingState, router]);
```

**Step 2: Commit**

```bash
git add app/onboarding/page.tsx
git commit -m "refactor: remove redundant onboarding redirect useEffect"
```

---

### Task 3: Handle onboardingState === null (user record not found)

**Files:**
- Modify: `app/onboarding/page.tsx:83-90`

**Context:** When `getOnboardingState` returns `null` (user record doesn't exist in Convex), `!onboardingState` is `true` and the page shows "Loading..." forever. This can happen if `useStoreUser`'s upsert fails silently. Add an explicit null check that redirects to `/sign-in` instead of loading forever.

**Step 1: Split the loading guard to handle null explicitly**

Replace the existing loading guard with two separate checks — one for `undefined` (still loading) and one for `null` (user not found):

```typescript
  // Show loading while onboarding state is loading
  if (onboardingState === undefined || hasAcceptedTerms === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse font-mono text-sm text-stone-500">Loading...</div>
      </div>
    );
  }

  // If user record not found in Convex, redirect to sign-in
  if (onboardingState === null) {
    router.push("/sign-in");
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse font-mono text-sm text-stone-500">Redirecting...</div>
      </div>
    );
  }
```

**Step 2: Commit**

```bash
git add app/onboarding/page.tsx
git commit -m "fix: handle null onboarding state instead of loading forever"
```

---

### Task 4: Add unit tests for onboarding page redirect logic

**Files:**
- Create: `__tests__/app/onboarding/page.test.tsx`

**Context:** Test all 6 onboarding states to verify the guard redirects correctly. Uses Vitest + @testing-library/react with mocked Convex queries and Next.js router. Tests go in `__tests__/` per project convention. Test environment is `happy-dom`.

**Step 1: Write the test file**

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock convex/react
const mockUseQuery = vi.fn();
const mockUseMutation = vi.fn(() => vi.fn());
vi.mock("convex/react", () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
  useMutation: () => mockUseMutation(),
}));

// Mock useStoreUser
vi.mock("@/lib/hooks/use-store-user", () => ({
  useStoreUser: () => ({ user: { id: "user_1" }, isLoaded: true, isUserSynced: true }),
}));

// Mock child components to avoid rendering their internals
vi.mock("@/components/onboarding/onboarding-step-team", () => ({
  OnboardingStepTeam: () => <div data-testid="step-team">Team Step</div>,
}));
vi.mock("@/components/onboarding/onboarding-step-walkthrough", () => ({
  OnboardingStepWalkthrough: () => <div data-testid="step-walkthrough">Walkthrough Step</div>,
}));
vi.mock("@/components/onboarding/onboarding-step-project", () => ({
  OnboardingStepProject: () => <div data-testid="step-project">Project Step</div>,
}));
vi.mock("@/components/onboarding/onboarding-progress", () => ({
  OnboardingProgress: () => <div data-testid="progress">Progress</div>,
}));
vi.mock("@/components/auth/legal-acceptance-modal", () => ({
  LegalAcceptanceModal: () => <div data-testid="legal-modal">Legal Modal</div>,
}));

import OnboardingPage from "@/app/onboarding/page";

// Helper to configure mock return values for useQuery calls
function setupMocks(onboardingState: unknown, hasAcceptedTerms: unknown) {
  mockUseQuery.mockImplementation((queryFn: unknown, args: unknown) => {
    if (args === "skip") return undefined;
    // Distinguish between the two queries by checking the function reference
    // The first call is getOnboardingState, the second is hasAcceptedLegalTerms
    const callCount = mockUseQuery.mock.calls.length;
    const isLegalQuery = mockUseQuery.mock.calls
      .filter((c: unknown[]) => c[1] !== "skip")
      .length % 2 === 0;
    // Since we can't easily distinguish by function ref in mocks,
    // use call order: odd calls = onboardingState, even calls = hasAcceptedTerms
    // This works because React re-renders call hooks in the same order
    if (isLegalQuery) return hasAcceptedTerms;
    return onboardingState;
  });
}

describe("OnboardingPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects completed users to /dashboard", () => {
    const completedState = {
      step: undefined,
      completedAt: 1234567890,
      isComplete: true,
      needsOnboarding: false,
      data: undefined,
    };
    // Mock useQuery to return appropriate values based on call order
    let callIndex = 0;
    mockUseQuery.mockImplementation((_fn: unknown, args: unknown) => {
      if (args === "skip") return undefined;
      callIndex++;
      // Odd calls = onboardingState, even calls = hasAcceptedTerms
      return callIndex % 2 === 1 ? completedState : true;
    });

    render(<OnboardingPage />);

    expect(mockPush).toHaveBeenCalledWith("/dashboard");
    expect(screen.getByText("Redirecting...")).toBeDefined();
  });

  it("redirects step 4+ users to /dashboard", () => {
    const step5State = {
      step: 5,
      completedAt: undefined,
      isComplete: false,
      needsOnboarding: false,
      data: undefined,
    };
    let callIndex = 0;
    mockUseQuery.mockImplementation((_fn: unknown, args: unknown) => {
      if (args === "skip") return undefined;
      callIndex++;
      return callIndex % 2 === 1 ? step5State : true;
    });

    render(<OnboardingPage />);

    expect(mockPush).toHaveBeenCalledWith("/dashboard");
    expect(screen.getByText("Redirecting...")).toBeDefined();
  });

  it("redirects to /sign-in when onboardingState is null", () => {
    let callIndex = 0;
    mockUseQuery.mockImplementation((_fn: unknown, args: unknown) => {
      if (args === "skip") return undefined;
      callIndex++;
      return callIndex % 2 === 1 ? null : true;
    });

    render(<OnboardingPage />);

    expect(mockPush).toHaveBeenCalledWith("/sign-in");
    expect(screen.getByText("Redirecting...")).toBeDefined();
  });

  it("shows loading when onboardingState is undefined", () => {
    mockUseQuery.mockReturnValue(undefined);

    render(<OnboardingPage />);

    expect(mockPush).not.toHaveBeenCalled();
    expect(screen.getByText("Loading...")).toBeDefined();
  });

  it("renders step 1 for new users who need onboarding", () => {
    const needsOnboardingState = {
      step: 1,
      completedAt: undefined,
      isComplete: false,
      needsOnboarding: false,
      data: undefined,
    };
    let callIndex = 0;
    mockUseQuery.mockImplementation((_fn: unknown, args: unknown) => {
      if (args === "skip") return undefined;
      callIndex++;
      return callIndex % 2 === 1 ? needsOnboardingState : true;
    });

    render(<OnboardingPage />);

    expect(mockPush).not.toHaveBeenCalled();
    expect(screen.getByTestId("step-team")).toBeDefined();
  });

  it("renders step 2 for users on walkthrough", () => {
    const step2State = {
      step: 2,
      completedAt: undefined,
      isComplete: false,
      needsOnboarding: false,
      data: undefined,
    };
    let callIndex = 0;
    mockUseQuery.mockImplementation((_fn: unknown, args: unknown) => {
      if (args === "skip") return undefined;
      callIndex++;
      return callIndex % 2 === 1 ? step2State : true;
    });

    render(<OnboardingPage />);

    expect(mockPush).not.toHaveBeenCalled();
    expect(screen.getByTestId("step-walkthrough")).toBeDefined();
  });
});
```

**Step 2: Run the tests**

Run: `npm run test -- __tests__/app/onboarding/page.test.tsx`
Expected: All 6 tests pass

**Step 3: Commit**

```bash
git add __tests__/app/onboarding/page.test.tsx
git commit -m "test: add unit tests for onboarding page redirect guards"
```

---

### Task 5: Verify full flow end-to-end

**No files to modify — verification only.**

**Step 1: Typecheck**

Run: `npx tsc --noEmit`
Expected: No type errors

**Step 2: Run all tests**

Run: `npm run test`
Expected: All tests pass

**Step 3: Manual test as onboarded user**

1. Sign in as existing onboarded user
2. Navigate directly to `/onboarding` in the browser
3. Expected: Brief "Redirecting..." flash, then lands on `/dashboard`
4. Should NOT see onboarding step UI or error boundary

**Step 4: Manual test as new user**

1. Sign out, create new account via "Get Started"
2. Expected: Normal onboarding flow (legal modal → step 1 → step 2 → step 3 → dashboard modal for steps 4-7)
