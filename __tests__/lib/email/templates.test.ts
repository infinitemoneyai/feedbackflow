/**
 * Unit tests for email templates
 * @see lib/email/templates.ts
 */

import { describe, it, expect } from "vitest";
import {
  newFeedbackEmail,
  assignmentEmail,
  commentEmail,
  mentionEmail,
  exportEmail,
  magicLinkEmail,
  digestEmail,
} from "@/lib/email/templates";

const baseTemplateData = {
  recipientName: "John Doe",
  feedbackTitle: "Button not working",
  feedbackDescription: "The submit button doesn't respond to clicks",
  feedbackType: "bug" as const,
  projectName: "MyApp",
  actorName: "Jane Smith",
  commentPreview: "I think this is a CSS issue",
  dashboardUrl: "https://feedbackflow.ccv/dashboard",
  feedbackUrl: "https://feedbackflow.cc/dashboard?feedback=123",
  unsubscribeUrl: "https://feedbackflow.cc/unsubscribe?token=abc123",
};

describe("Email Templates", () => {
  describe("newFeedbackEmail", () => {
    it("generates correct subject with feedback type and title", () => {
      const result = newFeedbackEmail(baseTemplateData);
      expect(result.subject).toBe("New bug in MyApp: Button not working");
    });

    it("generates subject for feature requests", () => {
      const result = newFeedbackEmail({
        ...baseTemplateData,
        feedbackType: "feature",
      });
      expect(result.subject).toBe("New feature in MyApp: Button not working");
    });

    it("includes recipient name in greeting", () => {
      const result = newFeedbackEmail(baseTemplateData);
      expect(result.html).toContain("Hi John Doe");
    });

    it("includes feedback title in body", () => {
      const result = newFeedbackEmail(baseTemplateData);
      expect(result.html).toContain("Button not working");
    });

    it("includes feedback description when provided", () => {
      const result = newFeedbackEmail(baseTemplateData);
      expect(result.html).toContain("The submit button doesn't respond to clicks");
    });

    it("includes project name", () => {
      const result = newFeedbackEmail(baseTemplateData);
      expect(result.html).toContain("MyApp");
    });

    it("includes unsubscribe link", () => {
      const result = newFeedbackEmail(baseTemplateData);
      expect(result.html).toContain(baseTemplateData.unsubscribeUrl);
    });

    it("includes view button with feedback URL", () => {
      const result = newFeedbackEmail(baseTemplateData);
      expect(result.html).toContain("View Feedback");
      expect(result.html).toContain(baseTemplateData.feedbackUrl);
    });

    it("handles missing optional fields gracefully", () => {
      const result = newFeedbackEmail({
        dashboardUrl: "https://feedbackflow.cc/dashboard",
        unsubscribeUrl: "https://feedbackflow.cc/unsubscribe",
      });
      expect(result.html).toContain("Hi,"); // No name
      expect(result.subject).toContain("New feedback");
    });
  });

  describe("assignmentEmail", () => {
    it("generates correct subject with feedback title", () => {
      const result = assignmentEmail(baseTemplateData);
      expect(result.subject).toBe("You've been assigned to: Button not working");
    });

    it("includes actor name (who assigned)", () => {
      const result = assignmentEmail(baseTemplateData);
      expect(result.html).toContain("Jane Smith");
      expect(result.html).toContain("assigned you to");
    });

    it("shows assignment badge", () => {
      const result = assignmentEmail(baseTemplateData);
      expect(result.html).toContain("Assigned to You");
    });
  });

  describe("commentEmail", () => {
    it("generates correct subject", () => {
      const result = commentEmail(baseTemplateData);
      expect(result.subject).toBe("New comment on: Button not working");
    });

    it("includes commenter name", () => {
      const result = commentEmail(baseTemplateData);
      expect(result.html).toContain("Jane Smith");
      expect(result.html).toContain("commented on");
    });

    it("includes comment preview", () => {
      const result = commentEmail(baseTemplateData);
      expect(result.html).toContain("I think this is a CSS issue");
    });

    it("shows comment badge", () => {
      const result = commentEmail(baseTemplateData);
      expect(result.html).toContain("New Comment");
    });
  });

  describe("mentionEmail", () => {
    it("generates correct subject with actor name", () => {
      const result = mentionEmail(baseTemplateData);
      expect(result.subject).toBe(
        "Jane Smith mentioned you in: Button not working"
      );
    });

    it("includes mention context", () => {
      const result = mentionEmail(baseTemplateData);
      expect(result.html).toContain("mentioned you in a comment");
    });
  });

  describe("exportEmail", () => {
    it("generates success email with correct subject", () => {
      const result = exportEmail(baseTemplateData, "complete");
      expect(result.subject).toBe("Export completed: Button not working");
    });

    it("generates failure email with correct subject", () => {
      const result = exportEmail(baseTemplateData, "failed");
      expect(result.subject).toBe("Export failed: Button not working");
    });

    it("shows success badge for complete", () => {
      const result = exportEmail(baseTemplateData, "complete");
      expect(result.html).toContain("Success");
      expect(result.html).toContain("has completed successfully");
    });

    it("shows failed badge for failed", () => {
      const result = exportEmail(baseTemplateData, "failed");
      expect(result.html).toContain("Failed");
      expect(result.html).toContain("failed");
    });

    it("includes error description for failed exports", () => {
      const result = exportEmail(
        { ...baseTemplateData, feedbackDescription: "API timeout" },
        "failed"
      );
      expect(result.html).toContain("Error: API timeout");
    });
  });

  describe("magicLinkEmail", () => {
    it("generates correct subject", () => {
      const result = magicLinkEmail({
        recipientName: "John",
        feedbackTitle: "Login bug",
        projectName: "MyApp",
        statusUrl: "https://feedbackflow.cc/status?token=xyz",
      });
      expect(result.subject).toBe("Check the status of your feedback: Login bug");
    });

    it("includes status URL in button", () => {
      const result = magicLinkEmail({
        feedbackTitle: "Login bug",
        statusUrl: "https://feedbackflow.cc/status?token=xyz",
      });
      expect(result.html).toContain("https://feedbackflow.cc/status?token=xyz");
      expect(result.html).toContain("View Status");
    });

    it("includes expiration warning", () => {
      const result = magicLinkEmail({
        feedbackTitle: "Login bug",
        statusUrl: "https://feedbackflow.cc/status?token=xyz",
      });
      expect(result.html).toContain("expire in 7 days");
    });
  });

  describe("digestEmail", () => {
    it("generates correct subject with item count", () => {
      const result = digestEmail({
        recipientName: "John",
        items: [
          { type: "new_feedback", title: "Bug 1" },
          { type: "comment", title: "Comment on Bug 2", actorName: "Jane" },
        ],
        period: "daily",
        dashboardUrl: "https://feedbackflow.cc/dashboard",
        unsubscribeUrl: "https://feedbackflow.cc/unsubscribe",
      });
      expect(result.subject).toBe(
        "Your Daily FeedbackFlow Digest (2 updates)"
      );
    });

    it("handles singular update", () => {
      const result = digestEmail({
        items: [{ type: "new_feedback", title: "Bug 1" }],
        period: "weekly",
        dashboardUrl: "https://feedbackflow.cc/dashboard",
        unsubscribeUrl: "https://feedbackflow.cc/unsubscribe",
      });
      expect(result.subject).toBe(
        "Your Weekly FeedbackFlow Digest (1 updates)"
      );
      expect(result.html).toContain("1 update");
    });

    it("includes all digest items", () => {
      const result = digestEmail({
        items: [
          { type: "new_feedback", title: "New Bug", projectName: "App A" },
          {
            type: "assignment",
            title: "Assigned Feature",
            actorName: "Jane",
          },
          { type: "comment", title: "Comment added", body: "Great work!" },
        ],
        period: "daily",
        dashboardUrl: "https://feedbackflow.cc/dashboard",
        unsubscribeUrl: "https://feedbackflow.cc/unsubscribe",
      });

      expect(result.html).toContain("New Feedback");
      expect(result.html).toContain("Assignment");
      expect(result.html).toContain("Comment");
      expect(result.html).toContain("New Bug");
      expect(result.html).toContain("Assigned Feature");
      expect(result.html).toContain("Great work!");
    });

    it("shows period in body", () => {
      const dailyResult = digestEmail({
        items: [{ type: "new_feedback", title: "Bug" }],
        period: "daily",
        dashboardUrl: "https://feedbackflow.cc/dashboard",
        unsubscribeUrl: "https://feedbackflow.cc/unsubscribe",
      });
      expect(dailyResult.html).toContain("daily digest");

      const weeklyResult = digestEmail({
        items: [{ type: "new_feedback", title: "Bug" }],
        period: "weekly",
        dashboardUrl: "https://feedbackflow.cc/dashboard",
        unsubscribeUrl: "https://feedbackflow.cc/unsubscribe",
      });
      expect(weeklyResult.html).toContain("weekly digest");
    });
  });
});
