import type { Job, Queue, Worker } from "bullmq";
import { createLogger } from "@birthub/logger";

export type JobHandler<Data = unknown, Result = unknown> = (
  job: Job<Data>,
  token?: string
) => Promise<Result>;

export interface JobHandlerDefinition<Data = unknown, Result = unknown> {
  name: string;
  queueName: string;
  handler: JobHandler<Data, Result>;
  concurrency?: number;
  timeout?: number;
  retries?: number;
  backoff?: {
    type: "exponential" | "fixed";
    delay: number;
  };
}

/**
 * Registry for managing job handlers and workers
 */
export class JobHandlerRegistry {
  private handlers: Map<string, JobHandlerDefinition> = new Map();
  private workers: Map<string, Worker> = new Map();
  private logger = createLogger("job-handler-registry");

  /**
   * Register a job handler
   */
  register<Data = unknown, Result = unknown>(
    definition: JobHandlerDefinition<Data, Result>
  ): void {
    const handlerId = `${definition.queueName}:${definition.name}`;
    if (this.handlers.has(handlerId)) {
      throw new Error(`Handler already registered: ${handlerId}`);
    }
    this.handlers.set(handlerId, definition);
    this.logger.info({ handlerId }, "Job handler registered");
  }

  /**
   * Register multiple handlers at once
   */
  registerBatch(definitions: JobHandlerDefinition[]): void {
    for (const def of definitions) {
      this.register(def);
    }
  }

  /**
   * Get handler by queue and job name
   */
  getHandler(queueName: string, jobName: string): JobHandlerDefinition | undefined {
    return this.handlers.get(`${queueName}:${jobName}`);
  }

  /**
   * Get all handlers for a queue
   */
  getQueueHandlers(queueName: string): JobHandlerDefinition[] {
    return Array.from(this.handlers.values()).filter((h) => h.queueName === queueName);
  }

  /**
   * Get all registered handlers
   */
  getAllHandlers(): JobHandlerDefinition[] {
    return Array.from(this.handlers.values());
  }

  /**
   * Get active workers
   */
  getWorkers(): Map<string, Worker> {
    return new Map(this.workers);
  }

  /**
   * Register a worker
   */
  registerWorker(queueName: string, worker: Worker): void {
    this.workers.set(queueName, worker);
    this.logger.info({ queue: queueName }, "Worker registered");
  }

  /**
   * Shutdown all workers
   */
  async shutdownAll(): Promise<void> {
    const shutdownPromises = Array.from(this.workers.values()).map((worker) => worker.close());
    await Promise.all(shutdownPromises);
    this.logger.info("All workers shut down");
  }
}

export const jobHandlerRegistry = new JobHandlerRegistry();

/**
 * Helper to create a job handler definition
 */
export function defineJobHandler<Data = unknown, Result = unknown>(
  config: JobHandlerDefinition<Data, Result>
): JobHandlerDefinition<Data, Result> {
  return {
    concurrency: 1,
    timeout: 30000,
    retries: 3,
    ...config
  };
}
