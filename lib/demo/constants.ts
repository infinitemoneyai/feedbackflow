// Demo configuration constants

export const DEMO_CONFIG = {
  // File upload limits
  MAX_FILE_SIZE_MB: 10,
  MAX_FILE_SIZE_BYTES: 10 * 1024 * 1024,
  ACCEPTED_IMAGE_TYPES: ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"],

  // Canvas dimensions
  DEMO_SCREENSHOT_WIDTH: 1200,
  DEMO_SCREENSHOT_HEIGHT: 800,
  MAX_CANVAS_WIDTH: 800,
  MAX_CANVAS_HEIGHT: 500,

  // Drawing settings
  PEN_WIDTH: 3,
  HIGHLIGHTER_WIDTH: 20,
  HIGHLIGHTER_OPACITY: 0.4,
  ARROW_HEAD_LENGTH: 15,
  PEN_COLOR: "#e85d52", // retro-red
  HIGHLIGHTER_COLOR: "#f3c952", // retro-yellow

  // History limits
  MAX_HISTORY_STATES: 20,

  // AI processing delay
  AI_PROCESSING_DELAY_MS: 1500,
} as const;

export const DEMO_COLORS = {
  RETRO_RED: "#e85d52",
  RETRO_YELLOW: "#f3c952",
  RETRO_BLUE: "#6b9ac4",
  RETRO_BLACK: "#1a1a1a",
  STONE_50: "#fafaf9",
  STONE_100: "#f5f5f4",
  STONE_200: "#e7e5e4",
  STONE_300: "#d6d3d1",
  STONE_400: "#a8a29e",
  WHITE: "#ffffff",
} as const;
