import { Role } from "@birthub/database";
import express from "express";
import type { Express } from "express";
import { ZodError } from "zod";

import {
  ProblemDetailsError,
  fromZodError,
  toProblemDetails
} from "../src/lib/problem-details.js";
import type { RequestContext } from "../src/middleware/request-context.js";

export function stubMethod(target: object, key: string, value: unknown): () => void {
  const original: unknown = Reflect.get(target, key) as unknown;
  Reflect.set(target, key, value);
  return () => {
    Reflect.set(target, key, original);
  };
}

export function createAuthenticatedApiTestApp(input: {
  contextOverrides?: Record<string, unknown>;
  mountPath?: string;
  router: unknown;
  useJson?: boolean;
}): Express {
  const app = express();

  if (input.useJson !== false) {
    app.use(express.json());
  }

  app.use((request, _response, next) => {
    const baseContext: RequestContext = {
      apiKeyId: null,
      authType: "session",
      billingPlanStatus: null,
      breakGlassGrantId: null,
      breakGlassReason: null,
      breakGlassTicket: null,
      impersonatedByUserId: null,
      organizationId: "org_1",
      requestId: "req_1",
      role: Role.ADMIN,
      sessionAccessMode: null,
      sessionId: "session_1",
      tenantId: "tenant_1",
      tenantSlug: "tenant-one",
      traceId: "trace_1",
      userId: "user_1"
    };

    request.context = {
      ...baseContext,
      ...(input.contextOverrides ?? {})
    };
    next();
  });

  if (input.mountPath) {
    app.use(input.mountPath, input.router as express.Router);
  } else {
    app.use(input.router as express.Router);
  }

  app.use((error: unknown, request: express.Request, response: express.Response, _next: express.NextFunction) => {
    const problem =
      error instanceof ZodError
        ? fromZodError(error)
        : error instanceof ProblemDetailsError
          ? error
          : new ProblemDetailsError({
              detail: error instanceof Error ? error.message : "Unexpected internal server error.",
              status: 500,
              title: "Internal Server Error"
            });

    response.status(problem.status).json(toProblemDetails(request, problem));
  });

  return app;
}
