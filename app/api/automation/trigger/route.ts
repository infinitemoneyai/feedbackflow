import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

// Lazy initialize Convex client
function getConvexClient() {
  return new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL || "");
}

/**
 * POST /api/automation/trigger
 * Triggers automation rule evaluation for a feedback event
 * This is called internally after feedback creation/update
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Verify internal API key (simple auth for internal calls)
    const internalKey = request.headers.get("x-internal-key");
    const expectedKey = process.env.INTERNAL_API_KEY;

    if (!expectedKey || internalKey !== expectedKey) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { feedbackId, trigger, previousValues } = body as {
      feedbackId: string;
      trigger: "new_feedback" | "status_changed" | "priority_changed";
      previousValues?: {
        status?: string;
        priority?: string;
      };
    };

    if (!feedbackId || !trigger) {
      return NextResponse.json(
        { error: "Missing required fields: feedbackId, trigger" },
        { status: 400 }
      );
    }

    const convex = getConvexClient();

    // Get the feedback to find the project
    const feedback = await convex.query(api.feedback.getFeedbackInternal, {
      feedbackId: feedbackId as Id<"feedback">,
    });

    if (!feedback) {
      return NextResponse.json(
        { error: "Feedback not found" },
        { status: 404 }
      );
    }

    // Get enabled rules for this project and trigger
    const rules = await convex.query(api.automationRules.getEnabledRulesForProjectPublic, {
      projectId: feedback.projectId,
      trigger,
    });

    if (!rules || rules.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No matching automation rules",
        executed: 0,
      });
    }

    let executedCount = 0;
    const results: Array<{
      ruleName: string;
      action: string;
      status: string;
      error?: string;
    }> = [];

    // Evaluate each rule
    for (const rule of rules) {
      // Check if all conditions are met
      const conditionsMet = evaluateConditions(
        feedback,
        rule.conditions,
        previousValues
      );

      if (!conditionsMet) {
        continue;
      }

      // Execute the action
      try {
        const actionResult = await executeAction(
          convex,
          feedback,
          rule as AutomationRule,
          request.nextUrl.origin
        );
        executedCount++;

        // Log successful execution
        await logRuleExecution(convex, {
          feedbackId: feedbackId as Id<"feedback">,
          ruleName: rule.name,
          action: rule.action,
          status: "success",
          details: actionResult.details,
        });

        results.push({
          ruleName: rule.name,
          action: rule.action,
          status: "success",
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";

        // Log failed execution
        await logRuleExecution(convex, {
          feedbackId: feedbackId as Id<"feedback">,
          ruleName: rule.name,
          action: rule.action,
          status: "failed",
          error: errorMessage,
        });

        results.push({
          ruleName: rule.name,
          action: rule.action,
          status: "failed",
          error: errorMessage,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Evaluated ${rules.length} rules, executed ${executedCount}`,
      executed: executedCount,
      results,
    });
  } catch (error) {
    console.error("Automation trigger error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Types for rule data
interface AutomationRule {
  _id: Id<"automationRules">;
  projectId: Id<"projects">;
  name: string;
  isEnabled: boolean;
  trigger: "new_feedback" | "status_changed" | "priority_changed";
  conditions: Array<{
    field: "type" | "priority" | "status" | "tags";
    operator: "equals" | "not_equals" | "contains";
    value: string;
  }>;
  action:
    | "export_linear"
    | "export_notion"
    | "send_webhook"
    | "assign_user"
    | "set_priority"
    | "add_tag";
  actionConfig?: {
    targetUserId?: Id<"users">;
    priority?: string;
    tag?: string;
    webhookId?: Id<"webhooks">;
  };
}

interface FeedbackData {
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

/**
 * Evaluate if conditions are met for a rule
 */
function evaluateConditions(
  feedback: FeedbackData,
  conditions: AutomationRule["conditions"],
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
          conditionMet = fieldValue.some((v) =>
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

/**
 * Execute the action for a rule
 */
async function executeAction(
  convex: ConvexHttpClient,
  feedback: FeedbackData,
  rule: AutomationRule,
  baseUrl: string
): Promise<{ success: boolean; details?: string }> {
  const internalKey = process.env.INTERNAL_API_KEY || "";

  switch (rule.action) {
    case "export_linear": {
      // Trigger Linear export via API
      const response = await fetch(`${baseUrl}/api/integrations/linear`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-key": internalKey,
        },
        body: JSON.stringify({
          action: "createIssue",
          feedbackId: feedback._id,
          teamId: feedback.teamId,
          automated: true,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Linear export failed: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, details: `Exported to Linear: ${data.issueId || data.url}` };
    }

    case "export_notion": {
      // Trigger Notion export via API
      const response = await fetch(`${baseUrl}/api/integrations/notion`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-key": internalKey,
        },
        body: JSON.stringify({
          action: "createPage",
          feedbackId: feedback._id,
          teamId: feedback.teamId,
          automated: true,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Notion export failed: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, details: `Exported to Notion: ${data.pageId || data.url}` };
    }

    case "send_webhook": {
      if (!rule.actionConfig?.webhookId) {
        throw new Error("No webhook configured for this rule");
      }

      // Trigger webhook via the existing webhook system
      // The webhook will be sent by the scheduled Convex action
      await convex.mutation(api.webhooks.triggerWebhookForAutomation, {
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

      return { success: true, details: "Webhook triggered" };
    }

    case "assign_user": {
      if (!rule.actionConfig?.targetUserId) {
        throw new Error("No user configured for assignment");
      }

      await convex.mutation(api.automationRules.assignFeedbackFromAutomation, {
        feedbackId: feedback._id,
        assigneeId: rule.actionConfig.targetUserId,
      });

      return { success: true, details: `Assigned to user` };
    }

    case "set_priority": {
      if (!rule.actionConfig?.priority) {
        throw new Error("No priority configured");
      }

      await convex.mutation(api.automationRules.setPriorityFromAutomation, {
        feedbackId: feedback._id,
        priority: rule.actionConfig.priority as
          | "low"
          | "medium"
          | "high"
          | "critical",
      });

      return { success: true, details: `Priority set to ${rule.actionConfig.priority}` };
    }

    case "add_tag": {
      if (!rule.actionConfig?.tag) {
        throw new Error("No tag configured");
      }

      await convex.mutation(api.automationRules.addTagFromAutomation, {
        feedbackId: feedback._id,
        tag: rule.actionConfig.tag,
      });

      return { success: true, details: `Tag "${rule.actionConfig.tag}" added` };
    }

    default:
      throw new Error(`Unknown action: ${rule.action}`);
  }
}

/**
 * Log rule execution to activity log
 */
async function logRuleExecution(
  convex: ConvexHttpClient,
  args: {
    feedbackId: Id<"feedback">;
    ruleName: string;
    action: string;
    status: string;
    error?: string;
    details?: string;
  }
) {
  try {
    await convex.mutation(api.automationRules.logRuleExecutionPublic, {
      feedbackId: args.feedbackId,
      ruleName: args.ruleName,
      action: args.action,
      status: args.status as "success" | "failed",
      error: args.error,
      details: args.details,
    });
  } catch (err) {
    console.warn("Failed to log rule execution:", err);
  }
}
