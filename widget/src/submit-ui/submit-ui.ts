/**
 * Submission Form UI Manager
 * Orchestrates the submission flow and delegates rendering to component functions
 */

import { createElement, createElementFromHTML } from "../dom";
import { icons } from "../icons";
import type { WidgetConfig } from "../types";
import type { CaptureResult } from "../capture";
import type { RecordingResult } from "../record";
import {
  OfflineQueue,
  getOfflineQueue,
  type SubmissionFormData,
  type SubmissionMetadata,
  type SubmissionResult,
} from "../offline-queue";
import type { SubmitUICallbacks, FormState, SubmitState } from "./types";
import { injectSubmitUIStyles } from "./styles";
import { renderPreviewThumbnail } from "./preview-thumbnail";
import { renderTypeSelector } from "./type-selector";
import { renderTitleField, renderDescriptionField } from "./form-fields";
import { renderOptionalFields } from "./optional-fields";
import { renderConsentSection } from "./consent-section";
import { renderLoadingState, renderSuccessState, renderErrorState } from "./state-views";
import { debug } from "../debug";

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
    injectSubmitUIStyles(this.config);
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
        wrapper.appendChild(renderLoadingState());
        break;
      case "success":
        wrapper.appendChild(
          renderSuccessState(this.feedbackId, this.warningMessage, () => {
            this.callbacks.onSuccess(this.feedbackId);
            this.destroy();
          })
        );
        break;
      case "error":
        wrapper.appendChild(
          renderErrorState(
            this.errorMessage,
            () => {
              this.state = "form";
              this.render();
            },
            () => {
              this.callbacks.onError(this.errorMessage);
              this.destroy();
            }
          )
        );
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
      content.appendChild(renderPreviewThumbnail(this.screenshot, this.recording));
    }

    // Type selector
    content.appendChild(
      renderTypeSelector(this.formState.type, (type) => {
        this.formState.type = type;
        this.render();
      })
    );

    // Title input
    content.appendChild(
      renderTitleField(this.formState.title, (value) => {
        this.formState.title = value;
      })
    );

    // Description textarea
    content.appendChild(
      renderDescriptionField(this.formState.description, (value) => {
        this.formState.description = value;
      })
    );

    // Optional fields section
    content.appendChild(
      renderOptionalFields(
        this.formState.email,
        this.formState.name,
        (value) => {
          this.formState.email = value;
        },
        (value) => {
          this.formState.name = value;
        }
      )
    );

    // Privacy consent section (only shown if privacy policy URL is configured)
    if (this.config.privacyPolicyUrl) {
      content.appendChild(
        renderConsentSection(
          this.config.privacyPolicyUrl,
          this.formState.privacyConsent,
          (checked) => {
            this.formState.privacyConsent = checked;
          }
        )
      );
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
      debug.error("Submission failed", error);

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
    const apiUrl = this.config.apiUrl || "https://feedbackflow.cc/api/widget/submit";

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
      // Send duration in seconds
      formData.append("recordingDuration", (this.recording.duration / 1000).toString());
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

    // Add to queue
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

    debug.log("Feedback queued for retry");
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
   * Destroy and cleanup
   */
  public destroy(): void {
    this.container?.remove();
    this.container = null;
  }
}
