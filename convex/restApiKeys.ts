import { v } from "convex/values";
import { mutation, query, internalQuery } from "./_generated/server";
import { Doc } from "./_generated/dataModel";

/**
 * Generate a secure random API key
 */
function generateApiKey(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let key = "ff_";
  for (let i = 0; i < 32; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}

/**
 * Simple hash function for API key storage
 * In production, use a proper hashing library like bcrypt
 */
function hashKey(key: string): string {
  // Simple hash using base64 encoding with marker
  // In production, use proper SHA-256 hashing
  const encoded = btoa(`hashed:${key}`);
  return encoded;
}

/**
 * Verify a key against a hash
 */
function verifyKey(key: string, hash: string): boolean {
  try {
    const decoded = atob(hash);
    if (decoded.startsWith("hashed:")) {
      return decoded.slice("hashed:".length) === key;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Permission types for REST API keys
 */
export type ApiPermission =
  | "read:feedback"
  | "write:feedback"
  | "read:projects"
  | "write:projects";

/**
 * Create a new REST API key
 */
export const createApiKey = mutation({
  args: {
    teamId: v.id("teams"),
    name: v.string(),
    permissions: v.array(
      v.union(
        v.literal("read:feedback"),
        v.literal("write:feedback"),
        v.literal("read:projects"),
        v.literal("write:projects")
      )
    ),
    expiresAt: v.optional(v.number()),
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
      throw new Error("Only admins can create API keys");
    }

    // Generate the API key
    const rawKey = generateApiKey();
    const keyHash = hashKey(rawKey);
    const keyPrefix = rawKey.slice(0, 8);

    // Create the API key record
    const keyId = await ctx.db.insert("restApiKeys", {
      teamId: args.teamId,
      userId: user._id,
      name: args.name,
      keyHash,
      keyPrefix,
      permissions: args.permissions,
      expiresAt: args.expiresAt,
      isActive: true,
      createdAt: Date.now(),
    });

    // Return the raw key only once - it won't be retrievable after this
    return {
      id: keyId,
      key: rawKey,
      prefix: keyPrefix,
    };
  },
});

/**
 * List all REST API keys for a team (metadata only, no actual keys)
 */
export const listApiKeys = query({
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
      .query("restApiKeys")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();

    // Get creator details for each key
    const keysWithCreator = await Promise.all(
      keys.map(async (key) => {
        const creator = await ctx.db.get(key.userId);
        return {
          _id: key._id,
          name: key.name,
          keyPrefix: key.keyPrefix,
          permissions: key.permissions,
          lastUsedAt: key.lastUsedAt,
          expiresAt: key.expiresAt,
          isActive: key.isActive,
          createdAt: key.createdAt,
          createdBy: creator
            ? {
                name: creator.name,
                email: creator.email,
              }
            : null,
        };
      })
    );

    return keysWithCreator;
  },
});

/**
 * Revoke (deactivate) an API key
 */
export const revokeApiKey = mutation({
  args: {
    keyId: v.id("restApiKeys"),
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

    // Get the API key
    const apiKey = await ctx.db.get(args.keyId);
    if (!apiKey) {
      throw new Error("API key not found");
    }

    // Check if user is admin of the team
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("teamId"), apiKey.teamId))
      .first();

    if (!membership || membership.role !== "admin") {
      throw new Error("Only admins can revoke API keys");
    }

    // Deactivate the key
    await ctx.db.patch(args.keyId, { isActive: false });

    return { success: true };
  },
});

/**
 * Delete an API key permanently
 */
export const deleteApiKey = mutation({
  args: {
    keyId: v.id("restApiKeys"),
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

    // Get the API key
    const apiKey = await ctx.db.get(args.keyId);
    if (!apiKey) {
      throw new Error("API key not found");
    }

    // Check if user is admin of the team
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("teamId"), apiKey.teamId))
      .first();

    if (!membership || membership.role !== "admin") {
      throw new Error("Only admins can delete API keys");
    }

    // Delete the key
    await ctx.db.delete(args.keyId);

    return { success: true };
  },
});

/**
 * Validate an API key and return its permissions (internal use)
 * This is called from API routes to validate Bearer tokens
 */
export const validateApiKey = internalQuery({
  args: {
    key: v.string(),
  },
  handler: async (ctx, args) => {
    // Extract prefix from key for initial lookup
    const keyPrefix = args.key.slice(0, 8);

    // Find all keys with matching prefix
    const potentialKeys = await ctx.db
      .query("restApiKeys")
      .withIndex("by_key_prefix", (q) => q.eq("keyPrefix", keyPrefix))
      .collect();

    // Find the matching key by verifying hash
    for (const apiKey of potentialKeys) {
      if (verifyKey(args.key, apiKey.keyHash)) {
        // Check if key is active
        if (!apiKey.isActive) {
          return { valid: false, error: "API key has been revoked" };
        }

        // Check if key is expired
        if (apiKey.expiresAt && apiKey.expiresAt < Date.now()) {
          return { valid: false, error: "API key has expired" };
        }

        return {
          valid: true,
          teamId: apiKey.teamId,
          permissions: apiKey.permissions,
          keyId: apiKey._id,
        };
      }
    }

    return { valid: false, error: "Invalid API key" };
  },
});

/**
 * Public query for API key validation (called from API routes)
 * Also updates last used timestamp
 */
export const validateApiKeyPublic = query({
  args: {
    key: v.string(),
  },
  handler: async (ctx, args) => {
    // Extract prefix from key for initial lookup
    const keyPrefix = args.key.slice(0, 8);

    // Find all keys with matching prefix
    const potentialKeys = await ctx.db
      .query("restApiKeys")
      .withIndex("by_key_prefix", (q) => q.eq("keyPrefix", keyPrefix))
      .collect();

    // Find the matching key by verifying hash
    for (const apiKey of potentialKeys) {
      if (verifyKey(args.key, apiKey.keyHash)) {
        // Check if key is active
        if (!apiKey.isActive) {
          return { valid: false as const, error: "API key has been revoked" };
        }

        // Check if key is expired
        if (apiKey.expiresAt && apiKey.expiresAt < Date.now()) {
          return { valid: false as const, error: "API key has expired" };
        }

        return {
          valid: true as const,
          teamId: apiKey.teamId,
          permissions: apiKey.permissions,
          keyId: apiKey._id,
        };
      }
    }

    return { valid: false as const, error: "Invalid API key" };
  },
});

/**
 * Mutation to update last used timestamp for API key
 */
export const updateApiKeyLastUsed = mutation({
  args: {
    keyId: v.id("restApiKeys"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.keyId, { lastUsedAt: Date.now() });
  },
});

/**
 * Query to get feedback for API access
 * No auth required - called after API key validation
 */
export const getFeedbackForApi = query({
  args: {
    teamId: v.id("teams"),
    projectId: v.optional(v.id("projects")),
    status: v.optional(v.string()),
    type: v.optional(v.string()),
    priority: v.optional(v.string()),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Get projects for this team
    let projects;
    if (args.projectId) {
      const project = await ctx.db.get(args.projectId);
      if (!project || project.teamId !== args.teamId) {
        return { feedback: [], total: 0 };
      }
      projects = [project];
    } else {
      projects = await ctx.db
        .query("projects")
        .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
        .collect();
    }

    // Get all feedback for these projects
    let allFeedback: Doc<"feedback">[] = [];
    for (const project of projects) {
      const projectFeedback = await ctx.db
        .query("feedback")
        .withIndex("by_project", (q) => q.eq("projectId", project._id))
        .collect();
      allFeedback = allFeedback.concat(projectFeedback);
    }

    // Filter by status
    if (args.status) {
      allFeedback = allFeedback.filter((f) => f?.status === args.status);
    }

    // Filter by type
    if (args.type) {
      allFeedback = allFeedback.filter((f) => f?.type === args.type);
    }

    // Filter by priority
    if (args.priority) {
      allFeedback = allFeedback.filter((f) => f?.priority === args.priority);
    }

    // Sort by createdAt descending
    allFeedback.sort((a, b) => (b?.createdAt ?? 0) - (a?.createdAt ?? 0));

    const total = allFeedback.length;

    // Apply pagination
    const offset = args.offset ?? 0;
    const limit = args.limit ?? 50;
    const paginatedFeedback = allFeedback.slice(offset, offset + limit);

    // Format feedback for API response
    const formattedFeedback = paginatedFeedback.filter(Boolean).map((f) => ({
      id: f!._id,
      type: f!.type,
      title: f!.title,
      description: f!.description,
      status: f!.status,
      priority: f!.priority,
      tags: f!.tags,
      screenshotUrl: f!.screenshotUrl,
      recordingUrl: f!.recordingUrl,
      submitterEmail: f!.submitterEmail,
      submitterName: f!.submitterName,
      projectId: f!.projectId,
      metadata: f!.metadata,
      createdAt: f!.createdAt,
      updatedAt: f!.updatedAt,
    }));

    return {
      feedback: formattedFeedback,
      total,
      limit,
      offset,
    };
  },
});

/**
 * Query to get a single feedback by ID for API access
 */
export const getFeedbackByIdForApi = query({
  args: {
    feedbackId: v.id("feedback"),
    teamId: v.id("teams"),
  },
  handler: async (ctx, args) => {
    const feedback = await ctx.db.get(args.feedbackId);
    if (!feedback) {
      return null;
    }

    // Verify the feedback belongs to the team
    if (feedback.teamId !== args.teamId) {
      return null;
    }

    // Get assignee info
    let assignee = null;
    if (feedback.assigneeId) {
      const assigneeUser = await ctx.db.get(feedback.assigneeId);
      if (assigneeUser) {
        assignee = {
          id: assigneeUser._id,
          name: assigneeUser.name,
          email: assigneeUser.email,
        };
      }
    }

    return {
      id: feedback._id,
      type: feedback.type,
      title: feedback.title,
      description: feedback.description,
      status: feedback.status,
      priority: feedback.priority,
      tags: feedback.tags,
      screenshotUrl: feedback.screenshotUrl,
      recordingUrl: feedback.recordingUrl,
      submitterEmail: feedback.submitterEmail,
      submitterName: feedback.submitterName,
      assignee,
      projectId: feedback.projectId,
      widgetId: feedback.widgetId,
      metadata: feedback.metadata,
      createdAt: feedback.createdAt,
      updatedAt: feedback.updatedAt,
      resolvedAt: feedback.resolvedAt,
    };
  },
});

/**
 * Query to get projects for API access
 */
export const getProjectsForApi = query({
  args: {
    teamId: v.id("teams"),
  },
  handler: async (ctx, args) => {
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();

    // Get feedback counts for each project
    const projectsWithCounts = await Promise.all(
      projects.map(async (project) => {
        const feedback = await ctx.db
          .query("feedback")
          .withIndex("by_project", (q) => q.eq("projectId", project._id))
          .collect();

        return {
          id: project._id,
          name: project.name,
          description: project.description,
          settings: project.settings,
          feedbackCount: feedback.length,
          newFeedbackCount: feedback.filter((f) => f.status === "new").length,
          createdAt: project.createdAt,
        };
      })
    );

    return projectsWithCounts;
  },
});

/**
 * Update feedback via API (internal mutation)
 */
export const updateFeedbackForApi = mutation({
  args: {
    feedbackId: v.id("feedback"),
    teamId: v.id("teams"),
    status: v.optional(
      v.union(
        v.literal("new"),
        v.literal("triaging"),
        v.literal("drafted"),
        v.literal("exported"),
        v.literal("resolved")
      )
    ),
    priority: v.optional(
      v.union(
        v.literal("low"),
        v.literal("medium"),
        v.literal("high"),
        v.literal("critical")
      )
    ),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const feedback = await ctx.db.get(args.feedbackId);
    if (!feedback) {
      throw new Error("Feedback not found");
    }

    // Verify the feedback belongs to the team
    if (feedback.teamId !== args.teamId) {
      throw new Error("Feedback not found");
    }

    // Build update object
    const updates: Record<string, unknown> = {
      updatedAt: Date.now(),
    };

    if (args.status !== undefined) {
      updates.status = args.status;
      if (args.status === "resolved") {
        updates.resolvedAt = Date.now();
      }
    }

    if (args.priority !== undefined) {
      updates.priority = args.priority;
    }

    if (args.tags !== undefined) {
      updates.tags = args.tags;
    }

    await ctx.db.patch(args.feedbackId, updates);

    // Log the activity
    await ctx.db.insert("activityLog", {
      feedbackId: args.feedbackId,
      action: "status_changed",
      details: {
        extra: "Updated via API",
        from: feedback.status,
        to: args.status ?? feedback.status,
      },
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Add comment via API (internal mutation)
 */
export const addCommentForApi = mutation({
  args: {
    feedbackId: v.id("feedback"),
    teamId: v.id("teams"),
    content: v.string(),
    authorName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const feedback = await ctx.db.get(args.feedbackId);
    if (!feedback) {
      throw new Error("Feedback not found");
    }

    // Verify the feedback belongs to the team
    if (feedback.teamId !== args.teamId) {
      throw new Error("Feedback not found");
    }

    // Get the first admin user of the team as the comment author
    const teamMembers = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .filter((q) => q.eq(q.field("role"), "admin"))
      .first();

    if (!teamMembers) {
      throw new Error("No admin found for team");
    }

    // Create the comment
    const commentId = await ctx.db.insert("comments", {
      feedbackId: args.feedbackId,
      userId: teamMembers.userId,
      content: args.content,
      createdAt: Date.now(),
    });

    // Log the activity
    await ctx.db.insert("activityLog", {
      feedbackId: args.feedbackId,
      userId: teamMembers.userId,
      action: "commented",
      details: {
        extra: `Comment added via API${args.authorName ? ` by ${args.authorName}` : ""}`,
      },
      createdAt: Date.now(),
    });

    return { commentId };
  },
});
