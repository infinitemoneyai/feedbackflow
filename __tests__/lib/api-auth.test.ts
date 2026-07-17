/**
 * Tests for the REST API perimeter adapter — withApiKey owns header
 * parsing, key validation, rate limiting, scope checks, and uniform
 * errors for every /api/v1 route.
 * @see lib/api-auth.ts
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const queryMock = vi.fn();
const mutationMock = vi.fn();

vi.mock("convex/browser", () => ({
  ConvexHttpClient: class MockConvexHttpClient {
    query = queryMock;
    mutation = mutationMock;
  },
}));

const checkApiRateLimitMock = vi.fn();

vi.mock("@/lib/rate-limit", () => ({
  checkApiRateLimit: (prefix: string) => checkApiRateLimitMock(prefix),
}));

import { withApiKey, apiSuccess } from "@/lib/api-auth";

function requestWithAuth(header?: string): Request {
  return new Request("https://feedbackflow.cc/api/v1/feedback", {
    headers: header ? { Authorization: header } : {},
  });
}

const VALIDATION_OK = {
  valid: true,
  teamId: "team_1",
  permissions: ["read:feedback", "read:projects"],
  keyId: "key_1",
};

beforeEach(() => {
  vi.clearAllMocks();
  queryMock.mockResolvedValue(VALIDATION_OK);
  mutationMock.mockResolvedValue(undefined);
  checkApiRateLimitMock.mockResolvedValue({
    success: true,
    limit: 100,
    remaining: 99,
    reset: Date.now() + 60_000,
  });
});

describe("withApiKey", () => {
  const okHandler = vi.fn(async () => apiSuccess({ ok: true }));

  it("401 when the Authorization header is missing or malformed", async () => {
    expect((await withApiKey(requestWithAuth(), "read:feedback", okHandler)).status).toBe(401);
    expect(
      (await withApiKey(requestWithAuth("Basic abc"), "read:feedback", okHandler)).status
    ).toBe(401);
    expect(okHandler).not.toHaveBeenCalled();
  });

  it("401 when the key has the wrong format", async () => {
    const response = await withApiKey(
      requestWithAuth("Bearer sk_not_ours"),
      "read:feedback",
      okHandler
    );
    expect(response.status).toBe(401);
    expect(queryMock).not.toHaveBeenCalled();
  });

  it("401 when validation rejects the key", async () => {
    queryMock.mockResolvedValue({ valid: false, error: "API key revoked" });

    const response = await withApiKey(
      requestWithAuth("Bearer ff_dead"),
      "read:feedback",
      okHandler
    );

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe("API key revoked");
  });

  it("429 with rate-limit headers when the limiter rejects", async () => {
    checkApiRateLimitMock.mockResolvedValue({
      success: false,
      limit: 100,
      remaining: 0,
      reset: Date.now() + 30_000,
    });

    const response = await withApiKey(
      requestWithAuth("Bearer ff_live"),
      "read:feedback",
      okHandler
    );

    expect(response.status).toBe(429);
    expect(response.headers.get("X-RateLimit-Remaining")).toBe("0");
    expect(response.headers.get("Retry-After")).toBeTruthy();
    expect(okHandler).not.toHaveBeenCalled();
  });

  it("403 when the key lacks the required scope", async () => {
    const response = await withApiKey(
      requestWithAuth("Bearer ff_live"),
      "write:feedback",
      okHandler
    );

    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error).toContain("write:feedback");
  });

  it("runs the handler with team, permissions, and rate limit on success", async () => {
    const handler = vi.fn(async (auth: { teamId: string }) =>
      apiSuccess({ teamId: auth.teamId })
    );

    const response = await withApiKey(
      requestWithAuth("Bearer ff_live"),
      "read:feedback",
      handler as never
    );

    expect(response.status).toBe(200);
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({
        teamId: "team_1",
        permissions: VALIDATION_OK.permissions,
        rateLimit: expect.objectContaining({ success: true }),
      })
    );
    // Last-used bookkeeping fired
    expect(mutationMock).toHaveBeenCalled();
  });

  it("rate-limits by key prefix, not the whole key", async () => {
    await withApiKey(requestWithAuth("Bearer ff_abcdefghij"), "read:feedback", okHandler);
    expect(checkApiRateLimitMock).toHaveBeenCalledWith("ff_abcde");
  });

  it("500 when validation throws", async () => {
    queryMock.mockRejectedValue(new Error("convex down"));

    const response = await withApiKey(
      requestWithAuth("Bearer ff_live"),
      "read:feedback",
      okHandler
    );

    expect(response.status).toBe(500);
  });
});
