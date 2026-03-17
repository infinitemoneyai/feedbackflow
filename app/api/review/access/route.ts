import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { slug, email, password } = await request.json();

    if (!slug || !email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Fetch the review link
    const link = await convex.query(api.reviewLinks.getReviewLink, { slug });
    if (!link) {
      return NextResponse.json(
        { error: "Review link not found or expired" },
        { status: 404 }
      );
    }

    // Verify password if required
    if (link.hasPassword) {
      if (!password) {
        return NextResponse.json(
          { error: "Password required" },
          { status: 401 }
        );
      }
      const passwordValid = await convex.mutation(
        api.reviewLinks.verifyReviewLinkPassword,
        { slug, password }
      );
      if (!passwordValid) {
        return NextResponse.json(
          { error: "Invalid password" },
          { status: 401 }
        );
      }
    }

    // Create reviewer session
    const { sessionToken } = await convex.mutation(
      api.reviewers.createReviewerSession,
      {
        reviewLinkId: link._id,
        email,
      }
    );

    // Set session cookie
    const response = NextResponse.json({
      success: true,
      siteUrl: link.siteUrl,
      projectId: link.projectId,
      teamId: link.teamId,
      reviewLinkId: link._id,
    });

    const maxAge = link.expiresAt
      ? Math.floor((link.expiresAt - Date.now()) / 1000)
      : 30 * 24 * 60 * 60; // 30 days

    response.cookies.set("review_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Review access error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Access failed" },
      { status: 500 }
    );
  }
}
