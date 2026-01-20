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
 * GET /api/v1/feedback/:id
 * Get a single feedback item by ID
 */
export async function GET(request: NextRequest, context: RouteContext) {
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
    if (!validation.permissions?.includes("read:feedback")) {
      return apiError("Insufficient permissions. Required: read:feedback", 403);
    }

    // Update last used timestamp
    if (validation.keyId) {
      convex.mutation(api.restApiKeys.updateApiKeyLastUsed, {
        keyId: validation.keyId,
      }).catch(() => {
        // Ignore errors
      });
    }

    // Fetch feedback by ID
    const feedback = await convex.query(api.restApiKeys.getFeedbackByIdForApi, {
      feedbackId: feedbackId as Id<"feedback">,
      teamId: validation.teamId!,
    });

    if (!feedback) {
      return apiError("Feedback not found", 404);
    }

    return apiSuccess(
      { data: feedback },
      200,
      addRateLimitHeaders({}, rateLimit)
    );
  } catch (error) {
    console.error("API error:", error);
    return apiError("Internal server error", 500);
  }
}

/**
 * PATCH /api/v1/feedback/:id
 * Update a feedback item
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
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

    // Validate fields
    const validStatuses = ["new", "triaging", "drafted", "exported", "resolved"];
    const validPriorities = ["low", "medium", "high", "critical"];

    if (body.status && !validStatuses.includes(body.status)) {
      return apiError(
        `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
        400
      );
    }

    if (body.priority && !validPriorities.includes(body.priority)) {
      return apiError(
        `Invalid priority. Must be one of: ${validPriorities.join(", ")}`,
        400
      );
    }

    if (body.tags && !Array.isArray(body.tags)) {
      return apiError("Tags must be an array of strings", 400);
    }

    // Update feedback
    await convex.mutation(api.restApiKeys.updateFeedbackForApi, {
      feedbackId: feedbackId as Id<"feedback">,
      teamId: validation.teamId!,
      status: body.status,
      priority: body.priority,
      tags: body.tags,
    });

    // Fetch updated feedback
    const updatedFeedback = await convex.query(
      api.restApiKeys.getFeedbackByIdForApi,
      {
        feedbackId: feedbackId as Id<"feedback">,
        teamId: validation.teamId!,
      }
    );

    return apiSuccess(
      { data: updatedFeedback, message: "Feedback updated successfully" },
      200,
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
