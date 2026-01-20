/**
 * Unit tests for email service
 * @see lib/email/service.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock Resend
const mockSend = vi.fn();
vi.mock("resend", () => ({
  Resend: class MockResend {
    emails = { send: mockSend };
  },
}));

// Mock fetch for testEmailConfig
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("Email Service", () => {
  beforeEach(() => {
    mockSend.mockReset();
    mockFetch.mockReset();
  });

  describe("sendNotificationEmail", () => {
    it("sends new feedback email successfully", async () => {
      mockSend.mockResolvedValueOnce({
        data: { id: "email-123" },
        error: null,
      });

      const { sendNotificationEmail } = await import("@/lib/email/service");

      const result = await sendNotificationEmail({
        type: "new_feedback",
        recipientEmail: "test@example.com",
        recipientName: "John",
        feedbackId: "feedback-123",
        feedbackTitle: "Test Bug",
        feedbackType: "bug",
        projectName: "MyApp",
        unsubscribeToken: "token-123",
        baseUrl: "https://feedbackflow.dev",
      });

      expect(result.success).toBe(true);
      expect(result.id).toBe("email-123");
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "test@example.com",
          subject: expect.stringContaining("New bug in MyApp"),
        })
      );
    });

    it("sends assignment email successfully", async () => {
      mockSend.mockResolvedValueOnce({
        data: { id: "email-456" },
        error: null,
      });

      const { sendNotificationEmail } = await import("@/lib/email/service");

      const result = await sendNotificationEmail({
        type: "assignment",
        recipientEmail: "test@example.com",
        feedbackTitle: "Test Bug",
        actorName: "Jane",
        unsubscribeToken: "token-123",
      });

      expect(result.success).toBe(true);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.stringContaining("assigned to"),
        })
      );
    });

    it("sends comment email successfully", async () => {
      mockSend.mockResolvedValueOnce({
        data: { id: "email-789" },
        error: null,
      });

      const { sendNotificationEmail } = await import("@/lib/email/service");

      const result = await sendNotificationEmail({
        type: "comment",
        recipientEmail: "test@example.com",
        feedbackTitle: "Test Bug",
        actorName: "Jane",
        commentPreview: "Great work!",
        unsubscribeToken: "token-123",
      });

      expect(result.success).toBe(true);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.stringContaining("New comment"),
        })
      );
    });

    it("sends mention email successfully", async () => {
      mockSend.mockResolvedValueOnce({
        data: { id: "email-abc" },
        error: null,
      });

      const { sendNotificationEmail } = await import("@/lib/email/service");

      const result = await sendNotificationEmail({
        type: "mention",
        recipientEmail: "test@example.com",
        feedbackTitle: "Test Bug",
        actorName: "Jane",
        unsubscribeToken: "token-123",
      });

      expect(result.success).toBe(true);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.stringContaining("mentioned you"),
        })
      );
    });

    it("sends export complete email successfully", async () => {
      mockSend.mockResolvedValueOnce({
        data: { id: "email-def" },
        error: null,
      });

      const { sendNotificationEmail } = await import("@/lib/email/service");

      const result = await sendNotificationEmail({
        type: "export_complete",
        recipientEmail: "test@example.com",
        feedbackTitle: "Test Bug",
        unsubscribeToken: "token-123",
      });

      expect(result.success).toBe(true);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.stringContaining("Export completed"),
        })
      );
    });

    it("sends export failed email successfully", async () => {
      mockSend.mockResolvedValueOnce({
        data: { id: "email-ghi" },
        error: null,
      });

      const { sendNotificationEmail } = await import("@/lib/email/service");

      const result = await sendNotificationEmail({
        type: "export_failed",
        recipientEmail: "test@example.com",
        feedbackTitle: "Test Bug",
        unsubscribeToken: "token-123",
      });

      expect(result.success).toBe(true);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.stringContaining("Export failed"),
        })
      );
    });

    it("returns error for unknown notification type", async () => {
      const { sendNotificationEmail } = await import("@/lib/email/service");

      const result = await sendNotificationEmail({
        type: "unknown" as "new_feedback",
        recipientEmail: "test@example.com",
        unsubscribeToken: "token-123",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Unknown notification type");
    });

    it("handles Resend API errors", async () => {
      mockSend.mockResolvedValueOnce({
        data: null,
        error: { message: "Rate limit exceeded" },
      });

      const { sendNotificationEmail } = await import("@/lib/email/service");

      const result = await sendNotificationEmail({
        type: "new_feedback",
        recipientEmail: "test@example.com",
        feedbackTitle: "Test Bug",
        unsubscribeToken: "token-123",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Rate limit exceeded");
    });

    it("handles exceptions during send", async () => {
      mockSend.mockRejectedValueOnce(new Error("Network error"));

      const { sendNotificationEmail } = await import("@/lib/email/service");

      const result = await sendNotificationEmail({
        type: "new_feedback",
        recipientEmail: "test@example.com",
        feedbackTitle: "Test Bug",
        unsubscribeToken: "token-123",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Network error");
    });
  });

  describe("sendDigestEmail", () => {
    it("sends daily digest email successfully", async () => {
      mockSend.mockResolvedValueOnce({
        data: { id: "digest-123" },
        error: null,
      });

      const { sendDigestEmail } = await import("@/lib/email/service");

      const result = await sendDigestEmail({
        recipientEmail: "test@example.com",
        recipientName: "John",
        items: [
          { type: "new_feedback", title: "Bug 1", projectName: "App A" },
          { type: "comment", title: "Comment added", actorName: "Jane" },
        ],
        period: "daily",
        unsubscribeToken: "token-123",
        baseUrl: "https://feedbackflow.dev",
      });

      expect(result.success).toBe(true);
      expect(result.id).toBe("digest-123");
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "test@example.com",
          subject: expect.stringContaining("Daily"),
        })
      );
    });

    it("sends weekly digest email successfully", async () => {
      mockSend.mockResolvedValueOnce({
        data: { id: "digest-456" },
        error: null,
      });

      const { sendDigestEmail } = await import("@/lib/email/service");

      const result = await sendDigestEmail({
        recipientEmail: "test@example.com",
        items: [{ type: "assignment", title: "Assigned", actorName: "Jane" }],
        period: "weekly",
        unsubscribeToken: "token-123",
      });

      expect(result.success).toBe(true);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.stringContaining("Weekly"),
        })
      );
    });

    it("handles API errors", async () => {
      mockSend.mockResolvedValueOnce({
        data: null,
        error: { message: "Invalid recipient" },
      });

      const { sendDigestEmail } = await import("@/lib/email/service");

      const result = await sendDigestEmail({
        recipientEmail: "invalid",
        items: [{ type: "new_feedback", title: "Bug" }],
        period: "daily",
        unsubscribeToken: "token-123",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid recipient");
    });

    it("handles exceptions", async () => {
      mockSend.mockRejectedValueOnce(new Error("Connection failed"));

      const { sendDigestEmail } = await import("@/lib/email/service");

      const result = await sendDigestEmail({
        recipientEmail: "test@example.com",
        items: [{ type: "new_feedback", title: "Bug" }],
        period: "daily",
        unsubscribeToken: "token-123",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Connection failed");
    });
  });

  describe("sendMagicLinkEmail", () => {
    it("sends magic link email successfully", async () => {
      mockSend.mockResolvedValueOnce({
        data: { id: "magic-123" },
        error: null,
      });

      const { sendMagicLinkEmail } = await import("@/lib/email/service");

      const result = await sendMagicLinkEmail({
        recipientEmail: "submitter@example.com",
        recipientName: "John",
        feedbackTitle: "Login Bug",
        projectName: "MyApp",
        token: "magic-token-xyz",
        baseUrl: "https://feedbackflow.dev",
      });

      expect(result.success).toBe(true);
      expect(result.id).toBe("magic-123");
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "submitter@example.com",
          subject: expect.stringContaining("Check the status"),
        })
      );
    });

    it("includes correct status URL", async () => {
      mockSend.mockResolvedValueOnce({
        data: { id: "magic-456" },
        error: null,
      });

      const { sendMagicLinkEmail } = await import("@/lib/email/service");

      await sendMagicLinkEmail({
        recipientEmail: "submitter@example.com",
        feedbackTitle: "Bug",
        token: "abc123",
        baseUrl: "https://feedbackflow.dev",
      });

      const callArgs = mockSend.mock.calls[0][0];
      expect(callArgs.html).toContain(
        "https://feedbackflow.dev/status?token=abc123"
      );
    });

    it("handles API errors", async () => {
      mockSend.mockResolvedValueOnce({
        data: null,
        error: { message: "Rate limited" },
      });

      const { sendMagicLinkEmail } = await import("@/lib/email/service");

      const result = await sendMagicLinkEmail({
        recipientEmail: "test@example.com",
        feedbackTitle: "Bug",
        token: "xyz",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Rate limited");
    });

    it("handles exceptions", async () => {
      mockSend.mockRejectedValueOnce(new Error("Service unavailable"));

      const { sendMagicLinkEmail } = await import("@/lib/email/service");

      const result = await sendMagicLinkEmail({
        recipientEmail: "test@example.com",
        feedbackTitle: "Bug",
        token: "xyz",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Service unavailable");
    });
  });

  describe("testEmailConfig", () => {
    const originalEnv = process.env.RESEND_API_KEY;

    afterEach(() => {
      process.env.RESEND_API_KEY = originalEnv;
    });

    it("returns error when API key is not configured", async () => {
      delete process.env.RESEND_API_KEY;

      // Re-import to pick up env change
      vi.resetModules();
      const { testEmailConfig } = await import("@/lib/email/service");

      const result = await testEmailConfig();

      expect(result.success).toBe(false);
      expect(result.error).toBe("RESEND_API_KEY not configured");
    });

    it("returns success for valid API key", async () => {
      process.env.RESEND_API_KEY = "re_test_key";
      mockFetch.mockResolvedValueOnce({ ok: true });

      vi.resetModules();
      const { testEmailConfig } = await import("@/lib/email/service");

      const result = await testEmailConfig();

      expect(result.success).toBe(true);
    });

    it("returns error for invalid API key", async () => {
      process.env.RESEND_API_KEY = "invalid_key";
      mockFetch.mockResolvedValueOnce({ ok: false });

      vi.resetModules();
      const { testEmailConfig } = await import("@/lib/email/service");

      const result = await testEmailConfig();

      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid API key");
    });

    it("handles fetch errors", async () => {
      process.env.RESEND_API_KEY = "re_test_key";
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      vi.resetModules();
      const { testEmailConfig } = await import("@/lib/email/service");

      const result = await testEmailConfig();

      expect(result.success).toBe(false);
      expect(result.error).toBe("Network error");
    });
  });
});
