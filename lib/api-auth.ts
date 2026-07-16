import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { checkApiRateLimit, type RateLimitResult } from "@/lib/rate-limit";

/**
 * The REST API perimeter adapter. Every /api/v1 route runs through
 * withApiKey — header parsing, key validation, rate limiting (Upstash via
 * lib/rate-limit, in-memory-free), typed scope checks, last-used
 * bookkeeping, and uniform error responses live here, once.
 */

export type ApiScope = "read:feedback" | "write:feedback" | "read:projects";

export interface ApiKeyContext {
  teamId: Id<"teams">;
  permissions: string[];
  rateLimit: RateLimitResult;
}

function getConvexClient(): ConvexHttpClient {
  return new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL || "");
}

/**
 * Create an error response for API routes
 */
export function apiError(
  message: string,
  status: number = 400,
  headers?: Record<string, string>
): Response {
  return new Response(JSON.stringify({ error: message, status }), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

/**
 * Create a success response for API routes
 */
export function apiSuccess<T>(
  data: T,
  status: number = 200,
  headers?: Record<string, string>
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

/**
 * Add rate limit headers to response
 */
export function addRateLimitHeaders(
  headers: Record<string, string>,
  rateLimit: RateLimitResult
): Record<string, string> {
  return {
    ...headers,
    "X-RateLimit-Limit": rateLimit.limit.toString(),
    "X-RateLimit-Remaining": rateLimit.remaining.toString(),
    "X-RateLimit-Reset": Math.ceil(rateLimit.reset / 1000).toString(),
  };
}

/**
 * Authenticate a v1 REST request and run the handler behind the perimeter.
 * Response contract (wire-compatible with the previous inlined blocks):
 * 401 missing/malformed header or invalid key · 429 rate limited ·
 * 403 insufficient scope · 500 on unexpected failure.
 */
export async function withApiKey(
  request: Request,
  scope: ApiScope,
  handler: (auth: ApiKeyContext) => Promise<Response>
): Promise<Response> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return apiError("Missing or invalid Authorization header", 401);
  }

  const apiKey = authHeader.slice(7);
  if (!apiKey.startsWith("ff_")) {
    return apiError("Invalid API key format", 401);
  }

  const convex = getConvexClient();
  try {
    const validation = await convex.query(
      api.restApiKeys.validateApiKeyPublic,
      { key: apiKey }
    );
    if (!validation.valid) {
      return apiError(validation.error || "Invalid API key", 401);
    }

    const rateLimit = await checkApiRateLimit(apiKey.slice(0, 8));
    if (!rateLimit.success) {
      return apiError("Rate limit exceeded", 429, {
        "Retry-After": Math.ceil(
          (rateLimit.reset - Date.now()) / 1000
        ).toString(),
        ...addRateLimitHeaders({}, rateLimit),
      });
    }

    if (!validation.permissions?.includes(scope)) {
      return apiError(`Insufficient permissions. Required: ${scope}`, 403);
    }

    // Last-used bookkeeping is best-effort
    if (validation.keyId) {
      convex
        .mutation(api.restApiKeys.updateApiKeyLastUsed, {
          keyId: validation.keyId,
        })
        .catch(() => {});
    }

    return await handler({
      teamId: validation.teamId as Id<"teams">,
      permissions: validation.permissions ?? [],
      rateLimit,
    });
  } catch (error) {
    console.error("API error:", error);
    return apiError("Internal server error", 500);
  }
}
