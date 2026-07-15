import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { checkIpRateLimit, getClientIp } from "@/lib/rate-limit";

// Lazy initialize Convex client
function getConvexClient() {
  return new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL || "");
}

// CORS headers for all responses
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function jsonResponse(
  data: unknown,
  status: number,
  additionalHeaders: Record<string, string> = {}
): NextResponse {
  return NextResponse.json(data, {
    status,
    headers: {
      ...corsHeaders,
      ...additionalHeaders,
    },
  });
}

/**
 * GET /api/widget/config?key=<widgetKey>
 * Serves Widget Config to installed widgets (ADR-0001: the widget fetches
 * its config at load; the dashboard is the source of truth).
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const clientIp = getClientIp(request);
    const ipRateLimit = await checkIpRateLimit(clientIp);
    if (!ipRateLimit.success) {
      return jsonResponse(
        {
          error: "Rate limit exceeded",
          message: "Too many requests. Please try again later.",
          retryAfter: Math.ceil((ipRateLimit.reset - Date.now()) / 1000),
        },
        429,
        {
          "X-RateLimit-Limit": ipRateLimit.limit.toString(),
          "X-RateLimit-Remaining": ipRateLimit.remaining.toString(),
        }
      );
    }

    const widgetKey = request.nextUrl.searchParams.get("key");
    if (!widgetKey) {
      return jsonResponse({ error: "Missing widget key" }, 400);
    }

    const convex = getConvexClient();
    const config = await convex.query(api.widgetConfig.getWidgetConfigByKey, {
      widgetKey,
    });

    if (!config) {
      return jsonResponse({ error: "Widget not found" }, 404);
    }

    return jsonResponse({ config }, 200, {
      // Installed widgets fetch once per page load (session-cached after);
      // let CDNs absorb repeats without delaying config changes for long.
      "Cache-Control": "public, max-age=60",
    });
  } catch (error) {
    console.error("Widget config fetch failed:", error);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
}

/**
 * OPTIONS /api/widget/config — CORS preflight
 */
export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}
