/**
 * Widget init through the public interface (FeedbackFlow.init).
 * Verifies ADR-0001 end to end in the DOM: fetched Widget Config is
 * authoritative; failure degrades to the supplied (data-attribute) config.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { FeedbackFlow } from "@/widget/src/index";

const WIDGET_KEY = "wk_init_test";
const API_URL = "https://feedbackflow.cc/api/widget/submit";

const fetchMock = vi.fn();

// happy-dom 20.x exposes a localStorage global without Storage methods;
// the widget's StateManager needs a working one to mount.
function createStorageStub(): Storage {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
    clear: () => store.clear(),
    key: (index: number) => [...store.keys()][index] ?? null,
    get length() {
      return store.size;
    },
  };
}

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  vi.stubGlobal("localStorage", createStorageStub());
  sessionStorage.clear();
});

afterEach(() => {
  FeedbackFlow.destroy();
  document.getElementById("ff-widget-styles")?.remove();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("FeedbackFlow.init", () => {
  it("mounts the Launcher with fetched config beating the supplied config", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        config: { buttonText: "From Dashboard", position: "top-left" },
      }),
    });

    await FeedbackFlow.init({
      widgetKey: WIDGET_KEY,
      apiUrl: API_URL,
      buttonText: "From Snippet",
    });

    const launcher = document.querySelector(".ff-trigger-button");
    expect(launcher).not.toBeNull();
    expect(launcher?.textContent).toContain("From Dashboard");
    expect(FeedbackFlow.getInstance()).not.toBeNull();
  });

  it("mounts with the supplied config when the fetch fails", async () => {
    fetchMock.mockRejectedValue(new Error("offline"));

    await FeedbackFlow.init({
      widgetKey: WIDGET_KEY,
      apiUrl: API_URL,
      buttonText: "From Snippet",
    });

    const launcher = document.querySelector(".ff-trigger-button");
    expect(launcher).not.toBeNull();
    expect(launcher?.textContent).toContain("From Snippet");
  });

  it("does not mount twice", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ config: {} }),
    });

    await FeedbackFlow.init({ widgetKey: WIDGET_KEY, apiUrl: API_URL });
    await FeedbackFlow.init({ widgetKey: WIDGET_KEY, apiUrl: API_URL });

    expect(document.querySelectorAll(".ff-trigger-button")).toHaveLength(1);
  });
});
