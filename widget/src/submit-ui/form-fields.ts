/**
 * Form Fields Components
 * Title and description input fields
 */

import { createElement } from "../dom";
import type { FormState } from "./types";

export function renderTitleField(
  value: string,
  onChange: (value: string) => void
): HTMLElement {
  const group = createElement("div", { className: "ff-form-group" }, [
    createElement("label", { className: "ff-form-label" }, ["Title"]),
    createElement("input", {
      className: "ff-submit-title-input ff-input",
      type: "text",
      placeholder: "Brief summary of the issue or request",
    }) as HTMLInputElement,
  ]);

  const input = group.querySelector("input")!;
  input.value = value;
  input.addEventListener("input", (e) => {
    onChange((e.target as HTMLInputElement).value);
  });

  return group;
}

export function renderDescriptionField(
  value: string,
  onChange: (value: string) => void
): HTMLElement {
  const group = createElement("div", { className: "ff-form-group" }, [
    createElement("label", { className: "ff-form-label" }, ["Description"]),
    createElement("textarea", {
      className: "ff-submit-description-input ff-textarea",
      placeholder: "Provide more details about what happened or what you'd like to see...",
    }) as HTMLTextAreaElement,
  ]);

  const textarea = group.querySelector("textarea")!;
  textarea.value = value;
  textarea.addEventListener("input", (e) => {
    onChange((e.target as HTMLTextAreaElement).value);
  });

  return group;
}
