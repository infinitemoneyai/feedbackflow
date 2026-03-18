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

    // Rewrite relative URLs to absolute for resources (src, action)
    const baseUrl = new URL(targetUrl);
    let rewrittenBody = body
      .replace(/(src|action)="\/(?!\/)/g, `$1="${baseUrl.origin}/`)
      .replace(/(src|action)='\/(?!\/)/g, `$1='${baseUrl.origin}/`);

    // Inject <base> tag so relative URLs resolve against the target origin
    // (handles dynamic content, CSS imports, etc.)
    const baseTag = `<base href="${baseUrl.origin}/">`;
    if (rewrittenBody.includes("<head>")) {
      rewrittenBody = rewrittenBody.replace("<head>", `<head>${baseTag}`);
    } else if (rewrittenBody.includes("<html")) {
      rewrittenBody = rewrittenBody.replace(
        /(<html[^>]*>)/i,
        `$1<head>${baseTag}</head>`
      );
    }

    // Inject script to intercept link clicks and notify the parent frame
    const navScript = `<script data-feedbackflow-proxy>
(function(){
  document.addEventListener('click', function(e) {
    var link = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!link) return;
    var href = link.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
    if (link.getAttribute('target') === '_blank') return;
    var url;
    try { url = new URL(href, document.baseURI).href; } catch(err) { return; }
    if (url.startsWith('http://') || url.startsWith('https://')) {
      e.preventDefault();
      e.stopPropagation();
      window.parent.postMessage({ type: 'feedbackflow-navigate', url: url }, '*');
    }
  }, true);
})();
</script>`;

    if (rewrittenBody.includes("</body>")) {
      rewrittenBody = rewrittenBody.replace("</body>", `${navScript}</body>`);
    } else {
      rewrittenBody += navScript;
    }

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
