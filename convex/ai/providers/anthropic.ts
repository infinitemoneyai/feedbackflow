/**
 * Anthropic provider implementation
 */

import type {
  AIProvider,
  AIProviderConfig,
  AnalysisInput,
  SolutionInput,
  TicketDraftInput,
  ConversationInput,
} from "./base";
import type { AIAnalysisResult, SolutionSuggestionsResult, TicketDraftResult } from "../types";
import {
  ANALYSIS_SYSTEM_PROMPT,
  SOLUTION_SUGGESTIONS_PROMPT,
  TICKET_DRAFT_PROMPT,
  CONVERSATION_SYSTEM_PROMPT,
  buildAnalysisPrompt,
  buildSolutionPrompt,
  buildTicketDraftPrompt,
} from "../prompts";
import { normalizeAnalysisResult, normalizeSolutionResult, normalizeTicketDraftResult, parseAIResponse } from "../normalizers";

type AnthropicContentBlock = {
  type: "text" | "image";
  text?: string;
  source?: { type: "base64"; media_type: string; data: string };
};

type AnthropicMessage = {
  role: "user" | "assistant";
  content: string | AnthropicContentBlock[];
};

export class AnthropicProvider implements AIProvider {
  private apiKey: string;
  private model: string;

  constructor(config: AIProviderConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model;
  }

  private async callAPI(
    systemPrompt: string,
    messages: AnthropicMessage[],
    maxTokens: number = 1024
  ): Promise<string> {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: maxTokens,
        system: systemPrompt,
        messages,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || `Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    const textBlock = data.content?.find((block: { type: string }) => block.type === "text");
    const content = textBlock?.text;

    if (!content) {
      throw new Error("No response from Anthropic");
    }

    return content;
  }

  private buildImageContent(text: string, screenshotBase64?: string, mediaType?: string): AnthropicContentBlock[] {
    const blocks: AnthropicContentBlock[] = [{ type: "text", text }];

    if (screenshotBase64) {
      blocks.push({
        type: "image",
        source: {
          type: "base64",
          media_type: mediaType || "image/png",
          data: screenshotBase64,
        },
      });
    }

    return blocks;
  }

  async analyzeFeedback(input: AnalysisInput): Promise<AIAnalysisResult> {
    const messages: AnthropicMessage[] = [
      {
        role: "user",
        content: this.buildImageContent(
          buildAnalysisPrompt(input.feedback),
          input.screenshotBase64,
          input.screenshotMediaType
        ),
      },
    ];

    const content = await this.callAPI(ANALYSIS_SYSTEM_PROMPT, messages, 1024);
    return normalizeAnalysisResult(parseAIResponse(content));
  }

  async generateSolutions(input: SolutionInput): Promise<SolutionSuggestionsResult> {
    const messages: AnthropicMessage[] = [
      {
        role: "user",
        content: this.buildImageContent(
          buildSolutionPrompt(input.feedback, input.existingAnalysis),
          input.screenshotBase64,
          input.screenshotMediaType
        ),
      },
    ];

    const content = await this.callAPI(SOLUTION_SUGGESTIONS_PROMPT, messages, 2048);
    return normalizeSolutionResult(parseAIResponse(content));
  }

  async generateTicketDraft(input: TicketDraftInput): Promise<TicketDraftResult> {
    const messages: AnthropicMessage[] = [
      {
        role: "user",
        content: this.buildImageContent(
          buildTicketDraftPrompt(
            input.feedback,
            input.existingAnalysis,
            input.existingSuggestions,
            input.currentDraft
          ),
          input.screenshotBase64,
          input.screenshotMediaType
        ),
      },
    ];

    const content = await this.callAPI(TICKET_DRAFT_PROMPT, messages, 2048);
    return normalizeTicketDraftResult(parseAIResponse(content));
  }

  async processConversation(input: ConversationInput): Promise<string> {
    const messages: AnthropicMessage[] = [];

    // Add feedback context with optional screenshot
    if (input.screenshotBase64) {
      messages.push({
        role: "user",
        content: this.buildImageContent(
          input.feedbackContext + "\n\nA screenshot is attached showing the issue or context.",
          input.screenshotBase64,
          input.screenshotMediaType
        ),
      });
    } else {
      messages.push({
        role: "user",
        content: input.feedbackContext,
      });
    }

    // Add acknowledgment
    messages.push({
      role: "assistant",
      content: "I've reviewed the feedback context. How can I help you understand or process this feedback?",
    });

    // Add conversation history
    for (const msg of input.conversationHistory) {
      messages.push({
        role: msg.role,
        content: msg.content,
      });
    }

    // Add new user message
    messages.push({
      role: "user",
      content: input.userMessage,
    });

    return await this.callAPI(CONVERSATION_SYSTEM_PROMPT, messages, 1500);
  }
}
