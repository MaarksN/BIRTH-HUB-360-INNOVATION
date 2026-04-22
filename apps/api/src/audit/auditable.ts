import type { NextFunction, Request, Response } from "express";

import { enqueueAuditEvent } from "./buffer.js";
import { toPrismaNestedJsonValue } from "../lib/prisma-json.js";
import { ProblemDetailsError } from "../lib/problem-details.js";
import { readTrimmedString } from "../lib/request-values.js";

function toAuditDiffJsonValue(value: unknown) {
  return toPrismaNestedJsonValue(sanitizeAuditValue(value));
}

type AuditableOptions<TResult> = {
  action: string;
  entityType: string;
  methods?: readonly string[];
  requireActor?: boolean;
  resolveEntityId?: (
    request: Request,
    response: Response,
    result: TResult | void
  ) => string | string[] | undefined;
  resolveTenantId?: (
    request: Request,
    response: Response,
    result: TResult | void
  ) => string | string[] | undefined;
};

type AsyncRouteHandler<TResult> = (
  request: Request,
  response: Response,
  next: NextFunction
) => Promise<TResult | void>;

const REDACTED_AUDIT_VALUE = "[REDACTED]";
const MAX_AUDIT_SANITIZE_DEPTH = 12;
const SENSITIVE_AUDIT_KEY_PATTERN =
  /(?:api[_-]?key|authorization|client[_-]?secret|cookie|credential|password|refresh[_-]?token|secret|session|signature|token|webhook[_-]?secret)/iu;

function shouldRedactAuditKey(key: string): boolean {
  return SENSITIVE_AUDIT_KEY_PATTERN.test(key);
}

export function sanitizeAuditValue(
  value: unknown,
  seen: WeakSet<object> = new WeakSet<object>(),
  depth = 0
): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (depth > MAX_AUDIT_SANITIZE_DEPTH) {
    return "[MAX_DEPTH]";
  }

  if (typeof value !== "object") {
    return value;
  }

  if (seen.has(value)) {
    return "[CIRCULAR]";
  }

  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeAuditValue(item, seen, depth + 1));
  }

  const sanitized: Record<string, unknown> = {};

  for (const [key, entry] of Object.entries(value)) {
    if (entry === undefined) {
      continue;
    }

    sanitized[key] = shouldRedactAuditKey(key)
      ? REDACTED_AUDIT_VALUE
      : sanitizeAuditValue(entry, seen, depth + 1);
  }

  return sanitized;
}

export function Auditable<TResult>(options: AuditableOptions<TResult>) {
  return (handler: AsyncRouteHandler<TResult>): AsyncRouteHandler<TResult> =>
    async (request, response, next) => {
      const result = await handler(request, response, next);
      const auditableMethods = options.methods ?? ["DELETE", "PATCH", "POST", "PUT"];

      if (!auditableMethods.includes(request.method)) {
        return result;
      }

      const tenantId = readTrimmedString(
        options.resolveTenantId?.(request, response, result) ?? request.context.tenantId
      );

      if (!tenantId) {
        return result;
      }

      const actorId = request.context.userId;

      if (options.requireActor && !actorId) {
        throw new ProblemDetailsError({
          detail: "An authenticated actor is required for this mutation.",
          status: 401,
          title: "Unauthorized"
        });
      }

      const entityId =
        readTrimmedString(
          options.resolveEntityId?.(request, response, result) ??
            request.params.id ??
            request.params.memberId
        ) ?? "unknown";

      enqueueAuditEvent({
        action: options.action,
        actorId: actorId ?? null,
        diff: {
          payload: toAuditDiffJsonValue(request.body as unknown),
          response: toAuditDiffJsonValue(result ?? null)
        },
        entityId,
        entityType: options.entityType,
        ip: request.ip || null,
        tenantId,
        userAgent: request.get("user-agent") ?? null
      });

      return result;
    };
}
