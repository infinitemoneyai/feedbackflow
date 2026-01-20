import { NextRequest } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import {
  apiError,
  apiSuccess,
  checkApiRateLimit,
  addRateLimitHeaders,
} from "@/lib/api-auth";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/**
 * GET /api/v1/projects
 * List all projects for the team
 */
export async function GET(request: NextRequest) {
  // Extract API key from Authorization header
  const authHeader = request.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return apiError("Missing or invalid Authorization header", 401);
  }

  const apiKey = authHeader.slice(7);

  if (!apiKey.startsWith("ff_")) {
    return apiError("Invalid API key format", 401);
  }

  // Validate the API key
  try {
    const validation = await convex.query(api.restApiKeys.validateApiKeyPublic, {
      key: apiKey,
    });

    if (!validation.valid) {
      return apiError(validation.error || "Invalid API key", 401);
    }

    // Check rate limit
    const keyPrefix = apiKey.slice(0, 8);
    const rateLimit = checkApiRateLimit(keyPrefix);

    if (!rateLimit.success) {
      return apiError("Rate limit exceeded", 429, {
        "Retry-After": Math.ceil((rateLimit.resetAt - Date.now()) / 1000).toString(),
        ...addRateLimitHeaders({}, rateLimit),
      });
    }

    // Check permissions
    if (!validation.permissions?.includes("read:projects")) {
      return apiError("Insufficient permissions. Required: read:projects", 403);
    }

    // Update last used timestamp
    if (validation.keyId) {
      convex.mutation(api.restApiKeys.updateApiKeyLastUsed, {
        keyId: validation.keyId,
      }).catch(() => {
        // Ignore errors
      });
    }

    // Fetch projects
    const projects = await convex.query(api.restApiKeys.getProjectsForApi, {
      teamId: validation.teamId!,
    });

    return apiSuccess(
      { data: projects },
      200,
      addRateLimitHeaders({}, rateLimit)
    );
  } catch (error) {
    console.error("API error:", error);
    return apiError("Internal server error", 500);
  }
}
