/**
 * Type Selector Component
 * Allows user to choose between Bug Report and Feature Request
 */

import { createElement, createElementFromHTML } from "../dom";
import { icons } from "../icons";
import type { FeedbackType } from "./types";

interface TypeOption {
  type: FeedbackType;
  label: string;
  icon: string;
  color: string;
}

const TYPE_OPTIONS: TypeOption[] = [
  { type: "bug", label: "Bug Report", icon: icons.bug, color: "#E85D52" },
  { type: "feature", label: "Feature Request", icon: icons.lightbulb, color: "#6B9AC4" },
];

export function renderTypeSelector(
  selectedType: FeedbackType,
  onTypeChange: (type: FeedbackType) => void
): HTMLElement {
  const container = createElement("div", { className: "ff-type-selector" });

  TYPE_OPTIONS.forEach((option) => {
    const isSelected = selectedType === option.type;
    const optionEl = createElement(
      "button",
      {
        className: `ff-type-option ${isSelected ? "ff-selected" : ""}`,
        type: "button",
        "data-type": option.type,
      },
      [
        createElement("div", { className: "ff-type-icon" }, [
          createElementFromHTML(option.icon),
        ]),
        createElement("span", { className: "ff-type-label" }, [option.label]),
      ]
    );

    // Apply color to icon
    const iconEl = optionEl.querySelector(".ff-type-icon") as HTMLElement;
    if (iconEl) {
      iconEl.style.color = option.color;
      if (isSelected) {
        iconEl.style.backgroundColor = `${option.color}20`;
        iconEl.style.borderColor = `${option.color}40`;
      }
    }

    optionEl.addEventListener("click", () => onTypeChange(option.type));
    container.appendChild(optionEl);
  });

  return container;
}
