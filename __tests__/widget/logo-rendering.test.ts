/**
 * Logo rendering through the widget's public interface (FeedbackFlow.init).
 * The Logo from fetched Widget Config replaces the default feedback icon on
 * the Launcher and appears in the modal header; a failed image load falls
 * back to the default icon (Launcher) or disappears (header).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { FeedbackFlow } from "@/widget/src/index";

const WIDGET_KEY = "wk_logo_test";
const API_URL = "https://feedbackflow.cc/api/widget/submit";
const LOGO_URL = "https://cdn.example.com/logo.png";

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

async function initWidget(config: Record<string, unknown>) {
  fetchMock.mockResolvedValue({ ok: true, json: async () => ({ config }) });
  await FeedbackFlow.init({ widgetKey: WIDGET_KEY, apiUrl: API_URL });
  const trigger = document.querySelector(".ff-trigger-button");
  expect(trigger).not.toBeNull();
  return trigger as HTMLElement;
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

describe("Logo on the Launcher", () => {
  it("renders the configured Logo in place of the default icon", async () => {
    const trigger = await initWidget({ logoUrl: LOGO_URL });

    const logo = trigger.querySelector<HTMLImageElement>(".ff-launcher-logo");
    expect(logo).not.toBeNull();
    expect(logo?.getAttribute("src")).toBe(LOGO_URL);
    // The default icon is gone from the trigger (the minimize button keeps its own svg)
    expect(trigger.querySelector(":scope > svg")).toBeNull();
  });

  it("renders the default icon when no Logo is configured", async () => {
    const trigger = await initWidget({});

    expect(trigger.querySelector(".ff-launcher-logo")).toBeNull();
    expect(trigger.querySelector(":scope > svg")).not.toBeNull();
  });

  it("falls back to the default icon when the Logo image fails to load", async () => {
    const trigger = await initWidget({ logoUrl: LOGO_URL });

    const logo = trigger.querySelector<HTMLImageElement>(".ff-launcher-logo");
    logo?.dispatchEvent(new Event("error"));

    expect(trigger.querySelector(".ff-launcher-logo")).toBeNull();
    expect(trigger.querySelector(":scope > svg")).not.toBeNull();
  });
});

describe("Logo in the modal header", () => {
  it("shows the configured Logo beside the title", async () => {
    await initWidget({ logoUrl: LOGO_URL });

    const headerLogo = document.querySelector<HTMLImageElement>(
      ".ff-modal-header .ff-modal-logo"
    );
    expect(headerLogo).not.toBeNull();
    expect(headerLogo?.getAttribute("src")).toBe(LOGO_URL);
  });

  it("shows no Logo when none is configured", async () => {
    await initWidget({});

    expect(document.querySelector(".ff-modal-logo")).toBeNull();
  });

  it("removes itself when the Logo image fails to load", async () => {
    await initWidget({ logoUrl: LOGO_URL });

    const headerLogo = document.querySelector<HTMLImageElement>(".ff-modal-logo");
    headerLogo?.dispatchEvent(new Event("error"));

    expect(document.querySelector(".ff-modal-logo")).toBeNull();
  });
});
