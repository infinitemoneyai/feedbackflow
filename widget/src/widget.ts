import type { WidgetConfig, WidgetState } from "./types";
import { DEFAULT_CONFIG } from "./types";
import { generateStyles } from "./styles";
import { icons } from "./icons";
import {
  createElement,
  createElementFromHTML,
  injectStyles,
  createWidgetRoot,
} from "./dom";

/**
 * FeedbackFlow Widget Class
 * Handles all widget functionality without external dependencies
 */
export class FeedbackFlowWidget {
  private config: WidgetConfig;
  private state: WidgetState;
  private root: HTMLElement | null = null;
  private triggerButton: HTMLElement | null = null;
  private modalOverlay: HTMLElement | null = null;

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

    // Create trigger button
    this.createTriggerButton();

    // Create modal
    this.createModal();

    // Set up event listeners
    this.setupEventListeners();
  }

  /**
   * Create the floating trigger button
   */
  private createTriggerButton(): void {
    this.triggerButton = createElement(
      "button",
      {
        className: "ff-trigger-button",
        "aria-label": "Open feedback widget",
        type: "button",
      },
      [createElementFromHTML(icons.feedback), this.config.buttonText]
    );

    this.root?.appendChild(this.triggerButton);
  }

  /**
   * Create the modal overlay and content
   */
  private createModal(): void {
    // Create overlay
    this.modalOverlay = createElement("div", {
      className: "ff-modal-overlay",
      role: "dialog",
      "aria-modal": "true",
      "aria-labelledby": "ff-modal-title",
    });

    // Create modal container
    const modal = createElement("div", { className: "ff-modal" });

    // Create header
    const header = createElement("div", { className: "ff-modal-header" }, [
      createElement("h2", { className: "ff-modal-title", id: "ff-modal-title" }, [
        "Share Feedback",
      ]),
      this.createCloseButton(),
    ]);

    // Create content with capture options
    const content = createElement("div", { className: "ff-modal-content" }, [
      this.createCaptureOptions(),
    ]);

    // Create footer
    const footer = createElement("div", { className: "ff-modal-footer" }, [
      createElement("div", { className: "ff-powered-by" }, [
        "Powered by ",
        createElement("a", { href: "https://feedbackflow.dev", target: "_blank" }, [
          "FeedbackFlow",
        ]),
      ]),
    ]);

    // Assemble modal
    modal.appendChild(header);
    modal.appendChild(content);
    modal.appendChild(footer);
    this.modalOverlay.appendChild(modal);
    this.root?.appendChild(this.modalOverlay);
  }

  /**
   * Create close button
   */
  private createCloseButton(): HTMLElement {
    const button = createElement(
      "button",
      {
        className: "ff-close-button",
        "aria-label": "Close feedback widget",
        type: "button",
      },
      [createElementFromHTML(icons.close)]
    );

    return button;
  }

  /**
   * Create capture options (screenshot and record)
   */
  private createCaptureOptions(): HTMLElement {
    const container = createElement("div", { className: "ff-capture-options" });

    // Screenshot option
    const screenshotOption = createElement(
      "button",
      {
        className: "ff-capture-option",
        "data-capture-type": "screenshot",
        type: "button",
      },
      [
        createElement("div", { className: "ff-capture-icon ff-screenshot" }, [
          createElementFromHTML(icons.camera),
        ]),
        createElement("div", { className: "ff-capture-text" }, [
          createElement("p", { className: "ff-capture-title" }, [
            "Take a Screenshot",
          ]),
          createElement("p", { className: "ff-capture-description" }, [
            "Capture and annotate your screen",
          ]),
        ]),
      ]
    );

    // Record option
    const recordOption = createElement(
      "button",
      {
        className: "ff-capture-option",
        "data-capture-type": "record",
        type: "button",
      },
      [
        createElement("div", { className: "ff-capture-icon ff-record" }, [
          createElementFromHTML(icons.video),
        ]),
        createElement("div", { className: "ff-capture-text" }, [
          createElement("p", { className: "ff-capture-title" }, [
            "Record Your Screen",
          ]),
          createElement("p", { className: "ff-capture-description" }, [
            "Record with voice narration (up to 2 min)",
          ]),
        ]),
      ]
    );

    container.appendChild(screenshotOption);
    container.appendChild(recordOption);

    return container;
  }

  /**
   * Set up event listeners
   */
  private setupEventListeners(): void {
    // Trigger button click
    this.triggerButton?.addEventListener("click", () => {
      this.open();
    });

    // Close button click
    this.modalOverlay
      ?.querySelector(".ff-close-button")
      ?.addEventListener("click", () => {
        this.close();
      });

    // Overlay click (close on backdrop click)
    this.modalOverlay?.addEventListener("click", (e) => {
      if (e.target === this.modalOverlay) {
        this.close();
      }
    });

    // Escape key to close
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.state.isOpen) {
        this.close();
      }
    });

    // Capture option clicks
    this.modalOverlay
      ?.querySelectorAll(".ff-capture-option")
      .forEach((option) => {
        option.addEventListener("click", () => {
          const captureType = option.getAttribute("data-capture-type") as
            | "screenshot"
            | "record"
            | null;
          if (captureType) {
            this.startCapture(captureType);
          }
        });
      });
  }

  /**
   * Open the modal
   */
  public open(): void {
    if (this.state.isOpen) return;

    this.state.isOpen = true;
    this.modalOverlay?.classList.add("ff-visible");
    this.triggerButton?.setAttribute("aria-expanded", "true");

    // Focus trap - focus first focusable element
    const firstFocusable = this.modalOverlay?.querySelector(
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
    this.modalOverlay?.classList.remove("ff-visible");
    this.triggerButton?.setAttribute("aria-expanded", "false");

    // Return focus to trigger button
    this.triggerButton?.focus();
  }

  /**
   * Start capture (screenshot or recording)
   * Note: Actual capture implementation will be in FF-009 and FF-010
   */
  private startCapture(mode: "screenshot" | "record"): void {
    this.state.captureMode = mode;
    this.state.isCapturing = true;

    // Close modal to allow capture
    this.close();

    // Dispatch event for capture handlers (to be implemented)
    const event = new CustomEvent("ff:capture-start", {
      detail: { mode, widgetKey: this.config.widgetKey },
    });
    window.dispatchEvent(event);

    // Placeholder: Log for now (will be replaced with actual capture)
    console.log(`FeedbackFlow: Starting ${mode} capture...`);
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
    this.root?.remove();
    document.getElementById("ff-widget-styles")?.remove();
  }
}
