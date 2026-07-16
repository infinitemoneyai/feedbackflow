/**
 * Display Mode behavior through the widget's public interface
 * (FeedbackFlow.init) and the LauncherVisibility module.
 * CONTEXT.md: Always-Visible (default), Auto-Hide (hover-peek +
 * once-per-session Entrance Reveal), Minimize beats both.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { FeedbackFlow } from "@/widget/src/index";
import { LauncherVisibility } from "@/widget/src/components/LauncherVisibility";
import type { WidgetConfig } from "@/widget/src/types";
import { DEFAULT_CONFIG } from "@/widget/src/types";

const WIDGET_KEY = "wk_launcher_test";
const API_URL = "https://feedbackflow.cc/api/widget/submit";

const fetchMock = vi.fn();

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

function mockConfigFetch(config: Record<string, unknown>) {
  fetchMock.mockResolvedValue({ ok: true, json: async () => ({ config }) });
}

async function initWidget(config: Record<string, unknown>) {
  mockConfigFetch(config);
  await FeedbackFlow.init({ widgetKey: WIDGET_KEY, apiUrl: API_URL });
  const container = document.querySelector(".ff-button-container");
  expect(container).not.toBeNull();
  return container as HTMLElement;
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

describe("Display Mode through the widget public interface", () => {
  it("Always-Visible is the default: no auto-hide class, no reveal", async () => {
    const container = await initWidget({ displayMode: "always-visible" });

    expect(container.classList.contains("ff-auto-hide")).toBe(false);
    expect(container.classList.contains("ff-entrance-reveal")).toBe(false);
  });

  it("Auto-Hide from fetched config adds the mode class and plays the Entrance Reveal", async () => {
    const container = await initWidget({ displayMode: "auto-hide" });

    expect(container.classList.contains("ff-auto-hide")).toBe(true);
    expect(container.classList.contains("ff-entrance-reveal")).toBe(true);
  });

  it("Entrance Reveal plays only once per session", async () => {
    await initWidget({ displayMode: "auto-hide" });
    FeedbackFlow.destroy();
    document.querySelectorAll(".ff-widget-root").forEach((n) => n.remove());

    const container = await initWidget({ displayMode: "auto-hide" });
    expect(container.classList.contains("ff-entrance-reveal")).toBe(false);
  });

  it("hover-peek responds to cursor near the corner only in Auto-Hide", async () => {
    const container = await initWidget({ displayMode: "auto-hide" });

    document.dispatchEvent(
      new MouseEvent("mousemove", {
        clientX: window.innerWidth - 10,
        clientY: window.innerHeight - 10,
      })
    );
    expect(container.classList.contains("ff-hover-peek")).toBe(true);
  });

  it("Minimize hides the launcher, persists, and beats Auto-Hide", async () => {
    const container = await initWidget({ displayMode: "auto-hide" });

    (container.querySelector(".ff-minimize-button") as HTMLElement).click();
    expect(container.classList.contains("ff-minimized")).toBe(true);
    expect(localStorage.getItem("ff-widget-minimized")).toBe("true");

    // Hover-peek must not resurface a minimized launcher
    document.dispatchEvent(
      new MouseEvent("mousemove", {
        clientX: window.innerWidth - 10,
        clientY: window.innerHeight - 10,
      })
    );
    expect(container.classList.contains("ff-hover-peek")).toBe(false);

    // Restore via a corner indicator
    (document.querySelector(".ff-corner-indicator") as HTMLElement).click();
    expect(container.classList.contains("ff-minimized")).toBe(false);
    expect(localStorage.getItem("ff-widget-minimized")).toBe("false");
  });

  it("a previously minimized visitor stays minimized on the next visit", async () => {
    localStorage.setItem("ff-widget-minimized", "true");

    const container = await initWidget({});
    expect(container.classList.contains("ff-minimized")).toBe(true);
  });
});

describe("LauncherVisibility module", () => {
  function buildLauncher(overrides: Partial<WidgetConfig> = {}) {
    const config: WidgetConfig = {
      ...DEFAULT_CONFIG,
      widgetKey: WIDGET_KEY,
      ...overrides,
    };
    const launcher = new LauncherVisibility(
      config,
      () => {},
      () => false
    );
    const elements = launcher.create();
    elements.forEach((el) => document.body.appendChild(el));
    launcher.activate();
    return { launcher, container: elements[0] };
  }

  afterEach(() => {
    document
      .querySelectorAll(".ff-button-container, .ff-corner-indicator")
      .forEach((n) => n.remove());
  });

  it("the Entrance Reveal class clears after the reveal window", () => {
    vi.useFakeTimers();
    const { launcher, container } = buildLauncher({
      displayMode: "auto-hide",
    });

    expect(container.classList.contains("ff-entrance-reveal")).toBe(true);
    vi.advanceTimersByTime(LauncherVisibility.ENTRANCE_REVEAL_MS + 50);
    expect(container.classList.contains("ff-entrance-reveal")).toBe(false);

    launcher.destroy();
    vi.useRealTimers();
  });

  it("mounts even when storage access throws (sandboxed hosts)", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("denied");
      },
      setItem: () => {
        throw new Error("denied");
      },
    });

    const { launcher, container } = buildLauncher();
    expect(container.classList.contains("ff-minimized")).toBe(false);
    expect(() => launcher.minimize()).not.toThrow();
    launcher.destroy();
  });
});
