import { createHmac } from "node:crypto";

import { getWorkerConfig } from "@birthub/config";
import { Prisma, prisma, WebhookEndpointStatus } from "@birthub/database";
import { createLogger } from "@birthub/logger";
import { ENGAGEMENT_QUEUE_NAMES } from "@birthub/queue";
import type { Queue } from "bullmq";
import type { Redis } from "ioredis";

import { DynamicRateLimiter } from "../lib/rate-limiter.js";

const logger = createLogger("worker-outbound-webhooks");

function toJsonValue(value: Record<string, unknown>): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

export const outboundWebhookQueueName = ENGAGEMENT_QUEUE_NAMES.outboundWebhook;

export interface OutboundWebhookJobPayload {
  attempt?: number;
  endpointId: string;
  organizationId: string;
  payload: Record<string, unknown>;
  tenantId: string;
  topic: string;
}

function signPayload(secret: string, payload: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

function assertSafeUrl(rawUrl: string): URL {
  const parsed = new URL(rawUrl);
  const normalizedHost = parsed.hostname.toLowerCase();
  const blockedHosts = new Set(["localhost", "0.0.0.0", "127.0.0.1", "::1", "host.docker.internal"]);
  if (blockedHosts.has(normalizedHost) || normalizedHost.endsWith(".internal")) {
    throw new Error("SSRF_GUARD_BLOCKED_HOST");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("SSRF_GUARD_BLOCKED_PROTOCOL");
  }
  return parsed;
}

async function dispatchHttpRequest(input: {
  payload: string;
  signature: string;
  topic: string;
  url: string;
}) {
  const config = getWorkerConfig();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.WEBHOOK_TIMEOUT_MS);

  try {
    const safeUrl = assertSafeUrl(input.url);

    const response = await fetch(safeUrl.toString(), {
      body: input.payload,
      headers: {
        "content-type": "application/json",
        "x-birthhub-signature": input.signature,
        "x-birthhub-topic": input.topic
      },
      method: "POST",
      signal: controller.signal
    });

    const responseBody = await response.text();
    return {
      ok: response.ok,
      responseBody,
      statusCode: response.status
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function enqueueWebhookTopicDeliveries(
  queue: Queue<OutboundWebhookJobPayload>,
  input: {
    organizationId: string;
    payload: Record<string, unknown>;
    tenantId: string;
    topic: string;
  }
) {
  const endpoints = await prisma.webhookEndpoint.findMany({
    where: {
      organizationId: input.organizationId,
      status: WebhookEndpointStatus.ACTIVE,
      tenantId: input.tenantId,
      topics: {
        has: input.topic
      }
    }
  });

  await Promise.all(
    endpoints.map((endpoint) =>
      queue.add(input.topic, {
        attempt: 1,
        endpointId: endpoint.id,
        organizationId: input.organizationId,
        payload: input.payload,
        tenantId: input.tenantId,
        topic: input.topic
      })
    )
  );
}

export async function processOutboundWebhookJob(
  payload: OutboundWebhookJobPayload,
  dependencies?: { redis?: Redis }
) {
  const endpoint = await prisma.webhookEndpoint.findFirst({
    where: {
      id: payload.endpointId,
      tenantId: payload.tenantId
    }
  });

  if (!endpoint || endpoint.status === WebhookEndpointStatus.DISABLED) {
    return {
      skipped: true
    };
  }

  if (!endpoint.topics.includes(payload.topic)) {
    return {
      skipped: true
    };
  }

  const serializedPayload = JSON.stringify(payload.payload);
  const signature = signPayload(endpoint.secret, serializedPayload);
  const delivery = await prisma.webhookDelivery.create({
    data: {
      attempt: payload.attempt ?? 1,
      endpointId: endpoint.id,
      organizationId: payload.organizationId,
      payload: toJsonValue(payload.payload),
      signature,
      tenantId: payload.tenantId,
      topic: payload.topic
    }
  });

  try {
    if (dependencies?.redis) {
      const limiter = new DynamicRateLimiter(dependencies.redis);
      const host = new URL(endpoint.url).host;
      await limiter.consume(`webhook:${payload.tenantId}:${host}`, 10, 1);
    }

    const result = await dispatchHttpRequest({
      payload: serializedPayload,
      signature,
      topic: payload.topic,
      url: endpoint.url
    });

    await prisma.webhookDelivery.updateMany({
      data: {
        deliveredAt: new Date(),
        responseBody: result.responseBody,
        statusCode: result.statusCode,
        success: result.ok
      },
      where: {
        id: delivery.id,
        tenantId: payload.tenantId
      }
    });

    if (!result.ok) {
      const consecutiveFailures = endpoint.consecutiveFailures + 1;
      await prisma.webhookEndpoint.updateMany({
        data: {
          consecutiveFailures,
          lastFailureAt: new Date(),
          status:
            consecutiveFailures >= 10
              ? WebhookEndpointStatus.DISABLED
              : WebhookEndpointStatus.ACTIVE
        },
        where: {
          id: endpoint.id,
          tenantId: payload.tenantId
        }
      });

      throw new Error(`Webhook delivery failed with status ${result.statusCode}`);
    }

    await prisma.webhookEndpoint.updateMany({
      data: {
        consecutiveFailures: 0,
        lastDeliveredAt: new Date()
      },
      where: {
        id: endpoint.id,
        tenantId: payload.tenantId
      }
    });

    return {
      deliveryId: delivery.id,
      skipped: false,
      statusCode: result.statusCode
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown webhook delivery error";

    await prisma.webhookDelivery.updateMany({
      data: {
        errorMessage: message
      },
      where: {
        id: delivery.id,
        tenantId: payload.tenantId
      }
    });

    if (!(error instanceof Error && error.message.includes("status"))) {
      const consecutiveFailures = endpoint.consecutiveFailures + 1;
      await prisma.webhookEndpoint.updateMany({
        data: {
          consecutiveFailures,
          lastFailureAt: new Date(),
          status:
            consecutiveFailures >= 10
              ? WebhookEndpointStatus.DISABLED
              : WebhookEndpointStatus.ACTIVE
        },
        where: {
          id: endpoint.id,
          tenantId: payload.tenantId
        }
      });
    }

    logger.error(
      {
        endpointId: endpoint.id,
        error,
        tenantId: payload.tenantId,
        topic: payload.topic
      },
      "Outbound webhook delivery failed"
    );

    throw error;
  }
}
