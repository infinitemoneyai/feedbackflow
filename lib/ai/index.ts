/**
 * AI Service Wrapper for FeedbackFlow
 * Supports both OpenAI and Anthropic providers
 */

export type AIProvider = "openai" | "anthropic";

export type FeedbackType = "bug" | "feature";

export type FeedbackPriority = "low" | "medium" | "high" | "critical";

export interface FeedbackData {
  title: string;
  description?: string;
  type: FeedbackType;
  screenshotUrl?: string;
  metadata: {
    browser?: string;
    os?: string;
    url?: string;
    screenWidth?: number;
    screenHeight?: number;
  };
}

export interface AIAnalysisResult {
  suggestedType: FeedbackType;
  typeConfidence: number; // 0-1
  suggestedPriority: FeedbackPriority;
  priorityConfidence: number; // 0-1
  suggestedTags: string[];
  summary: string;
  affectedComponent?: string;
  potentialCauses: string[];
  suggestedSolutions: string[];
}

const ANALYSIS_SYSTEM_PROMPT = `You are an expert software product analyst helping to triage user feedback. Analyze the following feedback and provide categorization and insights.

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

function buildAnalysisPrompt(feedback: FeedbackData): string {
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

  if (feedback.screenshotUrl) {
    prompt += `
## Screenshot
A screenshot was provided with this feedback.
`;
  }

  prompt += `
Please analyze this feedback and provide your assessment in JSON format.`;

  return prompt;
}

/**
 * Call OpenAI API for feedback analysis
 */
async function analyzeWithOpenAI(
  apiKey: string,
  model: string,
  feedback: FeedbackData,
  screenshotBase64?: string
): Promise<AIAnalysisResult> {
  const messages: Array<{
    role: "system" | "user";
    content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
  }> = [
    {
      role: "system",
      content: ANALYSIS_SYSTEM_PROMPT,
    },
  ];

  // Build user message with optional image
  if (screenshotBase64) {
    messages.push({
      role: "user",
      content: [
        {
          type: "text",
          text: buildAnalysisPrompt(feedback),
        },
        {
          type: "image_url",
          image_url: {
            url: `data:image/png;base64,${screenshotBase64}`,
          },
        },
      ],
    });
  } else {
    messages.push({
      role: "user",
      content: buildAnalysisPrompt(feedback),
    });
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.3,
      response_format: { type: "json_object" },
    }),
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

  try {
    return JSON.parse(content) as AIAnalysisResult;
  } catch {
    throw new Error("Failed to parse OpenAI response as JSON");
  }
}

/**
 * Call Anthropic API for feedback analysis
 */
async function analyzeWithAnthropic(
  apiKey: string,
  model: string,
  feedback: FeedbackData,
  screenshotBase64?: string
): Promise<AIAnalysisResult> {
  const contentBlocks: Array<{
    type: "text" | "image";
    text?: string;
    source?: { type: "base64"; media_type: string; data: string };
  }> = [
    {
      type: "text",
      text: buildAnalysisPrompt(feedback),
    },
  ];

  // Add image if available
  if (screenshotBase64) {
    contentBlocks.push({
      type: "image",
      source: {
        type: "base64",
        media_type: "image/png",
        data: screenshotBase64,
      },
    });
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      system: ANALYSIS_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: contentBlocks,
        },
      ],
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

  // Try to extract JSON from the response
  try {
    // First try direct parse
    return JSON.parse(content) as AIAnalysisResult;
  } catch {
    // Try to find JSON in the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as AIAnalysisResult;
    }
    throw new Error("Failed to parse Anthropic response as JSON");
  }
}

/**
 * Main function to analyze feedback using the configured AI provider
 */
export async function analyzeFeedback(
  provider: AIProvider,
  apiKey: string,
  model: string,
  feedback: FeedbackData,
  screenshotBase64?: string
): Promise<AIAnalysisResult> {
  if (provider === "openai") {
    return analyzeWithOpenAI(apiKey, model, feedback, screenshotBase64);
  } else {
    return analyzeWithAnthropic(apiKey, model, feedback, screenshotBase64);
  }
}

/**
 * Validate an analysis result has all required fields
 */
export function validateAnalysisResult(result: unknown): result is AIAnalysisResult {
  if (typeof result !== "object" || result === null) {
    return false;
  }

  const r = result as Record<string, unknown>;

  // Check required fields
  if (r.suggestedType !== "bug" && r.suggestedType !== "feature") {
    return false;
  }

  if (typeof r.typeConfidence !== "number" || r.typeConfidence < 0 || r.typeConfidence > 1) {
    return false;
  }

  const validPriorities = ["low", "medium", "high", "critical"];
  if (!validPriorities.includes(r.suggestedPriority as string)) {
    return false;
  }

  if (
    typeof r.priorityConfidence !== "number" ||
    r.priorityConfidence < 0 ||
    r.priorityConfidence > 1
  ) {
    return false;
  }

  if (!Array.isArray(r.suggestedTags)) {
    return false;
  }

  if (typeof r.summary !== "string") {
    return false;
  }

  if (!Array.isArray(r.potentialCauses)) {
    return false;
  }

  if (!Array.isArray(r.suggestedSolutions)) {
    return false;
  }

  return true;
}

/**
 * Normalize an analysis result with defaults for missing optional fields
 */
export function normalizeAnalysisResult(result: Partial<AIAnalysisResult>): AIAnalysisResult {
  return {
    suggestedType: result.suggestedType || "bug",
    typeConfidence: Math.min(1, Math.max(0, result.typeConfidence || 0.5)),
    suggestedPriority: result.suggestedPriority || "medium",
    priorityConfidence: Math.min(1, Math.max(0, result.priorityConfidence || 0.5)),
    suggestedTags: Array.isArray(result.suggestedTags) ? result.suggestedTags.slice(0, 10) : [],
    summary: result.summary || "No summary available",
    affectedComponent: result.affectedComponent || undefined,
    potentialCauses: Array.isArray(result.potentialCauses) ? result.potentialCauses.slice(0, 5) : [],
    suggestedSolutions: Array.isArray(result.suggestedSolutions)
      ? result.suggestedSolutions.slice(0, 5)
      : [],
  };
}
