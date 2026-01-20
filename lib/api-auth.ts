import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

// Initialize Convex client for API routes
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export interface ApiAuthResult {
  valid: boolean;
  teamId?: Id<"teams">;
  permissions?: string[];
  error?: string;
}

/**
 * Validate a Bearer token from the Authorization header
 */
export async function validateBearerToken(
  request: Request
): Promise<ApiAuthResult> {
  const authHeader = request.headers.get("Authorization");

  if (!authHeader) {
    return { valid: false, error: "Missing Authorization header" };
  }

  if (!authHeader.startsWith("Bearer ")) {
    return { valid: false, error: "Invalid Authorization header format" };
  }

  const token = authHeader.slice(7); // Remove "Bearer " prefix

  if (!token || !token.startsWith("ff_")) {
    return { valid: false, error: "Invalid API key format" };
  }

  try {
    // Use internal query to validate the key
    // Note: We need to use a workaround since internalQuery can't be called directly from API routes
    // In production, you'd use a Convex action or HTTP endpoint for this
    const result = await convex.query(api.restApiKeys.validateApiKeyPublic, {
      key: token,
    });

    if (!result.valid) {
      return { valid: false, error: result.error };
    }

    return {
      valid: true,
      teamId: result.teamId,
      permissions: result.permissions,
    };
  } catch (error) {
    console.error("API key validation error:", error);
    return { valid: false, error: "Failed to validate API key" };
  }
}

/**
 * Check if the API key has the required permission
 */
export function hasPermission(
  permissions: string[] | undefined,
  required: string
): boolean {
  if (!permissions) return false;
  return permissions.includes(required);
}

/**
 * Create an error response for API routes
 */
export function apiError(
  message: string,
  status: number = 400,
  headers?: Record<string, string>
): Response {
  const baseHeaders = {
    "Content-Type": "application/json",
    ...headers,
  };

  return new Response(
    JSON.stringify({
      error: message,
      status,
    }),
    {
      status,
      headers: baseHeaders,
    }
  );
}

/**
 * Create a success response for API routes
 */
export function apiSuccess<T>(
  data: T,
  status: number = 200,
  headers?: Record<string, string>
): Response {
  const baseHeaders = {
    "Content-Type": "application/json",
    ...headers,
  };

  return new Response(JSON.stringify(data), {
    status,
    headers: baseHeaders,
  });
}

/**
 * Rate limit store for API endpoints
 */
interface ApiRateLimitEntry {
  count: number;
  resetAt: number;
}

const apiRateLimitStore: Record<string, ApiRateLimitEntry> = {};

/**
 * Check and increment API rate limit
 * 100 requests per minute per API key
 */
export function checkApiRateLimit(keyPrefix: string): {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
} {
  const key = `api:${keyPrefix}`;
  const limit = 100;
  const windowMs = 60 * 1000; // 1 minute
  const now = Date.now();

  const entry = apiRateLimitStore[key];

  if (!entry || entry.resetAt < now) {
    // New window
    apiRateLimitStore[key] = {
      count: 1,
      resetAt: now + windowMs,
    };
    return {
      success: true,
      limit,
      remaining: limit - 1,
      resetAt: apiRateLimitStore[key].resetAt,
    };
  }

  if (entry.count >= limit) {
    return {
      success: false,
      limit,
      remaining: 0,
      resetAt: entry.resetAt,
    };
  }

  entry.count++;
  return {
    success: true,
    limit,
    remaining: limit - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Add rate limit headers to response
 */
export function addRateLimitHeaders(
  headers: Record<string, string>,
  rateLimit: { limit: number; remaining: number; resetAt: number }
): Record<string, string> {
  return {
    ...headers,
    "X-RateLimit-Limit": rateLimit.limit.toString(),
    "X-RateLimit-Remaining": rateLimit.remaining.toString(),
    "X-RateLimit-Reset": Math.ceil(rateLimit.resetAt / 1000).toString(),
  };
}
