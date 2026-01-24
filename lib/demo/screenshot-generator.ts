import { DEMO_CONFIG, DEMO_COLORS } from "./constants";

/**
 * Generate a demo screenshot showing a mock website with a visual bug
 */
export function generateDemoScreenshot(): string {
  const canvas = document.createElement("canvas");
  canvas.width = DEMO_CONFIG.DEMO_SCREENSHOT_WIDTH;
  canvas.height = DEMO_CONFIG.DEMO_SCREENSHOT_HEIGHT;
  
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  // Background
  ctx.fillStyle = DEMO_COLORS.WHITE;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Header
  drawHeader(ctx, canvas.width);

  // Hero section
  drawHeroSection(ctx, canvas.width);

  // Content cards
  drawContentCards(ctx, canvas.width);

  // CTA with visual bug
  drawCTAWithBug(ctx, canvas.width);

  // Footer label
  drawFooterLabel(ctx, canvas.height);

  return canvas.toDataURL("image/png");
}

function drawHeader(ctx: CanvasRenderingContext2D, width: number): void {
  ctx.fillStyle = DEMO_COLORS.STONE_50;
  ctx.fillRect(0, 0, width, 60);
  
  // Logo placeholder
  ctx.fillStyle = DEMO_COLORS.STONE_300;
  ctx.fillRect(20, 20, 100, 20);
  
  // Nav items
  ctx.fillRect(width - 200, 20, 60, 20);
  ctx.fillRect(width - 120, 20, 60, 20);
}

function drawHeroSection(ctx: CanvasRenderingContext2D, width: number): void {
  ctx.fillStyle = DEMO_COLORS.STONE_200;
  ctx.fillRect(100, 120, width - 200, 40);
  
  ctx.fillStyle = DEMO_COLORS.STONE_300;
  ctx.fillRect(200, 180, width - 400, 20);
}

function drawContentCards(ctx: CanvasRenderingContext2D, width: number): void {
  const cardWidth = (width - 160) / 3;
  
  for (let i = 0; i < 3; i++) {
    const x = 40 + i * (cardWidth + 20);
    
    // Card border
    ctx.strokeStyle = DEMO_COLORS.STONE_200;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, 260, cardWidth, 200);
    
    // Card image
    ctx.fillStyle = DEMO_COLORS.STONE_50;
    ctx.fillRect(x + 20, 280, cardWidth - 40, 100);
    
    // Card text lines
    ctx.fillStyle = DEMO_COLORS.STONE_300;
    ctx.fillRect(x + 20, 400, cardWidth - 60, 15);
    ctx.fillRect(x + 20, 425, cardWidth - 80, 15);
  }
}

function drawCTAWithBug(ctx: CanvasRenderingContext2D, width: number): void {
  // Main CTA button
  ctx.fillStyle = DEMO_COLORS.RETRO_RED;
  ctx.fillRect(width / 2 - 80, 520, 160, 50);
  
  ctx.fillStyle = DEMO_COLORS.WHITE;
  ctx.font = "bold 16px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Get Started", width / 2, 550);

  // Visual "bug" - overlapping promotional badge
  ctx.fillStyle = DEMO_COLORS.RETRO_YELLOW;
  ctx.fillRect(width / 2 + 60, 510, 100, 30);
  
  ctx.fillStyle = DEMO_COLORS.RETRO_BLACK;
  ctx.font = "12px Inter, sans-serif";
  ctx.fillText("50% OFF", width / 2 + 110, 530);
}

function drawFooterLabel(ctx: CanvasRenderingContext2D, height: number): void {
  ctx.fillStyle = DEMO_COLORS.STONE_400;
  ctx.font = "11px monospace";
  ctx.textAlign = "left";
  ctx.fillText("Demo: example.com", 20, height - 20);
}
