import { DEMO_CONFIG } from "./constants";

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate uploaded file for demo
 */
export function validateImageFile(file: File): FileValidationResult {
  // Check file type
  if (!DEMO_CONFIG.ACCEPTED_IMAGE_TYPES.some(type => file.type === type)) {
    return {
      valid: false,
      error: "Please upload an image file (PNG, JPG, WebP, GIF)",
    };
  }

  // Check file size
  if (file.size > DEMO_CONFIG.MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `Image must be less than ${DEMO_CONFIG.MAX_FILE_SIZE_MB}MB`,
    };
  }

  return { valid: true };
}

/**
 * Read file as data URL
 */
export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      resolve(dataUrl);
    };
    
    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };
    
    reader.readAsDataURL(file);
  });
}
