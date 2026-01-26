import { createElement } from "../dom";

/**
 * CornerIndicators Component
 * Handles the creation and management of corner indicators for restoring minimized widget
 */
export class CornerIndicators {
  private indicators: HTMLElement[] = [];

  constructor(private onRestore: () => void) {}

  /**
   * Create corner indicators
   */
  public create(): HTMLElement[] {
    const corners = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
    
    this.indicators = corners.map(corner => {
      const indicator = createElement("div", {
        className: `ff-corner-indicator ff-corner-${corner}`,
        "aria-label": "Show feedback widget",
        role: "button",
        tabindex: "0",
      });
      
      return indicator;
    });

    return this.indicators;
  }

  /**
   * Set up event listeners for corner indicators
   */
  public setupEventListeners(): void {
    this.indicators.forEach(indicator => {
      indicator.addEventListener("click", () => {
        this.onRestore();
      });
      
      // Keyboard support
      indicator.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          this.onRestore();
        }
      });
    });
  }

  /**
   * Get all indicator elements
   */
  public getElements(): HTMLElement[] {
    return this.indicators;
  }
}
