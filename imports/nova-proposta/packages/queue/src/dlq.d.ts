import type { Job } from "bullmq";
import type { QueueRuntime } from "./runtime.js";
import type { DlqJobPayload, QueueConfig } from "./types.js";
export declare class QueueDlqClient {
    private readonly runtime;
    constructor(runtime: QueueRuntime);
    getMetrics(config: QueueConfig | string): Promise<{
        active: number;
        delayed: number;
        failed: number;
        pending: number;
        queueName: string;
        waiting: number;
    }>;
    listFailedJobs<DataType = unknown>(config: QueueConfig | string, start?: number, end?: number): Promise<Array<Job<DlqJobPayload<DataType>, void, string>>>;
    retryJob<DataType = unknown>(config: QueueConfig | string, dlqJobId: string): Promise<{
        jobId: string;
        queue: string;
    }>;
}
