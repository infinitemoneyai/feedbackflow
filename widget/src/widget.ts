import type { WidgetConfig, WidgetState } from "./types";
import { DEFAULT_CONFIG } from "./types";
import { generateStyles } from "./styles";
import { injectStyles, createWidgetRoot } from "./dom";
import { ScreenshotUI } from "./screenshot-ui";
import { RecordUI } from "./record-ui";
import { SubmitUI } from "./submit-ui";
import { getOfflineQueue } from "./offline-queue";
import type { CaptureResult } from "./capture";
import type { RecordingResult } from "./record";
import { debug } from "./debug";
import { TriggerButton } from "./components/TriggerButton";
import { CornerIndicators } from "./components/CornerIndicators";
import { Modal } from "./components/Modal";
import { HoverDetection } from "./components/HoverDetection";
import { StateManager } from "./components/StateManager";

/**
 * FeedbackFlow Widget Class
 * Orchestrates all widget components and functionality
 */
export class FeedbackFlowWidget {
  private config: WidgetConfig;
  private state: WidgetState;
  private root: HTMLElement | null = null;
  
  // Components
  private triggerButton: TriggerButton;
  private cornerIndicators: CornerIndicators;
  private modal: Modal;
  private hoverDetection: HoverDetection | null = null;
  private stateManager: StateManager | null = null;
  
  // UI Components
  private screenshotUI: ScreenshotUI | null = null;
  private recordUI: RecordUI | null = null;
  private submitUI: SubmitUI | null = null;
  
  // Captured data
  private capturedScreenshot: CaptureResult | null = null;
  private capturedRecording: RecordingResult | null = null;

  constructor(config: Partial<WidgetConfig> & { widgetKey: string }) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
    };

    this.state = {
      isOpen: false,
      isCapturing: false,
      captureMode: null,
    };

    // Initialize components
    this.triggerButton = new TriggerButton(
      this.config,
      () => this.open(),
      () => this.minimize()
    );

    this.cornerIndicators = new CornerIndicators(() => this.restore());

    this.modal = new Modal(
      this.config,
      () => this.close(),
      (mode) => this.startCapture(mode)
    );

    this.init();
  }

  /**
   * Initialize the widget
   */
  private init(): void {
    // Inject styles
    injectStyles(generateStyles(this.config), "ff-widget-styles");

    // Create root container
    this.root = createWidgetRoot();

    // Create and append trigger button
    const buttonElement = this.triggerButton.create();
    this.root.appendChild(buttonElement);

    // Create and append corner indicators
    const indicatorElements = this.cornerIndicators.create();
    indicatorElements.forEach(indicator => this.root?.appendChild(indicator));

    // Create and append modal
    const modalElement = this.modal.create();
    this.root.appendChild(modalElement);

    // Initialize state manager
    this.stateManager = new StateManager(
      this.triggerButton.getElement(),
      this.cornerIndicators.getElements()
    );

    // Initialize hover detection
    this.hoverDetection = new HoverDetection(
      this.config,
      this.triggerButton.getElement(),
      () => this.stateManager?.getIsMinimized() ?? false,
      () => this.state.isOpen
    );

    // Set up event listeners
    this.setupEventListeners();

    // Apply initial state
    this.stateManager.applyInitialState();

    // Initialize offline queue to process any pending submissions
    getOfflineQueue(this.config.apiUrl);
  }

  /**
   * Set up event listeners
   */
  private setupEventListeners(): void {
    // Set up component event listeners
    this.triggerButton.setupEventListeners();
    this.cornerIndicators.setupEventListeners();
    this.modal.setupEventListeners();
    this.hoverDetection?.setup();

    // Escape key to close modal
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.state.isOpen) {
        this.close();
      }
    });

    // Listen for switch-to-screenshot event (from recording UI when not supported)
    window.addEventListener("ff:switch-to-screenshot", () => {
      this.startCapture("screenshot");
    });
  }

  /**
   * Open the modal
   */
  public open(): void {
    if (this.state.isOpen) return;

    this.state.isOpen = true;
    this.modal.show();
    this.triggerButton.getTriggerButton()?.setAttribute("aria-expanded", "true");

    // Focus trap - focus first focusable element
    const firstFocusable = this.modal.getElement()?.querySelector(
      "button, [href], input, select, textarea"
    ) as HTMLElement;
    firstFocusable?.focus();
  }

  /**
   * Close the modal
   */
  public close(): void {
    if (!this.state.isOpen) return;

    this.state.isOpen = false;
    this.modal.hide();
    this.triggerButton.getTriggerButton()?.setAttribute("aria-expanded", "false");

    // Return focus to trigger button
    this.triggerButton.getTriggerButton()?.focus();
  }

  /**
   * Minimize the widget
   */
  private minimize(): void {
    this.stateManager?.minimize();
  }

  /**
   * Restore the widget
   */
  private restore(): void {
    this.stateManager?.restore();
  }

  /**
   * Start capture (screenshot or recording)
   */
  private startCapture(mode: "screenshot" | "record"): void {
    this.state.captureMode = mode;
    this.state.isCapturing = true;

    // Close modal to allow capture
    this.close();

    // Dispatch event for capture handlers
    const event = new CustomEvent("ff:capture-start", {
      detail: { mode, widgetKey: this.config.widgetKey },
    });
    window.dispatchEvent(event);

    if (mode === "screenshot") {
      this.startScreenshotCapture();
    } else if (mode === "record") {
      this.startRecordingCapture();
    }
  }

  /**
   * Start screenshot capture flow
   */
  private startScreenshotCapture(): void {
    this.screenshotUI = new ScreenshotUI(this.config, {
      onConfirm: (result) => {
        this.handleScreenshotConfirm(result);
      },
      onCancel: () => {
        this.handleScreenshotCancel();
      },
    });

    this.screenshotUI.start();
  }

  /**
   * Handle screenshot confirmation
   */
  private handleScreenshotConfirm(result: CaptureResult): void {
    this.capturedScreenshot = result;
    this.state.isCapturing = false;

    // Dispatch event with captured screenshot
    const event = new CustomEvent("ff:screenshot-captured", {
      detail: {
        widgetKey: this.config.widgetKey,
        screenshot: result,
      },
    });
    window.dispatchEvent(event);

    debug.log("Screenshot captured", {
      width: result.width,
      height: result.height,
      size: result.blob ? `${(result.blob.size / 1024).toFixed(2)}KB` : "unknown",
    });

    // Clean up screenshot UI
    this.screenshotUI?.destroy();
    this.screenshotUI = null;

    // Show submission form
    this.showSubmitForm();
  }

  /**
   * Handle screenshot cancellation
   */
  private handleScreenshotCancel(): void {
    this.state.isCapturing = false;
    this.state.captureMode = null;
    this.capturedScreenshot = null;
    this.screenshotUI?.destroy();
    this.screenshotUI = null;
  }

  /**
   * Start recording capture flow
   */
  private startRecordingCapture(): void {
    this.recordUI = new RecordUI(this.config, {
      onConfirm: (result) => {
        this.handleRecordingConfirm(result);
      },
      onCancel: () => {
        this.handleRecordingCancel();
      },
    });

    this.recordUI.start();
  }

  /**
   * Handle recording confirmation
   */
  private handleRecordingConfirm(result: RecordingResult): void {
    this.capturedRecording = result;
    this.state.isCapturing = false;

    // Dispatch event with captured recording
    const event = new CustomEvent("ff:recording-captured", {
      detail: {
        widgetKey: this.config.widgetKey,
        recording: {
          duration: result.duration,
          mimeType: result.mimeType,
          size: result.blob.size,
        },
      },
    });
    window.dispatchEvent(event);

    debug.log("Recording captured", {
      duration: `${(result.duration / 1000).toFixed(1)}s`,
      size: `${(result.blob.size / (1024 * 1024)).toFixed(2)}MB`,
      mimeType: result.mimeType,
    });

    // Clean up
    this.recordUI?.destroy();
    this.recordUI = null;

    // Show submission form
    this.showSubmitForm();
  }

  /**
   * Handle recording cancellation
   */
  private handleRecordingCancel(): void {
    this.state.isCapturing = false;
    this.state.captureMode = null;
    this.capturedRecording = null;
    this.recordUI?.destroy();
    this.recordUI = null;
  }

  /**
   * Show the submission form
   */
  private showSubmitForm(): void {
    this.submitUI = new SubmitUI(
      this.config,
      {
        onSuccess: (feedbackId: string) => {
          this.handleSubmissionSuccess(feedbackId);
        },
        onCancel: () => {
          this.handleSubmissionCancel();
        },
        onError: (error: string) => {
          this.handleSubmissionError(error);
        },
      },
      this.capturedScreenshot,
      this.capturedRecording
    );

    this.submitUI.show();
  }

  /**
   * Handle successful submission
   */
  private handleSubmissionSuccess(feedbackId: string): void {
    // Dispatch success event
    const event = new CustomEvent("ff:submission-success", {
      detail: {
        widgetKey: this.config.widgetKey,
        feedbackId,
      },
    });
    window.dispatchEvent(event);

    debug.log("Feedback submitted successfully", { feedbackId });

    // Clean up
    this.cleanupAfterSubmission();
  }

  /**
   * Handle submission cancellation
   */
  private handleSubmissionCancel(): void {
    debug.log("Submission cancelled");
    this.cleanupAfterSubmission();
  }

  /**
   * Handle submission error
   */
  private handleSubmissionError(error: string): void {
    // Dispatch error event
    const event = new CustomEvent("ff:submission-error", {
      detail: {
        widgetKey: this.config.widgetKey,
        error,
      },
    });
    window.dispatchEvent(event);

    debug.warn("Submission error", { error });
    this.cleanupAfterSubmission();
  }

  /**
   * Clean up after submission (success, cancel, or error)
   */
  private cleanupAfterSubmission(): void {
    this.submitUI?.destroy();
    this.submitUI = null;
    this.capturedScreenshot = null;
    this.capturedRecording = null;
    this.state.captureMode = null;
  }

  /**
   * Get captured screenshot
   */
  public getCapturedScreenshot(): CaptureResult | null {
    return this.capturedScreenshot;
  }

  /**
   * Get captured recording
   */
  public getCapturedRecording(): RecordingResult | null {
    return this.capturedRecording;
  }

  /**
   * Get current configuration
   */
  public getConfig(): WidgetConfig {
    return { ...this.config };
  }

  /**
   * Get current state
   */
  public getState(): WidgetState {
    return { ...this.state };
  }

  /**
   * Destroy the widget
   */
  public destroy(): void {
    this.screenshotUI?.destroy();
    this.screenshotUI = null;
    this.recordUI?.destroy();
    this.recordUI = null;
    this.submitUI?.destroy();
    this.submitUI = null;
    this.hoverDetection?.destroy();
    this.hoverDetection = null;
    this.root?.remove();
    document.getElementById("ff-widget-styles")?.remove();
    document.getElementById("ff-screenshot-styles")?.remove();
    document.getElementById("ff-recording-styles")?.remove();
    document.getElementById("ff-submit-styles")?.remove();
  }
}
