import { z } from "zod";
export declare const databaseEnvSchema: z.ZodObject<{
    DATABASE_CONNECTION_LIMIT: z.ZodPipe<z.ZodTransform<number, unknown>, z.ZodOptional<z.ZodNumber>>;
    DATABASE_URL: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodOptional<z.ZodString>>;
    DB_SLOW_QUERY_MS: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    NODE_ENV: z.ZodDefault<z.ZodEnum<{
        development: "development";
        test: "test";
        production: "production";
    }>>;
    PRISMA_QUERY_TIMEOUT_MS: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
export type DatabaseConfig = z.infer<typeof databaseEnvSchema>;
export declare function getDatabaseConfig(env?: NodeJS.ProcessEnv): DatabaseConfig;
