/**
 * FeedbackTransport — the ONE place feedback submissions travel through.
 * Owns API-URL resolution, request assembly, the network call, response
 * parsing, and the blob codecs. Consumed by both the submit UI (live
 * submissions) and the offline queue (retries) so the two paths can never
 * drift again.
 */

import type {
  SubmissionFormData,
  SubmissionResult,
} from "./offline-queue";

/** The single definition of the hosted fallback endpoint. */
export const FALLBACK_SUBMIT_URL = "https://feedbackflow.cc/api/widget/submit";

/**
 * Resolve the submit endpoint: configured apiUrl → the widget script's own
 * origin → the hosted fallback.
 */
export function resolveSubmitUrl(configApiUrl?: string): string {
  if (configApiUrl) {
    return configApiUrl;
  }

  if (typeof window !== "undefined") {
    const scripts = document.querySelectorAll('script[src*="widget.js"]');
    for (const script of Array.from(scripts)) {
      const src = (script as HTMLScriptElement).src;
      if (src) {
        try {
          return `${new URL(src).origin}/api/widget/submit`;
        } catch {
          // Invalid URL, keep looking
        }
      }
    }
  }

  return FALLBACK_SUBMIT_URL;
}

/** Everything one submission carries, media in either live or stored form. */
export interface FeedbackPayload {
  widgetKey: string;
  formData: SubmissionFormData;
  screenshotBlob?: Blob;
  screenshotDataUrl?: string;
  recordingBlob?: Blob;
  recordingBase64?: string;
  recordingMimeType?: string;
  /** Milliseconds; only sent on live submissions. */
  recordingDurationMs?: number;
}

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix to get just the base64 part
      resolve(result.split(",")[1]);
    };
    reader.onerror = () =>
      reject(new Error("Failed to convert blob to base64"));
    reader.readAsDataURL(blob);
  });
}

export function base64ToBlob(base64: string, mimeType: string): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
}

export class FeedbackTransport {
  private readonly apiUrl: string;

  constructor(configApiUrl?: string) {
    this.apiUrl = resolveSubmitUrl(configApiUrl);
  }

  public getSubmitUrl(): string {
    return this.apiUrl;
  }

  /**
   * Send one submission. Never throws for HTTP failures — returns a
   * discriminated SubmissionResult so callers decide retry semantics.
   * (Network-level errors from fetch itself still reject.)
   */
  public async submit(payload: FeedbackPayload): Promise<SubmissionResult> {
    const body = new FormData();
    body.append("widgetKey", payload.widgetKey);
    body.append("title", payload.formData.title);
    body.append("description", payload.formData.description);
    body.append("type", payload.formData.type);
    body.append("metadata", JSON.stringify(payload.formData.metadata));

    if (payload.formData.email) {
      body.append("email", payload.formData.email);
    }
    if (payload.formData.name) {
      body.append("name", payload.formData.name);
    }

    const screenshot =
      payload.screenshotBlob ??
      (payload.screenshotDataUrl
        ? await (await fetch(payload.screenshotDataUrl)).blob()
        : undefined);
    if (screenshot) {
      body.append("screenshot", screenshot, "screenshot.jpg");
    }

    const recording =
      payload.recordingBlob ??
      (payload.recordingBase64 && payload.recordingMimeType
        ? base64ToBlob(payload.recordingBase64, payload.recordingMimeType)
        : undefined);
    if (recording) {
      const mimeType = payload.recordingMimeType ?? recording.type;
      const ext = mimeType.includes("webm") ? "webm" : "mp4";
      body.append("recording", recording, `recording.${ext}`);
      if (payload.recordingDurationMs !== undefined) {
        body.append(
          "recordingDuration",
          (payload.recordingDurationMs / 1000).toString()
        );
      }
    }

    const response = await fetch(this.apiUrl, { method: "POST", body });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      return {
        success: false,
        error: `HTTP ${response.status}: ${errorText}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      feedbackId: data.feedbackId || data.id,
      warning: data.warning,
    };
  }
}
