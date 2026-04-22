import type { Job } from "bullmq";

import { createLogger } from "@birthub/logger";

import type { QueueRuntime } from "./runtime.js";
import type { DlqJobPayload, QueueConfig } from "./types.js";

const logger = createLogger("queue-dlq");

function resolveQueueName(config: QueueConfig | string): string {
  return typeof config === "string" ? config : config.name;
}

export class QueueDlqClient {
  constructor(private readonly runtime: QueueRuntime) {}

  async getMetrics(config: QueueConfig | string): Promise<{
    active: number;
    delayed: number;
    failed: number;
    pending: number;
    queueName: string;
    waiting: number;
  }> {
    const queue = this.runtime.getDlqQueue(resolveQueueName(config));
    const counts = await queue.getJobCounts("active", "delayed", "failed", "waiting");

    return {
      active: counts.active ?? 0,
      delayed: counts.delayed ?? 0,
      failed: counts.failed ?? 0,
      pending: (counts.active ?? 0) + (counts.delayed ?? 0) + (counts.waiting ?? 0),
      queueName: queue.name,
      waiting: counts.waiting ?? 0
    };
  }

  async listFailedJobs<DataType = unknown>(
    config: QueueConfig | string,
    start = 0,
    end = 50
  ): Promise<Array<Job<DlqJobPayload<DataType>, void, string>>> {
    const queue = this.runtime.getDlqQueue<DataType>(resolveQueueName(config));
    return queue.getJobs(["waiting", "delayed", "active"], start, end, true);
  }

  async retryJob<DataType = unknown>(
    config: QueueConfig | string,
    dlqJobId: string
  ): Promise<{ jobId: string; queue: string }> {
    const queueName = resolveQueueName(config);
    const dlqQueue = this.runtime.getDlqQueue<DataType>(queueName);
    const dlqJob = await dlqQueue.getJob(dlqJobId);

    if (!dlqJob) {
      throw new Error(`DLQ job ${dlqJobId} was not found for queue ${queueName}.`);
    }

    const payload = dlqJob.data;
    const enqueued = await this.runtime.enqueue({
      data: payload.payload,
      jobName: payload.originalJobName,
      options: payload.originalOptions,
      queue: queueName
    });

    await dlqJob.remove();
    logger.info(
      {
        dlqJobId,
        jobId: enqueued.jobId,
        queue: queueName
      },
      "Replayed DLQ job back into the primary queue"
    );

    return {
      jobId: enqueued.jobId,
      queue: enqueued.queue
    };
  }
}
