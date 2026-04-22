import type { ApiConfig } from "@birthub/config";
import { createLogger } from "@birthub/logger";
import type { Express } from "express";

import { registerAuthRoutes as defaultRegisterAuthRoutes } from "./auth-routes.js";
import { enqueueTask } from "../lib/queue.js";
import {
  registerOrganizationCreationRoutes as defaultRegisterOrganizationCreationRoutes
} from "../modules/organizations/router.js";
import { mountProfileRoutes as defaultMountProfileRoutes } from "../modules/profile/router.js";
import { mountTasksRoutes as defaultMountTasksRoutes } from "../modules/tasks/router.js";

const logger = createLogger("api");

type RegisterAuthRoutes = typeof defaultRegisterAuthRoutes;
type EnqueueTaskDependency = typeof enqueueTask;

type RegisterCompatCoreRoutes = (
  app: Express,
  config: ApiConfig,
  dependencies?: {
    enqueueTask?: EnqueueTaskDependency;
  }
) => void;

function registerCompatCoreRoutes(
  app: Express,
  config: ApiConfig,
  dependencies: {
    enqueueTask?: EnqueueTaskDependency;
  } = {}
): void {
  defaultRegisterOrganizationCreationRoutes(app, {
    logger,
    onCreated: (request, organization) => {
      request.context.organizationId = organization.organizationId;
      request.context.tenantId = organization.tenantId ?? null;
      request.context.userId = organization.ownerUserId;
    },
    paths: ["/api/v1/organizations"]
  });

  defaultMountProfileRoutes(app, config);
  defaultMountTasksRoutes(app, config, {
    ...(dependencies.enqueueTask === undefined
      ? {}
      : {
          enqueueTask: dependencies.enqueueTask
        })
  });
}

export function registerAuthAndCoreRoutes(
  app: Express,
  config: ApiConfig,
  dependencies: {
    enqueueTask?: EnqueueTaskDependency;
    registerAuthRoutes?: RegisterAuthRoutes;
    registerCoreBusinessRoutes?: RegisterCompatCoreRoutes;
  } = {}
): void {
  const registerAuthRoutes = dependencies.registerAuthRoutes ?? defaultRegisterAuthRoutes;
  const registerCoreBusinessRoutes =
    dependencies.registerCoreBusinessRoutes ?? registerCompatCoreRoutes;
  const coreDependencies =
    dependencies.enqueueTask === undefined
      ? {}
      : {
          enqueueTask: dependencies.enqueueTask
        };

  registerAuthRoutes(app, config);
  registerCoreBusinessRoutes(app, config, coreDependencies);
}
