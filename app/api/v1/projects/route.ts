import { NextRequest } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import {
  withApiKey,
  apiError,
  apiSuccess,
  addRateLimitHeaders,
} from "@/lib/api-auth";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/**
 * GET /api/v1/projects
 * List all projects for the team
 */
export async function GET(request: NextRequest) {
  return withApiKey(request, "read:projects", async (auth) => {
    try {
      const projects = await convex.query(api.restApiKeys.getProjectsForApi, {
        teamId: auth.teamId,
      });

      return apiSuccess(
        { data: projects },
        200,
        addRateLimitHeaders({}, auth.rateLimit)
      );
    } catch (error) {
      console.error("API error:", error);
      return apiError("Internal server error", 500);
    }
  });
}
