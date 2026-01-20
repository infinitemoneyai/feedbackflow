/**
 * API route to send digest emails
 * Should be called by a cron job (daily at 9am, weekly on Mondays at 9am)
 */

import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { sendDigestEmail, type NotificationType } from "@/lib/email";

// Internal key for securing internal API calls
const INTERNAL_KEY = process.env.INTERNAL_API_KEY || "feedbackflow-internal-key";
// Cron secret for Vercel cron jobs
const CRON_SECRET = process.env.CRON_SECRET;

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL || "");

interface DigestRequest {
  frequency: "daily" | "weekly";
}

export async function POST(request: Request): Promise<Response> {
  try {
    // Verify authorization (either internal key or cron secret)
    const authHeader = request.headers.get("authorization");
    const internalKey = request.headers.get("x-internal-key");

    const isAuthorized =
      internalKey === INTERNAL_KEY ||
      (CRON_SECRET && authHeader === `Bearer ${CRON_SECRET}`);

    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as DigestRequest;
    const { frequency } = body;

    if (!frequency || !["daily", "weekly"].includes(frequency)) {
      return NextResponse.json(
        { error: "Invalid frequency. Must be 'daily' or 'weekly'" },
        { status: 400 }
      );
    }

    // Get all users who need digests
    const usersForDigest = await convex.query(
      api.notifications.getUsersForDigest,
      { frequency }
    );

    const results = {
      total: usersForDigest.length,
      sent: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Process each user
    for (const { user, preferences, pendingCount } of usersForDigest) {
      try {
        // Get pending digest items
        const pendingItems = await convex.query(
          api.notifications.getPendingDigestItems,
          { userId: user._id }
        );

        if (pendingItems.length === 0) {
          continue;
        }

        // Map items for email
        const emailItems = pendingItems.map((item: {
          notificationType: string;
          title: string;
          body?: string;
          projectName?: string;
          metadata?: { feedbackTitle?: string; actorName?: string; commentPreview?: string };
          feedbackId?: string;
        }) => ({
          type: item.notificationType as NotificationType,
          title: item.title,
          body: item.body,
          projectName: item.projectName,
          feedbackTitle: item.metadata?.feedbackTitle,
          actorName: item.metadata?.actorName,
          feedbackId: item.feedbackId?.toString(),
        }));

        // Send digest email
        const result = await sendDigestEmail({
          recipientEmail: user.email,
          recipientName: user.name,
          items: emailItems,
          period: frequency,
          unsubscribeToken: preferences.unsubscribeToken,
        });

        if (result.success) {
          // Mark items as sent
          await convex.mutation(api.notifications.markDigestItemsSent as any, {
            itemIds: pendingItems.map((item: { _id: string }) => item._id),
          });
          results.sent++;
        } else {
          results.failed++;
          results.errors.push(`${user.email}: ${result.error}`);
        }
      } catch (error) {
        results.failed++;
        results.errors.push(
          `${user.email}: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }

    return NextResponse.json({
      success: true,
      frequency,
      results,
    });
  } catch (error) {
    console.error("Digest send error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}

// Also support GET for simple cron pings (with query param)
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const frequency = url.searchParams.get("frequency") as "daily" | "weekly" | null;

  if (!frequency) {
    return NextResponse.json(
      { error: "Missing frequency query parameter" },
      { status: 400 }
    );
  }

  // Create a new request with the body
  const newRequest = new Request(request.url, {
    method: "POST",
    headers: request.headers,
    body: JSON.stringify({ frequency }),
  });

  return POST(newRequest);
}
