/**
 * Unit tests for Linear integration utilities
 * @see lib/integrations/linear.ts
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  mapPriorityToLinear,
  formatFeedbackForLinear,
} from "@/lib/integrations/linear";

// Mock the Linear SDK
vi.mock("@linear/sdk", () => {
  return {
    LinearClient: class MockLinearClient {
      private mockApiKey: string;

      constructor(config: { apiKey: string }) {
        this.mockApiKey = config.apiKey;
      }

      get viewer() {
        if (this.mockApiKey === "invalid-key") {
          return Promise.reject(new Error("Invalid API key"));
        }
        return Promise.resolve({
          organization: Promise.resolve({ name: "Test Org" }),
        });
      }

      teams() {
        return Promise.resolve({
          nodes: [
            { id: "team1", name: "Engineering", key: "ENG" },
            { id: "team2", name: "Design", key: "DES" },
          ],
        });
      }

      team(teamId: string) {
        return Promise.resolve({
          projects: () =>
            Promise.resolve({
              nodes: [
                { id: "proj1", name: "Project A", description: "Desc A" },
                { id: "proj2", name: "Project B", description: null },
              ],
            }),
          labels: () =>
            Promise.resolve({
              nodes: [
                { id: "label1", name: "Bug", color: "#ff0000" },
                { id: "label2", name: "Feature", color: "#00ff00" },
              ],
            }),
        });
      }

      createIssue(params: {
        teamId: string;
        title: string;
        description: string;
      }) {
        return Promise.resolve({
          issue: Promise.resolve({
            id: "issue123",
            identifier: "ENG-123",
            title: params.title,
            url: "https://linear.app/test/issue/ENG-123",
          }),
        });
      }
    },
  };
});

describe("Linear Integration Utilities", () => {
  describe("mapPriorityToLinear", () => {
    it("maps critical to 1 (Urgent)", () => {
      expect(mapPriorityToLinear("critical")).toBe(1);
    });

    it("maps high to 2 (High)", () => {
      expect(mapPriorityToLinear("high")).toBe(2);
    });

    it("maps medium to 3 (Normal)", () => {
      expect(mapPriorityToLinear("medium")).toBe(3);
    });

    it("maps low to 4 (Low)", () => {
      expect(mapPriorityToLinear("low")).toBe(4);
    });

    it("maps unknown to 0 (No priority)", () => {
      expect(mapPriorityToLinear("unknown")).toBe(0);
      expect(mapPriorityToLinear("")).toBe(0);
    });
  });

  describe("formatFeedbackForLinear", () => {
    const baseFeedback = {
      title: "Test Bug",
      description: "This is a test bug",
      type: "bug",
      priority: "high",
    };

    it("includes basic description", () => {
      const result = formatFeedbackForLinear(baseFeedback);
      expect(result).toContain("This is a test bug");
    });

    it("uses ticket draft description when available", () => {
      const feedback = {
        ...baseFeedback,
        ticketDraft: {
          description: "Enhanced description from AI",
        },
      };
      const result = formatFeedbackForLinear(feedback);
      expect(result).toContain("Enhanced description from AI");
      expect(result).not.toContain("This is a test bug");
    });

    it("includes reproduction steps from ticket draft", () => {
      const feedback = {
        ...baseFeedback,
        type: "bug",
        ticketDraft: {
          description: "Bug description",
          reproSteps: ["Step 1", "Step 2", "Step 3"],
        },
      };
      const result = formatFeedbackForLinear(feedback);
      expect(result).toContain("## Steps to Reproduce");
      expect(result).toContain("1. Step 1");
      expect(result).toContain("2. Step 2");
      expect(result).toContain("3. Step 3");
    });

    it("includes expected and actual behavior", () => {
      const feedback = {
        ...baseFeedback,
        ticketDraft: {
          description: "Bug description",
          expectedBehavior: "Should work correctly",
          actualBehavior: "Does not work",
        },
      };
      const result = formatFeedbackForLinear(feedback);
      expect(result).toContain("## Expected Behavior");
      expect(result).toContain("Should work correctly");
      expect(result).toContain("## Actual Behavior");
      expect(result).toContain("Does not work");
    });

    it("includes acceptance criteria as checkboxes", () => {
      const feedback = {
        ...baseFeedback,
        ticketDraft: {
          description: "Feature description",
          acceptanceCriteria: ["AC 1", "AC 2"],
        },
      };
      const result = formatFeedbackForLinear(feedback);
      expect(result).toContain("## Acceptance Criteria");
      expect(result).toContain("- [ ] AC 1");
      expect(result).toContain("- [ ] AC 2");
    });

    it("includes screenshot link", () => {
      const feedback = {
        ...baseFeedback,
        screenshotUrl: "https://example.com/screenshot.png",
      };
      const result = formatFeedbackForLinear(feedback);
      expect(result).toContain("## Screenshot");
      expect(result).toContain(
        "![Screenshot](https://example.com/screenshot.png)"
      );
    });

    it("includes recording link", () => {
      const feedback = {
        ...baseFeedback,
        recordingUrl: "https://example.com/recording.webm",
      };
      const result = formatFeedbackForLinear(feedback);
      expect(result).toContain("## Recording");
      expect(result).toContain(
        "[View Recording](https://example.com/recording.webm)"
      );
    });

    it("includes environment metadata", () => {
      const feedback = {
        ...baseFeedback,
        metadata: {
          url: "https://app.example.com/page",
          browser: "Chrome 120",
          os: "macOS 14",
          screenWidth: 1920,
          screenHeight: 1080,
        },
      };
      const result = formatFeedbackForLinear(feedback);
      expect(result).toContain("## Environment");
      expect(result).toContain("**URL:** https://app.example.com/page");
      expect(result).toContain("**Browser:** Chrome 120");
      expect(result).toContain("**OS:** macOS 14");
      expect(result).toContain("**Screen:** 1920x1080");
    });

    it("includes submitter information", () => {
      const feedback = {
        ...baseFeedback,
        submitterName: "John Doe",
        submitterEmail: "john@example.com",
      };
      const result = formatFeedbackForLinear(feedback);
      expect(result).toContain("## Submitted by");
      expect(result).toContain("**Name:** John Doe");
      expect(result).toContain("**Email:** john@example.com");
    });

    it("includes tags", () => {
      const feedback = {
        ...baseFeedback,
        tags: ["urgent", "mobile", "ios"],
      };
      const result = formatFeedbackForLinear(feedback);
      expect(result).toContain("## Tags");
      expect(result).toContain("`urgent`");
      expect(result).toContain("`mobile`");
      expect(result).toContain("`ios`");
    });

    it("includes FeedbackFlow attribution", () => {
      const result = formatFeedbackForLinear(baseFeedback);
      expect(result).toContain("Exported from [FeedbackFlow]");
    });

    it("handles feedback with no optional fields", () => {
      const feedback = {
        title: "Minimal Bug",
        type: "bug",
        priority: "medium",
      };
      const result = formatFeedbackForLinear(feedback);
      expect(result).toContain("Exported from [FeedbackFlow]");
      expect(result).not.toContain("## Screenshot");
      expect(result).not.toContain("## Recording");
      expect(result).not.toContain("## Environment");
    });
  });

  describe("testLinearConnection", () => {
    it("returns valid true for working API key", async () => {
      const { testLinearConnection } = await import(
        "@/lib/integrations/linear"
      );
      const result = await testLinearConnection("valid-key");

      expect(result.valid).toBe(true);
      expect(result.organization).toBe("Test Org");
    });

    it("returns valid false for invalid API key", async () => {
      const { testLinearConnection } = await import(
        "@/lib/integrations/linear"
      );
      const result = await testLinearConnection("invalid-key");

      expect(result.valid).toBe(false);
      expect(result.error).toBe("Invalid API key");
    });
  });

  describe("getLinearTeams", () => {
    it("returns list of teams", async () => {
      const { getLinearTeams } = await import("@/lib/integrations/linear");
      const teams = await getLinearTeams("valid-key");

      expect(teams).toHaveLength(2);
      expect(teams[0]).toEqual({
        id: "team1",
        name: "Engineering",
        key: "ENG",
      });
    });
  });

  describe("getLinearProjects", () => {
    it("returns list of projects for a team", async () => {
      const { getLinearProjects } = await import("@/lib/integrations/linear");
      const projects = await getLinearProjects("valid-key", "team1");

      expect(projects).toHaveLength(2);
      expect(projects[0]).toEqual({
        id: "proj1",
        name: "Project A",
        description: "Desc A",
      });
      expect(projects[1].description).toBeUndefined();
    });
  });

  describe("getLinearLabels", () => {
    it("returns list of labels for a team", async () => {
      const { getLinearLabels } = await import("@/lib/integrations/linear");
      const labels = await getLinearLabels("valid-key", "team1");

      expect(labels).toHaveLength(2);
      expect(labels[0]).toEqual({
        id: "label1",
        name: "Bug",
        color: "#ff0000",
      });
    });
  });

  describe("createLinearIssue", () => {
    it("creates issue and returns result", async () => {
      const { createLinearIssue } = await import("@/lib/integrations/linear");
      const issue = await createLinearIssue("valid-key", {
        teamId: "team1",
        title: "Test Issue",
        description: "Test description",
      });

      expect(issue.id).toBe("issue123");
      expect(issue.identifier).toBe("ENG-123");
      expect(issue.title).toBe("Test Issue");
      expect(issue.url).toBe("https://linear.app/test/issue/ENG-123");
    });
  });
});
