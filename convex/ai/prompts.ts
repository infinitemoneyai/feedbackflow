/**
 * System prompts for different AI operations
 */

import type { FeedbackData, ExistingAnalysis, ExistingSuggestions, TicketDraftResult } from "./types";

/**
 * System prompt for AI analysis
 */
export const ANALYSIS_SYSTEM_PROMPT = `You are an expert software product analyst helping to triage user feedback. Analyze the following feedback and provide categorization and insights.

Your task is to:
1. Determine if this is a bug report or feature request
2. Assess the priority level (low, medium, high, critical)
3. Suggest relevant tags for categorization
4. Provide a brief summary
5. Identify the affected component/area if possible
6. List potential causes (for bugs) or implementation considerations (for features)
7. Suggest solutions or next steps

Respond with a JSON object in the following exact format:
{
  "suggestedType": "bug" | "feature",
  "typeConfidence": 0.0 to 1.0,
  "suggestedPriority": "low" | "medium" | "high" | "critical",
  "priorityConfidence": 0.0 to 1.0,
  "suggestedTags": ["tag1", "tag2"],
  "summary": "Brief 1-2 sentence summary",
  "affectedComponent": "component name or null",
  "potentialCauses": ["cause1", "cause2"],
  "suggestedSolutions": ["solution1", "solution2"]
}

Priority guidelines:
- critical: Production down, data loss, security vulnerability, blocks all users
- high: Major feature broken, significant user impact, no workaround
- medium: Feature partially broken, workaround exists, moderate impact
- low: Minor issue, cosmetic, affects few users

Be concise but thorough. Base your analysis on all available information.`;

/**
 * System prompt for generating solution suggestions
 */
export const SOLUTION_SUGGESTIONS_PROMPT = `You are an expert software engineer and product analyst. Your task is to provide detailed, actionable solution suggestions for user feedback.

Based on the feedback provided, generate specific, practical solutions that a development team can implement.

For BUG reports, provide:
1. Investigation steps to identify the root cause
2. Potential causes with likelihood assessment
3. Specific fixes or workarounds
4. Testing recommendations

For FEATURE requests, provide:
1. Implementation approaches with trade-offs
2. Technical considerations
3. Potential challenges and how to address them
4. Phased implementation options if applicable

Respond with a JSON object in this exact format:
{
  "suggestions": [
    {
      "title": "Brief title of the suggestion",
      "description": "Detailed description of what to do",
      "type": "investigation" | "fix" | "workaround" | "implementation" | "consideration",
      "effort": "low" | "medium" | "high",
      "impact": "low" | "medium" | "high"
    }
  ],
  "summary": "One sentence summary of the recommended approach",
  "nextSteps": ["Step 1", "Step 2", "Step 3"]
}

Provide 3-5 suggestions, ordered by recommended priority. Be specific and actionable.`;

/**
 * System prompt for generating ticket drafts
 */
export const TICKET_DRAFT_PROMPT = `You are an expert technical writer creating actionable tickets for development teams.

Your task is to transform user feedback into a well-structured, clear ticket that developers can act on immediately.

If a current draft is provided, ENHANCE it by:
- Keeping the user's manual edits and improvements
- Making the content more detailed, clear, and actionable
- Adding more specific acceptance criteria
- Improving reproduction steps if applicable
- Expanding on the description with technical details
- DO NOT completely rewrite or discard the user's work

For BUG reports, create/enhance a ticket with:
- Clear, concise title (50-80 chars)
- Detailed description explaining the issue
- Step-by-step reproduction steps (numbered)
- Expected behavior
- Actual behavior
- Acceptance criteria for the fix

For FEATURE requests, create/enhance a ticket with:
- Clear, descriptive title (50-80 chars)
- User story format description: "As a [user type], I want to [action] so that [benefit]"
- Detailed description expanding on the user's request
- Acceptance criteria (checkboxes-style, testable requirements)

Respond with a JSON object in this exact format:
{
  "title": "Clear, actionable ticket title",
  "description": "Detailed description of the issue or feature",
  "acceptanceCriteria": ["Criterion 1", "Criterion 2", "..."],
  "reproSteps": ["Step 1", "Step 2", "..."],  // Only for bugs
  "expectedBehavior": "What should happen",  // Only for bugs
  "actualBehavior": "What actually happens"  // Only for bugs
}

Guidelines:
- Be specific and actionable
- Use technical language appropriately
- Include all relevant context from the feedback
- Acceptance criteria should be testable (can be checked off as done/not done)
- For bugs: always include repro steps, expected, and actual behavior
- For features: focus on the user story and clear acceptance criteria
- When enhancing: preserve the user's intent and improvements`;

/**
 * System prompt for AI conversation
 */
export const CONVERSATION_SYSTEM_PROMPT = `You are an AI assistant helping a product team analyze and understand user feedback. You have access to the feedback context including the title, description, screenshot (if provided), and technical metadata.

Your role is to:
1. Help the team understand the user's issue or request better
2. Suggest potential causes or solutions
3. Answer questions about the feedback
4. Help clarify requirements or acceptance criteria
5. Identify related issues or patterns

Be helpful, concise, and technical when appropriate. If you're uncertain, say so. Focus on practical insights that help the team take action.

When referring to visual elements from screenshots, be specific about what you observe.`;

/**
 * Build the analysis prompt
 */
export function buildAnalysisPrompt(feedback: FeedbackData): string {
  let prompt = `# User Feedback to Analyze

## Title
${feedback.title}

## Current Type
${feedback.type === "bug" ? "Bug Report" : "Feature Request"}
`;

  if (feedback.description) {
    prompt += `
## Description
${feedback.description}
`;
  }

  if (feedback.metadata.url) {
    prompt += `
## Page URL
${feedback.metadata.url}
`;
  }

  const metadataParts: string[] = [];
  if (feedback.metadata.browser) metadataParts.push(`Browser: ${feedback.metadata.browser}`);
  if (feedback.metadata.os) metadataParts.push(`OS: ${feedback.metadata.os}`);
  if (feedback.metadata.screenWidth && feedback.metadata.screenHeight) {
    metadataParts.push(`Screen: ${feedback.metadata.screenWidth}x${feedback.metadata.screenHeight}`);
  }

  if (metadataParts.length > 0) {
    prompt += `
## Technical Context
${metadataParts.join("\n")}
`;
  }

  prompt += `
Please analyze this feedback and provide your assessment in JSON format.`;

  return prompt;
}

/**
 * Build the solution prompt
 */
export function buildSolutionPrompt(
  feedback: FeedbackData,
  existingAnalysis?: ExistingAnalysis
): string {
  let prompt = `# Feedback Requiring Solutions

## Title
${feedback.title}

## Type
${feedback.type === "bug" ? "Bug Report" : "Feature Request"}
`;

  if (feedback.description) {
    prompt += `
## Description
${feedback.description}
`;
  }

  if (feedback.metadata.url) {
    prompt += `
## Page URL
${feedback.metadata.url}
`;
  }

  if (existingAnalysis) {
    if (existingAnalysis.summary) {
      prompt += `
## AI Analysis Summary
${existingAnalysis.summary}
`;
    }
    if (existingAnalysis.affectedComponent) {
      prompt += `
## Affected Component
${existingAnalysis.affectedComponent}
`;
    }
    if (existingAnalysis.potentialCauses && existingAnalysis.potentialCauses.length > 0) {
      prompt += `
## Previously Identified Causes
${existingAnalysis.potentialCauses.map((c) => `- ${c}`).join("\n")}
`;
    }
  }

  prompt += `
Please analyze this ${feedback.type === "bug" ? "bug" : "feature request"} and provide detailed, actionable solution suggestions in JSON format.`;

  return prompt;
}

/**
 * Build the ticket draft prompt
 */
export function buildTicketDraftPrompt(
  feedback: FeedbackData,
  existingAnalysis?: ExistingAnalysis,
  existingSuggestions?: ExistingSuggestions,
  currentDraft?: Partial<TicketDraftResult>
): string {
  let prompt = `# Feedback to Convert to Ticket

## Original Title
${feedback.title}

## Type
${feedback.type === "bug" ? "Bug Report" : "Feature Request"}
`;

  if (feedback.description) {
    prompt += `
## Original Description
${feedback.description}
`;
  }

  if (feedback.metadata.url) {
    prompt += `
## Page URL
${feedback.metadata.url}
`;
  }

  if (feedback.metadata.browser || feedback.metadata.os) {
    prompt += `
## Environment
`;
    if (feedback.metadata.browser) prompt += `- Browser: ${feedback.metadata.browser}\n`;
    if (feedback.metadata.os) prompt += `- OS: ${feedback.metadata.os}\n`;
  }

  if (existingAnalysis) {
    if (existingAnalysis.summary) {
      prompt += `
## AI Analysis Summary
${existingAnalysis.summary}
`;
    }
    if (existingAnalysis.affectedComponent) {
      prompt += `
## Affected Component
${existingAnalysis.affectedComponent}
`;
    }
    if (existingAnalysis.potentialCauses && existingAnalysis.potentialCauses.length > 0) {
      prompt += `
## Identified Causes
${existingAnalysis.potentialCauses.map((c) => `- ${c}`).join("\n")}
`;
    }
    if (existingAnalysis.suggestedSolutions && existingAnalysis.suggestedSolutions.length > 0) {
      prompt += `
## Suggested Solutions
${existingAnalysis.suggestedSolutions.map((s) => `- ${s}`).join("\n")}
`;
    }
  }

  if (existingSuggestions) {
    if (existingSuggestions.summary) {
      prompt += `
## Solution Recommendations
${existingSuggestions.summary}
`;
    }
    if (existingSuggestions.suggestions && existingSuggestions.suggestions.length > 0) {
      prompt += `
## Detailed Suggestions
${existingSuggestions.suggestions.map((s) => `- **${s.title}**: ${s.description}`).join("\n")}
`;
    }
    if (existingSuggestions.nextSteps && existingSuggestions.nextSteps.length > 0) {
      prompt += `
## Recommended Next Steps
${existingSuggestions.nextSteps.map((s, i) => `${i + 1}. ${s}`).join("\n")}
`;
    }
  }

  if (currentDraft) {
    prompt += `
## Current Draft (User has already started editing this)
**Title:** ${currentDraft.title}

**Description:**
${currentDraft.description}

**Acceptance Criteria:**
${currentDraft.acceptanceCriteria?.map((c, i) => `${i + 1}. ${c}`).join("\n")}
`;
    if (currentDraft.reproSteps && currentDraft.reproSteps.length > 0) {
      prompt += `
**Reproduction Steps:**
${currentDraft.reproSteps.map((s, i) => `${i + 1}. ${s}`).join("\n")}
`;
    }
    if (currentDraft.expectedBehavior) {
      prompt += `
**Expected Behavior:** ${currentDraft.expectedBehavior}
`;
    }
    if (currentDraft.actualBehavior) {
      prompt += `
**Actual Behavior:** ${currentDraft.actualBehavior}
`;
    }
    
    prompt += `
Please ENHANCE the current draft above. Keep the user's edits and improvements, but make it more detailed, clear, and actionable. Add more specific acceptance criteria, improve the description, and enhance the reproduction steps if applicable. Return the enhanced version in JSON format.`;
  } else {
    prompt += `
Please convert this ${feedback.type === "bug" ? "bug report" : "feature request"} into a well-structured ticket in JSON format.`;
  }

  return prompt;
}

/**
 * Build feedback context for conversation
 */
export function buildFeedbackContextForConversation(feedback: {
  title: string;
  description?: string;
  type: string;
  priority: string;
  tags: string[];
  metadata: {
    browser?: string;
    os?: string;
    url?: string;
  };
  existingAnalysis?: ExistingAnalysis;
}): string {
  let context = `# Feedback Context

## Title
${feedback.title}

## Type
${feedback.type === "bug" ? "Bug Report" : "Feature Request"}

## Priority
${feedback.priority}
`;

  if (feedback.description) {
    context += `
## Description
${feedback.description}
`;
  }

  if (feedback.tags && feedback.tags.length > 0) {
    context += `
## Tags
${feedback.tags.join(", ")}
`;
  }

  if (feedback.metadata.url) {
    context += `
## Page URL
${feedback.metadata.url}
`;
  }

  if (feedback.metadata.browser || feedback.metadata.os) {
    context += `
## Technical Context
`;
    if (feedback.metadata.browser) context += `- Browser: ${feedback.metadata.browser}\n`;
    if (feedback.metadata.os) context += `- OS: ${feedback.metadata.os}\n`;
  }

  if (feedback.existingAnalysis) {
    if (feedback.existingAnalysis.summary) {
      context += `
## AI Analysis Summary
${feedback.existingAnalysis.summary}
`;
    }
    if (feedback.existingAnalysis.affectedComponent) {
      context += `
## Affected Component
${feedback.existingAnalysis.affectedComponent}
`;
    }
    if (feedback.existingAnalysis.potentialCauses && feedback.existingAnalysis.potentialCauses.length > 0) {
      context += `
## Potential Causes
${feedback.existingAnalysis.potentialCauses.map((c) => `- ${c}`).join("\n")}
`;
    }
    if (feedback.existingAnalysis.suggestedSolutions && feedback.existingAnalysis.suggestedSolutions.length > 0) {
      context += `
## Suggested Solutions
${feedback.existingAnalysis.suggestedSolutions.map((s) => `- ${s}`).join("\n")}
`;
    }
  }

  return context;
}
