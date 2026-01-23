/**
 * Unit tests for rate limiting functionality
 * @see lib/rate-limit.ts
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  checkIpRateLimit,
  checkWidgetDailyRateLimit,
  getClientIp,
} from "@/lib/rate-limit";

describe("Rate Limiting", () => {
  beforeEach(() => {
    // Reset module state between tests by clearing the internal stores
    // This is necessary because the rate limit stores are module-level
    vi.resetModules();
  });

  describe("checkIpRateLimit", () => {
    it("allows first request from new IP", async () => {
      // Dynamically import to get fresh module state
      const { checkIpRateLimit } = await import("@/lib/rate-limit");

      const result = await checkIpRateLimit("192.168.1.1");

      expect(result.success).toBe(true);
      expect(result.limit).toBe(10);
      expect(result.remaining).toBe(9);
      expect(result.reset).toBeGreaterThan(Date.now());
    });

    it("decrements remaining count on subsequent requests", async () => {
      const { checkIpRateLimit } = await import("@/lib/rate-limit");
      const ip = "192.168.1.2";

      // First request
      const first = await checkIpRateLimit(ip);
      expect(first.remaining).toBe(9);

      // Second request
      const second = await checkIpRateLimit(ip);
      expect(second.remaining).toBe(8);

      // Third request
      const third = await checkIpRateLimit(ip);
      expect(third.remaining).toBe(7);
    });

    it("blocks requests after limit is reached", async () => {
      const { checkIpRateLimit } = await import("@/lib/rate-limit");
      const ip = "192.168.1.3";

      // Use up all 10 requests
      for (let i = 0; i < 10; i++) {
        await checkIpRateLimit(ip);
      }

      // 11th request should be blocked
      const result = await checkIpRateLimit(ip);
      expect(result.success).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it("treats different IPs independently", async () => {
      const { checkIpRateLimit } = await import("@/lib/rate-limit");
      const ip1 = "192.168.1.10";
      const ip2 = "192.168.1.11";

      // Use up limit for ip1
      for (let i = 0; i < 10; i++) {
        await checkIpRateLimit(ip1);
      }

      // ip2 should still be allowed
      const result = await checkIpRateLimit(ip2);
      expect(result.success).toBe(true);
      expect(result.remaining).toBe(9);
    });

    it("resets after window expires", async () => {
      const { checkIpRateLimit } = await import("@/lib/rate-limit");
      const ip = "192.168.1.20";

      // Use up all requests
      for (let i = 0; i < 10; i++) {
        await checkIpRateLimit(ip);
      }

      // Should be blocked
      expect((await checkIpRateLimit(ip)).success).toBe(false);

      // Mock time passing beyond the window (1 minute = 60000ms)
      vi.useFakeTimers();
      vi.advanceTimersByTime(61000);

      // Re-import to get new module after time advance
      vi.resetModules();
      const { checkIpRateLimit: freshCheckIpRateLimit } = await import(
        "@/lib/rate-limit"
      );

      // Should be allowed again
      const result = await freshCheckIpRateLimit(ip);
      expect(result.success).toBe(true);

      vi.useRealTimers();
    });
  });

  describe("checkWidgetDailyRateLimit", () => {
    it("allows first submission for a widget", async () => {
      const { checkWidgetDailyRateLimit } = await import("@/lib/rate-limit");

      const result = await checkWidgetDailyRateLimit("wk_test123");

      expect(result.success).toBe(true);
      expect(result.limit).toBe(100);
      expect(result.remaining).toBe(99);
    });

    it("decrements remaining count on subsequent requests", async () => {
      const { checkWidgetDailyRateLimit } = await import("@/lib/rate-limit");
      const widgetKey = "wk_test456";

      // First request
      const first = await checkWidgetDailyRateLimit(widgetKey);
      expect(first.remaining).toBe(99);

      // Second request
      const second = await checkWidgetDailyRateLimit(widgetKey);
      expect(second.remaining).toBe(98);
    });

    it("blocks when limit is reached", async () => {
      const { checkWidgetDailyRateLimit } = await import("@/lib/rate-limit");
      const widgetKey = "wk_test789";

      // Use up all 100 requests
      for (let i = 0; i < 100; i++) {
        await checkWidgetDailyRateLimit(widgetKey);
      }

      // 101st request should be blocked
      const result = await checkWidgetDailyRateLimit(widgetKey);
      expect(result.success).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it("treats different widgets independently", async () => {
      const { checkWidgetDailyRateLimit } = await import("@/lib/rate-limit");

      // Widget 1 - use up limit
      for (let i = 0; i < 100; i++) {
        await checkWidgetDailyRateLimit("wk_widget1");
      }
      const widget1Result = await checkWidgetDailyRateLimit("wk_widget1");
      expect(widget1Result.success).toBe(false);

      // Widget 2 should still be allowed
      const widget2Result = await checkWidgetDailyRateLimit("wk_widget2");
      expect(widget2Result.success).toBe(true);
    });

  });

  describe("getClientIp", () => {
    it("returns x-forwarded-for IP when present", () => {
      const request = new Request("http://localhost", {
        headers: {
          "x-forwarded-for": "203.0.113.195, 70.41.3.18, 150.172.238.178",
        },
      });

      const ip = getClientIp(request);
      expect(ip).toBe("203.0.113.195");
    });

    it("returns x-real-ip when x-forwarded-for is absent", () => {
      const request = new Request("http://localhost", {
        headers: {
          "x-real-ip": "203.0.113.100",
        },
      });

      const ip = getClientIp(request);
      expect(ip).toBe("203.0.113.100");
    });

    it("returns cf-connecting-ip when other headers are absent", () => {
      const request = new Request("http://localhost", {
        headers: {
          "cf-connecting-ip": "203.0.113.50",
        },
      });

      const ip = getClientIp(request);
      expect(ip).toBe("203.0.113.50");
    });

    it("returns fallback IP when no headers are present", () => {
      const request = new Request("http://localhost");

      const ip = getClientIp(request);
      expect(ip).toBe("127.0.0.1");
    });

    it("prefers x-forwarded-for over other headers", () => {
      const request = new Request("http://localhost", {
        headers: {
          "x-forwarded-for": "203.0.113.195",
          "x-real-ip": "203.0.113.100",
          "cf-connecting-ip": "203.0.113.50",
        },
      });

      const ip = getClientIp(request);
      expect(ip).toBe("203.0.113.195");
    });

    it("trims whitespace from IP addresses", () => {
      const request = new Request("http://localhost", {
        headers: {
          "x-forwarded-for": "  203.0.113.195  , 70.41.3.18",
        },
      });

      const ip = getClientIp(request);
      expect(ip).toBe("203.0.113.195");
    });
  });
});
