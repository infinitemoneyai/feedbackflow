"use client";

import { useState } from "react";
import { ZoomIn, ZoomOut, X } from "lucide-react";

export function ScreenshotViewer({ url }: { url: string }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  const handleZoomIn = () => setZoomLevel((z) => Math.min(z + 0.25, 3));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(z - 0.25, 0.5));
  const handleResetZoom = () => setZoomLevel(1);

  return (
    <>
      <div className="group relative cursor-zoom-in overflow-hidden border-2 border-retro-black bg-white p-2">
        <img
          src={url}
          alt="Screenshot"
          className="w-full"
          onClick={() => setIsFullscreen(true)}
        />
      </div>

      {/* Fullscreen modal */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={() => setIsFullscreen(false)}
        >
          <div className="absolute right-4 top-4 z-10 flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleZoomOut();
              }}
              className="rounded border border-white/20 bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
              title="Zoom out"
            >
              <ZoomOut className="h-5 w-5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleResetZoom();
              }}
              className="rounded border border-white/20 bg-white/10 px-3 py-2 font-mono text-sm text-white transition-colors hover:bg-white/20"
            >
              {Math.round(zoomLevel * 100)}%
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleZoomIn();
              }}
              className="rounded border border-white/20 bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
              title="Zoom in"
            >
              <ZoomIn className="h-5 w-5" />
            </button>
            <button
              onClick={() => setIsFullscreen(false)}
              className="ml-2 rounded border border-white/20 bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
              title="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div
            className="max-h-[90vh] max-w-[90vw] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={url}
              alt="Screenshot fullscreen"
              style={{ transform: `scale(${zoomLevel})`, transformOrigin: "center center" }}
              className="transition-transform duration-200"
            />
          </div>
        </div>
      )}
    </>
  );
}
