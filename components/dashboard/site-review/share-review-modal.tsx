"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Check, Trash2 } from "lucide-react";

interface ShareReviewModalProps {
  projectId: Id<"projects">;
  siteUrl: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShareReviewModal({
  projectId,
  siteUrl,
  open,
  onOpenChange,
}: ShareReviewModalProps): JSX.Element {
  const [password, setPassword] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const createLink = useMutation(api.reviewLinks.createReviewLink);
  const deactivateLink = useMutation(api.reviewLinks.deactivateReviewLink);
  const existingLinks = useQuery(api.reviewLinks.getReviewLinksForProject, {
    projectId,
  });

  const activeLinks =
    existingLinks?.filter(
      (l) => l.isActive && (!l.expiresAt || l.expiresAt > Date.now())
    ) ?? [];

  const handleCreate = async (): Promise<void> => {
    setIsCreating(true);
    try {
      await createLink({
        projectId,
        siteUrl,
        password: password.trim() || undefined,
      });
      setPassword("");
    } catch (error) {
      console.error("Failed to create review link:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopy = (slug: string): void => {
    const url = `${window.location.origin}/review/${slug}`;
    navigator.clipboard.writeText(url);
    setCopied(slug);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Review Link</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {activeLinks.length > 0 && (
            <div className="space-y-2">
              <Label>Active Links</Label>
              {activeLinks.map((link) => (
                <div
                  key={link._id}
                  className="flex items-center gap-2 p-2 rounded-md bg-muted"
                >
                  <code className="text-xs flex-1 truncate">
                    {window.location.origin}/review/{link.slug}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleCopy(link.slug)}
                  >
                    {copied === link.slug ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={() =>
                      deactivateLink({ reviewLinkId: link._id })
                    }
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-3 pt-2 border-t">
            <Label>Create New Link</Label>
            <div>
              <Label className="text-xs text-muted-foreground">
                Password (optional)
              </Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Leave empty for no password"
              />
            </div>
            <Button
              onClick={handleCreate}
              disabled={isCreating}
              className="w-full"
            >
              {isCreating ? "Creating..." : "Generate Review Link"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
