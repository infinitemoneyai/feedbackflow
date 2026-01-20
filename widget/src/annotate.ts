/**
 * Annotation Module
 * Canvas-based drawing tools for screenshot annotation
 */

export type AnnotationTool = "pen" | "highlighter" | "arrow" | "circle";

export interface AnnotationConfig {
  tool: AnnotationTool;
  color: string;
  lineWidth: number;
}

export interface Point {
  x: number;
  y: number;
}

/**
 * Annotation Canvas Manager
 * Handles drawing on top of a screenshot
 */
export class AnnotationCanvas {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private backgroundImage: HTMLImageElement | null = null;
  private isDrawing: boolean = false;
  private lastPoint: Point | null = null;
  private startPoint: Point | null = null;
  private history: ImageData[] = [];
  private historyIndex: number = -1;
  private config: AnnotationConfig = {
    tool: "pen",
    color: "#E85D52", // Retro red
    lineWidth: 3,
  };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Could not get canvas context");
    }
    this.ctx = ctx;

    this.setupEventListeners();
  }

  /**
   * Set the background image
   */
  public setBackgroundImage(dataUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.backgroundImage = img;
        this.canvas.width = img.width;
        this.canvas.height = img.height;
        this.redraw();
        this.saveToHistory();
        resolve();
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = dataUrl;
    });
  }

  /**
   * Set the active tool
   */
  public setTool(tool: AnnotationTool): void {
    this.config.tool = tool;

    // Set default colors and widths for tools
    switch (tool) {
      case "pen":
        this.config.color = "#E85D52"; // Red
        this.config.lineWidth = 3;
        break;
      case "highlighter":
        this.config.color = "rgba(243, 201, 82, 0.4)"; // Semi-transparent yellow
        this.config.lineWidth = 20;
        break;
      case "arrow":
      case "circle":
        this.config.color = "#E85D52"; // Red
        this.config.lineWidth = 3;
        break;
    }
  }

  /**
   * Get current tool
   */
  public getTool(): AnnotationTool {
    return this.config.tool;
  }

  /**
   * Set custom color
   */
  public setColor(color: string): void {
    this.config.color = color;
  }

  /**
   * Clear all annotations (keep background)
   */
  public clear(): void {
    this.redraw();
    this.history = [];
    this.historyIndex = -1;
    this.saveToHistory();
  }

  /**
   * Undo last action
   */
  public undo(): void {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      const imageData = this.history[this.historyIndex];
      this.ctx.putImageData(imageData, 0, 0);
    }
  }

  /**
   * Get the annotated image as data URL
   */
  public getDataUrl(format: "image/png" | "image/jpeg" = "image/png", quality: number = 0.92): string {
    return this.canvas.toDataURL(format, quality);
  }

  /**
   * Get the annotated image as Blob
   */
  public getBlob(format: "image/png" | "image/jpeg" = "image/png", quality: number = 0.92): Promise<Blob> {
    return new Promise((resolve, reject) => {
      this.canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Failed to create blob"));
        },
        format,
        quality
      );
    });
  }

  /**
   * Redraw background image
   */
  private redraw(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    if (this.backgroundImage) {
      this.ctx.drawImage(this.backgroundImage, 0, 0);
    }
  }

  /**
   * Save current state to history
   */
  private saveToHistory(): void {
    // Remove any redo history
    this.history = this.history.slice(0, this.historyIndex + 1);

    // Save current state
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    this.history.push(imageData);
    this.historyIndex = this.history.length - 1;

    // Limit history size
    if (this.history.length > 50) {
      this.history.shift();
      this.historyIndex--;
    }
  }

  /**
   * Set up mouse/touch event listeners
   */
  private setupEventListeners(): void {
    // Mouse events
    this.canvas.addEventListener("mousedown", this.handleStart.bind(this));
    this.canvas.addEventListener("mousemove", this.handleMove.bind(this));
    this.canvas.addEventListener("mouseup", this.handleEnd.bind(this));
    this.canvas.addEventListener("mouseleave", this.handleEnd.bind(this));

    // Touch events
    this.canvas.addEventListener("touchstart", this.handleTouchStart.bind(this), { passive: false });
    this.canvas.addEventListener("touchmove", this.handleTouchMove.bind(this), { passive: false });
    this.canvas.addEventListener("touchend", this.handleEnd.bind(this));
    this.canvas.addEventListener("touchcancel", this.handleEnd.bind(this));
  }

  /**
   * Get point from mouse event
   */
  private getMousePoint(e: MouseEvent): Point {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  /**
   * Get point from touch event
   */
  private getTouchPoint(e: TouchEvent): Point {
    const rect = this.canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    return {
      x: (touch.clientX - rect.left) * scaleX,
      y: (touch.clientY - rect.top) * scaleY,
    };
  }

  /**
   * Handle drawing start
   */
  private handleStart(e: MouseEvent): void {
    this.isDrawing = true;
    const point = this.getMousePoint(e);
    this.lastPoint = point;
    this.startPoint = point;

    if (this.config.tool === "pen" || this.config.tool === "highlighter") {
      this.ctx.beginPath();
      this.ctx.moveTo(point.x, point.y);
    }
  }

  /**
   * Handle touch start
   */
  private handleTouchStart(e: TouchEvent): void {
    e.preventDefault();
    this.isDrawing = true;
    const point = this.getTouchPoint(e);
    this.lastPoint = point;
    this.startPoint = point;

    if (this.config.tool === "pen" || this.config.tool === "highlighter") {
      this.ctx.beginPath();
      this.ctx.moveTo(point.x, point.y);
    }
  }

  /**
   * Handle drawing move
   */
  private handleMove(e: MouseEvent): void {
    if (!this.isDrawing || !this.lastPoint) return;

    const point = this.getMousePoint(e);

    if (this.config.tool === "pen" || this.config.tool === "highlighter") {
      this.drawLine(this.lastPoint, point);
      this.lastPoint = point;
    } else if (this.startPoint) {
      // For shapes, preview by redrawing
      this.restoreFromHistory();
      this.drawShape(this.startPoint, point);
    }
  }

  /**
   * Handle touch move
   */
  private handleTouchMove(e: TouchEvent): void {
    e.preventDefault();
    if (!this.isDrawing || !this.lastPoint) return;

    const point = this.getTouchPoint(e);

    if (this.config.tool === "pen" || this.config.tool === "highlighter") {
      this.drawLine(this.lastPoint, point);
      this.lastPoint = point;
    } else if (this.startPoint) {
      this.restoreFromHistory();
      this.drawShape(this.startPoint, point);
    }
  }

  /**
   * Handle drawing end
   */
  private handleEnd(): void {
    if (!this.isDrawing) return;

    this.isDrawing = false;

    // Finalize shape drawing
    if ((this.config.tool === "arrow" || this.config.tool === "circle") && this.startPoint && this.lastPoint) {
      // Shape is already drawn, just save to history
    }

    this.saveToHistory();
    this.lastPoint = null;
    this.startPoint = null;
  }

  /**
   * Draw a line segment
   */
  private drawLine(from: Point, to: Point): void {
    this.ctx.strokeStyle = this.config.color;
    this.ctx.lineWidth = this.config.lineWidth;
    this.ctx.lineCap = "round";
    this.ctx.lineJoin = "round";

    if (this.config.tool === "highlighter") {
      this.ctx.globalCompositeOperation = "multiply";
    } else {
      this.ctx.globalCompositeOperation = "source-over";
    }

    this.ctx.lineTo(to.x, to.y);
    this.ctx.stroke();
    this.ctx.beginPath();
    this.ctx.moveTo(to.x, to.y);
  }

  /**
   * Draw a shape
   */
  private drawShape(start: Point, end: Point): void {
    this.ctx.strokeStyle = this.config.color;
    this.ctx.lineWidth = this.config.lineWidth;
    this.ctx.lineCap = "round";
    this.ctx.lineJoin = "round";
    this.ctx.globalCompositeOperation = "source-over";

    if (this.config.tool === "arrow") {
      this.drawArrow(start, end);
    } else if (this.config.tool === "circle") {
      this.drawCircle(start, end);
    }
  }

  /**
   * Draw an arrow
   */
  private drawArrow(from: Point, to: Point): void {
    const headLength = 15;
    const angle = Math.atan2(to.y - from.y, to.x - from.x);

    this.ctx.beginPath();
    this.ctx.moveTo(from.x, from.y);
    this.ctx.lineTo(to.x, to.y);
    this.ctx.stroke();

    // Draw arrowhead
    this.ctx.beginPath();
    this.ctx.moveTo(to.x, to.y);
    this.ctx.lineTo(
      to.x - headLength * Math.cos(angle - Math.PI / 6),
      to.y - headLength * Math.sin(angle - Math.PI / 6)
    );
    this.ctx.moveTo(to.x, to.y);
    this.ctx.lineTo(
      to.x - headLength * Math.cos(angle + Math.PI / 6),
      to.y - headLength * Math.sin(angle + Math.PI / 6)
    );
    this.ctx.stroke();
  }

  /**
   * Draw a circle/ellipse
   */
  private drawCircle(start: Point, end: Point): void {
    const centerX = (start.x + end.x) / 2;
    const centerY = (start.y + end.y) / 2;
    const radiusX = Math.abs(end.x - start.x) / 2;
    const radiusY = Math.abs(end.y - start.y) / 2;

    this.ctx.beginPath();
    this.ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
    this.ctx.stroke();
  }

  /**
   * Restore canvas from last history state (for shape preview)
   */
  private restoreFromHistory(): void {
    if (this.historyIndex >= 0) {
      const imageData = this.history[this.historyIndex];
      this.ctx.putImageData(imageData, 0, 0);
    }
  }

  /**
   * Destroy and cleanup
   */
  public destroy(): void {
    // Event listeners are automatically cleaned up when canvas is removed
    this.history = [];
    this.backgroundImage = null;
  }
}
