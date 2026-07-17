/**
 * Tests for the shared embed-snippet templates.
 * ADR-0001: snippets carry only the widget key and API URL — appearance
 * settings live in the dashboard and are fetched at load, never baked in.
 * @see lib/widget-snippet.ts
 */

import { describe, it, expect } from "vitest";
import {
  buildAgentInstallPrompt,
  buildHtmlSnippet,
  buildNextjsSnippet,
  buildReactSnippet,
} from "@/lib/widget-snippet";

const INPUT = {
  widgetKey: "wk_abc123",
  widgetUrl: "https://feedbackflow.cc/widget.js",
  apiUrl: "https://feedbackflow.cc/api/widget/submit",
};

const ALL_BUILDERS = [
  buildHtmlSnippet,
  buildNextjsSnippet,
  buildReactSnippet,
  buildAgentInstallPrompt,
];

describe("widget embed snippets", () => {
  it("html snippet carries the key, api url, and script src", () => {
    const snippet = buildHtmlSnippet(INPUT);

    expect(snippet).toContain('data-widget-key="wk_abc123"');
    expect(snippet).toContain('data-api-url="https://feedbackflow.cc/api/widget/submit"');
    expect(snippet).toContain('src="https://feedbackflow.cc/widget.js"');
  });

  it("nextjs snippet uses next/script with the same attributes", () => {
    const snippet = buildNextjsSnippet(INPUT);

    expect(snippet).toContain("import Script from 'next/script'");
    expect(snippet).toContain('data-widget-key="wk_abc123"');
    expect(snippet).toContain('data-api-url="https://feedbackflow.cc/api/widget/submit"');
  });

  it("react snippet sets dataset keys imperatively", () => {
    const snippet = buildReactSnippet(INPUT);

    expect(snippet).toContain("script.dataset.widgetKey = 'wk_abc123'");
    expect(snippet).toContain("script.dataset.apiUrl = 'https://feedbackflow.cc/api/widget/submit'");
  });

  it("agent install prompt embeds the exact html snippet with real values", () => {
    const prompt = buildAgentInstallPrompt(INPUT);

    expect(prompt).toContain(buildHtmlSnippet(INPUT));
    expect(prompt).not.toMatch(/YOUR_WIDGET_KEY|<widget-key>|placeholder/i);
  });

  it("agent install prompt covers framework detection, the guardrail, and a verify-only ending", () => {
    const prompt = buildAgentInstallPrompt(INPUT);

    expect(prompt).toMatch(/detect the framework/i);
    expect(prompt).toMatch(/do not add any other data-\* attributes/i);
    expect(prompt).toMatch(/confirm a floating feedback button/i);
    // Verify-only: the agent must never submit feedback itself
    expect(prompt).not.toMatch(/curl|POST|fetch\(/);
  });

  it("no snippet bakes appearance settings (ADR-0001)", () => {
    for (const build of ALL_BUILDERS) {
      const snippet = build(INPUT);
      expect(snippet).not.toMatch(/data-position|dataset\.position/);
      expect(snippet).not.toMatch(/data-primary-color|dataset\.primaryColor/);
      expect(snippet).not.toMatch(/data-button-text|dataset\.buttonText/);
      expect(snippet).not.toMatch(/data-background-color|data-text-color/);
    }
  });
});
