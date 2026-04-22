import type { QueueConfig } from "@birthub/queue";

type RetryableQueueConfigInput = {
  attempts: number;
  backoffDelay: number;
  concurrency?: number;
  dlqName?: string;
  name: string;
  priority?: number;
  removeOnCompleteCount: number;
  removeOnFailCount: number;
};

export function buildRetryableQueueConfig(input: RetryableQueueConfigInput): QueueConfig {
  return {
    attempts: input.attempts,
    backoff: {
      delay: input.backoffDelay,
      type: "exponential"
    },
    ...(input.concurrency !== undefined ? { concurrency: input.concurrency } : {}),
    ...(input.dlqName ? { dlqName: input.dlqName } : {}),
    name: input.name,
    ...(input.priority !== undefined ? { priority: input.priority } : {}),
    removeOnComplete: {
      count: input.removeOnCompleteCount
    },
    removeOnFail: {
      count: input.removeOnFailCount
    }
  };
}

