/**
 * Post-submission side effects — AI auto-analysis, automation rules, and
 * new-feedback notifications — dispatched from feedback.submitFromWidget /
 * submitFromReview via ctx.scheduler (see ADR-0002: side effects go through
 * the scheduler, not self-HTTP). These internal actions replace the
 * internal-key API routes that previously received self-HTTP calls.
 */

import { v } from "convex/values";
import { internalAction, type ActionCtx } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { Id, Doc } from "./_generated/dataModel";
import { sendNotificationEmail } from "../lib/email";
import {
  createLinearIssue,
  formatFeedbackForLinear,
  mapPriorityToLinear,
} from "../lib/integrations/linear";
import { createNotionPage } from "../lib/integrations/notion";

// =============================================================================
// AI auto-analysis
// =============================================================================

/**
 * Gate + dispatch for automatic analysis of a new submission: skips when the
 * project has auto-triage off, the team has no AI configured, or no valid
 * key exists; otherwise schedules the existing analysis action.
 */
export const autoAnalyze = internalAction({
  args: {
    feedbackId: v.id("feedback"),
    teamId: v.id("teams"),
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const project = await ctx.runQuery(api.projects.getProjectInternal, {
      projectId: args.projectId,
    });
    if (project && !project.settings?.autoTriage) {
      return { skipped: true, reason: "Auto-triage is not enabled" };
    }

    const aiConfig = await ctx.runQuery(api.ai.getTeamAiConfig, {
      teamId: args.teamId,
    });
    if (
      !aiConfig?.isConfigured ||
      !aiConfig.preferredProvider ||
      !aiConfig.preferredModel
    ) {
      return { skipped: true, reason: "AI is not configured for this team" };
    }

    const apiKeyData = await ctx.runQuery(
      internal.ai.getDecryptedApiKeyInternal,
      {
        teamId: args.teamId,
        provider: aiConfig.preferredProvider,
      }
    );
    if (!apiKeyData?.key) {
      return { skipped: true, reason: "No valid API key found" };
    }

    await ctx.scheduler.runAfter(0, internal.aiActions.analyzeFeedbackAction, {
      feedbackId: args.feedbackId,
      teamId: args.teamId,
      provider: aiConfig.preferredProvider,
      model: aiConfig.preferredModel,
      apiKey: apiKeyData.key,
    });

    return { skipped: false };
  },
});

// =============================================================================
// Automation rules
// =============================================================================

interface RuleCondition {
  field: "type" | "priority" | "status" | "tags";
  operator: "equals" | "not_equals" | "contains";
  value: string;
}

/** All conditions must be met (AND logic). */
function evaluateConditions(
  feedback: Doc<"feedback">,
  conditions: RuleCondition[]
): boolean {
  for (const condition of conditions) {
    const fieldValue: string | string[] =
      condition.field === "tags"
        ? feedback.tags || []
        : feedback[condition.field];

    let conditionMet = false;
    switch (condition.operator) {
      case "equals":
        conditionMet = Array.isArray(fieldValue)
          ? fieldValue.includes(condition.value)
          : fieldValue === condition.value;
        break;
      case "not_equals":
        conditionMet = Array.isArray(fieldValue)
          ? !fieldValue.includes(condition.value)
          : fieldValue !== condition.value;
        break;
      case "contains":
        conditionMet = Array.isArray(fieldValue)
          ? fieldValue.some((valueItem) =>
              valueItem.toLowerCase().includes(condition.value.toLowerCase())
            )
          : fieldValue.toLowerCase().includes(condition.value.toLowerCase());
        break;
    }
    if (!conditionMet) {
      return false;
    }
  }
  return true;
}

async function executeRuleAction(
  ctx: ActionCtx,
  feedback: Doc<"feedback">,
  rule: Doc<"automationRules">
): Promise<{ details?: string }> {
  switch (rule.action) {
    case "export_linear": {
      // Direct adapter call (ADR-0002 follow-through): scheduled actions
      // have no Clerk session, so the user-facing integration routes are
      // not reachable from here — and no self-HTTP means no shared secret.
      const integration = await ctx.runQuery(
        internal.integrations.getIntegrationForAutomation,
        { teamId: feedback.teamId, provider: "linear" }
      );
      if (!integration?.decryptedKey) {
        throw new Error("Linear integration is not configured");
      }
      const linearTeamId = integration.settings?.linearTeamId;
      if (!linearTeamId) {
        throw new Error("No Linear team configured for this integration");
      }
      const issue = await createLinearIssue(integration.decryptedKey, {
        teamId: linearTeamId,
        title: feedback.title,
        description: formatFeedbackForLinear(feedback),
        priority: mapPriorityToLinear(feedback.priority),
        projectId: integration.settings?.linearProjectId || undefined,
        labelIds: integration.settings?.linearLabelIds || undefined,
      });
      return {
        details: `Exported to Linear: ${issue.identifier || issue.url}`,
      };
    }

    case "export_notion": {
      const integration = await ctx.runQuery(
        internal.integrations.getIntegrationForAutomation,
        { teamId: feedback.teamId, provider: "notion" }
      );
      if (!integration?.decryptedKey) {
        throw new Error("Notion integration is not configured");
      }
      const databaseId = integration.settings?.notionDatabaseId;
      if (!databaseId) {
        throw new Error("No Notion database configured for this integration");
      }
      const page = await createNotionPage(integration.decryptedKey, {
        databaseId,
        title: feedback.title,
        description: feedback.description || "",
        type: feedback.type,
        priority: feedback.priority,
        tags: feedback.tags || [],
        screenshotUrl: feedback.screenshotUrl,
        recordingUrl: feedback.recordingUrl,
        metadata: feedback.metadata,
        submitterName: feedback.submitterName,
        submitterEmail: feedback.submitterEmail,
      });
      return { details: `Exported to Notion: ${page.url || page.id}` };
    }

    case "send_webhook": {
      if (!rule.actionConfig?.webhookId) {
        throw new Error("No webhook configured for this rule");
      }
      await ctx.runMutation(internal.webhooks.triggerWebhookForAutomation, {
        webhookId: rule.actionConfig.webhookId,
        feedbackId: feedback._id,
        event: "automation_triggered",
        payload: {
          ruleName: rule.name,
          feedback: {
            id: feedback._id,
            type: feedback.type,
            title: feedback.title,
            status: feedback.status,
            priority: feedback.priority,
            tags: feedback.tags,
          },
        },
      });
      return { details: "Webhook triggered" };
    }

    case "assign_user": {
      if (!rule.actionConfig?.targetUserId) {
        throw new Error("No user configured for assignment");
      }
      await ctx.runMutation(internal.automationRules.assignFeedbackFromAutomation, {
        feedbackId: feedback._id,
        assigneeId: rule.actionConfig.targetUserId,
      });
      return { details: "Assigned to user" };
    }

    case "set_priority": {
      if (!rule.actionConfig?.priority) {
        throw new Error("No priority configured");
      }
      await ctx.runMutation(internal.automationRules.setPriorityFromAutomation, {
        feedbackId: feedback._id,
        priority: rule.actionConfig.priority as "low" | "medium" | "high" | "critical",
      });
      return { details: `Priority set to ${rule.actionConfig.priority}` };
    }

    case "add_tag": {
      if (!rule.actionConfig?.tag) {
        throw new Error("No tag configured");
      }
      await ctx.runMutation(internal.automationRules.addTagFromAutomation, {
        feedbackId: feedback._id,
        tag: rule.actionConfig.tag,
      });
      return { details: `Tag "${rule.actionConfig.tag}" added` };
    }

    default:
      throw new Error(`Unknown action: ${rule.action}`);
  }
}

/**
 * Evaluate and execute automation rules for a feedback event.
 */
export const runAutomation = internalAction({
  args: {
    feedbackId: v.id("feedback"),
    trigger: v.union(
      v.literal("new_feedback"),
      v.literal("status_changed"),
      v.literal("priority_changed")
    ),
  },
  handler: async (ctx, args) => {
    const feedback = await ctx.runQuery(api.feedback.getFeedbackInternal, {
      feedbackId: args.feedbackId,
    });
    if (!feedback) {
      return { executed: 0, error: "Feedback not found" };
    }

    const rules = await ctx.runQuery(
      internal.automationRules.getEnabledRulesForProject,
      { projectId: feedback.projectId, trigger: args.trigger }
    );
    if (!rules || rules.length === 0) {
      return { executed: 0 };
    }

    let executedCount = 0;
    for (const rule of rules) {
      if (!evaluateConditions(feedback, rule.conditions)) {
        continue;
      }
      try {
        const result = await executeRuleAction(ctx, feedback, rule);
        executedCount++;
        await ctx.runMutation(internal.automationRules.logRuleExecution, {
          feedbackId: args.feedbackId,
          ruleId: rule._id,
          ruleName: rule.name,
          action: rule.action,
          status: "success",
          details: result.details,
        });
      } catch (error) {
        await ctx.runMutation(internal.automationRules.logRuleExecution, {
          feedbackId: args.feedbackId,
          ruleId: rule._id,
          ruleName: rule.name,
          action: rule.action,
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
    return { executed: executedCount };
  },
});

// =============================================================================
// New-feedback notifications
// =============================================================================

/**
 * Notify all team members of a new submission: in-app notification always;
 * email immediately, queued for digest, or skipped per user preferences.
 */
export const notifyNewFeedback = internalAction({
  args: {
    feedbackId: v.id("feedback"),
    feedbackTitle: v.string(),
    feedbackDescription: v.optional(v.string()),
    feedbackType: v.union(v.literal("bug"), v.literal("feature")),
    projectName: v.string(),
    teamId: v.id("teams"),
  },
  handler: async (ctx, args) => {
    const teamMembers = await ctx.runQuery(internal.teams.getTeamMembersForNotifications, {
      teamId: args.teamId,
    });
    if (!teamMembers || teamMembers.length === 0) {
      return { notified: 0 };
    }

    const title = `New feedback: ${args.feedbackTitle}`;
    let notified = 0;

    for (const member of teamMembers) {
      if (!member) continue;
      const userId = member.userId as Id<"users">;
      try {
        await ctx.runMutation(internal.notifications.createNotification, {
          userId,
          type: "new_feedback",
          title,
          body: args.feedbackDescription,
          feedbackId: args.feedbackId,
        });

        const preferences = await ctx.runQuery(
          internal.notifications.getPreferencesByUserId,
          { userId }
        );

        const shouldEmail =
          !preferences ||
          (preferences.emailEnabled !== false &&
            preferences.events?.newFeedback !== false);
        if (!shouldEmail) {
          notified++;
          continue;
        }

        const frequency = preferences?.emailFrequency || "instant";
        if (frequency !== "instant") {
          await ctx.runMutation(internal.notifications.queueForDigest, {
            userId,
            notificationType: "new_feedback",
            feedbackId: args.feedbackId,
            title: args.feedbackTitle,
            body: args.feedbackDescription,
            projectName: args.projectName,
            metadata: { feedbackTitle: args.feedbackTitle },
          });
          notified++;
          continue;
        }

        await sendNotificationEmail({
          type: "new_feedback",
          recipientEmail: member.email,
          recipientName: member.name,
          feedbackId: args.feedbackId,
          feedbackTitle: args.feedbackTitle,
          feedbackDescription: args.feedbackDescription,
          feedbackType: args.feedbackType,
          projectName: args.projectName,
          unsubscribeToken: preferences?.unsubscribeToken || "",
        });
        notified++;
      } catch (error) {
        console.error(`Failed to notify user ${String(userId)}:`, error);
      }
    }

    return { notified };
  },
});
