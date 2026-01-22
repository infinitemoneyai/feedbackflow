import { v } from "convex/values";
import { action, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * Generate HMAC-SHA256 signature for webhook payload
 */
async function generateSignature(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(payload)
  );

  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Send a webhook with HMAC signature
 */
export const sendWebhook = internalAction({
  args: {
    webhookId: v.id("webhooks"),
    feedbackId: v.optional(v.id("feedback")),
    event: v.string(),
    payload: v.any(),
    attempt: v.number(),
    logId: v.optional(v.id("webhookLogs")),
  },
  handler: async (ctx, args) => {
    const webhook: any = await ctx.runQuery(internal.webhooks.getWebhookById, {
      webhookId: args.webhookId,
    });

    if (!webhook || !webhook.isActive) {
      return { success: false, error: "Webhook not found or inactive" };
    }

    // Create log entry if not retrying
    let logId = args.logId;
    if (!logId) {
      logId = await ctx.runMutation(internal.webhooks.createWebhookLog, {
        webhookId: args.webhookId,
        feedbackId: args.feedbackId,
        event: args.event,
        payload: args.payload,
        attempt: args.attempt,
        status: "pending",
      });
    }

    const timestamp = Date.now();
    const payloadString = JSON.stringify({
      event: args.event,
      timestamp,
      data: args.payload,
    });

    // Generate HMAC signature
    const signature = await generateSignature(payloadString, webhook.secret);

    try {
      const response: any = await fetch(webhook.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-FeedbackFlow-Signature": `sha256=${signature}`,
          "X-FeedbackFlow-Event": args.event,
          "X-FeedbackFlow-Timestamp": timestamp.toString(),
          "X-FeedbackFlow-Delivery": logId as string,
        },
        body: payloadString,
      });

      const responseBody = await response.text().catch(() => "");

      if (response.ok) {
        // Success
        await ctx.runMutation(internal.webhooks.updateWebhookLog, {
          logId,
          status: "success",
          responseStatus: response.status,
          responseBody: responseBody.slice(0, 1000), // Limit response body size
        });
        return { success: true, status: response.status };
      } else {
        // Failed - schedule retry if attempts remaining
        if (args.attempt < 3) {
          // Schedule retry with exponential backoff
          const delayMs = Math.pow(2, args.attempt) * 60000; // 1min, 2min, 4min
          await ctx.scheduler.runAfter(delayMs, internal.webhookActions.sendWebhook, {
            webhookId: args.webhookId,
            feedbackId: args.feedbackId,
            event: args.event,
            payload: args.payload,
            attempt: args.attempt + 1,
            logId,
          });

          await ctx.runMutation(internal.webhooks.updateWebhookLog, {
            logId,
            status: "pending",
            responseStatus: response.status,
            responseBody: responseBody.slice(0, 1000),
            error: `HTTP ${response.status}: Retry scheduled (attempt ${args.attempt + 1}/3)`,
          });
        } else {
          // All retries exhausted
          await ctx.runMutation(internal.webhooks.updateWebhookLog, {
            logId,
            status: "failed",
            responseStatus: response.status,
            responseBody: responseBody.slice(0, 1000),
            error: `HTTP ${response.status}: All retry attempts exhausted`,
          });
        }
        return { success: false, status: response.status };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      if (args.attempt < 3) {
        // Schedule retry with exponential backoff
        const delayMs = Math.pow(2, args.attempt) * 60000; // 1min, 2min, 4min
        await ctx.scheduler.runAfter(delayMs, internal.webhookActions.sendWebhook, {
          webhookId: args.webhookId,
          feedbackId: args.feedbackId,
          event: args.event,
          payload: args.payload,
          attempt: args.attempt + 1,
          logId,
        });

        await ctx.runMutation(internal.webhooks.updateWebhookLog, {
          logId,
          status: "pending",
          error: `${errorMessage}: Retry scheduled (attempt ${args.attempt + 1}/3)`,
        });
      } else {
        await ctx.runMutation(internal.webhooks.updateWebhookLog, {
          logId,
          status: "failed",
          error: `${errorMessage}: All retry attempts exhausted`,
        });
      }
      return { success: false, error: errorMessage };
    }
  },
});

/**
 * Trigger webhooks for an event
 */
export const triggerWebhooks = internalAction({
  args: {
    teamId: v.id("teams"),
    event: v.string(),
    feedbackId: v.optional(v.id("feedback")),
    payload: v.any(),
  },
  handler: async (ctx, args): Promise<any> => {
    const webhooks: any = await ctx.runQuery(internal.webhooks.getWebhooksForEvent, {
      teamId: args.teamId,
      event: args.event,
    });

    const results = [];

    for (const webhook of webhooks) {
      // Send each webhook in parallel
      await ctx.scheduler.runAfter(0, internal.webhookActions.sendWebhook, {
        webhookId: webhook._id,
        feedbackId: args.feedbackId,
        event: args.event,
        payload: args.payload,
        attempt: 1,
      });
      results.push({ webhookId: webhook._id, scheduled: true });
    }

    return { triggered: results.length, results };
  },
});

/**
 * Test a webhook by sending a sample payload
 */
export const testWebhook = action({
  args: {
    webhookId: v.id("webhooks"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    const webhook: any = await ctx.runQuery(internal.webhooks.getWebhookById, {
      webhookId: args.webhookId,
    });

    if (!webhook) {
      throw new Error("Webhook not found");
    }

    // Create test payload
    const testPayload = {
      id: "test_" + Date.now(),
      type: "bug",
      title: "Test Feedback",
      description: "This is a test webhook delivery from FeedbackFlow",
      status: "new",
      priority: "medium",
      submitterEmail: "test@example.com",
      metadata: {
        browser: "Chrome 120",
        os: "macOS 14.0",
        url: "https://example.com/test",
        timestamp: Date.now(),
      },
    };

    const timestamp = Date.now();
    const payloadString = JSON.stringify({
      event: "test",
      timestamp,
      data: testPayload,
    });

    // Generate HMAC signature
    const signature = await generateSignature(payloadString, webhook.secret);

    // Create log entry
    const logId: any = await ctx.runMutation(internal.webhooks.createWebhookLog, {
      webhookId: args.webhookId,
      event: "test",
      payload: testPayload,
      attempt: 1,
      status: "pending",
    });

    try {
      const response: any = await fetch(webhook.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-FeedbackFlow-Signature": `sha256=${signature}`,
          "X-FeedbackFlow-Event": "test",
          "X-FeedbackFlow-Timestamp": timestamp.toString(),
          "X-FeedbackFlow-Delivery": logId,
        },
        body: payloadString,
      });

      const responseBody = await response.text().catch(() => "");

      if (response.ok) {
        await ctx.runMutation(internal.webhooks.updateWebhookLog, {
          logId,
          status: "success",
          responseStatus: response.status,
          responseBody: responseBody.slice(0, 1000),
        });
        return {
          success: true,
          status: response.status,
          message: "Test webhook delivered successfully",
        };
      } else {
        await ctx.runMutation(internal.webhooks.updateWebhookLog, {
          logId,
          status: "failed",
          responseStatus: response.status,
          responseBody: responseBody.slice(0, 1000),
          error: `HTTP ${response.status}`,
        });
        return {
          success: false,
          status: response.status,
          error: `HTTP ${response.status}: ${responseBody.slice(0, 200)}`,
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      await ctx.runMutation(internal.webhooks.updateWebhookLog, {
        logId,
        status: "failed",
        error: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  },
});
