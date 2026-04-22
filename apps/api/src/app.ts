import type { Server } from "node:http";

import type { ApiConfig } from "@birthub/config";
import { getApiConfig } from "@birthub/config";
import { createLogger } from "@birthub/logger";
import express from "express";
import type { Express } from "express";

import {
  createDeepHealthService,
  createHealthService,
  createReadinessHealthService
} from "./lib/health.js";
import { enqueueTask } from "./lib/queue.js";
import {
  configureAppInfrastructure,
  registerGlobalErrorHandling,
  registerOperationalRoutes
} from "./app/core.js";
import { mountModuleRouters } from "./app/module-routes.js";
import { createTasksRouter } from "./modules/tasks/router.js";
import {
  initializeOpenTelemetry as defaultInitializeOpenTelemetry,
  shutdownOpenTelemetry as defaultShutdownOpenTelemetry
} from "./observability/otel.js";
import { initializeApiSentry as defaultInitializeApiSentry } from "./observability/sentry.js";

export interface AppDependencies {
  config?: ApiConfig;
  deepHealthService?: ReturnType<typeof createDeepHealthService>;
  enqueueTask?: typeof enqueueTask;
  healthService?: ReturnType<typeof createHealthService>;
  readinessService?: ReturnType<typeof createReadinessHealthService>;
  shouldExposeDocs?: boolean;
}

export interface StartApiServerDependencies extends AppDependencies {
  createApp?: typeof createApp;
  initializeApiSentry?: typeof defaultInitializeApiSentry;
  initializeOpenTelemetry?: typeof defaultInitializeOpenTelemetry;
  logger?: ReturnType<typeof createLogger>;
  shutdownOpenTelemetry?: typeof defaultShutdownOpenTelemetry;
}

export interface StartedApiServer {
  app: Express;
  config: ApiConfig;
  server: Server;
  shutdown: (signal: string) => Promise<void>;
}

interface ResolvedAppDependencies extends AppDependencies {
  config: ApiConfig;
  shouldExposeDocs: boolean;
}

function resolveAppDependencies(dependencies: AppDependencies = {}): ResolvedAppDependencies {
  const config = dependencies.config ?? getApiConfig();

  return {
    ...dependencies,
    config,
    shouldExposeDocs: dependencies.shouldExposeDocs ?? config.NODE_ENV !== "production"
  };
}

function composeApp(dependencies: ResolvedAppDependencies): Express {
  const { config, shouldExposeDocs } = dependencies;
  const enqueueTaskOverride = dependencies.enqueueTask;
  const app = express();

  configureAppInfrastructure(app, config);
  registerOperationalRoutes(app, config, {
    ...(dependencies.deepHealthService ? { deepHealthService: dependencies.deepHealthService } : {}),
    ...(dependencies.healthService ? { healthService: dependencies.healthService } : {}),
    ...(dependencies.readinessService ? { readinessService: dependencies.readinessService } : {}),
    shouldExposeDocs
  });
  mountModuleRouters(
    app,
    config,
    enqueueTaskOverride === undefined
      ? {}
      : {
          createTasksRouter: (resolvedConfig) =>
            createTasksRouter(resolvedConfig, {
              enqueueTask: enqueueTaskOverride
            })
        }
  );

  registerGlobalErrorHandling(app);

  return app;
}

export function createApp(dependencies: AppDependencies = {}): Express {
  return composeApp(resolveAppDependencies(dependencies));
}

export function startApiServer(
  dependencies: StartApiServerDependencies = {}
): StartedApiServer {
  const config = dependencies.config ?? getApiConfig();
  const logger = dependencies.logger ?? createLogger("api-bootstrap");
  const initializeApiSentry = dependencies.initializeApiSentry ?? defaultInitializeApiSentry;
  const initializeOpenTelemetry =
    dependencies.initializeOpenTelemetry ?? defaultInitializeOpenTelemetry;
  const shutdownOpenTelemetry =
    dependencies.shutdownOpenTelemetry ?? defaultShutdownOpenTelemetry;
  const appFactory = dependencies.createApp ?? createApp;

  initializeApiSentry(config);
  initializeOpenTelemetry(config);

  const app = appFactory(resolveAppDependencies({
    ...dependencies,
    config
  }));
  const server = app.listen(config.API_PORT, () => {
    logger.info({ port: config.API_PORT }, "BirthHub360 API listening");
  });

  let shutdownPromise: Promise<void> | undefined;

  async function shutdown(signal: string): Promise<void> {
    if (shutdownPromise) {
      await shutdownPromise;
      return;
    }

    shutdownPromise = (async () => {
      logger.info({ signal }, "Shutting down API");
      server.close();
      await shutdownOpenTelemetry();
    })();

    await shutdownPromise;
  }

  process.on("SIGINT", () => {
    void shutdown("SIGINT");
  });

  process.on("SIGTERM", () => {
    void shutdown("SIGTERM");
  });

  return {
    app,
    config,
    server,
    shutdown
  };
}
