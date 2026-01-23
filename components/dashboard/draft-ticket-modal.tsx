"use client";

import { useState, useEffect } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { X } from "lucide-react";
import { Icon } from "@/components/ui/icon";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

interface DraftTicketModalProps {
  feedbackId: Id<"feedback">;
  teamId: Id<"teams">;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialFeedback?: {
    title: string;
    description?: string;
    type: string;
  };
  solutionNotes?: string;
}

export function DraftTicketModal({
  feedbackId,
  teamId,
  isOpen,
  onClose,
  onSuccess,
  initialFeedback,
  solutionNotes,
}: DraftTicketModalProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [ticketDraft, setTicketDraft] = useState<{
    title: string;
    description: string;
    acceptanceCriteria: string[];
    reproSteps?: string[];
    expectedBehavior?: string;
    actualBehavior?: string;
  } | null>(null);

  const generateTicketDraft = useAction(api.aiActions.generateTicketDraft);
  const saveTicketDraft = useMutation(api.ai.saveTicketDraft);
  
  // Check if AI is configured
  const aiConfig = useQuery(api.ai.getTeamAiConfig, { teamId });

  // Initialize draft from feedback when modal opens
  useEffect(() => {
    if (isOpen && !ticketDraft && initialFeedback) {
      // Build description from issue description and solution notes
      let fullDescription = "";
      
      if (initialFeedback.description) {
        fullDescription = `**Issue:**\n${initialFeedback.description}`;
      }
      
      if (solutionNotes?.trim()) {
        if (fullDescription) {
          fullDescription += "\n\n";
        }
        fullDescription += `**Solution:**\n${solutionNotes.trim()}`;
      }
      
      // Create a basic draft from the feedback data
      setTicketDraft({
        title: initialFeedback.title,
        description: fullDescription || "",
        acceptanceCriteria: ["Complete the implementation"],
        reproSteps: initialFeedback.type === "bug" ? ["Steps to reproduce"] : undefined,
        expectedBehavior: initialFeedback.type === "bug" ? "Expected behavior" : undefined,
        actualBehavior: initialFeedback.type === "bug" ? "Actual behavior" : undefined,
      });
    }
  }, [isOpen, initialFeedback, solutionNotes]);

  const handleEnhanceWithAI = async () => {
    if (!ticketDraft) return;
    
    setIsGenerating(true);
    try {
      const result = await generateTicketDraft({
        feedbackId,
        teamId,
        currentDraft: {
          title: ticketDraft.title,
          description: ticketDraft.description,
          acceptanceCriteria: ticketDraft.acceptanceCriteria,
          reproSteps: ticketDraft.reproSteps,
          expectedBehavior: ticketDraft.expectedBehavior,
          actualBehavior: ticketDraft.actualBehavior,
        },
      });

      if (result.success && result.draft) {
        const draft = result.draft as {
          title: string;
          description: string;
          acceptanceCriteria: string[];
          reproSteps?: string[];
          expectedBehavior?: string;
          actualBehavior?: string;
        };
        setTicketDraft({
          title: draft.title,
          description: draft.description,
          acceptanceCriteria: draft.acceptanceCriteria,
          reproSteps: draft.reproSteps,
          expectedBehavior: draft.expectedBehavior,
          actualBehavior: draft.actualBehavior,
        });
      }
    } catch (error) {
      console.error("Error generating ticket draft:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConfirm = async () => {
    if (!ticketDraft) return;

    await saveTicketDraft({
      feedbackId,
      title: ticketDraft.title,
      description: ticketDraft.description,
      acceptanceCriteria: ticketDraft.acceptanceCriteria,
      reproSteps: ticketDraft.reproSteps,
      expectedBehavior: ticketDraft.expectedBehavior,
      actualBehavior: ticketDraft.actualBehavior,
    });

    // Trigger the success callback to update status in the UI
    onSuccess();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-retro-black/20 p-4">
      <div className="relative w-full max-w-3xl rounded border-2 border-retro-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,0.25)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-retro-black px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="font-mono text-xs font-bold uppercase tracking-wider text-stone-700">
              Draft Ticket
            </div>
            {aiConfig?.isConfigured ? (
              <button
                onClick={handleEnhanceWithAI}
                disabled={isGenerating}
                className="flex items-center gap-1.5 rounded border border-retro-blue bg-retro-blue/10 px-2 py-1 text-xs font-medium text-retro-blue transition-colors hover:bg-retro-blue/20 disabled:cursor-not-allowed disabled:opacity-50"
                title="Use AI to enhance this ticket draft"
              >
                <Icon name="solar:magic-stick-3-linear" size={14} />
                {isGenerating ? "Enhancing..." : "Enhance with AI"}
              </button>
            ) : (
              <button
                disabled
                className="flex items-center gap-1.5 rounded border border-stone-300 bg-stone-100 px-2 py-1 text-xs font-medium text-stone-400 cursor-not-allowed"
                title="Configure AI in settings to use this feature"
              >
                <Icon name="solar:magic-stick-3-linear" size={14} />
                Enhance with AI
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-stone-500 transition-colors hover:bg-stone-100 hover:text-retro-black"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[70vh] overflow-y-auto p-6">
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-stone-200 border-t-retro-black" />
              <p className="text-sm font-medium text-stone-600">Generating ticket draft...</p>
              <p className="mt-2 text-xs text-stone-500">AI is analyzing the feedback and creating a structured ticket</p>
            </div>
          ) : ticketDraft ? (
            <div className="space-y-6">
              {/* Title */}
              <div>
                <label className="mb-2 block font-mono text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  Title
                </label>
                <input
                  type="text"
                  value={ticketDraft.title}
                  onChange={(e) => setTicketDraft({ ...ticketDraft, title: e.target.value })}
                  className="w-full rounded border-2 border-stone-200 bg-stone-50 p-3 text-lg font-semibold outline-none transition-colors focus:border-retro-blue"
                />
              </div>

              {/* Description */}
              <div>
                <label className="mb-2 block font-mono text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  Description
                </label>
                <textarea
                  value={ticketDraft.description}
                  onChange={(e) => setTicketDraft({ ...ticketDraft, description: e.target.value })}
                  rows={4}
                  className="w-full resize-none rounded border-2 border-stone-200 bg-stone-50 p-3 text-sm outline-none transition-colors focus:border-retro-blue"
                />
              </div>

              {/* Acceptance Criteria */}
              <div>
                <label className="mb-2 block font-mono text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  Acceptance Criteria
                </label>
                <div className="space-y-2 rounded border-2 border-stone-200 bg-stone-50 p-4">
                  {ticketDraft.acceptanceCriteria.map((criterion, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <Icon name="solar:check-circle-linear" className="mt-0.5 flex-shrink-0 text-green-600" size={16} />
                      <input
                        type="text"
                        value={criterion}
                        onChange={(e) => {
                          const newCriteria = [...ticketDraft.acceptanceCriteria];
                          newCriteria[idx] = e.target.value;
                          setTicketDraft({ ...ticketDraft, acceptanceCriteria: newCriteria });
                        }}
                        className="flex-1 border-none bg-transparent text-sm outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Repro Steps (if available) */}
              {ticketDraft.reproSteps && ticketDraft.reproSteps.length > 0 && (
                <div>
                  <label className="mb-2 block font-mono text-[10px] font-bold uppercase tracking-wider text-stone-400">
                    Reproduction Steps
                  </label>
                  <div className="space-y-2 rounded border-2 border-stone-200 bg-stone-50 p-4">
                    {ticketDraft.reproSteps.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-retro-blue text-xs font-bold text-white">
                          {idx + 1}
                        </span>
                        <span className="flex-1 text-sm text-stone-700">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Expected vs Actual Behavior */}
              {(ticketDraft.expectedBehavior || ticketDraft.actualBehavior) && (
                <div className="grid grid-cols-2 gap-4">
                  {ticketDraft.expectedBehavior && (
                    <div>
                      <label className="mb-2 block font-mono text-[10px] font-bold uppercase tracking-wider text-stone-400">
                        Expected Behavior
                      </label>
                      <div className="rounded border-2 border-green-200 bg-green-50 p-3 text-sm text-stone-700">
                        {ticketDraft.expectedBehavior}
                      </div>
                    </div>
                  )}
                  {ticketDraft.actualBehavior && (
                    <div>
                      <label className="mb-2 block font-mono text-[10px] font-bold uppercase tracking-wider text-stone-400">
                        Actual Behavior
                      </label>
                      <div className="rounded border-2 border-retro-red/20 bg-retro-red/10 p-3 text-sm text-stone-700">
                        {ticketDraft.actualBehavior}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        {!isGenerating && ticketDraft && (
          <div className="flex items-center justify-end gap-2 border-t-2 border-retro-black bg-stone-50 p-4">
            <button
              onClick={onClose}
              className="rounded border-2 border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 transition-colors hover:bg-stone-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="flex items-center gap-2 rounded border-2 border-retro-black bg-retro-black px-3 py-1.5 text-xs font-medium text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)] transition-transform hover:translate-x-[1px] hover:translate-y-[1px]"
            >
              <Icon name="solar:check-circle-linear" size={14} />
              Confirm & Move to Backlog
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
