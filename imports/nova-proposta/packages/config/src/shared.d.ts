import { z, type ZodTypeAny } from "zod";
export declare const nodeEnvSchema: z.ZodDefault<z.ZodEnum<{
    development: "development";
    test: "test";
    production: "production";
}>>;
export declare const deploymentEnvironmentSchema: z.ZodDefault<z.ZodEnum<{
    development: "development";
    test: "test";
    production: "production";
    staging: "staging";
    ci: "ci";
    "ci-local": "ci-local";
}>>;
export declare const nonEmptyString: z.ZodString;
export declare const optionalNonEmptyString: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodOptional<z.ZodString>>;
export declare const envBoolean: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodBoolean>;
export declare const commaSeparatedList: z.ZodPipe<z.ZodDefault<z.ZodString>, z.ZodTransform<string[], string>>;
export declare const urlString: z.ZodString;
export declare const optionalUrlString: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodOptional<z.ZodString>>;
export declare function isLocalHostname(hostname: string): boolean;
export declare function isLocalUrl(value: string): boolean;
export declare function isSecureHttpUrl(value: string): boolean;
export declare function hasPlaceholderMarker(value: string): boolean;
export declare function isStripeTestSecretKey(value: string): boolean;
export declare function hasRequiredPostgresSsl(value: string): boolean;
export declare function hasRequiredRedisTls(value: string): boolean;
export declare class EnvValidationError extends Error {
    constructor(scope: string, issues: string[]);
}
export declare function parseEnv<TSchema extends ZodTypeAny>(scope: string, schema: TSchema, env: NodeJS.ProcessEnv): z.infer<TSchema>;
