/**
 * Tests for the widget config API route — the perimeter for the public
 * getWidgetConfigByKey query (ADR-0001: installed widgets fetch Widget
 * Config at load).
 * @see app/api/widget/config/route.ts
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const queryMock = vi.fn();

vi.mock("convex/browser", () => ({
  ConvexHttpClient: class MockConvexHttpClient {
    query = queryMock;
  },
}));

const checkIpRateLimitMock = vi.fn();

vi.mock("@/lib/rate-limit", () => ({
  checkIpRateLimit: (ip: string) => checkIpRateLimitMock(ip),
  getClientIp: () => "203.0.113.7",
}));

import { GET } from "@/app/api/widget/config/route";

function configRequest(query: string): NextRequest {
  return new NextRequest(`https://feedbackflow.cc/api/widget/config${query}`);
}

beforeEach(() => {
  vi.clearAllMocks();
  checkIpRateLimitMock.mockResolvedValue({
    success: true,
    limit: 10,
    remaining: 9,
    reset: Date.now() + 60_000,
  });
});

describe("GET /api/widget/config", () => {
  it("returns 400 when the widget key is missing", async () => {
    const response = await GET(configRequest(""));

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  it("returns 404 when the widget is unknown or inactive", async () => {
    queryMock.mockResolvedValue(null);

    const response = await GET(configRequest("?key=wk_unknown"));

    expect(response.status).toBe(404);
  });

  it("returns the Widget Config with CORS and cache headers", async () => {
    const config = {
      widgetId: "w1",
      position: "bottom-left",
      buttonText: "Feedback",
      primaryColor: "#1a1a1a",
      backgroundColor: "#F7F5F0",
      textColor: "#1a1a1a",
      logoUrl: undefined,
      displayMode: "always-visible",
    };
    queryMock.mockResolvedValue(config);

    const response = await GET(configRequest("?key=wk_live"));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.config.position).toBe("bottom-left");
    expect(body.config.displayMode).toBe("always-visible");
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect(response.headers.get("Cache-Control")).toContain("max-age=60");
    expect(queryMock).toHaveBeenCalledWith(expect.anything(), {
      widgetKey: "wk_live",
    });
  });

  it("returns 429 when the IP rate limit is exceeded", async () => {
    checkIpRateLimitMock.mockResolvedValue({
      success: false,
      limit: 10,
      remaining: 0,
      reset: Date.now() + 30_000,
    });

    const response = await GET(configRequest("?key=wk_live"));

    expect(response.status).toBe(429);
    expect(queryMock).not.toHaveBeenCalled();
  });

  it("returns 500 with CORS headers when Convex fails", async () => {
    queryMock.mockRejectedValue(new Error("convex down"));

    const response = await GET(configRequest("?key=wk_live"));

    expect(response.status).toBe(500);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
  });
});
