import { NextRequest, NextResponse } from "next/server";
import {
  testLinearConnection,
  getLinearTeams,
  getLinearProjects,
  getLinearLabels,
  createLinearIssue,
  formatFeedbackForLinear,
  mapPriorityToLinear,
} from "@/lib/integrations/linear";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, apiKey, teamId, feedback, linearTeamId, linearProjectId, linearLabelIds } = body;

    switch (action) {
      case "test": {
        if (!apiKey) {
          return NextResponse.json({ error: "API key is required" }, { status: 400 });
        }
        const result = await testLinearConnection(apiKey);
        return NextResponse.json(result);
      }

      case "getTeams": {
        if (!apiKey) {
          return NextResponse.json({ error: "API key is required" }, { status: 400 });
        }
        const teams = await getLinearTeams(apiKey);
        return NextResponse.json({ teams });
      }

      case "getProjects": {
        if (!apiKey || !teamId) {
          return NextResponse.json({ error: "API key and team ID are required" }, { status: 400 });
        }
        const projects = await getLinearProjects(apiKey, teamId);
        return NextResponse.json({ projects });
      }

      case "getLabels": {
        if (!apiKey || !teamId) {
          return NextResponse.json({ error: "API key and team ID are required" }, { status: 400 });
        }
        const labels = await getLinearLabels(apiKey, teamId);
        return NextResponse.json({ labels });
      }

      case "createIssue": {
        if (!apiKey || !linearTeamId || !feedback) {
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
        const issue = await createLinearIssue(apiKey, {
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
