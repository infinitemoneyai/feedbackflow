/**
 * Shared types for AI operations
 */

export interface FeedbackMetadata {
  browser?: string;
  os?: string;
  url?: string;
  screenWidth?: number;
  screenHeight?: number;
}

export interface FeedbackData {
  title: string;
  description?: string;
  type: string;
  metadata: FeedbackMetadata;
}

export interface ExistingAnalysis {
  summary?: string;
  potentialCauses?: string[];
  affectedComponent?: string;
  suggestedSolutions?: string[];
}

export interface ExistingSuggestions {
  summary?: string;
  suggestions?: Array<{ title: string; description: string }>;
  nextSteps?: string[];
}

export interface AIAnalysisResult {
  suggestedType: "bug" | "feature";
  typeConfidence: number;
  suggestedPriority: "low" | "medium" | "high" | "critical";
  priorityConfidence: number;
  suggestedTags: string[];
  summary: string;
  affectedComponent?: string;
  potentialCauses: string[];
  suggestedSolutions: string[];
}

export interface SolutionSuggestion {
  title: string;
  description: string;
  type: "investigation" | "fix" | "workaround" | "implementation" | "consideration";
  effort: "low" | "medium" | "high";
  impact: "low" | "medium" | "high";
}

export interface SolutionSuggestionsResult {
  suggestions: SolutionSuggestion[];
  summary: string;
  nextSteps: string[];
}

export interface TicketDraftResult {
  title: string;
  description: string;
  acceptanceCriteria: string[];
  reproSteps?: string[];
  expectedBehavior?: string;
  actualBehavior?: string;
}

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

export type AIProvider = "openai" | "anthropic";
