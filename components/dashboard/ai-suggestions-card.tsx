"use client";

import { useState, useCallback } from "react";
import { useQuery, useAction } from "convex/react";
import { Sparkles, MessageCircle, Loader2, AlertCircle } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";

interface AISuggestionsCardProps {
  feedbackId: Id<"feedback">;
  teamId: Id<"teams">;
  feedbackType: "bug" | "feature" | "other";
  onOpenChat: () => void;
}

interface Suggestion {
  title: string;
  description: string;
  priority?: "low" | "medium" | "high";
}

export function AISuggestionsCard({
  feedbackId,
  teamId,
  feedbackType,
  onOpenChat,
}: AISuggestionsCardProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

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
        setGenerateError(result.error || "Failed to generate suggestions");
      }
    } catch (error) {
      setGenerateError(error instanceof Error ? error.message : "Failed to generate suggestions");
    } finally {
      setIsGenerating(false);
    }
  }, [feedbackId, teamId, triggerSolutions]);

  // If AI is not configured
  if (!aiConfig?.provider) {
    return null;
  }

  // If no suggestions yet and not generating
  if (!solutions && !isGenerating) {
    return (
      <div className="rounded border-2 border-stone-200 bg-white p-4">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-purple-500" />
          <h3 className="font-medium text-retro-black">AI Suggestions</h3>
        </div>
        <p className="mb-3 text-sm text-stone-500">
          Get AI-powered insights and solution suggestions for this issue.
        </p>
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="flex w-full items-center justify-center gap-2 rounded border-2 border-retro-black bg-retro-black px-4 py-2 text-sm font-medium text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.25)] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none disabled:opacity-50"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Generate Suggestions
            </>
          )}
        </button>
        {generateError && (
          <div className="mt-2 flex items-start gap-2 text-xs text-red-600">
            <AlertCircle className="mt-0.5 h-3 w-3 flex-shrink-0" />
            <span>{generateError}</span>
          </div>
        )}
      </div>
    );
  }

  // Loading state
  if (isGenerating || !solutions) {
    return (
      <div className="rounded border-2 border-stone-200 bg-white p-4">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-purple-500" />
          <span className="text-sm text-stone-600">Analyzing issue...</span>
        </div>
      </div>
    );
  }

  // Show suggestions
  return (
    <div className="rounded border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-purple-500" />
          <h3 className="font-medium text-retro-black">AI Suggestions</h3>
        </div>
        <button
          onClick={onOpenChat}
          className="flex items-center gap-1.5 rounded border border-purple-300 bg-white px-2 py-1 text-xs font-medium text-purple-700 transition-colors hover:border-purple-400 hover:bg-purple-50"
        >
          <MessageCircle className="h-3 w-3" />
          Discuss
        </button>
      </div>

      {/* Summary */}
      {solutions.summary && (
        <p className="mb-3 text-sm leading-relaxed text-stone-700">{solutions.summary}</p>
      )}

      {/* Top suggestions (show max 3) */}
      {solutions.suggestions && solutions.suggestions.length > 0 && (
        <div className="space-y-2">
          {solutions.suggestions.slice(0, 3).map((suggestion: Suggestion, index: number) => (
            <div
              key={index}
              className="rounded border border-purple-200 bg-white p-2.5 text-sm"
            >
              <div className="mb-1 font-medium text-retro-black">{suggestion.title}</div>
              <div className="text-stone-600">{suggestion.description}</div>
            </div>
          ))}
          {solutions.suggestions.length > 3 && (
            <button
              onClick={onOpenChat}
              className="w-full text-center text-xs text-purple-600 hover:text-purple-700 hover:underline"
            >
              +{solutions.suggestions.length - 3} more suggestions • Open chat to see all
            </button>
          )}
        </div>
      )}

      {/* Regenerate button */}
      <button
        onClick={handleGenerate}
        disabled={isGenerating}
        className={cn(
          "mt-3 w-full rounded border border-purple-300 bg-white px-3 py-1.5 text-xs font-medium text-purple-700 transition-colors hover:border-purple-400 hover:bg-purple-50 disabled:opacity-50",
          isGenerating && "cursor-not-allowed"
        )}
      >
        {isGenerating ? (
          <span className="flex items-center justify-center gap-1.5">
            <Loader2 className="h-3 w-3 animate-spin" />
            Regenerating...
          </span>
        ) : (
          "Regenerate"
        )}
      </button>

      {generateError && (
        <div className="mt-2 flex items-start gap-2 text-xs text-red-600">
          <AlertCircle className="mt-0.5 h-3 w-3 flex-shrink-0" />
          <span>{generateError}</span>
        </div>
      )}
    </div>
  );
}
