/**
 * Screen Recording Module
 * Uses MediaRecorder API for screen capture with audio
 */

export interface RecordingResult {
  blob: Blob;
  duration: number;
  mimeType: string;
}

export interface RecorderCallbacks {
  onStart: () => void;
  onStop: (result: RecordingResult) => void;
  onError: (error: Error) => void;
  onTimeUpdate: (elapsed: number) => void;
}

const MAX_DURATION_MS = 2 * 60 * 1000; // 2 minutes
const PREFERRED_MIME_TYPES = [
  "video/webm;codecs=vp9,opus",
  "video/webm;codecs=vp8,opus",
  "video/webm;codecs=vp9",
  "video/webm;codecs=vp8",
  "video/webm",
  "video/mp4",
];

/**
 * Screen Recorder Class
 * Handles screen capture with microphone audio
 */
export class ScreenRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private screenStream: MediaStream | null = null;
  private audioStream: MediaStream | null = null;
  private combinedStream: MediaStream | null = null;
  private chunks: Blob[] = [];
  private startTime: number = 0;
  private timerInterval: ReturnType<typeof setInterval> | null = null;
  private callbacks: RecorderCallbacks;
  private mimeType: string = "video/webm";

  constructor(callbacks: RecorderCallbacks) {
    this.callbacks = callbacks;
  }

  /**
   * Check if screen recording is supported
   */
  public static isSupported(): boolean {
    return (
      typeof navigator !== "undefined" &&
      "mediaDevices" in navigator &&
      "getDisplayMedia" in navigator.mediaDevices &&
      typeof MediaRecorder !== "undefined"
    );
  }

  /**
   * Get supported MIME type
   */
  private getSupportedMimeType(): string {
    for (const mimeType of PREFERRED_MIME_TYPES) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        return mimeType;
      }
    }
    return "video/webm";
  }

  /**
   * Start recording
   */
  public async start(): Promise<void> {
    if (this.mediaRecorder?.state === "recording") {
      throw new Error("Recording already in progress");
    }

    try {
      // Request screen capture
      this.screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: "browser",
          cursor: "always",
        } as MediaTrackConstraints,
        audio: false, // Screen audio not supported on most browsers
      });

      // Request microphone audio
      try {
        this.audioStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: false,
        });
      } catch {
        // Audio is optional - continue without it
        console.log("FeedbackFlow: Microphone not available, recording without audio");
      }

      // Combine streams
      const tracks = [
        ...this.screenStream.getVideoTracks(),
        ...(this.audioStream?.getAudioTracks() || []),
      ];
      this.combinedStream = new MediaStream(tracks);

      // Get supported mime type
      this.mimeType = this.getSupportedMimeType();

      // Create MediaRecorder
      this.mediaRecorder = new MediaRecorder(this.combinedStream, {
        mimeType: this.mimeType,
        videoBitsPerSecond: 2500000, // 2.5 Mbps for good quality at reasonable size
      });

      this.chunks = [];

      // Handle data available
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.chunks.push(event.data);
        }
      };

      // Handle recording stop
      this.mediaRecorder.onstop = () => {
        this.handleStop();
      };

      // Handle errors
      this.mediaRecorder.onerror = (event) => {
        const errorEvent = event as Event & { error?: DOMException };
        const error = new Error(errorEvent.error?.message || "Recording failed");
        this.cleanup();
        this.callbacks.onError(error);
      };

      // Handle screen share ending (user clicked "Stop sharing")
      this.screenStream.getVideoTracks()[0].onended = () => {
        if (this.mediaRecorder?.state === "recording") {
          this.stop();
        }
      };

      // Start recording
      this.mediaRecorder.start(1000); // Collect data every second
      this.startTime = Date.now();
      this.callbacks.onStart();

      // Start timer
      this.startTimer();
    } catch (error) {
      this.cleanup();
      throw error;
    }
  }

  /**
   * Stop recording
   */
  public stop(): void {
    if (this.mediaRecorder?.state === "recording") {
      this.mediaRecorder.stop();
    }
    this.stopTimer();
  }

  /**
   * Handle recording stopped
   */
  private handleStop(): void {
    const duration = Date.now() - this.startTime;

    // Create blob from chunks
    const blob = new Blob(this.chunks, { type: this.mimeType });

    // Cleanup streams
    this.cleanup();

    // Return result
    this.callbacks.onStop({
      blob,
      duration,
      mimeType: this.mimeType,
    });
  }

  /**
   * Start duration timer
   */
  private startTimer(): void {
    this.timerInterval = setInterval(() => {
      const elapsed = Date.now() - this.startTime;
      this.callbacks.onTimeUpdate(elapsed);

      // Auto-stop at max duration
      if (elapsed >= MAX_DURATION_MS) {
        this.stop();
      }
    }, 100);
  }

  /**
   * Stop timer
   */
  private stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  /**
   * Cleanup resources
   */
  private cleanup(): void {
    this.stopTimer();

    this.screenStream?.getTracks().forEach((track) => track.stop());
    this.audioStream?.getTracks().forEach((track) => track.stop());
    this.combinedStream?.getTracks().forEach((track) => track.stop());

    this.screenStream = null;
    this.audioStream = null;
    this.combinedStream = null;
    this.mediaRecorder = null;
    this.chunks = [];
  }

  /**
   * Check if currently recording
   */
  public isRecording(): boolean {
    return this.mediaRecorder?.state === "recording";
  }

  /**
   * Get elapsed time
   */
  public getElapsed(): number {
    if (!this.startTime) return 0;
    return Date.now() - this.startTime;
  }

  /**
   * Destroy and cleanup
   */
  public destroy(): void {
    this.stop();
    this.cleanup();
  }
}

/**
 * Format milliseconds as MM:SS
 */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * Get max duration in milliseconds
 */
export function getMaxDuration(): number {
  return MAX_DURATION_MS;
}
