/**
 * Preview Thumbnail Component
 * Shows screenshot or recording preview
 */

import { createElement, createElementFromHTML } from "../dom";
import { icons } from "../icons";
import type { CaptureResult } from "../capture";
import type { RecordingResult } from "../record";

export function renderPreviewThumbnail(
  screenshot: CaptureResult | null,
  recording: RecordingResult | null
): HTMLElement {
  const container = createElement("div", { className: "ff-preview-thumbnail" });

  if (screenshot) {
    const img = createElement("img", {
      className: "ff-preview-img",
    }) as HTMLImageElement;
    img.src = screenshot.dataUrl;
    img.alt = "Screenshot preview";
    container.appendChild(img);
    container.appendChild(
      createElement("span", { className: "ff-preview-label" }, ["Screenshot attached"])
    );
  } else if (recording) {
    const icon = createElement("div", { className: "ff-preview-icon" }, [
      createElementFromHTML(icons.video),
    ]);
    container.appendChild(icon);
    const duration = Math.round(recording.duration / 1000);
    container.appendChild(
      createElement("span", { className: "ff-preview-label" }, [
        `Recording attached (${duration}s)`,
      ])
    );
  }

  return container;
}
