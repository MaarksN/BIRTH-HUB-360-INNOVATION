import type {
  Job,
  JobsOptions,
  Processor,
  Queue,
  QueueEvents,
  RepeatOptions,
  Worker
} from "bullmq";

export type QueueRetryBackoff = JobsOptions["backoff"] | number;

export type QueueConfig = {
  attempts?: number;
  backoff?: QueueRetryBackoff;
  concurrency?: number;
  dlqName?: string;
  name: string;
  priority?: number;
  removeOnComplete?: JobsOptions["removeOnComplete"];
  removeOnFail?: JobsOptions["removeOnFail"];
};

export type JobContext = {
  actorId?: string;
  attemptsMade: number;
  jobId: string;
  organizationId?: string;
  queue: string;
  requestId?: string;
  tenantId?: string;
  traceId?: string;
  userId?: string;
};

export type QueueProcessor<DataType = unknown, ResultType = unknown> = (
  data: DataType,
  context: JobContext,
  job: Job<DataType, ResultType, string>
) => Promise<ResultType>;

export type QueueStats = {
  active: number;
  completed: number;
  delayed: number;
  failed: number;
  paused: number;
  pending: number;
  prioritized: number;
  queueName: string;
  waiting: number;
};

export type RuntimeTelemetry = {
  duration: number;
  jobId: string;
  queue: string;
  status: "failed" | "success";
  tenantId?: string;
  traceId?: string;
};

export type EnqueueRequest<DataType = unknown> = {
  backpressureThreshold?: number;
  data: DataType;
  jobName: string;
  options?: JobsOptions;
  queue: QueueConfig | string;
  redisUrl?: string;
  tenantId?: string | null;
  tenantRateLimit?: {
    keyPrefix?: string;
    max: number;
    windowSeconds: number;
  };
};

export type EnqueueResult = {
  jobId: string;
  pendingJobs: number;
  queue: string;
};

export type RepeatableJobRequest<DataType = unknown> = {
  data: DataType;
  jobId?: string;
  jobName: string;
  options?: JobsOptions;
  queue: QueueConfig | string;
  redisUrl?: string;
  repeat: Pick<RepeatOptions, "pattern">;
};

export type SerializedJobOptions = Pick<
  JobsOptions,
  "attempts" | "backoff" | "delay" | "priority" | "removeOnComplete" | "removeOnFail"
>;

export type DlqJobPayload<DataType = unknown> = {
  configuredAttempts: number;
  context: JobContext;
  errorMessage: string;
  failedAt: string;
  originalJobId: string | null;
  originalJobName: string;
  originalOptions: SerializedJobOptions;
  originalQueue: string;
  payload: DataType;
};

export type QueueRuntimeBindings = {
  createQueue: <DataType = unknown, ResultType = unknown>(
    config: QueueConfig | string
  ) => Queue<DataType, ResultType, string>;
  createQueueEvents: (config: QueueConfig | string) => QueueEvents;
  createWorker: <DataType = unknown, ResultType = unknown>(
    config: QueueConfig | string,
    processor: QueueProcessor<DataType, ResultType>
  ) => Worker<DataType, ResultType, string>;
  enqueue: <DataType = unknown>(request: EnqueueRequest<DataType>) => Promise<EnqueueResult>;
  getDlqQueue: <DataType = unknown>(
    config: QueueConfig | string
  ) => Queue<DlqJobPayload<DataType>, void, string>;
  getQueueStats: (config: QueueConfig | string) => Promise<QueueStats>;
  upsertRepeatableJob: <DataType = unknown>(
    request: RepeatableJobRequest<DataType>
  ) => Promise<void>;
};

export type RuntimeWorkerHandler<DataType = unknown, ResultType = unknown> = Processor<
  DataType,
  ResultType,
  string
>;
