/**
 * Screenshot Preview and Annotation UI
 * Provides the UI for previewing and annotating screenshots
 */

import { createElement, createElementFromHTML } from "./dom";
import { icons } from "./icons";
import { AnnotationCanvas, AnnotationTool } from "./annotate";
import { captureScreenshot, compressImage, CaptureResult } from "./capture";
import type { WidgetConfig } from "./types";

export interface ScreenshotUICallbacks {
  onConfirm: (result: CaptureResult) => void;
  onCancel: () => void;
}

/**
 * Screenshot UI Manager
 * Handles the full screenshot workflow: capture, annotate, confirm
 */
export class ScreenshotUI {
  private config: WidgetConfig;
  private callbacks: ScreenshotUICallbacks;
  private container: HTMLElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private annotationCanvas: AnnotationCanvas | null = null;
  private currentTool: AnnotationTool = "pen";
  private capturedImage: CaptureResult | null = null;

  constructor(config: WidgetConfig, callbacks: ScreenshotUICallbacks) {
    this.config = config;
    this.callbacks = callbacks;
  }

  /**
   * Start the screenshot capture flow
   */
  public async start(): Promise<void> {
    try {
      // Capture the screenshot
      this.capturedImage = await captureScreenshot();

      // Show the preview UI
      this.showPreviewUI();
    } catch (error) {
      console.error("FeedbackFlow: Screenshot capture failed", error);
      this.callbacks.onCancel();
    }
  }

  /**
   * Show the preview and annotation UI
   */
  private showPreviewUI(): void {
    if (!this.capturedImage) return;

    // Create fullscreen overlay
    this.container = createElement("div", {
      className: "ff-screenshot-overlay",
    });

    // Create the UI structure
    const ui = this.createUI();
    this.container.appendChild(ui);
    document.body.appendChild(this.container);

    // Set up the canvas with the captured image
    this.setupCanvas();

    // Add styles
    this.injectStyles();
  }

  /**
   * Create the UI elements
   */
  private createUI(): HTMLElement {
    const wrapper = createElement("div", { className: "ff-screenshot-wrapper" });

    // Header with title and close
    const header = createElement("div", { className: "ff-screenshot-header" }, [
      createElement("h3", { className: "ff-screenshot-title" }, ["Annotate Screenshot"]),
      this.createCloseButton(),
    ]);

    // Canvas container
    const canvasContainer = createElement("div", { className: "ff-screenshot-canvas-container" });
    this.canvas = createElement("canvas", { className: "ff-screenshot-canvas" });
    canvasContainer.appendChild(this.canvas);

    // Toolbar
    const toolbar = this.createToolbar();

    // Actions
    const actions = this.createActions();

    wrapper.appendChild(header);
    wrapper.appendChild(toolbar);
    wrapper.appendChild(canvasContainer);
    wrapper.appendChild(actions);

    return wrapper;
  }

  /**
   * Create close button
   */
  private createCloseButton(): HTMLElement {
    const button = createElement(
      "button",
      {
        className: "ff-screenshot-close",
        type: "button",
        "aria-label": "Cancel",
      },
      [createElementFromHTML(icons.close)]
    );

    button.addEventListener("click", () => this.cancel());
    return button;
  }

  /**
   * Create toolbar with annotation tools
   */
  private createToolbar(): HTMLElement {
    const toolbar = createElement("div", { className: "ff-screenshot-toolbar" });

    const tools: { tool: AnnotationTool; icon: string; label: string }[] = [
      { tool: "pen", icon: "pen", label: "Pen" },
      { tool: "highlighter", icon: "highlighter", label: "Highlighter" },
      { tool: "arrow", icon: "arrow", label: "Arrow" },
      { tool: "circle", icon: "circle", label: "Circle" },
    ];

    tools.forEach(({ tool, icon, label }) => {
      const button = createElement(
        "button",
        {
          className: `ff-tool-button ${tool === this.currentTool ? "ff-active" : ""}`,
          type: "button",
          "data-tool": tool,
          title: label,
        },
        [createElementFromHTML(this.getToolIcon(icon))]
      );

      button.addEventListener("click", () => {
        this.setTool(tool);
        // Update active state
        toolbar.querySelectorAll(".ff-tool-button").forEach((btn) => {
          btn.classList.remove("ff-active");
        });
        button.classList.add("ff-active");
      });

      toolbar.appendChild(button);
    });

    // Add separator
    toolbar.appendChild(createElement("div", { className: "ff-toolbar-separator" }));

    // Undo button
    const undoButton = createElement(
      "button",
      {
        className: "ff-tool-button",
        type: "button",
        title: "Undo",
      },
      [createElementFromHTML(this.getToolIcon("undo"))]
    );
    undoButton.addEventListener("click", () => this.annotationCanvas?.undo());
    toolbar.appendChild(undoButton);

    // Clear button
    const clearButton = createElement(
      "button",
      {
        className: "ff-tool-button",
        type: "button",
        title: "Clear all",
      },
      [createElementFromHTML(this.getToolIcon("clear"))]
    );
    clearButton.addEventListener("click", () => this.annotationCanvas?.clear());
    toolbar.appendChild(clearButton);

    return toolbar;
  }

  /**
   * Create action buttons
   */
  private createActions(): HTMLElement {
    const actions = createElement("div", { className: "ff-screenshot-actions" });

    // Retake button
    const retakeButton = createElement(
      "button",
      {
        className: "ff-screenshot-btn ff-btn-secondary",
        type: "button",
      },
      ["Retake"]
    );
    retakeButton.addEventListener("click", () => this.retake());

    // Confirm button
    const confirmButton = createElement(
      "button",
      {
        className: "ff-screenshot-btn ff-btn-primary",
        type: "button",
      },
      ["Use Screenshot"]
    );
    confirmButton.addEventListener("click", () => this.confirm());

    actions.appendChild(retakeButton);
    actions.appendChild(confirmButton);

    return actions;
  }

  /**
   * Get SVG icon for tool
   */
  private getToolIcon(icon: string): string {
    const toolIcons: Record<string, string> = {
      pen: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 19l7-7 3 3-7 7-3-3z"></path>
        <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path>
        <path d="M2 2l7.586 7.586"></path>
        <circle cx="11" cy="11" r="2"></circle>
      </svg>`,
      highlighter: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="m9 11-6 6v3h9l3-3"></path>
        <path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4"></path>
      </svg>`,
      arrow: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="5" y1="12" x2="19" y2="12"></line>
        <polyline points="12 5 19 12 12 19"></polyline>
      </svg>`,
      circle: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
      </svg>`,
      undo: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 7v6h6"></path>
        <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"></path>
      </svg>`,
      clear: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 6h18"></path>
        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
      </svg>`,
    };
    return toolIcons[icon] || "";
  }

  /**
   * Set up the annotation canvas
   */
  private async setupCanvas(): Promise<void> {
    if (!this.canvas || !this.capturedImage) return;

    this.annotationCanvas = new AnnotationCanvas(this.canvas);
    await this.annotationCanvas.setBackgroundImage(this.capturedImage.dataUrl);
    this.annotationCanvas.setTool(this.currentTool);
  }

  /**
   * Set the active annotation tool
   */
  private setTool(tool: AnnotationTool): void {
    this.currentTool = tool;
    this.annotationCanvas?.setTool(tool);
  }

  /**
   * Retake the screenshot
   */
  private async retake(): Promise<void> {
    this.destroy();

    try {
      this.capturedImage = await captureScreenshot();
      this.showPreviewUI();
    } catch (error) {
      console.error("FeedbackFlow: Screenshot retake failed", error);
      this.callbacks.onCancel();
    }
  }

  /**
   * Confirm and use the screenshot
   */
  private async confirm(): Promise<void> {
    if (!this.annotationCanvas) return;

    try {
      // Get the annotated image
      const dataUrl = this.annotationCanvas.getDataUrl("image/png");
      const blob = await this.annotationCanvas.getBlob("image/png");

      // Compress for upload
      const compressed = await compressImage(dataUrl, 1920, 0.85);

      this.destroy();
      this.callbacks.onConfirm(compressed);
    } catch (error) {
      console.error("FeedbackFlow: Failed to process screenshot", error);
      this.callbacks.onCancel();
    }
  }

  /**
   * Cancel and close
   */
  private cancel(): void {
    this.destroy();
    this.callbacks.onCancel();
  }

  /**
   * Inject styles for screenshot UI
   */
  private injectStyles(): void {
    const styleId = "ff-screenshot-styles";
    if (document.getElementById(styleId)) return;

    const styles = `
      .ff-screenshot-overlay {
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

      .ff-screenshot-wrapper {
        background-color: ${this.config.backgroundColor};
        border: 2px solid ${this.config.primaryColor};
        box-shadow: 8px 8px 0px 0px rgba(0, 0, 0, 1);
        max-width: 90vw;
        max-height: 90vh;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .ff-screenshot-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        background-color: #F3C952;
        border-bottom: 2px solid ${this.config.primaryColor};
      }

      .ff-screenshot-title {
        font-size: 16px;
        font-weight: 600;
        color: ${this.config.textColor};
        margin: 0;
      }

      .ff-screenshot-close {
        background: none;
        border: none;
        padding: 4px;
        cursor: pointer;
        color: ${this.config.textColor};
        display: flex;
        border-radius: 4px;
      }

      .ff-screenshot-close:hover {
        background-color: rgba(0, 0, 0, 0.1);
      }

      .ff-screenshot-close svg {
        width: 20px;
        height: 20px;
      }

      .ff-screenshot-toolbar {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 8px 16px;
        background-color: #f5f5f4;
        border-bottom: 2px solid ${this.config.primaryColor};
      }

      .ff-tool-button {
        background: white;
        border: 2px solid transparent;
        padding: 8px;
        cursor: pointer;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.15s ease;
      }

      .ff-tool-button:hover {
        background-color: #e7e5e4;
      }

      .ff-tool-button.ff-active {
        border-color: ${this.config.primaryColor};
        background-color: white;
        box-shadow: 2px 2px 0px 0px rgba(0, 0, 0, 0.5);
      }

      .ff-tool-button svg {
        width: 20px;
        height: 20px;
        color: ${this.config.textColor};
      }

      .ff-toolbar-separator {
        width: 1px;
        height: 24px;
        background-color: #d6d3d1;
        margin: 0 8px;
      }

      .ff-screenshot-canvas-container {
        flex: 1;
        overflow: auto;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
        background-color: #e8e6e1;
        min-height: 200px;
      }

      .ff-screenshot-canvas {
        max-width: 100%;
        max-height: 60vh;
        border: 2px solid ${this.config.primaryColor};
        box-shadow: 4px 4px 0px 0px rgba(0, 0, 0, 0.5);
        cursor: crosshair;
      }

      .ff-screenshot-actions {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        padding: 12px 16px;
        background-color: rgba(0, 0, 0, 0.03);
        border-top: 2px solid ${this.config.primaryColor};
      }

      .ff-screenshot-btn {
        padding: 10px 20px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        border: 2px solid ${this.config.primaryColor};
        transition: all 0.15s ease;
      }

      .ff-btn-secondary {
        background-color: white;
        color: ${this.config.textColor};
      }

      .ff-btn-secondary:hover {
        background-color: #f5f5f4;
      }

      .ff-btn-primary {
        background-color: ${this.config.primaryColor};
        color: white;
        box-shadow: 4px 4px 0px 0px rgba(0, 0, 0, 0.3);
      }

      .ff-btn-primary:hover {
        transform: translate(2px, 2px);
        box-shadow: 2px 2px 0px 0px rgba(0, 0, 0, 0.3);
      }
    `;

    const styleEl = document.createElement("style");
    styleEl.id = styleId;
    styleEl.textContent = styles;
    document.head.appendChild(styleEl);
  }

  /**
   * Destroy and clean up
   */
  public destroy(): void {
    this.annotationCanvas?.destroy();
    this.annotationCanvas = null;
    this.container?.remove();
    this.container = null;
    this.canvas = null;
    this.capturedImage = null;
  }
}
