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

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * POST /api/v1/feedback/:id/comments
 * Add a comment to a feedback item
 */
export async function POST(request: NextRequest, context: RouteContext) {
  const { id: feedbackId } = await context.params;

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
    if (!validation.permissions?.includes("write:feedback")) {
      return apiError("Insufficient permissions. Required: write:feedback", 403);
    }

    // Update last used timestamp
    if (validation.keyId) {
      convex.mutation(api.restApiKeys.updateApiKeyLastUsed, {
        keyId: validation.keyId,
      }).catch(() => {
        // Ignore errors
      });
    }

    // Parse request body
    const body = await request.json();

    if (!body.content || typeof body.content !== "string") {
      return apiError("Comment content is required", 400);
    }

    if (body.content.trim().length === 0) {
      return apiError("Comment content cannot be empty", 400);
    }

    if (body.content.length > 10000) {
      return apiError("Comment content exceeds maximum length (10000 characters)", 400);
    }

    // Add comment
    const result = await convex.mutation(api.restApiKeys.addCommentForApi, {
      feedbackId: feedbackId as Id<"feedback">,
      teamId: validation.teamId!,
      content: body.content.trim(),
      authorName: body.authorName,
    });

    return apiSuccess(
      {
        data: {
          commentId: result.commentId,
          content: body.content.trim(),
          createdAt: Date.now(),
        },
        message: "Comment added successfully",
      },
      201,
      addRateLimitHeaders({}, rateLimit)
    );
  } catch (error) {
    console.error("API error:", error);
    if (error instanceof Error && error.message.includes("not found")) {
      return apiError("Feedback not found", 404);
    }
    return apiError("Internal server error", 500);
  }
}
