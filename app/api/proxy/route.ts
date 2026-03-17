import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export const runtime = "nodejs";

const BLOCKED_PROTOCOLS = ["file:", "ftp:", "data:", "javascript:"];
const MAX_RESPONSE_SIZE = 10 * 1024 * 1024; // 10MB

function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return (
      !BLOCKED_PROTOCOLS.includes(url.protocol) &&
      (url.protocol === "http:" || url.protocol === "https:")
    );
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  // Auth: Clerk session or review session token cookie
  const { userId } = await auth();
  const reviewSession = request.cookies.get("review_session")?.value;

  if (!userId && !reviewSession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const targetUrl = request.nextUrl.searchParams.get("url");
  if (!targetUrl || !isValidUrl(targetUrl)) {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  try {
    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent":
          request.headers.get("user-agent") ?? "FeedbackFlow-Proxy/1.0",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language":
          request.headers.get("accept-language") ?? "en-US,en;q=0.5",
      },
      redirect: "follow",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Target site returned ${response.status}` },
        { status: 502 }
      );
    }

    const contentType = response.headers.get("content-type") ?? "text/html";
    const contentLength = parseInt(
      response.headers.get("content-length") ?? "0",
      10
    );

    if (contentLength > MAX_RESPONSE_SIZE) {
      return NextResponse.json({ error: "Response too large" }, { status: 413 });
    }

    const body = await response.text();

    // Rewrite relative URLs to absolute
    const baseUrl = new URL(targetUrl);
    const rewrittenBody = body
      .replace(/(href|src|action)="\/(?!\/)/g, `$1="${baseUrl.origin}/`)
      .replace(/(href|src|action)='\/(?!\/)/g, `$1='${baseUrl.origin}/`);

    const proxyResponse = new NextResponse(rewrittenBody, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Access-Control-Allow-Origin": "*",
        // Intentionally omit X-Frame-Options and frame-restricting CSP
      },
    });

    return proxyResponse;
  } catch (error) {
    console.error("Proxy error:", error);
    return NextResponse.json(
      { error: "Failed to fetch target site" },
      { status: 502 }
    );
  }
}
