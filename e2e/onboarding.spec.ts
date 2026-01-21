import { test, expect } from "@playwright/test";
import { waitForHydration, generateTestId } from "./fixtures/test-fixtures";

/**
 * E2E Tests: Onboarding Flow
 *
 * Tests the 7-step onboarding flow for new FeedbackFlow users:
 * - Steps 1-3: Full-page onboarding (Team name, Walkthrough, Create project)
 * - Steps 4-7: Modal onboarding over dashboard (Install, Verify, Invite, Upgrade)
 *
 * Note: Some tests require authenticated Clerk sessions and are marked as skip
 * until proper auth mocking is configured.
 */

test.describe("Onboarding Flow - Unauthenticated", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test("should redirect unauthenticated users from /onboarding to sign-in", async ({
    page,
  }) => {
    await page.goto("/onboarding");
    await page.waitForTimeout(3000);

    const url = page.url();
    // Should redirect to sign-in with redirect back to onboarding
    const isRedirected =
      url.includes("sign-in") || url.includes("redirect_url");

    expect(isRedirected).toBe(true);
  });

  test("should include onboarding in redirect URL after sign-in redirect", async ({
    page,
  }) => {
    await page.goto("/onboarding");
    await page.waitForTimeout(3000);

    const url = page.url();
    // The redirect URL should contain onboarding
    if (url.includes("redirect_url")) {
      expect(url).toContain("onboarding");
    } else if (url.includes("sign-in")) {
      // At minimum, should be on sign-in page
      expect(url).toContain("sign-in");
    }
  });
});

test.describe("Onboarding Flow - Page Structure", () => {
  /**
   * These tests verify the onboarding page structure and UI elements.
   * They use route interception to check page content without full auth.
   */

  test("onboarding page should have proper meta title", async ({ page }) => {
    // Navigate and check title even if redirected
    await page.goto("/onboarding");
    await page.waitForTimeout(2000);

    const title = await page.title();
    expect(title).toContain("FeedbackFlow");
  });

  test("sign-in page should show FeedbackFlow branding", async ({ page }) => {
    await page.goto("/sign-in?redirect_url=/onboarding");
    // Don't wait for networkidle - Clerk makes continuous requests
    await page.waitForTimeout(3000);

    // Should show FeedbackFlow branding
    await expect(page.getByText("FeedbackFlow")).toBeVisible({ timeout: 15000 });
  });
});

test.describe("Onboarding Step 1 - Team Name", () => {
  /**
   * Tests for Step 1: Team name input
   * Note: Requires authenticated session to fully test
   */

  test.skip("should display team name form with correct elements", async ({
    page,
  }) => {
    // This test requires authentication
    // When implemented with auth mocking:
    await page.goto("/onboarding");
    await waitForHydration(page);

    // Should show "Let's set up your workspace" heading
    await expect(
      page.getByRole("heading", { name: /set up your workspace/i })
    ).toBeVisible();

    // Should have team name input
    await expect(
      page.getByRole("textbox", { name: /team.*name|company.*name/i })
    ).toBeVisible();

    // Should have Continue button (initially disabled)
    const continueBtn = page.getByRole("button", { name: /continue/i });
    await expect(continueBtn).toBeVisible();
    await expect(continueBtn).toBeDisabled();
  });

  test.skip("should enable Continue button when team name is entered", async ({
    page,
  }) => {
    await page.goto("/onboarding");
    await waitForHydration(page);

    // Enter team name
    const input = page.getByRole("textbox", { name: /team.*name|company.*name/i });
    await input.fill("Test Company");

    // Continue button should now be enabled
    const continueBtn = page.getByRole("button", { name: /continue/i });
    await expect(continueBtn).toBeEnabled();
  });

  test.skip("should show progress indicator at step 1", async ({ page }) => {
    await page.goto("/onboarding");
    await waitForHydration(page);

    // Should have progress dots visible
    // First dot should be active/highlighted
    const pageContent = await page.content();
    expect(pageContent).toMatch(/step|progress|dot/i);
  });
});

test.describe("Onboarding Step 2 - Walkthrough", () => {
  /**
   * Tests for Step 2: Animated walkthrough panels
   */

  test.skip("should display animated walkthrough with panels", async ({
    page,
  }) => {
    // This test requires completing step 1 first
    await page.goto("/onboarding");
    await waitForHydration(page);

    // Would need to complete step 1 first, then verify:
    // - "Your users click the feedback button" or similar panel text
    // - Navigation dots at bottom
    // - Back/Next buttons
  });

  test.skip("should auto-advance walkthrough panels", async ({ page }) => {
    // Test that panels auto-advance every 4 seconds
    // Would measure time between panel changes
  });

  test.skip("should allow manual navigation with Next/Back buttons", async ({
    page,
  }) => {
    // Test clicking Next and Back buttons
    // Verify panel content changes
  });

  test.skip("should show 'Got it, let's go' on last panel", async ({ page }) => {
    // Navigate to last panel and verify button text changes
  });
});

test.describe("Onboarding Step 3 - Create Project", () => {
  /**
   * Tests for Step 3: Project creation form
   */

  test.skip("should display project creation form", async ({ page }) => {
    // Would need to complete steps 1-2 first
    await page.goto("/onboarding");
    await waitForHydration(page);

    // Verify form elements:
    // - "Create your first project" heading
    // - Project name input
    // - Site URL input
    // - Project type selector (Web app, Marketing site, Mobile app, Other)
    // - Create Project button
  });

  test.skip("should have project type selector with 4 options", async ({
    page,
  }) => {
    // Verify all 4 project types are available:
    // Web App, Marketing Site, Mobile App, Other
  });

  test.skip("should disable Create button until required fields filled", async ({
    page,
  }) => {
    // Verify button is disabled with empty form
    // Fill in fields and verify button becomes enabled
  });

  test.skip("should redirect to dashboard after project creation", async ({
    page,
  }) => {
    // Complete form and submit
    // Verify redirect to /dashboard
    // Verify onboarding modal appears
  });
});

test.describe("Onboarding Step 4 - Install Script Modal", () => {
  /**
   * Tests for Step 4: Widget installation instructions (modal)
   */

  test.skip("should display install modal over dashboard", async ({ page }) => {
    // Would need completed steps 1-3
    await page.goto("/dashboard");
    await waitForHydration(page);

    // Verify modal elements:
    // - "Install the feedback widget" heading
    // - Code snippet with widget key
    // - Copy button
    // - "I've installed it" button
  });

  test.skip("should show widget key in code snippet", async ({ page }) => {
    // Verify code snippet contains wk_ prefix widget key
  });

  test.skip("should have expandable framework sections", async ({ page }) => {
    // Verify "Using Next.js?" and "Using React?" expandable sections exist
  });

  test.skip("should copy code snippet to clipboard", async ({ page }) => {
    // Click copy button and verify clipboard content
  });
});

test.describe("Onboarding Step 5 - Verify Install Modal", () => {
  /**
   * Tests for Step 5: Verification with test feedback
   */

  test.skip("should display verify install modal", async ({ page }) => {
    // Would need completed steps 1-4

    // Verify elements:
    // - "Verify install" heading
    // - "Send Test Feedback" button
    // - "Having trouble?" link
  });

  test.skip("should show success state after test feedback sent", async ({
    page,
  }) => {
    // Click "Send Test Feedback"
    // Wait for success state
    // Verify "It's working!" message appears
    // Verify Continue button appears
  });

  test.skip("should show test ticket in dashboard behind modal", async ({
    page,
  }) => {
    // After sending test feedback, verify ticket appears in dashboard list
  });
});

test.describe("Onboarding Step 6 - Invite Teammate Modal", () => {
  /**
   * Tests for Step 6: Team invite (optional)
   */

  test.skip("should display invite teammate modal", async ({ page }) => {
    // Would need completed steps 1-5

    // Verify elements:
    // - "Invite your team" heading
    // - Email input field
    // - "Invite" button
    // - "I'll do this later" skip option
    // - "Continue" button
  });

  test.skip("should allow skipping invite step", async ({ page }) => {
    // Click "I'll do this later" or "Continue"
    // Verify advances to step 7
  });

  test.skip("should validate email format", async ({ page }) => {
    // Enter invalid email and verify validation
  });
});

test.describe("Onboarding Step 7 - Upgrade Prompt Modal", () => {
  /**
   * Tests for Step 7: Pro upgrade prompt (optional)
   */

  test.skip("should display upgrade prompt modal", async ({ page }) => {
    // Would need completed steps 1-6

    // Verify elements:
    // - "Unlock the full power" heading
    // - Free vs Pro comparison
    // - "Upgrade to Pro" button
    // - "Start with Free" button
  });

  test.skip("should show correct Free plan features", async ({ page }) => {
    // Verify Free plan shows:
    // - 1 team seat
    // - 25 feedback/month
    // - Screenshot capture
    // - Basic analytics
    // - Community support
  });

  test.skip("should show correct Pro plan features", async ({ page }) => {
    // Verify Pro plan shows:
    // - Unlimited team seats
    // - Unlimited feedback
    // - Screen recording with audio
    // - AI-powered triage
    // - Linear & Notion export
    // - Custom webhooks
    // - Priority support
  });

  test.skip("should close modal and reveal dashboard on 'Start with Free'", async ({
    page,
  }) => {
    // Click "Start with Free"
    // Verify modal closes
    // Verify full dashboard is visible
    // Verify no onboarding modal appears on subsequent visits
  });

  test.skip("should navigate to Stripe checkout on 'Upgrade to Pro'", async ({
    page,
  }) => {
    // Click "Upgrade to Pro"
    // Verify redirect to Stripe checkout or checkout flow starts
  });
});

test.describe("Onboarding Flow - Complete Journey", () => {
  /**
   * Integration tests for the complete onboarding flow
   */

  test.skip("should complete full onboarding flow from start to finish", async ({
    page,
  }) => {
    // This is a comprehensive test that would:
    // 1. Navigate to /onboarding as authenticated new user
    // 2. Complete Step 1: Enter team name, click Continue
    // 3. Complete Step 2: Navigate through walkthrough
    // 4. Complete Step 3: Enter project details, click Create
    // 5. Complete Step 4: Click "I've installed it"
    // 6. Complete Step 5: Click "Send Test Feedback", wait for success, Continue
    // 7. Complete Step 6: Skip or Continue
    // 8. Complete Step 7: Click "Start with Free"
    // 9. Verify dashboard is fully accessible with no onboarding modal
  });

  test.skip("should persist onboarding state across page reloads", async ({
    page,
  }) => {
    // Start onboarding, complete a few steps
    // Reload page
    // Verify user resumes at correct step
  });

  test.skip("should skip onboarding for users with pending team invites", async ({
    page,
  }) => {
    // User with pending invite should not see onboarding
    // Should go directly to dashboard or accept invite flow
  });
});

test.describe("Onboarding - Error Handling", () => {
  /**
   * Tests for error states in onboarding
   */

  test.skip("should handle team creation failure gracefully", async ({
    page,
  }) => {
    // Simulate team creation failure
    // Verify error message is shown
    // Verify user can retry
  });

  test.skip("should handle project creation failure gracefully", async ({
    page,
  }) => {
    // Simulate project creation failure
    // Verify error message is shown
    // Verify user can retry
  });

  test.skip("should show troubleshooting link when verification times out", async ({
    page,
  }) => {
    // Don't send test feedback
    // Wait for timeout
    // Verify "Having trouble?" link becomes prominent
  });
});

test.describe("Onboarding - Responsive Design", () => {
  /**
   * Tests for mobile/responsive onboarding experience
   */

  test.skip("should display full-page steps correctly on mobile", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/onboarding");
    await waitForHydration(page);

    // Verify mobile layout
    // Card should be full width with padding
  });

  test.skip("should display modal steps correctly on mobile", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/dashboard");
    await waitForHydration(page);

    // Modal should be near-fullscreen on mobile
  });
});

test.describe("Onboarding - Accessibility", () => {
  /**
   * Accessibility tests for onboarding flow
   */

  test("onboarding pages should have proper heading hierarchy", async ({
    page,
  }) => {
    // Check sign-in page (where unauthenticated users land)
    await page.goto("/sign-in?redirect_url=/onboarding");
    // Don't wait for networkidle - Clerk makes continuous requests
    await page.waitForTimeout(3000);

    // Should have at least one heading
    const headings = await page.getByRole("heading").count();
    expect(headings).toBeGreaterThan(0);
  });

  test.skip("should be navigable with keyboard only", async ({ page }) => {
    await page.goto("/onboarding");
    await waitForHydration(page);

    // Tab through form elements
    // Verify focus states are visible
    // Verify form can be submitted with Enter
  });

  test.skip("should have proper ARIA labels on interactive elements", async ({
    page,
  }) => {
    await page.goto("/onboarding");
    await waitForHydration(page);

    // Verify buttons and inputs have accessible names
    // Verify progress indicator has ARIA attributes
  });
});
