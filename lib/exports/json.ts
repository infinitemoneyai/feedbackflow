/**
 * JSON Export Utility Functions
 *
 * Exports feedback items in prd.json userStories format for AI dev workflows
 */

import { Id } from "@/convex/_generated/dataModel";

// Types matching prd.json structure
export interface PrdUserStory {
  id: string;
  title: string;
  acceptanceCriteria: string[];
  priority: number;
  passes?: boolean;
  notes?: string;
}

export interface PrdExport {
  projectName: string;
  description?: string;
  exportedAt: string;
  userStories: PrdUserStory[];
}

// Feedback type from Convex
export interface FeedbackForExport {
  _id: Id<"feedback">;
  type: "bug" | "feature";
  title: string;
  description?: string;
  priority: "low" | "medium" | "high" | "critical";
  status: string;
  tags: string[];
  screenshotUrl?: string;
  recordingUrl?: string;
  submitterEmail?: string;
  submitterName?: string;
  metadata?: {
    url?: string;
    browser?: string;
    os?: string;
    screenWidth?: number;
    screenHeight?: number;
    timestamp?: number;
  };
  createdAt: number;
}

// Ticket draft type from AI
export interface TicketDraftForExport {
  title: string;
  description: string;
  acceptanceCriteria: string[];
  reproSteps?: string[];
  expectedBehavior?: string;
  actualBehavior?: string;
}

/**
 * Map feedback priority to numeric value (1 = highest)
 */
export function mapPriorityToNumber(priority: string): number {
  switch (priority) {
    case "critical":
      return 1;
    case "high":
      return 2;
    case "medium":
      return 3;
    case "low":
      return 4;
    default:
      return 3;
  }
}

/**
 * Generate acceptance criteria from feedback when no ticket draft exists
 * Returns basic criteria derived from the feedback content
 */
export function generateBasicAcceptanceCriteria(
  feedback: FeedbackForExport
): string[] {
  const criteria: string[] = [];

  if (feedback.type === "bug") {
    criteria.push("Bug is reproducible following the reported steps");
    criteria.push("Root cause is identified and documented");
    criteria.push("Fix is implemented and tested");
    criteria.push("No regression in related functionality");

    if (feedback.screenshotUrl) {
      criteria.push("Visual issue shown in screenshot is resolved");
    }

    if (feedback.recordingUrl) {
      criteria.push("Behavior demonstrated in recording is corrected");
    }
  } else {
    // Feature request
    criteria.push("Feature is implemented as described");
    criteria.push("Feature is tested with various inputs");
    criteria.push("Documentation is updated if applicable");
    criteria.push("Feature follows existing UI/UX patterns");
  }

  return criteria;
}

/**
 * Generate a unique ID for the exported feedback
 * Uses FF-XXXXXX format like the widget submission
 */
export function generateExportId(feedback: FeedbackForExport): string {
  // Extract last 6 chars of the Convex ID and convert to uppercase hex-like string
  const idPart = feedback._id.toString().slice(-6).toUpperCase();
  return `FF-${idPart}`;
}

/**
 * Build notes from feedback metadata and context
 */
export function buildExportNotes(
  feedback: FeedbackForExport,
  ticketDraft?: TicketDraftForExport | null
): string {
  const parts: string[] = [];

  // Add description
  if (ticketDraft?.description) {
    parts.push(ticketDraft.description);
  } else if (feedback.description) {
    parts.push(feedback.description);
  }

  // Add repro steps for bugs
  if (feedback.type === "bug" && ticketDraft?.reproSteps?.length) {
    parts.push("\n**Reproduction Steps:**");
    ticketDraft.reproSteps.forEach((step, i) => {
      parts.push(`${i + 1}. ${step}`);
    });
  }

  // Add expected/actual behavior
  if (ticketDraft?.expectedBehavior) {
    parts.push(`\n**Expected:** ${ticketDraft.expectedBehavior}`);
  }
  if (ticketDraft?.actualBehavior) {
    parts.push(`**Actual:** ${ticketDraft.actualBehavior}`);
  }

  // Add environment info
  if (feedback.metadata?.url || feedback.metadata?.browser || feedback.metadata?.os) {
    parts.push("\n**Environment:**");
    if (feedback.metadata.url) {
      parts.push(`- URL: ${feedback.metadata.url}`);
    }
    if (feedback.metadata.browser) {
      parts.push(`- Browser: ${feedback.metadata.browser}`);
    }
    if (feedback.metadata.os) {
      parts.push(`- OS: ${feedback.metadata.os}`);
    }
    if (feedback.metadata.screenWidth && feedback.metadata.screenHeight) {
      parts.push(`- Screen: ${feedback.metadata.screenWidth}x${feedback.metadata.screenHeight}`);
    }
  }

  // Add media references
  if (feedback.screenshotUrl) {
    parts.push(`\n**Screenshot:** ${feedback.screenshotUrl}`);
  }
  if (feedback.recordingUrl) {
    parts.push(`**Recording:** ${feedback.recordingUrl}`);
  }

  // Add submitter info
  if (feedback.submitterName || feedback.submitterEmail) {
    const submitter = feedback.submitterName || feedback.submitterEmail;
    parts.push(`\n**Reported by:** ${submitter}`);
  }

  // Add tags
  if (feedback.tags.length > 0) {
    parts.push(`**Tags:** ${feedback.tags.join(", ")}`);
  }

  return parts.join("\n");
}

/**
 * Convert a single feedback item to prd.json userStory format
 */
export function feedbackToUserStory(
  feedback: FeedbackForExport,
  ticketDraft?: TicketDraftForExport | null
): PrdUserStory {
  return {
    id: generateExportId(feedback),
    title: ticketDraft?.title || feedback.title,
    acceptanceCriteria:
      ticketDraft?.acceptanceCriteria?.length
        ? ticketDraft.acceptanceCriteria
        : generateBasicAcceptanceCriteria(feedback),
    priority: mapPriorityToNumber(feedback.priority),
    passes: false,
    notes: buildExportNotes(feedback, ticketDraft),
  };
}

/**
 * Convert multiple feedback items to a full prd.json export
 */
export function feedbackToPrdExport(
  feedbackItems: Array<{
    feedback: FeedbackForExport;
    ticketDraft?: TicketDraftForExport | null;
  }>,
  projectName: string,
  projectDescription?: string
): PrdExport {
  return {
    projectName,
    description: projectDescription,
    exportedAt: new Date().toISOString(),
    userStories: feedbackItems.map(({ feedback, ticketDraft }) =>
      feedbackToUserStory(feedback, ticketDraft)
    ),
  };
}

/**
 * Format a single user story as JSON string
 */
export function formatUserStoryJson(userStory: PrdUserStory): string {
  return JSON.stringify(userStory, null, 2);
}

/**
 * Format full prd export as JSON string
 */
export function formatPrdExportJson(prdExport: PrdExport): string {
  return JSON.stringify(prdExport, null, 2);
}

/**
 * Trigger a download of JSON content
 */
export function downloadJson(content: string, filename: string): void {
  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Copy JSON content to clipboard
 */
export async function copyJsonToClipboard(content: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(content);
    return true;
  } catch {
    return false;
  }
}
