import { z } from "zod";

import { getEnvironmentSource } from "./environment.js";
import { describeResolvedSecret } from "./secrets.js";
import {
  EnvValidationError,
  envBoolean,
  hasPlaceholderMarker,
  hasRequiredRedisTls,
  nodeEnvSchema,
  nonEmptyString,
  optionalNonEmptyString,
  optionalUrlString,
  parseEnv,
  urlString
} from "./shared.js";

export const webhookReceiverEnvSchema = z.object({
  API_GATEWAY_URL: urlString.default("http://localhost:3000"),
  HUBSPOT_CLIENT_SECRET: optionalNonEmptyString,
  HUBSPOT_WEBHOOK_PUBLIC_BASE_URL: optionalUrlString,
  INTERNAL_SERVICE_TOKEN: optionalNonEmptyString,
  JOB_HMAC_GLOBAL_SECRET: nonEmptyString.default("dev-job-hmac-secret"),
  JOB_HMAC_GLOBAL_SECRET_FALLBACKS: z.string().default(""),
  NODE_ENV: nodeEnvSchema,
  PRIMARY_API_URL: urlString.default("http://localhost:3000"),
  REDIS_URL: optionalUrlString,
  STRICT_RUNTIME: envBoolean.optional(),
  STRIPE_WEBHOOK_SECRET: optionalNonEmptyString,
  STRIPE_WEBHOOK_SECRET_FALLBACKS: z.string().default(""),
  SVIX_WEBHOOK_SECRET: optionalNonEmptyString,
  WEBHOOK_IDEMPOTENCY_TTL_SECONDS: z.coerce.number().int().positive().default(24 * 60 * 60),
  WEBHOOK_RECEIVER_PORT: z.coerce.number().int().positive().default(3010)
});

export type WebhookReceiverConfig = z.infer<typeof webhookReceiverEnvSchema> & {
  apiGatewayUrl: string;
  birthhubSigningSecret: string;
  birthhubSigningSecretCandidates: string[];
  hubspotClientSecret?: string | undefined;
  hubspotPublicBaseUrl?: string | undefined;
  internalServiceToken?: string | undefined;
  nodeEnv: string;
  port: number;
  primaryApiUrl: string;
  redisUrl?: string | undefined;
  secretCatalog: {
    birthhubSigning: ReturnType<typeof describeResolvedSecret>;
    hubspotClient: ReturnType<typeof describeResolvedSecret> | null;
    stripeWebhook: ReturnType<typeof describeResolvedSecret> | null;
    svixWebhook: ReturnType<typeof describeResolvedSecret> | null;
  };
  strictRuntime: boolean;
  stripeWebhookSecret?: string | undefined;
  stripeWebhookSecretCandidates: string[];
  svixWebhookSecret?: string | undefined;
  webhookIdempotencyTtlSeconds: number;
};

function resolveStrictRuntime(parsed: z.infer<typeof webhookReceiverEnvSchema>): boolean {
  if (parsed.NODE_ENV === "development" || parsed.NODE_ENV === "test") {
    return parsed.STRICT_RUNTIME ?? false;
  }

  return parsed.STRICT_RUNTIME ?? true;
}

function normalizeWebhookReceiverEnv(
  env: NodeJS.ProcessEnv
): NodeJS.ProcessEnv {
  const runtimeEnvironment = getEnvironmentSource(env);
  const apiGatewayUrl =
    runtimeEnvironment.API_GATEWAY_URL ??
    runtimeEnvironment.PRIMARY_API_URL ??
    "http://localhost:3000";
  const primaryApiUrl =
    runtimeEnvironment.PRIMARY_API_URL ??
    runtimeEnvironment.API_URL ??
    apiGatewayUrl;

  return {
    ...runtimeEnvironment,
    API_GATEWAY_URL: apiGatewayUrl,
    PRIMARY_API_URL: primaryApiUrl
  };
}

function validateProductionWebhookReceiverConfig(
  parsed: z.infer<typeof webhookReceiverEnvSchema>,
  secretCatalog: WebhookReceiverConfig["secretCatalog"]
): void {
  const issues: string[] = [];

  if (
    secretCatalog.birthhubSigning.candidates.some(
      (candidate) =>
        candidate === "dev-job-hmac-secret" || hasPlaceholderMarker(candidate)
    )
  ) {
    issues.push(
      "JOB_HMAC_GLOBAL_SECRET cannot use development defaults or placeholders in production."
    );
  }

  if (parsed.HUBSPOT_CLIENT_SECRET && hasPlaceholderMarker(parsed.HUBSPOT_CLIENT_SECRET)) {
    issues.push("HUBSPOT_CLIENT_SECRET cannot use placeholder values in production.");
  }

  if (
    secretCatalog.stripeWebhook?.candidates.some((candidate) =>
      hasPlaceholderMarker(candidate)
    )
  ) {
    issues.push("STRIPE_WEBHOOK_SECRET cannot use placeholder values in production.");
  }

  if (parsed.SVIX_WEBHOOK_SECRET && hasPlaceholderMarker(parsed.SVIX_WEBHOOK_SECRET)) {
    issues.push("SVIX_WEBHOOK_SECRET cannot use placeholder values in production.");
  }

  if (!parsed.REDIS_URL) {
    issues.push("REDIS_URL is required for distributed webhook idempotency in production.");
  } else if (!hasRequiredRedisTls(parsed.REDIS_URL)) {
    issues.push("REDIS_URL must use TLS for webhook idempotency in production.");
  }

  if (issues.length > 0) {
    throw new EnvValidationError("webhook-receiver", issues);
  }
}

export function getWebhookReceiverConfig(
  env: NodeJS.ProcessEnv = getEnvironmentSource()
): WebhookReceiverConfig {
  const normalizedEnvironment = normalizeWebhookReceiverEnv(env);
  const parsed = parseEnv(
    "webhook-receiver",
    webhookReceiverEnvSchema,
    normalizedEnvironment
  );
  const secretCatalog = {
    birthhubSigning: describeResolvedSecret({
      fallbacks: parsed.JOB_HMAC_GLOBAL_SECRET_FALLBACKS,
      primary: parsed.JOB_HMAC_GLOBAL_SECRET
    }),
    hubspotClient: parsed.HUBSPOT_CLIENT_SECRET
      ? describeResolvedSecret({ primary: parsed.HUBSPOT_CLIENT_SECRET })
      : null,
    stripeWebhook: parsed.STRIPE_WEBHOOK_SECRET
      ? describeResolvedSecret({
          fallbacks: parsed.STRIPE_WEBHOOK_SECRET_FALLBACKS,
          primary: parsed.STRIPE_WEBHOOK_SECRET
        })
      : null,
    svixWebhook: parsed.SVIX_WEBHOOK_SECRET
      ? describeResolvedSecret({ primary: parsed.SVIX_WEBHOOK_SECRET })
      : null
  };

  if (parsed.NODE_ENV === "production") {
    validateProductionWebhookReceiverConfig(parsed, secretCatalog);
  }

  return {
    ...parsed,
    apiGatewayUrl: parsed.API_GATEWAY_URL,
    birthhubSigningSecret: parsed.JOB_HMAC_GLOBAL_SECRET,
    birthhubSigningSecretCandidates: secretCatalog.birthhubSigning.candidates,
    ...(parsed.HUBSPOT_CLIENT_SECRET
      ? { hubspotClientSecret: parsed.HUBSPOT_CLIENT_SECRET }
      : {}),
    ...(parsed.HUBSPOT_WEBHOOK_PUBLIC_BASE_URL
      ? { hubspotPublicBaseUrl: parsed.HUBSPOT_WEBHOOK_PUBLIC_BASE_URL }
      : {}),
    ...(parsed.INTERNAL_SERVICE_TOKEN
      ? { internalServiceToken: parsed.INTERNAL_SERVICE_TOKEN }
      : {}),
    nodeEnv: parsed.NODE_ENV,
    port: parsed.WEBHOOK_RECEIVER_PORT,
    primaryApiUrl: parsed.PRIMARY_API_URL,
    ...(parsed.REDIS_URL ? { redisUrl: parsed.REDIS_URL } : {}),
    secretCatalog,
    strictRuntime: resolveStrictRuntime(parsed),
    ...(parsed.STRIPE_WEBHOOK_SECRET
      ? { stripeWebhookSecret: parsed.STRIPE_WEBHOOK_SECRET }
      : {}),
    stripeWebhookSecretCandidates:
      secretCatalog.stripeWebhook?.candidates ?? [],
    ...(parsed.SVIX_WEBHOOK_SECRET
      ? { svixWebhookSecret: parsed.SVIX_WEBHOOK_SECRET }
      : {}),
    webhookIdempotencyTtlSeconds: parsed.WEBHOOK_IDEMPOTENCY_TTL_SECONDS
  };
}
