"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useQuery, useAction, useMutation } from "convex/react";
import {
  FileText,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Loader2,
  Copy,
  Check,
  AlertCircle,
  Edit3,
  Save,
  X,
  Trash2,
  ListChecks,
  Bug,
  Lightbulb,
  Plus,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";

interface TicketDraftSectionProps {
  feedbackId: Id<"feedback">;
  teamId: Id<"teams">;
  feedbackType: "bug" | "feature";
}

interface TicketDraft {
  _id: Id<"ticketDrafts">;
  feedbackId: Id<"feedback">;
  userId: Id<"users">;
  title: string;
  description: string;
  acceptanceCriteria: string[];
  reproSteps?: string[];
  expectedBehavior?: string;
  actualBehavior?: string;
  provider: "openai" | "anthropic";
  model: string;
  createdAt: number;
  updatedAt: number;
}

// Editable text area with auto-resize
function EditableTextArea({
  value,
  onChange,
  placeholder,
  className,
  minRows = 2,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minRows?: number;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={minRows}
      className={cn(
        "w-full resize-none rounded border-2 border-stone-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-retro-black",
        className
      )}
    />
  );
}

// Editable list component for acceptance criteria and repro steps
function EditableList({
  items,
  onChange,
  placeholder,
  numbered = false,
}: {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
  numbered?: boolean;
}) {
  const [newItem, setNewItem] = useState("");

  const handleAddItem = () => {
    if (newItem.trim()) {
      onChange([...items, newItem.trim()]);
      setNewItem("");
    }
  };

  const handleRemoveItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (index: number, value: string) => {
    const newItems = [...items];
    newItems[index] = value;
    onChange(newItems);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddItem();
    }
  };

  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={index} className="flex items-start gap-2">
          {numbered ? (
            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded bg-stone-100 text-xs font-medium text-stone-500">
              {index + 1}
            </span>
          ) : (
            <div className="mt-2.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-stone-400" />
          )}
          <input
            type="text"
            value={item}
            onChange={(e) => handleUpdateItem(index, e.target.value)}
            className="flex-1 rounded border border-transparent bg-transparent px-2 py-1 text-sm outline-none transition-colors hover:border-stone-200 focus:border-retro-black focus:bg-white"
          />
          <button
            onClick={() => handleRemoveItem(index)}
            className="rounded p-1 text-stone-400 transition-colors hover:bg-stone-100 hover:text-retro-red"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 rounded border-2 border-dashed border-stone-200 bg-stone-50 px-3 py-2 text-sm outline-none transition-colors focus:border-retro-blue focus:bg-white"
        />
        <button
          onClick={handleAddItem}
          disabled={!newItem.trim()}
          className="rounded border-2 border-stone-200 bg-white p-2 text-stone-500 transition-colors hover:border-stone-300 hover:bg-stone-50 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function TicketDraftSection({
  feedbackId,
  teamId,
  feedbackType,
}: TicketDraftSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Editable draft state
  const [editedTitle, setEditedTitle] = useState("");
  const [editedDescription, setEditedDescription] = useState("");
  const [editedAcceptanceCriteria, setEditedAcceptanceCriteria] = useState<string[]>([]);
  const [editedReproSteps, setEditedReproSteps] = useState<string[]>([]);
  const [editedExpectedBehavior, setEditedExpectedBehavior] = useState("");
  const [editedActualBehavior, setEditedActualBehavior] = useState("");

  // Get AI configuration for the team
  const aiConfig = useQuery(api.ai.getTeamAiConfig, { teamId });

  // Get existing ticket draft
  const draft = useQuery(api.ai.getTicketDraft, { feedbackId }) as TicketDraft | null | undefined;

  // Action to trigger draft generation
  const triggerDraftGeneration = useAction(api.aiActions.triggerTicketDraftGeneration);

  // Mutations
  const updateDraft = useMutation(api.ai.updateTicketDraft);
  const deleteDraft = useMutation(api.ai.deleteTicketDraft);

  // Initialize editable state when draft loads
  useEffect(() => {
    if (draft && !isEditing) {
      setEditedTitle(draft.title);
      setEditedDescription(draft.description);
      setEditedAcceptanceCriteria(draft.acceptanceCriteria);
      setEditedReproSteps(draft.reproSteps || []);
      setEditedExpectedBehavior(draft.expectedBehavior || "");
      setEditedActualBehavior(draft.actualBehavior || "");
    }
  }, [draft, isEditing]);

  // Handle generate button click
  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    setGenerateError(null);

    try {
      const result = await triggerDraftGeneration({ feedbackId, teamId });
      if (!result.success) {
        setGenerateError(result.error || "Failed to generate ticket draft");
      }
    } catch (error) {
      setGenerateError(error instanceof Error ? error.message : "Failed to generate ticket draft");
    } finally {
      setIsGenerating(false);
    }
  }, [feedbackId, teamId, triggerDraftGeneration]);

  // Handle edit mode toggle
  const handleStartEdit = () => {
    if (draft) {
      setEditedTitle(draft.title);
      setEditedDescription(draft.description);
      setEditedAcceptanceCriteria(draft.acceptanceCriteria);
      setEditedReproSteps(draft.reproSteps || []);
      setEditedExpectedBehavior(draft.expectedBehavior || "");
      setEditedActualBehavior(draft.actualBehavior || "");
      setIsEditing(true);
    }
  };

  // Handle save edits
  const handleSaveEdits = useCallback(async () => {
    if (!draft) return;

    setIsSaving(true);
    try {
      await updateDraft({
        draftId: draft._id,
        title: editedTitle,
        description: editedDescription,
        acceptanceCriteria: editedAcceptanceCriteria,
        reproSteps: editedReproSteps.length > 0 ? editedReproSteps : undefined,
        expectedBehavior: editedExpectedBehavior || undefined,
        actualBehavior: editedActualBehavior || undefined,
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save draft:", error);
    } finally {
      setIsSaving(false);
    }
  }, [draft, editedTitle, editedDescription, editedAcceptanceCriteria, editedReproSteps, editedExpectedBehavior, editedActualBehavior, updateDraft]);

  // Handle cancel edit
  const handleCancelEdit = () => {
    setIsEditing(false);
    if (draft) {
      setEditedTitle(draft.title);
      setEditedDescription(draft.description);
      setEditedAcceptanceCriteria(draft.acceptanceCriteria);
      setEditedReproSteps(draft.reproSteps || []);
      setEditedExpectedBehavior(draft.expectedBehavior || "");
      setEditedActualBehavior(draft.actualBehavior || "");
    }
  };

  // Handle delete draft
  const handleDeleteDraft = useCallback(async () => {
    if (!draft) return;
    if (!confirm("Are you sure you want to delete this draft?")) return;

    try {
      await deleteDraft({ draftId: draft._id });
    } catch (error) {
      console.error("Failed to delete draft:", error);
    }
  }, [draft, deleteDraft]);

  // Handle copy to clipboard
  const handleCopyDraft = useCallback(async () => {
    if (!draft) return;

    let formattedDraft = `# ${draft.title}\n\n`;
    formattedDraft += `## Description\n${draft.description}\n\n`;

    if (draft.reproSteps && draft.reproSteps.length > 0) {
      formattedDraft += `## Steps to Reproduce\n`;
      draft.reproSteps.forEach((step, i) => {
        formattedDraft += `${i + 1}. ${step}\n`;
      });
      formattedDraft += "\n";
    }

    if (draft.expectedBehavior) {
      formattedDraft += `## Expected Behavior\n${draft.expectedBehavior}\n\n`;
    }

    if (draft.actualBehavior) {
      formattedDraft += `## Actual Behavior\n${draft.actualBehavior}\n\n`;
    }

    formattedDraft += `## Acceptance Criteria\n`;
    draft.acceptanceCriteria.forEach((criterion) => {
      formattedDraft += `- [ ] ${criterion}\n`;
    });

    try {
      await navigator.clipboard.writeText(formattedDraft);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
    }
  }, [draft]);

  // If AI is not configured, show a prompt
  if (!aiConfig?.isConfigured) {
    return null;
  }

  const displayTitle = isEditing ? editedTitle : draft?.title;
  const displayDescription = isEditing ? editedDescription : draft?.description;
  const displayAcceptanceCriteria = isEditing ? editedAcceptanceCriteria : draft?.acceptanceCriteria || [];
  const displayReproSteps = isEditing ? editedReproSteps : draft?.reproSteps || [];
  const displayExpectedBehavior = isEditing ? editedExpectedBehavior : draft?.expectedBehavior;
  const displayActualBehavior = isEditing ? editedActualBehavior : draft?.actualBehavior;

  return (
    <div className="rounded border-2 border-retro-lavender bg-retro-lavender/10">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-retro-lavender" />
          <h3 className="text-sm font-medium text-retro-black">Ticket Draft</h3>
          {draft && (
            <span className="rounded bg-retro-lavender/30 px-1.5 py-0.5 text-[10px] font-medium text-retro-lavender">
              Draft Ready
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-stone-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-stone-400" />
        )}
      </button>

      {isExpanded && (
        <div className="border-t border-retro-lavender/30 p-4">
          {/* Error message */}
          {generateError && (
            <div className="mb-4 flex items-center gap-2 rounded border border-retro-red/20 bg-retro-red/10 px-3 py-2 text-sm text-retro-red">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {generateError}
            </div>
          )}

          {/* No draft yet */}
          {!draft && !isGenerating && (
            <div className="text-center">
              <p className="mb-4 text-sm text-stone-500">
                {feedbackType === "bug"
                  ? "AI will generate a structured bug report with reproduction steps, expected vs actual behavior, and acceptance criteria."
                  : "AI will generate a feature request with user story format and clear acceptance criteria."}
              </p>
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="inline-flex items-center gap-2 rounded border-2 border-retro-lavender bg-retro-lavender px-4 py-2 text-sm font-medium text-white shadow-[2px_2px_0px_0px_#9b7cc4] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#9b7cc4] disabled:opacity-50"
              >
                <FileText className="h-4 w-4" />
                Draft Ticket
              </button>
            </div>
          )}

          {/* Generating state */}
          {isGenerating && (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="mb-3 h-8 w-8 animate-spin text-retro-lavender" />
              <p className="text-sm text-stone-500">Generating ticket draft...</p>
              <p className="mt-1 text-xs text-stone-400">This may take a few seconds</p>
            </div>
          )}

          {/* Draft content */}
          {draft && !isGenerating && (
            <div className="space-y-4">
              {/* Title */}
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                    Title
                  </label>
                  {feedbackType === "bug" ? (
                    <Bug className="h-3 w-3 text-retro-red" />
                  ) : (
                    <Lightbulb className="h-3 w-3 text-retro-blue" />
                  )}
                </div>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    className="w-full rounded border-2 border-stone-200 bg-white px-3 py-2 text-sm font-medium outline-none transition-colors focus:border-retro-black"
                  />
                ) : (
                  <h4 className="rounded bg-white p-3 text-sm font-medium text-retro-black">
                    {displayTitle}
                  </h4>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-stone-400">
                  Description
                </label>
                {isEditing ? (
                  <EditableTextArea
                    value={editedDescription}
                    onChange={setEditedDescription}
                    minRows={3}
                  />
                ) : (
                  <p className="whitespace-pre-wrap rounded bg-white p-3 text-sm leading-relaxed text-stone-700">
                    {displayDescription}
                  </p>
                )}
              </div>

              {/* Bug-specific fields */}
              {feedbackType === "bug" && (
                <>
                  {/* Repro Steps */}
                  {(displayReproSteps.length > 0 || isEditing) && (
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-stone-400">
                        Steps to Reproduce
                      </label>
                      {isEditing ? (
                        <EditableList
                          items={editedReproSteps}
                          onChange={setEditedReproSteps}
                          placeholder="Add reproduction step..."
                          numbered
                        />
                      ) : (
                        <ol className="space-y-1 rounded bg-white p-3">
                          {displayReproSteps.map((step, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm text-stone-700">
                              <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded bg-stone-100 text-xs font-medium text-stone-500">
                                {index + 1}
                              </span>
                              {step}
                            </li>
                          ))}
                        </ol>
                      )}
                    </div>
                  )}

                  {/* Expected Behavior */}
                  {(displayExpectedBehavior || isEditing) && (
                    <div>
                      <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-stone-400">
                        Expected Behavior
                      </label>
                      {isEditing ? (
                        <EditableTextArea
                          value={editedExpectedBehavior}
                          onChange={setEditedExpectedBehavior}
                          placeholder="What should happen..."
                        />
                      ) : (
                        <p className="rounded bg-white p-3 text-sm text-stone-700">
                          {displayExpectedBehavior}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Actual Behavior */}
                  {(displayActualBehavior || isEditing) && (
                    <div>
                      <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-stone-400">
                        Actual Behavior
                      </label>
                      {isEditing ? (
                        <EditableTextArea
                          value={editedActualBehavior}
                          onChange={setEditedActualBehavior}
                          placeholder="What actually happens..."
                        />
                      ) : (
                        <p className="rounded bg-white p-3 text-sm text-stone-700">
                          {displayActualBehavior}
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Acceptance Criteria */}
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <ListChecks className="h-3 w-3 text-green-600" />
                  <label className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                    Acceptance Criteria
                  </label>
                </div>
                {isEditing ? (
                  <EditableList
                    items={editedAcceptanceCriteria}
                    onChange={setEditedAcceptanceCriteria}
                    placeholder="Add acceptance criterion..."
                  />
                ) : (
                  <ul className="space-y-1 rounded bg-white p-3">
                    {displayAcceptanceCriteria.map((criterion, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-stone-700">
                        <div className="mt-1 h-4 w-4 flex-shrink-0 rounded border-2 border-stone-300" />
                        {criterion}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-between border-t border-retro-lavender/30 pt-4">
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <>
                      <button
                        onClick={handleSaveEdits}
                        disabled={isSaving}
                        className="flex items-center gap-1.5 rounded border-2 border-green-600 bg-green-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-green-700"
                      >
                        {isSaving ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Save className="h-3 w-3" />
                        )}
                        Save
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="flex items-center gap-1.5 rounded border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-600 transition-colors hover:border-stone-300 hover:bg-stone-50"
                      >
                        <X className="h-3 w-3" />
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={handleStartEdit}
                        className="flex items-center gap-1.5 rounded border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-600 transition-colors hover:border-stone-300 hover:bg-stone-50"
                      >
                        <Edit3 className="h-3 w-3" />
                        Edit
                      </button>
                      <button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="flex items-center gap-1.5 rounded border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-600 transition-colors hover:border-stone-300 hover:bg-stone-50"
                      >
                        {isGenerating ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3 w-3" />
                        )}
                        Regenerate
                      </button>
                      <button
                        onClick={handleDeleteDraft}
                        className="flex items-center gap-1.5 rounded border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-retro-red transition-colors hover:border-retro-red/20 hover:bg-retro-red/10"
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete
                      </button>
                    </>
                  )}
                </div>

                {!isEditing && (
                  <button
                    onClick={handleCopyDraft}
                    className="flex items-center gap-1.5 rounded border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-600 transition-colors hover:border-stone-300 hover:bg-stone-50"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3 w-3 text-green-500" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        Copy Ticket
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Draft metadata */}
              <div className="text-center text-[10px] text-stone-400">
                Generated using {draft.provider === "openai" ? "OpenAI" : "Anthropic"} ({draft.model})
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
