/**
 * Mobile Detection and Utilities
 * Handles mobile browser detection and capability checks
 */

/**
 * Check if the device is a mobile device
 */
export function isMobileDevice(): boolean {
  // Check for touch capability combined with small screen
  const hasTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
  const isSmallScreen = window.innerWidth <= 768;

  // Check user agent for mobile patterns
  const mobileUserAgentPatterns = [
    /Android/i,
    /webOS/i,
    /iPhone/i,
    /iPad/i,
    /iPod/i,
    /BlackBerry/i,
    /Windows Phone/i,
    /Opera Mini/i,
    /IEMobile/i,
    /Mobile/i,
  ];

  const isMobileUA = mobileUserAgentPatterns.some((pattern) =>
    pattern.test(navigator.userAgent)
  );

  return (hasTouch && isSmallScreen) || isMobileUA;
}

/**
 * Check if getDisplayMedia is supported
 * This is NOT supported on iOS Safari, Android Chrome, etc.
 */
export function isScreenCaptureSupported(): boolean {
  return (
    typeof navigator !== "undefined" &&
    "mediaDevices" in navigator &&
    "getDisplayMedia" in navigator.mediaDevices
  );
}

/**
 * Check if screen recording is supported
 */
export function isScreenRecordingSupported(): boolean {
  return (
    isScreenCaptureSupported() &&
    typeof MediaRecorder !== "undefined" &&
    !isMobileDevice()
  );
}

/**
 * Check if file input with camera capture is supported
 */
export function isFileCaptureSupported(): boolean {
  return "showOpenFilePicker" in window || true; // input[type=file] always works
}

/**
 * Get device capabilities summary
 */
export interface DeviceCapabilities {
  isMobile: boolean;
  supportsScreenCapture: boolean;
  supportsScreenRecording: boolean;
  supportsFileCapture: boolean;
  supportsCamera: boolean;
}

export function getDeviceCapabilities(): DeviceCapabilities {
  const isMobile = isMobileDevice();

  return {
    isMobile,
    supportsScreenCapture: isScreenCaptureSupported() && !isMobile,
    supportsScreenRecording: isScreenRecordingSupported(),
    supportsFileCapture: isFileCaptureSupported(),
    supportsCamera:
      "mediaDevices" in navigator && "getUserMedia" in navigator.mediaDevices,
  };
}
