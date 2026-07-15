/**
 * Tests for the widget's Widget Config loader (ADR-0001).
 * Precedence: fetched (authoritative) → sessionStorage cache →
 * data attributes → defaults, with a bounded fetch timeout.
 * @see widget/src/config-loader.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  loadWidgetConfig,
  resolveConfigEndpoint,
} from "@/widget/src/config-loader";
import { DEFAULT_CONFIG } from "@/widget/src/types";

const WIDGET_KEY = "wk_test";
const API_URL = "https://feedbackflow.cc/api/widget/submit";
const CACHE_KEY = `ff-widget-config:${WIDGET_KEY}`;

const fetchMock = vi.fn();

function fetchedConfigResponse(config: Record<string, unknown>) {
  return {
    ok: true,
    json: async () => ({ config }),
  };
}

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  sessionStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("resolveConfigEndpoint", () => {
  it("derives the config endpoint from the submit API URL's origin", () => {
    expect(resolveConfigEndpoint(API_URL)).toBe(
      "https://feedbackflow.cc/api/widget/config"
    );
  });

  it("returns null when there is no API URL to derive from", () => {
    expect(resolveConfigEndpoint(undefined)).toBeNull();
    expect(resolveConfigEndpoint("")).toBeNull();
    expect(resolveConfigEndpoint("not a url")).toBeNull();
  });
});

describe("loadWidgetConfig", () => {
  it("fetched config is authoritative over data attributes", async () => {
    fetchMock.mockResolvedValue(
      fetchedConfigResponse({
        position: "top-left",
        buttonText: "From Dashboard",
        displayMode: "auto-hide",
      })
    );

    const config = await loadWidgetConfig({
      widgetKey: WIDGET_KEY,
      dataAttrConfig: {
        apiUrl: API_URL,
        position: "bottom-right",
        buttonText: "From Snippet",
      },
    });

    expect(config.position).toBe("top-left");
    expect(config.buttonText).toBe("From Dashboard");
    expect(config.displayMode).toBe("auto-hide");
    expect(fetchMock).toHaveBeenCalledWith(
      `https://feedbackflow.cc/api/widget/config?key=${WIDGET_KEY}`
    );
  });

  it("fields absent from fetched config fall back to data attributes, then defaults", async () => {
    fetchMock.mockResolvedValue(
      fetchedConfigResponse({ position: "top-right" })
    );

    const config = await loadWidgetConfig({
      widgetKey: WIDGET_KEY,
      dataAttrConfig: { apiUrl: API_URL, buttonText: "From Snippet" },
    });

    expect(config.position).toBe("top-right");
    expect(config.buttonText).toBe("From Snippet");
    expect(config.primaryColor).toBe(DEFAULT_CONFIG.primaryColor);
  });

  it("falls back to data attributes when the fetch times out", async () => {
    fetchMock.mockReturnValue(new Promise(() => {})); // never resolves

    const config = await loadWidgetConfig({
      widgetKey: WIDGET_KEY,
      dataAttrConfig: { apiUrl: API_URL, buttonText: "From Snippet" },
      timeoutMs: 20,
    });

    expect(config.buttonText).toBe("From Snippet");
    expect(config.position).toBe(DEFAULT_CONFIG.position);
  });

  it("falls back when the fetch rejects (network failure)", async () => {
    fetchMock.mockRejectedValue(new Error("offline"));

    const config = await loadWidgetConfig({
      widgetKey: WIDGET_KEY,
      dataAttrConfig: { apiUrl: API_URL, buttonText: "From Snippet" },
    });

    expect(config.buttonText).toBe("From Snippet");
  });

  it("falls back when the endpoint responds non-OK", async () => {
    fetchMock.mockResolvedValue({ ok: false, json: async () => ({}) });

    const config = await loadWidgetConfig({
      widgetKey: WIDGET_KEY,
      dataAttrConfig: { apiUrl: API_URL, position: "bottom-left" },
    });

    expect(config.position).toBe("bottom-left");
  });

  it("skips fetching entirely when no API URL is configured", async () => {
    const config = await loadWidgetConfig({
      widgetKey: WIDGET_KEY,
      dataAttrConfig: { buttonText: "From Snippet" },
    });

    expect(config.buttonText).toBe("From Snippet");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("caches fetched config in sessionStorage", async () => {
    fetchMock.mockResolvedValue(
      fetchedConfigResponse({ position: "top-left" })
    );

    await loadWidgetConfig({
      widgetKey: WIDGET_KEY,
      dataAttrConfig: { apiUrl: API_URL },
    });

    const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY) ?? "{}");
    expect(cached.position).toBe("top-left");
  });

  it("renders instantly from cache on subsequent loads and refreshes in the background", async () => {
    sessionStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ buttonText: "From Cache" })
    );
    let resolveFetch: (value: unknown) => void = () => {};
    fetchMock.mockReturnValue(
      new Promise((resolve) => {
        resolveFetch = resolve;
      })
    );

    const config = await loadWidgetConfig({
      widgetKey: WIDGET_KEY,
      dataAttrConfig: { apiUrl: API_URL },
    });

    // Cache answered without waiting on the in-flight fetch
    expect(config.buttonText).toBe("From Cache");
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Background refresh updates the cache for the next page view
    resolveFetch(fetchedConfigResponse({ buttonText: "Fresh" }));
    await vi.waitFor(() => {
      const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY) ?? "{}");
      expect(cached.buttonText).toBe("Fresh");
    });
  });
});
