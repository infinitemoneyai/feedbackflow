import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  analyzeFeedback,
  normalizeAnalysisResult,
  type AIProvider,
} from "@/lib/ai";

function getConvexClient() {
  return new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
}

/**
 * Analyze feedback using AI
 * POST /api/ai/analyze
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { feedbackId, teamId, provider, model } = body;

    if (!feedbackId) {
      return NextResponse.json(
        { error: "feedbackId is required" },
        { status: 400 }
      );
    }

    if (!teamId) {
      return NextResponse.json(
        { error: "teamId is required" },
        { status: 400 }
      );
    }

    // Get the feedback data from Convex
    const convex = getConvexClient();

    // Note: We use the Clerk token to authenticate with Convex
    const authToken = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (authToken) {
      convex.setAuth(authToken);
    }

    // Get feedback details
    const feedback = await convex.query(api.feedback.getFeedback, {
      feedbackId: feedbackId as Id<"feedback">,
    });

    if (!feedback) {
      return NextResponse.json(
        { error: "Feedback not found or access denied" },
        { status: 404 }
      );
    }

    // Get AI configuration for the team
    const aiConfig = await convex.query(api.ai.getTeamAiConfig, {
      teamId: teamId as Id<"teams">,
    });

    if (!aiConfig?.isConfigured) {
      return NextResponse.json(
        { error: "No AI provider configured. Please add an API key in settings." },
        { status: 400 }
      );
    }

    // Determine which provider/model to use
    const useProvider = (provider || aiConfig.preferredProvider) as AIProvider;
    const useModel = model || aiConfig.preferredModel || "";

    // Get the decrypted API key
    const apiKeyData = await convex.query(api.apiKeys.getDecryptedApiKey, {
      teamId: teamId as Id<"teams">,
      provider: useProvider,
    });

    if (!apiKeyData?.key) {
      return NextResponse.json(
        { error: `No valid ${useProvider} API key found` },
        { status: 400 }
      );
    }

    // Prepare feedback data for analysis
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

    // Fetch screenshot and convert to base64 if available (for vision models)
    let screenshotBase64: string | undefined;
    if (feedback.screenshotUrl) {
      try {
        const imageResponse = await fetch(feedback.screenshotUrl);
        if (imageResponse.ok) {
          const arrayBuffer = await imageResponse.arrayBuffer();
          screenshotBase64 = Buffer.from(arrayBuffer).toString("base64");
        }
      } catch (err) {
        console.warn("Failed to fetch screenshot for AI analysis:", err);
        // Continue without screenshot
      }
    }

    // Call the AI service
    const rawResult = await analyzeFeedback(
      useProvider,
      apiKeyData.key,
      useModel,
      feedbackData,
      screenshotBase64
    );

    // Normalize the result to ensure all fields are present
    const analysisResult = normalizeAnalysisResult(rawResult);

    // Store the analysis in Convex
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
      provider: useProvider,
      model: useModel,
    });

    return NextResponse.json({
      success: true,
      analysis: analysisResult,
      provider: useProvider,
      model: useModel,
    });
  } catch (error) {
    console.error("Error analyzing feedback:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Failed to analyze feedback";

    return NextResponse.json(
      { error: errorMessage, success: false },
      { status: 500 }
    );
  }
}
