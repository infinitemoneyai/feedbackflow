/**
 * Screenshot Capture Module
 * Uses native APIs where available, with canvas-based capture as fallback
 */

export interface CaptureResult {
  dataUrl: string;
  width: number;
  height: number;
  blob?: Blob;
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
    // Try using the Screen Capture API if available
    if ("mediaDevices" in navigator && "getDisplayMedia" in navigator.mediaDevices) {
      return await captureWithDisplayMedia();
    }

    // Fallback: capture using canvas (limited - can't capture cross-origin content)
    return await captureWithCanvas();
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
    };
  } finally {
    // Stop all tracks to release the screen capture
    stream.getTracks().forEach((track) => track.stop());
  }
}

/**
 * Fallback: Capture visible viewport using canvas
 * Note: This won't capture cross-origin content (iframes, images)
 */
async function captureWithCanvas(): Promise<CaptureResult> {
  // Create a canvas of the viewport size
  const canvas = document.createElement("canvas");
  const width = window.innerWidth;
  const height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not get canvas context");
  }

  // Set white background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  // Note: Full DOM rendering would require html2canvas library
  // For now, we'll show a message that getDisplayMedia is preferred
  ctx.fillStyle = "#666666";
  ctx.font = "16px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(
    "Screenshot capture requires screen sharing permission",
    width / 2,
    height / 2
  );

  const dataUrl = canvas.toDataURL("image/png");
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => {
      if (b) resolve(b);
      else reject(new Error("Failed to create blob"));
    }, "image/png");
  });

  return {
    dataUrl,
    width,
    height,
    blob,
  };
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
