import { z } from "zod";
export declare const workerEnvSchema: z.ZodObject<{
    AGENT_CIRCUIT_BREAKER_COOLDOWN_MS: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    AGENT_CIRCUIT_BREAKER_FAILURES: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    AGENT_DEFAULT_TOOL_COST_BRL: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    AGENT_EXECUTION_TIMEOUT_MS: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    AGENT_MAX_COST_BRL: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    AGENT_MAX_PLAN_STEPS: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    AGENT_TOOL_RETRY_ATTEMPTS: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    BILLING_EXPORT_LOCAL_DIR: z.ZodDefault<z.ZodString>;
    BILLING_EXPORT_S3_BUCKET: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodOptional<z.ZodString>>;
    BILLING_EXPORT_S3_ENDPOINT: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodOptional<z.ZodString>>;
    BILLING_EXPORT_S3_PREFIX: z.ZodDefault<z.ZodString>;
    BILLING_EXPORT_S3_REGION: z.ZodDefault<z.ZodString>;
    BILLING_EXPORT_STORAGE_MODE: z.ZodDefault<z.ZodEnum<{
        local: "local";
        s3: "s3";
    }>>;
    BILLING_GRACE_PERIOD_DAYS: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    BILLING_STATUS_CACHE_TTL_SECONDS: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    DATABASE_URL: z.ZodString;
    EMAIL_FROM_ADDRESS: z.ZodDefault<z.ZodString>;
    HUBSPOT_ACCESS_TOKEN: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodOptional<z.ZodString>>;
    HUBSPOT_BASE_URL: z.ZodDefault<z.ZodString>;
    JOB_HMAC_GLOBAL_SECRET: z.ZodDefault<z.ZodString>;
    LOG_LEVEL: z.ZodDefault<z.ZodEnum<{
        error: "error";
        fatal: "fatal";
        warn: "warn";
        info: "info";
        debug: "debug";
        trace: "trace";
    }>>;
    NODE_ENV: z.ZodDefault<z.ZodEnum<{
        development: "development";
        test: "test";
        production: "production";
    }>>;
    OTEL_EXPORTER_OTLP_ENDPOINT: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodOptional<z.ZodString>>;
    OTEL_SERVICE_NAME: z.ZodDefault<z.ZodString>;
    QUEUE_NAME: z.ZodDefault<z.ZodString>;
    REDIS_URL: z.ZodString;
    SENTRY_DSN: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodOptional<z.ZodString>>;
    SENDGRID_API_KEY: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodOptional<z.ZodString>>;
    TENANT_QUEUE_RATE_LIMIT_MAX: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    TENANT_QUEUE_RATE_LIMIT_WINDOW_SECONDS: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    WEBHOOK_TIMEOUT_MS: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    WEB_BASE_URL: z.ZodDefault<z.ZodString>;
    WORKER_HEALTH_PORT: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    WORKER_CONCURRENCY: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodOptional<z.ZodCoercedNumber<unknown>>>;
}, z.core.$strip>;
export type WorkerConfig = z.infer<typeof workerEnvSchema> & {
    WORKER_CONCURRENCY: number;
};
export declare function getWorkerConfig(env?: NodeJS.ProcessEnv): WorkerConfig;
