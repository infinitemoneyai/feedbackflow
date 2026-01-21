/**
 * API route to send notifications (both in-app and email)
 * Called internally after notification events occur
 */

import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api, internal } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { sendNotificationEmail, type NotificationType } from "@/lib/email";

// Internal key for securing internal API calls
const INTERNAL_KEY = process.env.INTERNAL_API_KEY || "feedbackflow-internal-key";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL || "");

interface SendNotificationRequest {
  userId: string;
  type: NotificationType;
  feedbackId?: string;
  feedbackTitle?: string;
  feedbackDescription?: string;
  feedbackType?: "bug" | "feature";
  projectName?: string;
  actorName?: string;
  commentPreview?: string;
}

export async function POST(request: Request): Promise<Response> {
  try {
    // Verify internal key
    const authHeader = request.headers.get("x-internal-key");
    if (authHeader !== INTERNAL_KEY) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json() as SendNotificationRequest;
    const {
      userId,
      type,
      feedbackId,
      feedbackTitle,
      feedbackDescription,
      feedbackType,
      projectName,
      actorName,
      commentPreview,
    } = body;

    if (!userId || !type) {
      return NextResponse.json(
        { error: "Missing required fields: userId, type" },
        { status: 400 }
      );
    }

    // Build notification title based on type
    const notificationTitleMap: Record<NotificationType, string> = {
      new_feedback: feedbackTitle ? `New feedback: ${feedbackTitle}` : "New feedback submitted",
      assignment: `You were assigned to: ${feedbackTitle || "feedback"}`,
      comment: actorName ? `${actorName} commented on: ${feedbackTitle || "feedback"}` : `New comment on: ${feedbackTitle || "feedback"}`,
      mention: actorName ? `${actorName} mentioned you in: ${feedbackTitle || "feedback"}` : `You were mentioned in: ${feedbackTitle || "feedback"}`,
      export_complete: `Export completed: ${feedbackTitle || "feedback"}`,
      export_failed: `Export failed: ${feedbackTitle || "feedback"}`,
    };

    // Create in-app notification
    try {
      await convex.mutation(api.notifications.createNotificationPublic, {
        userId: userId as Id<"users">,
        type,
        title: notificationTitleMap[type],
        body: feedbackDescription || commentPreview,
        feedbackId: feedbackId ? feedbackId as Id<"feedback"> : undefined,
      });
    } catch (inAppError) {
      console.error("Failed to create in-app notification:", inAppError);
      // Continue with email notification even if in-app fails
    }

    // Get user preferences
    const preferences = await convex.query(api.notifications.getPreferencesByUserId, {
      userId: userId as Id<"users">,
    });

    // Get user details
    const user = await convex.query(api.users.getUser, {
      userId: userId as Id<"users">,
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if email notifications are enabled for this event type
    type EventMapType = {
      new_feedback: "newFeedback";
      assignment: "assignment";
      comment: "comments";
      mention: "mentions";
      export_complete: "exports";
      export_failed: "exports";
    };
    
    const eventMap: EventMapType = {
      new_feedback: "newFeedback",
      assignment: "assignment",
      comment: "comments",
      mention: "mentions",
      export_complete: "exports",
      export_failed: "exports",
    };

    // Default to enabled if no preferences set
    const shouldEmail =
      !preferences ||
      (preferences.emailEnabled !== false &&
        preferences.events?.[eventMap[type]] !== false);

    if (!shouldEmail) {
      return NextResponse.json({
        success: true,
        sent: false,
        reason: "Email notifications disabled for this event type",
      });
    }

    // Check email frequency
    const frequency = preferences?.emailFrequency || "instant";

    if (frequency !== "instant") {
      // Queue for digest instead of sending immediately
      await convex.mutation(internal.notifications.queueForDigest, {
        userId: userId as Id<"users">,
        notificationType: type,
        feedbackId: feedbackId as Id<"feedback"> | undefined,
        title: feedbackTitle || `New ${type.replace("_", " ")}`,
        body: feedbackDescription || commentPreview,
        projectName,
        metadata: {
          feedbackTitle,
          actorName,
          commentPreview,
        },
      });

      return NextResponse.json({
        success: true,
        sent: false,
        reason: `Queued for ${frequency} digest`,
      });
    }

    // Send immediate email
    const result = await sendNotificationEmail({
      type,
      recipientEmail: user.email,
      recipientName: user.name,
      feedbackId,
      feedbackTitle,
      feedbackDescription,
      feedbackType,
      projectName,
      actorName,
      commentPreview,
      unsubscribeToken: preferences?.unsubscribeToken || "",
    });

    if (!result.success) {
      console.error("Failed to send notification email:", result.error);
      return NextResponse.json(
        { error: result.error || "Failed to send email" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      sent: true,
      emailId: result.id,
    });
  } catch (error) {
    console.error("Notification send error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}
