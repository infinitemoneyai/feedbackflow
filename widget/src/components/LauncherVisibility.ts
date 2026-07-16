import type { WidgetConfig } from "../types";
import { createElement, createElementFromHTML } from "../dom";
import { icons } from "../icons";

/**
 * LauncherVisibility — the ONE owner of every way the Launcher hides and
 * shows (see CONTEXT.md: Launcher, Display Mode, Minimize).
 *
 * It builds the trigger button and corner indicators, and owns all launcher
 * CSS state classes (ff-minimized, ff-visible, ff-hover-peek, ff-auto-hide,
 * ff-entrance-reveal) as internal implementation — no other module reads or
 * writes them.
 *
 * Mechanisms, by precedence:
 * - Minimize (visitor-owned, persisted per browser) beats everything.
 * - Display Mode (owner-configured): "always-visible" (default) or
 *   "auto-hide" — resting off-screen, sliding in when the cursor nears the
 *   corner, with an Entrance Reveal on the visitor's first page view of a
 *   session so they learn feedback exists.
 * - The modal being open suspends hover-peek.
 */
export class LauncherVisibility {
  private buttonContainer: HTMLElement | null = null;
  private triggerButton: HTMLElement | null = null;
  private minimizeButton: HTMLElement | null = null;
  private indicators: HTMLElement[] = [];

  private minimized = false;
  private hoverTimeout: number | null = null;
  private revealTimeout: number | null = null;
  private mouseMoveHandler: ((e: MouseEvent) => void) | null = null;

  private readonly MINIMIZED_KEY = "ff-widget-minimized";
  private readonly REVEAL_KEY = "ff-entrance-reveal-shown";
  private readonly HOVER_ZONE_PX = 150;
  static readonly ENTRANCE_REVEAL_MS = 2000;

  constructor(
    private config: WidgetConfig,
    private onOpen: () => void,
    private isModalOpen: () => boolean
  ) {
    this.minimized = this.readStorage(this.MINIMIZED_KEY) === "true";
  }

  /**
   * Build the launcher DOM: the trigger button container followed by the
   * four corner indicators. Append all returned elements to the root.
   */
  public create(): HTMLElement[] {
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
        this.minimizeButton,
      ]
    );

    this.buttonContainer = createElement("div", {
      className: "ff-button-container",
    });
    this.buttonContainer.appendChild(this.triggerButton);

    const corners = ["top-left", "top-right", "bottom-left", "bottom-right"];
    this.indicators = corners.map((corner) =>
      createElement("div", {
        className: `ff-corner-indicator ff-corner-${corner}`,
        "aria-label": "Show feedback widget",
        role: "button",
        tabindex: "0",
      })
    );

    return [this.buttonContainer, ...this.indicators];
  }

  /**
   * Wire events and apply the initial visible/hidden state: minimized
   * persistence, the configured Display Mode, and (for Auto-Hide) the
   * once-per-session Entrance Reveal.
   */
  public activate(): void {
    this.triggerButton?.addEventListener("click", () => this.onOpen());
    this.minimizeButton?.addEventListener("click", (e) => {
      e.stopPropagation();
      this.minimize();
    });
    for (const indicator of this.indicators) {
      indicator.addEventListener("click", () => this.restore());
      indicator.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          this.restore();
        }
      });
    }

    if (this.minimized) {
      this.applyMinimizedClasses();
    }

    if (this.config.displayMode === "auto-hide") {
      this.buttonContainer?.classList.add("ff-auto-hide");
      this.mouseMoveHandler = (e) => this.handleMouseMove(e);
      document.addEventListener("mousemove", this.mouseMoveHandler);
      this.maybePlayEntranceReveal();
    }
  }

  public isMinimized(): boolean {
    return this.minimized;
  }

  /** Visitor-owned hide: persists for this browser, beats Display Mode. */
  public minimize(): void {
    this.minimized = true;
    this.writeStorage(this.MINIMIZED_KEY, "true");
    this.applyMinimizedClasses();
  }

  public restore(): void {
    this.minimized = false;
    this.writeStorage(this.MINIMIZED_KEY, "false");
    this.buttonContainer?.classList.remove("ff-minimized");
    this.indicators.forEach((i) => i.classList.remove("ff-visible"));
  }

  /** Reflect modal state on the trigger (aria-expanded). */
  public setExpanded(expanded: boolean): void {
    this.triggerButton?.setAttribute("aria-expanded", String(expanded));
  }

  public focusTrigger(): void {
    this.triggerButton?.focus();
  }

  public destroy(): void {
    if (this.mouseMoveHandler) {
      document.removeEventListener("mousemove", this.mouseMoveHandler);
      this.mouseMoveHandler = null;
    }
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
      this.hoverTimeout = null;
    }
    if (this.revealTimeout) {
      clearTimeout(this.revealTimeout);
      this.revealTimeout = null;
    }
  }

  // -- internal ------------------------------------------------------------

  private applyMinimizedClasses(): void {
    this.buttonContainer?.classList.add("ff-minimized");
    this.indicators.forEach((i) => i.classList.add("ff-visible"));
  }

  private maybePlayEntranceReveal(): void {
    if (this.minimized) return;
    if (this.readStorage(this.REVEAL_KEY, sessionStorage) === "true") return;
    this.writeStorage(this.REVEAL_KEY, "true", sessionStorage);

    this.buttonContainer?.classList.add("ff-entrance-reveal");
    this.revealTimeout = window.setTimeout(() => {
      this.buttonContainer?.classList.remove("ff-entrance-reveal");
      this.revealTimeout = null;
    }, LauncherVisibility.ENTRANCE_REVEAL_MS);
  }

  private handleMouseMove(e: MouseEvent): void {
    if (this.minimized || this.isModalOpen() || !this.buttonContainer) {
      return;
    }

    const isBottom = this.config.position.includes("bottom");
    const isRight = this.config.position.includes("right");
    const distanceX = isRight ? window.innerWidth - e.clientX : e.clientX;
    const distanceY = isBottom ? window.innerHeight - e.clientY : e.clientY;
    const inHoverZone =
      distanceX < this.HOVER_ZONE_PX && distanceY < this.HOVER_ZONE_PX;

    if (inHoverZone) {
      if (this.hoverTimeout) {
        clearTimeout(this.hoverTimeout);
        this.hoverTimeout = null;
      }
      this.buttonContainer.classList.add("ff-hover-peek");
    } else if (!this.hoverTimeout) {
      this.hoverTimeout = window.setTimeout(() => {
        this.buttonContainer?.classList.remove("ff-hover-peek");
        this.hoverTimeout = null;
      }, 300);
    }
  }

  /**
   * Storage access is best-effort: sandboxed/storage-blocked host pages
   * throw on access, and that must never break widget mount.
   */
  private readStorage(key: string, store?: Storage): string | null {
    try {
      return (store ?? localStorage).getItem(key);
    } catch {
      return null;
    }
  }

  private writeStorage(key: string, value: string, store?: Storage): void {
    try {
      (store ?? localStorage).setItem(key, value);
    } catch {
      // Best-effort: minimize/reveal state simply won't persist
    }
  }
}
