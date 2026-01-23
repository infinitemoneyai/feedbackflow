/**
 * Shared types for Submit UI components
 */

import type { WidgetConfig } from "../types";
import type { CaptureResult } from "../capture";
import type { RecordingResult } from "../record";

export type FeedbackType = "bug" | "feature";
export type SubmitState = "form" | "loading" | "success" | "error";

export interface FormState {
  title: string;
  description: string;
  type: FeedbackType;
  email: string;
  name: string;
  privacyConsent: boolean;
}

export interface SubmitUICallbacks {
  onSuccess: (feedbackId: string) => void;
  onCancel: () => void;
  onError: (error: string) => void;
}

export interface SubmitUIContext {
  config: WidgetConfig;
  screenshot: CaptureResult | null;
  recording: RecordingResult | null;
  formState: FormState;
  onFormStateChange: (updates: Partial<FormState>) => void;
}
