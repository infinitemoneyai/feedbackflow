"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type SaveStatus = "idle" | "saving" | "success" | "error";

export interface UseSaveableResult<TArgs> {
  /** Run the save; resolves true on success, false on failure. */
  save: (args: TArgs) => Promise<boolean>;
  status: SaveStatus;
  isSaving: boolean;
  saveSuccess: boolean;
  error: string | null;
  clearError: () => void;
}

const SUCCESS_RESET_MS = 3000;

/**
 * The save lifecycle for settings forms — saving → success (auto-resetting
 * after a beat) or error — behind one interface. Replaces the hand-rolled
 * { isSaving, saveSuccess, error } + try/catch/setTimeout triple.
 */
export function useSaveable<TArgs = void>(
  performSave: (args: TArgs) => Promise<unknown>,
  options: { successResetMs?: number } = {}
): UseSaveableResult<TArgs> {
  const { successResetMs = SUCCESS_RESET_MS } = options;
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (resetTimer.current) {
        clearTimeout(resetTimer.current);
      }
    };
  }, []);

  const save = useCallback(
    async (args: TArgs): Promise<boolean> => {
      if (resetTimer.current) {
        clearTimeout(resetTimer.current);
      }
      setStatus("saving");
      setError(null);
      try {
        await performSave(args);
        if (!mounted.current) return true;
        setStatus("success");
        resetTimer.current = setTimeout(() => {
          if (mounted.current) {
            setStatus("idle");
          }
        }, successResetMs);
        return true;
      } catch (saveError) {
        if (!mounted.current) return false;
        setStatus("error");
        setError(
          saveError instanceof Error ? saveError.message : "Failed to save"
        );
        return false;
      }
    },
    [performSave, successResetMs]
  );

  const clearError = useCallback(() => {
    setError(null);
    setStatus((current) => (current === "error" ? "idle" : current));
  }, []);

  return {
    save,
    status,
    isSaving: status === "saving",
    saveSuccess: status === "success",
    error,
    clearError,
  };
}
