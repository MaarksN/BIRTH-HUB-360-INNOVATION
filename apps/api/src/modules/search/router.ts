import { Router } from "express";

import { requireAuthenticatedSession } from "../../common/guards/index.js";
import { asyncHandler, ProblemDetailsError } from "../../lib/problem-details.js";
import { searchQuerySchema } from "./schemas.js";
import { searchWorkspace } from "./service.js";

function requireIdentity(input: {
  organizationId: string | null;
  tenantId: string | null;
  userId: string | null;
}) {
  if (!input.organizationId || !input.tenantId || !input.userId) {
    throw new ProblemDetailsError({
      detail: "Authenticated tenant, organization and user context are required.",
      status: 401,
      title: "Unauthorized"
    });
  }

  return {
    organizationId: input.organizationId,
    tenantId: input.tenantId,
    userId: input.userId
  };
}

export function createSearchRouter(): Router {
  const router = Router();

  router.get(
    "/search",
    requireAuthenticatedSession,
    asyncHandler(async (request, response) => {
      const identity = requireIdentity({
        organizationId: request.context.organizationId,
        tenantId: request.context.tenantId,
        userId: request.context.userId
      });
      const query = searchQuerySchema.parse(request.query);
      const groups = await searchWorkspace({
        ...identity,
        query: query.q
      });

      response.status(200).json({
        groups,
        query: query.q,
        requestId: request.context.requestId
      });
    })
  );

  return router;
}

