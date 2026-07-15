/**
 * Widget position on screen
 */
export type WidgetPosition =
  | "bottom-right"
  | "bottom-left"
  | "top-right"
  | "top-left";

/**
 * How the Launcher presents itself when idle (behavior wired separately;
 * carried through config so fetched values round-trip)
 */
export type WidgetDisplayMode = "always-visible" | "auto-hide";

/**
 * Widget configuration options
 *
 * Deliberately duplicated from convex/widgetConfigShape.ts — the widget is
 * zero-dependency, so keep both sides in sync by hand
 * (__tests__/convex/widget-config-shape.test.ts guards the defaults).
 */
export interface WidgetConfig {
  widgetKey: string;
  position: WidgetPosition;
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  buttonText: string;
  apiUrl: string;
  privacyPolicyUrl?: string;
  logoUrl?: string;
  displayMode?: WidgetDisplayMode;
}

/**
 * Internal widget state
 */
export interface WidgetState {
  isOpen: boolean;
  isCapturing: boolean;
  captureMode: "screenshot" | "record" | null;
}

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: Omit<WidgetConfig, "widgetKey"> = {
  position: "bottom-right",
  primaryColor: "#1a1a1a",
  backgroundColor: "#F7F5F0",
  textColor: "#1a1a1a",
  buttonText: "Feedback",
  apiUrl: "",
};
