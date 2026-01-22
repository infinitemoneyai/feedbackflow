import { NextRequest } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  apiError,
  apiSuccess,
  checkApiRateLimit,
  addRateLimitHeaders,
} from "@/lib/api-auth";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/**
 * GET /api/v1/feedback
 * List feedback for the team with optional filters
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

    // Check rate limit using key prefix
    const keyPrefix = apiKey.slice(0, 8);
    const rateLimit = checkApiRateLimit(keyPrefix);

    if (!rateLimit.success) {
      return apiError("Rate limit exceeded", 429, {
        "Retry-After": Math.ceil((rateLimit.resetAt - Date.now()) / 1000).toString(),
        ...addRateLimitHeaders({}, rateLimit),
      });
    }

    // Check permissions
    if (!validation.permissions?.includes("read:feedback")) {
      return apiError("Insufficient permissions. Required: read:feedback", 403);
    }

    // Update last used timestamp
    if (validation.keyId) {
      convex.mutation(api.restApiKeys.updateApiKeyLastUsed, {
        keyId: validation.keyId,
      }).catch(() => {
        // Ignore errors updating last used timestamp
      });
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get("projectId") as Id<"projects"> | null;
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const priority = searchParams.get("priority");
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    // Fetch feedback
    const result = await convex.query(api.restApiKeys.getFeedbackForApi, {
      teamId: validation.teamId!,
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
          hasMore: (result.offset ?? 0) + result.feedback.length < result.total,
        },
      },
      200,
      addRateLimitHeaders({}, rateLimit)
    );
  } catch (error) {
    console.error("API error:", error);
    return apiError("Internal server error", 500);
  }
}
