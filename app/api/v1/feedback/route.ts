import { NextRequest } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  withApiKey,
  apiError,
  apiSuccess,
  addRateLimitHeaders,
} from "@/lib/api-auth";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/**
 * GET /api/v1/feedback
 * List feedback for the team with optional filters
 */
export async function GET(request: NextRequest) {
  return withApiKey(request, "read:feedback", async (auth) => {
    try {
      const searchParams = request.nextUrl.searchParams;
      const projectId = searchParams.get("projectId") as Id<"projects"> | null;
      const status = searchParams.get("status");
      const type = searchParams.get("type");
      const priority = searchParams.get("priority");
      const limit = parseInt(searchParams.get("limit") || "50", 10);
      const offset = parseInt(searchParams.get("offset") || "0", 10);

      const result = await convex.query(api.restApiKeys.getFeedbackForApi, {
        teamId: auth.teamId,
        projectId: projectId || undefined,
        status: status || undefined,
        type: type || undefined,
        priority: priority || undefined,
        limit: Math.min(limit, 100), // Cap at 100
        offset,
      });

      return apiSuccess(
        {
          data: result.feedback,
          pagination: {
            total: result.total,
            limit: result.limit,
            offset: result.offset ?? 0,
            hasMore:
              (result.offset ?? 0) + result.feedback.length < result.total,
          },
        },
        200,
        addRateLimitHeaders({}, auth.rateLimit)
      );
    } catch (error) {
      console.error("API error:", error);
      return apiError("Internal server error", 500);
    }
  });
}
