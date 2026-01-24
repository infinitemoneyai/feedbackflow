import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  "/",
  "/pricing(.*)",
  "/docs(.*)",
  "/manifesto(.*)",
  "/status/(.*)",
  "/unsubscribe(.*)",
  "/demo(.*)", // Interactive demo page
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/widget/(.*)",
  "/api/webhooks/(.*)",
  "/api/notifications/(.*)", // Internal notification API
  "/api/v1/(.*)", // REST API uses Bearer token auth, not Clerk
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
