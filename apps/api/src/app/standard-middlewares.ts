import type { ApiConfig } from "@birthub/config";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { definePipelineMiddleware, type PipelineMiddleware } from "./middleware-pipeline.js";

import { authenticationMiddleware } from "../middleware/authentication.js";
import { breakGlassAuditMiddleware } from "../middleware/break-glass-audit.js";
import { contentTypeMiddleware } from "../middleware/content-type.js";
import { csrfProtection } from "../middleware/csrf.js";
import { originValidationMiddleware } from "../middleware/origin-check.js";
import { createRateLimitMiddleware } from "../middleware/rate-limit.js";
import { requestContextMiddleware } from "../middleware/request-context.js";
import { sanitizeMutationInput } from "../middleware/sanitize-input.js";
import { tenantContextMiddleware } from "../middlewares/tenantContext.js";
import { ProblemDetailsError } from "../lib/problem-details.js";

/**
 * Standard middleware definitions for BirthHub API
 */

// ============ PRE-CONTEXT PHASE (0-10) ============
export const jsonParserMiddleware = definePipelineMiddleware(
  "json-parser",
  "pre-context",
  0,
  (config: ApiConfig) => express.json({ limit: config.API_JSON_BODY_LIMIT })
);

export const helmetMiddleware = definePipelineMiddleware(
  "helmet",
  "pre-context",
  2,
  () => helmet(buildHelmetOptions())
);

export const disablePoweredByMiddleware = definePipelineMiddleware(
  "disable-powered-by",
  "pre-context",
  1,
  () => (_req, _res, next) => {
    // This runs on app initialization, not as middleware
    // Moved to core setup
    next();
  }
);

// ============ CONTEXT PHASE (10-50) ============
export const corsMiddleware = definePipelineMiddleware(
  "cors",
  "context",
  10,
  (config: ApiConfig) => cors(buildCorsOptions(config))
);

export const contentTypeMiddlewareEntry = definePipelineMiddleware(
  "content-type",
  "context",
  12,
  () => contentTypeMiddleware
);

export const requestContextMiddlewareEntry = definePipelineMiddleware(
  "request-context",
  "context",
  14,
  () => requestContextMiddleware
);

export const tenantContextMiddlewareEntry = definePipelineMiddleware(
  "tenant-context",
  "context",
  16,
  () => tenantContextMiddleware
);

// ============ PRE-VALIDATION PHASE (50-100) ============
export const originCheckMiddleware = definePipelineMiddleware(
  "origin-check",
  "pre-validation",
  50,
  (config: ApiConfig) => originValidationMiddleware(config.corsOrigins)
);

export const rateLimitMiddleware = definePipelineMiddleware(
  "rate-limit",
  "pre-validation",
  52,
  (config: ApiConfig) => createRateLimitMiddleware(config)
);

// ============ VALIDATION PHASE (100-150) ============
export const authenticationMiddlewareEntry = definePipelineMiddleware(
  "authentication",
  "validation",
  100,
  (config: ApiConfig) => authenticationMiddleware(config.API_AUTH_COOKIE_NAME, config)
);

export const csrfProtectionMiddleware = definePipelineMiddleware(
  "csrf",
  "validation",
  102,
  (config: ApiConfig) =>
    csrfProtection({
      cookieName: config.API_CSRF_COOKIE_NAME,
      headerName: config.API_CSRF_HEADER_NAME
    })
);

// ============ PRE-TRANSFORM PHASE (150-200) ============
export const breakGlassAuditMiddlewareEntry = definePipelineMiddleware(
  "break-glass-audit",
  "pre-transform",
  150,
  () => breakGlassAuditMiddleware
);

export const sanitizeInputMiddleware = definePipelineMiddleware(
  "sanitize-input",
  "pre-transform",
  152,
  () => sanitizeMutationInput
);

// ============ HELPER FUNCTIONS ============
function buildCorsOptions(config: ApiConfig): Parameters<typeof cors>[0] {
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
        baseUri: ["'self'"],
        defaultSrc: ["'self'"],
        fontSrc: ["'self'", "data:"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        imgSrc: ["'self'", "data:", "https:"],
        objectSrc: ["'none'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        upgradeInsecureRequests: []
      }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: {
      policy: "same-origin"
    },
    crossOriginResourcePolicy: {
      policy: "same-site"
    },
    frameguard: {
      action: "deny"
    },
    hsts: {
      includeSubDomains: true,
      maxAge: 31536000,
      preload: true
    },
    originAgentCluster: true,
    permittedCrossDomainPolicies: {
      permittedPolicies: "none"
    },
    referrerPolicy: {
      policy: "strict-origin-when-cross-origin"
    },
    xDnsPrefetchControl: {
      allow: false
    }
  };
}

/**
 * Export all standard middlewares as a bundle
 */
export const STANDARD_MIDDLEWARES: PipelineMiddleware[] = [
  // Pre-context
  jsonParserMiddleware,
  helmetMiddleware,

  // Context
  corsMiddleware,
  contentTypeMiddlewareEntry,
  requestContextMiddlewareEntry,
  tenantContextMiddlewareEntry,

  // Pre-validation
  originCheckMiddleware,
  rateLimitMiddleware,

  // Validation
  authenticationMiddlewareEntry,
  csrfProtectionMiddleware,

  // Pre-transform
  breakGlassAuditMiddlewareEntry,
  sanitizeInputMiddleware
];
