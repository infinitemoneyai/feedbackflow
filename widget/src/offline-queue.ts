/**
 * Offline Queue Module
 * Handles failed submissions by storing them in localStorage
 * and retrying with exponential backoff
 */

export interface QueuedSubmission {
  id: string;
  widgetKey: string;
  formData: SubmissionFormData;
  screenshotDataUrl?: string;
  recordingBlob?: string; // base64 encoded
  recordingMimeType?: string;
  timestamp: number;
  retryCount: number;
  nextRetryAt: number;
}

export interface SubmissionFormData {
  title: string;
  description: string;
  type: "bug" | "feature";
  email?: string;
  name?: string;
  metadata: SubmissionMetadata;
}

export interface SubmissionMetadata {
  url: string;
  userAgent: string;
  timestamp: string;
  screenWidth: number;
  screenHeight: number;
}

export interface SubmissionResult {
  success: boolean;
  feedbackId?: string;
  error?: string;
  warning?: string;
}

const QUEUE_STORAGE_KEY = "ff_submission_queue";
const MAX_RETRIES = 5;
const BASE_RETRY_DELAY_MS = 1000; // 1 second

/**
 * Generate unique ID for queue item
 */
function generateId(): string {
  return `ff_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Calculate next retry time with exponential backoff
 */
function calculateNextRetry(retryCount: number): number {
  // Exponential backoff: 1s, 2s, 4s, 8s, 16s
  const delay = BASE_RETRY_DELAY_MS * Math.pow(2, retryCount);
  // Add some jitter (up to 20%)
  const jitter = delay * 0.2 * Math.random();
  return Date.now() + delay + jitter;
}

/**
 * Offline Queue Manager
 */
export class OfflineQueue {
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private isProcessing = false;
  private apiUrl: string;

  constructor(apiUrl: string = "") {
    this.apiUrl = apiUrl || this.getDefaultApiUrl();
    this.setupConnectivityListener();
    this.scheduleRetry();
  }

  /**
   * Get default API URL from window location
   */
  private getDefaultApiUrl(): string {
    if (typeof window === "undefined") return "";
    
    // Try to detect API URL from the widget script source
    const scripts = document.querySelectorAll('script[src*="widget.js"]');
    for (const script of Array.from(scripts)) {
      const src = (script as HTMLScriptElement).src;
      if (src) {
        try {
          const url = new URL(src);
          // Use the same origin as the widget script
          return `${url.origin}/api/widget/submit`;
        } catch (e) {
          // Invalid URL, continue
        }
      }
    }
    
    // Default to the FeedbackFlow API
    return "https://feedbackflow.dev/api/widget/submit";
  }

  /**
   * Set up listener for connectivity changes
   */
  private setupConnectivityListener(): void {
    if (typeof window === "undefined") return;

    window.addEventListener("online", () => {
      console.log("FeedbackFlow: Connection restored, processing queue...");
      this.processQueue();
    });
  }

  /**
   * Get all queued submissions
   */
  public getQueue(): QueuedSubmission[] {
    try {
      const data = localStorage.getItem(QUEUE_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  /**
   * Save queue to localStorage
   */
  private saveQueue(queue: QueuedSubmission[]): void {
    try {
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
    } catch (error) {
      console.error("FeedbackFlow: Failed to save queue", error);
    }
  }

  /**
   * Add a submission to the queue
   */
  public addToQueue(
    widgetKey: string,
    formData: SubmissionFormData,
    screenshotDataUrl?: string,
    recordingBlob?: Blob
  ): string {
    const queue = this.getQueue();

    const submission: QueuedSubmission = {
      id: generateId(),
      widgetKey,
      formData,
      screenshotDataUrl,
      recordingBlob: recordingBlob
        ? this.blobToBase64Sync(recordingBlob)
        : undefined,
      recordingMimeType: recordingBlob?.type,
      timestamp: Date.now(),
      retryCount: 0,
      nextRetryAt: Date.now(),
    };

    queue.push(submission);
    this.saveQueue(queue);
    this.scheduleRetry();

    return submission.id;
  }

  /**
   * Convert Blob to base64 string (synchronously using pre-read data)
   * For actual async conversion, use blobToBase64
   */
  private blobToBase64Sync(_blob: Blob): string {
    // In practice, we'd need to convert async. For now, we'll handle recording
    // differently - the submit method will need to pass the already-converted base64
    return "";
  }

  /**
   * Convert Blob to base64 string
   */
  public static blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix to get just the base64 part
        const base64 = result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = () => reject(new Error("Failed to convert blob to base64"));
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Convert base64 string back to Blob
   */
  public static base64ToBlob(base64: string, mimeType: string): Blob {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new Blob([bytes], { type: mimeType });
  }

  /**
   * Remove a submission from the queue
   */
  public removeFromQueue(id: string): void {
    const queue = this.getQueue().filter((item) => item.id !== id);
    this.saveQueue(queue);
  }

  /**
   * Schedule next retry
   */
  private scheduleRetry(): void {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
    }

    const queue = this.getQueue();
    if (queue.length === 0) return;

    // Find next item to retry
    const now = Date.now();
    const nextRetryTime = Math.min(...queue.map((item) => item.nextRetryAt));
    const delay = Math.max(0, nextRetryTime - now);

    this.retryTimer = setTimeout(() => {
      this.processQueue();
    }, delay);
  }

  /**
   * Process the queue
   */
  public async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    if (!navigator.onLine) return;

    this.isProcessing = true;

    try {
      const queue = this.getQueue();
      const now = Date.now();

      for (const item of queue) {
        if (item.nextRetryAt > now) continue;
        if (item.retryCount >= MAX_RETRIES) {
          // Max retries exceeded, remove from queue
          console.warn(
            `FeedbackFlow: Max retries exceeded for submission ${item.id}, removing from queue`
          );
          this.removeFromQueue(item.id);
          continue;
        }

        try {
          const result = await this.submitToApi(item);

          if (result.success) {
            console.log(
              `FeedbackFlow: Queued submission ${item.id} succeeded, feedback ID: ${result.feedbackId}`
            );
            this.removeFromQueue(item.id);

            // Dispatch success event
            window.dispatchEvent(
              new CustomEvent("ff:queue-submission-success", {
                detail: { id: item.id, feedbackId: result.feedbackId },
              })
            );
          } else {
            throw new Error(result.error || "Submission failed");
          }
        } catch (error) {
          console.warn(
            `FeedbackFlow: Queue submission ${item.id} failed, scheduling retry`,
            error
          );

          // Update retry count and next retry time
          const updatedQueue = this.getQueue();
          const itemIndex = updatedQueue.findIndex((i) => i.id === item.id);
          if (itemIndex !== -1) {
            updatedQueue[itemIndex].retryCount++;
            updatedQueue[itemIndex].nextRetryAt = calculateNextRetry(
              updatedQueue[itemIndex].retryCount
            );
            this.saveQueue(updatedQueue);
          }
        }
      }
    } finally {
      this.isProcessing = false;
      this.scheduleRetry();
    }
  }

  /**
   * Submit to API
   */
  private async submitToApi(item: QueuedSubmission): Promise<SubmissionResult> {
    const formData = new FormData();

    // Add form data fields
    formData.append("widgetKey", item.widgetKey);
    formData.append("title", item.formData.title);
    formData.append("description", item.formData.description);
    formData.append("type", item.formData.type);
    formData.append("metadata", JSON.stringify(item.formData.metadata));

    if (item.formData.email) {
      formData.append("email", item.formData.email);
    }
    if (item.formData.name) {
      formData.append("name", item.formData.name);
    }

    // Add screenshot if present
    if (item.screenshotDataUrl) {
      const response = await fetch(item.screenshotDataUrl);
      const blob = await response.blob();
      formData.append("screenshot", blob, "screenshot.jpg");
    }

    // Add recording if present
    if (item.recordingBlob && item.recordingMimeType) {
      const blob = OfflineQueue.base64ToBlob(
        item.recordingBlob,
        item.recordingMimeType
      );
      const ext = item.recordingMimeType.includes("webm") ? "webm" : "mp4";
      formData.append("recording", blob, `recording.${ext}`);
    }

    const response = await fetch(this.apiUrl, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      return { success: false, error: `HTTP ${response.status}: ${errorText}` };
    }

    const data = await response.json();
    return {
      success: true,
      feedbackId: data.feedbackId || data.id,
    };
  }

  /**
   * Get queue size
   */
  public getQueueSize(): number {
    return this.getQueue().length;
  }

  /**
   * Clear the entire queue
   */
  public clearQueue(): void {
    this.saveQueue([]);
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
  }

  /**
   * Destroy the queue manager
   */
  public destroy(): void {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
  }
}

// Singleton instance for global access
let queueInstance: OfflineQueue | null = null;

/**
 * Get or create the global queue instance
 */
export function getOfflineQueue(apiUrl?: string): OfflineQueue {
  if (!queueInstance) {
    queueInstance = new OfflineQueue(apiUrl);
  }
  return queueInstance;
}
