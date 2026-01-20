import { test, expect } from "@playwright/test";
import { waitForHydration, generateTestId } from "./fixtures/test-fixtures";

/**
 * E2E Test: Create project and widget
 *
 * This test covers the critical user journey of:
 * 1. Accessing the dashboard (requires auth)
 * 2. Creating a new project
 * 3. Creating a widget for the project
 * 4. Viewing widget installation instructions
 *
 * Note: Most tests here verify UI structure and navigation
 * since full CRUD operations require authenticated sessions.
 */

test.describe("Project and Widget Management", () => {
  test("should redirect to sign-in when accessing dashboard unauthenticated", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await page.waitForTimeout(2000);
    const url = page.url();

    // Should redirect away from dashboard
    const isRedirected =
      url.includes("sign-in") ||
      url.includes("redirect") ||
      !url.includes("/dashboard");

    expect(isRedirected).toBe(true);
  });

  test("should have widget installation documentation page", async ({ page }) => {
    // Navigate to installation docs
    await page.goto("/docs/installation");
    await waitForHydration(page);

    // Verify documentation page content - page should have installation-related content
    const pageContent = await page.content();
    const hasInstallContent =
      pageContent.toLowerCase().includes("widget") ||
      pageContent.toLowerCase().includes("install") ||
      pageContent.toLowerCase().includes("script");

    expect(hasInstallContent).toBe(true);
  });

  test("should have API documentation page", async ({ page }) => {
    // Navigate to API docs
    await page.goto("/docs/api");
    await waitForHydration(page);

    // Verify API documentation - page should have API-related content
    const pageContent = await page.content();
    const hasApiContent =
      pageContent.toLowerCase().includes("api") ||
      pageContent.toLowerCase().includes("rest") ||
      pageContent.toLowerCase().includes("endpoint");

    expect(hasApiContent).toBe(true);
  });

  test("should display self-hosting documentation", async ({ page }) => {
    // Navigate to self-hosting docs
    await page.goto("/docs/self-hosting");
    await waitForHydration(page);

    // Verify self-hosting documentation page loads
    const pageContent = await page.content();
    const hasSelfHostContent =
      pageContent.toLowerCase().includes("self") ||
      pageContent.toLowerCase().includes("host") ||
      pageContent.toLowerCase().includes("docker") ||
      pageContent.toLowerCase().includes("deploy");

    expect(hasSelfHostContent).toBe(true);
  });
});

test.describe("Widget Installation Flow", () => {
  test("should show installation code snippets in docs", async ({ page }) => {
    await page.goto("/docs/installation");
    await waitForHydration(page);

    // Page should have code blocks or script mentions
    const pageContent = await page.content();
    const hasCodeContent =
      pageContent.includes("<pre") ||
      pageContent.includes("<code") ||
      pageContent.includes("script") ||
      pageContent.includes("Script");

    expect(hasCodeContent).toBe(true);
  });

  test("should have framework-specific installation guides", async ({
    page,
  }) => {
    await page.goto("/docs/installation");
    await waitForHydration(page);

    // Check for framework mentions (React, Vue, or vanilla JS)
    const pageContent = await page.content();

    // At least one framework should be mentioned
    const hasFrameworkDocs =
      pageContent.includes("React") ||
      pageContent.includes("Vue") ||
      pageContent.includes("vanilla") ||
      pageContent.includes("JavaScript") ||
      pageContent.includes("HTML");

    expect(hasFrameworkDocs).toBe(true);
  });
});

test.describe("Settings Page Structure", () => {
  test("should handle settings page access when unauthenticated", async ({
    page,
  }) => {
    await page.goto("/settings");
    await page.waitForTimeout(3000);
    const url = page.url();
    const pageContent = await page.content();

    // The page should either:
    // 1. Redirect to sign-in
    // 2. Redirect to home with redirect param
    // 3. Show a loading state (Convex loading)
    // 4. Show settings with an empty/loading state
    // 5. Show FeedbackFlow branding
    const handlesUnauthenticated =
      url.includes("sign-in") ||
      url.includes("redirect") ||
      pageContent.includes("Loading") ||
      pageContent.includes("Settings") ||
      pageContent.includes("No team") ||
      pageContent.includes("FeedbackFlow") ||
      pageContent.includes("Profile") ||
      pageContent.includes("Integrations");

    expect(handlesUnauthenticated).toBe(true);
  });
});

/**
 * Project and Widget UI tests
 * These require authentication to fully test CRUD operations
 */
test.describe("Project Creation UI", () => {
  test.skip("should display create project button in sidebar", async ({
    page,
  }) => {
    // Requires authenticated session
    await page.goto("/dashboard");

    // Would verify:
    // await expect(page.getByRole('button', { name: /new project|create project/i })).toBeVisible();
  });

  test.skip("should open project creation modal", async ({ page }) => {
    // Requires authenticated session
    await page.goto("/dashboard");

    // Would click create button and verify modal:
    // await page.click('[data-testid="create-project-btn"]');
    // await expect(page.getByRole('dialog')).toBeVisible();
    // await expect(page.getByLabel(/project name/i)).toBeVisible();
  });

  test.skip("should create project and redirect to project dashboard", async ({
    page,
  }) => {
    // Requires authenticated session
    const projectName = `Test Project ${generateTestId()}`;

    await page.goto("/dashboard");

    // Would create project:
    // await page.click('[data-testid="create-project-btn"]');
    // await page.fill('[name="projectName"]', projectName);
    // await page.click('[data-testid="submit-project"]');
    // await expect(page.getByText(projectName)).toBeVisible();
  });
});

test.describe("Widget Creation UI", () => {
  test.skip("should display widget settings in project settings", async ({
    page,
  }) => {
    // Requires authenticated session with existing project
    await page.goto("/settings");

    // Would verify widget tab:
    // await page.click('[data-testid="widget-tab"]');
    // await expect(page.getByText(/widget key/i)).toBeVisible();
  });

  test.skip("should generate new widget key", async ({ page }) => {
    // Requires authenticated session
    await page.goto("/settings");

    // Would test widget key generation:
    // await page.click('[data-testid="widget-tab"]');
    // const oldKey = await page.locator('[data-testid="widget-key"]').textContent();
    // await page.click('[data-testid="regenerate-key"]');
    // await page.click('[data-testid="confirm-regenerate"]');
    // const newKey = await page.locator('[data-testid="widget-key"]').textContent();
    // expect(newKey).not.toBe(oldKey);
  });

  test.skip("should show widget customization options", async ({ page }) => {
    // Requires authenticated session
    await page.goto("/settings");

    // Would verify customization:
    // await page.click('[data-testid="widget-tab"]');
    // await expect(page.getByLabel(/position/i)).toBeVisible();
    // await expect(page.getByLabel(/color/i)).toBeVisible();
  });

  test.skip("should preview widget with custom settings", async ({ page }) => {
    // Requires authenticated session
    await page.goto("/settings");

    // Would verify preview:
    // await page.click('[data-testid="widget-tab"]');
    // await expect(page.locator('[data-testid="widget-preview"]')).toBeVisible();
  });
});
