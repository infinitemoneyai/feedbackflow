"use client";

import { useState, useEffect } from "react";
import { useAction } from "convex/react";
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
}

export function DraftTicketModal({
  feedbackId,
  teamId,
  isOpen,
  onClose,
  onSuccess,
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

  // Generate ticket draft when modal opens
  useEffect(() => {
    if (isOpen && !ticketDraft) {
      handleGenerate();
    }
  }, [isOpen]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const result = await generateTicketDraft({
        feedbackId,
        teamId,
      });

      if (result.success && result.draft) {
        setTicketDraft(result.draft);
      }
    } catch (error) {
      console.error("Error generating ticket draft:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConfirm = () => {
    // The ticket draft is already saved in the backend
    // Just trigger the success callback to update status
    onSuccess();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-3xl rounded-lg border-2 border-retro-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,0.3)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-retro-black bg-retro-paper p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-retro-black bg-retro-blue/20">
              <Icon name="solar:document-text-linear" className="text-retro-blue" size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-retro-black">Draft Ticket</h2>
              <p className="text-sm text-stone-500">Review and confirm the generated ticket</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded p-2 text-stone-500 transition-colors hover:bg-stone-100 hover:text-retro-red"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[70vh] overflow-y-auto p-6">
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-stone-200 border-t-retro-blue" />
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
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-retro-red/20 bg-retro-red/10">
                <Icon name="solar:danger-circle-linear" className="text-retro-red" size={32} />
              </div>
              <p className="text-sm font-medium text-stone-600">Failed to generate ticket</p>
              <button
                onClick={handleGenerate}
                className="mt-4 rounded border-2 border-retro-black bg-white px-4 py-2 text-sm font-medium transition-colors hover:bg-stone-50"
              >
                Try Again
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {!isGenerating && ticketDraft && (
          <div className="flex items-center justify-end gap-3 border-t-2 border-stone-200 bg-stone-50 p-6">
            <button
              onClick={onClose}
              className="rounded border-2 border-stone-300 bg-white px-6 py-2.5 font-medium transition-colors hover:bg-stone-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="flex items-center gap-2 rounded border-2 border-retro-black bg-retro-black px-6 py-2.5 font-medium text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
            >
              <Icon name="solar:check-circle-linear" size={18} />
              Confirm & Move to Backlog
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
