export type ApiPipelineCategory =
  | "context"
  | "protection"
  | "transform"
  | "validation"
  | "observability";

export interface ApiPipelineStep {
  category: ApiPipelineCategory;
  dependsOn: string[];
  name: string;
  sideEffects: string[];
}

function pickPipelineSteps(
  pipeline: readonly ApiPipelineStep[],
  stepNames: readonly string[]
): readonly ApiPipelineStep[] {
  const selectedStepNames = new Set(stepNames);
  return pipeline.filter((step) => selectedStepNames.has(step.name));
}

export const mainApiPipeline: readonly ApiPipelineStep[] = [
  {
    category: "context",
    dependsOn: [],
    name: "requestContext",
    sideEffects: [
      "creates request.context",
      "sets x-request-id and x-trace-id response headers",
      "starts request-scoped log context"
    ]
  },
  {
    category: "observability",
    dependsOn: ["requestContext"],
    name: "requestLogging",
    sideEffects: ["registers response finish listener", "emits structured HTTP logs"]
  },
  {
    category: "context",
    dependsOn: ["requestContext"],
    name: "authentication",
    sideEffects: [
      "reads cookie and authorization headers",
      "populates auth fields on request.context",
      "updates log context",
      "sets debug identity headers outside production"
    ]
  },
  {
    category: "context",
    dependsOn: ["authentication"],
    name: "tenantContext",
    sideEffects: [
      "binds tenantContext to request",
      "updates organization, tenant and user fields on request.context",
      "sets tenant response headers",
      "annotates active tracing span",
      "runs request within database tenant context"
    ]
  },
  {
    category: "observability",
    dependsOn: ["authentication", "tenantContext"],
    name: "breakGlassAudit",
    sideEffects: [
      "registers response finish listener",
      "persists audit log for break-glass session access"
    ]
  },
  {
    category: "protection",
    dependsOn: [],
    name: "helmet",
    sideEffects: ["sets security headers"]
  },
  {
    category: "protection",
    dependsOn: [],
    name: "cors",
    sideEffects: ["enforces origin allowlist", "sets CORS response headers"]
  },
  {
    category: "validation",
    dependsOn: [],
    name: "contentType",
    sideEffects: ["rejects mutation requests with non-JSON payload content type"]
  },
  {
    category: "protection",
    dependsOn: [],
    name: "requestTimeout",
    sideEffects: [
      "sets request and response timeout budget",
      "raises 408 ProblemDetails error on timeout"
    ]
  },
  {
    category: "observability",
    dependsOn: ["requestContext"],
    name: "metrics",
    sideEffects: [
      "registers response finish listener",
      "publishes HTTP metrics",
      "annotates active tracing span"
    ]
  },
  {
    category: "transform",
    dependsOn: ["contentType"],
    name: "jsonParser",
    sideEffects: ["parses JSON request bodies into request.body"]
  },
  {
    category: "transform",
    dependsOn: ["jsonParser"],
    name: "sanitizeInput",
    sideEffects: ["rewrites request.body with sanitized string values"]
  },
  {
    category: "protection",
    dependsOn: ["authentication", "sanitizeInput"],
    name: "originCheck",
    sideEffects: ["rejects mutation requests with invalid origin or referer"]
  },
  {
    category: "protection",
    dependsOn: ["authentication"],
    name: "csrf",
    sideEffects: ["validates CSRF cookie and header for authenticated session mutations"]
  },
  {
    category: "protection",
    dependsOn: ["authentication", "tenantContext"],
    name: "rateLimit",
    sideEffects: [
      "sets standard rate-limit headers",
      "uses Redis or in-memory fixed-window limiter",
      "may persist login brute-force alerts",
      "returns 429 or 503 when rate limiting fails"
    ]
  },
  {
    category: "validation",
    dependsOn: [],
    name: "routeHandlers",
    sideEffects: ["dispatches operational, auth, core and module routes"]
  },
  {
    category: "validation",
    dependsOn: ["routeHandlers"],
    name: "notFound",
    sideEffects: ["raises 404 ProblemDetailsError when no route matches"]
  },
  {
    category: "observability",
    dependsOn: ["requestContext"],
    name: "errorHandler",
    sideEffects: [
      "logs handled and unhandled API failures",
      "captures exceptions for tracing and Sentry",
      "serializes Problem Details responses"
    ]
  }
];

export const webhookApiPipeline: readonly ApiPipelineStep[] = [
  {
    category: "protection",
    dependsOn: [],
    name: "webhookRateLimit",
    sideEffects: [
      "sets rate-limit headers for webhook ingress",
      "uses tenant or public fallback keying before main context pipeline"
    ]
  },
  {
    category: "transform",
    dependsOn: ["webhookRateLimit"],
    name: "stripeRawBody",
    sideEffects: ["parses request body as express.raw(application/json)"]
  },
  {
    category: "validation",
    dependsOn: ["stripeRawBody"],
    name: "stripeWebhookHandler",
    sideEffects: [
      "verifies and processes Stripe webhook payloads",
      "returns webhook processing result"
    ]
  }
];

export const routeScopedApiPipeline: readonly ApiPipelineStep[] = [
  {
    category: "protection",
    dependsOn: ["requestContext"],
    name: "loginRateLimit",
    sideEffects: [
      "limits login attempts by tenant, email and IP",
      "may release successful reservations"
    ]
  },
  {
    category: "validation",
    dependsOn: ["jsonParser", "sanitizeInput"],
    name: "validateBody",
    sideEffects: [
      "validates request.body with Zod",
      "rewrites request.body with parsed schema output"
    ]
  }
];

export const mainInfrastructurePreWebhookPipeline: readonly ApiPipelineStep[] = pickPipelineSteps(
  mainApiPipeline,
  [
    "requestContext",
    "requestLogging",
    "authentication",
    "tenantContext",
    "breakGlassAudit",
    "helmet",
    "cors"
  ]
);

export const mainContextPipeline: readonly ApiPipelineStep[] = pickPipelineSteps(mainApiPipeline, [
  "requestContext",
  "authentication",
  "tenantContext"
]);

export const mainPreWebhookObservabilityPipeline: readonly ApiPipelineStep[] = pickPipelineSteps(
  mainApiPipeline,
  ["requestLogging", "breakGlassAudit"]
);

export const mainPreWebhookProtectionPipeline: readonly ApiPipelineStep[] = pickPipelineSteps(
  mainApiPipeline,
  ["helmet", "cors"]
);

export const mainValidationPipeline: readonly ApiPipelineStep[] = pickPipelineSteps(
  mainApiPipeline,
  ["contentType"]
);

export const mainPreTransformProtectionPipeline: readonly ApiPipelineStep[] = pickPipelineSteps(
  mainApiPipeline,
  ["requestTimeout"]
);

export const mainPostValidationObservabilityPipeline: readonly ApiPipelineStep[] = pickPipelineSteps(
  mainApiPipeline,
  ["metrics"]
);

export const mainTransformPipeline: readonly ApiPipelineStep[] = pickPipelineSteps(
  mainApiPipeline,
  ["jsonParser", "sanitizeInput"]
);

export const mainPostTransformProtectionPipeline: readonly ApiPipelineStep[] = pickPipelineSteps(
  mainApiPipeline,
  ["originCheck", "csrf", "rateLimit"]
);

export const mainInfrastructurePostWebhookPipeline: readonly ApiPipelineStep[] = pickPipelineSteps(
  mainApiPipeline,
  [
    "contentType",
    "requestTimeout",
    "metrics",
    "jsonParser",
    "sanitizeInput",
    "originCheck",
    "csrf",
    "rateLimit"
  ]
);

export const mainErrorPipeline: readonly ApiPipelineStep[] = pickPipelineSteps(mainApiPipeline, [
  "notFound",
  "errorHandler"
]);
