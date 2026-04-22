import { QueueName } from "@birthub/shared-types";

import { QUEUE_CONFIG } from "./definitions.js";
import { QueueRuntime } from "./runtime.js";
import type { JobsOptions } from "bullmq";

export {
  AGENT_QUEUE_NAMES,
  DEFAULT_REMOVE_ON_COMPLETE,
  DEFAULT_REMOVE_ON_FAIL,
  ENGAGEMENT_QUEUE_NAMES,
  getAgentQueueName,
  QUEUE_CONFIG,
  SYSTEM_QUEUE_NAMES,
  WORKFLOW_QUEUE_NAMES
} from "./definitions.js";
export { QueueDlqClient } from "./dlq.js";
export {
  QueueBackpressureError,
  QueueClient,
  QueueRuntime,
  TenantQueueRateLimitError,
  queueClient
} from "./runtime.js";
export { QueueIdempotencyStore } from "./idempotency.js";
export {
  buildDlqPayload,
  createRuntimeWorkerProcessor,
  extractJobContext,
  forwardToDlq,
  isFinalAttempt,
  mergeQueueJobOptions,
  registerRuntimeWorker,
  resolveConfiguredAttempts,
  toSerializedJobOptions
} from "./worker.js";
export * from "./workers/index.js";
export * from "./job-context.js";
export * from "./types.js";

export const QUEUES = {
  BANK_RECONCILIATION: QueueName.BANK_RECONCILIATION,
  BOARD_REPORT: QueueName.BOARD_REPORT,
  CHURN_RISK_HIGH: QueueName.CHURN_RISK_HIGH,
  COMMISSION_CALC: QueueName.COMMISSION_CALC,
  CONTRACT_ANALYSIS: QueueName.CONTRACT_ANALYSIS,
  CONTRACT_DEADLINES: QueueName.CONTRACT_DEADLINES,
  DEAL_CLOSED_WON: QueueName.DEAL_CLOSED_WON,
  DOMAIN_WARMUP: QueueName.DOMAIN_WARMUP,
  EMAIL_CADENCE_SEND: QueueName.EMAIL_CADENCE_SEND,
  HEALTH_ALERT: QueueName.HEALTH_ALERT,
  HEALTH_SCORE_UPDATE: QueueName.HEALTH_SCORE_UPDATE,
  INVOICE_GENERATE: QueueName.INVOICE_GENERATE,
  LEAD_ENRICHMENT: QueueName.LEAD_ENRICHMENT,
  NPS_ANALYSIS: QueueName.NPS_ANALYSIS
} as const;

let defaultRuntime: QueueRuntime | null = null;

export class QueueManager extends QueueRuntime {
  async addJob(
    queueName: QueueName | string,
    jobName: string,
    data: unknown,
    options?: JobsOptions
  ) {
    return this.enqueue({
      data,
      jobName,
      ...(options ? { options } : {}),
      queue: String(queueName)
    });
  }

  async scheduleRecurringJobs(): Promise<void> {
    const recurringQueues = Object.entries(QUEUE_CONFIG).filter(([, config]) => Boolean(config.cron));

    await Promise.all(
      recurringQueues.map(([queueName, config]) =>
        this.upsertRepeatableJob({
          data: { queue: queueName, scheduled: true },
          jobId: `${queueName.toLowerCase()}-cron`,
          jobName: `${queueName.toLowerCase()}-scheduled`,
          queue: queueName,
          repeat: {
            pattern: config.cron!
          }
        })
      )
    );
  }
}

function getDefaultRuntime(): QueueRuntime {
  if (!defaultRuntime) {
    defaultRuntime = new QueueRuntime();
  }

  return defaultRuntime;
}

export function scopedQueueName(baseQueue: QueueName | string, tenantId?: string, plan?: string): string {
  if (!tenantId) {
    return String(baseQueue);
  }

  const tenantSafe = String(tenantId).replace(/[^a-zA-Z0-9_-]/g, "-");
  const planSafe = plan ? String(plan).replace(/[^a-zA-Z0-9_-]/g, "-") : "default";
  return `${baseQueue}__tenant_${tenantSafe}__plan_${planSafe}`;
}

export const createQueue = <DataType = unknown, ResultType = unknown>(
  config: string | import("./types.js").QueueConfig
) => getDefaultRuntime().createQueue<DataType, ResultType>(config);

export const createWorker = <DataType = unknown, ResultType = unknown>(
  config: string | import("./types.js").QueueConfig,
  processor: import("./types.js").QueueProcessor<DataType, ResultType>
) => getDefaultRuntime().createWorker<DataType, ResultType>(config, processor);

export const createQueueEvents = (
  config: string | import("./types.js").QueueConfig
) => getDefaultRuntime().createQueueEvents(config);

export const closeRedis = async (): Promise<void> => {
  if (!defaultRuntime) {
    return;
  }

  await defaultRuntime.close();
  defaultRuntime = null;
};
