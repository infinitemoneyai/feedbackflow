/**
 * Database operations for AI features
 * Re-exports all AI database modules
 */

// Analysis
export {
  storeAnalysis,
  storeAnalysisInternal,
  getAnalysis,
  applyAnalysisSuggestions,
} from "./analysis";

// Solutions
export {
  storeSolutionSuggestions,
  getSolutionSuggestions,
} from "./solutions";

// Ticket Drafts
export {
  storeTicketDraft,
  getTicketDraft,
  saveTicketDraft,
  updateTicketDraft,
  deleteTicketDraft,
} from "./ticketDrafts";

// Conversations
export {
  getConversationHistory,
  addUserMessage,
  storeAssistantMessage,
  clearConversationHistory,
} from "./conversations";

// Config
export {
  getTeamAiConfig,
  getDecryptedApiKeyInternal,
} from "./config";

// Helpers (for internal use)
export {
  getAuthenticatedUser,
  verifyFeedbackAccess,
  verifyTeamAccess,
  incrementAiUsage,
  logFeedbackActivity,
} from "./helpers";
