/**
 * Widget position on screen
 */
export type WidgetPosition =
  | "bottom-right"
  | "bottom-left"
  | "top-right"
  | "top-left";

/**
 * Widget configuration options
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
