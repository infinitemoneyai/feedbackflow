import { v } from "convex/values";
import { action, internalAction } from "./_generated/server";
import { internal, api } from "./_generated/api";

/**
 * AI Analysis Action - makes external API calls to AI providers
 * This action is triggered when auto-categorization is requested
 */
export const analyzeFeedbackAction = internalAction({
  args: {
    feedbackId: v.id("feedback"),
    teamId: v.id("teams"),
    provider: v.union(v.literal("openai"), v.literal("anthropic")),
    model: v.string(),
    apiKey: v.string(),
  },
  handler: async (ctx, args) => {
    // Fetch feedback data
    const feedback = await ctx.runQuery(api.feedback.getFeedback, {
      feedbackId: args.feedbackId,
    });

    if (!feedback) {
      throw new Error("Feedback not found");
    }

    // Build the analysis prompt
    const feedbackData = {
      title: feedback.title,
      description: feedback.description,
      type: feedback.type,
      screenshotUrl: feedback.screenshotUrl,
      metadata: {
        browser: feedback.metadata.browser,
        os: feedback.metadata.os,
        url: feedback.metadata.url,
        screenWidth: feedback.metadata.screenWidth,
        screenHeight: feedback.metadata.screenHeight,
      },
    };

    // Fetch screenshot if available for vision analysis
    let screenshotBase64: string | undefined;
    if (feedback.screenshotUrl) {
      try {
        const imageResponse = await fetch(feedback.screenshotUrl);
        if (imageResponse.ok) {
          const arrayBuffer = await imageResponse.arrayBuffer();
          screenshotBase64 = Buffer.from(arrayBuffer).toString("base64");
        }
      } catch (err) {
        console.warn("Failed to fetch screenshot for AI analysis:", err);
      }
    }

    // Call the AI API
    let analysisResult;
    if (args.provider === "openai") {
      analysisResult = await callOpenAI(args.apiKey, args.model, feedbackData, screenshotBase64);
    } else {
      analysisResult = await callAnthropic(args.apiKey, args.model, feedbackData, screenshotBase64);
    }

    // Store the analysis result
    await ctx.runMutation(internal.ai.storeAnalysisInternal, {
      feedbackId: args.feedbackId,
      analysis: {
        suggestedType: analysisResult.suggestedType,
        typeConfidence: analysisResult.typeConfidence,
        suggestedPriority: analysisResult.suggestedPriority,
        priorityConfidence: analysisResult.priorityConfidence,
        suggestedTags: analysisResult.suggestedTags,
        summary: analysisResult.summary,
        affectedComponent: analysisResult.affectedComponent,
        potentialCauses: analysisResult.potentialCauses,
        suggestedSolutions: analysisResult.suggestedSolutions,
      },
      provider: args.provider,
      model: args.model,
    });

    return { success: true };
  },
});

/**
 * System prompt for AI analysis
 */
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

/**
 * Build the user message for analysis
 */
function buildAnalysisPrompt(feedback: {
  title: string;
  description?: string;
  type: string;
  metadata: {
    browser?: string;
    os?: string;
    url?: string;
    screenWidth?: number;
    screenHeight?: number;
  };
}): string {
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

  prompt += `
Please analyze this feedback and provide your assessment in JSON format.`;

  return prompt;
}

interface AIAnalysisResult {
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

/**
 * Call OpenAI API for analysis
 */
async function callOpenAI(
  apiKey: string,
  model: string,
  feedback: {
    title: string;
    description?: string;
    type: string;
    metadata: {
      browser?: string;
      os?: string;
      url?: string;
      screenWidth?: number;
      screenHeight?: number;
    };
  },
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

  return normalizeResult(JSON.parse(content));
}

/**
 * Call Anthropic API for analysis
 */
async function callAnthropic(
  apiKey: string,
  model: string,
  feedback: {
    title: string;
    description?: string;
    type: string;
    metadata: {
      browser?: string;
      os?: string;
      url?: string;
      screenWidth?: number;
      screenHeight?: number;
    };
  },
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
    return normalizeResult(JSON.parse(content));
  } catch {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return normalizeResult(JSON.parse(jsonMatch[0]));
    }
    throw new Error("Failed to parse Anthropic response as JSON");
  }
}

/**
 * Normalize analysis result with defaults
 */
function normalizeResult(result: Partial<AIAnalysisResult>): AIAnalysisResult {
  return {
    suggestedType: result.suggestedType === "feature" ? "feature" : "bug",
    typeConfidence: Math.min(1, Math.max(0, result.typeConfidence || 0.5)),
    suggestedPriority: (["low", "medium", "high", "critical"].includes(result.suggestedPriority as string)
      ? result.suggestedPriority
      : "medium") as "low" | "medium" | "high" | "critical",
    priorityConfidence: Math.min(1, Math.max(0, result.priorityConfidence || 0.5)),
    suggestedTags: Array.isArray(result.suggestedTags) ? result.suggestedTags.slice(0, 10) : [],
    summary: result.summary || "No summary available",
    affectedComponent: result.affectedComponent || undefined,
    potentialCauses: Array.isArray(result.potentialCauses) ? result.potentialCauses.slice(0, 5) : [],
    suggestedSolutions: Array.isArray(result.suggestedSolutions) ? result.suggestedSolutions.slice(0, 5) : [],
  };
}

/**
 * Public action to trigger analysis (called from API routes)
 */
export const triggerAnalysis = action({
  args: {
    feedbackId: v.id("feedback"),
    teamId: v.id("teams"),
  },
  handler: async (ctx, args) => {
    // Get AI config for the team
    const aiConfig = await ctx.runQuery(api.ai.getTeamAiConfig, {
      teamId: args.teamId,
    });

    if (!aiConfig?.isConfigured || !aiConfig.preferredProvider || !aiConfig.preferredModel) {
      return { success: false, error: "AI not configured" };
    }

    // Get the API key
    const apiKeyData = await ctx.runQuery(api.apiKeys.getDecryptedApiKey, {
      teamId: args.teamId,
      provider: aiConfig.preferredProvider,
    });

    if (!apiKeyData?.key) {
      return { success: false, error: "API key not found" };
    }

    // Schedule the analysis action
    await ctx.scheduler.runAfter(0, internal.aiActions.analyzeFeedbackAction, {
      feedbackId: args.feedbackId,
      teamId: args.teamId,
      provider: aiConfig.preferredProvider,
      model: aiConfig.preferredModel,
      apiKey: apiKeyData.key,
    });

    return { success: true };
  },
});

// =============================================================================
// Solution Suggestions Generation
// =============================================================================

/**
 * System prompt for generating solution suggestions
 */
const SOLUTION_SUGGESTIONS_PROMPT = `You are an expert software engineer and product analyst. Your task is to provide detailed, actionable solution suggestions for user feedback.

Based on the feedback provided, generate specific, practical solutions that a development team can implement.

For BUG reports, provide:
1. Investigation steps to identify the root cause
2. Potential causes with likelihood assessment
3. Specific fixes or workarounds
4. Testing recommendations

For FEATURE requests, provide:
1. Implementation approaches with trade-offs
2. Technical considerations
3. Potential challenges and how to address them
4. Phased implementation options if applicable

Respond with a JSON object in this exact format:
{
  "suggestions": [
    {
      "title": "Brief title of the suggestion",
      "description": "Detailed description of what to do",
      "type": "investigation" | "fix" | "workaround" | "implementation" | "consideration",
      "effort": "low" | "medium" | "high",
      "impact": "low" | "medium" | "high"
    }
  ],
  "summary": "One sentence summary of the recommended approach",
  "nextSteps": ["Step 1", "Step 2", "Step 3"]
}

Provide 3-5 suggestions, ordered by recommended priority. Be specific and actionable.`;

/**
 * Build the user message for solution suggestions
 */
function buildSolutionPrompt(feedback: {
  title: string;
  description?: string;
  type: string;
  metadata: {
    browser?: string;
    os?: string;
    url?: string;
  };
  existingAnalysis?: {
    summary?: string;
    potentialCauses?: string[];
    affectedComponent?: string;
  };
}): string {
  let prompt = `# Feedback Requiring Solutions

## Title
${feedback.title}

## Type
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

  if (feedback.existingAnalysis) {
    if (feedback.existingAnalysis.summary) {
      prompt += `
## AI Analysis Summary
${feedback.existingAnalysis.summary}
`;
    }
    if (feedback.existingAnalysis.affectedComponent) {
      prompt += `
## Affected Component
${feedback.existingAnalysis.affectedComponent}
`;
    }
    if (feedback.existingAnalysis.potentialCauses && feedback.existingAnalysis.potentialCauses.length > 0) {
      prompt += `
## Previously Identified Causes
${feedback.existingAnalysis.potentialCauses.map((c) => `- ${c}`).join("\n")}
`;
    }
  }

  prompt += `
Please analyze this ${feedback.type === "bug" ? "bug" : "feature request"} and provide detailed, actionable solution suggestions in JSON format.`;

  return prompt;
}

interface SolutionSuggestion {
  title: string;
  description: string;
  type: "investigation" | "fix" | "workaround" | "implementation" | "consideration";
  effort: "low" | "medium" | "high";
  impact: "low" | "medium" | "high";
}

interface SolutionSuggestionsResult {
  suggestions: SolutionSuggestion[];
  summary: string;
  nextSteps: string[];
}

/**
 * Call OpenAI for solution suggestions
 */
async function callOpenAIForSolutions(
  apiKey: string,
  model: string,
  feedback: {
    title: string;
    description?: string;
    type: string;
    metadata: { browser?: string; os?: string; url?: string };
    existingAnalysis?: {
      summary?: string;
      potentialCauses?: string[];
      affectedComponent?: string;
    };
  },
  screenshotBase64?: string
): Promise<SolutionSuggestionsResult> {
  const messages: Array<{
    role: "system" | "user";
    content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
  }> = [
    {
      role: "system",
      content: SOLUTION_SUGGESTIONS_PROMPT,
    },
  ];

  if (screenshotBase64) {
    messages.push({
      role: "user",
      content: [
        {
          type: "text",
          text: buildSolutionPrompt(feedback),
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
      content: buildSolutionPrompt(feedback),
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
      temperature: 0.4,
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

  return normalizeSolutionResult(JSON.parse(content));
}

/**
 * Call Anthropic for solution suggestions
 */
async function callAnthropicForSolutions(
  apiKey: string,
  model: string,
  feedback: {
    title: string;
    description?: string;
    type: string;
    metadata: { browser?: string; os?: string; url?: string };
    existingAnalysis?: {
      summary?: string;
      potentialCauses?: string[];
      affectedComponent?: string;
    };
  },
  screenshotBase64?: string
): Promise<SolutionSuggestionsResult> {
  const contentBlocks: Array<{
    type: "text" | "image";
    text?: string;
    source?: { type: "base64"; media_type: string; data: string };
  }> = [
    {
      type: "text",
      text: buildSolutionPrompt(feedback),
    },
  ];

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
      max_tokens: 2048,
      system: SOLUTION_SUGGESTIONS_PROMPT,
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

  try {
    return normalizeSolutionResult(JSON.parse(content));
  } catch {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return normalizeSolutionResult(JSON.parse(jsonMatch[0]));
    }
    throw new Error("Failed to parse Anthropic response as JSON");
  }
}

/**
 * Normalize solution suggestions result
 */
function normalizeSolutionResult(result: Partial<SolutionSuggestionsResult>): SolutionSuggestionsResult {
  const validTypes = ["investigation", "fix", "workaround", "implementation", "consideration"];
  const validEffort = ["low", "medium", "high"];
  const validImpact = ["low", "medium", "high"];

  const suggestions: SolutionSuggestion[] = (result.suggestions || []).slice(0, 5).map((s) => ({
    title: s?.title || "Untitled suggestion",
    description: s?.description || "No description provided",
    type: validTypes.includes(s?.type as string) ? s.type : "consideration",
    effort: validEffort.includes(s?.effort as string) ? s.effort : "medium",
    impact: validImpact.includes(s?.impact as string) ? s.impact : "medium",
  })) as SolutionSuggestion[];

  return {
    suggestions,
    summary: result.summary || "Review the suggestions below for recommended actions.",
    nextSteps: Array.isArray(result.nextSteps) ? result.nextSteps.slice(0, 5) : [],
  };
}

/**
 * Internal action to generate solution suggestions
 */
export const generateSolutionsAction = internalAction({
  args: {
    feedbackId: v.id("feedback"),
    teamId: v.id("teams"),
    provider: v.union(v.literal("openai"), v.literal("anthropic")),
    model: v.string(),
    apiKey: v.string(),
  },
  handler: async (ctx, args) => {
    // Fetch feedback data
    const feedback = await ctx.runQuery(api.feedback.getFeedback, {
      feedbackId: args.feedbackId,
    });

    if (!feedback) {
      throw new Error("Feedback not found");
    }

    // Get existing AI analysis if available
    const existingAnalysis = await ctx.runQuery(api.ai.getAnalysis, {
      feedbackId: args.feedbackId,
    });

    const feedbackData = {
      title: feedback.title,
      description: feedback.description,
      type: feedback.type,
      metadata: {
        browser: feedback.metadata.browser,
        os: feedback.metadata.os,
        url: feedback.metadata.url,
      },
      existingAnalysis: existingAnalysis
        ? {
            summary: existingAnalysis.summary,
            potentialCauses: existingAnalysis.potentialCauses,
            affectedComponent: existingAnalysis.affectedComponent,
          }
        : undefined,
    };

    // Fetch screenshot if available
    let screenshotBase64: string | undefined;
    if (feedback.screenshotUrl) {
      try {
        const imageResponse = await fetch(feedback.screenshotUrl);
        if (imageResponse.ok) {
          const arrayBuffer = await imageResponse.arrayBuffer();
          screenshotBase64 = Buffer.from(arrayBuffer).toString("base64");
        }
      } catch (err) {
        console.warn("Failed to fetch screenshot for solution generation:", err);
      }
    }

    // Call the AI API
    let solutionsResult: SolutionSuggestionsResult;
    if (args.provider === "openai") {
      solutionsResult = await callOpenAIForSolutions(args.apiKey, args.model, feedbackData, screenshotBase64);
    } else {
      solutionsResult = await callAnthropicForSolutions(args.apiKey, args.model, feedbackData, screenshotBase64);
    }

    // Store the solution suggestions
    await ctx.runMutation(internal.ai.storeSolutionSuggestions, {
      feedbackId: args.feedbackId,
      suggestions: solutionsResult.suggestions,
      summary: solutionsResult.summary,
      nextSteps: solutionsResult.nextSteps,
      provider: args.provider,
      model: args.model,
    });

    return { success: true };
  },
});

/**
 * Public action to trigger solution generation
 */
export const triggerSolutionGeneration = action({
  args: {
    feedbackId: v.id("feedback"),
    teamId: v.id("teams"),
  },
  handler: async (ctx, args) => {
    // Get AI config for the team
    const aiConfig = await ctx.runQuery(api.ai.getTeamAiConfig, {
      teamId: args.teamId,
    });

    if (!aiConfig?.isConfigured || !aiConfig.preferredProvider || !aiConfig.preferredModel) {
      return { success: false, error: "AI not configured" };
    }

    // Get the API key
    const apiKeyData = await ctx.runQuery(api.apiKeys.getDecryptedApiKey, {
      teamId: args.teamId,
      provider: aiConfig.preferredProvider,
    });

    if (!apiKeyData?.key) {
      return { success: false, error: "API key not found" };
    }

    // Schedule the solution generation action
    await ctx.scheduler.runAfter(0, internal.aiActions.generateSolutionsAction, {
      feedbackId: args.feedbackId,
      teamId: args.teamId,
      provider: aiConfig.preferredProvider,
      model: aiConfig.preferredModel,
      apiKey: apiKeyData.key,
    });

    return { success: true };
  },
});

// =============================================================================
// Ticket Draft Generation
// =============================================================================

/**
 * System prompt for generating ticket drafts
 */
const TICKET_DRAFT_PROMPT = `You are an expert technical writer creating actionable tickets for development teams.

Your task is to transform user feedback into a well-structured, clear ticket that developers can act on immediately.

For BUG reports, create a ticket with:
- Clear, concise title (50-80 chars)
- Detailed description explaining the issue
- Step-by-step reproduction steps (numbered)
- Expected behavior
- Actual behavior
- Acceptance criteria for the fix

For FEATURE requests, create a ticket with:
- Clear, descriptive title (50-80 chars)
- User story format description: "As a [user type], I want to [action] so that [benefit]"
- Detailed description expanding on the user's request
- Acceptance criteria (checkboxes-style, testable requirements)

Respond with a JSON object in this exact format:
{
  "title": "Clear, actionable ticket title",
  "description": "Detailed description of the issue or feature",
  "acceptanceCriteria": ["Criterion 1", "Criterion 2", "..."],
  "reproSteps": ["Step 1", "Step 2", "..."],  // Only for bugs
  "expectedBehavior": "What should happen",  // Only for bugs
  "actualBehavior": "What actually happens"  // Only for bugs
}

Guidelines:
- Be specific and actionable
- Use technical language appropriately
- Include all relevant context from the feedback
- Acceptance criteria should be testable (can be checked off as done/not done)
- For bugs: always include repro steps, expected, and actual behavior
- For features: focus on the user story and clear acceptance criteria`;

/**
 * Build the user message for ticket drafting
 */
function buildTicketDraftPrompt(feedback: {
  title: string;
  description?: string;
  type: string;
  metadata: {
    browser?: string;
    os?: string;
    url?: string;
  };
  existingAnalysis?: {
    summary?: string;
    potentialCauses?: string[];
    affectedComponent?: string;
    suggestedSolutions?: string[];
  };
  existingSuggestions?: {
    summary?: string;
    suggestions?: Array<{ title: string; description: string }>;
    nextSteps?: string[];
  };
}): string {
  let prompt = `# Feedback to Convert to Ticket

## Original Title
${feedback.title}

## Type
${feedback.type === "bug" ? "Bug Report" : "Feature Request"}
`;

  if (feedback.description) {
    prompt += `
## Original Description
${feedback.description}
`;
  }

  if (feedback.metadata.url) {
    prompt += `
## Page URL
${feedback.metadata.url}
`;
  }

  if (feedback.metadata.browser || feedback.metadata.os) {
    prompt += `
## Environment
`;
    if (feedback.metadata.browser) prompt += `- Browser: ${feedback.metadata.browser}\n`;
    if (feedback.metadata.os) prompt += `- OS: ${feedback.metadata.os}\n`;
  }

  if (feedback.existingAnalysis) {
    if (feedback.existingAnalysis.summary) {
      prompt += `
## AI Analysis Summary
${feedback.existingAnalysis.summary}
`;
    }
    if (feedback.existingAnalysis.affectedComponent) {
      prompt += `
## Affected Component
${feedback.existingAnalysis.affectedComponent}
`;
    }
    if (feedback.existingAnalysis.potentialCauses && feedback.existingAnalysis.potentialCauses.length > 0) {
      prompt += `
## Identified Causes
${feedback.existingAnalysis.potentialCauses.map((c) => `- ${c}`).join("\n")}
`;
    }
    if (feedback.existingAnalysis.suggestedSolutions && feedback.existingAnalysis.suggestedSolutions.length > 0) {
      prompt += `
## Suggested Solutions
${feedback.existingAnalysis.suggestedSolutions.map((s) => `- ${s}`).join("\n")}
`;
    }
  }

  if (feedback.existingSuggestions) {
    if (feedback.existingSuggestions.summary) {
      prompt += `
## Solution Recommendations
${feedback.existingSuggestions.summary}
`;
    }
    if (feedback.existingSuggestions.suggestions && feedback.existingSuggestions.suggestions.length > 0) {
      prompt += `
## Detailed Suggestions
${feedback.existingSuggestions.suggestions.map((s) => `- **${s.title}**: ${s.description}`).join("\n")}
`;
    }
    if (feedback.existingSuggestions.nextSteps && feedback.existingSuggestions.nextSteps.length > 0) {
      prompt += `
## Recommended Next Steps
${feedback.existingSuggestions.nextSteps.map((s, i) => `${i + 1}. ${s}`).join("\n")}
`;
    }
  }

  prompt += `
Please convert this ${feedback.type === "bug" ? "bug report" : "feature request"} into a well-structured ticket in JSON format.`;

  return prompt;
}

interface TicketDraftResult {
  title: string;
  description: string;
  acceptanceCriteria: string[];
  reproSteps?: string[];
  expectedBehavior?: string;
  actualBehavior?: string;
}

/**
 * Call OpenAI for ticket draft generation
 */
async function callOpenAIForTicketDraft(
  apiKey: string,
  model: string,
  feedback: {
    title: string;
    description?: string;
    type: string;
    metadata: { browser?: string; os?: string; url?: string };
    existingAnalysis?: {
      summary?: string;
      potentialCauses?: string[];
      affectedComponent?: string;
      suggestedSolutions?: string[];
    };
    existingSuggestions?: {
      summary?: string;
      suggestions?: Array<{ title: string; description: string }>;
      nextSteps?: string[];
    };
  },
  screenshotBase64?: string
): Promise<TicketDraftResult> {
  const messages: Array<{
    role: "system" | "user";
    content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
  }> = [
    {
      role: "system",
      content: TICKET_DRAFT_PROMPT,
    },
  ];

  if (screenshotBase64) {
    messages.push({
      role: "user",
      content: [
        {
          type: "text",
          text: buildTicketDraftPrompt(feedback),
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
      content: buildTicketDraftPrompt(feedback),
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
      temperature: 0.4,
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

  return normalizeTicketDraftResult(JSON.parse(content));
}

/**
 * Call Anthropic for ticket draft generation
 */
async function callAnthropicForTicketDraft(
  apiKey: string,
  model: string,
  feedback: {
    title: string;
    description?: string;
    type: string;
    metadata: { browser?: string; os?: string; url?: string };
    existingAnalysis?: {
      summary?: string;
      potentialCauses?: string[];
      affectedComponent?: string;
      suggestedSolutions?: string[];
    };
    existingSuggestions?: {
      summary?: string;
      suggestions?: Array<{ title: string; description: string }>;
      nextSteps?: string[];
    };
  },
  screenshotBase64?: string
): Promise<TicketDraftResult> {
  const contentBlocks: Array<{
    type: "text" | "image";
    text?: string;
    source?: { type: "base64"; media_type: string; data: string };
  }> = [
    {
      type: "text",
      text: buildTicketDraftPrompt(feedback),
    },
  ];

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
      max_tokens: 2048,
      system: TICKET_DRAFT_PROMPT,
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

  try {
    return normalizeTicketDraftResult(JSON.parse(content));
  } catch {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return normalizeTicketDraftResult(JSON.parse(jsonMatch[0]));
    }
    throw new Error("Failed to parse Anthropic response as JSON");
  }
}

/**
 * Normalize ticket draft result
 */
function normalizeTicketDraftResult(result: Partial<TicketDraftResult>): TicketDraftResult {
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
 * Internal action to generate ticket draft
 */
export const generateTicketDraftAction = internalAction({
  args: {
    feedbackId: v.id("feedback"),
    teamId: v.id("teams"),
    userId: v.id("users"),
    provider: v.union(v.literal("openai"), v.literal("anthropic")),
    model: v.string(),
    apiKey: v.string(),
  },
  handler: async (ctx, args) => {
    // Fetch feedback data
    const feedback = await ctx.runQuery(api.feedback.getFeedback, {
      feedbackId: args.feedbackId,
    });

    if (!feedback) {
      throw new Error("Feedback not found");
    }

    // Get existing AI analysis if available
    const existingAnalysis = await ctx.runQuery(api.ai.getAnalysis, {
      feedbackId: args.feedbackId,
    });

    // Get existing solution suggestions if available
    const existingSuggestions = await ctx.runQuery(api.ai.getSolutionSuggestions, {
      feedbackId: args.feedbackId,
    });

    const feedbackData = {
      title: feedback.title,
      description: feedback.description,
      type: feedback.type,
      metadata: {
        browser: feedback.metadata.browser,
        os: feedback.metadata.os,
        url: feedback.metadata.url,
      },
      existingAnalysis: existingAnalysis
        ? {
            summary: existingAnalysis.summary,
            potentialCauses: existingAnalysis.potentialCauses,
            affectedComponent: existingAnalysis.affectedComponent,
            suggestedSolutions: existingAnalysis.suggestedSolutions,
          }
        : undefined,
      existingSuggestions: existingSuggestions
        ? {
            summary: existingSuggestions.summary,
            suggestions: existingSuggestions.suggestions?.map((s: { title: string; description: string }) => ({
              title: s.title,
              description: s.description,
            })),
            nextSteps: existingSuggestions.nextSteps,
          }
        : undefined,
    };

    // Fetch screenshot if available
    let screenshotBase64: string | undefined;
    if (feedback.screenshotUrl) {
      try {
        const imageResponse = await fetch(feedback.screenshotUrl);
        if (imageResponse.ok) {
          const arrayBuffer = await imageResponse.arrayBuffer();
          screenshotBase64 = Buffer.from(arrayBuffer).toString("base64");
        }
      } catch (err) {
        console.warn("Failed to fetch screenshot for ticket draft generation:", err);
      }
    }

    // Call the AI API
    let draftResult: TicketDraftResult;
    if (args.provider === "openai") {
      draftResult = await callOpenAIForTicketDraft(args.apiKey, args.model, feedbackData, screenshotBase64);
    } else {
      draftResult = await callAnthropicForTicketDraft(args.apiKey, args.model, feedbackData, screenshotBase64);
    }

    // Store the ticket draft
    await ctx.runMutation(internal.ai.storeTicketDraft, {
      feedbackId: args.feedbackId,
      userId: args.userId,
      title: draftResult.title,
      description: draftResult.description,
      acceptanceCriteria: draftResult.acceptanceCriteria,
      reproSteps: draftResult.reproSteps,
      expectedBehavior: draftResult.expectedBehavior,
      actualBehavior: draftResult.actualBehavior,
      provider: args.provider,
      model: args.model,
    });

    return { success: true };
  },
});

/**
 * Public action to trigger ticket draft generation
 */
export const triggerTicketDraftGeneration = action({
  args: {
    feedbackId: v.id("feedback"),
    teamId: v.id("teams"),
  },
  handler: async (ctx, args) => {
    // Get current user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { success: false, error: "Unauthenticated" };
    }

    // Get user from database
    const user = await ctx.runQuery(api.users.getCurrentUser);
    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Get AI config for the team
    const aiConfig = await ctx.runQuery(api.ai.getTeamAiConfig, {
      teamId: args.teamId,
    });

    if (!aiConfig?.isConfigured || !aiConfig.preferredProvider || !aiConfig.preferredModel) {
      return { success: false, error: "AI not configured" };
    }

    // Get the API key
    const apiKeyData = await ctx.runQuery(api.apiKeys.getDecryptedApiKey, {
      teamId: args.teamId,
      provider: aiConfig.preferredProvider,
    });

    if (!apiKeyData?.key) {
      return { success: false, error: "API key not found" };
    }

    // Schedule the ticket draft generation action
    await ctx.scheduler.runAfter(0, internal.aiActions.generateTicketDraftAction, {
      feedbackId: args.feedbackId,
      teamId: args.teamId,
      userId: user._id,
      provider: aiConfig.preferredProvider,
      model: aiConfig.preferredModel,
      apiKey: apiKeyData.key,
    });

    return { success: true };
  },
});

// =============================================================================
// AI Conversation
// =============================================================================

/**
 * System prompt for AI conversation
 */
const CONVERSATION_SYSTEM_PROMPT = `You are an AI assistant helping a product team analyze and understand user feedback. You have access to the feedback context including the title, description, screenshot (if provided), and technical metadata.

Your role is to:
1. Help the team understand the user's issue or request better
2. Suggest potential causes or solutions
3. Answer questions about the feedback
4. Help clarify requirements or acceptance criteria
5. Identify related issues or patterns

Be helpful, concise, and technical when appropriate. If you're uncertain, say so. Focus on practical insights that help the team take action.

When referring to visual elements from screenshots, be specific about what you observe.`;

/**
 * Build context message about the feedback for the AI
 */
function buildFeedbackContextForConversation(feedback: {
  title: string;
  description?: string;
  type: string;
  priority: string;
  tags: string[];
  metadata: {
    browser?: string;
    os?: string;
    url?: string;
  };
  existingAnalysis?: {
    summary?: string;
    potentialCauses?: string[];
    affectedComponent?: string;
    suggestedSolutions?: string[];
  };
}): string {
  let context = `# Feedback Context

## Title
${feedback.title}

## Type
${feedback.type === "bug" ? "Bug Report" : "Feature Request"}

## Priority
${feedback.priority}
`;

  if (feedback.description) {
    context += `
## Description
${feedback.description}
`;
  }

  if (feedback.tags && feedback.tags.length > 0) {
    context += `
## Tags
${feedback.tags.join(", ")}
`;
  }

  if (feedback.metadata.url) {
    context += `
## Page URL
${feedback.metadata.url}
`;
  }

  if (feedback.metadata.browser || feedback.metadata.os) {
    context += `
## Technical Context
`;
    if (feedback.metadata.browser) context += `- Browser: ${feedback.metadata.browser}\n`;
    if (feedback.metadata.os) context += `- OS: ${feedback.metadata.os}\n`;
  }

  if (feedback.existingAnalysis) {
    if (feedback.existingAnalysis.summary) {
      context += `
## AI Analysis Summary
${feedback.existingAnalysis.summary}
`;
    }
    if (feedback.existingAnalysis.affectedComponent) {
      context += `
## Affected Component
${feedback.existingAnalysis.affectedComponent}
`;
    }
    if (feedback.existingAnalysis.potentialCauses && feedback.existingAnalysis.potentialCauses.length > 0) {
      context += `
## Potential Causes
${feedback.existingAnalysis.potentialCauses.map((c) => `- ${c}`).join("\n")}
`;
    }
    if (feedback.existingAnalysis.suggestedSolutions && feedback.existingAnalysis.suggestedSolutions.length > 0) {
      context += `
## Suggested Solutions
${feedback.existingAnalysis.suggestedSolutions.map((s) => `- ${s}`).join("\n")}
`;
    }
  }

  return context;
}

interface ConversationHistoryMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * Call OpenAI for conversation
 */
async function callOpenAIForConversation(
  apiKey: string,
  model: string,
  feedbackContext: string,
  conversationHistory: ConversationHistoryMessage[],
  userMessage: string,
  screenshotBase64?: string
): Promise<string> {
  const messages: Array<{
    role: "system" | "user" | "assistant";
    content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
  }> = [
    {
      role: "system",
      content: CONVERSATION_SYSTEM_PROMPT,
    },
  ];

  // Add feedback context as first user message with optional screenshot
  if (screenshotBase64) {
    messages.push({
      role: "user",
      content: [
        {
          type: "text",
          text: feedbackContext + "\n\nA screenshot is attached showing the issue or context.",
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
      content: feedbackContext,
    });
  }

  // Add a system acknowledgment of the context
  messages.push({
    role: "assistant",
    content: "I've reviewed the feedback context. How can I help you understand or process this feedback?",
  });

  // Add conversation history
  for (const msg of conversationHistory) {
    messages.push({
      role: msg.role,
      content: msg.content,
    });
  }

  // Add the new user message
  messages.push({
    role: "user",
    content: userMessage,
  });

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 1500,
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

  return content;
}

/**
 * Call Anthropic for conversation
 */
async function callAnthropicForConversation(
  apiKey: string,
  model: string,
  feedbackContext: string,
  conversationHistory: ConversationHistoryMessage[],
  userMessage: string,
  screenshotBase64?: string
): Promise<string> {
  // Build messages array for Anthropic
  const messages: Array<{
    role: "user" | "assistant";
    content: string | Array<{ type: "text" | "image"; text?: string; source?: { type: "base64"; media_type: string; data: string } }>;
  }> = [];

  // Add feedback context as first message with optional screenshot
  if (screenshotBase64) {
    messages.push({
      role: "user",
      content: [
        {
          type: "text",
          text: feedbackContext + "\n\nA screenshot is attached showing the issue or context.",
        },
        {
          type: "image",
          source: {
            type: "base64",
            media_type: "image/png",
            data: screenshotBase64,
          },
        },
      ],
    });
  } else {
    messages.push({
      role: "user",
      content: feedbackContext,
    });
  }

  // Add a system acknowledgment of the context
  messages.push({
    role: "assistant",
    content: "I've reviewed the feedback context. How can I help you understand or process this feedback?",
  });

  // Add conversation history
  for (const msg of conversationHistory) {
    messages.push({
      role: msg.role,
      content: msg.content,
    });
  }

  // Add the new user message
  messages.push({
    role: "user",
    content: userMessage,
  });

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 1500,
      system: CONVERSATION_SYSTEM_PROMPT,
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

/**
 * Internal action to process a conversation message
 */
export const processConversationMessage = internalAction({
  args: {
    feedbackId: v.id("feedback"),
    teamId: v.id("teams"),
    userId: v.id("users"),
    userMessage: v.string(),
    provider: v.union(v.literal("openai"), v.literal("anthropic")),
    model: v.string(),
    apiKey: v.string(),
  },
  handler: async (ctx, args) => {
    // Fetch feedback data
    const feedback = await ctx.runQuery(api.feedback.getFeedback, {
      feedbackId: args.feedbackId,
    });

    if (!feedback) {
      throw new Error("Feedback not found");
    }

    // Get existing AI analysis if available
    const existingAnalysis = await ctx.runQuery(api.ai.getAnalysis, {
      feedbackId: args.feedbackId,
    });

    // Get conversation history
    const conversationHistory = await ctx.runQuery(api.ai.getConversationHistory, {
      feedbackId: args.feedbackId,
    });

    // Filter to just user and assistant messages (skip the system context setup)
    const historyMessages: ConversationHistoryMessage[] = conversationHistory
      .map((msg: { role: string; content: string }) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      }));

    // Build feedback context
    const feedbackContext = buildFeedbackContextForConversation({
      title: feedback.title,
      description: feedback.description,
      type: feedback.type,
      priority: feedback.priority,
      tags: feedback.tags,
      metadata: {
        browser: feedback.metadata.browser,
        os: feedback.metadata.os,
        url: feedback.metadata.url,
      },
      existingAnalysis: existingAnalysis
        ? {
            summary: existingAnalysis.summary,
            potentialCauses: existingAnalysis.potentialCauses,
            affectedComponent: existingAnalysis.affectedComponent,
            suggestedSolutions: existingAnalysis.suggestedSolutions,
          }
        : undefined,
    });

    // Fetch screenshot if available
    let screenshotBase64: string | undefined;
    if (feedback.screenshotUrl) {
      try {
        const imageResponse = await fetch(feedback.screenshotUrl);
        if (imageResponse.ok) {
          const arrayBuffer = await imageResponse.arrayBuffer();
          screenshotBase64 = Buffer.from(arrayBuffer).toString("base64");
        }
      } catch (err) {
        console.warn("Failed to fetch screenshot for conversation:", err);
      }
    }

    // Call the AI API
    let assistantResponse: string;
    if (args.provider === "openai") {
      assistantResponse = await callOpenAIForConversation(
        args.apiKey,
        args.model,
        feedbackContext,
        historyMessages,
        args.userMessage,
        screenshotBase64
      );
    } else {
      assistantResponse = await callAnthropicForConversation(
        args.apiKey,
        args.model,
        feedbackContext,
        historyMessages,
        args.userMessage,
        screenshotBase64
      );
    }

    // Store the assistant's response
    await ctx.runMutation(internal.ai.storeAssistantMessage, {
      feedbackId: args.feedbackId,
      userId: args.userId,
      content: assistantResponse,
      provider: args.provider,
      model: args.model,
    });

    return { success: true, response: assistantResponse };
  },
});

/**
 * Public action to send a conversation message
 */
export const sendConversationMessage = action({
  args: {
    feedbackId: v.id("feedback"),
    teamId: v.id("teams"),
    userMessage: v.string(),
  },
  handler: async (ctx, args) => {
    // Get current user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { success: false, error: "Unauthenticated" };
    }

    // Get user from database
    const user = await ctx.runQuery(api.users.getCurrentUser);
    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Get AI config for the team
    const aiConfig = await ctx.runQuery(api.ai.getTeamAiConfig, {
      teamId: args.teamId,
    });

    if (!aiConfig?.isConfigured || !aiConfig.preferredProvider || !aiConfig.preferredModel) {
      return { success: false, error: "AI not configured" };
    }

    // Get the API key
    const apiKeyData = await ctx.runQuery(api.apiKeys.getDecryptedApiKey, {
      teamId: args.teamId,
      provider: aiConfig.preferredProvider,
    });

    if (!apiKeyData?.key) {
      return { success: false, error: "API key not found" };
    }

    // First, store the user's message
    await ctx.runMutation(api.ai.addUserMessage, {
      feedbackId: args.feedbackId,
      content: args.userMessage,
    });

    // Schedule the conversation processing action
    await ctx.scheduler.runAfter(0, internal.aiActions.processConversationMessage, {
      feedbackId: args.feedbackId,
      teamId: args.teamId,
      userId: user._id,
      userMessage: args.userMessage,
      provider: aiConfig.preferredProvider,
      model: aiConfig.preferredModel,
      apiKey: apiKeyData.key,
    });

    return { success: true };
  },
});
