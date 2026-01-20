/**
 * Unit tests for JSON export utilities
 * @see lib/exports/json.ts
 */

import { describe, it, expect } from "vitest";
import { Id } from "@/convex/_generated/dataModel";
import {
  mapPriorityToNumber,
  generateBasicAcceptanceCriteria,
  generateExportId,
  buildExportNotes,
  feedbackToUserStory,
  feedbackToPrdExport,
  formatUserStoryJson,
  formatPrdExportJson,
  type FeedbackForExport,
  type TicketDraftForExport,
} from "@/lib/exports/json";

// Helper to create mock feedback
function createMockFeedback(
  overrides: Partial<FeedbackForExport> = {}
): FeedbackForExport {
  return {
    _id: "feedback123456" as Id<"feedback">,
    type: "bug",
    title: "Test Bug",
    description: "This is a test bug description",
    priority: "medium",
    status: "new",
    tags: ["ui", "button"],
    screenshotUrl: undefined,
    recordingUrl: undefined,
    submitterEmail: undefined,
    submitterName: undefined,
    metadata: undefined,
    createdAt: 1704067200000,
    ...overrides,
  };
}

describe("JSON Export Utilities", () => {
  describe("mapPriorityToNumber", () => {
    it("maps critical to 1", () => {
      expect(mapPriorityToNumber("critical")).toBe(1);
    });

    it("maps high to 2", () => {
      expect(mapPriorityToNumber("high")).toBe(2);
    });

    it("maps medium to 3", () => {
      expect(mapPriorityToNumber("medium")).toBe(3);
    });

    it("maps low to 4", () => {
      expect(mapPriorityToNumber("low")).toBe(4);
    });

    it("defaults unknown priority to 3 (medium)", () => {
      expect(mapPriorityToNumber("unknown")).toBe(3);
      expect(mapPriorityToNumber("")).toBe(3);
    });
  });

  describe("generateBasicAcceptanceCriteria", () => {
    it("generates bug-specific criteria", () => {
      const feedback = createMockFeedback({ type: "bug" });
      const criteria = generateBasicAcceptanceCriteria(feedback);

      expect(criteria).toContain("Bug is reproducible following the reported steps");
      expect(criteria).toContain("Root cause is identified and documented");
      expect(criteria).toContain("Fix is implemented and tested");
      expect(criteria).toContain("No regression in related functionality");
    });

    it("adds screenshot criteria for bugs with screenshots", () => {
      const feedback = createMockFeedback({
        type: "bug",
        screenshotUrl: "https://example.com/screenshot.png",
      });
      const criteria = generateBasicAcceptanceCriteria(feedback);

      expect(criteria).toContain("Visual issue shown in screenshot is resolved");
    });

    it("adds recording criteria for bugs with recordings", () => {
      const feedback = createMockFeedback({
        type: "bug",
        recordingUrl: "https://example.com/recording.webm",
      });
      const criteria = generateBasicAcceptanceCriteria(feedback);

      expect(criteria).toContain("Behavior demonstrated in recording is corrected");
    });

    it("generates feature-specific criteria", () => {
      const feedback = createMockFeedback({ type: "feature" });
      const criteria = generateBasicAcceptanceCriteria(feedback);

      expect(criteria).toContain("Feature is implemented as described");
      expect(criteria).toContain("Feature is tested with various inputs");
      expect(criteria).toContain("Documentation is updated if applicable");
      expect(criteria).toContain("Feature follows existing UI/UX patterns");
    });
  });

  describe("generateExportId", () => {
    it("generates ID in FF-XXXXXX format", () => {
      const feedback = createMockFeedback();
      const id = generateExportId(feedback);

      expect(id).toMatch(/^FF-[A-Z0-9]{6}$/);
    });

    it("uses last 6 characters of Convex ID", () => {
      const feedback = createMockFeedback({
        _id: "abcdefghijk123456" as Id<"feedback">,
      });
      const id = generateExportId(feedback);

      expect(id).toBe("FF-123456");
    });
  });

  describe("buildExportNotes", () => {
    it("includes description when no ticket draft", () => {
      const feedback = createMockFeedback({
        description: "Test description",
      });
      const notes = buildExportNotes(feedback);

      expect(notes).toContain("Test description");
    });

    it("prefers ticket draft description over feedback description", () => {
      const feedback = createMockFeedback({
        description: "Original description",
      });
      const ticketDraft: TicketDraftForExport = {
        title: "Draft Title",
        description: "Draft description",
        acceptanceCriteria: [],
      };
      const notes = buildExportNotes(feedback, ticketDraft);

      expect(notes).toContain("Draft description");
      expect(notes).not.toContain("Original description");
    });

    it("includes repro steps for bugs with ticket draft", () => {
      const feedback = createMockFeedback({ type: "bug" });
      const ticketDraft: TicketDraftForExport = {
        title: "Bug Title",
        description: "Bug description",
        acceptanceCriteria: [],
        reproSteps: ["Step 1", "Step 2", "Step 3"],
      };
      const notes = buildExportNotes(feedback, ticketDraft);

      expect(notes).toContain("**Reproduction Steps:**");
      expect(notes).toContain("1. Step 1");
      expect(notes).toContain("2. Step 2");
      expect(notes).toContain("3. Step 3");
    });

    it("includes expected and actual behavior", () => {
      const feedback = createMockFeedback({ type: "bug" });
      const ticketDraft: TicketDraftForExport = {
        title: "Bug Title",
        description: "Bug description",
        acceptanceCriteria: [],
        expectedBehavior: "Button should be green",
        actualBehavior: "Button is red",
      };
      const notes = buildExportNotes(feedback, ticketDraft);

      expect(notes).toContain("**Expected:** Button should be green");
      expect(notes).toContain("**Actual:** Button is red");
    });

    it("includes environment metadata", () => {
      const feedback = createMockFeedback({
        metadata: {
          url: "https://example.com/page",
          browser: "Chrome 120",
          os: "macOS",
          screenWidth: 1920,
          screenHeight: 1080,
          timestamp: 1704067200000,
        },
      });
      const notes = buildExportNotes(feedback);

      expect(notes).toContain("**Environment:**");
      expect(notes).toContain("- URL: https://example.com/page");
      expect(notes).toContain("- Browser: Chrome 120");
      expect(notes).toContain("- OS: macOS");
      expect(notes).toContain("- Screen: 1920x1080");
    });

    it("includes media references", () => {
      const feedback = createMockFeedback({
        screenshotUrl: "https://example.com/screenshot.png",
        recordingUrl: "https://example.com/recording.webm",
      });
      const notes = buildExportNotes(feedback);

      expect(notes).toContain("**Screenshot:** https://example.com/screenshot.png");
      expect(notes).toContain("**Recording:** https://example.com/recording.webm");
    });

    it("includes submitter info", () => {
      const feedback = createMockFeedback({
        submitterName: "John Doe",
        submitterEmail: "john@example.com",
      });
      const notes = buildExportNotes(feedback);

      expect(notes).toContain("**Reported by:** John Doe");
    });

    it("uses email when name is not provided", () => {
      const feedback = createMockFeedback({
        submitterEmail: "john@example.com",
      });
      const notes = buildExportNotes(feedback);

      expect(notes).toContain("**Reported by:** john@example.com");
    });

    it("includes tags", () => {
      const feedback = createMockFeedback({
        tags: ["urgent", "ui", "mobile"],
      });
      const notes = buildExportNotes(feedback);

      expect(notes).toContain("**Tags:** urgent, ui, mobile");
    });
  });

  describe("feedbackToUserStory", () => {
    it("creates user story with basic fields", () => {
      const feedback = createMockFeedback({
        title: "Test Bug",
        priority: "high",
      });
      const userStory = feedbackToUserStory(feedback);

      expect(userStory.title).toBe("Test Bug");
      expect(userStory.priority).toBe(2); // high = 2
      expect(userStory.passes).toBe(false);
    });

    it("uses ticket draft title when available", () => {
      const feedback = createMockFeedback({ title: "Original Title" });
      const ticketDraft: TicketDraftForExport = {
        title: "Draft Title",
        description: "Draft description",
        acceptanceCriteria: ["Criterion 1", "Criterion 2"],
      };
      const userStory = feedbackToUserStory(feedback, ticketDraft);

      expect(userStory.title).toBe("Draft Title");
    });

    it("uses ticket draft acceptance criteria when available", () => {
      const feedback = createMockFeedback();
      const ticketDraft: TicketDraftForExport = {
        title: "Draft Title",
        description: "Draft description",
        acceptanceCriteria: ["AC 1", "AC 2", "AC 3"],
      };
      const userStory = feedbackToUserStory(feedback, ticketDraft);

      expect(userStory.acceptanceCriteria).toEqual(["AC 1", "AC 2", "AC 3"]);
    });

    it("generates basic acceptance criteria when no ticket draft", () => {
      const feedback = createMockFeedback({ type: "bug" });
      const userStory = feedbackToUserStory(feedback);

      expect(userStory.acceptanceCriteria.length).toBeGreaterThan(0);
      expect(userStory.acceptanceCriteria).toContain(
        "Bug is reproducible following the reported steps"
      );
    });

    it("includes notes from buildExportNotes", () => {
      const feedback = createMockFeedback({
        description: "Test description",
      });
      const userStory = feedbackToUserStory(feedback);

      expect(userStory.notes).toContain("Test description");
    });
  });

  describe("feedbackToPrdExport", () => {
    it("creates PRD export with project info", () => {
      const feedbackItems = [
        { feedback: createMockFeedback(), ticketDraft: null },
      ];
      const prdExport = feedbackToPrdExport(
        feedbackItems,
        "TestProject",
        "A test project"
      );

      expect(prdExport.projectName).toBe("TestProject");
      expect(prdExport.description).toBe("A test project");
      expect(prdExport.exportedAt).toBeDefined();
    });

    it("includes all feedback items as user stories", () => {
      const feedbackItems = [
        { feedback: createMockFeedback({ title: "Bug 1" }), ticketDraft: null },
        { feedback: createMockFeedback({ title: "Bug 2" }), ticketDraft: null },
        { feedback: createMockFeedback({ title: "Feature 1", type: "feature" }), ticketDraft: null },
      ];
      const prdExport = feedbackToPrdExport(feedbackItems, "TestProject");

      expect(prdExport.userStories).toHaveLength(3);
    });

    it("uses ticket drafts when provided", () => {
      const ticketDraft: TicketDraftForExport = {
        title: "Enhanced Title",
        description: "Enhanced description",
        acceptanceCriteria: ["AC 1"],
      };
      const feedbackItems = [
        { feedback: createMockFeedback({ title: "Original" }), ticketDraft },
      ];
      const prdExport = feedbackToPrdExport(feedbackItems, "TestProject");

      expect(prdExport.userStories[0].title).toBe("Enhanced Title");
    });

    it("handles optional project description", () => {
      const feedbackItems = [
        { feedback: createMockFeedback(), ticketDraft: null },
      ];
      const prdExport = feedbackToPrdExport(feedbackItems, "TestProject");

      expect(prdExport.description).toBeUndefined();
    });
  });

  describe("formatUserStoryJson", () => {
    it("formats user story as pretty JSON", () => {
      const feedback = createMockFeedback({ title: "Test Bug" });
      const userStory = feedbackToUserStory(feedback);
      const json = formatUserStoryJson(userStory);

      expect(json).toContain('"title": "Test Bug"');
      expect(json).toContain("\n"); // Pretty printed
    });

    it("produces valid JSON", () => {
      const feedback = createMockFeedback();
      const userStory = feedbackToUserStory(feedback);
      const json = formatUserStoryJson(userStory);

      const parsed = JSON.parse(json);
      expect(parsed.title).toBe(userStory.title);
    });
  });

  describe("formatPrdExportJson", () => {
    it("formats PRD export as pretty JSON", () => {
      const feedbackItems = [
        { feedback: createMockFeedback({ title: "Test" }), ticketDraft: null },
      ];
      const prdExport = feedbackToPrdExport(feedbackItems, "TestProject");
      const json = formatPrdExportJson(prdExport);

      expect(json).toContain('"projectName": "TestProject"');
      expect(json).toContain("\n"); // Pretty printed
    });

    it("produces valid JSON", () => {
      const feedbackItems = [
        { feedback: createMockFeedback(), ticketDraft: null },
      ];
      const prdExport = feedbackToPrdExport(feedbackItems, "TestProject");
      const json = formatPrdExportJson(prdExport);

      const parsed = JSON.parse(json);
      expect(parsed.projectName).toBe("TestProject");
      expect(parsed.userStories).toHaveLength(1);
    });
  });
});
