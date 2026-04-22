import { z } from "zod";
import { type ProductCapabilities } from "./product-capabilities.js";
export declare const webEnvSchema: z.ZodObject<{
    NEXT_PUBLIC_POSTHOG_HOST: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodOptional<z.ZodString>>;
    NEXT_PUBLIC_POSTHOG_KEY: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodOptional<z.ZodString>>;
    NEXT_PUBLIC_SENTRY_DSN: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodOptional<z.ZodString>>;
    NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    SENTRY_AUTH_TOKEN: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodOptional<z.ZodString>>;
    WEB_PORT: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    NEXT_PUBLIC_ENABLE_CLINICAL_WORKSPACE: z.ZodDefault<z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodBoolean>>;
    NEXT_PUBLIC_ENABLE_FHIR_FACADE: z.ZodDefault<z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodBoolean>>;
    NEXT_PUBLIC_ENABLE_PRIVACY_ADVANCED: z.ZodDefault<z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodBoolean>>;
    NEXT_PUBLIC_ENABLE_PRIVACY_SELF_SERVICE: z.ZodDefault<z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodBoolean>>;
    CSP_REPORT_URI: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodOptional<z.ZodString>>;
    NEXTAUTH_SECRET: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodOptional<z.ZodString>>;
    NEXT_PUBLIC_API_URL: z.ZodDefault<z.ZodString>;
    NEXT_PUBLIC_APP_URL: z.ZodDefault<z.ZodString>;
    NEXT_PUBLIC_CSP_REPORT_ONLY: z.ZodDefault<z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodBoolean>>;
    NEXT_PUBLIC_ENVIRONMENT: z.ZodDefault<z.ZodEnum<{
        development: "development";
        test: "test";
        production: "production";
        staging: "staging";
        ci: "ci";
        "ci-local": "ci-local";
    }>>;
}, z.core.$strip>;
export type WebConfig = z.infer<typeof webEnvSchema> & ProductCapabilities;
export declare function getWebConfig(env?: NodeJS.ProcessEnv): WebConfig;
