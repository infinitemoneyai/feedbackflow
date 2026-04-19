"use client";

import { useEffect, useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { OPENAI_MODELS, ANTHROPIC_MODELS, type AiModel } from "@/lib/ai-models";

export function useAvailableModels(
  teamId: Id<"teams"> | undefined,
  provider: "openai" | "anthropic",
  enabled: boolean
): AiModel[] {
  const fallback = provider === "openai" ? OPENAI_MODELS : ANTHROPIC_MODELS;
  const listModels = useAction(api.aiActions.listAvailableModels);
  const [models, setModels] = useState<AiModel[]>(fallback);

  useEffect(() => {
    if (!teamId || !enabled) return;
    let cancelled = false;
    listModels({ teamId, provider })
      .then((result) => {
        if (cancelled) return;
        if (result.success && result.models.length > 0) {
          setModels(result.models);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [teamId, provider, enabled, listModels]);

  return models;
}
