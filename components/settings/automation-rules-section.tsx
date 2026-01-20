"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import {
  Zap,
  Plus,
  Trash2,
  Loader2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  X,
  Play,
  Pause,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";

interface AutomationRulesSectionProps {
  teamId: Id<"teams">;
}

type Trigger = "new_feedback" | "status_changed" | "priority_changed";
type ConditionField = "type" | "priority" | "status" | "tags";
type ConditionOperator = "equals" | "not_equals" | "contains";
type Action =
  | "export_linear"
  | "export_notion"
  | "send_webhook"
  | "assign_user"
  | "set_priority"
  | "add_tag";

interface Condition {
  field: ConditionField;
  operator: ConditionOperator;
  value: string;
}

interface ActionConfig {
  targetUserId?: Id<"users">;
  priority?: string;
  tag?: string;
  webhookId?: Id<"webhooks">;
}

const TRIGGER_LABELS: Record<Trigger, string> = {
  new_feedback: "New Feedback Submitted",
  status_changed: "Status Changed",
  priority_changed: "Priority Changed",
};

const CONDITION_FIELD_LABELS: Record<ConditionField, string> = {
  type: "Type",
  priority: "Priority",
  status: "Status",
  tags: "Tags",
};

const CONDITION_OPERATOR_LABELS: Record<ConditionOperator, string> = {
  equals: "equals",
  not_equals: "does not equal",
  contains: "contains",
};

const TYPE_VALUES = ["bug", "feature"];
const PRIORITY_VALUES = ["low", "medium", "high", "critical"];
const STATUS_VALUES = ["new", "triaging", "drafted", "exported", "resolved"];

// Types for query results
interface ProjectResult {
  _id: Id<"projects">;
  name: string;
}

interface TeamMemberResult {
  _id: Id<"users">;
  name: string;
  email: string;
  avatar?: string;
}

interface WebhookResult {
  _id: Id<"webhooks">;
  url: string;
}

interface RuleResult {
  _id: Id<"automationRules">;
  name: string;
  isEnabled: boolean;
  trigger: string;
  conditions: Condition[];
  action: string;
  actionConfig?: ActionConfig;
  targetUser?: { _id: Id<"users">; name: string; email: string } | null;
  webhook?: { _id: Id<"webhooks">; url: string } | null;
  createdAt: number;
}

export function AutomationRulesSection({ teamId }: AutomationRulesSectionProps) {
  const projects = useQuery(api.projects.getProjects, { teamId });
  const [selectedProjectId, setSelectedProjectId] = useState<Id<"projects"> | null>(null);

  // Use first project by default if none selected
  const projectId = selectedProjectId || projects?.[0]?._id;

  const rules = useQuery(
    api.automationRules.getRulesForProject,
    projectId ? { projectId } : "skip"
  );
  const createRule = useMutation(api.automationRules.createRule);
  const updateRule = useMutation(api.automationRules.updateRule);
  const deleteRule = useMutation(api.automationRules.deleteRule);

  // Queries for action config options
  const teamMembers = useQuery(
    api.automationRules.getTeamMembersForProject,
    projectId ? { projectId } : "skip"
  );
  const webhooks = useQuery(
    api.automationRules.getWebhooksForProject,
    projectId ? { projectId } : "skip"
  );
  const hasLinear = useQuery(
    api.automationRules.hasLinearIntegration,
    projectId ? { projectId } : "skip"
  );
  const hasNotion = useQuery(
    api.automationRules.hasNotionIntegration,
    projectId ? { projectId } : "skip"
  );

  const [isAdding, setIsAdding] = useState(false);
  const [expandedRule, setExpandedRule] = useState<Id<"automationRules"> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // New rule form state
  const [newName, setNewName] = useState("");
  const [newTrigger, setNewTrigger] = useState<Trigger>("new_feedback");
  const [newConditions, setNewConditions] = useState<Condition[]>([]);
  const [newAction, setNewAction] = useState<Action>("set_priority");
  const [newActionConfig, setNewActionConfig] = useState<ActionConfig>({});

  const resetForm = () => {
    setNewName("");
    setNewTrigger("new_feedback");
    setNewConditions([]);
    setNewAction("set_priority");
    setNewActionConfig({});
    setSaveError(null);
  };

  const handleCreate = useCallback(async () => {
    if (!newName.trim() || !projectId) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      await createRule({
        projectId,
        name: newName.trim(),
        trigger: newTrigger,
        conditions: newConditions,
        action: newAction,
        actionConfig: newActionConfig,
      });

      resetForm();
      setIsAdding(false);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Failed to create rule");
    } finally {
      setIsSaving(false);
    }
  }, [newName, projectId, newTrigger, newConditions, newAction, newActionConfig, createRule]);

  const handleToggleEnabled = async (ruleId: Id<"automationRules">, isEnabled: boolean) => {
    try {
      await updateRule({
        ruleId,
        isEnabled: !isEnabled,
      });
    } catch (error) {
      console.error("Failed to toggle rule:", error);
    }
  };

  const handleDelete = async (ruleId: Id<"automationRules">) => {
    if (!confirm("Are you sure you want to delete this automation rule?")) return;
    try {
      await deleteRule({ ruleId });
    } catch (error) {
      console.error("Failed to delete rule:", error);
    }
  };

  const addCondition = () => {
    setNewConditions([...newConditions, { field: "type", operator: "equals", value: "bug" }]);
  };

  const updateCondition = (index: number, updates: Partial<Condition>) => {
    const updated = [...newConditions];
    updated[index] = { ...updated[index], ...updates };
    setNewConditions(updated);
  };

  const removeCondition = (index: number) => {
    setNewConditions(newConditions.filter((_, i) => i !== index));
  };

  const getValueOptions = (field: ConditionField): string[] => {
    switch (field) {
      case "type":
        return TYPE_VALUES;
      case "priority":
        return PRIORITY_VALUES;
      case "status":
        return STATUS_VALUES;
      case "tags":
        return []; // Free text for tags
      default:
        return [];
    }
  };

  if (!projects) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-stone-400" />
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="rounded border-2 border-dashed border-stone-300 bg-stone-50 p-8 text-center">
        <Zap className="mx-auto h-12 w-12 text-stone-300" />
        <p className="mt-4 text-sm text-stone-500">
          No projects found. Create a project first to configure automation rules.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <div className="rounded border-2 border-retro-black bg-white shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
        <div className="flex items-center justify-between border-b-2 border-retro-black bg-stone-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-retro-yellow bg-retro-yellow/10">
              <Zap className="h-5 w-5 text-retro-yellow" />
            </div>
            <div>
              <h3 className="font-semibold text-retro-black">Automation Rules</h3>
              <p className="text-xs text-stone-500">
                Automatically process feedback based on conditions
              </p>
            </div>
          </div>

          {!isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-2 rounded border-2 border-retro-black bg-retro-black px-4 py-2 text-sm font-medium text-white transition-all hover:bg-stone-800"
            >
              <Plus className="h-4 w-4" />
              Add Rule
            </button>
          )}
        </div>

        <div className="p-6">
          {/* Project Selector */}
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-stone-700">
              Project
            </label>
            <select
              value={projectId || ""}
              onChange={(e) => setSelectedProjectId(e.target.value as Id<"projects">)}
              className="w-full rounded border-2 border-stone-200 bg-stone-50 px-4 py-2.5 text-sm transition-colors focus:border-retro-black focus:bg-white focus:outline-none"
            >
              {projects.map((project: ProjectResult) => (
                <option key={project._id} value={project._id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          <p className="text-sm text-stone-600">
            Create rules to automatically export feedback to Linear or Notion, send webhooks,
            assign to team members, or update properties when specific conditions are met.
          </p>
        </div>
      </div>

      {/* Add Rule Form */}
      {isAdding && projectId && (
        <div className="rounded border-2 border-retro-black bg-white shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
          <div className="border-b-2 border-retro-black bg-stone-50 px-6 py-4">
            <h4 className="font-semibold text-retro-black">Add New Automation Rule</h4>
          </div>
          <div className="space-y-4 p-6">
            {/* Rule Name */}
            <div>
              <label className="mb-2 block text-sm font-medium text-stone-700">
                Rule Name
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => {
                  setNewName(e.target.value);
                  setSaveError(null);
                }}
                placeholder="e.g., Auto-export bugs to Linear"
                className="w-full rounded border-2 border-stone-200 bg-stone-50 px-4 py-2.5 text-sm transition-colors focus:border-retro-black focus:bg-white focus:outline-none"
              />
            </div>

            {/* Trigger Selection */}
            <div>
              <label className="mb-2 block text-sm font-medium text-stone-700">
                When
              </label>
              <select
                value={newTrigger}
                onChange={(e) => setNewTrigger(e.target.value as Trigger)}
                className="w-full rounded border-2 border-stone-200 bg-stone-50 px-4 py-2.5 text-sm transition-colors focus:border-retro-black focus:bg-white focus:outline-none"
              >
                {(Object.keys(TRIGGER_LABELS) as Trigger[]).map((trigger) => (
                  <option key={trigger} value={trigger}>
                    {TRIGGER_LABELS[trigger]}
                  </option>
                ))}
              </select>
            </div>

            {/* Conditions */}
            <div>
              <label className="mb-2 block text-sm font-medium text-stone-700">
                If (conditions) - optional
              </label>
              <div className="space-y-2">
                {newConditions.map((condition, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <select
                      value={condition.field}
                      onChange={(e) =>
                        updateCondition(index, {
                          field: e.target.value as ConditionField,
                          value: getValueOptions(e.target.value as ConditionField)[0] || "",
                        })
                      }
                      className="rounded border-2 border-stone-200 bg-stone-50 px-3 py-2 text-sm focus:border-retro-black focus:outline-none"
                    >
                      {(Object.keys(CONDITION_FIELD_LABELS) as ConditionField[]).map((field) => (
                        <option key={field} value={field}>
                          {CONDITION_FIELD_LABELS[field]}
                        </option>
                      ))}
                    </select>
                    <select
                      value={condition.operator}
                      onChange={(e) =>
                        updateCondition(index, { operator: e.target.value as ConditionOperator })
                      }
                      className="rounded border-2 border-stone-200 bg-stone-50 px-3 py-2 text-sm focus:border-retro-black focus:outline-none"
                    >
                      {(Object.keys(CONDITION_OPERATOR_LABELS) as ConditionOperator[]).map((op) => (
                        <option key={op} value={op}>
                          {CONDITION_OPERATOR_LABELS[op]}
                        </option>
                      ))}
                    </select>
                    {getValueOptions(condition.field).length > 0 ? (
                      <select
                        value={condition.value}
                        onChange={(e) => updateCondition(index, { value: e.target.value })}
                        className="rounded border-2 border-stone-200 bg-stone-50 px-3 py-2 text-sm focus:border-retro-black focus:outline-none"
                      >
                        {getValueOptions(condition.field).map((value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={condition.value}
                        onChange={(e) => updateCondition(index, { value: e.target.value })}
                        placeholder="Enter value..."
                        className="rounded border-2 border-stone-200 bg-stone-50 px-3 py-2 text-sm focus:border-retro-black focus:outline-none"
                      />
                    )}
                    <button
                      onClick={() => removeCondition(index)}
                      className="rounded p-2 text-stone-400 hover:bg-stone-100 hover:text-retro-red"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={addCondition}
                  className="text-sm text-retro-blue hover:underline"
                >
                  + Add condition
                </button>
              </div>
            </div>

            {/* Action */}
            <div>
              <label className="mb-2 block text-sm font-medium text-stone-700">
                Then
              </label>
              <select
                value={newAction}
                onChange={(e) => {
                  setNewAction(e.target.value as Action);
                  setNewActionConfig({});
                }}
                className="w-full rounded border-2 border-stone-200 bg-stone-50 px-4 py-2.5 text-sm transition-colors focus:border-retro-black focus:bg-white focus:outline-none"
              >
                <option value="set_priority">Set Priority</option>
                <option value="add_tag">Add Tag</option>
                <option value="assign_user">Assign to User</option>
                <option value="send_webhook">Send Webhook</option>
                {hasLinear && <option value="export_linear">Export to Linear</option>}
                {hasNotion && <option value="export_notion">Export to Notion</option>}
              </select>
            </div>

            {/* Action Config */}
            {newAction === "set_priority" && (
              <div>
                <label className="mb-2 block text-sm font-medium text-stone-700">
                  Priority
                </label>
                <select
                  value={newActionConfig.priority || ""}
                  onChange={(e) => setNewActionConfig({ ...newActionConfig, priority: e.target.value })}
                  className="w-full rounded border-2 border-stone-200 bg-stone-50 px-4 py-2.5 text-sm transition-colors focus:border-retro-black focus:bg-white focus:outline-none"
                >
                  <option value="">Select priority...</option>
                  {PRIORITY_VALUES.map((p) => (
                    <option key={p} value={p}>
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {newAction === "add_tag" && (
              <div>
                <label className="mb-2 block text-sm font-medium text-stone-700">
                  Tag
                </label>
                <input
                  type="text"
                  value={newActionConfig.tag || ""}
                  onChange={(e) => setNewActionConfig({ ...newActionConfig, tag: e.target.value })}
                  placeholder="Enter tag name..."
                  className="w-full rounded border-2 border-stone-200 bg-stone-50 px-4 py-2.5 text-sm transition-colors focus:border-retro-black focus:bg-white focus:outline-none"
                />
              </div>
            )}

            {newAction === "assign_user" && (
              <div>
                <label className="mb-2 block text-sm font-medium text-stone-700">
                  Assign To
                </label>
                <select
                  value={newActionConfig.targetUserId || ""}
                  onChange={(e) =>
                    setNewActionConfig({
                      ...newActionConfig,
                      targetUserId: e.target.value as Id<"users">,
                    })
                  }
                  className="w-full rounded border-2 border-stone-200 bg-stone-50 px-4 py-2.5 text-sm transition-colors focus:border-retro-black focus:bg-white focus:outline-none"
                >
                  <option value="">Select team member...</option>
                  {teamMembers?.map((member: TeamMemberResult | null) => (
                    <option key={member?._id} value={member?._id}>
                      {member?.name || member?.email}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {newAction === "send_webhook" && (
              <div>
                <label className="mb-2 block text-sm font-medium text-stone-700">
                  Webhook
                </label>
                {webhooks && webhooks.length > 0 ? (
                  <select
                    value={newActionConfig.webhookId || ""}
                    onChange={(e) =>
                      setNewActionConfig({
                        ...newActionConfig,
                        webhookId: e.target.value as Id<"webhooks">,
                      })
                    }
                    className="w-full rounded border-2 border-stone-200 bg-stone-50 px-4 py-2.5 text-sm transition-colors focus:border-retro-black focus:bg-white focus:outline-none"
                  >
                    <option value="">Select webhook...</option>
                    {webhooks.map((webhook: WebhookResult) => (
                      <option key={webhook._id} value={webhook._id}>
                        {webhook.url}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-sm text-stone-500">
                    No webhooks configured.{" "}
                    <span className="text-retro-blue">
                      Add a webhook in the Webhooks tab first.
                    </span>
                  </p>
                )}
              </div>
            )}

            {(newAction === "export_linear" || newAction === "export_notion") && (
              <div className="rounded border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-600">
                <AlertCircle className="mb-1 inline h-4 w-4" />{" "}
                {newAction === "export_linear"
                  ? "Feedback will be exported to Linear using your configured integration settings."
                  : "Feedback will be exported to Notion using your configured integration settings."}
              </div>
            )}

            {/* Error */}
            {saveError && (
              <div className="flex items-center gap-2 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <X className="h-4 w-4" />
                {saveError}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleCreate}
                disabled={
                  !newName.trim() ||
                  isSaving ||
                  (newAction === "set_priority" && !newActionConfig.priority) ||
                  (newAction === "add_tag" && !newActionConfig.tag) ||
                  (newAction === "assign_user" && !newActionConfig.targetUserId) ||
                  (newAction === "send_webhook" && !newActionConfig.webhookId)
                }
                className="flex items-center gap-2 rounded border-2 border-retro-black bg-retro-black px-6 py-2.5 text-sm font-medium text-white shadow-[4px_4px_0px_0px_#888] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000] disabled:opacity-50 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[4px_4px_0px_0px_#888]"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Create Rule
              </button>
              <button
                onClick={() => {
                  setIsAdding(false);
                  resetForm();
                }}
                className="rounded border-2 border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-600 transition-colors hover:border-stone-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rules List */}
      {rules && rules.length > 0 && (
        <div className="space-y-4">
          {rules.map((rule: RuleResult) => (
            <RuleItem
              key={rule._id}
              rule={rule}
              isExpanded={expandedRule === rule._id}
              onToggleExpand={() =>
                setExpandedRule(expandedRule === rule._id ? null : rule._id)
              }
              onToggleEnabled={() => handleToggleEnabled(rule._id, rule.isEnabled)}
              onDelete={() => handleDelete(rule._id)}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {rules && rules.length === 0 && !isAdding && (
        <div className="rounded border-2 border-dashed border-stone-300 bg-stone-50 p-8 text-center">
          <Zap className="mx-auto h-12 w-12 text-stone-300" />
          <p className="mt-4 text-sm text-stone-500">
            No automation rules configured yet. Add your first rule to automate
            feedback processing.
          </p>
        </div>
      )}
    </div>
  );
}

interface RuleItemProps {
  rule: {
    _id: Id<"automationRules">;
    name: string;
    isEnabled: boolean;
    trigger: string;
    conditions: Condition[];
    action: string;
    actionConfig?: ActionConfig;
    targetUser?: { _id: Id<"users">; name: string; email: string } | null;
    webhook?: { _id: Id<"webhooks">; url: string } | null;
    createdAt: number;
  };
  isExpanded: boolean;
  onToggleExpand: () => void;
  onToggleEnabled: () => void;
  onDelete: () => void;
}

function RuleItem({
  rule,
  isExpanded,
  onToggleExpand,
  onToggleEnabled,
  onDelete,
}: RuleItemProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    await onDelete();
    setIsDeleting(false);
  };

  const getActionDescription = () => {
    switch (rule.action) {
      case "export_linear":
        return "Export to Linear";
      case "export_notion":
        return "Export to Notion";
      case "send_webhook":
        return rule.webhook ? `Send to ${rule.webhook.url}` : "Send webhook";
      case "assign_user":
        return rule.targetUser
          ? `Assign to ${rule.targetUser.name || rule.targetUser.email}`
          : "Assign user";
      case "set_priority":
        return `Set priority to ${rule.actionConfig?.priority}`;
      case "add_tag":
        return `Add tag "${rule.actionConfig?.tag}"`;
      default:
        return rule.action;
    }
  };

  return (
    <div className="rounded border-2 border-retro-black bg-white shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
      {/* Header */}
      <div
        className="flex cursor-pointer items-center justify-between border-b-2 border-retro-black bg-stone-50 px-6 py-4"
        onClick={onToggleExpand}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "h-3 w-3 rounded-full",
              rule.isEnabled ? "bg-green-500" : "bg-stone-300"
            )}
          />
          <div>
            <div className="font-medium text-retro-black">{rule.name}</div>
            <div className="mt-1 text-xs text-stone-500">
              {TRIGGER_LABELS[rule.trigger as Trigger]} → {getActionDescription()}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-stone-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-stone-400" />
          )}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-6">
          {/* Rule Details */}
          <div className="mb-4 space-y-3">
            <div>
              <span className="text-sm font-medium text-stone-700">Trigger:</span>
              <span className="ml-2 text-sm text-stone-600">
                {TRIGGER_LABELS[rule.trigger as Trigger]}
              </span>
            </div>

            {rule.conditions.length > 0 && (
              <div>
                <span className="text-sm font-medium text-stone-700">Conditions:</span>
                <ul className="mt-1 ml-4 list-disc text-sm text-stone-600">
                  {rule.conditions.map((condition, i) => (
                    <li key={i}>
                      {CONDITION_FIELD_LABELS[condition.field]}{" "}
                      {CONDITION_OPERATOR_LABELS[condition.operator]}{" "}
                      <code className="rounded bg-stone-100 px-1">{condition.value}</code>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <span className="text-sm font-medium text-stone-700">Action:</span>
              <span className="ml-2 text-sm text-stone-600">{getActionDescription()}</span>
            </div>

            <div className="text-xs text-stone-400">
              Created {new Date(rule.createdAt).toLocaleDateString()}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleEnabled();
              }}
              className={cn(
                "flex items-center gap-2 rounded border-2 px-4 py-2 text-sm font-medium transition-colors",
                rule.isEnabled
                  ? "border-stone-200 bg-white text-stone-600 hover:border-stone-300"
                  : "border-green-600 bg-green-600 text-white hover:bg-green-700"
              )}
            >
              {rule.isEnabled ? (
                <>
                  <Pause className="h-4 w-4" />
                  Disable
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Enable
                </>
              )}
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
              disabled={isDeleting}
              className="flex items-center gap-2 rounded border-2 border-retro-red bg-white px-4 py-2 text-sm font-medium text-retro-red transition-colors hover:bg-retro-red/10 disabled:opacity-50"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
