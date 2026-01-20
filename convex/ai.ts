import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";

/**
 * Store AI analysis results for a feedback item
 */
export const storeAnalysis = mutation({
  args: {
    feedbackId: v.id("feedback"),
    analysis: v.object({
      suggestedType: v.union(v.literal("bug"), v.literal("feature")),
      typeConfidence: v.number(),
      suggestedPriority: v.union(
        v.literal("low"),
        v.literal("medium"),
        v.literal("high"),
        v.literal("critical")
      ),
      priorityConfidence: v.number(),
      suggestedTags: v.array(v.string()),
      summary: v.optional(v.string()),
      affectedComponent: v.optional(v.string()),
      potentialCauses: v.array(v.string()),
      suggestedSolutions: v.array(v.string()),
    }),
    provider: v.union(v.literal("openai"), v.literal("anthropic")),
    model: v.string(),
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

    // Get the feedback to verify access
    const feedback = await ctx.db.get(args.feedbackId);
    if (!feedback) {
      throw new Error("Feedback not found");
    }

    // Check if user is a member of the team
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("teamId"), feedback.teamId))
      .first();

    if (!membership) {
      throw new Error("Not a member of this team");
    }

    // Check if there's an existing analysis for this feedback
    const existingAnalysis = await ctx.db
      .query("aiAnalysis")
      .withIndex("by_feedback", (q) => q.eq("feedbackId", args.feedbackId))
      .first();

    const now = Date.now();

    if (existingAnalysis) {
      // Update existing analysis
      await ctx.db.patch(existingAnalysis._id, {
        suggestedType: args.analysis.suggestedType,
        typeConfidence: args.analysis.typeConfidence,
        suggestedPriority: args.analysis.suggestedPriority,
        priorityConfidence: args.analysis.priorityConfidence,
        suggestedTags: args.analysis.suggestedTags,
        summary: args.analysis.summary,
        affectedComponent: args.analysis.affectedComponent,
        potentialCauses: args.analysis.potentialCauses,
        suggestedSolutions: args.analysis.suggestedSolutions,
        provider: args.provider,
        model: args.model,
        createdAt: now,
      });
    } else {
      // Create new analysis
      await ctx.db.insert("aiAnalysis", {
        feedbackId: args.feedbackId,
        suggestedType: args.analysis.suggestedType,
        typeConfidence: args.analysis.typeConfidence,
        suggestedPriority: args.analysis.suggestedPriority,
        priorityConfidence: args.analysis.priorityConfidence,
        suggestedTags: args.analysis.suggestedTags,
        summary: args.analysis.summary,
        affectedComponent: args.analysis.affectedComponent,
        potentialCauses: args.analysis.potentialCauses,
        suggestedSolutions: args.analysis.suggestedSolutions,
        provider: args.provider,
        model: args.model,
        createdAt: now,
      });
    }

    // Log the activity
    await ctx.db.insert("activityLog", {
      feedbackId: args.feedbackId,
      userId: user._id,
      action: "ai_analyzed",
      details: {
        extra: `Analyzed using ${args.provider} (${args.model})`,
      },
      createdAt: now,
    });

    // Update usage tracking
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    const usageRecord = await ctx.db
      .query("usageTracking")
      .withIndex("by_team", (q) => q.eq("teamId", feedback.teamId))
      .filter((q) =>
        q.and(q.eq(q.field("year"), year), q.eq(q.field("month"), month))
      )
      .first();

    if (usageRecord) {
      await ctx.db.patch(usageRecord._id, {
        aiCallCount: usageRecord.aiCallCount + 1,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("usageTracking", {
        teamId: feedback.teamId,
        year,
        month,
        feedbackCount: 0,
        aiCallCount: 1,
        storageUsedBytes: 0,
        createdAt: now,
        updatedAt: now,
      });
    }

    return { success: true };
  },
});

/**
 * Internal mutation for storing analysis (used by scheduled jobs)
 */
export const storeAnalysisInternal = internalMutation({
  args: {
    feedbackId: v.id("feedback"),
    analysis: v.object({
      suggestedType: v.union(v.literal("bug"), v.literal("feature")),
      typeConfidence: v.number(),
      suggestedPriority: v.union(
        v.literal("low"),
        v.literal("medium"),
        v.literal("high"),
        v.literal("critical")
      ),
      priorityConfidence: v.number(),
      suggestedTags: v.array(v.string()),
      summary: v.optional(v.string()),
      affectedComponent: v.optional(v.string()),
      potentialCauses: v.array(v.string()),
      suggestedSolutions: v.array(v.string()),
    }),
    provider: v.union(v.literal("openai"), v.literal("anthropic")),
    model: v.string(),
  },
  handler: async (ctx, args) => {
    const feedback = await ctx.db.get(args.feedbackId);
    if (!feedback) {
      throw new Error("Feedback not found");
    }

    const now = Date.now();

    // Check if there's an existing analysis
    const existingAnalysis = await ctx.db
      .query("aiAnalysis")
      .withIndex("by_feedback", (q) => q.eq("feedbackId", args.feedbackId))
      .first();

    if (existingAnalysis) {
      await ctx.db.patch(existingAnalysis._id, {
        suggestedType: args.analysis.suggestedType,
        typeConfidence: args.analysis.typeConfidence,
        suggestedPriority: args.analysis.suggestedPriority,
        priorityConfidence: args.analysis.priorityConfidence,
        suggestedTags: args.analysis.suggestedTags,
        summary: args.analysis.summary,
        affectedComponent: args.analysis.affectedComponent,
        potentialCauses: args.analysis.potentialCauses,
        suggestedSolutions: args.analysis.suggestedSolutions,
        provider: args.provider,
        model: args.model,
        createdAt: now,
      });
    } else {
      await ctx.db.insert("aiAnalysis", {
        feedbackId: args.feedbackId,
        suggestedType: args.analysis.suggestedType,
        typeConfidence: args.analysis.typeConfidence,
        suggestedPriority: args.analysis.suggestedPriority,
        priorityConfidence: args.analysis.priorityConfidence,
        suggestedTags: args.analysis.suggestedTags,
        summary: args.analysis.summary,
        affectedComponent: args.analysis.affectedComponent,
        potentialCauses: args.analysis.potentialCauses,
        suggestedSolutions: args.analysis.suggestedSolutions,
        provider: args.provider,
        model: args.model,
        createdAt: now,
      });
    }

    // Log activity (system action - no user)
    await ctx.db.insert("activityLog", {
      feedbackId: args.feedbackId,
      action: "ai_analyzed",
      details: {
        extra: `Auto-analyzed using ${args.provider} (${args.model})`,
      },
      createdAt: now,
    });

    // Update usage tracking
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    const usageRecord = await ctx.db
      .query("usageTracking")
      .withIndex("by_team", (q) => q.eq("teamId", feedback.teamId))
      .filter((q) =>
        q.and(q.eq(q.field("year"), year), q.eq(q.field("month"), month))
      )
      .first();

    if (usageRecord) {
      await ctx.db.patch(usageRecord._id, {
        aiCallCount: usageRecord.aiCallCount + 1,
        updatedAt: now,
      });
    }

    return { success: true };
  },
});

/**
 * Get AI analysis for a feedback item
 */
export const getAnalysis = query({
  args: {
    feedbackId: v.id("feedback"),
  },
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

    const feedback = await ctx.db.get(args.feedbackId);
    if (!feedback) {
      return null;
    }

    // Check if user is a member of the team
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("teamId"), feedback.teamId))
      .first();

    if (!membership) {
      return null;
    }

    // Get the analysis
    const analysis = await ctx.db
      .query("aiAnalysis")
      .withIndex("by_feedback", (q) => q.eq("feedbackId", args.feedbackId))
      .first();

    return analysis;
  },
});

/**
 * Apply AI suggestions to feedback (accept suggestions)
 */
export const applyAnalysisSuggestions = mutation({
  args: {
    feedbackId: v.id("feedback"),
    applyType: v.optional(v.boolean()),
    applyPriority: v.optional(v.boolean()),
    applyTags: v.optional(v.boolean()),
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

    const feedback = await ctx.db.get(args.feedbackId);
    if (!feedback) {
      throw new Error("Feedback not found");
    }

    // Check if user is a member of the team
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("teamId"), feedback.teamId))
      .first();

    if (!membership) {
      throw new Error("Not a member of this team");
    }

    // Get the AI analysis
    const analysis = await ctx.db
      .query("aiAnalysis")
      .withIndex("by_feedback", (q) => q.eq("feedbackId", args.feedbackId))
      .first();

    if (!analysis) {
      throw new Error("No AI analysis found for this feedback");
    }

    const updates: Record<string, unknown> = {
      updatedAt: Date.now(),
    };
    const activityLogs: Array<{
      action: string;
      details: { from?: string; to?: string; extra?: string };
    }> = [];

    // Apply type if requested and different
    if (args.applyType && analysis.suggestedType && analysis.suggestedType !== feedback.type) {
      updates.type = analysis.suggestedType;
      activityLogs.push({
        action: "status_changed",
        details: {
          from: feedback.type,
          to: analysis.suggestedType,
          extra: "Applied AI suggestion",
        },
      });
    }

    // Apply priority if requested and different
    if (
      args.applyPriority &&
      analysis.suggestedPriority &&
      analysis.suggestedPriority !== feedback.priority
    ) {
      updates.priority = analysis.suggestedPriority;
      activityLogs.push({
        action: "priority_changed",
        details: {
          from: feedback.priority,
          to: analysis.suggestedPriority,
          extra: "Applied AI suggestion",
        },
      });
    }

    // Apply tags if requested
    if (args.applyTags && analysis.suggestedTags && analysis.suggestedTags.length > 0) {
      // Merge with existing tags (remove duplicates)
      const existingTags = new Set(feedback.tags);
      const newTags = analysis.suggestedTags.filter((t: string) => !existingTags.has(t));

      if (newTags.length > 0) {
        updates.tags = [...feedback.tags, ...newTags];
        activityLogs.push({
          action: "tagged",
          details: {
            extra: `Added AI-suggested tags: ${newTags.join(", ")}`,
          },
        });
      }
    }

    // Apply updates if any
    if (Object.keys(updates).length > 1) {
      // More than just updatedAt
      await ctx.db.patch(args.feedbackId, updates);

      // Create activity log entries
      for (const log of activityLogs) {
        await ctx.db.insert("activityLog", {
          feedbackId: args.feedbackId,
          userId: user._id,
          action: log.action as
            | "created"
            | "status_changed"
            | "priority_changed"
            | "assigned"
            | "unassigned"
            | "tagged"
            | "exported"
            | "commented"
            | "ai_analyzed"
            | "ticket_drafted",
          details: log.details,
          createdAt: Date.now(),
        });
      }
    }

    return { success: true };
  },
});

/**
 * Get AI configuration for a team (helper query)
 */
export const getTeamAiConfig = query({
  args: {
    teamId: v.id("teams"),
  },
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
      preferredModel = anthropicKey.model || "claude-3-5-sonnet-20241022";
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

// =============================================================================
// Solution Suggestions
// =============================================================================

/**
 * Store solution suggestions (internal mutation)
 */
export const storeSolutionSuggestions = internalMutation({
  args: {
    feedbackId: v.id("feedback"),
    suggestions: v.array(
      v.object({
        title: v.string(),
        description: v.string(),
        type: v.union(
          v.literal("investigation"),
          v.literal("fix"),
          v.literal("workaround"),
          v.literal("implementation"),
          v.literal("consideration")
        ),
        effort: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
        impact: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
      })
    ),
    summary: v.string(),
    nextSteps: v.array(v.string()),
    provider: v.union(v.literal("openai"), v.literal("anthropic")),
    model: v.string(),
  },
  handler: async (ctx, args) => {
    const feedback = await ctx.db.get(args.feedbackId);
    if (!feedback) {
      throw new Error("Feedback not found");
    }

    const now = Date.now();

    // Check if there's an existing solution for this feedback
    const existingSolution = await ctx.db
      .query("solutionSuggestions")
      .withIndex("by_feedback", (q) => q.eq("feedbackId", args.feedbackId))
      .first();

    if (existingSolution) {
      // Update existing
      await ctx.db.patch(existingSolution._id, {
        suggestions: args.suggestions,
        summary: args.summary,
        nextSteps: args.nextSteps,
        provider: args.provider,
        model: args.model,
        createdAt: now,
      });
    } else {
      // Create new
      await ctx.db.insert("solutionSuggestions", {
        feedbackId: args.feedbackId,
        suggestions: args.suggestions,
        summary: args.summary,
        nextSteps: args.nextSteps,
        provider: args.provider,
        model: args.model,
        createdAt: now,
      });
    }

    // Log activity
    await ctx.db.insert("activityLog", {
      feedbackId: args.feedbackId,
      action: "ai_analyzed",
      details: {
        extra: `Generated solution suggestions using ${args.provider} (${args.model})`,
      },
      createdAt: now,
    });

    // Update usage tracking
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    const usageRecord = await ctx.db
      .query("usageTracking")
      .withIndex("by_team", (q) => q.eq("teamId", feedback.teamId))
      .filter((q) =>
        q.and(q.eq(q.field("year"), year), q.eq(q.field("month"), month))
      )
      .first();

    if (usageRecord) {
      await ctx.db.patch(usageRecord._id, {
        aiCallCount: usageRecord.aiCallCount + 1,
        updatedAt: now,
      });
    }

    return { success: true };
  },
});

/**
 * Get solution suggestions for a feedback item
 */
export const getSolutionSuggestions = query({
  args: {
    feedbackId: v.id("feedback"),
  },
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

    const feedback = await ctx.db.get(args.feedbackId);
    if (!feedback) {
      return null;
    }

    // Check if user is a member of the team
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("teamId"), feedback.teamId))
      .first();

    if (!membership) {
      return null;
    }

    // Get the solution suggestions
    const solutions = await ctx.db
      .query("solutionSuggestions")
      .withIndex("by_feedback", (q) => q.eq("feedbackId", args.feedbackId))
      .first();

    return solutions;
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
      const decoded = Buffer.from(apiKey.encryptedKey, "base64").toString("utf-8");
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

// =============================================================================
// Ticket Drafts
// =============================================================================

/**
 * Store a ticket draft (internal mutation)
 */
export const storeTicketDraft = internalMutation({
  args: {
    feedbackId: v.id("feedback"),
    userId: v.id("users"),
    title: v.string(),
    description: v.string(),
    acceptanceCriteria: v.array(v.string()),
    reproSteps: v.optional(v.array(v.string())),
    expectedBehavior: v.optional(v.string()),
    actualBehavior: v.optional(v.string()),
    provider: v.union(v.literal("openai"), v.literal("anthropic")),
    model: v.string(),
  },
  handler: async (ctx, args) => {
    const feedback = await ctx.db.get(args.feedbackId);
    if (!feedback) {
      throw new Error("Feedback not found");
    }

    const now = Date.now();

    // Check if there's an existing draft for this feedback by this user
    const existingDraft = await ctx.db
      .query("ticketDrafts")
      .withIndex("by_feedback", (q) => q.eq("feedbackId", args.feedbackId))
      .first();

    if (existingDraft) {
      // Update existing draft
      await ctx.db.patch(existingDraft._id, {
        title: args.title,
        description: args.description,
        acceptanceCriteria: args.acceptanceCriteria,
        reproSteps: args.reproSteps,
        expectedBehavior: args.expectedBehavior,
        actualBehavior: args.actualBehavior,
        provider: args.provider,
        model: args.model,
        updatedAt: now,
      });
    } else {
      // Create new draft
      await ctx.db.insert("ticketDrafts", {
        feedbackId: args.feedbackId,
        userId: args.userId,
        title: args.title,
        description: args.description,
        acceptanceCriteria: args.acceptanceCriteria,
        reproSteps: args.reproSteps,
        expectedBehavior: args.expectedBehavior,
        actualBehavior: args.actualBehavior,
        provider: args.provider,
        model: args.model,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Update feedback status to drafted
    await ctx.db.patch(args.feedbackId, {
      status: "drafted",
      updatedAt: now,
    });

    // Log activity
    await ctx.db.insert("activityLog", {
      feedbackId: args.feedbackId,
      userId: args.userId,
      action: "ticket_drafted",
      details: {
        extra: `Drafted using ${args.provider} (${args.model})`,
      },
      createdAt: now,
    });

    // Update usage tracking
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    const usageRecord = await ctx.db
      .query("usageTracking")
      .withIndex("by_team", (q) => q.eq("teamId", feedback.teamId))
      .filter((q) =>
        q.and(q.eq(q.field("year"), year), q.eq(q.field("month"), month))
      )
      .first();

    if (usageRecord) {
      await ctx.db.patch(usageRecord._id, {
        aiCallCount: usageRecord.aiCallCount + 1,
        updatedAt: now,
      });
    }

    return { success: true };
  },
});

/**
 * Get ticket draft for a feedback item
 */
export const getTicketDraft = query({
  args: {
    feedbackId: v.id("feedback"),
  },
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

    const feedback = await ctx.db.get(args.feedbackId);
    if (!feedback) {
      return null;
    }

    // Check if user is a member of the team
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("teamId"), feedback.teamId))
      .first();

    if (!membership) {
      return null;
    }

    // Get the ticket draft
    const draft = await ctx.db
      .query("ticketDrafts")
      .withIndex("by_feedback", (q) => q.eq("feedbackId", args.feedbackId))
      .first();

    return draft;
  },
});

/**
 * Update ticket draft (user edits)
 */
export const updateTicketDraft = mutation({
  args: {
    draftId: v.id("ticketDrafts"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    acceptanceCriteria: v.optional(v.array(v.string())),
    reproSteps: v.optional(v.array(v.string())),
    expectedBehavior: v.optional(v.string()),
    actualBehavior: v.optional(v.string()),
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

    const draft = await ctx.db.get(args.draftId);
    if (!draft) {
      throw new Error("Draft not found");
    }

    const feedback = await ctx.db.get(draft.feedbackId);
    if (!feedback) {
      throw new Error("Feedback not found");
    }

    // Check if user is a member of the team
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("teamId"), feedback.teamId))
      .first();

    if (!membership) {
      throw new Error("Not a member of this team");
    }

    const updates: Record<string, unknown> = {
      updatedAt: Date.now(),
    };

    if (args.title !== undefined) updates.title = args.title;
    if (args.description !== undefined) updates.description = args.description;
    if (args.acceptanceCriteria !== undefined) updates.acceptanceCriteria = args.acceptanceCriteria;
    if (args.reproSteps !== undefined) updates.reproSteps = args.reproSteps;
    if (args.expectedBehavior !== undefined) updates.expectedBehavior = args.expectedBehavior;
    if (args.actualBehavior !== undefined) updates.actualBehavior = args.actualBehavior;

    await ctx.db.patch(args.draftId, updates);

    return { success: true };
  },
});

/**
 * Delete ticket draft
 */
export const deleteTicketDraft = mutation({
  args: {
    draftId: v.id("ticketDrafts"),
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

    const draft = await ctx.db.get(args.draftId);
    if (!draft) {
      throw new Error("Draft not found");
    }

    const feedback = await ctx.db.get(draft.feedbackId);
    if (!feedback) {
      throw new Error("Feedback not found");
    }

    // Check if user is a member of the team
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("teamId"), feedback.teamId))
      .first();

    if (!membership) {
      throw new Error("Not a member of this team");
    }

    await ctx.db.delete(args.draftId);

    // Update feedback status back to triaging
    await ctx.db.patch(draft.feedbackId, {
      status: "triaging",
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});
