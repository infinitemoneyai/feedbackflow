/**
 * Result normalizers for AI responses
 */

import type { AIAnalysisResult, SolutionSuggestionsResult, TicketDraftResult, SolutionSuggestion } from "./types";
import { clamp, validateEnum } from "./utils";

/**
 * Normalize analysis result with defaults
 */
export function normalizeAnalysisResult(result: Partial<AIAnalysisResult>): AIAnalysisResult {
  return {
    suggestedType: result.suggestedType === "feature" ? "feature" : "bug",
    typeConfidence: clamp(result.typeConfidence || 0.5, 0, 1),
    suggestedPriority: validateEnum(
      result.suggestedPriority,
      ["low", "medium", "high", "critical"] as const,
      "medium"
    ),
    priorityConfidence: clamp(result.priorityConfidence || 0.5, 0, 1),
    suggestedTags: Array.isArray(result.suggestedTags) ? result.suggestedTags.slice(0, 10) : [],
    summary: result.summary || "No summary available",
    affectedComponent: result.affectedComponent || undefined,
    potentialCauses: Array.isArray(result.potentialCauses) ? result.potentialCauses.slice(0, 5) : [],
    suggestedSolutions: Array.isArray(result.suggestedSolutions) ? result.suggestedSolutions.slice(0, 5) : [],
  };
}

/**
 * Normalize solution suggestions result
 */
export function normalizeSolutionResult(result: Partial<SolutionSuggestionsResult>): SolutionSuggestionsResult {
  const validTypes = ["investigation", "fix", "workaround", "implementation", "consideration"] as const;
  const validEffort = ["low", "medium", "high"] as const;
  const validImpact = ["low", "medium", "high"] as const;

  const suggestions: SolutionSuggestion[] = (result.suggestions || []).slice(0, 5).map((s) => ({
    title: s?.title || "Untitled suggestion",
    description: s?.description || "No description provided",
    type: validateEnum(s?.type, validTypes, "consideration"),
    effort: validateEnum(s?.effort, validEffort, "medium"),
    impact: validateEnum(s?.impact, validImpact, "medium"),
  }));

  return {
    suggestions,
    summary: result.summary || "Review the suggestions below for recommended actions.",
    nextSteps: Array.isArray(result.nextSteps) ? result.nextSteps.slice(0, 5) : [],
  };
}

/**
 * Normalize ticket draft result
 */
export function normalizeTicketDraftResult(result: Partial<TicketDraftResult>): TicketDraftResult {
  return {
    title: result.title || "Untitled Ticket",
    description: result.description || "No description provided",
    acceptanceCriteria: Array.isArray(result.acceptanceCriteria)
      ? result.acceptanceCriteria.filter((c): c is string => typeof c === "string")
      : [],
    reproSteps: Array.isArray(result.reproSteps)
      ? result.reproSteps.filter((s): s is string => typeof s === "string")
      : undefined,
    expectedBehavior: typeof result.expectedBehavior === "string" ? result.expectedBehavior : undefined,
    actualBehavior: typeof result.actualBehavior === "string" ? result.actualBehavior : undefined,
  };
}

/**
 * Parse JSON from AI response, handling common formats
 */
export function parseAIResponse<T>(content: string): T {
  try {
    return JSON.parse(content);
  } catch {
    // Try to extract JSON from markdown code blocks or other text
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error("Failed to parse AI response as JSON");
  }
}
