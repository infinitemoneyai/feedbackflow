import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/widget/v1.js — versioned alias for the widget bundle.
 * The bundle is generated into public/ at build time and served statically;
 * redirecting keeps this route working without reading the filesystem at
 * runtime (serverless functions don't bundle public/ assets).
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  return NextResponse.redirect(new URL("/widget.js", request.nextUrl.origin), {
    status: 307,
    headers: {
      "Cache-Control": "public, max-age=300",
    },
  });
}
