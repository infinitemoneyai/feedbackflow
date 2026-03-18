"use client";

import { useState, useEffect, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ArrowRight, RotateCw, Camera, Share2 } from "lucide-react";

interface ReviewToolbarProps {
  currentUrl: string;
  onNavigate: (url: string) => void;
  onBack: () => void;
  onForward: () => void;
  onRefresh: () => void;
  onScreenshot: () => void;
  onShare: () => void;
  canGoBack: boolean;
  canGoForward: boolean;
}

export function ReviewToolbar({
  currentUrl,
  onNavigate,
  onBack,
  onForward,
  onRefresh,
  onScreenshot,
  onShare,
  canGoBack,
  canGoForward,
}: ReviewToolbarProps): React.JSX.Element {
  const [urlInput, setUrlInput] = useState(currentUrl);

  // Sync input when currentUrl changes (e.g., from in-iframe navigation)
  useEffect(() => {
    setUrlInput(currentUrl);
  }, [currentUrl]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Enter") {
      let url = urlInput.trim();
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        url = "https://" + url;
      }
      onNavigate(url);
    }
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-background border-b">
      <div className="flex gap-1">
        <Button variant="ghost" size="icon" onClick={onBack} disabled={!canGoBack} className="h-8 w-8">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onForward} disabled={!canGoForward} className="h-8 w-8">
          <ArrowRight className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onRefresh} className="h-8 w-8">
          <RotateCw className="h-4 w-4" />
        </Button>
      </div>
      <Input
        value={urlInput}
        onChange={(e) => setUrlInput(e.target.value)}
        onKeyDown={handleKeyDown}
        className="flex-1 font-mono text-sm h-8"
        placeholder="Enter URL..."
      />
      <div className="flex gap-1">
        <Button onClick={onScreenshot} size="sm" className="h-8">
          <Camera className="h-4 w-4 mr-1" />
          Screenshot
        </Button>
        <Button variant="outline" onClick={onShare} size="sm" className="h-8">
          <Share2 className="h-4 w-4 mr-1" />
          Share
        </Button>
      </div>
    </div>
  );
}
