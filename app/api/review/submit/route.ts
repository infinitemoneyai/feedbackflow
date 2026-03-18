import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const {
      projectId,
      teamId,
      type,
      title,
      description,
      screenshotDataUrl,
      url,
      browserInfo,
      osInfo,
      screenWidth,
      screenHeight,
      reviewLinkId,
      sessionToken,
    } = body;

    if (!projectId || !teamId || !type || !title) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Auth: Clerk session or review session token
    const { userId } = await auth();
    let reviewerEmail: string | undefined;

    if (!userId) {
      // External reviewer — validate session token
      if (!sessionToken) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const session = await convex.query(
        api.reviewers.validateReviewerSession,
        { sessionToken }
      );
      if (!session) {
        return NextResponse.json({ error: "Invalid session" }, { status: 401 });
      }
      reviewerEmail = session.email;
    }

    // Upload screenshot if provided
    let screenshotStorageId: string | undefined;
    if (screenshotDataUrl) {
      const base64Data = screenshotDataUrl.split(",")[1];
      const binaryData = Buffer.from(base64Data, "base64");
      const blob = new Blob([binaryData], { type: "image/png" });

      const uploadUrl = await convex.mutation(
        api.feedback.generateUploadUrl,
        {}
      );
      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": "image/png" },
        body: blob,
      });
      const { storageId } = await uploadResponse.json();
      screenshotStorageId = storageId;
    }

    const result = await convex.mutation(api.feedback.submitFromReview, {
      projectId,
      teamId,
      type,
      title,
      description,
      screenshotStorageId: screenshotStorageId as any,
      url,
      browserInfo,
      osInfo,
      screenWidth: screenWidth ? Number(screenWidth) : undefined,
      screenHeight: screenHeight ? Number(screenHeight) : undefined,
      reviewLinkId: reviewLinkId || undefined,
      reviewerEmail: reviewerEmail || undefined,
    });

    // Fire-and-forget: trigger AI analysis, automations, and notifications
    // (mirrors app/api/widget/submit/route.ts)
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const internalKey = process.env.INTERNAL_API_KEY || "";
    const feedbackId = result.feedbackId;

    fetch(`${baseUrl}/api/ai/auto-analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-key": internalKey,
      },
      body: JSON.stringify({ feedbackId, teamId, projectId }),
    }).catch((err) => {
      console.warn("Auto-analysis trigger failed:", err);
    });

    fetch(`${baseUrl}/api/automation/trigger`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-key": internalKey,
      },
      body: JSON.stringify({ feedbackId, trigger: "new_feedback" }),
    }).catch((err) => {
      console.warn("Automation rules trigger failed:", err);
    });

    fetch(`${baseUrl}/api/notifications/trigger-new-feedback`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-key": internalKey,
      },
      body: JSON.stringify({
        feedbackId,
        feedbackTitle: title,
        feedbackType: type,
        projectId,
        teamId,
      }),
    }).catch((err) => {
      console.warn("New feedback notification trigger failed:", err);
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("Review submit error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Submission failed" },
      { status: 500 }
    );
  }
}
