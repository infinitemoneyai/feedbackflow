import type { DemoFeedback, DemoTicket } from "./types";

/**
 * Generate a structured ticket from user feedback
 */
export function generateDemoTicket(feedback: DemoFeedback): DemoTicket {
  const ticketNum = Math.floor(Math.random() * 900) + 100;
  const id = `FF-${ticketNum}`;

  const { browser, os } = detectEnvironment();
  const tags = generateTags(feedback);
  const priority = calculatePriority(feedback);
  const reproSteps = generateReproductionSteps(feedback);
  const acceptanceCriteria = generateAcceptanceCriteria(feedback);
  const notes = generateNotes(feedback);

  return {
    id,
    issue: feedback.title,
    acceptanceCriteria,
    priority,
    type: feedback.type,
    tags,
    reproSteps,
    notes,
    metadata: {
      browser,
      os,
      screenSize: `${window.innerWidth}x${window.innerHeight}`,
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Detect browser and OS from user agent
 */
function detectEnvironment(): { browser: string; os: string } {
  const ua = navigator.userAgent;

  const browser = ua.includes("Chrome")
    ? "Chrome"
    : ua.includes("Firefox")
      ? "Firefox"
      : ua.includes("Safari")
        ? "Safari"
        : "Unknown";

  const os = ua.includes("Mac")
    ? "macOS"
    : ua.includes("Windows")
      ? "Windows"
      : ua.includes("Linux")
        ? "Linux"
        : "Unknown";

  return { browser, os };
}

/**
 * Generate smart tags based on feedback content
 */
function generateTags(feedback: DemoFeedback): string[] {
  const tags: string[] = [];
  const text = `${feedback.title} ${feedback.description}`.toLowerCase();

  const tagMap: Record<string, string[]> = {
    ui: ["button", "input", "form", "layout", "design"],
    mobile: ["mobile", "phone", "tablet", "responsive"],
    performance: ["slow", "loading", "lag", "freeze"],
    auth: ["login", "auth", "password", "signin"],
    payments: ["payment", "checkout", "billing", "stripe"],
    critical: ["crash", "error", "broken", "down"],
    accessibility: ["a11y", "accessibility", "screen reader", "keyboard"],
    data: ["database", "data", "sync", "save"],
  };

  for (const [tag, keywords] of Object.entries(tagMap)) {
    if (keywords.some((keyword) => text.includes(keyword))) {
      tags.push(tag);
    }
  }

  // Default tags if none matched
  if (tags.length === 0) {
    tags.push(feedback.type === "bug" ? "needs-triage" : "enhancement");
  }

  return tags;
}

/**
 * Calculate priority based on feedback type and content
 */
function calculatePriority(feedback: DemoFeedback): number {
  const text = `${feedback.title} ${feedback.description}`.toLowerCase();

  if (feedback.type === "bug") {
    // P1 - Critical
    if (text.includes("crash") || text.includes("broken") || text.includes("down")) {
      return 1;
    }
    // P2 - High
    return 2;
  } else {
    // Features
    if (text.includes("urgent") || text.includes("important")) {
      return 2;
    }
    // P3 - Medium
    return 3;
  }
}

/**
 * Generate reproduction steps
 */
function generateReproductionSteps(feedback: DemoFeedback): string[] {
  const steps = ["Open the application"];

  if (feedback.description) {
    const firstSentence = feedback.description.split(".")[0];
    steps.push(`Observe: ${firstSentence}`);
  } else {
    steps.push("Interact with the affected area");
  }

  steps.push("See the issue as shown in the screenshot");

  return steps;
}

/**
 * Generate acceptance criteria based on feedback type
 */
function generateAcceptanceCriteria(feedback: DemoFeedback): string[] {
  if (feedback.type === "bug") {
    return [
      `Issue "${feedback.title}" is resolved`,
      "No regression in related functionality",
      "Fix verified on Chrome, Firefox, and Safari",
      "Edge cases handled appropriately",
      "Typecheck passes",
    ];
  } else {
    return [
      `Feature "${feedback.title}" is implemented as described`,
      "UI matches design system guidelines",
      "Includes appropriate loading and error states",
      "Responsive on mobile and desktop",
      "Typecheck passes",
    ];
  }
}

/**
 * Generate contextual notes
 */
function generateNotes(feedback: DemoFeedback): string {
  const baseNote = feedback.description || 
    (feedback.type === "bug" 
      ? "User reported issue via screenshot." 
      : "Feature request from user feedback.");

  if (feedback.type === "bug") {
    return `${baseNote} Investigate root cause and implement fix. Consider adding tests to prevent regression.`;
  } else {
    return `${baseNote} Evaluate feasibility and prioritize based on user impact.`;
  }
}
