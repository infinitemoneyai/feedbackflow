/**
 * Styles for Submit UI
 */

import type { WidgetConfig } from "../types";

export function injectSubmitUIStyles(config: WidgetConfig): void {
  const styleId = "ff-submit-styles";
  if (document.getElementById(styleId)) return;

  const styles = `
    .ff-submit-overlay {
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
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .ff-submit-wrapper {
      background-color: ${config.backgroundColor};
      border: 2px solid ${config.primaryColor};
      box-shadow: 8px 8px 0px 0px rgba(0, 0, 0, 1);
      max-width: 480px;
      width: 90%;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .ff-submit-form {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .ff-submit-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      background-color: #F3C952;
      border-bottom: 2px solid ${config.primaryColor};
    }

    .ff-submit-title {
      font-size: 16px;
      font-weight: 600;
      color: ${config.textColor};
      margin: 0;
    }

    .ff-submit-close {
      background: none;
      border: none;
      padding: 4px;
      cursor: pointer;
      color: ${config.textColor};
      display: flex;
      border-radius: 4px;
    }

    .ff-submit-close:hover {
      background-color: rgba(0, 0, 0, 0.1);
    }

    .ff-submit-close svg {
      width: 20px;
      height: 20px;
    }

    .ff-submit-content {
      flex: 1;
      padding: 16px;
      overflow-y: auto;
    }

    /* Preview Thumbnail */
    .ff-preview-thumbnail {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background-color: #f5f5f4;
      border: 1px solid #d6d3d1;
      margin-bottom: 16px;
    }

    .ff-preview-img {
      width: 60px;
      height: 45px;
      object-fit: cover;
      border: 1px solid ${config.primaryColor};
    }

    .ff-preview-icon {
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: rgba(232, 93, 82, 0.1);
      border: 1px solid rgba(232, 93, 82, 0.3);
      border-radius: 50%;
      color: #E85D52;
    }

    .ff-preview-icon svg {
      width: 24px;
      height: 24px;
    }

    .ff-preview-label {
      font-size: 13px;
      color: #666;
    }

    /* Type Selector */
    .ff-type-selector {
      display: flex;
      gap: 12px;
      margin-bottom: 16px;
    }

    .ff-type-option {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background: white;
      border: 2px solid #d6d3d1;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .ff-type-option:hover {
      border-color: ${config.primaryColor};
    }

    .ff-type-option.ff-selected {
      border-color: ${config.primaryColor};
      box-shadow: 2px 2px 0px 0px rgba(0, 0, 0, 0.5);
    }

    .ff-type-icon {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      border: 1px solid transparent;
    }

    .ff-type-icon svg {
      width: 18px;
      height: 18px;
    }

    .ff-type-label {
      font-size: 13px;
      font-weight: 500;
      color: ${config.textColor};
    }

    /* Form Groups */
    .ff-form-group {
      margin-bottom: 16px;
    }

    .ff-form-group-sm {
      margin-bottom: 12px;
    }

    .ff-form-label {
      display: block;
      font-size: 13px;
      font-weight: 600;
      color: ${config.textColor};
      margin-bottom: 6px;
    }

    .ff-form-label-sm {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 500;
      color: #666;
      margin-bottom: 4px;
    }

    .ff-form-label-sm svg {
      width: 14px;
      height: 14px;
    }

    .ff-input {
      width: 100%;
      padding: 10px 12px;
      border: 2px solid #d6d3d1;
      background-color: white;
      font-size: 14px;
      color: ${config.textColor};
      transition: border-color 0.15s ease;
      outline: none;
    }

    .ff-input:focus {
      border-color: ${config.primaryColor};
    }

    .ff-input::placeholder {
      color: #999;
    }

    .ff-input-sm {
      padding: 8px 10px;
      font-size: 13px;
    }

    .ff-textarea {
      width: 100%;
      padding: 10px 12px;
      border: 2px solid #d6d3d1;
      background-color: white;
      font-size: 14px;
      color: ${config.textColor};
      min-height: 80px;
      resize: vertical;
      transition: border-color 0.15s ease;
      outline: none;
      font-family: inherit;
    }

    .ff-textarea:focus {
      border-color: ${config.primaryColor};
    }

    .ff-textarea::placeholder {
      color: #999;
    }

    /* Optional Section */
    .ff-optional-section {
      border-top: 1px solid #e5e5e5;
      padding-top: 12px;
      margin-top: 8px;
    }

    .ff-optional-header {
      margin-bottom: 12px;
    }

    .ff-optional-label {
      font-size: 11px;
      font-weight: 600;
      color: #888;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* Actions */
    .ff-submit-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 12px 16px;
      background-color: rgba(0, 0, 0, 0.03);
      border-top: 2px solid ${config.primaryColor};
    }

    .ff-submit-btn {
      padding: 10px 20px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      border: 2px solid ${config.primaryColor};
      transition: all 0.15s ease;
    }

    .ff-submit-btn.ff-btn-secondary {
      background-color: white;
      color: ${config.textColor};
    }

    .ff-submit-btn.ff-btn-secondary:hover {
      background-color: #f5f5f4;
    }

    .ff-submit-btn.ff-btn-primary {
      background-color: ${config.primaryColor};
      color: white;
      box-shadow: 4px 4px 0px 0px rgba(0, 0, 0, 0.3);
    }

    .ff-submit-btn.ff-btn-primary:hover {
      transform: translate(2px, 2px);
      box-shadow: 2px 2px 0px 0px rgba(0, 0, 0, 0.3);
    }

    /* Loading State */
    .ff-submit-loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 24px;
      text-align: center;
    }

    .ff-spinner {
      width: 48px;
      height: 48px;
      color: ${config.primaryColor};
      animation: ff-spin 1s linear infinite;
      margin-bottom: 16px;
    }

    .ff-spinner svg {
      width: 100%;
      height: 100%;
    }

    @keyframes ff-spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .ff-loading-text {
      font-size: 14px;
      color: #666;
      margin: 0;
    }

    /* Success State */
    .ff-submit-success {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 32px 24px;
      text-align: center;
    }

    .ff-success-icon {
      width: 64px;
      height: 64px;
      background-color: #6B9AC4;
      border: 2px solid ${config.primaryColor};
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      margin-bottom: 16px;
      box-shadow: 4px 4px 0px 0px rgba(0, 0, 0, 0.2);
    }

    .ff-success-icon svg {
      width: 32px;
      height: 32px;
    }

    .ff-success-title {
      font-size: 18px;
      font-weight: 600;
      color: ${config.textColor};
      margin: 0 0 8px 0;
    }

    .ff-success-message {
      font-size: 14px;
      color: #666;
      margin: 0 0 16px 0;
    }

    .ff-success-warning {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px;
      background-color: #fef3c7;
      border: 1px solid #f59e0b;
      border-radius: 6px;
      margin-bottom: 16px;
      text-align: left;
    }

    .ff-warning-icon {
      flex-shrink: 0;
      width: 20px;
      height: 20px;
      color: #f59e0b;
    }

    .ff-warning-icon svg {
      width: 100%;
      height: 100%;
    }

    .ff-warning-text {
      font-size: 13px;
      color: #92400e;
      margin: 0;
      line-height: 1.5;
    }

    .ff-success-id {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      margin-bottom: 24px;
    }

    .ff-id-label {
      color: #888;
    }

    .ff-id-value {
      font-family: monospace;
      background-color: #f5f5f4;
      padding: 2px 6px;
      border: 1px solid #d6d3d1;
    }

    /* Error State */
    .ff-submit-error {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 32px 24px;
      text-align: center;
    }

    .ff-error-icon {
      width: 64px;
      height: 64px;
      background-color: #E85D52;
      border: 2px solid ${config.primaryColor};
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      margin-bottom: 16px;
      box-shadow: 4px 4px 0px 0px rgba(0, 0, 0, 0.2);
    }

    .ff-error-icon svg {
      width: 32px;
      height: 32px;
    }

    .ff-error-title {
      font-size: 18px;
      font-weight: 600;
      color: ${config.textColor};
      margin: 0 0 8px 0;
    }

    .ff-error-message {
      font-size: 14px;
      color: #666;
      margin: 0 0 24px 0;
      max-width: 320px;
    }

    .ff-error-actions {
      display: flex;
      gap: 12px;
    }

    /* Privacy Consent Section */
    .ff-consent-section {
      margin-top: 16px;
      padding-top: 12px;
      border-top: 1px solid #e5e5e5;
    }

    .ff-consent-label {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      cursor: pointer;
      font-size: 12px;
      line-height: 1.5;
    }

    .ff-consent-checkbox {
      flex-shrink: 0;
      width: 16px;
      height: 16px;
      margin-top: 2px;
      cursor: pointer;
      accent-color: ${config.primaryColor};
    }

    .ff-consent-text {
      color: #666;
    }

    .ff-consent-link {
      color: #6B9AC4;
      text-decoration: underline;
    }

    .ff-consent-link:hover {
      color: #4a7ba0;
    }
  `;

  const styleEl = document.createElement("style");
  styleEl.id = styleId;
  styleEl.textContent = styles;
  document.head.appendChild(styleEl);
}
