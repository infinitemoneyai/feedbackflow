/**
 * Screen Recording UI
 * Provides UI for recording indicator and preview playback
 */

import { createElement, createElementFromHTML } from "./dom";
import { icons } from "./icons";
import {
  ScreenRecorder,
  RecordingResult,
  formatDuration,
  getMaxDuration,
} from "./record";
import { isMobileDevice, isScreenRecordingSupported } from "./mobile-utils";
import type { WidgetConfig } from "./types";
import { debug } from "./debug";

export interface RecordUICallbacks {
  onConfirm: (result: RecordingResult) => void;
  onCancel: () => void;
}

type RecordingState = "idle" | "recording" | "preview";

/**
 * Recording UI Manager
 * Handles the full recording workflow: record, preview, confirm
 */
export class RecordUI {
  private config: WidgetConfig;
  private callbacks: RecordUICallbacks;
  private recorder: ScreenRecorder | null = null;
  private recordingResult: RecordingResult | null = null;
  private state: RecordingState = "idle";
  private indicatorElement: HTMLElement | null = null;
  private previewElement: HTMLElement | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private timerElement: HTMLElement | null = null;
  private objectUrl: string | null = null;

  constructor(config: WidgetConfig, callbacks: RecordUICallbacks) {
    this.config = config;
    this.callbacks = callbacks;
    this.injectStyles();
  }

  /**
   * Start the recording flow
   */
  public async start(): Promise<void> {
    // Check for mobile devices first
    if (isMobileDevice()) {
      this.showMobileUnsupportedMessage();
      return;
    }

    if (!ScreenRecorder.isSupported() || !isScreenRecordingSupported()) {
      this.showUnsupportedMessage();
      return;
    }

    try {
      this.state = "recording";
      this.showRecordingIndicator();

      this.recorder = new ScreenRecorder({
        onStart: () => {
          debug.log("Recording started");
        },
        onStop: (result) => {
          this.handleRecordingComplete(result);
        },
        onError: (error) => {
          debug.error("Recording error", error);
          this.hideRecordingIndicator();
          this.callbacks.onCancel();
        },
        onTimeUpdate: (elapsed) => {
          this.updateTimer(elapsed);
        },
      });

      await this.recorder.start();
    } catch (error) {
      debug.error("Failed to start recording", error);
      this.hideRecordingIndicator();
      this.callbacks.onCancel();
    }
  }

  /**
   * Show mobile-specific unsupported message
   */
  private showMobileUnsupportedMessage(): void {
    this.showMessageOverlay(
      "Recording Not Available on Mobile",
      "Screen recording requires a desktop browser. You can still take a screenshot to share feedback!",
      [
        { text: "Take Screenshot Instead", action: "screenshot", primary: true },
        { text: "Cancel", action: "cancel", primary: false },
      ]
    );
  }

  /**
   * Show general unsupported message
   */
  private showUnsupportedMessage(): void {
    this.showMessageOverlay(
      "Recording Not Supported",
      "Your browser doesn't support screen recording. Try using Chrome, Edge, or Firefox on desktop.",
      [
        { text: "Take Screenshot Instead", action: "screenshot", primary: true },
        { text: "Cancel", action: "cancel", primary: false },
      ]
    );
  }

  /**
   * Show a message overlay with action buttons
   */
  private showMessageOverlay(
    title: string,
    message: string,
    buttons: Array<{ text: string; action: string; primary: boolean }>
  ): void {
    const overlay = createElement("div", {
      className: "ff-recording-preview-overlay",
    });

    const wrapper = createElement("div", { className: "ff-recording-message-wrapper" });

    const content = createElement("div", { className: "ff-recording-message-content" }, [
      createElement("div", { className: "ff-recording-message-icon" }, [
        createElementFromHTML(icons.video),
      ]),
      createElement("h3", { className: "ff-recording-message-title" }, [title]),
      createElement("p", { className: "ff-recording-message-text" }, [message]),
    ]);

    const actions = createElement("div", { className: "ff-recording-message-actions" });

    buttons.forEach(({ text, action, primary }) => {
      const button = createElement(
        "button",
        {
          className: `ff-recording-btn ff-btn-${primary ? "primary" : "secondary"}`,
          type: "button",
        },
        [text]
      );

      button.addEventListener("click", () => {
        overlay.remove();
        if (action === "cancel") {
          this.callbacks.onCancel();
        } else if (action === "screenshot") {
          // Dispatch event to switch to screenshot mode
          const event = new CustomEvent("ff:switch-to-screenshot", {
            detail: { widgetKey: this.config.widgetKey },
          });
          window.dispatchEvent(event);
          this.callbacks.onCancel();
        }
      });

      actions.appendChild(button);
    });

    wrapper.appendChild(content);
    wrapper.appendChild(actions);
    overlay.appendChild(wrapper);
    document.body.appendChild(overlay);
  }

  /**
   * Show recording indicator
   */
  private showRecordingIndicator(): void {
    this.indicatorElement = createElement("div", {
      className: "ff-recording-indicator",
    });

    const content = createElement("div", { className: "ff-recording-content" }, [
      // Pulsing red dot
      createElement("div", { className: "ff-recording-dot" }),
      // Text
      createElement("span", { className: "ff-recording-text" }, ["Recording"]),
      // Timer
      createElement("span", { className: "ff-recording-timer" }, ["00:00"]),
      // Separator
      createElement("span", { className: "ff-recording-separator" }, [" / "]),
      // Max time
      createElement("span", { className: "ff-recording-max" }, [
        formatDuration(getMaxDuration()),
      ]),
    ]);

    // Stop button
    const stopButton = createElement(
      "button",
      {
        className: "ff-recording-stop",
        type: "button",
      },
      [createElementFromHTML(icons.stop || icons.close), "Stop"]
    );

    stopButton.addEventListener("click", () => this.stopRecording());

    this.indicatorElement.appendChild(content);
    this.indicatorElement.appendChild(stopButton);
    document.body.appendChild(this.indicatorElement);

    // Store timer reference
    this.timerElement = this.indicatorElement.querySelector(".ff-recording-timer");
  }

  /**
   * Update timer display
   */
  private updateTimer(elapsed: number): void {
    if (this.timerElement) {
      this.timerElement.textContent = formatDuration(elapsed);
    }
  }

  /**
   * Hide recording indicator
   */
  private hideRecordingIndicator(): void {
    this.indicatorElement?.remove();
    this.indicatorElement = null;
    this.timerElement = null;
  }

  /**
   * Stop recording
   */
  private stopRecording(): void {
    this.recorder?.stop();
  }

  /**
   * Handle recording complete
   */
  private handleRecordingComplete(result: RecordingResult): void {
    this.recordingResult = result;
    this.state = "preview";
    this.hideRecordingIndicator();
    this.showPreview();
  }

  /**
   * Show preview UI
   */
  private showPreview(): void {
    if (!this.recordingResult) return;

    // Create object URL for preview
    this.objectUrl = URL.createObjectURL(this.recordingResult.blob);

    // Create preview overlay
    this.previewElement = createElement("div", {
      className: "ff-recording-preview-overlay",
    });

    const wrapper = createElement("div", { className: "ff-recording-preview-wrapper" });

    // Header
    const header = createElement("div", { className: "ff-recording-preview-header" }, [
      createElement("h3", { className: "ff-recording-preview-title" }, [
        "Preview Recording",
      ]),
      this.createCloseButton(),
    ]);

    // Video container
    const videoContainer = createElement("div", {
      className: "ff-recording-preview-video-container",
    });

    this.videoElement = createElement("video", {
      className: "ff-recording-preview-video",
    }) as HTMLVideoElement;
    this.videoElement.src = this.objectUrl;
    this.videoElement.controls = true;
    this.videoElement.playsInline = true;

    videoContainer.appendChild(this.videoElement);

    // Info
    const info = createElement("div", { className: "ff-recording-preview-info" }, [
      createElement("span", { className: "ff-recording-info-item" }, [
        `Duration: ${formatDuration(this.recordingResult.duration)}`,
      ]),
      createElement("span", { className: "ff-recording-info-item" }, [
        `Size: ${(this.recordingResult.blob.size / (1024 * 1024)).toFixed(2)} MB`,
      ]),
    ]);

    // Actions
    const actions = createElement("div", { className: "ff-recording-preview-actions" }, [
      this.createButton("Retake", "secondary", () => this.retake()),
      this.createButton("Use Recording", "primary", () => this.confirm()),
    ]);

    wrapper.appendChild(header);
    wrapper.appendChild(videoContainer);
    wrapper.appendChild(info);
    wrapper.appendChild(actions);
    this.previewElement.appendChild(wrapper);
    document.body.appendChild(this.previewElement);
  }

  /**
   * Create close button
   */
  private createCloseButton(): HTMLElement {
    const button = createElement(
      "button",
      {
        className: "ff-recording-preview-close",
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
        className: `ff-recording-btn ff-btn-${variant}`,
        type: "button",
      },
      [text]
    );

    button.addEventListener("click", onClick);
    return button;
  }

  /**
   * Hide preview
   */
  private hidePreview(): void {
    this.previewElement?.remove();
    this.previewElement = null;
    this.videoElement = null;

    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
  }

  /**
   * Retake recording
   */
  private async retake(): Promise<void> {
    this.hidePreview();
    this.recordingResult = null;
    await this.start();
  }

  /**
   * Confirm and use recording
   */
  private confirm(): void {
    if (!this.recordingResult) return;

    const result = this.recordingResult;
    this.hidePreview();
    this.callbacks.onConfirm(result);
  }

  /**
   * Cancel recording
   */
  private cancel(): void {
    this.recorder?.destroy();
    this.hideRecordingIndicator();
    this.hidePreview();
    this.recordingResult = null;
    this.callbacks.onCancel();
  }

  /**
   * Inject styles
   */
  private injectStyles(): void {
    const styleId = "ff-recording-styles";
    if (document.getElementById(styleId)) return;

    const styles = `
      .ff-recording-indicator {
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 2147483647;
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 12px 20px;
        background-color: ${this.config.backgroundColor};
        border: 2px solid ${this.config.primaryColor};
        box-shadow: 4px 4px 0px 0px rgba(0, 0, 0, 1);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
      }

      .ff-recording-content {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .ff-recording-dot {
        width: 12px;
        height: 12px;
        background-color: #E85D52;
        border-radius: 50%;
        animation: ff-pulse 1s ease-in-out infinite;
      }

      @keyframes ff-pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.5; transform: scale(0.9); }
      }

      .ff-recording-text {
        font-weight: 600;
        color: #E85D52;
      }

      .ff-recording-timer {
        font-family: monospace;
        font-weight: 600;
        color: ${this.config.textColor};
      }

      .ff-recording-separator {
        color: #888;
      }

      .ff-recording-max {
        font-family: monospace;
        color: #888;
      }

      .ff-recording-stop {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 16px;
        background-color: #E85D52;
        color: white;
        border: 2px solid ${this.config.primaryColor};
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        box-shadow: 2px 2px 0px 0px rgba(0, 0, 0, 0.5);
        transition: all 0.15s ease;
      }

      .ff-recording-stop:hover {
        transform: translate(1px, 1px);
        box-shadow: 1px 1px 0px 0px rgba(0, 0, 0, 0.5);
      }

      .ff-recording-stop svg {
        width: 16px;
        height: 16px;
      }

      /* Preview */
      .ff-recording-preview-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.9);
        z-index: 2147483647;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      .ff-recording-preview-wrapper {
        background-color: ${this.config.backgroundColor};
        border: 2px solid ${this.config.primaryColor};
        box-shadow: 8px 8px 0px 0px rgba(0, 0, 0, 1);
        max-width: 90vw;
        max-height: 90vh;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .ff-recording-preview-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        background-color: #F3C952;
        border-bottom: 2px solid ${this.config.primaryColor};
      }

      .ff-recording-preview-title {
        font-size: 16px;
        font-weight: 600;
        color: ${this.config.textColor};
        margin: 0;
      }

      .ff-recording-preview-close {
        background: none;
        border: none;
        padding: 4px;
        cursor: pointer;
        color: ${this.config.textColor};
        display: flex;
        border-radius: 4px;
      }

      .ff-recording-preview-close:hover {
        background-color: rgba(0, 0, 0, 0.1);
      }

      .ff-recording-preview-close svg {
        width: 20px;
        height: 20px;
      }

      .ff-recording-preview-video-container {
        padding: 16px;
        background-color: #e8e6e1;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .ff-recording-preview-video {
        max-width: 100%;
        max-height: 50vh;
        border: 2px solid ${this.config.primaryColor};
        box-shadow: 4px 4px 0px 0px rgba(0, 0, 0, 0.5);
      }

      .ff-recording-preview-info {
        display: flex;
        gap: 16px;
        padding: 12px 16px;
        background-color: #f5f5f4;
        border-top: 1px solid #d6d3d1;
        border-bottom: 2px solid ${this.config.primaryColor};
      }

      .ff-recording-info-item {
        font-size: 13px;
        color: #666;
      }

      .ff-recording-preview-actions {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        padding: 12px 16px;
        background-color: rgba(0, 0, 0, 0.03);
      }

      .ff-recording-btn {
        padding: 10px 20px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        border: 2px solid ${this.config.primaryColor};
        transition: all 0.15s ease;
      }

      .ff-recording-btn.ff-btn-secondary {
        background-color: white;
        color: ${this.config.textColor};
      }

      .ff-recording-btn.ff-btn-secondary:hover {
        background-color: #f5f5f4;
      }

      .ff-recording-btn.ff-btn-primary {
        background-color: ${this.config.primaryColor};
        color: white;
        box-shadow: 4px 4px 0px 0px rgba(0, 0, 0, 0.3);
      }

      .ff-recording-btn.ff-btn-primary:hover {
        transform: translate(2px, 2px);
        box-shadow: 2px 2px 0px 0px rgba(0, 0, 0, 0.3);
      }

      /* Message overlay for unsupported browsers */
      .ff-recording-message-wrapper {
        background-color: ${this.config.backgroundColor};
        border: 2px solid ${this.config.primaryColor};
        box-shadow: 8px 8px 0px 0px rgba(0, 0, 0, 1);
        max-width: 400px;
        margin: 20px;
        overflow: hidden;
      }

      .ff-recording-message-content {
        padding: 24px;
        text-align: center;
      }

      .ff-recording-message-icon {
        width: 48px;
        height: 48px;
        margin: 0 auto 16px;
        color: ${this.config.primaryColor};
        opacity: 0.6;
      }

      .ff-recording-message-icon svg {
        width: 100%;
        height: 100%;
      }

      .ff-recording-message-title {
        font-size: 18px;
        font-weight: 600;
        color: ${this.config.textColor};
        margin: 0 0 8px;
      }

      .ff-recording-message-text {
        font-size: 14px;
        color: #666;
        margin: 0;
        line-height: 1.5;
      }

      .ff-recording-message-actions {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 16px 24px 24px;
      }

      @media (min-width: 400px) {
        .ff-recording-message-actions {
          flex-direction: row;
          justify-content: center;
        }
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
    this.recorder?.destroy();
    this.hideRecordingIndicator();
    this.hidePreview();
    this.recordingResult = null;
  }
}
