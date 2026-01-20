/**
 * Unit tests for API authentication utilities
 * @see lib/api-auth.ts
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  hasPermission,
  apiError,
  apiSuccess,
  checkApiRateLimit,
  addRateLimitHeaders,
} from "@/lib/api-auth";

// Mock the Convex client - we can't test validateBearerToken without it
// but we can test the helper functions
vi.mock("convex/browser", () => {
  return {
    ConvexHttpClient: class MockConvexHttpClient {
      query = vi.fn();
      constructor() {}
    },
  };
});

describe("API Auth Utilities", () => {
  describe("hasPermission", () => {
    it("returns true when permission is in the list", () => {
      const permissions = ["read", "write", "admin"];
      expect(hasPermission(permissions, "read")).toBe(true);
      expect(hasPermission(permissions, "write")).toBe(true);
      expect(hasPermission(permissions, "admin")).toBe(true);
    });

    it("returns false when permission is not in the list", () => {
      const permissions = ["read", "write"];
      expect(hasPermission(permissions, "admin")).toBe(false);
      expect(hasPermission(permissions, "delete")).toBe(false);
    });

    it("returns false when permissions array is undefined", () => {
      expect(hasPermission(undefined, "read")).toBe(false);
    });

    it("returns false when permissions array is empty", () => {
      expect(hasPermission([], "read")).toBe(false);
    });
  });

  describe("apiError", () => {
    it("creates error response with default status 400", async () => {
      const response = apiError("Something went wrong");

      expect(response.status).toBe(400);
      expect(response.headers.get("Content-Type")).toBe("application/json");

      const body = await response.json();
      expect(body.error).toBe("Something went wrong");
      expect(body.status).toBe(400);
    });

    it("creates error response with custom status", async () => {
      const response = apiError("Not found", 404);

      expect(response.status).toBe(404);

      const body = await response.json();
      expect(body.error).toBe("Not found");
      expect(body.status).toBe(404);
    });

    it("includes custom headers", async () => {
      const response = apiError("Rate limited", 429, {
        "Retry-After": "60",
      });

      expect(response.status).toBe(429);
      expect(response.headers.get("Retry-After")).toBe("60");
      expect(response.headers.get("Content-Type")).toBe("application/json");
    });

    it("creates error response for unauthorized", async () => {
      const response = apiError("Unauthorized", 401);

      expect(response.status).toBe(401);

      const body = await response.json();
      expect(body.error).toBe("Unauthorized");
    });

    it("creates error response for internal server error", async () => {
      const response = apiError("Internal server error", 500);

      expect(response.status).toBe(500);

      const body = await response.json();
      expect(body.error).toBe("Internal server error");
    });
  });

  describe("apiSuccess", () => {
    it("creates success response with default status 200", async () => {
      const data = { id: 1, name: "Test" };
      const response = apiSuccess(data);

      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe("application/json");

      const body = await response.json();
      expect(body).toEqual(data);
    });

    it("creates success response with custom status", async () => {
      const data = { created: true };
      const response = apiSuccess(data, 201);

      expect(response.status).toBe(201);

      const body = await response.json();
      expect(body).toEqual(data);
    });

    it("includes custom headers", async () => {
      const data = { items: [] };
      const response = apiSuccess(data, 200, {
        "X-Total-Count": "100",
      });

      expect(response.headers.get("X-Total-Count")).toBe("100");
      expect(response.headers.get("Content-Type")).toBe("application/json");
    });

    it("handles array data", async () => {
      const data = [
        { id: 1 },
        { id: 2 },
        { id: 3 },
      ];
      const response = apiSuccess(data);

      const body = await response.json();
      expect(body).toHaveLength(3);
      expect(body[0].id).toBe(1);
    });

    it("handles null data", async () => {
      const response = apiSuccess(null);

      const body = await response.json();
      expect(body).toBeNull();
    });
  });

  describe("checkApiRateLimit", () => {
    beforeEach(() => {
      // Reset module to clear rate limit stores
      vi.resetModules();
    });

    it("allows first request for new API key", async () => {
      const { checkApiRateLimit } = await import("@/lib/api-auth");

      const result = checkApiRateLimit("ff_testkey1");

      expect(result.success).toBe(true);
      expect(result.limit).toBe(100);
      expect(result.remaining).toBe(99);
    });

    it("decrements remaining count on subsequent requests", async () => {
      const { checkApiRateLimit } = await import("@/lib/api-auth");
      const keyPrefix = "ff_testkey2";

      const first = checkApiRateLimit(keyPrefix);
      expect(first.remaining).toBe(99);

      const second = checkApiRateLimit(keyPrefix);
      expect(second.remaining).toBe(98);
    });

    it("blocks after 100 requests per minute", async () => {
      const { checkApiRateLimit } = await import("@/lib/api-auth");
      const keyPrefix = "ff_testkey3";

      // Use up all 100 requests
      for (let i = 0; i < 100; i++) {
        checkApiRateLimit(keyPrefix);
      }

      // 101st request should be blocked
      const result = checkApiRateLimit(keyPrefix);
      expect(result.success).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it("treats different API keys independently", async () => {
      const { checkApiRateLimit } = await import("@/lib/api-auth");

      // Use up limit for key1
      for (let i = 0; i < 100; i++) {
        checkApiRateLimit("ff_key1");
      }

      // key2 should still be allowed
      const result = checkApiRateLimit("ff_key2");
      expect(result.success).toBe(true);
      expect(result.remaining).toBe(99);
    });
  });

  describe("addRateLimitHeaders", () => {
    it("adds all rate limit headers", () => {
      const headers: Record<string, string> = {};
      const rateLimit = {
        limit: 100,
        remaining: 75,
        resetAt: 1704067200000, // 2024-01-01 00:00:00 UTC
      };

      const result = addRateLimitHeaders(headers, rateLimit);

      expect(result["X-RateLimit-Limit"]).toBe("100");
      expect(result["X-RateLimit-Remaining"]).toBe("75");
      expect(result["X-RateLimit-Reset"]).toBe("1704067200");
    });

    it("preserves existing headers", () => {
      const headers = {
        "Content-Type": "application/json",
        "X-Custom": "value",
      };
      const rateLimit = {
        limit: 100,
        remaining: 50,
        resetAt: 1704067200000,
      };

      const result = addRateLimitHeaders(headers, rateLimit);

      expect(result["Content-Type"]).toBe("application/json");
      expect(result["X-Custom"]).toBe("value");
      expect(result["X-RateLimit-Limit"]).toBe("100");
    });

    it("handles zero remaining", () => {
      const headers: Record<string, string> = {};
      const rateLimit = {
        limit: 100,
        remaining: 0,
        resetAt: 1704067200000,
      };

      const result = addRateLimitHeaders(headers, rateLimit);

      expect(result["X-RateLimit-Remaining"]).toBe("0");
    });
  });
});
