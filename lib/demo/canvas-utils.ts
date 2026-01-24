import { DEMO_CONFIG, DEMO_COLORS } from "./constants";
import type { Point, AnnotationTool } from "./types";

/**
 * Scale image to fit within max dimensions while maintaining aspect ratio
 */
export function scaleImageToFit(
  imgWidth: number,
  imgHeight: number,
  maxWidth: number = DEMO_CONFIG.MAX_CANVAS_WIDTH,
  maxHeight: number = DEMO_CONFIG.MAX_CANVAS_HEIGHT
): { width: number; height: number } {
  let width = imgWidth;
  let height = imgHeight;

  if (width > maxWidth) {
    height = (maxWidth / width) * height;
    width = maxWidth;
  }
  if (height > maxHeight) {
    width = (maxHeight / height) * width;
    height = maxHeight;
  }

  return { width, height };
}

/**
 * Get canvas coordinates from mouse or touch event
 */
export function getCanvasCoords(
  e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
  canvas: HTMLCanvasElement
): Point {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  let clientX: number, clientY: number;
  if ("touches" in e) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  } else {
    clientX = e.clientX;
    clientY = e.clientY;
  }

  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY,
  };
}

/**
 * Draw a line from start to end point
 */
export function drawLine(
  ctx: CanvasRenderingContext2D,
  start: Point,
  end: Point,
  tool: AnnotationTool
): void {
  ctx.beginPath();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (tool === "pen") {
    ctx.strokeStyle = DEMO_COLORS.RETRO_RED;
    ctx.lineWidth = DEMO_CONFIG.PEN_WIDTH;
    ctx.globalAlpha = 1;
  } else if (tool === "highlighter") {
    ctx.strokeStyle = DEMO_COLORS.RETRO_YELLOW;
    ctx.lineWidth = DEMO_CONFIG.HIGHLIGHTER_WIDTH;
    ctx.globalAlpha = DEMO_CONFIG.HIGHLIGHTER_OPACITY;
  }

  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

/**
 * Draw an arrow from start to end point
 */
export function drawArrow(
  ctx: CanvasRenderingContext2D,
  start: Point,
  end: Point
): void {
  ctx.strokeStyle = DEMO_COLORS.RETRO_RED;
  ctx.lineWidth = DEMO_CONFIG.PEN_WIDTH;
  ctx.globalAlpha = 1;

  // Draw line
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.stroke();

  // Draw arrowhead
  const angle = Math.atan2(end.y - start.y, end.x - start.x);
  const headLength = DEMO_CONFIG.ARROW_HEAD_LENGTH;

  ctx.beginPath();
  ctx.moveTo(end.x, end.y);
  ctx.lineTo(
    end.x - headLength * Math.cos(angle - Math.PI / 6),
    end.y - headLength * Math.sin(angle - Math.PI / 6)
  );
  ctx.moveTo(end.x, end.y);
  ctx.lineTo(
    end.x - headLength * Math.cos(angle + Math.PI / 6),
    end.y - headLength * Math.sin(angle + Math.PI / 6)
  );
  ctx.stroke();
}

/**
 * Draw a circle/ellipse from start to end point
 */
export function drawCircle(
  ctx: CanvasRenderingContext2D,
  start: Point,
  end: Point
): void {
  ctx.strokeStyle = DEMO_COLORS.RETRO_RED;
  ctx.lineWidth = DEMO_CONFIG.PEN_WIDTH;
  ctx.globalAlpha = 1;

  const radiusX = Math.abs(end.x - start.x) / 2;
  const radiusY = Math.abs(end.y - start.y) / 2;
  const centerX = (start.x + end.x) / 2;
  const centerY = (start.y + end.y) / 2;

  ctx.beginPath();
  ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
  ctx.stroke();
}
