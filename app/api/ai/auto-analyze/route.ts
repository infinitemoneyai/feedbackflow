import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

function getConvexClient() {
  return new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
}

/**
 * Trigger auto-analysis for new feedback (called internally after widget submission)
 * POST /api/ai/auto-analyze
 *
 * This endpoint is used for background auto-analysis of new feedback.
 * It does not require authentication as it's called by the system.
 */
export async function POST(request: NextRequest) {
  try {
    // Verify internal API key for security
    const authHeader = request.headers.get("x-internal-key");
    const expectedKey = process.env.INTERNAL_API_KEY;

    // Only allow if internal key is configured and matches
    if (expectedKey && authHeader !== expectedKey) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { feedbackId, teamId, projectId } = body;

    if (!feedbackId || !teamId) {
      return NextResponse.json(
        { error: "feedbackId and teamId are required" },
        { status: 400 }
      );
    }

    const convex = getConvexClient();

    // Check if auto-triage is enabled for the project
    if (projectId) {
      const project = await convex.query(api.projects.getProjectInternal, {
        projectId: projectId as Id<"projects">,
      });

      // If project exists and auto-triage is not enabled, skip
      if (project && !project.settings?.autoTriage) {
        return NextResponse.json({
          success: true,
          skipped: true,
          reason: "Auto-triage is not enabled for this project",
        });
      }
    }

    // Check if AI is configured for the team
    const aiConfig = await convex.query(api.ai.getTeamAiConfig, {
      teamId: teamId as Id<"teams">,
    });

    if (!aiConfig?.isConfigured) {
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: "AI is not configured for this team",
      });
    }

    // Get the API key
    const apiKeyData = await convex.query(api.apiKeys.getDecryptedApiKey, {
      teamId: teamId as Id<"teams">,
      provider: aiConfig.preferredProvider!,
    });

    if (!apiKeyData?.key) {
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: "No valid API key found",
      });
    }

    // Get feedback for analysis
    const feedback = await convex.query(api.feedback.getFeedbackInternal, {
      feedbackId: feedbackId as Id<"feedback">,
    });

    if (!feedback) {
      return NextResponse.json({
        success: false,
        error: "Feedback not found",
      });
    }

    // Perform the analysis
    const { analyzeFeedback, normalizeAnalysisResult } = await import("@/lib/ai");

    const feedbackData = {
      title: feedback.title,
      description: feedback.description,
      type: feedback.type as "bug" | "feature",
      screenshotUrl: feedback.screenshotUrl,
      metadata: {
        browser: feedback.metadata.browser,
        os: feedback.metadata.os,
        url: feedback.metadata.url,
        screenWidth: feedback.metadata.screenWidth,
        screenHeight: feedback.metadata.screenHeight,
      },
    };

    // Fetch screenshot for vision analysis if available
    let screenshotBase64: string | undefined;
    if (feedback.screenshotUrl) {
      try {
        const imageResponse = await fetch(feedback.screenshotUrl);
        if (imageResponse.ok) {
          const arrayBuffer = await imageResponse.arrayBuffer();
          screenshotBase64 = Buffer.from(arrayBuffer).toString("base64");
        }
      } catch (err) {
        console.warn("Failed to fetch screenshot for auto-analysis:", err);
      }
    }

    // Call AI
    const rawResult = await analyzeFeedback(
      aiConfig.preferredProvider!,
      apiKeyData.key,
      aiConfig.preferredModel!,
      feedbackData,
      screenshotBase64
    );

    const analysisResult = normalizeAnalysisResult(rawResult);

    // Store the analysis
    await convex.mutation(api.ai.storeAnalysis, {
      feedbackId: feedbackId as Id<"feedback">,
      analysis: {
        suggestedType: analysisResult.suggestedType,
        typeConfidence: analysisResult.typeConfidence,
        suggestedPriority: analysisResult.suggestedPriority,
        priorityConfidence: analysisResult.priorityConfidence,
        suggestedTags: analysisResult.suggestedTags,
        summary: analysisResult.summary,
        affectedComponent: analysisResult.affectedComponent,
        potentialCauses: analysisResult.potentialCauses,
        suggestedSolutions: analysisResult.suggestedSolutions,
      },
      provider: aiConfig.preferredProvider!,
      model: aiConfig.preferredModel!,
    });

    return NextResponse.json({
      success: true,
      analysis: analysisResult,
    });
  } catch (error) {
    console.error("Auto-analysis error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Auto-analysis failed",
      },
      { status: 500 }
    );
  }
}
