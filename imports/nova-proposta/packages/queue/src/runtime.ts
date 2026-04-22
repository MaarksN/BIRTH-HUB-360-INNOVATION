import {
  Queue,
  QueueEvents,
  Worker,
  type QueueEventsOptions,
  type QueueOptions,
  type WorkerOptions
} from "bullmq";
import { Redis } from "ioredis";

import { createLogger } from "@birthub/logger";

import { QueueDlqClient } from "./dlq.js";
import {
  DEFAULT_REMOVE_ON_COMPLETE,
  DEFAULT_REMOVE_ON_FAIL,
  QUEUE_CONFIG
} from "./definitions.js";
import {
  createRuntimeWorkerProcessor,
  mergeQueueJobOptions,
  registerRuntimeWorker
} from "./worker.js";
import type {
  DlqJobPayload,
  EnqueueRequest,
  EnqueueResult,
  QueueConfig,
  QueueProcessor,
  QueueStats,
  RepeatableJobRequest
} from "./types.js";

const logger = createLogger("queue-runtime");
const DEFAULT_REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";

function createRedisConnection(redisUrl: string): Redis {
  const connection = new Redis(redisUrl, {
    enableReadyCheck: true,
    lazyConnect: false,
    maxRetriesPerRequest: null
  });

  connection.on("error", (error: unknown) => {
    logger.error(
      {
        err: error,
        redisUrl
      },
      "Queue runtime Redis connection error"
    );
  });

  return connection;
}

function resolveQueueName(config: QueueConfig | string): string {
  return typeof config === "string" ? config : config.name;
}

function resolveQueueConfig(config: QueueConfig | string): QueueConfig {
  if (typeof config !== "string") {
    const defaults = QUEUE_CONFIG[config.name];
    return {
      ...defaults,
      attempts: defaults?.attempts ?? 1,
      ...(defaults?.backoff ? { backoff: defaults.backoff } : {}),
      ...(defaults?.removeOnComplete ? { removeOnComplete: defaults.removeOnComplete } : {}),
      ...(defaults?.removeOnFail ? { removeOnFail: defaults.removeOnFail } : {}),
      ...config
    };
  }

  const defaults = QUEUE_CONFIG[config];
  return {
    attempts: defaults?.attempts ?? 1,
    ...(defaults?.backoff ? { backoff: defaults.backoff } : {}),
    name: config,
    ...(defaults?.priority !== undefined ? { priority: defaults.priority } : {}),
    ...(defaults?.removeOnComplete ? { removeOnComplete: defaults.removeOnComplete } : {}),
    ...(defaults?.removeOnFail ? { removeOnFail: defaults.removeOnFail } : {})
  };
}

export type QueueRuntimeOptions = {
  redisUrl?: string;
};

export class QueueBackpressureError extends Error {
  readonly pendingJobs: number;
  readonly threshold: number;

  constructor(pendingJobs: number, threshold: number) {
    super(`Queue backlog is ${pendingJobs} jobs (threshold ${threshold}).`);
    this.name = "QueueBackpressureError";
    this.pendingJobs = pendingJobs;
    this.threshold = threshold;
  }
}

export class TenantQueueRateLimitError extends Error {
  readonly tenantId: string;
  readonly threshold: number;

  constructor(tenantId: string, threshold: number) {
    super(`Tenant ${tenantId} exceeded the queue rate limit (${threshold}).`);
    this.name = "TenantQueueRateLimitError";
    this.tenantId = tenantId;
    this.threshold = threshold;
  }
}

export class QueueRuntime {
  private readonly connection: Redis;
  private readonly dlqClient: QueueDlqClient;
  private readonly queueEvents = new Map<string, QueueEvents>();
  private readonly queues = new Map<string, Queue<unknown, unknown, string>>();
  private readonly workers = new Map<string, Worker<unknown, unknown, string>>();

  constructor(options: QueueRuntimeOptions | string = {}) {
    const redisUrl =
      typeof options === "string" ? options : (options.redisUrl ?? DEFAULT_REDIS_URL);

    this.connection = createRedisConnection(redisUrl);
    this.dlqClient = new QueueDlqClient(this);
  }

  get redis(): Redis {
    return this.connection;
  }

  get dlq(): QueueDlqClient {
    return this.dlqClient;
  }

  createQueue<DataType = unknown, ResultType = unknown>(
    config: QueueConfig | string
  ): Queue<DataType, ResultType, string> {
    const resolved = resolveQueueConfig(config);
    const existing = this.queues.get(resolved.name);

    if (existing) {
      return existing as Queue<DataType, ResultType, string>;
    }

    const queue = new Queue<DataType, ResultType, string>(resolved.name, {
      connection: this.connection as unknown as QueueOptions["connection"],
      defaultJobOptions: mergeQueueJobOptions(resolved)
    });
    this.queues.set(resolved.name, queue as Queue<unknown, unknown, string>);
    logger.info({ queue: resolved.name }, "Queue created");
    return queue;
  }

  createQueueEvents(config: QueueConfig | string): QueueEvents {
    const queueName = resolveQueueName(config);
    const existing = this.queueEvents.get(queueName);

    if (existing) {
      return existing;
    }

    const queueEvents = new QueueEvents(queueName, {
      connection: this.connection as unknown as QueueEventsOptions["connection"]
    });
    this.queueEvents.set(queueName, queueEvents);
    return queueEvents;
  }

  getDlqQueue<DataType = unknown>(
    config: QueueConfig | string
  ): Queue<DlqJobPayload<DataType>, void, string> {
    const resolved = resolveQueueConfig(config);
    const dlqName = resolved.dlqName ?? `${resolved.name}.dlq`;
    const existing = this.queues.get(dlqName);

    if (existing) {
      return existing as Queue<DlqJobPayload<DataType>, void, string>;
    }

    const queue = new Queue<DlqJobPayload<DataType>, void, string>(dlqName, {
      connection: this.connection as unknown as QueueOptions["connection"],
      defaultJobOptions: {
        attempts: 1,
        removeOnComplete: DEFAULT_REMOVE_ON_COMPLETE,
        removeOnFail: DEFAULT_REMOVE_ON_FAIL
      }
    });
    this.queues.set(dlqName, queue as Queue<unknown, unknown, string>);
    return queue;
  }

  createWorker<DataType = unknown, ResultType = unknown>(
    config: QueueConfig | string,
    processor: QueueProcessor<DataType, ResultType>
  ): Worker<DataType, ResultType, string> {
    const resolved = resolveQueueConfig(config);
    const existing = this.workers.get(resolved.name);

    if (existing) {
      return existing as Worker<DataType, ResultType, string>;
    }

    void this.createQueue<DataType, ResultType>(resolved);
    const dlqQueue = this.getDlqQueue<DataType>(resolved);
    const worker = new Worker<DataType, ResultType, string>(
      resolved.name,
      createRuntimeWorkerProcessor(resolved.name, processor),
      {
        concurrency: resolved.concurrency ?? 1,
        connection: this.connection as unknown as WorkerOptions["connection"]
      }
    );

    registerRuntimeWorker(worker, resolved, dlqQueue);
    this.workers.set(resolved.name, worker as Worker<unknown, unknown, string>);
    logger.info(
      {
        concurrency: resolved.concurrency ?? 1,
        queue: resolved.name
      },
      "Worker created"
    );
    return worker;
  }

  async getQueueStats(config: QueueConfig | string): Promise<QueueStats> {
    const queueName = resolveQueueName(config);
    const queue = this.createQueue(queueName);
    const counts = await queue.getJobCounts(
      "active",
      "completed",
      "delayed",
      "failed",
      "paused",
      "prioritized",
      "waiting"
    );

    return {
      active: counts.active ?? 0,
      completed: counts.completed ?? 0,
      delayed: counts.delayed ?? 0,
      failed: counts.failed ?? 0,
      paused: counts.paused ?? 0,
      pending:
        (counts.active ?? 0) +
        (counts.delayed ?? 0) +
        (counts.prioritized ?? 0) +
        (counts.waiting ?? 0),
      prioritized: counts.prioritized ?? 0,
      queueName,
      waiting: counts.waiting ?? 0
    };
  }

  async enqueue<DataType = unknown>(request: EnqueueRequest<DataType>): Promise<EnqueueResult> {
    const queueConfig = resolveQueueConfig(request.queue);
    const queue = this.createQueue<DataType>(queueConfig);

    if (request.tenantRateLimit && request.tenantId) {
      const keyPrefix = request.tenantRateLimit.keyPrefix ?? "tenant-queue-rate";
      const key = `${keyPrefix}:${request.tenantId}`;
      const current = await this.connection.incr(key);

      if (current === 1) {
        await this.connection.expire(key, request.tenantRateLimit.windowSeconds);
      }

      if (current > request.tenantRateLimit.max) {
        throw new TenantQueueRateLimitError(request.tenantId, request.tenantRateLimit.max);
      }
    }

    const stats = await this.getQueueStats(queueConfig.name);
    if (
      typeof request.backpressureThreshold === "number" &&
      stats.pending >= request.backpressureThreshold
    ) {
      throw new QueueBackpressureError(stats.pending, request.backpressureThreshold);
    }

    const job = await queue.add(
      request.jobName as never,
      request.data as never,
      mergeQueueJobOptions(queueConfig, request.options)
    );

    logger.info(
      {
        jobId: String(job.id),
        jobName: request.jobName,
        queue: queueConfig.name
      },
      "Queue job enqueued"
    );

    return {
      jobId: String(job.id),
      pendingJobs: stats.pending + 1,
      queue: queueConfig.name
    };
  }

  async upsertRepeatableJob<DataType = unknown>(
    request: RepeatableJobRequest<DataType>
  ): Promise<void> {
    const queueConfig = resolveQueueConfig(request.queue);
    const queue = this.createQueue<DataType>(queueConfig);
    await queue.add(request.jobName as never, request.data as never, {
      ...mergeQueueJobOptions(queueConfig, request.options),
      ...(request.jobId ? { jobId: request.jobId } : {}),
      repeat: request.repeat
    });

    logger.info(
      {
        jobId: request.jobId,
        jobName: request.jobName,
        pattern: request.repeat.pattern,
        queue: queueConfig.name
      },
      "Repeatable queue job upserted"
    );
  }

  async ping(): Promise<string> {
    return this.connection.ping();
  }

  async claimDeduplicationKey(key: string, ttlSeconds: number): Promise<boolean> {
    const result = await this.connection.set(key, "1", "EX", ttlSeconds, "NX");
    return result === "OK";
  }

  listQueues(): Array<Queue<unknown, unknown, string>> {
    return Array.from(this.queues.values()).filter((queue) => !queue.name.endsWith(".dlq"));
  }

  listDlqQueues(): Array<Queue<unknown, unknown, string>> {
    return Array.from(this.queues.values()).filter((queue) => queue.name.endsWith(".dlq"));
  }

  listWorkers(): Array<Worker<unknown, unknown, string>> {
    return Array.from(this.workers.values());
  }

  async close(): Promise<void> {
    await Promise.all(Array.from(this.workers.values()).map((worker) => worker.close()));
    this.workers.clear();
    await Promise.all(Array.from(this.queueEvents.values()).map((queueEvents) => queueEvents.close()));
    this.queueEvents.clear();
    await Promise.all(Array.from(this.queues.values()).map((queue) => queue.close()));
    this.queues.clear();

    if (this.connection.status !== "end") {
      await this.connection.quit();
    }
  }
}

export class QueueClient {
  private readonly runtimes = new Map<string, QueueRuntime>();

  private getRuntime(redisUrl?: string): QueueRuntime {
    const key = redisUrl ?? DEFAULT_REDIS_URL;
    const existing = this.runtimes.get(key);

    if (existing) {
      return existing;
    }

    const runtime = new QueueRuntime({ redisUrl: key });
    this.runtimes.set(key, runtime);
    return runtime;
  }

  createQueue<DataType = unknown, ResultType = unknown>(
    config: QueueConfig | string,
    options?: { redisUrl?: string }
  ): Queue<DataType, ResultType, string> {
    return this.getRuntime(options?.redisUrl).createQueue<DataType, ResultType>(config);
  }

  createWorker<DataType = unknown, ResultType = unknown>(
    config: QueueConfig | string,
    processor: QueueProcessor<DataType, ResultType>,
    options?: { redisUrl?: string }
  ): Worker<DataType, ResultType, string> {
    return this.getRuntime(options?.redisUrl).createWorker(config, processor);
  }

  createQueueEvents(config: QueueConfig | string, options?: { redisUrl?: string }): QueueEvents {
    return this.getRuntime(options?.redisUrl).createQueueEvents(config);
  }

  async enqueue<DataType = unknown>(request: EnqueueRequest<DataType>): Promise<EnqueueResult> {
    return this.getRuntime(request.redisUrl).enqueue(request);
  }

  async getQueueStats(config: QueueConfig | string, options?: { redisUrl?: string }): Promise<QueueStats> {
    return this.getRuntime(options?.redisUrl).getQueueStats(config);
  }

  getDlq<DataType = unknown>(config: QueueConfig | string, options?: { redisUrl?: string }) {
    return this.getRuntime(options?.redisUrl).getDlqQueue<DataType>(config);
  }

  async listFailedJobs<DataType = unknown>(
    config: QueueConfig | string,
    options?: { end?: number; redisUrl?: string; start?: number }
  ) {
    return this.getRuntime(options?.redisUrl).dlq.listFailedJobs<DataType>(
      config,
      options?.start,
      options?.end
    );
  }

  async retryDlqJob<DataType = unknown>(
    config: QueueConfig | string,
    dlqJobId: string,
    options?: { redisUrl?: string }
  ) {
    return this.getRuntime(options?.redisUrl).dlq.retryJob<DataType>(config, dlqJobId);
  }

  async getDlqMetrics(config: QueueConfig | string, options?: { redisUrl?: string }) {
    return this.getRuntime(options?.redisUrl).dlq.getMetrics(config);
  }

  async upsertRepeatableJob<DataType = unknown>(
    request: RepeatableJobRequest<DataType>
  ): Promise<void> {
    return this.getRuntime(request.redisUrl).upsertRepeatableJob(request);
  }

  async ping(options?: { redisUrl?: string }): Promise<string> {
    return this.getRuntime(options?.redisUrl).ping();
  }

  async claimDeduplicationKey(
    key: string,
    ttlSeconds: number,
    options?: { redisUrl?: string }
  ): Promise<boolean> {
    return this.getRuntime(options?.redisUrl).claimDeduplicationKey(key, ttlSeconds);
  }

  async close(redisUrl?: string): Promise<void> {
    if (redisUrl) {
      const runtime = this.runtimes.get(redisUrl);
      if (!runtime) {
        return;
      }

      await runtime.close();
      this.runtimes.delete(redisUrl);
      return;
    }

    await Promise.all(Array.from(this.runtimes.values()).map((runtime) => runtime.close()));
    this.runtimes.clear();
  }
}

export const queueClient = new QueueClient();
