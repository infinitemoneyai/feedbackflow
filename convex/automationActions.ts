import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal, api } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// Define inline types for feedback and automation rules
interface FeedbackDoc {
  _id: Id<"feedback">;
  projectId: Id<"projects">;
  teamId: Id<"teams">;
  type: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  tags?: string[];
  screenshotUrl?: string;
  metadata?: {
    browser?: string;
    os?: string;
    url?: string;
    timestamp?: number;
  };
  createdAt: number;
}

interface AutomationRuleDoc {
  _id: Id<"automationRules">;
  projectId: Id<"projects">;
  name: string;
  isEnabled: boolean;
  trigger: string;
  conditions: Array<{
    field: "type" | "priority" | "status" | "tags";
    operator: "equals" | "not_equals" | "contains";
    value: string;
  }>;
  action: string;
  actionConfig?: {
    targetUserId?: Id<"users">;
    priority?: string;
    tag?: string;
    webhookId?: Id<"webhooks">;
  };
}

/**
 * Evaluate automation rules for a feedback event
 */
export const evaluateRules = internalAction({
  args: {
    feedbackId: v.id("feedback"),
    trigger: v.union(
      v.literal("new_feedback"),
      v.literal("status_changed"),
      v.literal("priority_changed")
    ),
    previousValues: v.optional(
      v.object({
        status: v.optional(v.string()),
        priority: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    // Get the feedback
    const feedback = await ctx.runQuery(api.feedback.getFeedbackInternal, {
      feedbackId: args.feedbackId,
    });

    if (!feedback) {
      return { executed: 0 };
    }

    // Get enabled rules for this project and trigger
    const rules = await ctx.runQuery(
      internal.automationRules.getEnabledRulesForProject,
      {
        projectId: feedback.projectId,
        trigger: args.trigger,
      }
    );

    if (rules.length === 0) {
      return { executed: 0 };
    }

    let executedCount = 0;

    for (const rule of rules) {
      // Check if all conditions are met
      const conditionsMet = evaluateConditions(
        feedback,
        rule.conditions,
        args.previousValues
      );

      if (!conditionsMet) {
        continue;
      }

      // Execute the action
      try {
        await executeAction(ctx, feedback, rule);
        executedCount++;

        // Log successful execution
        await ctx.runMutation(internal.automationRules.logRuleExecution, {
          feedbackId: args.feedbackId,
          ruleId: rule._id,
          ruleName: rule.name,
          action: rule.action,
          status: "success",
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";

        // Log failed execution
        await ctx.runMutation(internal.automationRules.logRuleExecution, {
          feedbackId: args.feedbackId,
          ruleId: rule._id,
          ruleName: rule.name,
          action: rule.action,
          status: "failed",
          error: errorMessage,
        });
      }
    }

    return { executed: executedCount };
  },
});

/**
 * Evaluate if conditions are met for a rule
 */
function evaluateConditions(
  feedback: FeedbackDoc,
  conditions: Array<{
    field: "type" | "priority" | "status" | "tags";
    operator: "equals" | "not_equals" | "contains";
    value: string;
  }>,
  _previousValues?: { status?: string; priority?: string }
): boolean {
  // All conditions must be met (AND logic)
  for (const condition of conditions) {
    let fieldValue: string | string[];

    switch (condition.field) {
      case "type":
        fieldValue = feedback.type;
        break;
      case "priority":
        fieldValue = feedback.priority;
        break;
      case "status":
        fieldValue = feedback.status;
        break;
      case "tags":
        fieldValue = feedback.tags || [];
        break;
      default:
        return false;
    }

    let conditionMet = false;

    switch (condition.operator) {
      case "equals":
        if (Array.isArray(fieldValue)) {
          conditionMet = fieldValue.includes(condition.value);
        } else {
          conditionMet = fieldValue === condition.value;
        }
        break;
      case "not_equals":
        if (Array.isArray(fieldValue)) {
          conditionMet = !fieldValue.includes(condition.value);
        } else {
          conditionMet = fieldValue !== condition.value;
        }
        break;
      case "contains":
        if (Array.isArray(fieldValue)) {
          conditionMet = fieldValue.some(
            (v) =>
              v.toLowerCase().includes(condition.value.toLowerCase())
          );
        } else {
          conditionMet = fieldValue
            .toLowerCase()
            .includes(condition.value.toLowerCase());
        }
        break;
    }

    if (!conditionMet) {
      return false;
    }
  }

  return true;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
type ActionContext = {
  runMutation: (fn: any, args: any) => Promise<any>;
  runAction: (fn: any, args: any) => Promise<any>;
  scheduler: { runAfter: (delay: number, fn: any, args: any) => Promise<any> };
};
/* eslint-enable @typescript-eslint/no-explicit-any */

/**
 * Execute the action for a rule
 */
async function executeAction(
  ctx: ActionContext,
  feedback: FeedbackDoc,
  rule: AutomationRuleDoc
) {
  switch (rule.action) {
    case "export_linear":
      // Schedule Linear export (done via API route call)
      await ctx.scheduler.runAfter(0, internal.automationActions.executeLinearExport, {
        feedbackId: feedback._id,
        teamId: feedback.teamId,
      });
      break;

    case "export_notion":
      // Schedule Notion export (done via API route call)
      await ctx.scheduler.runAfter(0, internal.automationActions.executeNotionExport, {
        feedbackId: feedback._id,
        teamId: feedback.teamId,
      });
      break;

    case "send_webhook":
      if (rule.actionConfig?.webhookId) {
        // Trigger webhook send
        await ctx.scheduler.runAfter(0, internal.webhookActions.sendWebhook, {
          webhookId: rule.actionConfig.webhookId,
          feedbackId: feedback._id,
          event: "automation_triggered",
          payload: {
            feedbackId: feedback._id,
            ruleName: rule.name,
            feedback: {
              type: feedback.type,
              title: feedback.title,
              description: feedback.description,
              status: feedback.status,
              priority: feedback.priority,
              tags: feedback.tags,
            },
          },
          attempt: 1,
        });
      }
      break;

    case "assign_user":
      if (rule.actionConfig?.targetUserId) {
        await ctx.runMutation(internal.automationActions.assignFeedback, {
          feedbackId: feedback._id,
          assigneeId: rule.actionConfig.targetUserId,
        });
      }
      break;

    case "set_priority":
      if (rule.actionConfig?.priority) {
        await ctx.runMutation(internal.automationActions.setPriority, {
          feedbackId: feedback._id,
          priority: rule.actionConfig.priority as "low" | "medium" | "high" | "critical",
        });
      }
      break;

    case "add_tag":
      if (rule.actionConfig?.tag) {
        await ctx.runMutation(internal.automationActions.addTag, {
          feedbackId: feedback._id,
          tag: rule.actionConfig.tag,
        });
      }
      break;
  }
}

/**
 * Assign feedback to a user (internal mutation for automation)
 */
export const assignFeedback = internalAction({
  args: {
    feedbackId: v.id("feedback"),
    assigneeId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await ctx.runMutation(internal.automationActions.assignFeedbackInternal, args);
  },
});

export const assignFeedbackInternal = internalAction({
  args: {
    feedbackId: v.id("feedback"),
    assigneeId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Use internal mutation to update feedback
    await ctx.runMutation(internal.automationActions.updateFeedbackInternal, {
      feedbackId: args.feedbackId,
      assigneeId: args.assigneeId,
    });
  },
});

/**
 * Set priority for feedback (internal mutation for automation)
 */
export const setPriority = internalAction({
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
    await ctx.runMutation(internal.automationActions.updateFeedbackInternal, {
      feedbackId: args.feedbackId,
      priority: args.priority,
    });
  },
});

/**
 * Add a tag to feedback (internal mutation for automation)
 */
export const addTag = internalAction({
  args: {
    feedbackId: v.id("feedback"),
    tag: v.string(),
  },
  handler: async (ctx, args) => {
    // Get current feedback to check existing tags
    const feedback = await ctx.runQuery(api.feedback.getFeedbackInternal, {
      feedbackId: args.feedbackId,
    });

    if (!feedback) return;

    const currentTags = feedback.tags || [];
    if (!currentTags.includes(args.tag)) {
      await ctx.runMutation(internal.automationActions.updateFeedbackInternal, {
        feedbackId: args.feedbackId,
        tags: [...currentTags, args.tag],
      });
    }
  },
});

/**
 * Internal mutation to update feedback (no auth required)
 */
import { internalMutation } from "./_generated/server";

export const updateFeedbackInternal = internalMutation({
  args: {
    feedbackId: v.id("feedback"),
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
    assigneeId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const feedback = await ctx.db.get(args.feedbackId);
    if (!feedback) {
      throw new Error("Feedback not found");
    }

    const updates: Record<string, unknown> = {
      updatedAt: Date.now(),
    };

    if (args.status !== undefined) updates.status = args.status;
    if (args.priority !== undefined) updates.priority = args.priority;
    if (args.tags !== undefined) updates.tags = args.tags;
    if (args.assigneeId !== undefined) updates.assigneeId = args.assigneeId;

    await ctx.db.patch(args.feedbackId, updates);

    return { success: true };
  },
});

/**
 * Execute Linear export for automation
 */
export const executeLinearExport: any = internalAction({
  args: {
    feedbackId: v.id("feedback"),
    teamId: v.id("teams"),
  },
  handler: async (ctx, args) => {
    // Get Linear integration
    const linearConfig = await ctx.runQuery(api.integrations.getLinearApiKey, {
      teamId: args.teamId,
    });

    if (!linearConfig?.apiKey) {
      throw new Error("Linear integration not configured");
    }

    // Get feedback
    const feedback = await ctx.runQuery(api.feedback.getFeedbackInternal, {
      feedbackId: args.feedbackId,
    });

    if (!feedback) {
      throw new Error("Feedback not found");
    }

    // Import Linear SDK functions dynamically
    const linearApiUrl = "https://api.linear.app/graphql";

    // Map priority
    const priorityMap: Record<string, number> = {
      critical: 1, // Urgent
      high: 2, // High
      medium: 3, // Normal
      low: 4, // Low
    };

    // Create issue via GraphQL API
    const mutation = `
      mutation CreateIssue($input: IssueCreateInput!) {
        issueCreate(input: $input) {
          success
          issue {
            id
            identifier
            url
          }
        }
      }
    `;

    const description = `
## Feedback from FeedbackFlow

**Type:** ${feedback.type}
**Priority:** ${feedback.priority}

### Description
${feedback.description || "No description provided"}

### Metadata
- **URL:** ${feedback.metadata?.url || "N/A"}
- **Browser:** ${feedback.metadata?.browser || "N/A"}
- **OS:** ${feedback.metadata?.os || "N/A"}
- **Submitted:** ${new Date(feedback.createdAt).toISOString()}

${feedback.screenshotUrl ? `### Screenshot\n![Screenshot](${feedback.screenshotUrl})` : ""}

---
*Automatically created by FeedbackFlow automation*
    `.trim();

    const input: Record<string, unknown> = {
      title: `[Feedback] ${feedback.title}`,
      description,
      priority: priorityMap[feedback.priority] || 3,
    };

    if (linearConfig.settings?.linearTeamId) {
      input.teamId = linearConfig.settings.linearTeamId;
    }

    if (linearConfig.settings?.linearProjectId) {
      input.projectId = linearConfig.settings.linearProjectId;
    }

    if (linearConfig.settings?.linearLabelIds?.length) {
      input.labelIds = linearConfig.settings.linearLabelIds;
    }

    const response = await fetch(linearApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: linearConfig.apiKey,
      },
      body: JSON.stringify({
        query: mutation,
        variables: { input },
      }),
    });

    const data = await response.json();

    if (data.errors) {
      throw new Error(data.errors[0]?.message || "Linear API error");
    }

    const issue = data.data?.issueCreate?.issue;

    if (!issue) {
      throw new Error("Failed to create Linear issue");
    }

    // Create export record
    await ctx.runMutation(internal.automationActions.createExportInternal, {
      feedbackId: args.feedbackId,
      provider: "linear",
      externalId: issue.identifier,
      externalUrl: issue.url,
      status: "success",
    });

    // Update feedback status
    await ctx.runMutation(internal.automationActions.updateFeedbackInternal, {
      feedbackId: args.feedbackId,
      status: "exported",
    });

    return { success: true, issueId: issue.identifier };
  },
});

/**
 * Execute Notion export for automation
 */
export const executeNotionExport: any = internalAction({
  args: {
    feedbackId: v.id("feedback"),
    teamId: v.id("teams"),
  },
  handler: async (ctx, args) => {
    // Get Notion integration
    const notionConfig = await ctx.runQuery(api.integrations.getNotionApiKey, {
      teamId: args.teamId,
    });

    if (!notionConfig?.apiKey) {
      throw new Error("Notion integration not configured");
    }

    if (!notionConfig.settings?.notionDatabaseId) {
      throw new Error("Notion database not configured");
    }

    // Get feedback
    const feedback = await ctx.runQuery(api.feedback.getFeedbackInternal, {
      feedbackId: args.feedbackId,
    });

    if (!feedback) {
      throw new Error("Feedback not found");
    }

    // Create Notion page via API
    const notionApiUrl = "https://api.notion.com/v1/pages";

    const properties: Record<string, unknown> = {
      Name: {
        title: [
          {
            text: {
              content: feedback.title,
            },
          },
        ],
      },
    };

    // Add select properties if they exist in the database
    // These are optional and will be ignored if not present
    const response = await fetch(notionApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${notionConfig.apiKey}`,
        "Notion-Version": "2022-06-28",
      },
      body: JSON.stringify({
        parent: {
          database_id: notionConfig.settings.notionDatabaseId,
        },
        properties,
        children: [
          {
            object: "block",
            type: "heading_2",
            heading_2: {
              rich_text: [{ type: "text", text: { content: "Description" } }],
            },
          },
          {
            object: "block",
            type: "paragraph",
            paragraph: {
              rich_text: [
                {
                  type: "text",
                  text: { content: feedback.description || "No description" },
                },
              ],
            },
          },
          {
            object: "block",
            type: "heading_2",
            heading_2: {
              rich_text: [{ type: "text", text: { content: "Details" } }],
            },
          },
          {
            object: "block",
            type: "bulleted_list_item",
            bulleted_list_item: {
              rich_text: [
                {
                  type: "text",
                  text: { content: `Type: ${feedback.type}` },
                },
              ],
            },
          },
          {
            object: "block",
            type: "bulleted_list_item",
            bulleted_list_item: {
              rich_text: [
                {
                  type: "text",
                  text: { content: `Priority: ${feedback.priority}` },
                },
              ],
            },
          },
          {
            object: "block",
            type: "bulleted_list_item",
            bulleted_list_item: {
              rich_text: [
                {
                  type: "text",
                  text: { content: `URL: ${feedback.metadata?.url || "N/A"}` },
                },
              ],
            },
          },
          ...(feedback.screenshotUrl
            ? [
                {
                  object: "block" as const,
                  type: "image" as const,
                  image: {
                    type: "external" as const,
                    external: {
                      url: feedback.screenshotUrl,
                    },
                  },
                },
              ]
            : []),
          {
            object: "block",
            type: "divider",
            divider: {},
          },
          {
            object: "block",
            type: "paragraph",
            paragraph: {
              rich_text: [
                {
                  type: "text",
                  text: {
                    content: "Automatically created by FeedbackFlow automation",
                  },
                  annotations: { italic: true, color: "gray" },
                },
              ],
            },
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Notion API error");
    }

    // Create export record
    await ctx.runMutation(internal.automationActions.createExportInternal, {
      feedbackId: args.feedbackId,
      provider: "notion",
      externalId: data.id,
      externalUrl: data.url,
      status: "success",
    });

    // Update feedback status
    await ctx.runMutation(internal.automationActions.updateFeedbackInternal, {
      feedbackId: args.feedbackId,
      status: "exported",
    });

    return { success: true, pageId: data.id };
  },
});

/**
 * Create export record (internal mutation)
 */
export const createExportInternal = internalMutation({
  args: {
    feedbackId: v.id("feedback"),
    provider: v.union(v.literal("linear"), v.literal("notion"), v.literal("json")),
    externalId: v.optional(v.string()),
    externalUrl: v.optional(v.string()),
    status: v.union(v.literal("success"), v.literal("failed")),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const exportId = await ctx.db.insert("exports", {
      feedbackId: args.feedbackId,
      provider: args.provider,
      externalId: args.externalId,
      externalUrl: args.externalUrl,
      status: args.status,
      errorMessage: args.errorMessage,
      createdAt: Date.now(),
    });

    // Create activity log entry
    await ctx.db.insert("activityLog", {
      feedbackId: args.feedbackId,
      action: "exported",
      details: {
        to: args.provider,
        extra:
          args.status === "success"
            ? args.externalUrl
            : args.errorMessage,
      },
      createdAt: Date.now(),
    });

    return { exportId };
  },
});
