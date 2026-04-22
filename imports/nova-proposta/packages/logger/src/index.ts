import { AsyncLocalStorage } from "node:async_hooks";

import {
  getEnvironmentSource,
  getLoggerConfig,
  type LoggerConfig
} from "@birthub/config";
import pino, { transport, type DestinationStream, type Logger, type LoggerOptions } from "pino";

import { getActiveTraceContext } from "./otel.js";

export interface LogContext {
  jobId?: string | null;
  operation?: string | null;
  requestId?: string | null;
  spanId?: string | null;
  tenantId?: string | null;
  traceId?: string | null;
  userId?: string | null;
}

const logContextStore = new AsyncLocalStorage<LogContext>();
let prettyTransport: DestinationStream | null = null;

function normalizeContext(context: LogContext): Required<LogContext> {
  const activeTrace = getActiveTraceContext();
  const traceId = context.traceId ?? activeTrace?.traceId ?? context.requestId ?? null;
  const spanId = context.spanId ?? activeTrace?.spanId ?? null;

  return {
    jobId: context.jobId ?? null,
    operation: context.operation ?? null,
    requestId: context.requestId ?? null,
    spanId,
    tenantId: context.tenantId ?? null,
    traceId,
    userId: context.userId ?? null
  };
}

const sensitivePaths = [
  "authorization",
  "context.authorization",
  "context.csrfToken",
  "context.email",
  "context.password",
  "context.refreshToken",
  "context.secret",
  "context.sessionId",
  "context.session_id",
  "context.token",
  "cookie",
  "csrfToken",
  "email",
  "headers.authorization",
  "headers.cookie",
  "password",
  "refreshToken",
  "secret",
  "sessionId",
  "session_id",
  "token"
];

export type CreateLoggerOptions = LoggerOptions & {
  env?: NodeJS.ProcessEnv;
  runtimeConfig?: Partial<LoggerConfig>;
};

function resolveLoggerConfig(options?: CreateLoggerOptions): LoggerConfig {
  const env = getEnvironmentSource(options?.env);
  const config = getLoggerConfig(env);
  const overrides = options?.runtimeConfig;

  if (!overrides) {
    return config;
  }

  return {
    LOG_LEVEL: overrides.LOG_LEVEL ?? config.LOG_LEVEL,
    LOG_SAMPLE_RATE: overrides.LOG_SAMPLE_RATE ?? config.LOG_SAMPLE_RATE,
    NODE_ENV: overrides.NODE_ENV ?? config.NODE_ENV
  };
}

function shouldSample(level: number, sampleRate: number): boolean {
  if (level >= 50) {
    return false;
  }

  if (sampleRate >= 1) {
    return false;
  }

  if (sampleRate <= 0) {
    return true;
  }

  return Math.random() > sampleRate;
}

function getPrettyTransport(): DestinationStream {
  if (prettyTransport) {
    return prettyTransport;
  }

  prettyTransport = transport({
    options: {
      colorize: true,
      ignore: "pid,hostname",
      translateTime: "SYS:standard"
    },
    target: "pino-pretty"
  });

  return prettyTransport;
}

export function getLogContext(): Required<LogContext> {
  return normalizeContext(logContextStore.getStore() ?? {});
}

export function runWithLogContext<T>(context: LogContext, callback: () => T): T {
  const current = getLogContext();
  return logContextStore.run(
    normalizeContext({
      ...current,
      ...context
    }),
    callback
  );
}

export function updateLogContext(context: LogContext): void {
  const current = getLogContext();
  logContextStore.enterWith(
    normalizeContext({
      ...current,
      ...context
    })
  );
}

export function createLogger(service: string, options?: CreateLoggerOptions): Logger {
  const runtimeConfig = resolveLoggerConfig(options);
  const { env: _env, runtimeConfig: _runtimeConfig, ...loggerOptionOverrides } = options ?? {};
  const isProduction = runtimeConfig.NODE_ENV === "production";
  const shouldPrettyPrint = !isProduction && runtimeConfig.NODE_ENV !== "test";
  const loggerOptions: LoggerOptions = {
    ...loggerOptionOverrides,
    base: {
      ...(loggerOptionOverrides.base ?? {}),
      environment: runtimeConfig.NODE_ENV,
      service
    },
    formatters: {
      level: (label) => ({
        level: label
      })
    },
    hooks: {
      logMethod(args, method, level) {
        if (shouldSample(level, runtimeConfig.LOG_SAMPLE_RATE)) {
          return;
        }

        return (method as (...values: unknown[]) => void).apply(this, args as unknown[]);
      }
    },
    level: loggerOptionOverrides.level ?? runtimeConfig.LOG_LEVEL,
    messageKey: "message",
    mixin: () => {
      const context = getLogContext();
      const trace = getActiveTraceContext();
      const traceId = context.traceId ?? trace?.traceId ?? context.requestId ?? null;
      const spanId = context.spanId ?? trace?.spanId ?? null;

      return {
        jobId: context.jobId,
        job_id: context.jobId,
        operation: context.operation,
        requestId: context.requestId,
        request_id: context.requestId,
        spanId,
        span_id: spanId,
        tenantId: context.tenantId,
        tenant_id: context.tenantId,
        traceId,
        trace_id: traceId,
        userId: context.userId,
        user_id: context.userId
      };
    },
    redact: {
      censor: "[REDACTED]",
      paths: sensitivePaths
    },
    timestamp: () => `,"timestamp":"${new Date().toISOString()}"`
  };

  if (loggerOptionOverrides.transport) {
    return pino(loggerOptions);
  }

  if (shouldPrettyPrint) {
    return pino(loggerOptions, getPrettyTransport());
  }

  return pino(loggerOptions);
}

export * from "./metrics.js";
export * from "./otel.js";
