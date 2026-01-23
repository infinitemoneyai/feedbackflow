/**
 * OpenAI provider implementation
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

type OpenAIMessage = {
  role: "system" | "user" | "assistant";
  content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
};

export class OpenAIProvider implements AIProvider {
  private apiKey: string;
  private model: string;

  constructor(config: AIProviderConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model;
  }

  private async callAPI(
    messages: OpenAIMessage[],
    temperature: number = 0.3,
    useJsonMode: boolean = true
  ): Promise<string> {
    const body: Record<string, unknown> = {
      model: this.model,
      messages,
      temperature,
    };

    if (useJsonMode) {
      body.response_format = { type: "json_object" };
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || `OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No response from OpenAI");
    }

    return content;
  }

  private buildImageContent(text: string, screenshotBase64?: string, mediaType?: string) {
    if (!screenshotBase64) {
      return text;
    }

    return [
      { type: "text", text },
      {
        type: "image_url",
        image_url: { url: `data:${mediaType || "image/png"};base64,${screenshotBase64}` },
      },
    ];
  }

  async analyzeFeedback(input: AnalysisInput): Promise<AIAnalysisResult> {
    const messages: OpenAIMessage[] = [
      { role: "system", content: ANALYSIS_SYSTEM_PROMPT },
      {
        role: "user",
        content: this.buildImageContent(
          buildAnalysisPrompt(input.feedback),
          input.screenshotBase64,
          input.screenshotMediaType
        ),
      },
    ];

    const content = await this.callAPI(messages, 0.3, true);
    return normalizeAnalysisResult(parseAIResponse(content));
  }

  async generateSolutions(input: SolutionInput): Promise<SolutionSuggestionsResult> {
    const messages: OpenAIMessage[] = [
      { role: "system", content: SOLUTION_SUGGESTIONS_PROMPT },
      {
        role: "user",
        content: this.buildImageContent(
          buildSolutionPrompt(input.feedback, input.existingAnalysis),
          input.screenshotBase64,
          input.screenshotMediaType
        ),
      },
    ];

    const content = await this.callAPI(messages, 0.4, true);
    return normalizeSolutionResult(parseAIResponse(content));
  }

  async generateTicketDraft(input: TicketDraftInput): Promise<TicketDraftResult> {
    const messages: OpenAIMessage[] = [
      { role: "system", content: TICKET_DRAFT_PROMPT },
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

    const content = await this.callAPI(messages, 0.4, true);
    return normalizeTicketDraftResult(parseAIResponse(content));
  }

  async processConversation(input: ConversationInput): Promise<string> {
    const messages: OpenAIMessage[] = [
      { role: "system", content: CONVERSATION_SYSTEM_PROMPT },
    ];

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

    return await this.callAPI(messages, 0.7, false);
  }
}
