/**
 * Offline Queue Module
 * Handles failed submissions by storing them in localStorage
 * and retrying with exponential backoff
 */

import { debug } from './debug';
import {
  FeedbackTransport,
  blobToBase64,
  type FeedbackPayload,
} from './transport';

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
  private transport: FeedbackTransport;

  constructor(apiUrl: string = "") {
    this.transport = new FeedbackTransport(apiUrl || undefined);
    this.setupConnectivityListener();
    this.scheduleRetry();
  }

  /**
   * Set up listener for connectivity changes
   */
  private setupConnectivityListener(): void {
    if (typeof window === "undefined") return;

    window.addEventListener("online", () => {
      debug.log("Connection restored, processing queue...");
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
      debug.error("Failed to save queue", error);
    }
  }

  /**
   * Queue a submission for retry — THE one enqueue path. Recording blobs
   * are converted asynchronously so media always survives the round trip.
   */
  public async enqueue(payload: FeedbackPayload): Promise<string> {
    const recordingBase64 =
      payload.recordingBase64 ??
      (payload.recordingBlob
        ? await blobToBase64(payload.recordingBlob)
        : undefined);

    const submission: QueuedSubmission = {
      id: generateId(),
      widgetKey: payload.widgetKey,
      formData: payload.formData,
      screenshotDataUrl: payload.screenshotDataUrl,
      recordingBlob: recordingBase64,
      recordingMimeType:
        payload.recordingMimeType ?? payload.recordingBlob?.type,
      timestamp: Date.now(),
      retryCount: 0,
      nextRetryAt: Date.now(),
    };

    const queue = this.getQueue();
    queue.push(submission);
    this.saveQueue(queue);
    this.scheduleRetry();

    return submission.id;
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
          debug.warn(
            `Max retries exceeded for submission ${item.id}, removing from queue`
          );
          this.removeFromQueue(item.id);
          continue;
        }

        try {
          const result = await this.submitToApi(item);

          if (result.success) {
            debug.log(
              `Queued submission ${item.id} succeeded, feedback ID: ${result.feedbackId}`
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
          debug.warn(
            `Queue submission ${item.id} failed, scheduling retry`,
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
   * Send one queued item through the shared transport.
   */
  private async submitToApi(item: QueuedSubmission): Promise<SubmissionResult> {
    return this.transport.submit({
      widgetKey: item.widgetKey,
      formData: item.formData,
      screenshotDataUrl: item.screenshotDataUrl,
      recordingBase64: item.recordingBlob,
      recordingMimeType: item.recordingMimeType,
    });
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
