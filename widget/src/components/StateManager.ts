/**
 * StateManager Component
 * Handles widget state management (minimized, visibility, etc.)
 */
export class StateManager {
  private isMinimized: boolean = false;
  private readonly STORAGE_KEY = 'ff-widget-minimized';

  constructor(
    private buttonContainer: HTMLElement | null,
    private cornerIndicators: HTMLElement[]
  ) {
    // Load initial state from localStorage
    this.isMinimized = localStorage.getItem(this.STORAGE_KEY) === 'true';
  }

  /**
   * Check if widget is minimized
   */
  public getIsMinimized(): boolean {
    return this.isMinimized;
  }

  /**
   * Minimize the widget
   */
  public minimize(): void {
    this.isMinimized = true;
    localStorage.setItem(this.STORAGE_KEY, 'true');
    this.applyMinimizedState();
  }

  /**
   * Restore the widget
   */
  public restore(): void {
    this.isMinimized = false;
    localStorage.setItem(this.STORAGE_KEY, 'false');
    this.applyRestoredState();
  }

  /**
   * Apply minimized visual state
   */
  private applyMinimizedState(): void {
    if (this.buttonContainer) {
      this.buttonContainer.classList.add('ff-minimized');
    }
    
    this.cornerIndicators.forEach(indicator => {
      indicator.classList.add('ff-visible');
    });
  }

  /**
   * Apply restored visual state
   */
  private applyRestoredState(): void {
    if (this.buttonContainer) {
      this.buttonContainer.classList.remove('ff-minimized');
    }
    
    this.cornerIndicators.forEach(indicator => {
      indicator.classList.remove('ff-visible');
    });
  }

  /**
   * Apply initial state on load
   */
  public applyInitialState(): void {
    if (this.isMinimized) {
      this.applyMinimizedState();
    }
  }
}
