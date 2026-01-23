/**
 * State View Components
 * Loading, Success, and Error states
 */

import { createElement, createElementFromHTML } from "../dom";
import { icons } from "../icons";
import type { WidgetConfig } from "../types";

export function renderLoadingState(): HTMLElement {
  const loading = createElement("div", { className: "ff-submit-loading" });

  const spinner = createElement("div", { className: "ff-spinner" }, [
    createElementFromHTML(icons.spinner),
  ]);

  const text = createElement("p", { className: "ff-loading-text" }, [
    "Submitting your feedback...",
  ]);

  loading.appendChild(spinner);
  loading.appendChild(text);

  return loading;
}

export function renderSuccessState(
  feedbackId: string,
  warningMessage: string,
  onClose: () => void
): HTMLElement {
  const success = createElement("div", { className: "ff-submit-success" });

  const icon = createElement("div", { className: "ff-success-icon" }, [
    createElementFromHTML(icons.check),
  ]);

  const title = createElement("h3", { className: "ff-success-title" }, [
    "Feedback Submitted!",
  ]);

  const message = createElement("p", { className: "ff-success-message" }, [
    "Thank you for your feedback. We'll review it shortly.",
  ]);

  // Show warning if recording was too large
  if (warningMessage) {
    const warning = createElement("div", { className: "ff-success-warning" }, [
      createElement("div", { className: "ff-warning-icon" }, [
        createElementFromHTML(icons.warning || icons.info),
      ]),
      createElement("p", { className: "ff-warning-text" }, [warningMessage]),
    ]);
    success.appendChild(icon);
    success.appendChild(title);
    success.appendChild(warning);
  } else {
    success.appendChild(icon);
    success.appendChild(title);
    success.appendChild(message);
  }

  const idLabel = createElement("div", { className: "ff-success-id" }, [
    createElement("span", { className: "ff-id-label" }, ["Reference ID: "]),
    createElement("code", { className: "ff-id-value" }, [feedbackId]),
  ]);

  const closeButton = createButton("Close", "primary", onClose);

  success.appendChild(idLabel);
  success.appendChild(closeButton);

  return success;
}

export function renderErrorState(
  errorMessage: string,
  onRetry: () => void,
  onClose: () => void
): HTMLElement {
  const error = createElement("div", { className: "ff-submit-error" });

  const icon = createElement("div", { className: "ff-error-icon" }, [
    createElementFromHTML(icons.close),
  ]);

  const title = createElement("h3", { className: "ff-error-title" }, [
    "Submission Failed",
  ]);

  const message = createElement("p", { className: "ff-error-message" }, [
    errorMessage || "Something went wrong. Your feedback has been saved and will be submitted automatically when the connection is restored.",
  ]);

  const actions = createElement("div", { className: "ff-error-actions" }, [
    createButton("Try Again", "secondary", onRetry),
    createButton("Close", "primary", onClose),
  ]);

  error.appendChild(icon);
  error.appendChild(title);
  error.appendChild(message);
  error.appendChild(actions);

  return error;
}

function createButton(
  text: string,
  variant: "primary" | "secondary",
  onClick: () => void
): HTMLElement {
  const button = createElement(
    "button",
    {
      className: `ff-submit-btn ff-btn-${variant}`,
      type: "button",
    },
    [text]
  );

  button.addEventListener("click", onClick);
  return button;
}
