"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { X } from "lucide-react";

interface ReviewFeedbackPanelProps {
  screenshotDataUrl: string | null;
  currentUrl: string;
  onSubmit: (data: {
    type: "bug" | "feature";
    title: string;
    description: string;
    screenshotDataUrl: string | null;
    url: string;
  }) => Promise<void>;
  onClose: () => void;
}

export function ReviewFeedbackPanel({
  screenshotDataUrl,
  currentUrl,
  onSubmit,
  onClose,
}: ReviewFeedbackPanelProps): React.JSX.Element {
  const [type, setType] = useState<"bug" | "feature">("bug");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (): Promise<void> => {
    if (!title.trim()) return;
    setIsSubmitting(true);
    try {
      await onSubmit({
        type,
        title: title.trim(),
        description: description.trim(),
        screenshotDataUrl,
        url: currentUrl,
      });
      onClose();
    } catch (error) {
      console.error("Failed to submit feedback:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-80 border-l bg-background flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold">New Feedback</h3>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {screenshotDataUrl && (
          <div className="rounded-md border overflow-hidden">
            <img src={screenshotDataUrl} alt="Screenshot" className="w-full" />
          </div>
        )}

        <div className="flex gap-2">
          <Button
            variant={type === "bug" ? "default" : "outline"}
            size="sm"
            onClick={() => setType("bug")}
            className="flex-1"
          >
            Bug
          </Button>
          <Button
            variant={type === "feature" ? "default" : "outline"}
            size="sm"
            onClick={() => setType("feature")}
            className="flex-1"
          >
            Feature
          </Button>
        </div>

        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Title</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Brief description..."
          />
        </div>

        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Description</label>
          <Textarea
            value={description}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
            placeholder="More details..."
            rows={4}
          />
        </div>
      </div>

      <div className="p-4 border-t">
        <Button
          onClick={handleSubmit}
          disabled={!title.trim() || isSubmitting}
          className="w-full"
        >
          {isSubmitting ? "Submitting..." : "Submit Feedback"}
        </Button>
      </div>
    </div>
  );
}
