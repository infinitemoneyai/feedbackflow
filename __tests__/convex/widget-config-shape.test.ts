import { describe, it, expect } from "vitest";
import {
  DEFAULT_WIDGET_CONFIG,
  WIDGET_POSITIONS,
  WIDGET_DISPLAY_MODES,
} from "@/convex/widgetConfigShape";
import { DEFAULT_CONFIG as WIDGET_RUNTIME_DEFAULTS } from "@/widget/src/types";

describe("canonical Widget Config shape", () => {
  it("uses the widget runtime's defaults as canonical values", () => {
    expect(DEFAULT_WIDGET_CONFIG.position).toBe(WIDGET_RUNTIME_DEFAULTS.position);
    expect(DEFAULT_WIDGET_CONFIG.buttonText).toBe(WIDGET_RUNTIME_DEFAULTS.buttonText);
    expect(DEFAULT_WIDGET_CONFIG.primaryColor).toBe(WIDGET_RUNTIME_DEFAULTS.primaryColor);
    expect(DEFAULT_WIDGET_CONFIG.backgroundColor).toBe(WIDGET_RUNTIME_DEFAULTS.backgroundColor);
    expect(DEFAULT_WIDGET_CONFIG.textColor).toBe(WIDGET_RUNTIME_DEFAULTS.textColor);
  });

  it("defaults Display Mode to always-visible", () => {
    expect(DEFAULT_WIDGET_CONFIG.displayMode).toBe("always-visible");
  });

  it("declares the four Launcher positions", () => {
    expect(WIDGET_POSITIONS).toEqual([
      "bottom-right",
      "bottom-left",
      "top-right",
      "top-left",
    ]);
  });

  it("declares both Display Modes", () => {
    expect(WIDGET_DISPLAY_MODES).toEqual(["always-visible", "auto-hide"]);
  });
});
