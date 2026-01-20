/**
 * Simple in-memory rate limiter
 * For production, consider using @upstash/ratelimit with Redis
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitStore {
  [key: string]: RateLimitEntry;
}

// In-memory stores (cleared on server restart)
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

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

/**
 * Check and increment IP-based rate limit
 * 10 requests per minute per IP
 */
export function checkIpRateLimit(ip: string): RateLimitResult {
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
      resetAt: ipStore[key].resetAt,
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
 * Check widget daily rate limit
 * 100 submissions per day per widget
 * This is supplementary to the database check
 */
export function checkWidgetDailyLimit(
  widgetKey: string,
  currentDbCount: number
): RateLimitResult {
  maybeCleanup();

  const key = `widget:${widgetKey}`;
  const limit = 100;
  const now = Date.now();

  // Calculate end of day
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);
  const resetAt = endOfDay.getTime();

  const entry = widgetDailyStore[key];

  // If we have a database count, use the max of in-memory and db
  const dbCount = currentDbCount;

  if (!entry || entry.resetAt < now) {
    // New day or first check
    widgetDailyStore[key] = {
      count: dbCount + 1,
      resetAt,
    };
    const remaining = limit - widgetDailyStore[key].count;
    return {
      success: remaining >= 0,
      limit,
      remaining: Math.max(0, remaining),
      resetAt,
    };
  }

  // Use max of in-memory and db count for accuracy
  const currentCount = Math.max(entry.count, dbCount);

  if (currentCount >= limit) {
    return {
      success: false,
      limit,
      remaining: 0,
      resetAt: entry.resetAt,
    };
  }

  entry.count = currentCount + 1;
  return {
    success: true,
    limit,
    remaining: limit - entry.count,
    resetAt: entry.resetAt,
  };
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
