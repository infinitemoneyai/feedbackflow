"use client";

import { useState, useCallback } from "react";
import { useQuery, useAction } from "convex/react";
import {
  Lightbulb,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Loader2,
  Copy,
  Check,
  AlertCircle,
  Zap,
  Search,
  Wrench,
  Target,
  Clock,
  ArrowRight,
  FileText,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";

interface SolutionSuggestionsSectionProps {
  feedbackId: Id<"feedback">;
  teamId: Id<"teams">;
  feedbackType: "bug" | "feature";
  onAddToTicketDraft?: (content: string) => void;
}

type SuggestionType = "investigation" | "fix" | "workaround" | "implementation" | "consideration";
type EffortLevel = "low" | "medium" | "high";
type ImpactLevel = "low" | "medium" | "high";

interface Suggestion {
  title: string;
  description: string;
  type: SuggestionType;
  effort: EffortLevel;
  impact: ImpactLevel;
}

const TYPE_CONFIG: Record<SuggestionType, { label: string; icon: typeof Search; color: string }> = {
  investigation: { label: "Investigation", icon: Search, color: "text-retro-blue bg-retro-blue/10 border-retro-blue/20" },
  fix: { label: "Fix", icon: Wrench, color: "text-green-600 bg-green-100 border-green-200" },
  workaround: { label: "Workaround", icon: ArrowRight, color: "text-retro-peach bg-retro-peach/10 border-retro-peach/20" },
  implementation: { label: "Implementation", icon: Target, color: "text-retro-lavender bg-retro-lavender/10 border-retro-lavender/20" },
  consideration: { label: "Consideration", icon: Lightbulb, color: "text-stone-600 bg-stone-100 border-stone-200" },
};

const EFFORT_CONFIG: Record<EffortLevel, { label: string; color: string }> = {
  low: { label: "Low effort", color: "text-green-600" },
  medium: { label: "Medium effort", color: "text-retro-peach" },
  high: { label: "High effort", color: "text-retro-red" },
};

const IMPACT_CONFIG: Record<ImpactLevel, { label: string; color: string }> = {
  low: { label: "Low impact", color: "text-stone-500" },
  medium: { label: "Medium impact", color: "text-retro-blue" },
  high: { label: "High impact", color: "text-green-600" },
};

function SuggestionCard({
  suggestion,
  index,
  onCopy,
  onAddToDraft,
  copiedIndex,
}: {
  suggestion: Suggestion;
  index: number;
  onCopy: (index: number, text: string) => void;
  onAddToDraft?: (content: string) => void;
  copiedIndex: number | null;
}) {
  const typeConfig = TYPE_CONFIG[suggestion.type];
  const Icon = typeConfig.icon;

  const formatForCopy = () => {
    return `**${suggestion.title}**\n${suggestion.description}\n\nType: ${typeConfig.label}\nEffort: ${EFFORT_CONFIG[suggestion.effort].label}\nImpact: ${IMPACT_CONFIG[suggestion.impact].label}`;
  };

  return (
    <div className="rounded border-2 border-stone-200 bg-white p-3 transition-all hover:border-stone-300">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-medium",
              typeConfig.color
            )}
          >
            <Icon className="h-3 w-3" />
            {typeConfig.label}
          </span>
          <span className="flex items-center gap-1 text-[10px] text-stone-400">
            <Clock className="h-3 w-3" />
            <span className={EFFORT_CONFIG[suggestion.effort].color}>
              {EFFORT_CONFIG[suggestion.effort].label}
            </span>
          </span>
          <span className="flex items-center gap-1 text-[10px] text-stone-400">
            <Zap className="h-3 w-3" />
            <span className={IMPACT_CONFIG[suggestion.impact].color}>
              {IMPACT_CONFIG[suggestion.impact].label}
            </span>
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onCopy(index, formatForCopy())}
            className="rounded p-1 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600"
            title="Copy to clipboard"
          >
            {copiedIndex === index ? (
              <Check className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
          {onAddToDraft && (
            <button
              onClick={() => onAddToDraft(formatForCopy())}
              className="rounded p-1 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600"
              title="Add to ticket draft"
            >
              <FileText className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
      <h4 className="mb-1 text-sm font-medium text-retro-black">{suggestion.title}</h4>
      <p className="text-xs leading-relaxed text-stone-600">{suggestion.description}</p>
    </div>
  );
}

export function SolutionSuggestionsSection({
  feedbackId,
  teamId,
  feedbackType,
  onAddToTicketDraft,
}: SolutionSuggestionsSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Get AI configuration for the team
  const aiConfig = useQuery(api.ai.getTeamAiConfig, { teamId });

  // Get existing solution suggestions
  const solutions = useQuery(api.ai.getSolutionSuggestions, { feedbackId });

  // Action to trigger solution generation
  const triggerSolutions = useAction(api.aiActions.triggerSolutionGeneration);

  // Handle generate button click
  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    setGenerateError(null);

    try {
      const result = await triggerSolutions({ feedbackId, teamId });
      if (!result.success) {
        setGenerateError(result.error || "Failed to generate solutions");
      }
    } catch (error) {
      setGenerateError(error instanceof Error ? error.message : "Failed to generate solutions");
    } finally {
      setIsGenerating(false);
    }
  }, [feedbackId, teamId, triggerSolutions]);

  // Handle copy to clipboard
  const handleCopy = useCallback(async (index: number, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
    }
  }, []);

  // Handle copy all suggestions
  const handleCopyAll = useCallback(async () => {
    if (!solutions?.suggestions) return;

    const allText = solutions.suggestions
      .map((s: Suggestion, i: number) => {
        const typeConfig = TYPE_CONFIG[s.type as SuggestionType];
        return `${i + 1}. **${s.title}**\n${s.description}\n   Type: ${typeConfig.label} | Effort: ${EFFORT_CONFIG[s.effort as EffortLevel].label} | Impact: ${IMPACT_CONFIG[s.impact as ImpactLevel].label}`;
      })
      .join("\n\n");

    const fullText = `## Solution Suggestions\n\n${solutions.summary}\n\n${allText}${
      solutions.nextSteps.length > 0
        ? `\n\n### Next Steps\n${solutions.nextSteps.map((s: string, i: number) => `${i + 1}. ${s}`).join("\n")}`
        : ""
    }`;

    try {
      await navigator.clipboard.writeText(fullText);
      setCopiedIndex(-1);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
    }
  }, [solutions]);

  // If AI is not configured, show a prompt
  if (!aiConfig?.isConfigured) {
    return null;
  }

  return (
    <div className="rounded border-2 border-green-200 bg-green-50/50">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-green-600" />
          <h3 className="text-sm font-medium text-retro-black">Solution Suggestions</h3>
          {solutions && (
            <span className="rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-600">
              {solutions.suggestions.length} suggestions
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
        <div className="border-t border-green-200 p-4">
          {/* Error message */}
          {generateError && (
            <div className="mb-4 flex items-center gap-2 rounded border border-retro-red/20 bg-retro-red/10 px-3 py-2 text-sm text-retro-red">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {generateError}
            </div>
          )}

          {/* No solutions yet */}
          {!solutions && (
            <div className="text-center">
              <p className="mb-4 text-sm text-stone-500">
                {feedbackType === "bug"
                  ? "AI can analyze this bug and suggest investigation steps, potential fixes, and workarounds."
                  : "AI can suggest implementation approaches and considerations for this feature request."}
              </p>
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="inline-flex items-center gap-2 rounded border-2 border-green-600 bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-[2px_2px_0px_0px_#166534] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#166534] disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Lightbulb className="h-4 w-4" />
                    Generate Suggestions
                  </>
                )}
              </button>
            </div>
          )}

          {/* Solution suggestions */}
          {solutions && (
            <div className="space-y-4">
              {/* Summary */}
              {solutions.summary && (
                <div className="rounded bg-white p-3">
                  <h4 className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-stone-400">
                    <Target className="h-3 w-3" />
                    Summary
                  </h4>
                  <p className="text-sm text-stone-700">{solutions.summary}</p>
                </div>
              )}

              {/* Suggestions list */}
              <div className="space-y-2">
                {solutions.suggestions.map((suggestion: Suggestion, index: number) => (
                  <SuggestionCard
                    key={index}
                    suggestion={suggestion}
                    index={index}
                    onCopy={handleCopy}
                    onAddToDraft={onAddToTicketDraft}
                    copiedIndex={copiedIndex}
                  />
                ))}
              </div>

              {/* Next Steps */}
              {solutions.nextSteps && solutions.nextSteps.length > 0 && (
                <div className="rounded bg-white p-3">
                  <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-stone-400">
                    <ArrowRight className="h-3 w-3" />
                    Next Steps
                  </h4>
                  <ol className="space-y-1 text-sm text-stone-600">
                    {solutions.nextSteps.map((step: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-medium text-green-600">
                          {index + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center justify-between pt-2">
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
                  onClick={handleCopyAll}
                  className="flex items-center gap-1.5 rounded border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-600 transition-colors hover:border-stone-300 hover:bg-stone-50"
                >
                  {copiedIndex === -1 ? (
                    <>
                      <Check className="h-3 w-3 text-green-500" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      Copy all
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
