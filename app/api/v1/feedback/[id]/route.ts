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

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/v1/feedback/:id
 * Get a single feedback item by ID
 */
export async function GET(request: NextRequest, context: RouteContext) {
  const { id: feedbackId } = await context.params;

  return withApiKey(request, "read:feedback", async (auth) => {
    try {
      const feedback = await convex.query(
        api.restApiKeys.getFeedbackByIdForApi,
        {
          feedbackId: feedbackId as Id<"feedback">,
          teamId: auth.teamId,
        }
      );

      if (!feedback) {
        return apiError("Feedback not found", 404);
      }

      return apiSuccess(
        { data: feedback },
        200,
        addRateLimitHeaders({}, auth.rateLimit)
      );
    } catch (error) {
      console.error("API error:", error);
      return apiError("Internal server error", 500);
    }
  });
}

/**
 * PATCH /api/v1/feedback/:id
 * Update a feedback item
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id: feedbackId } = await context.params;

  return withApiKey(request, "write:feedback", async (auth) => {
    try {
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
        teamId: auth.teamId,
        status: body.status,
        priority: body.priority,
        tags: body.tags,
      });

      // Fetch updated feedback
      const updatedFeedback = await convex.query(
        api.restApiKeys.getFeedbackByIdForApi,
        {
          feedbackId: feedbackId as Id<"feedback">,
          teamId: auth.teamId,
        }
      );

      return apiSuccess(
        { data: updatedFeedback, message: "Feedback updated successfully" },
        200,
        addRateLimitHeaders({}, auth.rateLimit)
      );
    } catch (error) {
      console.error("API error:", error);
      if (error instanceof Error && error.message.includes("not found")) {
        return apiError("Feedback not found", 404);
      }
      return apiError("Internal server error", 500);
    }
  });
}
