/**
 * AI Database Operations
 * 
 * This module has been refactored into smaller, focused modules for better
 * maintainability and composability. All exports are re-exported here for
 * backward compatibility.
 * 
 * Structure:
 * - convex/ai/db/helpers.ts - Shared auth and utility functions
 * - convex/ai/db/analysis.ts - AI analysis storage and retrieval
 * - convex/ai/db/solutions.ts - Solution suggestions storage and retrieval
 * - convex/ai/db/ticketDrafts.ts - Ticket draft CRUD operations
 * - convex/ai/db/conversations.ts - AI conversation management
 * - convex/ai/db/config.ts - AI configuration queries
 */

export {
  // Analysis
  storeAnalysis,
  storeAnalysisInternal,
  getAnalysis,
  applyAnalysisSuggestions,
  
  // Solutions
  storeSolutionSuggestions,
  getSolutionSuggestions,
  
  // Ticket Drafts
  storeTicketDraft,
  getTicketDraft,
  saveTicketDraft,
  updateTicketDraft,
  deleteTicketDraft,
  
  // Conversations
  getConversationHistory,
  addUserMessage,
  storeAssistantMessage,
  clearConversationHistory,
  
  // Config
  getTeamAiConfig,
  getDecryptedApiKeyInternal,
} from "./ai/db";
