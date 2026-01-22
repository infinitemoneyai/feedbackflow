import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import {
  testLinearConnection,
  getLinearTeams,
  getLinearProjects,
  getLinearLabels,
  createLinearIssue,
  formatFeedbackForLinear,
  mapPriorityToLinear,
} from "@/lib/integrations/linear";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, apiKey, teamId: convexTeamId, feedback, linearTeamId, linearProjectId, linearLabelIds } = body;

    // Helper to get API key (either from request or from stored integration)
    const getApiKey = async (): Promise<string | null> => {
      if (apiKey && apiKey !== "stored") {
        return apiKey;
      }
      
      // Retrieve stored key from Convex
      if (convexTeamId) {
        const { userId } = await auth();
        if (!userId) {
          console.error("[linear-api] No userId from auth");
          return null;
        }
        
        const integration = await convex.query(api.integrations.getLinearIntegrationForApi, { 
          teamId: convexTeamId,
          userId 
        });
        
        if (!integration) {
          console.error("[linear-api] No integration found");
          return null;
        }
        
        return integration?.decryptedKey || null;
      }
      
      console.error("[linear-api] No teamId provided");
      return null;
    };

    switch (action) {
      case "test": {
        const key = await getApiKey();
        if (!key) {
          return NextResponse.json({ error: "API key is required" }, { status: 400 });
        }
        const result = await testLinearConnection(key);
        return NextResponse.json(result);
      }

      case "getTeams": {
        const key = await getApiKey();
        if (!key) {
          return NextResponse.json({ error: "API key is required" }, { status: 400 });
        }
        const teams = await getLinearTeams(key);
        return NextResponse.json({ teams });
      }

      case "getProjects": {
        const key = await getApiKey();
        if (!key || !linearTeamId) {
          return NextResponse.json({ error: "API key and team ID are required" }, { status: 400 });
        }
        const projects = await getLinearProjects(key, linearTeamId);
        return NextResponse.json({ projects });
      }

      case "getLabels": {
        const key = await getApiKey();
        if (!key || !linearTeamId) {
          return NextResponse.json({ error: "API key and team ID are required" }, { status: 400 });
        }
        const labels = await getLinearLabels(key, linearTeamId);
        return NextResponse.json({ labels });
      }

      case "createIssue": {
        const key = await getApiKey();
        if (!key || !linearTeamId || !feedback) {
          return NextResponse.json(
            { error: "API key, Linear team ID, and feedback are required" },
            { status: 400 }
          );
        }

        // Format the description
        const description = formatFeedbackForLinear(feedback);

        // Get title from ticket draft if available, otherwise use feedback title
        const title = feedback.ticketDraft?.title || feedback.title;

        // Create the issue
        const issue = await createLinearIssue(key, {
          teamId: linearTeamId,
          title,
          description,
          priority: mapPriorityToLinear(feedback.priority),
          projectId: linearProjectId || undefined,
          labelIds: linearLabelIds || undefined,
        });

        return NextResponse.json({ issue });
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Linear API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An error occurred" },
      { status: 500 }
    );
  }
}
