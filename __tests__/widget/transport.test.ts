/**
 * FeedbackTransport + the offline queue's single enqueue path.
 * Recordings must survive the enqueue → retry round trip (the old sync
 * blob stub silently dropped them), and the fallback URL exists once.
 * @see widget/src/transport.ts, widget/src/offline-queue.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  FeedbackTransport,
  FALLBACK_SUBMIT_URL,
  resolveSubmitUrl,
  blobToBase64,
  base64ToBlob,
} from "@/widget/src/transport";
import { OfflineQueue } from "@/widget/src/offline-queue";
import type { FeedbackPayload } from "@/widget/src/transport";

const API_URL = "https://custom.example.com/api/widget/submit";

const fetchMock = vi.fn();

function payload(extra: Partial<FeedbackPayload> = {}): FeedbackPayload {
  return {
    widgetKey: "wk_transport",
    formData: {
      title: "Broken",
      description: "Details",
      type: "bug",
      metadata: {
        url: "https://host.example",
        userAgent: "test",
        timestamp: new Date().toISOString(),
        screenWidth: 1024,
        screenHeight: 768,
      },
    },
    ...extra,
  };
}

// happy-dom 20.x exposes a localStorage global without Storage methods
function createStorageStub(): Storage {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
    clear: () => store.clear(),
    key: (index: number) => [...store.keys()][index] ?? null,
    get length() {
      return store.size;
    },
  };
}

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  vi.stubGlobal("localStorage", createStorageStub());
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("resolveSubmitUrl", () => {
  it("prefers the configured apiUrl, then falls back to the hosted endpoint", () => {
    expect(resolveSubmitUrl(API_URL)).toBe(API_URL);
    expect(resolveSubmitUrl(undefined)).toBe(FALLBACK_SUBMIT_URL);
  });

  it("derives from the widget script origin when present", () => {
    const script = document.createElement("script");
    script.src = "https://selfhost.example.com/widget.js";
    document.head.appendChild(script);

    expect(resolveSubmitUrl(undefined)).toBe(
      "https://selfhost.example.com/api/widget/submit"
    );
    script.remove();
  });
});

describe("FeedbackTransport.submit", () => {
  it("resolves the feedbackId on success", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ feedbackId: "FF-0042", id: "raw_id" }),
    });

    const result = await new FeedbackTransport(API_URL).submit(payload());

    expect(result.success).toBe(true);
    expect(result.feedbackId).toBe("FF-0042");
    expect(fetchMock).toHaveBeenCalledWith(
      API_URL,
      expect.objectContaining({ method: "POST" })
    );
  });

  it("returns a failure result (does not throw) on HTTP errors", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 429,
      text: async () => "Rate limit exceeded",
    });

    const result = await new FeedbackTransport(API_URL).submit(payload());

    expect(result.success).toBe(false);
    expect(result.error).toContain("429");
  });

  it("attaches a live recording blob with its duration", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ id: "x" }) });
    const recording = new Blob(["vid"], { type: "video/webm" });

    await new FeedbackTransport(API_URL).submit(
      payload({
        recordingBlob: recording,
        recordingMimeType: "video/webm",
        recordingDurationMs: 4200,
      })
    );

    const body = fetchMock.mock.calls[0][1].body as FormData;
    expect(body.get("recording")).toBeInstanceOf(Blob);
    expect(body.get("recordingDuration")).toBe("4.2");
  });
});

describe("offline queue single enqueue path", () => {
  it("one enqueue call produces one queued item, recording encoded", async () => {
    const queue = new OfflineQueue(API_URL);
    const recording = new Blob(["recording-bytes"], { type: "video/webm" });

    await queue.enqueue(
      payload({ recordingBlob: recording, recordingMimeType: "video/webm" })
    );

    const stored = JSON.parse(
      localStorage.getItem("ff_submission_queue") ?? "[]"
    );
    expect(stored).toHaveLength(1);
    expect(stored[0].recordingBlob).toBe(await blobToBase64(recording));
    expect(stored[0].recordingMimeType).toBe("video/webm");
    queue.destroy();
  });

  it("a queued recording arrives intact on retry", async () => {
    const queue = new OfflineQueue(API_URL);
    const recording = new Blob(["recording-bytes"], { type: "video/webm" });
    await queue.enqueue(
      payload({ recordingBlob: recording, recordingMimeType: "video/webm" })
    );

    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ feedbackId: "FF-0099" }),
    });
    await queue.processQueue();

    // Submission went out with the recording reconstructed from base64
    const body = fetchMock.mock.calls[0][1].body as FormData;
    const sent = body.get("recording") as Blob;
    expect(sent).toBeInstanceOf(Blob);
    expect(await sent.text()).toBe("recording-bytes");

    // And the queue drained
    expect(
      JSON.parse(localStorage.getItem("ff_submission_queue") ?? "[]")
    ).toHaveLength(0);
    queue.destroy();
  });

  it("round-trips blobs through the codecs", async () => {
    const original = new Blob(["payload"], { type: "video/mp4" });
    const restored = base64ToBlob(await blobToBase64(original), "video/mp4");
    expect(await restored.text()).toBe("payload");
  });
});
