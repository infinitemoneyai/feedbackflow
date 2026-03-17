import { describe, it, expect } from "vitest";

// Extract isValidUrl for unit testing
function isValidUrl(urlString: string): boolean {
  const BLOCKED_PROTOCOLS = ["file:", "ftp:", "data:", "javascript:"];
  try {
    const url = new URL(urlString);
    return (
      !BLOCKED_PROTOCOLS.includes(url.protocol) &&
      (url.protocol === "http:" || url.protocol === "https:")
    );
  } catch {
    return false;
  }
}

describe("proxy URL validation", () => {
  it("accepts valid HTTP URLs", () => {
    expect(isValidUrl("https://example.com")).toBe(true);
    expect(isValidUrl("http://localhost:3000")).toBe(true);
    expect(isValidUrl("https://sub.domain.com/path?q=1")).toBe(true);
  });

  it("rejects invalid URLs", () => {
    expect(isValidUrl("not-a-url")).toBe(false);
    expect(isValidUrl("")).toBe(false);
    expect(isValidUrl("file:///etc/passwd")).toBe(false);
    expect(isValidUrl("ftp://server.com")).toBe(false);
    expect(isValidUrl("javascript:alert(1)")).toBe(false);
    expect(isValidUrl("data:text/html,<h1>hi</h1>")).toBe(false);
  });
});
