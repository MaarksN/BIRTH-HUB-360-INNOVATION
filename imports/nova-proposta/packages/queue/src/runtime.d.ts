import { Queue, QueueEvents, Worker } from "bullmq";
import { Redis } from "ioredis";
import { QueueDlqClient } from "./dlq.js";
import type { DlqJobPayload, EnqueueRequest, EnqueueResult, QueueConfig, QueueProcessor, QueueStats, RepeatableJobRequest } from "./types.js";
export type QueueRuntimeOptions = {
    redisUrl?: string;
};
export declare class QueueBackpressureError extends Error {
    readonly pendingJobs: number;
    readonly threshold: number;
    constructor(pendingJobs: number, threshold: number);
}
export declare class TenantQueueRateLimitError extends Error {
    readonly tenantId: string;
    readonly threshold: number;
    constructor(tenantId: string, threshold: number);
}
export declare class QueueRuntime {
    private readonly connection;
    private readonly dlqClient;
    private readonly queueEvents;
    private readonly queues;
    private readonly workers;
    constructor(options?: QueueRuntimeOptions | string);
    get redis(): Redis;
    get dlq(): QueueDlqClient;
    createQueue<DataType = unknown, ResultType = unknown>(config: QueueConfig | string): Queue<DataType, ResultType, string>;
    createQueueEvents(config: QueueConfig | string): QueueEvents;
    getDlqQueue<DataType = unknown>(config: QueueConfig | string): Queue<DlqJobPayload<DataType>, void, string>;
    createWorker<DataType = unknown, ResultType = unknown>(config: QueueConfig | string, processor: QueueProcessor<DataType, ResultType>): Worker<DataType, ResultType, string>;
    getQueueStats(config: QueueConfig | string): Promise<QueueStats>;
    enqueue<DataType = unknown>(request: EnqueueRequest<DataType>): Promise<EnqueueResult>;
    upsertRepeatableJob<DataType = unknown>(request: RepeatableJobRequest<DataType>): Promise<void>;
    ping(): Promise<string>;
    claimDeduplicationKey(key: string, ttlSeconds: number): Promise<boolean>;
    listQueues(): Array<Queue<unknown, unknown, string>>;
    listDlqQueues(): Array<Queue<unknown, unknown, string>>;
    listWorkers(): Array<Worker<unknown, unknown, string>>;
    close(): Promise<void>;
}
export declare class QueueClient {
    private readonly runtimes;
    private getRuntime;
    createQueue<DataType = unknown, ResultType = unknown>(config: QueueConfig | string, options?: {
        redisUrl?: string;
    }): Queue<DataType, ResultType, string>;
    createWorker<DataType = unknown, ResultType = unknown>(config: QueueConfig | string, processor: QueueProcessor<DataType, ResultType>, options?: {
        redisUrl?: string;
    }): Worker<DataType, ResultType, string>;
    createQueueEvents(config: QueueConfig | string, options?: {
        redisUrl?: string;
    }): QueueEvents;
    enqueue<DataType = unknown>(request: EnqueueRequest<DataType>): Promise<EnqueueResult>;
    getQueueStats(config: QueueConfig | string, options?: {
        redisUrl?: string;
    }): Promise<QueueStats>;
    getDlq<DataType = unknown>(config: QueueConfig | string, options?: {
        redisUrl?: string;
    }): Queue<DlqJobPayload<DataType>, void, string, DlqJobPayload<DataType>, void, string>;
    listFailedJobs<DataType = unknown>(config: QueueConfig | string, options?: {
        end?: number;
        redisUrl?: string;
        start?: number;
    }): Promise<import("bullmq").Job<DlqJobPayload<DataType>, void, string>[]>;
    retryDlqJob<DataType = unknown>(config: QueueConfig | string, dlqJobId: string, options?: {
        redisUrl?: string;
    }): Promise<{
        jobId: string;
        queue: string;
    }>;
    getDlqMetrics(config: QueueConfig | string, options?: {
        redisUrl?: string;
    }): Promise<{
        active: number;
        delayed: number;
        failed: number;
        pending: number;
        queueName: string;
        waiting: number;
    }>;
    upsertRepeatableJob<DataType = unknown>(request: RepeatableJobRequest<DataType>): Promise<void>;
    ping(options?: {
        redisUrl?: string;
    }): Promise<string>;
    claimDeduplicationKey(key: string, ttlSeconds: number, options?: {
        redisUrl?: string;
    }): Promise<boolean>;
    close(redisUrl?: string): Promise<void>;
}
export declare const queueClient: QueueClient;
