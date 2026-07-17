"use client";

import { useState } from "react";
import { MessageSquare, Camera, Mic, X } from "lucide-react";
import {
  DEFAULT_WIDGET_CONFIG,
  type WidgetDisplayMode,
  type WidgetPosition,
} from "@/convex/widgetConfigShape";

interface WidgetPreviewProps {
  position: WidgetPosition;
  displayMode: WidgetDisplayMode;
  buttonText: string;
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  logoUrl?: string;
}

export function WidgetPreview({
  position,
  displayMode,
  buttonText,
  primaryColor,
  backgroundColor,
  textColor,
  logoUrl,
}: WidgetPreviewProps) {
  const [showModal, setShowModal] = useState(false);

  // Determine position styles for the button
  const positionStyles: Record<WidgetPosition, string> = {
    "bottom-right": "bottom-4 right-4",
    "bottom-left": "bottom-4 left-4",
    "top-right": "top-4 right-4",
    "top-left": "top-4 left-4",
  };

  return (
    <div className="relative h-[500px] overflow-hidden rounded border-2 border-stone-200 bg-gradient-to-br from-stone-50 to-stone-100">
      {/* Fake website content */}
      <div className="p-4">
        <div className="mb-4 h-8 w-32 rounded bg-stone-300"></div>
        <div className="space-y-2">
          <div className="h-4 w-full rounded bg-stone-200"></div>
          <div className="h-4 w-3/4 rounded bg-stone-200"></div>
          <div className="h-4 w-5/6 rounded bg-stone-200"></div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="h-24 rounded bg-stone-200"></div>
          <div className="h-24 rounded bg-stone-200"></div>
        </div>
      </div>

      {/* Widget Button — Auto-Hide previews as resting mostly off-screen */}
      {displayMode === "auto-hide" && (
        <div
          className={`absolute ${
            position.includes("bottom") ? "bottom-16" : "top-16"
          } ${position.includes("right") ? "right-4" : "left-4"} rounded bg-stone-800/80 px-2 py-1 text-[10px] text-white`}
        >
          Auto-Hide: slides in when the cursor nears the corner
        </div>
      )}
      <button
        onClick={() => setShowModal(true)}
        data-display-mode={displayMode}
        className={`absolute ${positionStyles[position]} flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium shadow-lg transition-all hover:scale-105 ${
          displayMode === "auto-hide"
            ? `${position.includes("bottom") ? "translate-y-9" : "-translate-y-9"} opacity-80 hover:translate-y-0 hover:opacity-100`
            : ""
        }`}
        style={{ backgroundColor: primaryColor, color: backgroundColor }}
      >
        {logoUrl ? (
          <img src={logoUrl} alt="" className="h-5 w-5 rounded-full object-cover" />
        ) : (
          <MessageSquare className="h-4 w-4" />
        )}
        <span>{buttonText || DEFAULT_WIDGET_CONFIG.buttonText}</span>
      </button>

      {/* Widget Modal */}
      {showModal && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 p-4">
          <div
            className="w-full max-w-sm rounded-lg shadow-xl"
            style={{ backgroundColor }}
          >
            {/* Modal Header */}
            <div
              className="flex items-center justify-between rounded-t-lg px-4 py-3"
              style={{ backgroundColor: primaryColor }}
            >
              <div className="flex items-center gap-2">
                {logoUrl && (
                  <img src={logoUrl} alt="" className="h-6 w-6 rounded-full object-cover" />
                )}
                <span className="font-medium" style={{ color: backgroundColor }}>
                  {buttonText || DEFAULT_WIDGET_CONFIG.buttonText}
                </span>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 transition-opacity hover:opacity-80"
                style={{ color: backgroundColor }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4">
              {/* Type selector */}
              <div className="mb-4 flex gap-2">
                <button
                  className="flex flex-1 items-center justify-center gap-2 rounded border-2 py-2 text-sm font-medium"
                  style={{ borderColor: primaryColor, color: textColor }}
                >
                  Bug
                </button>
                <button
                  className="flex flex-1 items-center justify-center gap-2 rounded border-2 border-transparent py-2 text-sm"
                  style={{ backgroundColor: `${primaryColor}10`, color: textColor }}
                >
                  Feature
                </button>
              </div>

              {/* Screenshot/Record buttons */}
              <div className="mb-4 flex gap-2">
                <button
                  className="flex flex-1 items-center justify-center gap-2 rounded py-2 text-sm"
                  style={{ backgroundColor: `${primaryColor}15`, color: textColor }}
                >
                  <Camera className="h-4 w-4" />
                  Screenshot
                </button>
                <button
                  className="flex flex-1 items-center justify-center gap-2 rounded py-2 text-sm"
                  style={{ backgroundColor: `${primaryColor}15`, color: textColor }}
                >
                  <Mic className="h-4 w-4" />
                  Record
                </button>
              </div>

              {/* Title input */}
              <input
                type="text"
                placeholder="Title"
                className="mb-3 w-full rounded border px-3 py-2 text-sm"
                style={{ borderColor: `${textColor}30`, color: textColor }}
              />

              {/* Description */}
              <textarea
                placeholder="Describe your feedback..."
                className="mb-4 h-20 w-full resize-none rounded border px-3 py-2 text-sm"
                style={{ borderColor: `${textColor}30`, color: textColor }}
              />

              {/* Submit button */}
              <button
                className="w-full rounded py-2.5 text-sm font-medium"
                style={{ backgroundColor: primaryColor, color: backgroundColor }}
              >
                Submit Feedback
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
