import assert from "node:assert/strict";
import test from "node:test";

import express from "express";

import { registerAuthAndCoreRoutes } from "../src/app/auth-and-core-routes.js";
import { mountModuleRouters } from "../src/app/module-routes.js";
import { mountProfileRoutes } from "../src/modules/profile/router.js";
import { mountTasksRoutes } from "../src/modules/tasks/router.js";
import { createTestApiConfig } from "./test-config.js";

void test("registerAuthAndCoreRoutes delegates auth and core route registration with shared dependencies", () => {
  const app = express();
  const config = createTestApiConfig();
  const calls: string[] = [];
  const dependency = async () => Promise.resolve({ jobId: "job_1" });

  registerAuthAndCoreRoutes(app, config, {
    enqueueTask: dependency,
    registerAuthRoutes: (receivedApp, receivedConfig) => {
      assert.equal(receivedApp, app);
      assert.equal(receivedConfig, config);
      calls.push("auth");
    },
    registerCoreBusinessRoutes: (receivedApp, receivedConfig, receivedDependencies) => {
      assert.equal(receivedApp, app);
      assert.equal(receivedConfig, config);
      assert.ok(receivedDependencies);
      assert.equal(receivedDependencies.enqueueTask, dependency);
      calls.push("core");
    }
  });

  assert.deepEqual(calls, ["auth", "core"]);
});

void test("registerAuthAndCoreRoutes stays compatible without double-mounting auth endpoints", () => {
  const config = createTestApiConfig();
  const calls: Array<unknown[]> = [];
  const app = {
    use: (...args: unknown[]) => {
      calls.push(args);
    }
  };

  registerAuthAndCoreRoutes(app as never, config, {
    registerCoreBusinessRoutes: () => {}
  });

  mountModuleRouters(app as never, config, {
    createAdminRouter: () => ({ id: "admin" }) as never,
    createAnalyticsRouter: () => ({ id: "analytics" }) as never,
    createApiKeysRouter: () => ({ id: "apikeys" }) as never,
    createAuthRouter: () => ({ id: "auth" }) as never,
    createBillingRouter: () => ({ id: "billing" }) as never,
    createBreakGlassRouter: () => ({ id: "break-glass" }) as never,
    createBudgetRouter: () => ({ id: "budget" }) as never,
    createConnectorsRouter: () => ({ id: "connectors" }) as never,
    createConversationsRouter: () => ({ id: "conversations" }) as never,
    createDashboardRouter: () => ({ id: "dashboard" }) as never,
    createFeedbackRouter: () => ({ id: "feedback" }) as never,
    createInstalledAgentsRouter: () => ({ id: "installed-agents" }) as never,
    createInvitesRouter: () => ({ id: "invites" }) as never,
    createMarketplaceRouter: () => ({ id: "marketplace" }) as never,
    createNotificationsRouter: () => ({ id: "notifications" }) as never,
    createOrganizationsRouter: () => ({ id: "organizations" }) as never,
    createOutputRouter: () => ({ id: "outputs" }) as never,
    createPackInstallerRouter: () => ({ id: "packs" }) as never,
    createPrivacyRouter: () => ({ id: "privacy" }) as never,
    createProfileRouter: () => ({ id: "profile" }) as never,
    createSearchRouter: () => ({ id: "search" }) as never,
    createSessionsRouter: () => ({ id: "sessions" }) as never,
    createTasksRouter: () => ({ id: "tasks" }) as never,
    createUsersRouter: () => ({ id: "users" }) as never,
    createWebhooksRouter: () => ({ id: "webhooks" }) as never,
    createWorkflowsRouter: () => ({ id: "workflows" }) as never
  });

  const authMounts = calls.filter(
    (entry): entry is [string, unknown] => entry[0] === "/api/v1/auth"
  );

  assert.equal(authMounts.length, 1);
});

void test("registerAuthAndCoreRoutes stays compatible without double-mounting profile endpoints", () => {
  const config = createTestApiConfig();
  const calls: Array<unknown[]> = [];
  const app = {
    use: (...args: unknown[]) => {
      calls.push(args);
    }
  };
  const profileRouter = { id: "profile" };

  registerAuthAndCoreRoutes(app as never, config, {
    registerCoreBusinessRoutes: (receivedApp, receivedConfig) => {
      assert.equal(receivedApp, app);
      assert.equal(receivedConfig, config);

      mountProfileRoutes(app as never, config, {
        createProfileRouter: () => profileRouter as never
      });
    }
  });

  mountModuleRouters(app as never, config, {
    createAdminRouter: () => ({ id: "admin" }) as never,
    createAnalyticsRouter: () => ({ id: "analytics" }) as never,
    createApiKeysRouter: () => ({ id: "apikeys" }) as never,
    createAuthRouter: () => ({ id: "auth" }) as never,
    createBillingRouter: () => ({ id: "billing" }) as never,
    createBreakGlassRouter: () => ({ id: "break-glass" }) as never,
    createBudgetRouter: () => ({ id: "budget" }) as never,
    createConnectorsRouter: () => ({ id: "connectors" }) as never,
    createConversationsRouter: () => ({ id: "conversations" }) as never,
    createDashboardRouter: () => ({ id: "dashboard" }) as never,
    createFeedbackRouter: () => ({ id: "feedback" }) as never,
    createInstalledAgentsRouter: () => ({ id: "installed-agents" }) as never,
    createInvitesRouter: () => ({ id: "invites" }) as never,
    createMarketplaceRouter: () => ({ id: "marketplace" }) as never,
    createNotificationsRouter: () => ({ id: "notifications" }) as never,
    createOrganizationsRouter: () => ({ id: "organizations" }) as never,
    createOutputRouter: () => ({ id: "outputs" }) as never,
    createPackInstallerRouter: () => ({ id: "packs" }) as never,
    createPrivacyRouter: () => ({ id: "privacy" }) as never,
    createProfileRouter: () => profileRouter as never,
    createSearchRouter: () => ({ id: "search" }) as never,
    createSessionsRouter: () => ({ id: "sessions" }) as never,
    createTasksRouter: () => ({ id: "tasks" }) as never,
    createUsersRouter: () => ({ id: "users" }) as never,
    createWebhooksRouter: () => ({ id: "webhooks" }) as never,
    createWorkflowsRouter: () => ({ id: "workflows" }) as never
  });

  const profileMounts = calls.filter(
    (entry): entry is [string, unknown] => entry[0] === "/api/v1" && entry[1] === profileRouter
  );

  assert.equal(profileMounts.length, 1);
});

void test("registerAuthAndCoreRoutes stays compatible without double-mounting task endpoints", () => {
  const config = createTestApiConfig();
  const calls: Array<unknown[]> = [];
  const app = {
    use: (...args: unknown[]) => {
      calls.push(args);
    }
  };
  const tasksRouter = { id: "tasks" };

  registerAuthAndCoreRoutes(app as never, config, {
    registerCoreBusinessRoutes: (receivedApp, receivedConfig, receivedDependencies) => {
      assert.equal(receivedApp, app);
      assert.equal(receivedConfig, config);

      mountTasksRoutes(app as never, config, {
        createTasksRouter: () => tasksRouter as never,
        ...(receivedDependencies?.enqueueTask === undefined
          ? {}
          : { enqueueTask: receivedDependencies.enqueueTask })
      });
    }
  });

  mountModuleRouters(app as never, config, {
    createAdminRouter: () => ({ id: "admin" }) as never,
    createAnalyticsRouter: () => ({ id: "analytics" }) as never,
    createApiKeysRouter: () => ({ id: "apikeys" }) as never,
    createAuthRouter: () => ({ id: "auth" }) as never,
    createBillingRouter: () => ({ id: "billing" }) as never,
    createBreakGlassRouter: () => ({ id: "break-glass" }) as never,
    createBudgetRouter: () => ({ id: "budget" }) as never,
    createConnectorsRouter: () => ({ id: "connectors" }) as never,
    createConversationsRouter: () => ({ id: "conversations" }) as never,
    createDashboardRouter: () => ({ id: "dashboard" }) as never,
    createFeedbackRouter: () => ({ id: "feedback" }) as never,
    createInstalledAgentsRouter: () => ({ id: "installed-agents" }) as never,
    createInvitesRouter: () => ({ id: "invites" }) as never,
    createMarketplaceRouter: () => ({ id: "marketplace" }) as never,
    createNotificationsRouter: () => ({ id: "notifications" }) as never,
    createOrganizationsRouter: () => ({ id: "organizations" }) as never,
    createOutputRouter: () => ({ id: "outputs" }) as never,
    createPackInstallerRouter: () => ({ id: "packs" }) as never,
    createPrivacyRouter: () => ({ id: "privacy" }) as never,
    createProfileRouter: () => ({ id: "profile" }) as never,
    createSearchRouter: () => ({ id: "search" }) as never,
    createSessionsRouter: () => ({ id: "sessions" }) as never,
    createTasksRouter: () => tasksRouter as never,
    createUsersRouter: () => ({ id: "users" }) as never,
    createWebhooksRouter: () => ({ id: "webhooks" }) as never,
    createWorkflowsRouter: () => ({ id: "workflows" }) as never
  });

  const tasksMounts = calls.filter(
    (entry): entry is [string, unknown] => entry[0] === "/api/v1" && entry[1] === tasksRouter
  );

  assert.equal(tasksMounts.length, 1);
});
