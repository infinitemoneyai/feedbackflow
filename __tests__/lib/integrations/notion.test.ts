/**
 * Unit tests for Notion integration utilities
 * @see lib/integrations/notion.ts
 */

import { describe, it, expect, vi } from "vitest";
import {
  mapPriorityToNotion,
  formatFeedbackForNotion,
} from "@/lib/integrations/notion";

// Mock the Notion SDK
vi.mock("@notionhq/client", () => {
  return {
    Client: class MockNotionClient {
      private mockApiKey: string;

      constructor(config: { auth: string }) {
        this.mockApiKey = config.auth;
      }

      users = {
        me: () => {
          if (this.mockApiKey === "invalid-key") {
            return Promise.reject(new Error("Invalid API key"));
          }
          return Promise.resolve({
            name: "FeedbackFlow Bot",
            type: "bot",
          });
        },
      };

      search = (params: { filter?: unknown; page_size?: number }) => {
        return Promise.resolve({
          results: [
            {
              object: "database",
              id: "db1",
              url: "https://notion.so/db1",
              title: [{ plain_text: "Feedback Database" }],
              icon: { type: "emoji", emoji: "📝" },
              properties: {},
            },
            {
              object: "database",
              id: "db2",
              url: "https://notion.so/db2",
              title: [{ plain_text: "Tasks" }],
              icon: null,
              properties: {},
            },
          ],
        });
      };

      databases = {
        retrieve: (params: { database_id: string }) => {
          return Promise.resolve({
            object: "database",
            id: params.database_id,
            properties: {
              Title: { id: "title", type: "title" },
              Status: { id: "status", type: "status" },
              Priority: { id: "priority", type: "select" },
              Type: { id: "type", type: "select" },
              Tags: { id: "tags", type: "multi_select" },
              URL: { id: "url", type: "url" },
            },
          });
        },
      };

      pages = {
        create: (params: {
          parent: { database_id: string };
          properties: unknown;
          children: unknown[];
        }) => {
          return Promise.resolve({
            id: "page123",
            url: "https://notion.so/page123",
            properties: {
              Title: {
                type: "title",
                title: [{ plain_text: "Test Page" }],
              },
            },
          });
        },
      };
    },
  };
});

describe("Notion Integration Utilities", () => {
  describe("mapPriorityToNotion", () => {
    it("maps critical to Critical", () => {
      expect(mapPriorityToNotion("critical")).toBe("Critical");
    });

    it("maps high to High", () => {
      expect(mapPriorityToNotion("high")).toBe("High");
    });

    it("maps medium to Medium", () => {
      expect(mapPriorityToNotion("medium")).toBe("Medium");
    });

    it("maps low to Low", () => {
      expect(mapPriorityToNotion("low")).toBe("Low");
    });

    it("defaults unknown to Medium", () => {
      expect(mapPriorityToNotion("unknown")).toBe("Medium");
      expect(mapPriorityToNotion("")).toBe("Medium");
    });
  });

  describe("formatFeedbackForNotion", () => {
    const baseFeedback = {
      title: "Test Bug",
      description: "This is a test bug",
      type: "bug",
      priority: "high",
    };

    it("includes basic description", () => {
      const result = formatFeedbackForNotion(baseFeedback);
      expect(result).toContain("This is a test bug");
    });

    it("uses ticket draft description when available", () => {
      const feedback = {
        ...baseFeedback,
        ticketDraft: {
          description: "Enhanced description from AI",
        },
      };
      const result = formatFeedbackForNotion(feedback);
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
      const result = formatFeedbackForNotion(feedback);
      expect(result).toContain("## Steps to Reproduce");
      expect(result).toContain("1. Step 1");
      expect(result).toContain("2. Step 2");
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
      const result = formatFeedbackForNotion(feedback);
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
      const result = formatFeedbackForNotion(feedback);
      expect(result).toContain("## Acceptance Criteria");
      expect(result).toContain("- [ ] AC 1");
      expect(result).toContain("- [ ] AC 2");
    });

    it("handles feedback with no description", () => {
      const feedback = {
        title: "Minimal Bug",
        type: "bug",
        priority: "medium",
      };
      const result = formatFeedbackForNotion(feedback);
      expect(result).toBe("");
    });

    it("handles feedback with only ticket draft", () => {
      const feedback = {
        title: "Bug",
        type: "bug",
        priority: "medium",
        ticketDraft: {
          description: "From AI",
        },
      };
      const result = formatFeedbackForNotion(feedback);
      expect(result).toContain("From AI");
    });
  });

  describe("testNotionConnection", () => {
    it("returns valid true for working API key", async () => {
      const { testNotionConnection } = await import(
        "@/lib/integrations/notion"
      );
      const result = await testNotionConnection("valid-key");

      expect(result.valid).toBe(true);
      expect(result.botName).toBe("FeedbackFlow Bot");
    });

    it("returns valid false for invalid API key", async () => {
      const { testNotionConnection } = await import(
        "@/lib/integrations/notion"
      );
      const result = await testNotionConnection("invalid-key");

      expect(result.valid).toBe(false);
      expect(result.error).toBe("Invalid API key");
    });
  });

  describe("getNotionDatabases", () => {
    it("returns list of databases", async () => {
      const { getNotionDatabases } = await import("@/lib/integrations/notion");
      const databases = await getNotionDatabases("valid-key");

      expect(databases).toHaveLength(2);
      expect(databases[0]).toEqual({
        id: "db1",
        title: "Feedback Database",
        url: "https://notion.so/db1",
        icon: "📝",
      });
    });

    it("handles databases without icons", async () => {
      const { getNotionDatabases } = await import("@/lib/integrations/notion");
      const databases = await getNotionDatabases("valid-key");

      expect(databases[1].icon).toBeUndefined();
    });
  });

  describe("getNotionDatabaseProperties", () => {
    it("returns list of properties", async () => {
      const { getNotionDatabaseProperties } = await import(
        "@/lib/integrations/notion"
      );
      const properties = await getNotionDatabaseProperties("valid-key", "db1");

      expect(properties.length).toBeGreaterThan(0);
      expect(properties).toContainEqual({
        id: "title",
        name: "Title",
        type: "title",
      });
      expect(properties).toContainEqual({
        id: "priority",
        name: "Priority",
        type: "select",
      });
    });
  });

  describe("createNotionPage", () => {
    it("creates page and returns result", async () => {
      const { createNotionPage } = await import("@/lib/integrations/notion");
      const page = await createNotionPage("valid-key", {
        databaseId: "db1",
        title: "Test Issue",
        description: "Test description",
        type: "bug",
        priority: "high",
        tags: ["urgent"],
      });

      expect(page.id).toBe("page123");
      expect(page.url).toBe("https://notion.so/page123");
      expect(page.title).toBe("Test Page");
    });

    it("uses ticket draft title when available", async () => {
      const { createNotionPage } = await import("@/lib/integrations/notion");
      const page = await createNotionPage("valid-key", {
        databaseId: "db1",
        title: "Original Title",
        description: "Description",
        type: "bug",
        priority: "medium",
        tags: [],
        ticketDraft: {
          title: "Enhanced Title",
          description: "Enhanced description",
        },
      });

      expect(page).toBeDefined();
    });
  });
});
