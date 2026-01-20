import { NextRequest, NextResponse } from "next/server";
import {
  testNotionConnection,
  getNotionDatabases,
  getNotionDatabaseProperties,
  createNotionPage,
} from "@/lib/integrations/notion";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      action,
      apiKey,
      databaseId,
      feedback,
    } = body;

    switch (action) {
      case "test": {
        if (!apiKey) {
          return NextResponse.json(
            { error: "API key is required" },
            { status: 400 }
          );
        }
        const result = await testNotionConnection(apiKey);
        return NextResponse.json(result);
      }

      case "getDatabases": {
        if (!apiKey) {
          return NextResponse.json(
            { error: "API key is required" },
            { status: 400 }
          );
        }
        const databases = await getNotionDatabases(apiKey);
        return NextResponse.json({ databases });
      }

      case "getDatabaseProperties": {
        if (!apiKey || !databaseId) {
          return NextResponse.json(
            { error: "API key and database ID are required" },
            { status: 400 }
          );
        }
        const properties = await getNotionDatabaseProperties(apiKey, databaseId);
        return NextResponse.json({ properties });
      }

      case "createPage": {
        if (!apiKey || !databaseId || !feedback) {
          return NextResponse.json(
            { error: "API key, database ID, and feedback are required" },
            { status: 400 }
          );
        }

        const page = await createNotionPage(apiKey, {
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
