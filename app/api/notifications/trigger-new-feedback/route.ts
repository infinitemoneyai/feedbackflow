/**
 * API route to trigger notifications for new feedback
 * Notifies all team members who have new_feedback notifications enabled
 */

import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

// Internal key for securing internal API calls
const INTERNAL_KEY = process.env.INTERNAL_API_KEY || "feedbackflow-internal-key";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL || "");

interface TriggerNewFeedbackRequest {
  feedbackId: string;
  feedbackTitle: string;
  feedbackDescription?: string;
  feedbackType: "bug" | "feature";
  projectId: string;
  projectName: string;
  teamId: string;
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

    const body = await request.json() as TriggerNewFeedbackRequest;
    const {
      feedbackId,
      feedbackTitle,
      feedbackDescription,
      feedbackType,
      projectName,
      teamId,
    } = body;

    if (!feedbackId || !teamId) {
      return NextResponse.json(
        { error: "Missing required fields: feedbackId, teamId" },
        { status: 400 }
      );
    }

    // Get all team members
    const teamMembers = await convex.query(api.teams.getTeamMembersPublic, {
      teamId: teamId as Id<"teams">,
    });

    if (!teamMembers || teamMembers.length === 0) {
      return NextResponse.json({
        success: true,
        notified: 0,
        reason: "No team members found",
      });
    }

    // Send notifications to all team members
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "";
    const internalKey = process.env.INTERNAL_API_KEY || "";

    interface TeamMember {
      userId: string;
      email: string;
      name: string;
      role: string;
    }

    const notificationPromises = (teamMembers as TeamMember[]).map((member) =>
      fetch(`${baseUrl}/api/notifications/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-key": internalKey,
        },
        body: JSON.stringify({
          userId: member.userId,
          type: "new_feedback",
          feedbackId,
          feedbackTitle,
          feedbackDescription,
          feedbackType,
          projectName,
        }),
      }).catch((err) => {
        console.error(`Failed to notify user ${member.userId}:`, err);
        return null;
      })
    );

    await Promise.all(notificationPromises);

    return NextResponse.json({
      success: true,
      notified: teamMembers.length,
    });
  } catch (error) {
    console.error("Trigger new feedback notification error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}
