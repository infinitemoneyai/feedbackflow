/**
 * Privacy Consent Section Component
 * Checkbox for privacy policy acknowledgment
 */

import { createElement } from "../dom";

export function renderConsentSection(
  privacyPolicyUrl: string,
  checked: boolean,
  onChange: (checked: boolean) => void
): HTMLElement {
  const section = createElement("div", { className: "ff-consent-section" });

  const checkbox = createElement("input", {
    type: "checkbox",
    className: "ff-consent-checkbox",
    id: "ff-privacy-consent",
  }) as HTMLInputElement;
  checkbox.checked = checked;
  checkbox.addEventListener("change", (e) => {
    onChange((e.target as HTMLInputElement).checked);
  });

  const label = createElement("label", {
    className: "ff-consent-label",
    for: "ff-privacy-consent",
  }, [
    checkbox,
    createElement("span", { className: "ff-consent-text" }, [
      "I acknowledge that my feedback may include personal information and agree to the ",
      createElement("a", {
        href: privacyPolicyUrl,
        target: "_blank",
        className: "ff-consent-link",
      }, ["privacy policy"]),
      ".",
    ]),
  ]);

  section.appendChild(label);
  return section;
}
