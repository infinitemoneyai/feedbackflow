/**
 * Email service using Resend
 */

import { Resend } from "resend";
import {
  newFeedbackEmail,
  assignmentEmail,
  commentEmail,
  mentionEmail,
  exportEmail,
  digestEmail,
  magicLinkEmail,
} from "./templates";

// Initialize Resend client
// API key should be set via RESEND_API_KEY environment variable
const resend = new Resend(process.env.RESEND_API_KEY);

// Default sender address (configure in Resend dashboard)
const FROM_EMAIL = process.env.EMAIL_FROM || "FeedbackFlow <noreply@feedbackflow.cc>";

export type NotificationType =
  | "new_feedback"
  | "assignment"
  | "comment"
  | "mention"
  | "export_complete"
  | "export_failed";

export interface EmailNotificationData {
  type: NotificationType;
  recipientEmail: string;
  recipientName?: string;
  feedbackId?: string;
  feedbackTitle?: string;
  feedbackDescription?: string;
  feedbackType?: "bug" | "feature";
  projectName?: string;
  actorName?: string;
  commentPreview?: string;
  unsubscribeToken: string;
  baseUrl?: string;
}

export interface DigestEmailData {
  recipientEmail: string;
  recipientName?: string;
  items: Array<{
    type: NotificationType;
    title: string;
    body?: string;
    projectName?: string;
    feedbackTitle?: string;
    actorName?: string;
    feedbackId?: string;
  }>;
  period: "daily" | "weekly";
  unsubscribeToken: string;
  baseUrl?: string;
}

/**
 * Build URLs for email links
 */
function buildUrls(
  baseUrl: string,
  feedbackId?: string,
  unsubscribeToken?: string
): {
  dashboardUrl: string;
  feedbackUrl?: string;
  unsubscribeUrl: string;
} {
  const base = baseUrl.replace(/\/$/, "");
  return {
    dashboardUrl: `${base}/dashboard`,
    feedbackUrl: feedbackId ? `${base}/dashboard?feedback=${feedbackId}` : undefined,
    unsubscribeUrl: unsubscribeToken
      ? `${base}/unsubscribe?token=${unsubscribeToken}`
      : `${base}/settings`,
  };
}

/**
 * Send a notification email
 */
export async function sendNotificationEmail(data: EmailNotificationData): Promise<{
  success: boolean;
  id?: string;
  error?: string;
}> {
  const baseUrl = data.baseUrl || process.env.NEXT_PUBLIC_APP_URL || "https://feedbackflow.cc";
  const urls = buildUrls(baseUrl, data.feedbackId, data.unsubscribeToken);

  const templateData = {
    recipientName: data.recipientName,
    feedbackTitle: data.feedbackTitle,
    feedbackDescription: data.feedbackDescription,
    feedbackType: data.feedbackType,
    projectName: data.projectName,
    actorName: data.actorName,
    commentPreview: data.commentPreview,
    ...urls,
  };

  let emailContent: { subject: string; html: string };

  switch (data.type) {
    case "new_feedback":
      emailContent = newFeedbackEmail(templateData);
      break;
    case "assignment":
      emailContent = assignmentEmail(templateData);
      break;
    case "comment":
      emailContent = commentEmail(templateData);
      break;
    case "mention":
      emailContent = mentionEmail(templateData);
      break;
    case "export_complete":
      emailContent = exportEmail(templateData, "complete");
      break;
    case "export_failed":
      emailContent = exportEmail(templateData, "failed");
      break;
    default:
      return { success: false, error: "Unknown notification type" };
  }

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.recipientEmail,
      subject: emailContent.subject,
      html: emailContent.html,
    });

    if (result.error) {
      console.error("Resend error:", result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true, id: result.data?.id };
  } catch (error) {
    console.error("Email send error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send email",
    };
  }
}

/**
 * Send a digest email
 */
export async function sendDigestEmail(data: DigestEmailData): Promise<{
  success: boolean;
  id?: string;
  error?: string;
}> {
  const baseUrl = data.baseUrl || process.env.NEXT_PUBLIC_APP_URL || "https://feedbackflow.cc";
  const urls = buildUrls(baseUrl, undefined, data.unsubscribeToken);

  const digestData = {
    recipientName: data.recipientName,
    items: data.items.map((item) => ({
      type: item.type,
      title: item.title,
      body: item.body,
      projectName: item.projectName,
      feedbackTitle: item.feedbackTitle,
      actorName: item.actorName,
      feedbackUrl: item.feedbackId
        ? `${baseUrl.replace(/\/$/, "")}/dashboard?feedback=${item.feedbackId}`
        : undefined,
    })),
    period: data.period,
    dashboardUrl: urls.dashboardUrl,
    unsubscribeUrl: urls.unsubscribeUrl,
  };

  const emailContent = digestEmail(digestData);

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.recipientEmail,
      subject: emailContent.subject,
      html: emailContent.html,
    });

    if (result.error) {
      console.error("Resend error:", result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true, id: result.data?.id };
  } catch (error) {
    console.error("Digest email send error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send digest email",
    };
  }
}

/**
 * Send a magic link email for submitter status access
 */
export async function sendMagicLinkEmail(data: {
  recipientEmail: string;
  recipientName?: string;
  feedbackTitle: string;
  projectName?: string;
  token: string;
  baseUrl?: string;
}): Promise<{
  success: boolean;
  id?: string;
  error?: string;
}> {
  const baseUrl = data.baseUrl || process.env.NEXT_PUBLIC_APP_URL || "https://feedbackflow.cc";
  const statusUrl = `${baseUrl.replace(/\/$/, "")}/status?token=${data.token}`;

  const emailContent = magicLinkEmail({
    recipientName: data.recipientName,
    feedbackTitle: data.feedbackTitle,
    projectName: data.projectName,
    statusUrl,
  });

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.recipientEmail,
      subject: emailContent.subject,
      html: emailContent.html,
    });

    if (result.error) {
      console.error("Resend error:", result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true, id: result.data?.id };
  } catch (error) {
    console.error("Magic link email send error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send email",
    };
  }
}

/**
 * Test email configuration
 */
export async function testEmailConfig(): Promise<{
  success: boolean;
  error?: string;
}> {
  if (!process.env.RESEND_API_KEY) {
    return { success: false, error: "RESEND_API_KEY not configured" };
  }

  try {
    // Verify API key by listing domains (lightweight check)
    const response = await fetch("https://api.resend.com/domains", {
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
    });

    if (!response.ok) {
      return { success: false, error: "Invalid API key" };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Connection failed",
    };
  }
}
