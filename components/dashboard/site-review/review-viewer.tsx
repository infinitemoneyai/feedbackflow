"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { ReviewToolbar } from "./review-toolbar";
import { ReviewFeedbackPanel } from "./review-feedback-panel";
import { ReviewAnnotateOverlay } from "./review-annotate-overlay";
import { ReviewStatusBar } from "./review-status-bar";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface ReviewViewerProps {
  projectId: Id<"projects">;
  teamId: Id<"teams">;
  initialUrl: string;
  onShare?: () => void;
  reviewLinkId?: Id<"reviewLinks">;
  reviewerEmail?: string;
  sessionToken?: string;
}

export function ReviewViewer({
  projectId,
  teamId,
  initialUrl,
  onShare,
  reviewLinkId,
  reviewerEmail,
  sessionToken,
}: ReviewViewerProps): React.JSX.Element {
  const [currentUrl, setCurrentUrl] = useState(initialUrl);
  const [history, setHistory] = useState<string[]>([initialUrl]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [connectionMethod, setConnectionMethod] = useState<
    "iframe" | "proxy" | "loading" | "failed"
  >("loading");
  const [showAnnotateOverlay, setShowAnnotateOverlay] = useState(false);
  const [showFeedbackPanel, setShowFeedbackPanel] = useState(false);
  const [rawScreenshotDataUrl, setRawScreenshotDataUrl] = useState<string | null>(null);
  const [screenshotDataUrl, setScreenshotDataUrl] = useState<string | null>(
    null
  );
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const loadTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Count feedback for current URL
  const feedbackList = useQuery(api.feedback.listFeedback, {
    projectId,
  });
  const feedbackCount =
    feedbackList?.filter(
      (f) => f.metadata?.url === currentUrl
    ).length ?? 0;

  // Always try proxy first — most sites block direct iframe embedding via
  // X-Frame-Options or CSP frame-ancestors. The browser fires onLoad even when
  // content is blocked, making direct-iframe detection unreliable.
  const loadUrl = useCallback((url: string, direct = false) => {
    setConnectionMethod("loading");

    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
    }

    const iframeSrc = direct
      ? url
      : `/api/proxy?url=${encodeURIComponent(url)}`;

    if (iframeRef.current) {
      iframeRef.current.src = iframeSrc;
    }

    // Timeout — if proxy fails after 10s, show fallback
    loadTimeoutRef.current = setTimeout(() => {
      setConnectionMethod("failed");
    }, 10000);
  }, []);

  const handleIframeLoad = useCallback(() => {
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
    }
    setConnectionMethod("proxy");
  }, []);

  const handleIframeError = useCallback(() => {
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
    }
    setConnectionMethod("failed");
  }, []);

  useEffect(() => {
    loadUrl(initialUrl);
    return () => {
      if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
    };
  }, [initialUrl, loadUrl]);

  // Listen for navigation messages from the injected proxy script
  useEffect(() => {
    const handleMessage = (event: MessageEvent): void => {
      if (
        event.data &&
        event.data.type === "feedbackflow-navigate" &&
        typeof event.data.url === "string"
      ) {
        navigate(event.data.url);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history, historyIndex]);

  const navigate = (url: string): void => {
    setCurrentUrl(url);
    const newHistory = [...history.slice(0, historyIndex + 1), url];
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    loadUrl(url);
  };

  const goBack = (): void => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const url = history[newIndex];
      setCurrentUrl(url);
      loadUrl(url);
    }
  };

  const goForward = (): void => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const url = history[newIndex];
      setCurrentUrl(url);
      loadUrl(url);
    }
  };

  const refresh = (): void => {
    loadUrl(currentUrl);
  };

  const captureScreenshot = async (): Promise<void> => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        preferCurrentTab: true,
      } as DisplayMediaStreamOptions);

      const video = document.createElement("video");
      video.srcObject = stream;
      await video.play();

      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(video, 0, 0);

      stream.getTracks().forEach((t) => t.stop());

      const dataUrl = canvas.toDataURL("image/png");
      setRawScreenshotDataUrl(dataUrl);
      setShowAnnotateOverlay(true);
    } catch (error) {
      console.error("Screenshot capture failed:", error);
    }
  };

  const handleSubmitFeedback = async (data: {
    type: "bug" | "feature";
    title: string;
    description: string;
    screenshotDataUrl: string | null;
    url: string;
  }): Promise<void> => {
    const response = await fetch("/api/review/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId,
        teamId,
        type: data.type,
        title: data.title,
        description: data.description,
        screenshotDataUrl: data.screenshotDataUrl,
        url: data.url,
        browserInfo: navigator.userAgent,
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight,
        reviewLinkId,
        sessionToken,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error ?? "Submission failed");
    }
  };

  return (
    <div className="flex flex-col h-full">
      <ReviewToolbar
        currentUrl={currentUrl}
        onNavigate={navigate}
        onBack={goBack}
        onForward={goForward}
        onRefresh={refresh}
        onScreenshot={captureScreenshot}
        onShare={onShare ?? (() => {})}
        canGoBack={historyIndex > 0}
        canGoForward={historyIndex < history.length - 1}
      />

      <div className="flex-1 flex overflow-hidden relative">
        {connectionMethod === "failed" ? (
          <div className="flex-1 flex items-center justify-center bg-muted/50">
            <div className="text-center max-w-md space-y-4">
              <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto" />
              <h3 className="text-lg font-semibold">
                This site can&apos;t be loaded in the viewer
              </h3>
              <p className="text-muted-foreground text-sm">
                Some sites block embedded viewing. Install the FeedbackFlow
                widget for full feedback capabilities.
              </p>
              <Button variant="outline" asChild>
                <a href="/dashboard" target="_blank">
                  Go to Widget Setup
                </a>
              </Button>
            </div>
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            className="flex-1 border-0"
            sandbox="allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
          />
        )}

        {showAnnotateOverlay && rawScreenshotDataUrl && (
          <ReviewAnnotateOverlay
            screenshotDataUrl={rawScreenshotDataUrl}
            onComplete={(annotatedDataUrl) => {
              setScreenshotDataUrl(annotatedDataUrl);
              setShowAnnotateOverlay(false);
              setRawScreenshotDataUrl(null);
              setShowFeedbackPanel(true);
            }}
            onSkip={() => {
              setScreenshotDataUrl(rawScreenshotDataUrl);
              setShowAnnotateOverlay(false);
              setRawScreenshotDataUrl(null);
              setShowFeedbackPanel(true);
            }}
            onCancel={() => {
              setShowAnnotateOverlay(false);
              setRawScreenshotDataUrl(null);
            }}
          />
        )}

        {showFeedbackPanel && (
          <ReviewFeedbackPanel
            screenshotDataUrl={screenshotDataUrl}
            currentUrl={currentUrl}
            onSubmit={handleSubmitFeedback}
            onClose={() => {
              setShowFeedbackPanel(false);
              setScreenshotDataUrl(null);
            }}
          />
        )}
      </div>

      <ReviewStatusBar
        connectionMethod={connectionMethod}
        feedbackCount={feedbackCount}
      />
    </div>
  );
}
