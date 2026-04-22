import { type LoggerConfig } from "@birthub/config";
import { type Logger, type LoggerOptions } from "pino";
export interface LogContext {
    jobId?: string | null;
    operation?: string | null;
    requestId?: string | null;
    spanId?: string | null;
    tenantId?: string | null;
    traceId?: string | null;
    userId?: string | null;
}
export type CreateLoggerOptions = LoggerOptions & {
    env?: NodeJS.ProcessEnv;
    runtimeConfig?: Partial<LoggerConfig>;
};
export declare function getLogContext(): Required<LogContext>;
export declare function runWithLogContext<T>(context: LogContext, callback: () => T): T;
export declare function updateLogContext(context: LogContext): void;
export declare function createLogger(service: string, options?: CreateLoggerOptions): Logger;
export * from "./metrics.js";
export * from "./otel.js";
