"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import {
  Wand2,
  Check,
  Loader2,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Tag,
  AlertCircle,
  RefreshCw,
  Bug,
  Zap,
  Target,
  Wrench,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";

interface AIAnalysisSectionProps {
  feedbackId: Id<"feedback">;
  teamId: Id<"teams">;
  currentType: "bug" | "feature";
  currentPriority: "low" | "medium" | "high" | "critical";
  currentTags: string[];
}

type FeedbackType = "bug" | "feature";
type FeedbackPriority = "low" | "medium" | "high" | "critical";

const TYPE_LABELS: Record<FeedbackType, { label: string; color: string; icon: typeof Bug }> = {
  bug: { label: "Bug", color: "text-retro-red bg-retro-red/10 border-retro-red/20", icon: Bug },
  feature: { label: "Feature", color: "text-retro-blue bg-retro-blue/10 border-retro-blue/20", icon: Lightbulb },
};

const PRIORITY_LABELS: Record<FeedbackPriority, { label: string; color: string }> = {
  critical: { label: "Critical", color: "text-retro-red bg-retro-red/10 border-retro-red" },
  high: { label: "High", color: "text-retro-red bg-retro-red/10 border-retro-red/30" },
  medium: { label: "Medium", color: "text-retro-peach bg-retro-peach/10 border-retro-peach/30" },
  low: { label: "Low", color: "text-stone-500 bg-stone-100 border-stone-200" },
};

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const percent = Math.round(confidence * 100);
  let color = "text-stone-500 bg-stone-100";

  if (percent >= 80) {
    color = "text-green-600 bg-green-100";
  } else if (percent >= 60) {
    color = "text-yellow-600 bg-yellow-100";
  }

  return (
    <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-medium", color)}>
      {percent}% confidence
    </span>
  );
}

export function AIAnalysisSection({
  feedbackId,
  teamId,
  currentType,
  currentPriority,
  currentTags,
}: AIAnalysisSectionProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isApplying, setIsApplying] = useState(false);

  // Get AI configuration for the team
  const aiConfig = useQuery(api.ai.getTeamAiConfig, { teamId });

  // Get existing analysis for this feedback
  const analysis = useQuery(api.ai.getAnalysis, { feedbackId });

  // Mutation to apply suggestions
  const applySuggestions = useMutation(api.ai.applyAnalysisSuggestions);

  // Handle analyze button click
  const handleAnalyze = useCallback(async () => {
    setIsAnalyzing(true);
    setAnalyzeError(null);

    try {
      const response = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          feedbackId,
          teamId,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setAnalyzeError(result.error || "Failed to analyze feedback");
      }
    } catch (error) {
      setAnalyzeError(error instanceof Error ? error.message : "Failed to analyze feedback");
    } finally {
      setIsAnalyzing(false);
    }
  }, [feedbackId, teamId]);

  // Handle applying individual suggestions
  const handleApplyType = useCallback(async () => {
    setIsApplying(true);
    try {
      await applySuggestions({ feedbackId, applyType: true });
    } catch (error) {
      console.error("Failed to apply type suggestion:", error);
    }
    setIsApplying(false);
  }, [feedbackId, applySuggestions]);

  const handleApplyPriority = useCallback(async () => {
    setIsApplying(true);
    try {
      await applySuggestions({ feedbackId, applyPriority: true });
    } catch (error) {
      console.error("Failed to apply priority suggestion:", error);
    }
    setIsApplying(false);
  }, [feedbackId, applySuggestions]);

  const handleApplyTags = useCallback(async () => {
    setIsApplying(true);
    try {
      await applySuggestions({ feedbackId, applyTags: true });
    } catch (error) {
      console.error("Failed to apply tags suggestion:", error);
    }
    setIsApplying(false);
  }, [feedbackId, applySuggestions]);

  const handleApplyAll = useCallback(async () => {
    setIsApplying(true);
    try {
      await applySuggestions({
        feedbackId,
        applyType: true,
        applyPriority: true,
        applyTags: true,
      });
    } catch (error) {
      console.error("Failed to apply all suggestions:", error);
    }
    setIsApplying(false);
  }, [feedbackId, applySuggestions]);

  // Check if AI is configured
  if (!aiConfig?.isConfigured) {
    return (
      <div className="rounded border-2 border-dashed border-stone-300 bg-stone-50 p-4">
        <div className="flex items-center gap-2 text-stone-500">
          <Wand2 className="h-4 w-4" />
          <span className="text-sm font-medium">AI Features</span>
        </div>
        <p className="mt-2 text-sm text-stone-500">
          Configure an AI provider in settings to enable auto-categorization and smart suggestions.
        </p>
      </div>
    );
  }

  // Determine if there are suggestions that differ from current values
  const hasTypeSuggestion = analysis?.suggestedType && analysis.suggestedType !== currentType;
  const hasPrioritySuggestion =
    analysis?.suggestedPriority && analysis.suggestedPriority !== currentPriority;
  const hasTagSuggestions =
    analysis?.suggestedTags &&
    analysis.suggestedTags.filter((t: string) => !currentTags.includes(t)).length > 0;
  const hasAnySuggestion = hasTypeSuggestion || hasPrioritySuggestion || hasTagSuggestions;

  return (
    <div className="rounded border-2 border-retro-lavender bg-retro-lavender/10">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-2">
          <Wand2 className="h-4 w-4 text-retro-lavender" />
          <h3 className="text-sm font-medium text-retro-black">AI Analysis</h3>
          {analysis && (
            <span className="rounded bg-retro-lavender/30 px-1.5 py-0.5 text-[10px] font-medium text-retro-lavender">
              Analyzed
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
          {analyzeError && (
            <div className="mb-4 flex items-center gap-2 rounded border border-retro-red/20 bg-retro-red/10 px-3 py-2 text-sm text-retro-red">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {analyzeError}
            </div>
          )}

          {/* No analysis yet */}
          {!analysis && (
            <div className="text-center">
              <p className="mb-4 text-sm text-stone-500">
                AI can analyze this feedback to suggest type, priority, and tags.
              </p>
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="inline-flex items-center gap-2 rounded border-2 border-retro-black bg-retro-black px-4 py-2 text-sm font-medium text-white shadow-[2px_2px_0px_0px_#888] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#888] disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4" />
                    Auto-categorize
                  </>
                )}
              </button>
            </div>
          )}

          {/* Analysis results */}
          {analysis && (
            <div className="space-y-4">
              {/* Summary */}
              {analysis.summary && (
                <div className="rounded bg-white p-3">
                  <h4 className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-stone-400">
                    <Target className="h-3 w-3" />
                    Summary
                  </h4>
                  <p className="text-sm text-stone-700">{analysis.summary}</p>
                </div>
              )}

              {/* Suggestions */}
              <div className="space-y-3">
                {/* Type suggestion */}
                <div className="flex items-center justify-between rounded bg-white p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-stone-400">Type:</span>
                    {analysis.suggestedType && (
                      <>
                        <span
                          className={cn(
                            "flex items-center gap-1 rounded border px-1.5 py-0.5 text-xs font-medium",
                            TYPE_LABELS[analysis.suggestedType as FeedbackType].color
                          )}
                        >
                          {(() => {
                            const Icon = TYPE_LABELS[analysis.suggestedType as FeedbackType].icon;
                            return <Icon className="h-3 w-3" />;
                          })()}
                          {TYPE_LABELS[analysis.suggestedType as FeedbackType].label}
                        </span>
                        <ConfidenceBadge confidence={analysis.typeConfidence ?? 0} />
                      </>
                    )}
                  </div>
                  {hasTypeSuggestion && (
                    <button
                      onClick={handleApplyType}
                      disabled={isApplying}
                      className="flex items-center gap-1 rounded border border-green-200 bg-green-50 px-2 py-1 text-xs font-medium text-green-600 transition-colors hover:bg-green-100"
                    >
                      <Check className="h-3 w-3" />
                      Apply
                    </button>
                  )}
                  {!hasTypeSuggestion && analysis.suggestedType && (
                    <span className="text-xs text-stone-400">Current</span>
                  )}
                </div>

                {/* Priority suggestion */}
                <div className="flex items-center justify-between rounded bg-white p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-stone-400">Priority:</span>
                    {analysis.suggestedPriority && (
                      <>
                        <span
                          className={cn(
                            "rounded border px-1.5 py-0.5 text-xs font-medium",
                            PRIORITY_LABELS[analysis.suggestedPriority as FeedbackPriority].color
                          )}
                        >
                          {PRIORITY_LABELS[analysis.suggestedPriority as FeedbackPriority].label}
                        </span>
                        <ConfidenceBadge confidence={analysis.priorityConfidence ?? 0} />
                      </>
                    )}
                  </div>
                  {hasPrioritySuggestion && (
                    <button
                      onClick={handleApplyPriority}
                      disabled={isApplying}
                      className="flex items-center gap-1 rounded border border-green-200 bg-green-50 px-2 py-1 text-xs font-medium text-green-600 transition-colors hover:bg-green-100"
                    >
                      <Check className="h-3 w-3" />
                      Apply
                    </button>
                  )}
                  {!hasPrioritySuggestion && analysis.suggestedPriority && (
                    <span className="text-xs text-stone-400">Current</span>
                  )}
                </div>

                {/* Tags suggestion */}
                {analysis.suggestedTags && analysis.suggestedTags.length > 0 && (
                  <div className="rounded bg-white p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Tag className="h-3 w-3 text-stone-400" />
                        <span className="text-xs font-medium text-stone-400">Suggested Tags:</span>
                      </div>
                      {hasTagSuggestions && (
                        <button
                          onClick={handleApplyTags}
                          disabled={isApplying}
                          className="flex items-center gap-1 rounded border border-green-200 bg-green-50 px-2 py-1 text-xs font-medium text-green-600 transition-colors hover:bg-green-100"
                        >
                          <Check className="h-3 w-3" />
                          Add all
                        </button>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {analysis.suggestedTags.map((tag: string, idx: number) => {
                        const isAlreadyApplied = currentTags.includes(tag);
                        return (
                          <span
                            key={idx}
                            className={cn(
                              "rounded border px-2 py-0.5 text-xs font-medium",
                              isAlreadyApplied
                                ? "border-stone-200 bg-stone-100 text-stone-400"
                                : "border-retro-lavender/30 bg-retro-lavender/10 text-retro-lavender"
                            )}
                          >
                            {tag}
                            {isAlreadyApplied && " ✓"}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Affected component */}
                {analysis.affectedComponent && (
                  <div className="rounded bg-white p-3">
                    <h4 className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-stone-400">
                      <Zap className="h-3 w-3" />
                      Affected Component
                    </h4>
                    <span className="rounded border border-stone-200 bg-stone-50 px-2 py-0.5 font-mono text-xs text-stone-600">
                      {analysis.affectedComponent}
                    </span>
                  </div>
                )}

                {/* Potential causes (for bugs) */}
                {analysis.potentialCauses && analysis.potentialCauses.length > 0 && (
                  <div className="rounded bg-white p-3">
                    <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-stone-400">
                      <AlertCircle className="h-3 w-3" />
                      Potential Causes
                    </h4>
                    <ul className="space-y-1 text-sm text-stone-600">
                      {analysis.potentialCauses.map((cause: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-stone-400">•</span>
                          {cause}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Suggested solutions */}
                {analysis.suggestedSolutions && analysis.suggestedSolutions.length > 0 && (
                  <div className="rounded bg-white p-3">
                    <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-stone-400">
                      <Wrench className="h-3 w-3" />
                      Suggested Solutions
                    </h4>
                    <ul className="space-y-1 text-sm text-stone-600">
                      {analysis.suggestedSolutions.map((solution: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-green-500">✓</span>
                          {solution}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="flex items-center gap-1.5 rounded border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-600 transition-colors hover:border-stone-300 hover:bg-stone-50"
                >
                  {isAnalyzing ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3 w-3" />
                  )}
                  Re-analyze
                </button>

                {hasAnySuggestion && (
                  <button
                    onClick={handleApplyAll}
                    disabled={isApplying}
                    className="flex items-center gap-1.5 rounded border-2 border-retro-black bg-retro-black px-3 py-1.5 text-xs font-medium text-white transition-all hover:bg-stone-800"
                  >
                    {isApplying ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Check className="h-3 w-3" />
                    )}
                    Apply all suggestions
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
