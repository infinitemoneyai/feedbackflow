import { test as base, expect, Page } from "@playwright/test";

/**
 * Extended test fixtures for FeedbackFlow E2E tests
 *
 * Since we use Clerk for authentication, we mock the auth state
 * rather than going through actual OAuth flows in E2E tests.
 */

// Mock user data for tests
export const mockUser = {
  id: "user_test_12345",
  email: "test@feedbackflow.cc",
  firstName: "Test",
  lastName: "User",
  fullName: "Test User",
  imageUrl: "",
};

// Mock team data
export const mockTeam = {
  id: "team_test_12345",
  name: "Test Team",
  slug: "test-team",
};

// Mock project data
export const mockProject = {
  id: "project_test_12345",
  name: "Test Project",
  description: "A test project for E2E testing",
};

// Mock widget data
export const mockWidget = {
  id: "widget_test_12345",
  widgetKey: "wk_test_12345",
  siteUrl: "https://example.com",
};

// Mock feedback data
export const mockFeedback = {
  id: "feedback_test_12345",
  title: "Test Bug Report",
  description: "This is a test bug description",
  type: "bug" as const,
  status: "new" as const,
  priority: "medium" as const,
};

/**
 * Custom fixture to handle authentication mocking
 */
export interface TestFixtures {
  authenticatedPage: Page;
  mockConvexData: () => Promise<void>;
}

/**
 * Extended test with custom fixtures
 */
export const test = base.extend<TestFixtures>({
  /**
   * Provides a page with mocked authentication
   * Uses route interception to mock Clerk and Convex responses
   */
  authenticatedPage: async ({ page }, use) => {
    // Mock Clerk auth state via localStorage and cookies
    await page.addInitScript(() => {
      // Mock Clerk session in localStorage (simplified mock)
      window.localStorage.setItem(
        "__clerk_client_jwt",
        JSON.stringify({
          jwt: "mock_jwt_token",
          expires: Date.now() + 3600000,
        })
      );
    });

    // Mock Clerk API responses
    await page.route("**/clerk.accounts.dev/**", async (route) => {
      const url = route.request().url();

      if (url.includes("/v1/client")) {
        // Mock client session response
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            response: {
              sessions: [
                {
                  id: "sess_test_12345",
                  status: "active",
                  user: mockUser,
                },
              ],
              sign_in: null,
              sign_up: null,
            },
          }),
        });
      } else if (url.includes("/v1/me")) {
        // Mock user info response
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            response: mockUser,
          }),
        });
      } else {
        // Pass through other requests
        await route.continue();
      }
    });

    await use(page);
  },

  /**
   * Mock Convex data for consistent test state
   */
  mockConvexData: async ({ page }, use) => {
    const setupMocks = async () => {
      // Mock Convex WebSocket connection
      // Convex uses WebSocket for real-time data, but we can mock HTTP fallback
      await page.route("**/convex.cloud/**", async (route) => {
        const url = route.request().url();

        // Allow actual Convex connections in integration tests
        // For true E2E, you'd typically use a test database
        if (process.env.PLAYWRIGHT_MOCK_CONVEX === "true") {
          // Mock query responses based on function name
          const body = route.request().postDataJSON?.();
          const functionName = body?.path || "";

          if (functionName.includes("teams.getMyTeams")) {
            await route.fulfill({
              status: 200,
              contentType: "application/json",
              body: JSON.stringify({
                value: [mockTeam],
                status: "success",
              }),
            });
          } else if (functionName.includes("projects.getProjects")) {
            await route.fulfill({
              status: 200,
              contentType: "application/json",
              body: JSON.stringify({
                value: [mockProject],
                status: "success",
              }),
            });
          } else {
            await route.continue();
          }
        } else {
          await route.continue();
        }
      });
    };

    await use(setupMocks);
  },
});

export { expect };

/**
 * Helper function to wait for page hydration
 */
export async function waitForHydration(page: Page): Promise<void> {
  // Wait for Next.js hydration by checking for absence of loading states
  await page.waitForLoadState("networkidle");

  // Additional wait for React hydration
  await page.evaluate(() => {
    return new Promise<void>((resolve) => {
      if (document.readyState === "complete") {
        resolve();
      } else {
        window.addEventListener("load", () => resolve());
      }
    });
  });
}

/**
 * Helper function to simulate auth bypass for testing
 * This can be used with test-specific middleware
 */
export async function bypassAuth(page: Page): Promise<void> {
  // Set test mode cookie that middleware can check
  await page.context().addCookies([
    {
      name: "__test_bypass_auth",
      value: "true",
      domain: "localhost",
      path: "/",
    },
  ]);
}

/**
 * Helper to generate unique test data
 */
export function generateTestId(): string {
  return `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Helper to fill form fields
 */
export async function fillForm(
  page: Page,
  fields: Record<string, string>
): Promise<void> {
  for (const [selector, value] of Object.entries(fields)) {
    await page.fill(selector, value);
  }
}

/**
 * Helper to check for toast notifications
 */
export async function expectToast(
  page: Page,
  message: string,
  type: "success" | "error" = "success"
): Promise<void> {
  // Wait for toast to appear
  const toastSelector =
    type === "success" ? '[data-testid="toast-success"]' : '[data-testid="toast-error"]';

  // Since we don't know exact toast implementation, check for text
  await expect(page.getByText(message)).toBeVisible({ timeout: 10000 });
}
