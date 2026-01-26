import type { WidgetConfig } from "../types";
import { createElement, createElementFromHTML } from "../dom";
import { icons } from "../icons";

/**
 * TriggerButton Component
 * Handles the creation and management of the feedback trigger button
 */
export class TriggerButton {
  private buttonContainer: HTMLElement | null = null;
  private triggerButton: HTMLElement | null = null;
  private minimizeButton: HTMLElement | null = null;

  constructor(
    private config: WidgetConfig,
    private onOpen: () => void,
    private onMinimize: () => void
  ) {}

  /**
   * Create and return the button container element
   */
  public create(): HTMLElement {
    this.buttonContainer = createElement("div", { className: "ff-button-container" });
    
    // Create minimize button (inside the main button)
    this.minimizeButton = createElement(
      "button",
      {
        className: "ff-minimize-button",
        "aria-label": "Minimize feedback widget",
        type: "button",
        title: "Hide feedback button (click any corner to show again)",
      },
      [createElementFromHTML(icons.close)]
    );

    this.triggerButton = createElement(
      "button",
      {
        className: "ff-trigger-button",
        "aria-label": "Open feedback widget",
        type: "button",
      },
      [
        createElementFromHTML(icons.feedback), 
        this.config.buttonText,
        this.minimizeButton
      ]
    );

    this.buttonContainer.appendChild(this.triggerButton);
    return this.buttonContainer;
  }

  /**
   * Set up event listeners for the button
   */
  public setupEventListeners(): void {
    this.triggerButton?.addEventListener("click", () => {
      this.onOpen();
    });

    this.minimizeButton?.addEventListener("click", (e) => {
      e.stopPropagation();
      this.onMinimize();
    });
  }

  /**
   * Get the button container element
   */
  public getElement(): HTMLElement | null {
    return this.buttonContainer;
  }

  /**
   * Get the trigger button element
   */
  public getTriggerButton(): HTMLElement | null {
    return this.triggerButton;
  }
}
