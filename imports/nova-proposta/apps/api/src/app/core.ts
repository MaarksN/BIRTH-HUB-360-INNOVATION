import type { ApiConfig } from "@birthub/config";
import { createLogger } from "@birthub/logger";
import cors from "cors";
import express from "express";
import type { Express } from "express";
import swaggerUi from "swagger-ui-express";
import helmet from "helmet";

import {
  configureCacheStore,
  registerTenantCacheInvalidationMiddleware
} from "../common/cache/index.js";
import { openApiDocument } from "../docs/openapi.js";
import {
  createDeepHealthService,
  createHealthService,
  createReadinessHealthService
} from "../lib/health.js";
import { asyncHandler, ProblemDetailsError } from "../lib/problem-details.js";
import { contentTypeMiddleware } from "../middleware/content-type.js";
import { csrfProtection } from "../middleware/csrf.js";
import { breakGlassAuditMiddleware } from "../middleware/break-glass-audit.js";
import { errorHandler, notFoundMiddleware } from "../middleware/global-error-filter.js";
import { authenticationMiddleware } from "../middleware/authentication.js";
import { originValidationMiddleware } from "../middleware/origin-check.js";
import {
  createRateLimitMiddleware,
  createWebhookRateLimitMiddleware
} from "../middleware/rate-limit.js";
import { metricsHandler, metricsMiddleware } from "../metrics.js";
import { requestContextMiddleware } from "../middleware/request-context.js";
import { sanitizeMutationInput } from "../middleware/sanitize-input.js";
import { tenantContextMiddleware } from "../middlewares/tenantContext.js";
import { startPrivacyRetentionScheduler } from "../modules/privacy/retention-scheduler.js";
import { initializeWorkflowInternalEventBridge } from "../modules/webhooks/index.js";
import { createStripeWebhookRouter } from "../modules/webhooks/stripe.router.js";
import {
  mainContextPipeline,
  mainErrorPipeline,
  mainPostTransformProtectionPipeline,
  mainPostValidationObservabilityPipeline,
  mainPreTransformProtectionPipeline,
  mainPreWebhookObservabilityPipeline,
  mainPreWebhookProtectionPipeline,
  mainTransformPipeline,
  mainValidationPipeline,
  type ApiPipelineStep
} from "./pipeline.js";

const requestLogger = createLogger("api-http");
type PipelineRegistrationMap = Record<ApiPipelineStep["name"], (app: Express) => void>;

function buildCorsOptions(config: ApiConfig): cors.CorsOptions {
  return {
    credentials: true,
    origin: (origin, callback) => {
      if (!origin || config.corsOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(
        new ProblemDetailsError({
          detail: `Origin '${origin}' is not present in the API allowlist.`,
          status: 403,
          title: "Forbidden"
        })
      );
    }
  };
}

function buildHelmetOptions(): Parameters<typeof helmet>[0] {
  return {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        objectSrc: ["'none'"],
        scriptSrc: ["'self'"],
        upgradeInsecureRequests: []
      }
    },
    hsts: {
      includeSubDomains: true,
      maxAge: 31536000,
      preload: true
    }
  };
}

function registerRequestLoggingMiddleware(app: Express): void {
  app.use((request, response, next) => {
    const startedAt = process.hrtime.bigint();

    response.on("finish", () => {
      const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
      const payload = {
        durationMs: Number(durationMs.toFixed(2)),
        method: request.method,
        organizationId: request.context.organizationId,
        path: request.originalUrl,
        remoteAddress: request.ip ?? request.header("x-forwarded-for") ?? null,
        requestId: request.context.requestId,
        role: request.context.role,
        statusCode: response.statusCode,
        tenantId: request.context.tenantId,
        traceId: request.context.traceId,
        userId: request.context.userId
      };

      if (response.statusCode >= 500) {
        requestLogger.error(payload, "HTTP request completed with server error");
        return;
      }

      if (response.statusCode >= 400) {
        requestLogger.warn(payload, "HTTP request completed with client error");
        return;
      }

      requestLogger.info(payload, "HTTP request completed");
    });

    next();
  });
}

function registerTimeoutMiddleware(app: Express, config: ApiConfig): void {
  app.use((request, response, next) => {
    request.setTimeout(config.API_HANDLER_TIMEOUT_MS);
    response.setTimeout(config.API_HANDLER_TIMEOUT_MS, () => {
      if (response.headersSent) {
        return;
      }

      next(
        new ProblemDetailsError({
          detail: `Request exceeded ${config.API_HANDLER_TIMEOUT_MS}ms timeout budget.`,
          status: 408,
          title: "Request Timeout"
        })
      );
    });
    next();
  });
}

function applyPipeline(
  app: Express,
  pipelineDefinition: readonly ApiPipelineStep[],
  registrations: Partial<PipelineRegistrationMap>
): void {
  for (const step of pipelineDefinition) {
    const register = registrations[step.name];

    if (!register) {
      throw new Error(`Missing pipeline registration for step '${step.name}'.`);
    }

    register(app);
  }
}

function createInfrastructurePipelineRegistrations(config: ApiConfig): Partial<PipelineRegistrationMap> {
  return {
    authentication: (app) => {
      app.use(authenticationMiddleware(config.API_AUTH_COOKIE_NAME, config));
    },
    breakGlassAudit: (app) => {
      app.use(breakGlassAuditMiddleware);
    },
    contentType: (app) => {
      app.use(contentTypeMiddleware);
    },
    cors: (app) => {
      app.use(cors(buildCorsOptions(config)));
    },
    csrf: (app) => {
      app.use(
        csrfProtection({
          cookieName: config.API_CSRF_COOKIE_NAME,
          headerName: config.API_CSRF_HEADER_NAME
        })
      );
    },
    errorHandler: () => {
      throw new Error("errorHandler is registered via the terminal pipeline.");
    },
    helmet: (app) => {
      app.use(helmet(buildHelmetOptions()));
    },
    jsonParser: (app) => {
      app.use(express.json({ limit: config.API_JSON_BODY_LIMIT }));
    },
    metrics: (app) => {
      app.use(metricsMiddleware);
    },
    notFound: () => {
      throw new Error("notFound is registered via the terminal pipeline.");
    },
    originCheck: (app) => {
      app.use(originValidationMiddleware(config.corsOrigins));
    },
    rateLimit: (app) => {
      app.use(createRateLimitMiddleware(config));
    },
    requestContext: (app) => {
      app.use(requestContextMiddleware);
    },
    requestLogging: (app) => {
      registerRequestLoggingMiddleware(app);
    },
    requestTimeout: (app) => {
      registerTimeoutMiddleware(app, config);
    },
    routeHandlers: () => {
      throw new Error("routeHandlers are registered outside configureAppInfrastructure.");
    },
    sanitizeInput: (app) => {
      app.use(sanitizeMutationInput);
    },
    tenantContext: (app) => {
      app.use(tenantContextMiddleware);
    }
  };
}

function createTerminalPipelineRegistrations(): Partial<PipelineRegistrationMap> {
  return {
    errorHandler: (app) => {
      app.use(errorHandler);
    },
    notFound: (app) => {
      app.use(notFoundMiddleware);
    }
  };
}

function applyContextPipeline(
  app: Express,
  registrations: Partial<PipelineRegistrationMap>
): void {
  applyPipeline(app, mainContextPipeline, registrations);
}

function applyPreWebhookObservabilityPipeline(
  app: Express,
  registrations: Partial<PipelineRegistrationMap>
): void {
  applyPipeline(app, mainPreWebhookObservabilityPipeline, registrations);
}

function applyPreWebhookProtectionPipeline(
  app: Express,
  registrations: Partial<PipelineRegistrationMap>
): void {
  applyPipeline(app, mainPreWebhookProtectionPipeline, registrations);
}

function applyValidationPipeline(
  app: Express,
  registrations: Partial<PipelineRegistrationMap>
): void {
  applyPipeline(app, mainValidationPipeline, registrations);
}

function applyPreTransformProtectionPipeline(
  app: Express,
  registrations: Partial<PipelineRegistrationMap>
): void {
  applyPipeline(app, mainPreTransformProtectionPipeline, registrations);
}

function applyPostValidationObservabilityPipeline(
  app: Express,
  registrations: Partial<PipelineRegistrationMap>
): void {
  applyPipeline(app, mainPostValidationObservabilityPipeline, registrations);
}

function applyTransformPipeline(
  app: Express,
  registrations: Partial<PipelineRegistrationMap>
): void {
  applyPipeline(app, mainTransformPipeline, registrations);
}

function applyProtectionPipeline(
  app: Express,
  registrations: Partial<PipelineRegistrationMap>
): void {
  applyPipeline(app, mainPostTransformProtectionPipeline, registrations);
}

function applyErrorPipeline(app: Express): void {
  applyPipeline(app, mainErrorPipeline, createTerminalPipelineRegistrations());
}

export function configureAppInfrastructure(app: Express, config: ApiConfig): void {
  configureCacheStore(config.REDIS_URL, config.NODE_ENV);
  if (config.NODE_ENV !== "test") {
    registerTenantCacheInvalidationMiddleware();
    if (config.privacyAdvancedEnabled) {
      startPrivacyRetentionScheduler(config);
    }
  }
  initializeWorkflowInternalEventBridge(config);

  app.disable("x-powered-by");
  const registrations = createInfrastructurePipelineRegistrations(config);
  applyContextPipeline(app, registrations);
  applyPreWebhookObservabilityPipeline(app, registrations);
  applyPreWebhookProtectionPipeline(app, registrations);

  const stripeWebhookEnabled = Boolean(config.STRIPE_SECRET_KEY && config.STRIPE_WEBHOOK_SECRET);
  if (stripeWebhookEnabled) {
    app.use(
      "/api/webhooks",
      createWebhookRateLimitMiddleware(config),
      createStripeWebhookRouter(config)
    );
  }

  applyValidationPipeline(app, registrations);
  applyPreTransformProtectionPipeline(app, registrations);
  applyPostValidationObservabilityPipeline(app, registrations);
  applyTransformPipeline(app, registrations);
  applyProtectionPipeline(app, registrations);
}

export function registerOperationalRoutes(
  app: Express,
  config: ApiConfig,
  options: {
    deepHealthService?: ReturnType<typeof createDeepHealthService>;
    healthService?: ReturnType<typeof createHealthService>;
    readinessService?: ReturnType<typeof createReadinessHealthService>;
    shouldExposeDocs: boolean;
  }
): void {
  const healthService = options.healthService ?? createHealthService(config);
  const deepHealthService = options.deepHealthService ?? createDeepHealthService(config);
  const readinessService = options.readinessService ?? createReadinessHealthService(config);

  if (options.shouldExposeDocs) {
    app.get("/api/openapi.json", (_request, response) => {
      response.json(openApiDocument);
    });

    app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));
  }

  app.get(
    "/metrics",
    asyncHandler(async (request, response) => {
      await metricsHandler(request, response);
    })
  );

  app.get(
    "/api/v1/metrics",
    asyncHandler(async (request, response) => {
      await metricsHandler(request, response);
    })
  );

  app.get(
    "/health",
    asyncHandler(async (_request, response) => {
      response.status(200).json(await healthService());
    })
  );

  app.get(
    "/api/v1/health",
    asyncHandler(async (_request, response) => {
      response.status(200).json(await healthService());
    })
  );

  app.get(
    "/health/deep",
    asyncHandler(async (_request, response) => {
      const payload = await deepHealthService();
      response.status(payload.status === "ok" ? 200 : 503).json(payload);
    })
  );

  app.get(
    "/api/v1/health/deep",
    asyncHandler(async (_request, response) => {
      const payload = await deepHealthService();
      response.status(payload.status === "ok" ? 200 : 503).json(payload);
    })
  );

  app.get(
    "/health/readiness",
    asyncHandler(async (_request, response) => {
      const payload = await readinessService();
      response.status(payload.status === "ok" ? 200 : 503).json(payload);
    })
  );

  app.get(
    "/api/v1/health/readiness",
    asyncHandler(async (_request, response) => {
      const payload = await readinessService();
      response.status(payload.status === "ok" ? 200 : 503).json(payload);
    })
  );
}

export function registerGlobalErrorHandling(app: Express): void {
  applyErrorPipeline(app);
}
