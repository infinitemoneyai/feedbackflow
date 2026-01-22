"use client";

import {
  TicketContent,
  SolutionDiscussion,
  ResolvedView,
} from "./index";
import { BacklogSolution } from "./backlog-solution";

interface TicketDraft {
  title: string;
  description: string;
  acceptanceCriteria?: string[];
}

interface SolutionSuggestions {
  summary: string;
  nextSteps?: string[];
}

interface Export {
  _id: any;
  provider: string;
  status: string;
  externalUrl?: string;
  errorMessage?: string;
  createdAt: number;
}

interface Feedback {
  _id: any;
  status: string;
  title: string;
  description?: string;
  type: string;
  priority: string;
  tags?: string[];
  screenshotUrl?: string;
  recordingUrl?: string;
  submitterEmail?: string;
  submitterName?: string;
  resolvedAt?: number;
  metadata: any;
  createdAt: number;
}

interface ConversationMessage {
  _id: any;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
}

interface AiConfig {
  hasOpenAI: boolean;
  hasAnthropic: boolean;
  preferredProvider: "openai" | "anthropic" | null;
  preferredModel: string | null;
  isConfigured: boolean;
}

interface TicketContentAreaProps {
  currentView: "inbox" | "backlog" | "resolved";
  feedback: Feedback;
  ticketDraft?: TicketDraft | null;
  solutionSuggestions?: SolutionSuggestions | null;
  exports?: Export[] | null;
  conversationHistory?: ConversationMessage[] | null;
  aiConfig: AiConfig | null | undefined;
  isAiThinking: boolean;
  isSolutionExpanded: boolean;
  onToggleSolution: (expanded: boolean) => void;
}

export function TicketContentArea({
  currentView,
  feedback,
  ticketDraft,
  solutionSuggestions,
  exports,
  conversationHistory,
  aiConfig,
  isAiThinking,
  isSolutionExpanded,
  onToggleSolution,
}: TicketContentAreaProps) {
  return (
    <div className="flex-grow space-y-6 overflow-y-auto p-6">
      <TicketContent feedback={feedback} />

      {currentView === "resolved" ? (
        <ResolvedView
          feedback={feedback}
          ticketDraft={ticketDraft}
          solutionSuggestions={solutionSuggestions}
          exports={exports}
        />
      ) : currentView === "backlog" ? (
        <>
          {ticketDraft && <BacklogSolution ticketDraft={ticketDraft} />}
          <SolutionDiscussion
            conversationHistory={conversationHistory}
            aiConfig={aiConfig}
            isAiThinking={isAiThinking}
            isSolutionExpanded={isSolutionExpanded}
            onToggle={onToggleSolution}
          />
        </>
      ) : (
        <SolutionDiscussion
          conversationHistory={conversationHistory}
          aiConfig={aiConfig}
          isAiThinking={isAiThinking}
          isSolutionExpanded={isSolutionExpanded}
          onToggle={onToggleSolution}
        />
      )}
    </div>
  );
}
