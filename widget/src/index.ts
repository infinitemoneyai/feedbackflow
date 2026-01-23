/**
 * FeedbackFlow Widget Entry Point
 *
 * This script can be embedded on any website with:
 *
 * <script
 *   src="https://cdn.feedbackflow.cc/widget.js"
 *   data-widget-key="wk_xxxxx"
 *   data-position="bottom-right"
 * ></script>
 */

import { FeedbackFlowWidget } from "./widget";
import type { WidgetConfig, WidgetPosition } from "./types";
import { debug } from "./debug";

// Store widget instance globally for access
let widgetInstance: FeedbackFlowWidget | null = null;

/**
 * Parse configuration from script data attributes
 */
function parseConfigFromScript(): Partial<WidgetConfig> | null {
  // Find our script tag
  const scripts = document.querySelectorAll("script[data-widget-key]");
  const script = scripts[scripts.length - 1] as HTMLScriptElement | null;

  if (!script) {
    debug.error("No script tag with data-widget-key found");
    return null;
  }

  const widgetKey = script.dataset.widgetKey;
  if (!widgetKey) {
    debug.error("data-widget-key is required");
    return null;
  }

  // Parse optional config from data attributes
  const config: Partial<WidgetConfig> & { widgetKey: string } = {
    widgetKey,
  };

  // Position
  const position = script.dataset.position as WidgetPosition | undefined;
  if (
    position &&
    ["bottom-right", "bottom-left", "top-right", "top-left"].includes(position)
  ) {
    config.position = position;
  }

  // Colors
  if (script.dataset.primaryColor) {
    config.primaryColor = script.dataset.primaryColor;
  }
  if (script.dataset.backgroundColor) {
    config.backgroundColor = script.dataset.backgroundColor;
  }
  if (script.dataset.textColor) {
    config.textColor = script.dataset.textColor;
  }

  // Button text
  if (script.dataset.buttonText) {
    config.buttonText = script.dataset.buttonText;
  }

  // API URL (for custom/self-hosted deployments)
  if (script.dataset.apiUrl) {
    config.apiUrl = script.dataset.apiUrl;
  }

  // Privacy policy URL (for GDPR compliance)
  if (script.dataset.privacyPolicyUrl) {
    config.privacyPolicyUrl = script.dataset.privacyPolicyUrl;
  }

  return config;
}

/**
 * Initialize the widget
 */
function initWidget(): void {
  // Don't initialize twice
  if (widgetInstance) {
    debug.warn("Widget already initialized");
    return;
  }

  const config = parseConfigFromScript();
  if (!config || !config.widgetKey) {
    return;
  }

  try {
    widgetInstance = new FeedbackFlowWidget(
      config as Partial<WidgetConfig> & { widgetKey: string }
    );
    debug.log("Widget initialized");
  } catch (error) {
    debug.error("Failed to initialize widget", error);
  }
}

/**
 * Public API for programmatic control
 */
const FeedbackFlow = {
  /**
   * Initialize with custom config (alternative to data attributes)
   */
  init(config: Partial<WidgetConfig> & { widgetKey: string }): void {
    if (widgetInstance) {
      debug.warn("Widget already initialized");
      return;
    }

    try {
      widgetInstance = new FeedbackFlowWidget(config);
    } catch (error) {
      debug.error("Failed to initialize widget", error);
    }
  },

  /**
   * Open the feedback modal
   */
  open(): void {
    widgetInstance?.open();
  },

  /**
   * Close the feedback modal
   */
  close(): void {
    widgetInstance?.close();
  },

  /**
   * Get widget instance
   */
  getInstance(): FeedbackFlowWidget | null {
    return widgetInstance;
  },

  /**
   * Destroy the widget
   */
  destroy(): void {
    widgetInstance?.destroy();
    widgetInstance = null;
  },
};

// Export for programmatic use
export { FeedbackFlow, FeedbackFlowWidget };
export type { WidgetConfig, WidgetPosition };

// Auto-initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initWidget);
} else {
  // DOM already loaded
  initWidget();
}

// Make available globally
if (typeof window !== "undefined") {
  (window as Window & { FeedbackFlow?: typeof FeedbackFlow }).FeedbackFlow =
    FeedbackFlow;
}
