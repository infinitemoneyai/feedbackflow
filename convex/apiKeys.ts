import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";

/**
 * Get the last 4 characters of an API key for display
 */
function getKeyHint(key: string): string {
  if (key.length < 4) return "****";
  return key.slice(-4);
}

/**
 * Simple base64 encoding (browser-compatible)
 * Note: In production, use proper encryption with a secret key from environment variables
 * This is a simplified version for demonstration - in a real app, use a Convex action
 * that calls an external service with proper key management
 */
function obfuscateKey(key: string): string {
  // Simple base64 encoding with a marker
  // In production, use proper AES-256 encryption via an action
  const textToEncode = `encrypted:${key}`;
  // Use btoa for base64 encoding (available in Convex runtime)
  const encoded = btoa(textToEncode);
  return encoded;
}

/**
 * Deobfuscate a key
 */
function deobfuscateKey(encrypted: string): string {
  try {
    // Use atob for base64 decoding (available in Convex runtime)
    const decoded = atob(encrypted);
    if (decoded.startsWith("encrypted:")) {
      return decoded.slice("encrypted:".length);
    }
    return encrypted;
  } catch {
    return encrypted;
  }
}

/**
 * Save or update an API key for a team
 */
export const saveApiKey = mutation({
  args: {
    teamId: v.id("teams"),
    provider: v.union(v.literal("openai"), v.literal("anthropic")),
    apiKey: v.string(),
    model: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    // Get the current user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Check if user is a member of the team
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("teamId"), args.teamId))
      .first();

    if (!membership) {
      throw new Error("Not a member of this team");
    }

    // Only admins can manage API keys
    if (membership.role !== "admin") {
      throw new Error("Only admins can manage API keys");
    }

    // Validate API key format
    if (args.provider === "openai" && !args.apiKey.startsWith("sk-")) {
      throw new Error("Invalid OpenAI API key format. Keys should start with 'sk-'");
    }

    if (args.provider === "anthropic" && !args.apiKey.startsWith("sk-ant-")) {
      throw new Error("Invalid Anthropic API key format. Keys should start with 'sk-ant-'");
    }

    // Encrypt the API key
    const encryptedKey = obfuscateKey(args.apiKey);
    const keyHint = getKeyHint(args.apiKey);

    // Check if there's an existing key for this team and provider
    const existingKey = await ctx.db
      .query("apiKeys")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .filter((q) => q.eq(q.field("provider"), args.provider))
      .first();

    const now = Date.now();

    if (existingKey) {
      // Update existing key
      await ctx.db.patch(existingKey._id, {
        encryptedKey,
        keyHint,
        model: args.model,
        isValid: false, // Mark as not validated until tested
        lastValidatedAt: undefined,
        updatedAt: now,
      });
      return { id: existingKey._id, updated: true };
    } else {
      // Create new key
      const id = await ctx.db.insert("apiKeys", {
        userId: user._id,
        teamId: args.teamId,
        provider: args.provider,
        encryptedKey,
        keyHint,
        model: args.model,
        isValid: false,
        createdAt: now,
        updatedAt: now,
      });
      return { id, updated: false };
    }
  },
});

/**
 * Delete an API key
 */
export const deleteApiKey = mutation({
  args: {
    teamId: v.id("teams"),
    provider: v.union(v.literal("openai"), v.literal("anthropic")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    // Get the current user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Check if user is admin of the team
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("teamId"), args.teamId))
      .first();

    if (!membership || membership.role !== "admin") {
      throw new Error("Only admins can delete API keys");
    }

    // Find and delete the key
    const existingKey = await ctx.db
      .query("apiKeys")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .filter((q) => q.eq(q.field("provider"), args.provider))
      .first();

    if (existingKey) {
      await ctx.db.delete(existingKey._id);
      return { success: true };
    }

    return { success: false, message: "Key not found" };
  },
});

/**
 * Get API keys for a team (without the actual key, just metadata)
 */
export const getApiKeys = query({
  args: {
    teamId: v.id("teams"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    // Get the current user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      return [];
    }

    // Check if user is a member of the team
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("teamId"), args.teamId))
      .first();

    if (!membership) {
      return [];
    }

    // Get all API keys for this team
    const keys = await ctx.db
      .query("apiKeys")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();

    // Return without the actual encrypted key
    return keys.map((key) => ({
      _id: key._id,
      provider: key.provider,
      keyHint: key.keyHint,
      model: key.model,
      isValid: key.isValid,
      lastValidatedAt: key.lastValidatedAt,
      createdAt: key.createdAt,
      updatedAt: key.updatedAt,
    }));
  },
});

/**
 * Get the AI configuration for a team (which provider to use)
 */
export const getAiConfig = query({
  args: {
    teamId: v.id("teams"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    // Get the current user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      return null;
    }

    // Check if user is a member of the team
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("teamId"), args.teamId))
      .first();

    if (!membership) {
      return null;
    }

    // Get all API keys for this team
    const keys = await ctx.db
      .query("apiKeys")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();

    // Find valid keys
    const openaiKey = keys.find((k) => k.provider === "openai");
    const anthropicKey = keys.find((k) => k.provider === "anthropic");

    return {
      hasOpenAI: !!openaiKey,
      openAIValid: openaiKey?.isValid ?? false,
      openAIModel: openaiKey?.model,
      hasAnthropic: !!anthropicKey,
      anthropicValid: anthropicKey?.isValid ?? false,
      anthropicModel: anthropicKey?.model,
    };
  },
});

/**
 * Internal mutation to mark a key as validated
 */
export const markKeyValidated = internalMutation({
  args: {
    keyId: v.id("apiKeys"),
    isValid: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.keyId, {
      isValid: args.isValid,
      lastValidatedAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

/**
 * Update the preferred model for an API key
 */
export const updateApiKeyModel = mutation({
  args: {
    teamId: v.id("teams"),
    provider: v.union(v.literal("openai"), v.literal("anthropic")),
    model: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    // Get the current user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Check if user is admin of the team
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("teamId"), args.teamId))
      .first();

    if (!membership || membership.role !== "admin") {
      throw new Error("Only admins can update API key settings");
    }

    // Find the key
    const existingKey = await ctx.db
      .query("apiKeys")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .filter((q) => q.eq(q.field("provider"), args.provider))
      .first();

    if (!existingKey) {
      throw new Error("API key not found");
    }

    await ctx.db.patch(existingKey._id, {
      model: args.model,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Get a decrypted API key for server-side use
 * This should only be called from actions/internal functions
 */
export const getDecryptedApiKey = query({
  args: {
    teamId: v.id("teams"),
    provider: v.union(v.literal("openai"), v.literal("anthropic")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    // Get the current user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      return null;
    }

    // Check if user is a member of the team
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("teamId"), args.teamId))
      .first();

    if (!membership) {
      return null;
    }

    // Get the API key
    const apiKey = await ctx.db
      .query("apiKeys")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .filter((q) => q.eq(q.field("provider"), args.provider))
      .first();

    if (!apiKey) {
      return null;
    }

    // Decrypt and return
    return {
      key: deobfuscateKey(apiKey.encryptedKey),
      model: apiKey.model,
      isValid: apiKey.isValid,
    };
  },
});
