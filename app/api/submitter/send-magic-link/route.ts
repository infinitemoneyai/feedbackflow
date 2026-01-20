/**
 * API endpoint to send a magic link email for submitter status access
 * POST /api/submitter/send-magic-link
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { sendMagicLinkEmail } from "@/lib/email/service";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { feedbackId } = body;

    if (!feedbackId) {
      return NextResponse.json(
        { error: "feedbackId is required" },
        { status: 400 }
      );
    }

    // Generate magic link token via Convex
    const result = await convex.mutation(api.submitterPortal.requestMagicLink, {
      feedbackId: feedbackId as Id<"feedback">,
    });

    // Get project info for the email
    const feedback = await convex.query(api.feedback.getFeedbackInternal, {
      feedbackId: feedbackId as Id<"feedback">,
    });

    if (!feedback) {
      return NextResponse.json(
        { error: "Feedback not found" },
        { status: 404 }
      );
    }

    // Get project name
    let projectName: string | undefined;
    try {
      // Since we don't have direct project access, we'll include it in a separate query
      // For now, we'll skip the project name in the email
      projectName = undefined;
    } catch {
      // Ignore project fetch errors
    }

    // Send the magic link email
    const emailResult = await sendMagicLinkEmail({
      recipientEmail: result.email,
      recipientName: feedback.submitterName,
      feedbackTitle: result.feedbackTitle,
      projectName,
      token: result.token,
      baseUrl: process.env.NEXT_PUBLIC_APP_URL,
    });

    if (!emailResult.success) {
      return NextResponse.json(
        { error: emailResult.error || "Failed to send email" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Magic link sent to ${result.email}`,
    });
  } catch (error) {
    console.error("Send magic link error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to send magic link",
      },
      { status: 500 }
    );
  }
}
