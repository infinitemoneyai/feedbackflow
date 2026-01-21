import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import {
  testNotionConnection,
  getNotionDatabases,
  getNotionDatabaseProperties,
  createNotionPage,
} from "@/lib/integrations/notion";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      action,
      apiKey,
      teamId,
      databaseId,
      feedback,
    } = body;

    // Helper to get API key (either from request or from stored integration)
    const getApiKey = async (): Promise<string | null> => {
      if (apiKey && apiKey !== "stored") {
        console.log("[notion-api] Using provided API key");
        return apiKey;
      }
      
      // Retrieve stored key from Convex
      if (teamId) {
        console.log("[notion-api] Retrieving stored key for teamId:", teamId);
        const { userId } = await auth();
        if (!userId) {
          console.error("[notion-api] No userId from auth");
          return null;
        }
        
        console.log("[notion-api] Querying Convex for userId:", userId);
        const integration = await convex.query(api.integrations.getNotionIntegrationForApi, { 
          teamId,
          userId 
        });
        
        if (!integration) {
          console.error("[notion-api] No integration found");
          return null;
        }
        
        console.log("[notion-api] Integration found, has key:", !!integration.decryptedKey);
        return integration?.decryptedKey || null;
      }
      
      console.error("[notion-api] No teamId provided");
      return null;
    };

    switch (action) {
      case "test": {
        const key = await getApiKey();
        if (!key) {
          return NextResponse.json(
            { error: "API key is required" },
            { status: 400 }
          );
        }
        const result = await testNotionConnection(key);
        return NextResponse.json(result);
      }

      case "getDatabases": {
        const key = await getApiKey();
        if (!key) {
          return NextResponse.json(
            { error: "API key is required" },
            { status: 400 }
          );
        }
        const databases = await getNotionDatabases(key);
        return NextResponse.json({ databases });
      }

      case "getDatabaseProperties": {
        const key = await getApiKey();
        if (!key || !databaseId) {
          return NextResponse.json(
            { error: "API key and database ID are required" },
            { status: 400 }
          );
        }
        const properties = await getNotionDatabaseProperties(key, databaseId);
        return NextResponse.json({ properties });
      }

      case "createPage": {
        const key = await getApiKey();
        if (!key || !databaseId || !feedback) {
          return NextResponse.json(
            { error: "API key, database ID, and feedback are required" },
            { status: 400 }
          );
        }

        const page = await createNotionPage(key, {
          databaseId,
          title: feedback.title,
          description: feedback.description || "",
          type: feedback.type,
          priority: feedback.priority,
          tags: feedback.tags || [],
          screenshotUrl: feedback.screenshotUrl,
          recordingUrl: feedback.recordingUrl,
          metadata: feedback.metadata,
          submitterName: feedback.submitterName,
          submitterEmail: feedback.submitterEmail,
          ticketDraft: feedback.ticketDraft,
        });

        return NextResponse.json({ page });
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Notion API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An error occurred" },
      { status: 500 }
    );
  }
}
