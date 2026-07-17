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
 * POST /api/v1/feedback/:id/comments
 * Add a comment to a feedback item
 */
export async function POST(request: NextRequest, context: RouteContext) {
  const { id: feedbackId } = await context.params;

  return withApiKey(request, "write:feedback", async (auth) => {
    try {
      // Parse request body
      const body = await request.json();

      if (!body.content || typeof body.content !== "string") {
        return apiError("Comment content is required", 400);
      }

      if (body.content.trim().length === 0) {
        return apiError("Comment content cannot be empty", 400);
      }

      if (body.content.length > 10000) {
        return apiError(
          "Comment content exceeds maximum length (10000 characters)",
          400
        );
      }

      // Add comment
      const result = await convex.mutation(api.restApiKeys.addCommentForApi, {
        feedbackId: feedbackId as Id<"feedback">,
        teamId: auth.teamId,
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
