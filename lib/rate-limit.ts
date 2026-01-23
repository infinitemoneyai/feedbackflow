/**
 * Production-grade rate limiting using Upstash Redis
 * Supports distributed deployments and serverless environments
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Initialize Redis client
// Falls back to in-memory if credentials are not set (for development)
let redis: Redis | null = null;

try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
} catch (error) {
  console.warn("Failed to initialize Redis for rate limiting:", error);
}

// Widget submission rate limit: 10 requests per minute per IP
export const widgetRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "1 m"),
      analytics: true,
      prefix: "ratelimit:widget",
    })
  : null;

// REST API rate limit: 100 requests per minute per API key
export const apiRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, "1 m"),
      analytics: true,
      prefix: "ratelimit:api",
    })
  : null;

// Submitter portal rate limit: 20 requests per minute per token
export const submitterRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, "1 m"),
      analytics: true,
      prefix: "ratelimit:submitter",
    })
  : null;

// Auth endpoints rate limit: 5 requests per minute per IP
export const authRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "1 m"),
      analytics: true,
      prefix: "ratelimit:auth",
    })
  : null;

// Widget daily limit: 100 submissions per day per widget
export const widgetDailyLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, "1 d"),
      analytics: true,
      prefix: "ratelimit:widget:daily",
    })
  : null;

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Check IP-based rate limit (for widget submissions)
 * Falls back to in-memory rate limiting if Redis is not configured
 */
export async function checkIpRateLimit(ip: string): Promise<RateLimitResult> {
  if (widgetRateLimit) {
    try {
      const result = await widgetRateLimit.limit(ip);
      return {
        success: result.success,
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset,
      };
    } catch (error) {
      console.error("Rate limit check failed:", error);
      // Fall through to in-memory fallback
    }
  }

  // Fallback to in-memory rate limiting (development only)
  return inMemoryIpRateLimit(ip);
}

/**
 * Check widget daily rate limit
 */
export async function checkWidgetDailyRateLimit(
  widgetKey: string
): Promise<RateLimitResult> {
  if (widgetDailyLimit) {
    try {
      const result = await widgetDailyLimit.limit(widgetKey);
      return {
        success: result.success,
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset,
      };
    } catch (error) {
      console.error("Widget daily rate limit check failed:", error);
      // Fall through to in-memory fallback
    }
  }

  // Fallback to in-memory rate limiting (development only)
  return inMemoryWidgetDailyLimit(widgetKey);
}

/**
 * Check API rate limit (for REST API)
 */
export async function checkApiRateLimit(apiKey: string): Promise<RateLimitResult> {
  if (apiRateLimit) {
    try {
      const result = await apiRateLimit.limit(apiKey);
      return {
        success: result.success,
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset,
      };
    } catch (error) {
      console.error("API rate limit check failed:", error);
      return { success: true, limit: 100, remaining: 100, reset: Date.now() + 60000 };
    }
  }

  // No fallback for API - if Redis is not configured, allow requests
  return { success: true, limit: 100, remaining: 100, reset: Date.now() + 60000 };
}

/**
 * Get client IP from request headers
 */
export function getClientIp(request: Request): string {
  // Check various headers that might contain the real IP
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  // Fallback to a default (in development, this will be common)
  return "127.0.0.1";
}

// ============================================================================
// IN-MEMORY FALLBACK (Development Only)
// ============================================================================

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitStore {
  [key: string]: RateLimitEntry;
}

const ipStore: RateLimitStore = {};
const widgetDailyStore: RateLimitStore = {};

// Clean up expired entries periodically
const CLEANUP_INTERVAL_MS = 60 * 1000; // 1 minute
let lastCleanup = Date.now();

function cleanup(store: RateLimitStore): void {
  const now = Date.now();
  for (const key in store) {
    if (store[key].resetAt < now) {
      delete store[key];
    }
  }
}

function maybeCleanup(): void {
  const now = Date.now();
  if (now - lastCleanup > CLEANUP_INTERVAL_MS) {
    cleanup(ipStore);
    cleanup(widgetDailyStore);
    lastCleanup = now;
  }
}

function inMemoryIpRateLimit(ip: string): RateLimitResult {
  maybeCleanup();

  const key = `ip:${ip}`;
  const limit = 10;
  const windowMs = 60 * 1000; // 1 minute
  const now = Date.now();

  const entry = ipStore[key];

  if (!entry || entry.resetAt < now) {
    // New window
    ipStore[key] = {
      count: 1,
      resetAt: now + windowMs,
    };
    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset: ipStore[key].resetAt,
    };
  }

  if (entry.count >= limit) {
    return {
      success: false,
      limit,
      remaining: 0,
      reset: entry.resetAt,
    };
  }

  entry.count++;
  return {
    success: true,
    limit,
    remaining: limit - entry.count,
    reset: entry.resetAt,
  };
}

function inMemoryWidgetDailyLimit(widgetKey: string): RateLimitResult {
  maybeCleanup();

  const key = `widget:${widgetKey}`;
  const limit = 100;
  const now = Date.now();

  // Calculate end of day
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);
  const reset = endOfDay.getTime();

  const entry = widgetDailyStore[key];

  if (!entry || entry.resetAt < now) {
    // New day or first check
    widgetDailyStore[key] = {
      count: 1,
      resetAt: reset,
    };
    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset,
    };
  }

  if (entry.count >= limit) {
    return {
      success: false,
      limit,
      remaining: 0,
      reset: entry.resetAt,
    };
  }

  entry.count++;
  return {
    success: true,
    limit,
    remaining: limit - entry.count,
    reset: entry.resetAt,
  };
}

// Log warning if Redis is not configured
if (!redis && process.env.NODE_ENV === "production") {
  console.warn(
    "⚠️  WARNING: Upstash Redis is not configured. Using in-memory rate limiting.\n" +
    "   This will not work correctly in production with multiple server instances.\n" +
    "   Please set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN environment variables.\n" +
    "   See UPSTASH_SETUP.md for instructions."
  );
}
