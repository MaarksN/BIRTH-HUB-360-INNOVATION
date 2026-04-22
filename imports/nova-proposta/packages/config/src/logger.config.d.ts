import { z } from "zod";
export declare const loggerEnvSchema: z.ZodObject<{
    LOG_LEVEL: z.ZodDefault<z.ZodEnum<{
        error: "error";
        fatal: "fatal";
        warn: "warn";
        info: "info";
        debug: "debug";
        trace: "trace";
    }>>;
    LOG_SAMPLE_RATE: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    NODE_ENV: z.ZodDefault<z.ZodEnum<{
        development: "development";
        test: "test";
        production: "production";
    }>>;
}, z.core.$strip>;
export type LoggerConfig = z.infer<typeof loggerEnvSchema>;
export declare function getLoggerConfig(env?: NodeJS.ProcessEnv): LoggerConfig;
