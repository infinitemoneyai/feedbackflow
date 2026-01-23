import { PostHog } from "posthog-node";

let posthogClient: PostHog | null = null;

/**
 * Get the PostHog server-side client.
 * For server-side event tracking in API routes and server components.
 *
 * Note: Because server-side functions in Next.js can be short-lived,
 * we set flushAt to 1 and flushInterval to 0 to ensure events are sent immediately.
 */
export function getPostHogClient(): PostHog {
  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

  if (!posthogKey || posthogKey === "disabled") {
    // Return a no-op client if PostHog is not configured
    return {
      capture: () => {},
      identify: () => {},
      shutdown: () => Promise.resolve(),
    } as unknown as PostHog;
  }

  if (!posthogClient) {
    posthogClient = new PostHog(posthogKey, {
      host: posthogHost,
      flushAt: 1,
      flushInterval: 0,
    });
  }

  return posthogClient;
}

/**
 * Shutdown the PostHog client and flush any remaining events.
 * Call this at the end of API routes to ensure events are sent.
 */
export async function shutdownPostHog(): Promise<void> {
  if (posthogClient) {
    await posthogClient.shutdown();
  }
}

/**
 * Capture a server-side event with optional user correlation.
 *
 * @param distinctId - The user's distinct ID (from Clerk userId or anonymous ID)
 * @param event - The event name
 * @param properties - Optional event properties
 */
export function captureServerEvent(
  distinctId: string,
  event: string,
  properties?: Record<string, unknown>
): void {
  const posthog = getPostHogClient();
  posthog.capture({
    distinctId,
    event,
    properties: {
      $lib: "posthog-node",
      ...properties,
    },
  });
}
