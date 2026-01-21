import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";

type StorageProvider = "s3" | "r2" | "gcs";

/**
 * Simple obfuscation for credentials storage
 * Note: In production, use proper encryption with environment-based keys
 */
function obfuscateCredentials(credentials: object): string {
  const json = JSON.stringify(credentials);
  const encoded = btoa(`encrypted:${json}`);
  return encoded;
}

/**
 * Deobfuscate credentials
 */
function deobfuscateCredentials(encrypted: string): object | null {
  try {
    const decoded = atob(encrypted);
    if (decoded.startsWith("encrypted:")) {
      return JSON.parse(decoded.slice("encrypted:".length));
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Get a masked version of the access key for display
 */
function getMaskedAccessKey(accessKey: string): string {
  if (accessKey.length < 8) return "****";
  return accessKey.slice(0, 4) + "..." + accessKey.slice(-4);
}

/**
 * Get storage configuration for a team
 */
export const getStorageConfig = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

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

    const config = await ctx.db
      .query("storageConfig")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .first();

    if (!config) {
      return null;
    }

    // Decrypt credentials to get just the access key hint
    const decrypted = deobfuscateCredentials(config.credentials) as {
      accessKeyId?: string;
      clientEmail?: string;
    } | null;

    let credentialHint = "";
    if (decrypted) {
      if (config.provider === "gcs" && decrypted.clientEmail) {
        // For GCS, show the service account email
        credentialHint = decrypted.clientEmail;
      } else if (decrypted.accessKeyId) {
        // For S3/R2, show masked access key
        credentialHint = getMaskedAccessKey(decrypted.accessKeyId);
      }
    }

    return {
      _id: config._id,
      provider: config.provider,
      bucket: config.bucket,
      region: config.region,
      endpoint: config.endpoint,
      isActive: config.isActive,
      lastTestedAt: config.lastTestedAt,
      credentialHint,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    };
  },
});

/**
 * Save storage configuration for a team
 */
export const saveStorageConfig = mutation({
  args: {
    teamId: v.id("teams"),
    provider: v.union(v.literal("s3"), v.literal("r2"), v.literal("gcs")),
    bucket: v.string(),
    region: v.optional(v.string()),
    endpoint: v.optional(v.string()),
    // S3/R2 credentials
    accessKeyId: v.optional(v.string()),
    secretAccessKey: v.optional(v.string()),
    // GCS credentials
    clientEmail: v.optional(v.string()),
    privateKey: v.optional(v.string()),
    projectId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }

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
      throw new Error("Only admins can manage storage configuration");
    }

    // Validate required credentials based on provider
    let credentials: object;

    if (args.provider === "gcs") {
      if (!args.clientEmail || !args.privateKey || !args.projectId) {
        throw new Error(
          "Google Cloud Storage requires client email, private key, and project ID"
        );
      }
      credentials = {
        clientEmail: args.clientEmail,
        privateKey: args.privateKey,
        projectId: args.projectId,
      };
    } else {
      // S3 or R2
      if (!args.accessKeyId || !args.secretAccessKey) {
        throw new Error(
          `${args.provider === "r2" ? "Cloudflare R2" : "S3"} requires access key ID and secret access key`
        );
      }
      credentials = {
        accessKeyId: args.accessKeyId,
        secretAccessKey: args.secretAccessKey,
      };
    }

    // Validate bucket name
    if (!args.bucket || args.bucket.trim().length === 0) {
      throw new Error("Bucket name is required");
    }

    // Encrypt credentials
    const encryptedCredentials = obfuscateCredentials(credentials);

    const now = Date.now();

    // Check if config exists
    const existingConfig = await ctx.db
      .query("storageConfig")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .first();

    if (existingConfig) {
      // Update existing config
      await ctx.db.patch(existingConfig._id, {
        provider: args.provider,
        credentials: encryptedCredentials,
        bucket: args.bucket.trim(),
        region: args.region,
        endpoint: args.endpoint,
        isActive: false, // Mark as not active until tested
        lastTestedAt: undefined,
        updatedAt: now,
      });
      return { id: existingConfig._id, updated: true };
    } else {
      // Create new config
      const id = await ctx.db.insert("storageConfig", {
        teamId: args.teamId,
        provider: args.provider,
        credentials: encryptedCredentials,
        bucket: args.bucket.trim(),
        region: args.region,
        endpoint: args.endpoint,
        isActive: false,
        createdAt: now,
        updatedAt: now,
      });
      return { id, updated: false };
    }
  },
});

/**
 * Delete storage configuration for a team
 */
export const deleteStorageConfig = mutation({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }

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
      throw new Error("Only admins can delete storage configuration");
    }

    const existingConfig = await ctx.db
      .query("storageConfig")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .first();

    if (existingConfig) {
      await ctx.db.delete(existingConfig._id);
      return { success: true };
    }

    return { success: false, message: "Configuration not found" };
  },
});

/**
 * Mark storage config as tested/active
 */
export const markStorageConfigTested = mutation({
  args: {
    teamId: v.id("teams"),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }

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

    const config = await ctx.db
      .query("storageConfig")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .first();

    if (!config) {
      throw new Error("Storage configuration not found");
    }

    await ctx.db.patch(config._id, {
      isActive: args.isActive,
      lastTestedAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Get decrypted storage credentials for server-side use
 */
export const getDecryptedStorageConfig = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

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

    const config = await ctx.db
      .query("storageConfig")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .first();

    if (!config) {
      return null;
    }

    const credentials = deobfuscateCredentials(config.credentials);

    return {
      provider: config.provider,
      bucket: config.bucket,
      region: config.region,
      endpoint: config.endpoint,
      isActive: config.isActive,
      credentials,
    };
  },
});

/**
 * List available buckets (for bucket selector)
 * This is a placeholder - in a real implementation, this would call the cloud provider's API
 */
export const listBuckets = action({
  args: {
    teamId: v.id("teams"),
  },
  handler: async (ctx, args): Promise<{ buckets: string[]; error?: string }> => {
    // Get the storage config
    const config = await ctx.runQuery(api.storageConfig.getDecryptedStorageConfig, {
      teamId: args.teamId,
    });

    if (!config || !config.credentials) {
      return { buckets: [], error: "No storage configuration found" };
    }

    // In a real implementation, you would call the cloud provider's API here
    // For now, return a placeholder response
    // The test connection feature will be implemented in the API route

    return {
      buckets: [],
      error: "Bucket listing requires the test connection feature"
    };
  },
});
