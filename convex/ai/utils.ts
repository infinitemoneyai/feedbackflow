/**
 * Shared utilities for AI operations
 */

/**
 * Convert ArrayBuffer to base64 string (browser-compatible)
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Fetch and convert screenshot to base64
 */
export async function fetchScreenshotAsBase64(
  screenshotUrl: string
): Promise<{ base64: string; mediaType: string } | null> {
  try {
    const imageResponse = await fetch(screenshotUrl);
    if (!imageResponse.ok) return null;

    // Detect actual media type from Content-Type header
    const contentType = imageResponse.headers.get("content-type");
    const mediaType = contentType || "image/png";

    const arrayBuffer = await imageResponse.arrayBuffer();
    const base64 = arrayBufferToBase64(arrayBuffer);

    return { base64, mediaType };
  } catch (err) {
    console.warn("Failed to fetch screenshot:", err);
    return null;
  }
}

/**
 * Clamp a number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Validate and normalize a value against a list of allowed values
 */
export function validateEnum<T extends string>(
  value: unknown,
  allowedValues: readonly T[],
  defaultValue: T
): T {
  return allowedValues.includes(value as T) ? (value as T) : defaultValue;
}
