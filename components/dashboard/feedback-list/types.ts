import { Id } from "@/convex/_generated/dataModel";

export type FeedbackType = "bug" | "feature";
export type FeedbackStatus = "new" | "triaging" | "drafted" | "exported" | "resolved";
export type FeedbackPriority = "low" | "medium" | "high" | "critical";
export type SortBy = "createdAt" | "priority" | "status";
export type SortOrder = "asc" | "desc";

export interface FeedbackFilters {
  type: FeedbackType | null;
  status: FeedbackStatus | null;
  priority: FeedbackPriority | null;
  sortBy: SortBy;
  sortOrder: SortOrder;
}

export interface SearchMeta {
  score: number;
  matchedFields: string[];
  matchedCommentIds: string[];
}

export interface FeedbackItem {
  _id: Id<"feedback">;
  ticketNumber?: number;
  type: FeedbackType;
  title: string;
  description?: string;
  priority: FeedbackPriority;
  status: FeedbackStatus;
  createdAt: number;
  submitterName?: string;
  submitterEmail?: string;
  screenshotUrl?: string;
  recordingUrl?: string;
  tags: string[];
  metadata?: any;
  _searchMeta?: SearchMeta;
}

export interface BulkExportResult {
  success: boolean;
  count: number;
  error?: string;
  provider?: string;
}
