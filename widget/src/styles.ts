import type { WidgetConfig, WidgetPosition } from "./types";

/**
 * Generate position styles based on widget position
 */
function getPositionStyles(position: WidgetPosition): string {
  switch (position) {
    case "bottom-right":
      return "bottom: 20px; right: 20px;";
    case "bottom-left":
      return "bottom: 20px; left: 20px;";
    case "top-right":
      return "top: 20px; right: 20px;";
    case "top-left":
      return "top: 20px; left: 20px;";
    default:
      return "bottom: 20px; right: 20px;";
  }
}

/**
 * Generate the widget CSS styles
 */
export function generateStyles(config: WidgetConfig): string {
  const positionStyles = getPositionStyles(config.position);

  return `
    /* FeedbackFlow Widget Styles */
    .ff-widget-root {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: 14px;
      line-height: 1.5;
      box-sizing: border-box;
    }

    .ff-widget-root *,
    .ff-widget-root *::before,
    .ff-widget-root *::after {
      box-sizing: inherit;
    }

    /* Floating Button */
    .ff-trigger-button {
      position: fixed;
      ${positionStyles}
      z-index: 2147483646;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 20px;
      background-color: ${config.primaryColor};
      color: white;
      border: 2px solid ${config.primaryColor};
      border-radius: 0;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 4px 4px 0px 0px rgba(0, 0, 0, 0.2);
      transition: all 0.15s ease;
    }

    .ff-trigger-button:hover {
      transform: translate(2px, 2px);
      box-shadow: 2px 2px 0px 0px rgba(0, 0, 0, 0.2);
    }

    .ff-trigger-button:active {
      transform: translate(3px, 3px);
      box-shadow: 1px 1px 0px 0px rgba(0, 0, 0, 0.2);
    }

    .ff-trigger-button svg {
      width: 18px;
      height: 18px;
      flex-shrink: 0;
    }

    /* Modal Overlay */
    .ff-modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      z-index: 2147483647;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.2s ease, visibility 0.2s ease;
    }

    .ff-modal-overlay.ff-visible {
      opacity: 1;
      visibility: visible;
    }

    /* Modal Container */
    .ff-modal {
      background-color: ${config.backgroundColor};
      border: 2px solid ${config.primaryColor};
      box-shadow: 8px 8px 0px 0px rgba(0, 0, 0, 1);
      max-width: 420px;
      width: 90%;
      max-height: 90vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      transform: scale(0.95) translateY(10px);
      transition: transform 0.2s ease;
    }

    .ff-modal-overlay.ff-visible .ff-modal {
      transform: scale(1) translateY(0);
    }

    /* Modal Header */
    .ff-modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 2px solid ${config.primaryColor};
      background-color: #F3C952;
    }

    .ff-modal-title {
      font-size: 16px;
      font-weight: 600;
      color: ${config.textColor};
      margin: 0;
    }

    .ff-close-button {
      background: none;
      border: none;
      padding: 4px;
      cursor: pointer;
      color: ${config.textColor};
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: background-color 0.15s ease;
    }

    .ff-close-button:hover {
      background-color: rgba(0, 0, 0, 0.1);
    }

    .ff-close-button svg {
      width: 20px;
      height: 20px;
    }

    /* Modal Content */
    .ff-modal-content {
      padding: 24px 20px;
      overflow-y: auto;
    }

    /* Capture Options */
    .ff-capture-options {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .ff-capture-option {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
      background-color: white;
      border: 2px solid ${config.primaryColor};
      cursor: pointer;
      transition: all 0.15s ease;
      box-shadow: 4px 4px 0px 0px rgba(0, 0, 0, 1);
    }

    .ff-capture-option:hover {
      transform: translate(2px, 2px);
      box-shadow: 2px 2px 0px 0px rgba(0, 0, 0, 1);
    }

    .ff-capture-option:active {
      transform: translate(3px, 3px);
      box-shadow: 1px 1px 0px 0px rgba(0, 0, 0, 1);
    }

    /* Disabled state for unsupported options (e.g., recording on mobile) */
    .ff-capture-option-disabled {
      opacity: 0.5;
      cursor: not-allowed;
      box-shadow: 2px 2px 0px 0px rgba(0, 0, 0, 0.5);
    }

    .ff-capture-option-disabled:hover {
      transform: none;
      box-shadow: 2px 2px 0px 0px rgba(0, 0, 0, 0.5);
    }

    .ff-capture-option-disabled:active {
      transform: none;
      box-shadow: 2px 2px 0px 0px rgba(0, 0, 0, 0.5);
    }

    .ff-capture-icon {
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .ff-capture-icon.ff-screenshot {
      background-color: rgba(107, 154, 196, 0.2);
      color: #6B9AC4;
      border: 1px solid rgba(107, 154, 196, 0.3);
    }

    .ff-capture-icon.ff-record {
      background-color: rgba(232, 93, 82, 0.2);
      color: #E85D52;
      border: 1px solid rgba(232, 93, 82, 0.3);
    }

    .ff-capture-icon svg {
      width: 24px;
      height: 24px;
    }

    .ff-capture-text {
      flex: 1;
    }

    .ff-capture-title {
      font-size: 15px;
      font-weight: 600;
      color: ${config.textColor};
      margin: 0 0 4px 0;
    }

    .ff-capture-description {
      font-size: 13px;
      color: #666;
      margin: 0;
    }

    /* Modal Footer */
    .ff-modal-footer {
      padding: 12px 20px;
      border-top: 2px solid ${config.primaryColor};
      background-color: rgba(0, 0, 0, 0.03);
    }

    .ff-powered-by {
      font-size: 11px;
      color: #888;
      text-align: center;
    }

    .ff-powered-by a {
      color: #666;
      text-decoration: none;
    }

    .ff-powered-by a:hover {
      text-decoration: underline;
    }

    /* Mobile-specific styles */
    @media (max-width: 480px) {
      .ff-trigger-button {
        padding: 10px 16px;
        font-size: 13px;
      }

      .ff-modal {
        width: 95%;
        max-width: none;
        margin: 10px;
      }

      .ff-modal-header {
        padding: 14px 16px;
      }

      .ff-modal-content {
        padding: 16px;
      }

      .ff-capture-option {
        padding: 14px;
        gap: 12px;
      }

      .ff-capture-icon {
        width: 40px;
        height: 40px;
      }

      .ff-capture-icon svg {
        width: 20px;
        height: 20px;
      }

      .ff-capture-title {
        font-size: 14px;
      }

      .ff-capture-description {
        font-size: 12px;
      }
    }

    /* Touch-friendly tap targets */
    @media (pointer: coarse) {
      .ff-capture-option {
        min-height: 70px;
      }

      .ff-close-button {
        padding: 8px;
        margin: -4px;
      }

      .ff-trigger-button {
        min-height: 48px;
      }
    }
  `;
}
