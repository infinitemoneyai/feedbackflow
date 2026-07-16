/**
 * Display Mode toggle round-trips through the settings form: selecting
 * Auto-Hide and saving sends displayMode through the useSaveable seam.
 * @see components/settings/widget-customization-section.tsx
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { DEFAULT_WIDGET_CONFIG } from "@/convex/widgetConfigShape";

const saveMutation = vi.fn(async () => ({ id: "cfg", updated: true }));

// Referentially stable like a real Convex result — a fresh object per render
// would retrigger the sync-from-server effect and reset form state.
const stableConfig = {
  widgetId: "w1",
  ...DEFAULT_WIDGET_CONFIG,
  logoUrl: undefined,
};

vi.mock("convex/react", () => ({
  useQuery: () => stableConfig,
  useMutation: () => saveMutation,
}));

import { WidgetCustomizationSection } from "@/components/settings/widget-customization-section";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Display Mode toggle", () => {
  it("defaults to Always Visible and saves auto-hide after toggling", async () => {
    render(
      <WidgetCustomizationSection
        widgetId={"w1" as never}
        widgetKey="wk_test"
      />
    );

    const alwaysVisible = screen.getByRole("button", {
      name: /Always Visible/i,
    });
    expect(alwaysVisible.getAttribute("aria-pressed")).toBe("true");

    fireEvent.click(screen.getByRole("button", { name: /Auto-Hide/i }));
    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() =>
      expect(saveMutation).toHaveBeenCalledWith(
        expect.objectContaining({ displayMode: "auto-hide" })
      )
    );
  });

  it("the preview reflects the selected mode", () => {
    render(
      <WidgetCustomizationSection
        widgetId={"w1" as never}
        widgetKey="wk_test"
      />
    );

    const previewButton = document.querySelector("[data-display-mode]");
    expect(previewButton?.getAttribute("data-display-mode")).toBe(
      "always-visible"
    );

    fireEvent.click(screen.getByRole("button", { name: /Auto-Hide/i }));
    expect(previewButton?.getAttribute("data-display-mode")).toBe("auto-hide");
  });
});
