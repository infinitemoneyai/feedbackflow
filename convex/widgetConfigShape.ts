import { v } from "convex/values";

/**
 * Canonical Widget Config shape — the single definition of the per-widget
 * appearance/behavior settings (see CONTEXT.md: Widget Config, Position,
 * Display Mode). The schema, the widgetConfig functions, and the dashboard
 * settings form all consume this module.
 *
 * The embedded widget (widget/src/types.ts) deliberately duplicates these
 * values — it must stay zero-dependency — and is kept in sync by hand;
 * __tests__/convex/widget-config-shape.test.ts guards the sync.
 */

export const WIDGET_POSITIONS = [
  "bottom-right",
  "bottom-left",
  "top-right",
  "top-left",
] as const;

export type WidgetPosition = (typeof WIDGET_POSITIONS)[number];

export const WIDGET_DISPLAY_MODES = ["always-visible", "auto-hide"] as const;

export type WidgetDisplayMode = (typeof WIDGET_DISPLAY_MODES)[number];

export const positionValidator = v.union(
  v.literal("bottom-right"),
  v.literal("bottom-left"),
  v.literal("top-right"),
  v.literal("top-left")
);

export const displayModeValidator = v.union(
  v.literal("always-visible"),
  v.literal("auto-hide")
);

/**
 * The editable Widget Config fields, shared by the widgetConfig table
 * definition and the saveWidgetConfig args. displayMode is optional in
 * storage (pre-existing rows lack it); readers default it via
 * DEFAULT_WIDGET_CONFIG.
 */
export const widgetConfigFields = {
  position: positionValidator,
  buttonText: v.optional(v.string()),
  primaryColor: v.optional(v.string()),
  backgroundColor: v.optional(v.string()),
  textColor: v.optional(v.string()),
  logoUrl: v.optional(v.string()),
  displayMode: v.optional(displayModeValidator),
};

export interface WidgetConfigValues {
  position: WidgetPosition;
  buttonText: string;
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  displayMode: WidgetDisplayMode;
}

/**
 * Canonical defaults. Values match what installed widgets already render
 * (the widget runtime's defaults win over the old dashboard-only ones).
 */
export const DEFAULT_WIDGET_CONFIG: WidgetConfigValues = {
  position: "bottom-right",
  buttonText: "Feedback",
  primaryColor: "#1a1a1a",
  backgroundColor: "#F7F5F0",
  textColor: "#1a1a1a",
  displayMode: "always-visible",
};
