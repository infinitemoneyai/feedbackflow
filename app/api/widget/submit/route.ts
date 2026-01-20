import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import {
  checkIpRateLimit,
  checkWidgetDailyLimit,
  getClientIp,
} from "@/lib/rate-limit";

// Lazy initialize Convex client
function getConvexClient() {
  return new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL || "");
}

// CORS headers for all responses
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

/**
 * Create a JSON response with CORS headers
 */
function jsonResponse(
  data: unknown,
  status: number,
  additionalHeaders: Record<string, string> = {}
): NextResponse {
  return NextResponse.json(data, {
    status,
    headers: {
      ...corsHeaders,
      ...additionalHeaders,
    },
  });
}

/**
 * Parse user agent to extract browser and OS
 */
function parseUserAgent(userAgent: string): { browser: string; os: string } {
  let browser = "Unknown";
  let os = "Unknown";

  // Browser detection
  if (userAgent.includes("Firefox/")) {
    browser = "Firefox";
  } else if (userAgent.includes("Edg/")) {
    browser = "Edge";
  } else if (userAgent.includes("Chrome/")) {
    browser = "Chrome";
  } else if (userAgent.includes("Safari/") && !userAgent.includes("Chrome")) {
    browser = "Safari";
  } else if (userAgent.includes("Opera") || userAgent.includes("OPR/")) {
    browser = "Opera";
  }

  // OS detection
  if (userAgent.includes("Windows")) {
    os = "Windows";
  } else if (userAgent.includes("Mac OS X")) {
    os = "macOS";
  } else if (userAgent.includes("Linux")) {
    os = "Linux";
  } else if (userAgent.includes("iPhone") || userAgent.includes("iPad")) {
    os = "iOS";
  } else if (userAgent.includes("Android")) {
    os = "Android";
  }

  return { browser, os };
}

/**
 * POST /api/widget/submit
 * Receives feedback from the embeddable widget
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Get client IP for rate limiting
    const clientIp = getClientIp(request);

    // Check IP rate limit (10 per minute)
    const ipRateLimit = checkIpRateLimit(clientIp);
    if (!ipRateLimit.success) {
      return jsonResponse(
        {
          error: "Rate limit exceeded",
          message: "Too many requests. Please try again later.",
          retryAfter: Math.ceil((ipRateLimit.resetAt - Date.now()) / 1000),
        },
        429,
        {
          "X-RateLimit-Limit": ipRateLimit.limit.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": ipRateLimit.resetAt.toString(),
          "Retry-After": Math.ceil(
            (ipRateLimit.resetAt - Date.now()) / 1000
          ).toString(),
        }
      );
    }

    // Parse multipart form data
    const formData = await request.formData();

    // Extract required fields
    const widgetKey = formData.get("widgetKey") as string;
    const title = formData.get("title") as string;
    const type = formData.get("type") as string;

    // Validate required fields
    if (!widgetKey) {
      return jsonResponse({ error: "Missing required field: widgetKey" }, 400);
    }

    if (!title || title.trim().length === 0) {
      return jsonResponse({ error: "Missing required field: title" }, 400);
    }

    if (!type || (type !== "bug" && type !== "feature")) {
      return jsonResponse(
        { error: "Invalid type. Must be 'bug' or 'feature'" },
        400
      );
    }

    // Check honeypot field for spam detection
    const honeypot = formData.get("website") as string;
    if (honeypot && honeypot.trim().length > 0) {
      // Honeypot field filled - likely a bot
      // Return success to not reveal detection, but don't process
      console.log(
        `FeedbackFlow: Honeypot triggered from IP ${clientIp}, widget ${widgetKey}`
      );
      return jsonResponse(
        {
          success: true,
          feedbackId: "FF-BLOCKED",
        },
        200
      );
    }

    // Initialize Convex client
    const convex = getConvexClient();

    // Validate widget exists and is active
    const widgetInfo = await convex.query(api.feedback.getWidgetByKey, {
      widgetKey,
    });

    if (!widgetInfo) {
      return jsonResponse({ error: "Invalid widget key" }, 404);
    }

    if (!widgetInfo.isActive) {
      return jsonResponse({ error: "Widget is not active" }, 403);
    }

    // Check widget daily rate limit (100 per day)
    const dailyCount = await convex.query(api.feedback.getWidgetDailyCount, {
      widgetKey,
    });

    const widgetRateLimit = checkWidgetDailyLimit(widgetKey, dailyCount.count);
    if (!widgetRateLimit.success) {
      return jsonResponse(
        {
          error: "Daily limit exceeded",
          message:
            "This widget has reached its daily submission limit. Please try again tomorrow.",
          retryAfter: Math.ceil((widgetRateLimit.resetAt - Date.now()) / 1000),
        },
        429,
        {
          "X-RateLimit-Limit": widgetRateLimit.limit.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": widgetRateLimit.resetAt.toString(),
        }
      );
    }

    // Extract optional fields
    const description = (formData.get("description") as string) || undefined;
    const email = (formData.get("email") as string) || undefined;
    const name = (formData.get("name") as string) || undefined;
    const metadataStr = formData.get("metadata") as string;

    // Parse metadata
    let parsedMetadata: {
      url?: string;
      userAgent?: string;
      timestamp?: string;
      screenWidth?: number;
      screenHeight?: number;
    } = {};

    if (metadataStr) {
      try {
        parsedMetadata = JSON.parse(metadataStr);
      } catch {
        console.warn("Failed to parse metadata JSON");
      }
    }

    // Parse user agent
    const userAgent =
      parsedMetadata.userAgent || request.headers.get("user-agent") || "";
    const { browser, os } = parseUserAgent(userAgent);

    // Handle screenshot upload
    let screenshotStorageId: string | undefined;
    const screenshot = formData.get("screenshot") as File | null;

    if (screenshot && screenshot.size > 0) {
      try {
        // Generate upload URL
        const uploadUrl = await convex.mutation(api.feedback.generateUploadUrl);

        // Upload the file to Convex storage
        const uploadResponse = await fetch(uploadUrl, {
          method: "POST",
          headers: {
            "Content-Type": screenshot.type,
          },
          body: screenshot,
        });

        if (uploadResponse.ok) {
          const { storageId } = await uploadResponse.json();
          screenshotStorageId = storageId;
        } else {
          console.error("Failed to upload screenshot:", uploadResponse.status);
        }
      } catch (error) {
        console.error("Error uploading screenshot:", error);
      }
    }

    // Handle video recording
    // For now, videos are stored as URL references to external storage
    // The widget would need to upload to S3/R2/GCS and provide the URL
    let recordingUrl: string | undefined;
    let recordingDuration: number | undefined;
    const recording = formData.get("recording") as File | null;

    if (recording && recording.size > 0) {
      // TODO: Upload to external storage (S3/R2/GCS) when configured
      // For now, we'll store smaller recordings in Convex storage
      // In production, large videos should go to external storage

      // Check file size (Convex storage limit is typically 10MB per file)
      const MAX_CONVEX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

      if (recording.size <= MAX_CONVEX_FILE_SIZE) {
        try {
          const uploadUrl = await convex.mutation(
            api.feedback.generateUploadUrl
          );
          const uploadResponse = await fetch(uploadUrl, {
            method: "POST",
            headers: {
              "Content-Type": recording.type,
            },
            body: recording,
          });

          if (uploadResponse.ok) {
            const { storageId } = await uploadResponse.json();
            // Get the URL for the uploaded video
            // We'll store the storage ID and generate URL on demand
            recordingUrl = `convex-storage:${storageId}`;
          }
        } catch (error) {
          console.error("Error uploading recording:", error);
        }
      } else {
        console.warn(
          `Recording too large (${recording.size} bytes). External storage required.`
        );
        // In a full implementation, we would:
        // 1. Get storage config from the team's settings
        // 2. Generate a presigned upload URL for S3/R2/GCS
        // 3. Return that URL for client-side upload
        // For now, we skip the recording if it's too large
      }

      // Try to extract duration from metadata if available
      const recordingDurationStr = formData.get("recordingDuration") as string;
      if (recordingDurationStr) {
        recordingDuration = parseFloat(recordingDurationStr);
      }
    }

    // Prepare metadata for Convex
    const feedbackMetadata = {
      browser,
      os,
      url: parsedMetadata.url || undefined,
      screenWidth: parsedMetadata.screenWidth
        ? Number(parsedMetadata.screenWidth)
        : undefined,
      screenHeight: parsedMetadata.screenHeight
        ? Number(parsedMetadata.screenHeight)
        : undefined,
      userAgent: userAgent || undefined,
      timestamp: Date.now(),
    };

    // Submit feedback to Convex
    const result = await convex.mutation(api.feedback.submitFromWidget, {
      widgetKey,
      type: type as "bug" | "feature",
      title: title.trim(),
      description: description?.trim(),
      submitterEmail: email?.trim(),
      submitterName: name?.trim(),
      screenshotStorageId: screenshotStorageId as
        | `${"_storage"}${""}${string}`
        | undefined,
      recordingUrl,
      recordingDuration,
      metadata: feedbackMetadata,
    });

    // Trigger background tasks (fire and forget)
    // These run asynchronously after response is sent
    try {
      // Get project to find team ID for auto-analysis
      const projectInfo = await convex.query(api.projects.getProjectInternal, {
        projectId: widgetInfo.projectId,
      });

      if (projectInfo) {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
        const internalKey = process.env.INTERNAL_API_KEY || "";

        // Fire and forget - AI auto-analysis
        fetch(`${baseUrl}/api/ai/auto-analyze`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-internal-key": internalKey,
          },
          body: JSON.stringify({
            feedbackId: result.feedbackId,
            teamId: projectInfo.teamId,
            projectId: widgetInfo.projectId,
          }),
        }).catch((err) => {
          console.warn("Auto-analysis trigger failed:", err);
        });

        // Fire and forget - Automation rules evaluation
        fetch(`${baseUrl}/api/automation/trigger`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-internal-key": internalKey,
          },
          body: JSON.stringify({
            feedbackId: result.feedbackId,
            trigger: "new_feedback",
          }),
        }).catch((err) => {
          console.warn("Automation rules trigger failed:", err);
        });

        // Fire and forget - Notify team admins of new feedback
        fetch(`${baseUrl}/api/notifications/trigger-new-feedback`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-internal-key": internalKey,
          },
          body: JSON.stringify({
            feedbackId: result.feedbackId,
            feedbackTitle: title.trim(),
            feedbackDescription: description?.trim(),
            feedbackType: type,
            projectId: widgetInfo.projectId,
            projectName: projectInfo.name,
            teamId: projectInfo.teamId,
          }),
        }).catch((err) => {
          console.warn("New feedback notification trigger failed:", err);
        });
      }
    } catch (err) {
      console.warn("Failed to trigger background tasks:", err);
    }

    // Return success response
    return jsonResponse(
      {
        success: true,
        feedbackId: result.feedbackRef,
        id: result.feedbackId,
      },
      201,
      {
        "X-RateLimit-Limit": ipRateLimit.limit.toString(),
        "X-RateLimit-Remaining": ipRateLimit.remaining.toString(),
        "X-RateLimit-Reset": ipRateLimit.resetAt.toString(),
      }
    );
  } catch (error) {
    console.error("Widget submission error:", error);

    // Determine error type and return appropriate response
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    if (
      errorMessage.includes("Invalid widget key") ||
      errorMessage.includes("Widget not found")
    ) {
      return jsonResponse({ error: "Invalid widget key" }, 404);
    }

    if (errorMessage.includes("Widget is not active")) {
      return jsonResponse({ error: "Widget is not active" }, 403);
    }

    return jsonResponse(
      { error: "Internal server error", message: errorMessage },
      500
    );
  }
}

/**
 * OPTIONS handler for CORS preflight
 */
export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    },
  });
}
