/**
 * Submission Form UI
 * Displays form for title, description, type, and optional email/name
 * Handles submission with loading state and success/error feedback
 */

import { createElement, createElementFromHTML } from "./dom";
import { icons } from "./icons";
import type { WidgetConfig } from "./types";
import type { CaptureResult } from "./capture";
import type { RecordingResult } from "./record";
import {
  OfflineQueue,
  getOfflineQueue,
  type SubmissionFormData,
  type SubmissionMetadata,
  type SubmissionResult,
} from "./offline-queue";

export interface SubmitUICallbacks {
  onSuccess: (feedbackId: string) => void;
  onCancel: () => void;
  onError: (error: string) => void;
}

export type FeedbackType = "bug" | "feature";

interface FormState {
  title: string;
  description: string;
  type: FeedbackType;
  email: string;
  name: string;
  privacyConsent: boolean;
}

type SubmitState = "form" | "loading" | "success" | "error";

/**
 * Submission Form UI Manager
 */
export class SubmitUI {
  private config: WidgetConfig;
  private callbacks: SubmitUICallbacks;
  private screenshot: CaptureResult | null;
  private recording: RecordingResult | null;
  private container: HTMLElement | null = null;
  private state: SubmitState = "form";
  private formState: FormState = {
    title: "",
    description: "",
    type: "bug",
    email: "",
    name: "",
    privacyConsent: false,
  };
  private feedbackId: string = "";
  private errorMessage: string = "";
  private warningMessage: string = "";
  private offlineQueue: OfflineQueue;

  constructor(
    config: WidgetConfig,
    callbacks: SubmitUICallbacks,
    screenshot: CaptureResult | null,
    recording: RecordingResult | null
  ) {
    this.config = config;
    this.callbacks = callbacks;
    this.screenshot = screenshot;
    this.recording = recording;
    this.offlineQueue = getOfflineQueue(config.apiUrl);
  }

  /**
   * Show the submission form
   */
  public show(): void {
    this.injectStyles();
    this.render();
  }

  /**
   * Render the current state
   */
  private render(): void {
    // Remove existing container
    this.container?.remove();

    // Create overlay
    this.container = createElement("div", {
      className: "ff-submit-overlay",
    });

    const wrapper = createElement("div", { className: "ff-submit-wrapper" });

    switch (this.state) {
      case "form":
        wrapper.appendChild(this.renderForm());
        break;
      case "loading":
        wrapper.appendChild(this.renderLoading());
        break;
      case "success":
        wrapper.appendChild(this.renderSuccess());
        break;
      case "error":
        wrapper.appendChild(this.renderError());
        break;
    }

    this.container.appendChild(wrapper);
    document.body.appendChild(this.container);

    // Focus first input in form state
    if (this.state === "form") {
      const titleInput = this.container.querySelector(
        ".ff-submit-title-input"
      ) as HTMLInputElement;
      titleInput?.focus();
    }
  }

  /**
   * Render the form
   */
  private renderForm(): HTMLElement {
    const form = createElement("div", { className: "ff-submit-form" });

    // Header
    const header = createElement("div", { className: "ff-submit-header" }, [
      createElement("h3", { className: "ff-submit-title" }, ["Submit Feedback"]),
      this.createCloseButton(),
    ]);

    // Content
    const content = createElement("div", { className: "ff-submit-content" });

    // Preview thumbnail
    if (this.screenshot || this.recording) {
      content.appendChild(this.renderPreviewThumbnail());
    }

    // Type selector
    content.appendChild(this.renderTypeSelector());

    // Title input
    const titleGroup = createElement("div", { className: "ff-form-group" }, [
      createElement("label", { className: "ff-form-label" }, ["Title"]),
      createElement("input", {
        className: "ff-submit-title-input ff-input",
        type: "text",
        placeholder: "Brief summary of the issue or request",
      }) as HTMLInputElement,
    ]);
    const titleInput = titleGroup.querySelector("input")!;
    titleInput.value = this.formState.title;
    titleInput.addEventListener("input", (e) => {
      this.formState.title = (e.target as HTMLInputElement).value;
    });
    content.appendChild(titleGroup);

    // Description textarea
    const descGroup = createElement("div", { className: "ff-form-group" }, [
      createElement("label", { className: "ff-form-label" }, ["Description"]),
      createElement("textarea", {
        className: "ff-submit-description-input ff-textarea",
        placeholder: "Provide more details about what happened or what you'd like to see...",
      }) as HTMLTextAreaElement,
    ]);
    const descTextarea = descGroup.querySelector("textarea")!;
    descTextarea.value = this.formState.description;
    descTextarea.addEventListener("input", (e) => {
      this.formState.description = (e.target as HTMLTextAreaElement).value;
    });
    content.appendChild(descGroup);

    // Optional fields section
    const optionalSection = createElement("div", { className: "ff-optional-section" });

    const optionalHeader = createElement("div", { className: "ff-optional-header" }, [
      createElement("span", { className: "ff-optional-label" }, ["Optional"]),
    ]);
    optionalSection.appendChild(optionalHeader);

    // Email input
    const emailGroup = createElement("div", { className: "ff-form-group ff-form-group-sm" }, [
      createElement("label", { className: "ff-form-label-sm" }, [
        createElementFromHTML(icons.mail),
        "Email (for follow-up)",
      ]),
      createElement("input", {
        className: "ff-input ff-input-sm",
        type: "email",
        placeholder: "your@email.com",
      }) as HTMLInputElement,
    ]);
    const emailInput = emailGroup.querySelector("input")!;
    emailInput.value = this.formState.email;
    emailInput.addEventListener("input", (e) => {
      this.formState.email = (e.target as HTMLInputElement).value;
    });
    optionalSection.appendChild(emailGroup);

    // Name input
    const nameGroup = createElement("div", { className: "ff-form-group ff-form-group-sm" }, [
      createElement("label", { className: "ff-form-label-sm" }, [
        createElementFromHTML(icons.user),
        "Name",
      ]),
      createElement("input", {
        className: "ff-input ff-input-sm",
        type: "text",
        placeholder: "Your name",
      }) as HTMLInputElement,
    ]);
    const nameInput = nameGroup.querySelector("input")!;
    nameInput.value = this.formState.name;
    nameInput.addEventListener("input", (e) => {
      this.formState.name = (e.target as HTMLInputElement).value;
    });
    optionalSection.appendChild(nameGroup);

    content.appendChild(optionalSection);

    // Privacy consent section (only shown if privacy policy URL is configured)
    if (this.config.privacyPolicyUrl) {
      const consentSection = createElement("div", { className: "ff-consent-section" });

      const consentCheckbox = createElement("input", {
        type: "checkbox",
        className: "ff-consent-checkbox",
        id: "ff-privacy-consent",
      }) as HTMLInputElement;
      consentCheckbox.checked = this.formState.privacyConsent;
      consentCheckbox.addEventListener("change", (e) => {
        this.formState.privacyConsent = (e.target as HTMLInputElement).checked;
      });

      const consentLabel = createElement("label", {
        className: "ff-consent-label",
        for: "ff-privacy-consent",
      }, [
        consentCheckbox,
        createElement("span", { className: "ff-consent-text" }, [
          "I acknowledge that my feedback may include personal information and agree to the ",
          createElement("a", {
            href: this.config.privacyPolicyUrl,
            target: "_blank",
            className: "ff-consent-link",
          }, ["privacy policy"]),
          ".",
        ]),
      ]);

      consentSection.appendChild(consentLabel);
      content.appendChild(consentSection);
    }

    // Actions
    const actions = createElement("div", { className: "ff-submit-actions" }, [
      this.createButton("Cancel", "secondary", () => this.cancel()),
      this.createButton("Submit Feedback", "primary", () => this.submit()),
    ]);

    form.appendChild(header);
    form.appendChild(content);
    form.appendChild(actions);

    return form;
  }

  /**
   * Render preview thumbnail
   */
  private renderPreviewThumbnail(): HTMLElement {
    const container = createElement("div", { className: "ff-preview-thumbnail" });

    if (this.screenshot) {
      const img = createElement("img", {
        className: "ff-preview-img",
      }) as HTMLImageElement;
      img.src = this.screenshot.dataUrl;
      img.alt = "Screenshot preview";
      container.appendChild(img);
      container.appendChild(
        createElement("span", { className: "ff-preview-label" }, ["Screenshot attached"])
      );
    } else if (this.recording) {
      const icon = createElement("div", { className: "ff-preview-icon" }, [
        createElementFromHTML(icons.video),
      ]);
      container.appendChild(icon);
      const duration = Math.round(this.recording.duration / 1000);
      container.appendChild(
        createElement("span", { className: "ff-preview-label" }, [
          `Recording attached (${duration}s)`,
        ])
      );
    }

    return container;
  }

  /**
   * Render type selector (Bug / Feature)
   */
  private renderTypeSelector(): HTMLElement {
    const container = createElement("div", { className: "ff-type-selector" });

    const bugOption = this.createTypeOption("bug", "Bug Report", icons.bug, "#E85D52");
    const featureOption = this.createTypeOption(
      "feature",
      "Feature Request",
      icons.lightbulb,
      "#6B9AC4"
    );

    container.appendChild(bugOption);
    container.appendChild(featureOption);

    return container;
  }

  /**
   * Create type option button
   */
  private createTypeOption(
    type: FeedbackType,
    label: string,
    icon: string,
    color: string
  ): HTMLElement {
    const isSelected = this.formState.type === type;
    const option = createElement(
      "button",
      {
        className: `ff-type-option ${isSelected ? "ff-selected" : ""}`,
        type: "button",
        "data-type": type,
      },
      [
        createElement("div", { className: "ff-type-icon" }, [
          createElementFromHTML(icon),
        ]),
        createElement("span", { className: "ff-type-label" }, [label]),
      ]
    );

    // Apply color to icon
    const iconEl = option.querySelector(".ff-type-icon") as HTMLElement;
    if (iconEl) {
      iconEl.style.color = color;
      if (isSelected) {
        iconEl.style.backgroundColor = `${color}20`;
        iconEl.style.borderColor = `${color}40`;
      }
    }

    option.addEventListener("click", () => {
      this.formState.type = type;
      this.render();
    });

    return option;
  }

  /**
   * Render loading state
   */
  private renderLoading(): HTMLElement {
    const loading = createElement("div", { className: "ff-submit-loading" });

    const spinner = createElement("div", { className: "ff-spinner" }, [
      createElementFromHTML(icons.spinner),
    ]);

    const text = createElement("p", { className: "ff-loading-text" }, [
      "Submitting your feedback...",
    ]);

    loading.appendChild(spinner);
    loading.appendChild(text);

    return loading;
  }

  /**
   * Render success state
   */
  private renderSuccess(): HTMLElement {
    const success = createElement("div", { className: "ff-submit-success" });

    const icon = createElement("div", { className: "ff-success-icon" }, [
      createElementFromHTML(icons.check),
    ]);

    const title = createElement("h3", { className: "ff-success-title" }, [
      "Feedback Submitted!",
    ]);

    const message = createElement("p", { className: "ff-success-message" }, [
      "Thank you for your feedback. We'll review it shortly.",
    ]);

    // Show warning if recording was too large
    if (this.warningMessage) {
      const warning = createElement("div", { className: "ff-success-warning" }, [
        createElement("div", { className: "ff-warning-icon" }, [
          createElementFromHTML(icons.warning || icons.info),
        ]),
        createElement("p", { className: "ff-warning-text" }, [this.warningMessage]),
      ]);
      success.appendChild(icon);
      success.appendChild(title);
      success.appendChild(warning);
    } else {
      success.appendChild(icon);
      success.appendChild(title);
      success.appendChild(message);
    }

    const idLabel = createElement("div", { className: "ff-success-id" }, [
      createElement("span", { className: "ff-id-label" }, ["Reference ID: "]),
      createElement("code", { className: "ff-id-value" }, [this.feedbackId]),
    ]);

    const closeButton = this.createButton("Close", "primary", () => {
      this.callbacks.onSuccess(this.feedbackId);
      this.destroy();
    });

    success.appendChild(idLabel);
    success.appendChild(closeButton);

    return success;
  }

  /**
   * Render error state
   */
  private renderError(): HTMLElement {
    const error = createElement("div", { className: "ff-submit-error" });

    const icon = createElement("div", { className: "ff-error-icon" }, [
      createElementFromHTML(icons.close),
    ]);

    const title = createElement("h3", { className: "ff-error-title" }, [
      "Submission Failed",
    ]);

    const message = createElement("p", { className: "ff-error-message" }, [
      this.errorMessage || "Something went wrong. Your feedback has been saved and will be submitted automatically when the connection is restored.",
    ]);

    const actions = createElement("div", { className: "ff-error-actions" }, [
      this.createButton("Try Again", "secondary", () => {
        this.state = "form";
        this.render();
      }),
      this.createButton("Close", "primary", () => {
        this.callbacks.onError(this.errorMessage);
        this.destroy();
      }),
    ]);

    error.appendChild(icon);
    error.appendChild(title);
    error.appendChild(message);
    error.appendChild(actions);

    return error;
  }

  /**
   * Create close button
   */
  private createCloseButton(): HTMLElement {
    const button = createElement(
      "button",
      {
        className: "ff-submit-close",
        type: "button",
        "aria-label": "Cancel",
      },
      [createElementFromHTML(icons.close)]
    );

    button.addEventListener("click", () => this.cancel());
    return button;
  }

  /**
   * Create action button
   */
  private createButton(
    text: string,
    variant: "primary" | "secondary",
    onClick: () => void
  ): HTMLElement {
    const button = createElement(
      "button",
      {
        className: `ff-submit-btn ff-btn-${variant}`,
        type: "button",
      },
      [text]
    );

    button.addEventListener("click", onClick);
    return button;
  }

  /**
   * Cancel submission
   */
  private cancel(): void {
    this.destroy();
    this.callbacks.onCancel();
  }

  /**
   * Submit the feedback
   */
  private async submit(): Promise<void> {
    // Validate required fields
    if (!this.formState.title.trim()) {
      alert("Please enter a title for your feedback.");
      return;
    }

    // Validate privacy consent if privacy policy URL is configured
    if (this.config.privacyPolicyUrl && !this.formState.privacyConsent) {
      alert("Please acknowledge the privacy policy to submit feedback.");
      return;
    }

    // Show loading state
    this.state = "loading";
    this.render();

    try {
      const result = await this.submitFeedback();

      if (result.success && result.feedbackId) {
        this.feedbackId = result.feedbackId;
        this.warningMessage = result.warning || "";
        this.state = "success";
        this.render();
      } else {
        throw new Error(result.error || "Submission failed");
      }
    } catch (error) {
      console.error("FeedbackFlow: Submission failed", error);

      // Queue for offline retry
      await this.queueForRetry();

      this.errorMessage =
        error instanceof Error ? error.message : "Submission failed";
      this.state = "error";
      this.render();
    }
  }

  /**
   * Submit feedback to API
   */
  private async submitFeedback(): Promise<SubmissionResult> {
    const metadata = this.getMetadata();
    const apiUrl = this.config.apiUrl || "https://feedbackflow.dev/api/widget/submit";

    const formData = new FormData();
    formData.append("widgetKey", this.config.widgetKey);
    formData.append("title", this.formState.title);
    formData.append("description", this.formState.description);
    formData.append("type", this.formState.type);
    formData.append("metadata", JSON.stringify(metadata));

    if (this.formState.email) {
      formData.append("email", this.formState.email);
    }
    if (this.formState.name) {
      formData.append("name", this.formState.name);
    }

    // Add screenshot if present
    if (this.screenshot?.blob) {
      formData.append("screenshot", this.screenshot.blob, "screenshot.jpg");
    }

    // Add recording if present
    if (this.recording?.blob) {
      const ext = this.recording.mimeType.includes("webm") ? "webm" : "mp4";
      formData.append("recording", this.recording.blob, `recording.${ext}`);
    }

    const response = await fetch(apiUrl, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return {
      success: true,
      feedbackId: data.feedbackId || data.id,
      warning: data.warning,
    };
  }

  /**
   * Queue submission for offline retry
   */
  private async queueForRetry(): Promise<void> {
    const metadata = this.getMetadata();
    const formData: SubmissionFormData = {
      title: this.formState.title,
      description: this.formState.description,
      type: this.formState.type,
      email: this.formState.email || undefined,
      name: this.formState.name || undefined,
      metadata,
    };

    // Convert recording to base64 if present
    let recordingBase64: string | undefined;
    if (this.recording?.blob) {
      recordingBase64 = await OfflineQueue.blobToBase64(this.recording.blob);
    }

    // Add to queue - we need to modify the addToQueue call
    const queue = this.offlineQueue.getQueue();
    const submission = {
      id: `ff_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      widgetKey: this.config.widgetKey,
      formData,
      screenshotDataUrl: this.screenshot?.dataUrl,
      recordingBlob: recordingBase64,
      recordingMimeType: this.recording?.mimeType,
      timestamp: Date.now(),
      retryCount: 0,
      nextRetryAt: Date.now(),
    };
    queue.push(submission);
    localStorage.setItem("ff_submission_queue", JSON.stringify(queue));

    console.log("FeedbackFlow: Feedback queued for retry");
  }

  /**
   * Get submission metadata
   */
  private getMetadata(): SubmissionMetadata {
    return {
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
    };
  }

  /**
   * Inject styles
   */
  private injectStyles(): void {
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
        background-color: ${this.config.backgroundColor};
        border: 2px solid ${this.config.primaryColor};
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
        border-bottom: 2px solid ${this.config.primaryColor};
      }

      .ff-submit-title {
        font-size: 16px;
        font-weight: 600;
        color: ${this.config.textColor};
        margin: 0;
      }

      .ff-submit-close {
        background: none;
        border: none;
        padding: 4px;
        cursor: pointer;
        color: ${this.config.textColor};
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
        border: 1px solid ${this.config.primaryColor};
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
        border-color: ${this.config.primaryColor};
      }

      .ff-type-option.ff-selected {
        border-color: ${this.config.primaryColor};
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
        color: ${this.config.textColor};
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
        color: ${this.config.textColor};
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
        color: ${this.config.textColor};
        transition: border-color 0.15s ease;
        outline: none;
      }

      .ff-input:focus {
        border-color: ${this.config.primaryColor};
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
        color: ${this.config.textColor};
        min-height: 80px;
        resize: vertical;
        transition: border-color 0.15s ease;
        outline: none;
        font-family: inherit;
      }

      .ff-textarea:focus {
        border-color: ${this.config.primaryColor};
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
        border-top: 2px solid ${this.config.primaryColor};
      }

      .ff-submit-btn {
        padding: 10px 20px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        border: 2px solid ${this.config.primaryColor};
        transition: all 0.15s ease;
      }

      .ff-submit-btn.ff-btn-secondary {
        background-color: white;
        color: ${this.config.textColor};
      }

      .ff-submit-btn.ff-btn-secondary:hover {
        background-color: #f5f5f4;
      }

      .ff-submit-btn.ff-btn-primary {
        background-color: ${this.config.primaryColor};
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
        color: ${this.config.primaryColor};
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
        background-color: #22c55e;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        margin-bottom: 16px;
      }

      .ff-success-icon svg {
        width: 32px;
        height: 32px;
      }

      .ff-success-title {
        font-size: 18px;
        font-weight: 600;
        color: ${this.config.textColor};
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
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        margin-bottom: 16px;
      }

      .ff-error-icon svg {
        width: 32px;
        height: 32px;
      }

      .ff-error-title {
        font-size: 18px;
        font-weight: 600;
        color: ${this.config.textColor};
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
        accent-color: ${this.config.primaryColor};
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

  /**
   * Destroy and cleanup
   */
  public destroy(): void {
    this.container?.remove();
    this.container = null;
  }
}
