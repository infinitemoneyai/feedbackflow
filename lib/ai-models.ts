export interface AiModel {
  id: string;
  name: string;
  description: string;
}

export const OPENAI_MODELS: AiModel[] = [
  { id: "gpt-5.2", name: "GPT-5.2", description: "Best for coding and agentic tasks" },
  { id: "gpt-4.1", name: "GPT-4.1", description: "Smartest non-reasoning model" },
  { id: "gpt-4o", name: "GPT-4o", description: "Fast, intelligent, flexible" },
  { id: "gpt-4o-mini", name: "GPT-4o Mini", description: "Fast and cost-effective" },
];

export const ANTHROPIC_MODELS: AiModel[] = [
  { id: "claude-opus-4-7", name: "Claude Opus 4.7", description: "Maximum intelligence for specialized tasks" },
  { id: "claude-sonnet-4-6", name: "Claude Sonnet 4.6", description: "Best for complex agents and coding" },
  { id: "claude-haiku-4-5-20251001", name: "Claude Haiku 4.5", description: "Fastest and most economical" },
  { id: "claude-opus-4-5-20251101", name: "Claude Opus 4.5", description: "Previous-gen Opus" },
  { id: "claude-sonnet-4-5-20250929", name: "Claude Sonnet 4.5", description: "Previous-gen Sonnet" },
];
