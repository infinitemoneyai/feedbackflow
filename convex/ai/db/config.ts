/**
 * Database operations for AI configuration
 */

import { v } from "convex/values";
import { query } from "../../_generated/server";
import { verifyTeamAccess } from "./helpers";

/**
 * Get AI configuration for a team
 */
export const getTeamAiConfig = query({
  args: {
    teamId: v.id("teams"),
  },
  handler: async (ctx, args) => {
    try {
      await verifyTeamAccess(ctx, args.teamId);
    } catch {
      return null;
    }

    // Get API keys for this team
    const apiKeys = await ctx.db
      .query("apiKeys")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();

    const openaiKey = apiKeys.find((k) => k.provider === "openai" && k.isValid);
    const anthropicKey = apiKeys.find((k) => k.provider === "anthropic" && k.isValid);

    // Determine preferred provider
    let preferredProvider: "openai" | "anthropic" | null = null;
    let preferredModel: string | null = null;

    if (openaiKey) {
      preferredProvider = "openai";
      preferredModel = openaiKey.model || "gpt-4o";
    } else if (anthropicKey) {
      preferredProvider = "anthropic";
      preferredModel = anthropicKey.model || "claude-sonnet-4-5-20250514";
    }

    return {
      hasOpenAI: !!openaiKey,
      hasAnthropic: !!anthropicKey,
      preferredProvider,
      preferredModel,
      isConfigured: preferredProvider !== null,
    };
  },
});

/**
 * Internal query to get decrypted API key for server-side use
 */
export const getDecryptedApiKeyInternal = query({
  args: {
    teamId: v.id("teams"),
    provider: v.union(v.literal("openai"), v.literal("anthropic")),
  },
  handler: async (ctx, args) => {
    // This query is meant to be called from API routes that have already
    // verified authentication. Return the key data.
    const apiKey = await ctx.db
      .query("apiKeys")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .filter((q) => q.eq(q.field("provider"), args.provider))
      .first();

    if (!apiKey) {
      return null;
    }

    // Deobfuscate the key (same logic as in apiKeys.ts)
    let decryptedKey: string;
    try {
      const decoded = atob(apiKey.encryptedKey);
      if (decoded.startsWith("encrypted:")) {
        decryptedKey = decoded.slice("encrypted:".length);
      } else {
        decryptedKey = apiKey.encryptedKey;
      }
    } catch {
      decryptedKey = apiKey.encryptedKey;
    }

    return {
      key: decryptedKey,
      model: apiKey.model,
      isValid: apiKey.isValid,
    };
  },
});
