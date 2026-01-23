/**
 * Optional Fields Component
 * Email and name input fields
 */

import { createElement, createElementFromHTML } from "../dom";
import { icons } from "../icons";

export function renderOptionalFields(
  email: string,
  name: string,
  onEmailChange: (value: string) => void,
  onNameChange: (value: string) => void
): HTMLElement {
  const section = createElement("div", { className: "ff-optional-section" });

  const header = createElement("div", { className: "ff-optional-header" }, [
    createElement("span", { className: "ff-optional-label" }, ["Optional"]),
  ]);
  section.appendChild(header);

  // Email input
  const emailGroup = createElement("div", { className: "ff-form-group ff-form-group-sm" }, [
    createElement("label", { className: "ff-form-label-sm" }, [
      createElementFromHTML(icons.mail),
      "Email (for follow-up)",
    ]),
    createElement("input", {
      className: "ff-input ff-input-sm",
      type: "email",
      placeholder: "your@email.com",
    }) as HTMLInputElement,
  ]);
  const emailInput = emailGroup.querySelector("input")!;
  emailInput.value = email;
  emailInput.addEventListener("input", (e) => {
    onEmailChange((e.target as HTMLInputElement).value);
  });
  section.appendChild(emailGroup);

  // Name input
  const nameGroup = createElement("div", { className: "ff-form-group ff-form-group-sm" }, [
    createElement("label", { className: "ff-form-label-sm" }, [
      createElementFromHTML(icons.user),
      "Name",
    ]),
    createElement("input", {
      className: "ff-input ff-input-sm",
      type: "text",
      placeholder: "Your name",
    }) as HTMLInputElement,
  ]);
  const nameInput = nameGroup.querySelector("input")!;
  nameInput.value = name;
  nameInput.addEventListener("input", (e) => {
    onNameChange((e.target as HTMLInputElement).value);
  });
  section.appendChild(nameGroup);

  return section;
}
