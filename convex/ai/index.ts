/**
 * AI module exports
 * 
 * This module provides a clean, modular interface for AI operations.
 */

// Types
export type {
  FeedbackMetadata,
  FeedbackData,
  ExistingAnalysis,
  ExistingSuggestions,
  AIAnalysisResult,
  SolutionSuggestion,
  SolutionSuggestionsResult,
  TicketDraftResult,
  ConversationMessage,
  AIProvider as AIProviderType,
} from "./types";

// Utilities
export * from "./utils";

// Normalizers
export * from "./normalizers";

// Prompts
export * from "./prompts";

// Providers (re-export with explicit names to avoid conflicts)
export { createAIProvider, OpenAIProvider, AnthropicProvider } from "./providers";
export type { AIProvider, AIProviderConfig } from "./providers/base";

// Services
export * from "./services";
