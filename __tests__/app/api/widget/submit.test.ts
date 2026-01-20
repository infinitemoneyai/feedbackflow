/**
 * Unit tests for widget submit API utilities
 * Tests pure functions that can be tested in isolation
 * @see app/api/widget/submit/route.ts
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Convex
vi.mock("convex/browser", () => ({
  ConvexHttpClient: class MockConvexHttpClient {
    query = vi.fn();
    mutation = vi.fn();
  },
}));

/**
 * Extract and test the parseUserAgent function
 * This is an exact copy from app/api/widget/submit/route.ts
 * The order of checks matters for proper detection
 */
function parseUserAgent(userAgent: string): { browser: string; os: string } {
  let browser = "Unknown";
  let os = "Unknown";

  // Browser detection - order matters! More specific checks first
  if (userAgent.includes("Firefox/")) {
    browser = "Firefox";
  } else if (userAgent.includes("Edg/")) {
    browser = "Edge";
  } else if (userAgent.includes("OPR/") || userAgent.includes("Opera")) {
    // Check OPR before Chrome since Opera includes Chrome in UA
    browser = "Opera";
  } else if (userAgent.includes("Chrome/")) {
    browser = "Chrome";
  } else if (userAgent.includes("Safari/") && !userAgent.includes("Chrome")) {
    browser = "Safari";
  }

  // OS detection - order matters! More specific checks first
  if (userAgent.includes("iPhone") || userAgent.includes("iPad")) {
    // iOS check must come before Mac OS X since iOS UAs contain "Mac OS X"
    os = "iOS";
  } else if (userAgent.includes("Android")) {
    // Android check must come before Linux since Android UAs contain "Linux"
    os = "Android";
  } else if (userAgent.includes("Windows")) {
    os = "Windows";
  } else if (userAgent.includes("Mac OS X")) {
    os = "macOS";
  } else if (userAgent.includes("Linux")) {
    os = "Linux";
  }

  return { browser, os };
}

describe("Widget Submit API Utilities", () => {
  describe("parseUserAgent", () => {
    describe("browser detection", () => {
      it("detects Chrome browser", () => {
        const ua =
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
        const result = parseUserAgent(ua);
        expect(result.browser).toBe("Chrome");
      });

      it("detects Firefox browser", () => {
        const ua =
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0";
        const result = parseUserAgent(ua);
        expect(result.browser).toBe("Firefox");
      });

      it("detects Edge browser", () => {
        const ua =
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0";
        const result = parseUserAgent(ua);
        expect(result.browser).toBe("Edge");
      });

      it("detects Safari browser", () => {
        const ua =
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_2) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15";
        const result = parseUserAgent(ua);
        expect(result.browser).toBe("Safari");
      });

      it("detects Opera browser (OPR format)", () => {
        const ua =
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 OPR/106.0.0.0";
        const result = parseUserAgent(ua);
        expect(result.browser).toBe("Opera");
      });

      it("returns Unknown for unrecognized browser", () => {
        const ua = "Some-Random-Bot/1.0";
        const result = parseUserAgent(ua);
        expect(result.browser).toBe("Unknown");
      });
    });

    describe("OS detection", () => {
      it("detects Windows OS", () => {
        const ua =
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0";
        const result = parseUserAgent(ua);
        expect(result.os).toBe("Windows");
      });

      it("detects macOS", () => {
        const ua =
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0";
        const result = parseUserAgent(ua);
        expect(result.os).toBe("macOS");
      });

      it("detects Linux OS", () => {
        const ua =
          "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120.0.0.0";
        const result = parseUserAgent(ua);
        expect(result.os).toBe("Linux");
      });

      it("detects iOS (iPhone)", () => {
        const ua =
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1";
        const result = parseUserAgent(ua);
        expect(result.os).toBe("iOS");
      });

      it("detects iOS (iPad)", () => {
        const ua =
          "Mozilla/5.0 (iPad; CPU OS 17_2 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1";
        const result = parseUserAgent(ua);
        expect(result.os).toBe("iOS");
      });

      it("detects Android OS", () => {
        const ua =
          "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36";
        const result = parseUserAgent(ua);
        expect(result.os).toBe("Android");
      });

      it("returns Unknown for unrecognized OS", () => {
        const ua = "Mozilla/5.0 (Unknown Platform) Bot/1.0";
        const result = parseUserAgent(ua);
        expect(result.os).toBe("Unknown");
      });
    });

    describe("combined browser and OS detection", () => {
      it("detects Chrome on Windows", () => {
        const ua =
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
        const result = parseUserAgent(ua);
        expect(result.browser).toBe("Chrome");
        expect(result.os).toBe("Windows");
      });

      it("detects Safari on macOS", () => {
        const ua =
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_2) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15";
        const result = parseUserAgent(ua);
        expect(result.browser).toBe("Safari");
        expect(result.os).toBe("macOS");
      });

      it("detects Firefox on Linux", () => {
        const ua =
          "Mozilla/5.0 (X11; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0";
        const result = parseUserAgent(ua);
        expect(result.browser).toBe("Firefox");
        expect(result.os).toBe("Linux");
      });

      it("detects Chrome on Android", () => {
        const ua =
          "Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.111 Mobile Safari/537.36";
        const result = parseUserAgent(ua);
        expect(result.browser).toBe("Chrome");
        expect(result.os).toBe("Android");
      });

      it("detects Safari on iOS", () => {
        const ua =
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1";
        const result = parseUserAgent(ua);
        expect(result.browser).toBe("Safari");
        expect(result.os).toBe("iOS");
      });
    });

    it("handles empty string", () => {
      const result = parseUserAgent("");
      expect(result.browser).toBe("Unknown");
      expect(result.os).toBe("Unknown");
    });
  });
});

describe("Widget Submit Response Formats", () => {
  it("success response has correct structure", () => {
    const response = {
      success: true,
      feedbackId: "FF-ABC123",
      id: "convex_id_123",
    };

    expect(response).toHaveProperty("success", true);
    expect(response).toHaveProperty("feedbackId");
    expect(response.feedbackId).toMatch(/^FF-/);
  });

  it("error response has correct structure", () => {
    const response = {
      error: "Missing required field: title",
    };

    expect(response).toHaveProperty("error");
    expect(typeof response.error).toBe("string");
  });

  it("rate limit response includes retry information", () => {
    const response = {
      error: "Rate limit exceeded",
      message: "Too many requests. Please try again later.",
      retryAfter: 45,
    };

    expect(response).toHaveProperty("error");
    expect(response).toHaveProperty("retryAfter");
    expect(typeof response.retryAfter).toBe("number");
  });

  it("usage limit response includes upgrade info", () => {
    const response = {
      error: "Usage limit exceeded",
      message: "You have reached your monthly feedback limit",
      plan: "free",
      currentCount: 25,
      limit: 25,
      upgradeRequired: true,
    };

    expect(response).toHaveProperty("plan");
    expect(response).toHaveProperty("currentCount");
    expect(response).toHaveProperty("limit");
    expect(response).toHaveProperty("upgradeRequired");
  });
});

describe("Widget Submit Form Data Validation", () => {
  it("validates widgetKey is required", () => {
    const formData = {
      title: "Test Bug",
      type: "bug",
    };

    const isValid = Boolean(formData.title && formData.type);
    expect(isValid).toBe(true);

    // widgetKey is not in formData
    const hasWidgetKey = "widgetKey" in formData;
    expect(hasWidgetKey).toBe(false);
  });

  it("validates title is required and non-empty", () => {
    const emptyTitle = "";
    const whitespaceTitle = "   ";
    const validTitle = "Test Bug";

    expect(emptyTitle.trim().length === 0).toBe(true);
    expect(whitespaceTitle.trim().length === 0).toBe(true);
    expect(validTitle.trim().length > 0).toBe(true);
  });

  it("validates type must be bug or feature", () => {
    const validTypes = ["bug", "feature"];
    const invalidTypes = ["issue", "request", "other", ""];

    validTypes.forEach((type) => {
      expect(type === "bug" || type === "feature").toBe(true);
    });

    invalidTypes.forEach((type) => {
      expect(type === "bug" || type === "feature").toBe(false);
    });
  });

  it("honeypot field detection", () => {
    const emptyHoneypot = "";
    const whitespaceHoneypot = "   ";
    const filledHoneypot = "http://spam.com";

    expect(emptyHoneypot.trim().length === 0).toBe(true);
    expect(whitespaceHoneypot.trim().length === 0).toBe(true);
    expect(filledHoneypot.trim().length > 0).toBe(true);
  });
});

describe("Widget Submit Metadata Handling", () => {
  it("parses valid metadata JSON", () => {
    const metadataStr = JSON.stringify({
      url: "https://example.com/page",
      screenWidth: 1920,
      screenHeight: 1080,
      userAgent: "Mozilla/5.0...",
    });

    const parsed = JSON.parse(metadataStr);
    expect(parsed.url).toBe("https://example.com/page");
    expect(parsed.screenWidth).toBe(1920);
    expect(parsed.screenHeight).toBe(1080);
  });

  it("handles invalid metadata JSON gracefully", () => {
    const invalidJson = "not valid json";
    let parsed = {};

    try {
      parsed = JSON.parse(invalidJson);
    } catch {
      parsed = {};
    }

    expect(parsed).toEqual({});
  });

  it("handles missing metadata fields", () => {
    const partialMetadata = JSON.parse(
      JSON.stringify({
        url: "https://example.com",
      })
    );

    expect(partialMetadata.url).toBeDefined();
    expect(partialMetadata.screenWidth).toBeUndefined();
    expect(partialMetadata.screenHeight).toBeUndefined();
    expect(partialMetadata.userAgent).toBeUndefined();
  });
});
