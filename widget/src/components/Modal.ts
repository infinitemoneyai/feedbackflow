import type { WidgetConfig } from "../types";
import { createElement, createElementFromHTML } from "../dom";
import { icons } from "../icons";
import { isMobileDevice, isScreenRecordingSupported } from "../mobile-utils";

/**
 * Modal Component
 * Handles the creation and management of the feedback modal
 */
export class Modal {
  private modalOverlay: HTMLElement | null = null;

  constructor(
    private config: WidgetConfig,
    private onClose: () => void,
    private onCaptureStart: (mode: "screenshot" | "record") => void
  ) {}

  /**
   * Create and return the modal overlay element
   */
  public create(): HTMLElement {
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
    const header = this.createHeader();

    // Create content with capture options
    const content = createElement("div", { className: "ff-modal-content" }, [
      this.createCaptureOptions(),
    ]);

    // Create footer
    const footer = this.createFooter();

    // Assemble modal
    modal.appendChild(header);
    modal.appendChild(content);
    modal.appendChild(footer);
    this.modalOverlay.appendChild(modal);

    return this.modalOverlay;
  }

  /**
   * Create modal header
   */
  private createHeader(): HTMLElement {
    const closeButton = createElement(
      "button",
      {
        className: "ff-close-button",
        "aria-label": "Close feedback widget",
        type: "button",
      },
      [createElementFromHTML(icons.close)]
    );

    return createElement("div", { className: "ff-modal-header" }, [
      createElement("h2", { className: "ff-modal-title", id: "ff-modal-title" }, [
        "Share Feedback",
      ]),
      closeButton,
    ]);
  }

  /**
   * Create capture options (screenshot and record)
   */
  private createCaptureOptions(): HTMLElement {
    const container = createElement("div", { className: "ff-capture-options" });
    const isMobile = isMobileDevice();
    const canRecord = isScreenRecordingSupported() && !isMobile;

    // Screenshot option
    const screenshotDescription = isMobile
      ? "Take a photo or select from gallery"
      : "Capture and annotate your screen";

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
            isMobile ? "Add a Photo" : "Take a Screenshot",
          ]),
          createElement("p", { className: "ff-capture-description" }, [
            screenshotDescription,
          ]),
        ]),
      ]
    );

    // Record option
    const recordOptionClasses = canRecord
      ? "ff-capture-option"
      : "ff-capture-option ff-capture-option-disabled";

    const recordDescription = canRecord
      ? "Record with voice narration (up to 2 min)"
      : "Desktop only";

    const recordOption = createElement(
      "button",
      {
        className: recordOptionClasses,
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
            recordDescription,
          ]),
        ]),
      ]
    );

    container.appendChild(screenshotOption);
    container.appendChild(recordOption);

    return container;
  }

  /**
   * Create modal footer
   */
  private createFooter(): HTMLElement {
    const footerContent: (string | HTMLElement)[] = [
      "Powered by ",
      createElement("a", { href: "https://feedbackflow.cc", target: "_blank" }, [
        "FeedbackFlow",
      ]),
    ];

    // Add privacy policy link if configured
    if (this.config.privacyPolicyUrl) {
      footerContent.push(
        " · ",
        createElement(
          "a",
          { href: this.config.privacyPolicyUrl, target: "_blank" },
          ["Privacy Policy"]
        )
      );
    }

    return createElement("div", { className: "ff-modal-footer" }, [
      createElement("div", { className: "ff-powered-by" }, footerContent),
    ]);
  }

  /**
   * Set up event listeners for the modal
   */
  public setupEventListeners(): void {
    // Close button click
    this.modalOverlay
      ?.querySelector(".ff-close-button")
      ?.addEventListener("click", () => {
        this.onClose();
      });

    // Overlay click (close on backdrop click)
    this.modalOverlay?.addEventListener("click", (e) => {
      if (e.target === this.modalOverlay) {
        this.onClose();
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
            this.onCaptureStart(captureType);
          }
        });
      });
  }

  /**
   * Get the modal overlay element
   */
  public getElement(): HTMLElement | null {
    return this.modalOverlay;
  }

  /**
   * Show the modal
   */
  public show(): void {
    this.modalOverlay?.classList.add("ff-visible");
  }

  /**
   * Hide the modal
   */
  public hide(): void {
    this.modalOverlay?.classList.remove("ff-visible");
  }
}
