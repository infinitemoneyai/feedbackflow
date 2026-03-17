import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET(request: NextRequest): Promise<NextResponse> {
  const sessionToken = request.cookies.get("review_session")?.value;
  if (!sessionToken) {
    return NextResponse.json({ valid: false });
  }

  try {
    const session = await convex.query(
      api.reviewers.validateReviewerSession,
      { sessionToken }
    );

    if (!session) {
      return NextResponse.json({ valid: false });
    }

    return NextResponse.json({
      valid: true,
      siteUrl: session.siteUrl,
      projectId: session.projectId,
      teamId: session.teamId,
      reviewLinkId: session.reviewLinkId,
      sessionToken,
    });
  } catch {
    return NextResponse.json({ valid: false });
  }
}
