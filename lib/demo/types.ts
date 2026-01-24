// Shared demo types

export type DemoStep = "upload" | "annotate" | "form" | "processing" | "ticket";

export type AnnotationTool = "pen" | "highlighter" | "arrow" | "circle";

export interface DemoTicket {
  id: string;
  issue: string;
  acceptanceCriteria: string[];
  priority: number;
  type: "bug" | "feature";
  tags: string[];
  reproSteps: string[];
  notes: string;
  metadata: {
    browser: string;
    os: string;
    screenSize: string;
    timestamp: string;
  };
}

export interface DemoFeedback {
  type: "bug" | "feature";
  title: string;
  description: string;
}

export interface Point {
  x: number;
  y: number;
}
