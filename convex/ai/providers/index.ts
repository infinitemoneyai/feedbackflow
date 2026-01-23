/**
 * Provider factory and exports
 */

import type { AIProvider, AIProviderConfig } from "./base";
import type { AIProvider as AIProviderType } from "../types";
import { OpenAIProvider } from "./openai";
import { AnthropicProvider } from "./anthropic";

export * from "./base";
export { OpenAIProvider } from "./openai";
export { AnthropicProvider } from "./anthropic";

/**
 * Create an AI provider instance based on the provider type
 */
export function createAIProvider(provider: AIProviderType, config: AIProviderConfig): AIProvider {
  switch (provider) {
    case "openai":
      return new OpenAIProvider(config);
    case "anthropic":
      return new AnthropicProvider(config);
    default:
      throw new Error(`Unknown AI provider: ${provider}`);
  }
}
