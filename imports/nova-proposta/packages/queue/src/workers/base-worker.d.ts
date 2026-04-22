export interface WorkerMetrics {
    success: number;
    failed: number;
}
export interface WorkerResult {
    status: "ok" | "retry" | "dlq";
    attempts: number;
}
export declare abstract class BaseWorker<TPayload> {
    private readonly maxAttempts;
    protected metrics: WorkerMetrics;
    constructor(maxAttempts?: number);
    protected abstract process(payload: TPayload): Promise<void>;
    run(payload: TPayload): Promise<WorkerResult>;
    getMetrics(): {
        success: number;
        failed: number;
    };
}
