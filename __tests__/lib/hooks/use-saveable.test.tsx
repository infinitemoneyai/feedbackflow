/**
 * Tests for the save-lifecycle module at its interface.
 * @see lib/hooks/use-saveable.ts
 */

import { describe, it, expect, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useSaveable } from "@/lib/hooks/use-saveable";

describe("useSaveable", () => {
  it("walks idle → saving → success and auto-resets", async () => {
    let resolveSave: (value: unknown) => void = () => {};
    const performSave = vi.fn(
      () => new Promise((resolve) => (resolveSave = resolve))
    );
    const { result } = renderHook(() =>
      useSaveable(performSave, { successResetMs: 20 })
    );

    expect(result.current.status).toBe("idle");

    let savePromise: Promise<boolean>;
    act(() => {
      savePromise = result.current.save(undefined);
    });
    expect(result.current.isSaving).toBe(true);

    await act(async () => {
      resolveSave(null);
      await savePromise;
    });
    expect(result.current.saveSuccess).toBe(true);
    expect(result.current.error).toBeNull();

    await waitFor(() => expect(result.current.status).toBe("idle"));
  });

  it("surfaces the error message on failure and clears it", async () => {
    const performSave = vi.fn(async () => {
      throw new Error("Only admins can update team settings");
    });
    const { result } = renderHook(() => useSaveable(performSave));

    let saved = true;
    await act(async () => {
      saved = await result.current.save(undefined);
    });

    expect(saved).toBe(false);
    expect(result.current.status).toBe("error");
    expect(result.current.error).toBe("Only admins can update team settings");

    act(() => result.current.clearError());
    expect(result.current.error).toBeNull();
    expect(result.current.status).toBe("idle");
  });

  it("passes args through to the save function", async () => {
    const performSave = vi.fn(async (_args: { name: string }) => null);
    const { result } = renderHook(() =>
      useSaveable<{ name: string }>(performSave)
    );

    await act(async () => {
      await result.current.save({ name: "Team" });
    });

    expect(performSave).toHaveBeenCalledWith({ name: "Team" });
  });
});
