/**
 * DOM utilities for creating widget elements
 * No external dependencies - vanilla JS
 */

/**
 * Create an element with attributes and children
 */
export function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs?: Record<string, string>,
  children?: (Node | string)[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);

  if (attrs) {
    for (const [key, value] of Object.entries(attrs)) {
      if (key === "className") {
        el.className = value;
      } else {
        el.setAttribute(key, value);
      }
    }
  }

  if (children) {
    for (const child of children) {
      if (typeof child === "string") {
        el.appendChild(document.createTextNode(child));
      } else {
        el.appendChild(child);
      }
    }
  }

  return el;
}

/**
 * Create element from HTML string
 */
export function createElementFromHTML(html: string): HTMLElement {
  const template = document.createElement("template");
  template.innerHTML = html.trim();
  return template.content.firstChild as HTMLElement;
}

/**
 * Inject styles into the document
 */
export function injectStyles(css: string, id: string): void {
  if (document.getElementById(id)) {
    return;
  }

  const style = createElement("style", { id, type: "text/css" }, [css]);
  document.head.appendChild(style);
}

/**
 * Create the widget root container
 */
export function createWidgetRoot(): HTMLDivElement {
  const existing = document.getElementById("ff-widget-root");
  if (existing) {
    return existing as HTMLDivElement;
  }

  const root = createElement("div", {
    id: "ff-widget-root",
    className: "ff-widget-root",
  });

  document.body.appendChild(root);
  return root;
}
