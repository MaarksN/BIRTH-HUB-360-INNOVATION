import type { ApiConfig } from "@birthub/config";
import { Router } from "express";

import { requireAuthenticatedSession } from "../../common/guards/index.js";
import { asyncHandler, ProblemDetailsError } from "../../lib/problem-details.js";
import { getBillingSnapshot as defaultGetBillingSnapshot } from "../billing/index.js";

const PROFILE_ROUTES_MOUNT_MARKER = "__birthhubProfileRoutesMounted" as const;

type ProfileRouteMountTarget = {
  use(path: string, router: ReturnType<typeof Router>): unknown;
  [PROFILE_ROUTES_MOUNT_MARKER]?: boolean;
};

type BillingSnapshotDependency = typeof defaultGetBillingSnapshot;

type ProfileRouterDependencies = {
  getBillingSnapshot?: BillingSnapshotDependency;
};

function registerCurrentProfileRoute(
  router: ReturnType<typeof Router>,
  config: ApiConfig,
  dependencies: ProfileRouterDependencies = {}
): void {
  const getBillingSnapshot = dependencies.getBillingSnapshot ?? defaultGetBillingSnapshot;

  router.get(
    "/me",
    requireAuthenticatedSession,
    asyncHandler(async (request, response) => {
      if (!request.context.organizationId || !request.context.tenantId) {
        throw new ProblemDetailsError({
          detail: "Tenant context is required to resolve profile.",
          status: 401,
          title: "Unauthorized"
        });
      }

      const billing = await getBillingSnapshot(
        request.context.organizationId,
        config.BILLING_GRACE_PERIOD_DAYS
      );

      response.status(200).json({
        plan: {
          code: billing.plan.code,
          creditBalanceCents: billing.creditBalanceCents,
          currentPeriodEnd: billing.currentPeriodEnd,
          hardLocked: billing.hardLocked,
          isPaid: billing.isPaid,
          isWithinGracePeriod: billing.isWithinGracePeriod,
          name: billing.plan.name,
          secondsUntilHardLock: billing.secondsUntilHardLock,
          status: billing.status
        },
        plan_status: {
          code: billing.plan.code,
          hardLocked: billing.hardLocked,
          isWithinGracePeriod: billing.isWithinGracePeriod,
          status: billing.status
        },
        requestId: request.context.requestId,
        user: {
          id: request.context.userId,
          organizationId: request.context.organizationId,
          role: request.context.role,
          tenantId: request.context.tenantId
        }
      });
    })
  );
}

export function registerProfileRoutes(
  router: ReturnType<typeof Router>,
  config: ApiConfig,
  dependencies: ProfileRouterDependencies = {}
): void {
  registerCurrentProfileRoute(router, config, dependencies);
}

export function createProfileRouter(
  config: ApiConfig,
  dependencies: ProfileRouterDependencies = {}
): ReturnType<typeof Router> {
  const router = Router();
  registerProfileRoutes(router, config, dependencies);
  return router;
}

export function mountProfileRoutes(
  target: ProfileRouteMountTarget,
  config: ApiConfig,
  dependencies: ProfileRouterDependencies & {
    createProfileRouter?: typeof createProfileRouter;
  } = {}
): void {
  if (target[PROFILE_ROUTES_MOUNT_MARKER]) {
    return;
  }

  target[PROFILE_ROUTES_MOUNT_MARKER] = true;

  const createRouter = dependencies.createProfileRouter ?? createProfileRouter;
  const routerDependencies =
    dependencies.getBillingSnapshot === undefined
      ? {}
      : {
          getBillingSnapshot: dependencies.getBillingSnapshot
        };

  target.use("/api/v1", createRouter(config, routerDependencies));
}
