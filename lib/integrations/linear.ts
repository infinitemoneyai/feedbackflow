import { LinearClient } from "@linear/sdk";

export interface LinearTeam {
  id: string;
  name: string;
  key: string;
}

export interface LinearProject {
  id: string;
  name: string;
  description?: string;
}

export interface LinearLabel {
  id: string;
  name: string;
  color: string;
}

export interface LinearIssue {
  id: string;
  identifier: string;
  title: string;
  url: string;
}

export interface CreateIssueParams {
  teamId: string;
  title: string;
  description: string;
  priority?: number; // 0 = No priority, 1 = Urgent, 2 = High, 3 = Normal, 4 = Low
  projectId?: string;
  labelIds?: string[];
}

/**
 * Test if a Linear API key is valid
 */
export async function testLinearConnection(apiKey: string): Promise<{
  valid: boolean;
  error?: string;
  organization?: string;
}> {
  try {
    const client = new LinearClient({ apiKey });
    const viewer = await client.viewer;
    const organization = await viewer.organization;

    return {
      valid: true,
      organization: organization?.name || "Unknown",
    };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Failed to connect to Linear",
    };
  }
}

/**
 * Get all teams for the authenticated user
 */
export async function getLinearTeams(apiKey: string): Promise<LinearTeam[]> {
  const client = new LinearClient({ apiKey });
  const teams = await client.teams();

  return teams.nodes.map((team) => ({
    id: team.id,
    name: team.name,
    key: team.key,
  }));
}

/**
 * Get projects for a specific team
 */
export async function getLinearProjects(
  apiKey: string,
  teamId: string
): Promise<LinearProject[]> {
  const client = new LinearClient({ apiKey });
  const team = await client.team(teamId);
  const projects = await team.projects();

  return projects.nodes.map((project) => ({
    id: project.id,
    name: project.name,
    description: project.description || undefined,
  }));
}

/**
 * Get labels for a specific team
 */
export async function getLinearLabels(
  apiKey: string,
  teamId: string
): Promise<LinearLabel[]> {
  const client = new LinearClient({ apiKey });
  const team = await client.team(teamId);
  const labels = await team.labels();

  return labels.nodes.map((label) => ({
    id: label.id,
    name: label.name,
    color: label.color,
  }));
}

/**
 * Map FeedbackFlow priority to Linear priority
 * Linear: 0 = No priority, 1 = Urgent, 2 = High, 3 = Normal, 4 = Low
 */
export function mapPriorityToLinear(priority: string): number {
  switch (priority) {
    case "critical":
      return 1; // Urgent
    case "high":
      return 2; // High
    case "medium":
      return 3; // Normal
    case "low":
      return 4; // Low
    default:
      return 0; // No priority
  }
}

/**
 * Create an issue in Linear
 */
export async function createLinearIssue(
  apiKey: string,
  params: CreateIssueParams
): Promise<LinearIssue> {
  const client = new LinearClient({ apiKey });

  const issuePayload = await client.createIssue({
    teamId: params.teamId,
    title: params.title,
    description: params.description,
    priority: params.priority,
    projectId: params.projectId || undefined,
    labelIds: params.labelIds || undefined,
  });

  const issue = await issuePayload.issue;

  if (!issue) {
    throw new Error("Failed to create Linear issue");
  }

  return {
    id: issue.id,
    identifier: issue.identifier,
    title: issue.title,
    url: issue.url,
  };
}

/**
 * Format feedback data for Linear issue description
 */
export function formatFeedbackForLinear(feedback: {
  title: string;
  description?: string;
  type: string;
  priority: string;
  screenshotUrl?: string;
  recordingUrl?: string;
  metadata?: {
    browser?: string;
    os?: string;
    url?: string;
    screenWidth?: number;
    screenHeight?: number;
  };
  submitterName?: string;
  submitterEmail?: string;
  tags?: string[];
  ticketDraft?: {
    description: string;
    acceptanceCriteria?: string[];
    reproSteps?: string[];
    expectedBehavior?: string;
    actualBehavior?: string;
  };
}): string {
  const sections: string[] = [];

  // Use ticket draft if available, otherwise use feedback description
  if (feedback.ticketDraft) {
    sections.push(feedback.ticketDraft.description);

    if (feedback.type === "bug" && feedback.ticketDraft.reproSteps?.length) {
      sections.push("\n## Steps to Reproduce");
      feedback.ticketDraft.reproSteps.forEach((step, i) => {
        sections.push(`${i + 1}. ${step}`);
      });
    }

    if (feedback.ticketDraft.expectedBehavior) {
      sections.push(`\n## Expected Behavior\n${feedback.ticketDraft.expectedBehavior}`);
    }

    if (feedback.ticketDraft.actualBehavior) {
      sections.push(`\n## Actual Behavior\n${feedback.ticketDraft.actualBehavior}`);
    }

    if (feedback.ticketDraft.acceptanceCriteria?.length) {
      sections.push("\n## Acceptance Criteria");
      feedback.ticketDraft.acceptanceCriteria.forEach((criterion) => {
        sections.push(`- [ ] ${criterion}`);
      });
    }
  } else if (feedback.description) {
    sections.push(feedback.description);
  }

  // Add media
  if (feedback.screenshotUrl) {
    sections.push(`\n## Screenshot\n![Screenshot](${feedback.screenshotUrl})`);
  }

  if (feedback.recordingUrl) {
    sections.push(`\n## Recording\n[View Recording](${feedback.recordingUrl})`);
  }

  // Add metadata
  const metadataParts: string[] = [];
  if (feedback.metadata?.url) {
    metadataParts.push(`**URL:** ${feedback.metadata.url}`);
  }
  if (feedback.metadata?.browser) {
    metadataParts.push(`**Browser:** ${feedback.metadata.browser}`);
  }
  if (feedback.metadata?.os) {
    metadataParts.push(`**OS:** ${feedback.metadata.os}`);
  }
  if (feedback.metadata?.screenWidth && feedback.metadata?.screenHeight) {
    metadataParts.push(`**Screen:** ${feedback.metadata.screenWidth}x${feedback.metadata.screenHeight}`);
  }

  if (metadataParts.length > 0) {
    sections.push("\n## Environment\n" + metadataParts.join("\n"));
  }

  // Add submitter info
  if (feedback.submitterName || feedback.submitterEmail) {
    const submitterParts: string[] = [];
    if (feedback.submitterName) {
      submitterParts.push(`**Name:** ${feedback.submitterName}`);
    }
    if (feedback.submitterEmail) {
      submitterParts.push(`**Email:** ${feedback.submitterEmail}`);
    }
    sections.push("\n## Submitted by\n" + submitterParts.join("\n"));
  }

  // Add tags
  if (feedback.tags && feedback.tags.length > 0) {
    sections.push(`\n## Tags\n${feedback.tags.map((t) => `\`${t}\``).join(" ")}`);
  }

  // Add source attribution
  sections.push("\n---\n*Exported from [FeedbackFlow](https://feedbackflow.cc)*");

  return sections.join("\n");
}
