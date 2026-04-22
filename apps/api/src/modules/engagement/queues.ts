import type { ApiConfig } from "@birthub/config";
import type { ConnectorEventJobPayload } from "@birthub/connectors-core";
import { ENGAGEMENT_QUEUE_NAMES, queueClient } from "@birthub/queue";

export interface CrmSyncJobPayload {
  kind: "company-upsert" | "health-score-sync";
  organizationId: string;
  tenantId: string;
}

export interface OutboundWebhookJobPayload {
  attempt?: number;
  endpointId: string;
  organizationId: string;
  payload: Record<string, unknown>;
  tenantId: string;
  topic: string;
}

export async function enqueueCrmSync(
  config: ApiConfig,
  payload: CrmSyncJobPayload
): Promise<void> {
  await queueClient.enqueue({
    data: payload,
    jobName: payload.kind,
    options: {
      removeOnComplete: {
        count: 100
      },
      removeOnFail: {
        count: 250
      }
    },
    queue: ENGAGEMENT_QUEUE_NAMES.crmSync,
    redisUrl: config.REDIS_URL,
    tenantId: payload.tenantId
  });
}

export async function enqueueConnectorEvent(
  config: ApiConfig,
  payload: ConnectorEventJobPayload
): Promise<void> {
  await queueClient.enqueue({
    data: payload,
    jobName: `${payload.provider}.${payload.eventType}`,
    options: {
      attempts: 5,
      backoff: {
        delay: 1_500,
        type: "exponential"
      },
      jobId: payload.eventId,
      removeOnComplete: {
        count: 200
      },
      removeOnFail: {
        count: 300
      }
    },
    queue: ENGAGEMENT_QUEUE_NAMES.connectorEvents,
    redisUrl: config.REDIS_URL,
    tenantId: payload.tenantId
  });
}

export async function enqueueOutboundWebhook(
  config: ApiConfig,
  payload: OutboundWebhookJobPayload
): Promise<void> {
  await queueClient.enqueue({
    data: payload,
    jobName: payload.topic,
    options: {
      attempts: 5,
      backoff: {
        delay: 1_500,
        type: "exponential"
      },
      removeOnComplete: {
        count: 200
      },
      removeOnFail: {
        count: 300
      }
    },
    queue: ENGAGEMENT_QUEUE_NAMES.outboundWebhook,
    redisUrl: config.REDIS_URL,
    tenantId: payload.tenantId
  });
}
