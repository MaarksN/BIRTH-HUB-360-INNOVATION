import type { ApiConfig } from "@birthub/config";
import { taskJobSchema } from "@birthub/config";
import {
  QueueBackpressureError,
  TenantQueueRateLimitError,
  queueClient
} from "@birthub/queue";
import { z } from "zod";

type TaskJob = z.infer<typeof taskJobSchema>;

export { QueueBackpressureError, TenantQueueRateLimitError };

export async function enqueueTask(config: ApiConfig, payload: TaskJob): Promise<{ jobId: string }> {
  const validated = taskJobSchema.parse(payload);
  const result = await queueClient.enqueue({
    backpressureThreshold: config.QUEUE_BACKPRESSURE_THRESHOLD,
    data: validated,
    jobName: validated.type,
    options: {
      removeOnComplete: 100,
      removeOnFail: 500
    },
    queue: {
      attempts: 5,
      backoff: 1_000,
      name: config.QUEUE_NAME,
      removeOnComplete: {
        count: 100
      },
      removeOnFail: {
        count: 500
      }
    },
    redisUrl: config.REDIS_URL,
    tenantId: validated.tenantId,
    ...(validated.tenantId
      ? {
          tenantRateLimit: {
            max: config.TENANT_QUEUE_RATE_LIMIT_MAX,
            windowSeconds: config.TENANT_QUEUE_RATE_LIMIT_WINDOW_SECONDS
          }
        }
      : {})
  });

  return {
    jobId: result.jobId
  };
}

export async function pingRedis(config: ApiConfig): Promise<{ status: "up" | "down"; message?: string }> {
  try {
    const pong = await queueClient.ping({ redisUrl: config.REDIS_URL });
    return {
      status: pong === "PONG" ? "up" : "down"
    };
  } catch (error) {
    return {
      message: error instanceof Error ? error.message : "Unknown Redis error",
      status: "down"
    };
  }
}
