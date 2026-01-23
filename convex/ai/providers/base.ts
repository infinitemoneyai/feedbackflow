/**
 * Base interface for AI providers
 */

import type {
  AIAnalysisResult,
  SolutionSuggestionsResult,
  TicketDraftResult,
  FeedbackData,
  ExistingAnalysis,
  ExistingSuggestions,
  ConversationMessage,
} from "../types";

export interface AIProviderConfig {
  apiKey: string;
  model: string;
}

export interface AnalysisInput {
  feedback: FeedbackData;
  screenshotBase64?: string;
  screenshotMediaType?: string;
}

export interface SolutionInput {
  feedback: FeedbackData;
  existingAnalysis?: ExistingAnalysis;
  screenshotBase64?: string;
  screenshotMediaType?: string;
}

export interface TicketDraftInput {
  feedback: FeedbackData;
  existingAnalysis?: ExistingAnalysis;
  existingSuggestions?: ExistingSuggestions;
  currentDraft?: Partial<TicketDraftResult>;
  screenshotBase64?: string;
  screenshotMediaType?: string;
}

export interface ConversationInput {
  feedbackContext: string;
  conversationHistory: ConversationMessage[];
  userMessage: string;
  screenshotBase64?: string;
  screenshotMediaType?: string;
}

/**
 * Base interface that all AI providers must implement
 */
export interface AIProvider {
  analyzeFeedback(input: AnalysisInput): Promise<AIAnalysisResult>;
  generateSolutions(input: SolutionInput): Promise<SolutionSuggestionsResult>;
  generateTicketDraft(input: TicketDraftInput): Promise<TicketDraftResult>;
  processConversation(input: ConversationInput): Promise<string>;
}
