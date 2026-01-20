import { v } from "convex/values";
import { mutation, query, internalMutation, internalQuery } from "./_generated/server";
// Id type is used via v.id() validators

/**
 * Automation rule types
 */
const triggerValidator = v.union(
  v.literal("new_feedback"),
  v.literal("status_changed"),
  v.literal("priority_changed")
);

const conditionFieldValidator = v.union(
  v.literal("type"),
  v.literal("priority"),
  v.literal("status"),
  v.literal("tags")
);

const conditionOperatorValidator = v.union(
  v.literal("equals"),
  v.literal("not_equals"),
  v.literal("contains")
);

const conditionValidator = v.object({
  field: conditionFieldValidator,
  operator: conditionOperatorValidator,
  value: v.string(),
});

const actionValidator = v.union(
  v.literal("export_linear"),
  v.literal("export_notion"),
  v.literal("send_webhook"),
  v.literal("assign_user"),
  v.literal("set_priority"),
  v.literal("add_tag")
);

const actionConfigValidator = v.optional(
  v.object({
    targetUserId: v.optional(v.id("users")),
    priority: v.optional(v.string()),
    tag: v.optional(v.string()),
    webhookId: v.optional(v.id("webhooks")),
  })
);

/**
 * Create a new automation rule
 */
export const createRule = mutation({
  args: {
    projectId: v.id("projects"),
    name: v.string(),
    trigger: triggerValidator,
    conditions: v.array(conditionValidator),
    action: actionValidator,
    actionConfig: actionConfigValidator,
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

    // Get project to find team
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Check if user is an admin of the team
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("teamId"), project.teamId))
      .first();

    if (!membership || membership.role !== "admin") {
      throw new Error("Only admins can create automation rules");
    }

    const now = Date.now();

    const ruleId = await ctx.db.insert("automationRules", {
      projectId: args.projectId,
      name: args.name,
      isEnabled: true,
      trigger: args.trigger,
      conditions: args.conditions,
      action: args.action,
      actionConfig: args.actionConfig,
      createdAt: now,
      updatedAt: now,
    });

    return { ruleId };
  },
});

/**
 * Update an existing automation rule
 */
export const updateRule = mutation({
  args: {
    ruleId: v.id("automationRules"),
    name: v.optional(v.string()),
    isEnabled: v.optional(v.boolean()),
    trigger: v.optional(triggerValidator),
    conditions: v.optional(v.array(conditionValidator)),
    action: v.optional(actionValidator),
    actionConfig: v.optional(actionConfigValidator),
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

    // Get rule
    const rule = await ctx.db.get(args.ruleId);
    if (!rule) {
      throw new Error("Rule not found");
    }

    // Get project to find team
    const project = await ctx.db.get(rule.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Check if user is an admin of the team
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("teamId"), project.teamId))
      .first();

    if (!membership || membership.role !== "admin") {
      throw new Error("Only admins can update automation rules");
    }

    const updates: Record<string, unknown> = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) updates.name = args.name;
    if (args.isEnabled !== undefined) updates.isEnabled = args.isEnabled;
    if (args.trigger !== undefined) updates.trigger = args.trigger;
    if (args.conditions !== undefined) updates.conditions = args.conditions;
    if (args.action !== undefined) updates.action = args.action;
    if (args.actionConfig !== undefined) updates.actionConfig = args.actionConfig;

    await ctx.db.patch(args.ruleId, updates);

    return { success: true };
  },
});

/**
 * Delete an automation rule
 */
export const deleteRule = mutation({
  args: {
    ruleId: v.id("automationRules"),
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

    // Get rule
    const rule = await ctx.db.get(args.ruleId);
    if (!rule) {
      throw new Error("Rule not found");
    }

    // Get project to find team
    const project = await ctx.db.get(rule.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Check if user is an admin of the team
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("teamId"), project.teamId))
      .first();

    if (!membership || membership.role !== "admin") {
      throw new Error("Only admins can delete automation rules");
    }

    await ctx.db.delete(args.ruleId);

    return { success: true };
  },
});

/**
 * Get automation rules for a project
 */
export const getRulesForProject = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      return [];
    }

    // Get project to find team
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      return [];
    }

    // Check if user is a member of the team
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("teamId"), project.teamId))
      .first();

    if (!membership) {
      return [];
    }

    const rules = await ctx.db
      .query("automationRules")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    // Get additional data for actions
    const rulesWithDetails = await Promise.all(
      rules.map(async (rule) => {
        let targetUser = null;
        let webhook = null;

        if (rule.actionConfig?.targetUserId) {
          targetUser = await ctx.db.get(rule.actionConfig.targetUserId);
        }

        if (rule.actionConfig?.webhookId) {
          webhook = await ctx.db.get(rule.actionConfig.webhookId);
        }

        return {
          ...rule,
          targetUser: targetUser
            ? {
                _id: targetUser._id,
                name: targetUser.name,
                email: targetUser.email,
              }
            : null,
          webhook: webhook
            ? {
                _id: webhook._id,
                url: webhook.url,
              }
            : null,
        };
      })
    );

    return rulesWithDetails;
  },
});

/**
 * Get enabled rules for a project (internal, for rule execution)
 */
export const getEnabledRulesForProject = internalQuery({
  args: {
    projectId: v.id("projects"),
    trigger: triggerValidator,
  },
  handler: async (ctx, args) => {
    const rules = await ctx.db
      .query("automationRules")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .filter((q) =>
        q.and(
          q.eq(q.field("isEnabled"), true),
          q.eq(q.field("trigger"), args.trigger)
        )
      )
      .collect();

    return rules;
  },
});

/**
 * Log automation rule execution
 */
export const logRuleExecution = internalMutation({
  args: {
    feedbackId: v.id("feedback"),
    ruleId: v.id("automationRules"),
    ruleName: v.string(),
    action: v.string(),
    status: v.union(v.literal("success"), v.literal("failed")),
    error: v.optional(v.string()),
    details: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Log to activity log
    await ctx.db.insert("activityLog", {
      feedbackId: args.feedbackId,
      action: "automation_executed",
      details: {
        extra: `Rule "${args.ruleName}": ${args.action} - ${args.status}${args.error ? ` (${args.error})` : ""}${args.details ? ` - ${args.details}` : ""}`,
      },
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Get webhooks for a team (for action config dropdowns)
 */
export const getWebhooksForProject = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      return [];
    }

    // Get project to find team
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      return [];
    }

    // Check if user is a member of the team
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("teamId"), project.teamId))
      .first();

    if (!membership) {
      return [];
    }

    const webhooks = await ctx.db
      .query("webhooks")
      .withIndex("by_team", (q) => q.eq("teamId", project.teamId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    return webhooks.map((w) => ({
      _id: w._id,
      url: w.url,
    }));
  },
});

/**
 * Get team members for a project (for assign_user action)
 */
export const getTeamMembersForProject = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      return [];
    }

    // Get project to find team
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      return [];
    }

    // Check if user is a member of the team
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("teamId"), project.teamId))
      .first();

    if (!membership) {
      return [];
    }

    // Get all team members
    const teamMembers = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", project.teamId))
      .collect();

    // Get user details for each member
    const membersWithDetails = await Promise.all(
      teamMembers.map(async (member) => {
        const memberUser = await ctx.db.get(member.userId);
        return memberUser
          ? {
              _id: memberUser._id,
              name: memberUser.name,
              email: memberUser.email,
              avatar: memberUser.avatar,
            }
          : null;
      })
    );

    return membersWithDetails.filter(Boolean);
  },
});

/**
 * Check if Linear integration is configured for a team
 */
export const hasLinearIntegration = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      return false;
    }

    const integration = await ctx.db
      .query("integrations")
      .withIndex("by_team", (q) => q.eq("teamId", project.teamId))
      .filter((q) =>
        q.and(
          q.eq(q.field("provider"), "linear"),
          q.eq(q.field("isActive"), true)
        )
      )
      .first();

    return !!integration;
  },
});

/**
 * Check if Notion integration is configured for a team
 */
export const hasNotionIntegration = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      return false;
    }

    const integration = await ctx.db
      .query("integrations")
      .withIndex("by_team", (q) => q.eq("teamId", project.teamId))
      .filter((q) =>
        q.and(
          q.eq(q.field("provider"), "notion"),
          q.eq(q.field("isActive"), true)
        )
      )
      .first();

    return !!integration;
  },
});

// =============================================================================
// Public mutations for API access (called by automation trigger API)
// =============================================================================

/**
 * Get enabled rules for a project (public query for API)
 */
export const getEnabledRulesForProjectPublic = query({
  args: {
    projectId: v.id("projects"),
    trigger: triggerValidator,
  },
  handler: async (ctx, args) => {
    // No auth check - this is called from internal API
    const rules = await ctx.db
      .query("automationRules")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .filter((q) =>
        q.and(
          q.eq(q.field("isEnabled"), true),
          q.eq(q.field("trigger"), args.trigger)
        )
      )
      .collect();

    return rules;
  },
});

/**
 * Log rule execution (public mutation for API)
 */
export const logRuleExecutionPublic = mutation({
  args: {
    feedbackId: v.id("feedback"),
    ruleName: v.string(),
    action: v.string(),
    status: v.union(v.literal("success"), v.literal("failed")),
    error: v.optional(v.string()),
    details: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // No auth check - this is called from internal API
    await ctx.db.insert("activityLog", {
      feedbackId: args.feedbackId,
      action: "automation_executed",
      details: {
        extra: `Rule "${args.ruleName}": ${args.action} - ${args.status}${args.error ? ` (${args.error})` : ""}${args.details ? ` - ${args.details}` : ""}`,
      },
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Assign feedback from automation (public mutation for API)
 */
export const assignFeedbackFromAutomation = mutation({
  args: {
    feedbackId: v.id("feedback"),
    assigneeId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const feedback = await ctx.db.get(args.feedbackId);
    if (!feedback) {
      throw new Error("Feedback not found");
    }

    await ctx.db.patch(args.feedbackId, {
      assigneeId: args.assigneeId,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Set priority from automation (public mutation for API)
 */
export const setPriorityFromAutomation = mutation({
  args: {
    feedbackId: v.id("feedback"),
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("critical")
    ),
  },
  handler: async (ctx, args) => {
    const feedback = await ctx.db.get(args.feedbackId);
    if (!feedback) {
      throw new Error("Feedback not found");
    }

    await ctx.db.patch(args.feedbackId, {
      priority: args.priority,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Add tag from automation (public mutation for API)
 */
export const addTagFromAutomation = mutation({
  args: {
    feedbackId: v.id("feedback"),
    tag: v.string(),
  },
  handler: async (ctx, args) => {
    const feedback = await ctx.db.get(args.feedbackId);
    if (!feedback) {
      throw new Error("Feedback not found");
    }

    const currentTags = feedback.tags || [];
    if (!currentTags.includes(args.tag)) {
      await ctx.db.patch(args.feedbackId, {
        tags: [...currentTags, args.tag],
        updatedAt: Date.now(),
      });
    }

    return { success: true };
  },
});
