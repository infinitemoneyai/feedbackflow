import type { WidgetConfig } from "../types";

/**
 * HoverDetection Component
 * Handles mouse hover detection for slide-up effect
 */
export class HoverDetection {
  private hoverTimeout: number | null = null;
  private readonly hoverZoneSize = 150; // pixels from corner

  constructor(
    private config: WidgetConfig,
    private buttonContainer: HTMLElement | null,
    private isMinimized: () => boolean,
    private isModalOpen: () => boolean
  ) {}

  /**
   * Set up hover detection
   */
  public setup(): void {
    document.addEventListener('mousemove', (e) => {
      this.handleMouseMove(e);
    });
  }

  /**
   * Handle mouse move event
   */
  private handleMouseMove(e: MouseEvent): void {
    // Skip if widget is minimized or modal is open
    if (this.isMinimized() || this.isModalOpen() || !this.buttonContainer) {
      return;
    }

    // Determine position based on config
    const isBottom = this.config.position.includes('bottom');
    const isRight = this.config.position.includes('right');

    // Calculate distance from corner
    const distanceX = isRight 
      ? window.innerWidth - e.clientX 
      : e.clientX;
    const distanceY = isBottom 
      ? window.innerHeight - e.clientY 
      : e.clientY;

    // Check if mouse is within hover zone
    const isInHoverZone = distanceX < this.hoverZoneSize && distanceY < this.hoverZoneSize;

    if (isInHoverZone) {
      this.showButton();
    } else {
      this.hideButton();
    }
  }

  /**
   * Show the button
   */
  private showButton(): void {
    // Clear any pending hide timeout
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
      this.hoverTimeout = null;
    }
    // Add hover class
    this.buttonContainer?.classList.add('ff-hover-peek');
  }

  /**
   * Hide the button after a delay
   */
  private hideButton(): void {
    // Remove hover class after a short delay
    if (!this.hoverTimeout) {
      this.hoverTimeout = window.setTimeout(() => {
        this.buttonContainer?.classList.remove('ff-hover-peek');
        this.hoverTimeout = null;
      }, 300);
    }
  }

  /**
   * Clean up
   */
  public destroy(): void {
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
      this.hoverTimeout = null;
    }
  }
}
