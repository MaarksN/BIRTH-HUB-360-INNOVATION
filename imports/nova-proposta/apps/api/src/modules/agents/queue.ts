import type { ApiConfig } from "@birthub/config";
import {
  QueueBackpressureError,
  TenantQueueRateLimitError,
  getAgentQueueName,
  queueClient
} from "@birthub/queue";

export type AgentExecutionJob = {
  agentId: string;
  catalogAgentId?: string | null;
  executionId: string;
  input: Record<string, unknown>;
  organizationId?: string | null;
  tenantId: string;
  userId?: string | null;
};

const queueName = getAgentQueueName("normal");

export { QueueBackpressureError, TenantQueueRateLimitError };

export async function getInstalledAgentQueueStats(config: ApiConfig): Promise<{
  active: number;
  completed: number;
  delayed: number;
  failed: number;
  pending: number;
  prioritized: number;
  queueName: string;
  waiting: number;
}> {
  return queueClient.getQueueStats(queueName, { redisUrl: config.REDIS_URL });
}

export async function enqueueInstalledAgentExecution(
  config: ApiConfig,
  payload: AgentExecutionJob
): Promise<{
  jobId: string;
  pendingJobs: number;
}> {
  const stats = await getInstalledAgentQueueStats(config);

  if (stats.pending >= config.QUEUE_BACKPRESSURE_THRESHOLD) {
    throw new QueueBackpressureError(stats.pending, config.QUEUE_BACKPRESSURE_THRESHOLD);
  }

  const result = await queueClient.enqueue({
    backpressureThreshold: config.QUEUE_BACKPRESSURE_THRESHOLD,
    data: payload,
    jobName: "agent-execution",
    options: {
      jobId: `${payload.tenantId}:${payload.executionId}`,
      priority: 5
    },
    queue: queueName,
    redisUrl: config.REDIS_URL,
    tenantId: payload.tenantId,
    tenantRateLimit: {
      keyPrefix: "tenant-agent-queue-rate",
      max: config.TENANT_QUEUE_RATE_LIMIT_MAX,
      windowSeconds: config.TENANT_QUEUE_RATE_LIMIT_WINDOW_SECONDS
    }
  });

  return {
    jobId: result.jobId,
    pendingJobs: result.pendingJobs
  };
}

