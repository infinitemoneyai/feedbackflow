/**
 * Screenshot Capture Module
 * Uses native APIs where available, with file upload fallback for mobile
 */

import { isMobileDevice, isScreenCaptureSupported } from "./mobile-utils";

export interface CaptureResult {
  dataUrl: string;
  width: number;
  height: number;
  blob?: Blob;
  source?: "screen-capture" | "file-upload" | "canvas";
}

/**
 * Check if native screen capture is available
 */
export function canCaptureScreen(): boolean {
  return isScreenCaptureSupported() && !isMobileDevice();
}

/**
 * Capture the visible viewport as an image
 * Hides the widget during capture
 */
export async function captureScreenshot(): Promise<CaptureResult> {
  // Hide widget during capture
  const widgetRoot = document.getElementById("ff-widget-root");
  if (widgetRoot) {
    widgetRoot.style.display = "none";
  }

  try {
    // Try using the Screen Capture API if available (desktop only)
    if (canCaptureScreen()) {
      return await captureWithDisplayMedia();
    }

    // For mobile devices, throw to trigger file upload flow in screenshot-ui
    throw new Error("MOBILE_DEVICE");
  } finally {
    // Show widget again
    if (widgetRoot) {
      widgetRoot.style.display = "";
    }
  }
}

/**
 * Capture using getDisplayMedia API
 * More reliable, captures full screen including cross-origin content
 */
async function captureWithDisplayMedia(): Promise<CaptureResult> {
  const stream = await navigator.mediaDevices.getDisplayMedia({
    video: {
      // Prefer capturing the current tab/window
      displaySurface: "browser",
    } as MediaTrackConstraints,
    audio: false,
  });

  try {
    const video = document.createElement("video");
    video.srcObject = stream;
    video.muted = true;

    await new Promise<void>((resolve) => {
      video.onloadedmetadata = () => {
        video.play();
        resolve();
      };
    });

    // Wait a frame for video to render
    await new Promise((resolve) => requestAnimationFrame(resolve));

    // Create canvas and capture frame
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Could not get canvas context");
    }

    ctx.drawImage(video, 0, 0);

    // Get blob for efficient upload
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => {
        if (b) resolve(b);
        else reject(new Error("Failed to create blob"));
      }, "image/png", 0.92);
    });

    const dataUrl = canvas.toDataURL("image/png", 0.92);

    return {
      dataUrl,
      width: canvas.width,
      height: canvas.height,
      blob,
      source: "screen-capture" as const,
    };
  } finally {
    // Stop all tracks to release the screen capture
    stream.getTracks().forEach((track) => track.stop());
  }
}

/**
 * Capture screenshot from a File (user-uploaded image)
 */
export async function captureFromFile(file: File): Promise<CaptureResult> {
  return new Promise((resolve, reject) => {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      reject(new Error("Please select an image file"));
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const dataUrl = reader.result as string;

      // Load image to get dimensions
      const img = new Image();
      img.onload = () => {
        resolve({
          dataUrl,
          width: img.width,
          height: img.height,
          blob: file,
          source: "file-upload",
        });
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = dataUrl;
    };

    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

/**
 * Create a file input and trigger file selection
 * Returns a promise that resolves with the selected file
 */
export function selectImageFile(): Promise<File> {
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    // On mobile, this allows camera capture or gallery selection
    input.setAttribute("capture", "environment");

    input.onchange = () => {
      const file = input.files?.[0];
      if (file) {
        resolve(file);
      } else {
        reject(new Error("No file selected"));
      }
    };

    // Handle cancel
    input.oncancel = () => {
      reject(new Error("File selection cancelled"));
    };

    // Some browsers don't fire oncancel, so we detect via focus
    const handleFocus = () => {
      setTimeout(() => {
        if (!input.files?.length) {
          reject(new Error("File selection cancelled"));
        }
        window.removeEventListener("focus", handleFocus);
      }, 300);
    };

    window.addEventListener("focus", handleFocus);
    input.click();
  });
}

/**
 * Compress image for upload
 * Reduces quality and optionally resizes
 */
export function compressImage(
  dataUrl: string,
  maxWidth: number = 1920,
  quality: number = 0.85
): Promise<CaptureResult> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      // Calculate new dimensions
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      // Create canvas for compression
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Use JPEG for better compression
      const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve({
              dataUrl: compressedDataUrl,
              width,
              height,
              blob,
            });
          } else {
            reject(new Error("Failed to create blob"));
          }
        },
        "image/jpeg",
        quality
      );
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = dataUrl;
  });
}
