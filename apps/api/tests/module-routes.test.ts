import assert from "node:assert/strict";
import test from "node:test";

import { mountModuleRouters } from "../src/app/module-routes.js";
import { createTestApiConfig } from "./test-config.js";

void test("mountModuleRouters wires module routers in the expected order and reuses shared router instances", () => {
  const config = createTestApiConfig();
  const calls: Array<unknown[]> = [];
  const app = {
    use: (...args: unknown[]) => {
      calls.push(args);
    }
  };

  const adminRouter = { id: "admin" };
  const authRouter = { id: "auth" };
  const sessionsRouter = { id: "sessions" };
  const profileRouter = { id: "profile" };
  const tasksRouter = { id: "tasks" };
  const apiKeysRouter = { id: "apikeys" };
  const breakGlassRouter = { id: "break-glass" };
  const installedAgentsRouter = { id: "installed-agents" };
  const marketplaceRouter = { id: "marketplace" };
  const analyticsRouter = { id: "analytics" };
  const dashboardRouter = { id: "dashboard" };
  const connectorsRouter = { id: "connectors" };
  const conversationsRouter = { id: "conversations" };
  const billingRouter = { id: "billing" };
  const budgetRouter = { id: "budget" };
  const feedbackRouter = { id: "feedback" };
  const invitesRouter = { id: "invites" };
  const notificationsRouter = { id: "notifications" };
  const organizationsRouter = { id: "organizations" };
  const packInstallerRouter = { id: "packs" };
  const outputsRouter = { id: "outputs" };
  const privacyRouter = { id: "privacy" };
  const searchRouter = { id: "search" };
  const usersRouter = { id: "users" };
  const workflowsRouter = { id: "workflows" };
  const webhooksRouter = { id: "webhooks" };

  mountModuleRouters(app as never, config, {
    createAdminRouter: (receivedConfig) => {
      assert.equal(receivedConfig, config);
      return adminRouter as never;
    },
    createAnalyticsRouter: () => analyticsRouter as never,
    createApiKeysRouter: (receivedConfig) => {
      assert.equal(receivedConfig, config);
      return apiKeysRouter as never;
    },
    createAuthRouter: (receivedConfig) => {
      assert.equal(receivedConfig, config);
      return authRouter as never;
    },
    createBillingRouter: (receivedConfig) => {
      assert.equal(receivedConfig, config);
      return billingRouter as never;
    },
    createBreakGlassRouter: (receivedConfig) => {
      assert.equal(receivedConfig, config);
      return breakGlassRouter as never;
    },
    createBudgetRouter: () => budgetRouter as never,
    createConnectorsRouter: (receivedConfig) => {
      assert.equal(receivedConfig, config);
      return connectorsRouter as never;
    },
    createConversationsRouter: () => conversationsRouter as never,
    createDashboardRouter: (receivedConfig) => {
      assert.equal(receivedConfig, config);
      return dashboardRouter as never;
    },
    createFeedbackRouter: () => feedbackRouter as never,
    createInstalledAgentsRouter: () => installedAgentsRouter as never,
    createInvitesRouter: () => invitesRouter as never,
    createMarketplaceRouter: () => marketplaceRouter as never,
    createNotificationsRouter: () => notificationsRouter as never,
    createOrganizationsRouter: () => organizationsRouter as never,
    createOutputRouter: () => outputsRouter as never,
    createPackInstallerRouter: () => packInstallerRouter as never,
    createPrivacyRouter: (receivedConfig) => {
      assert.equal(receivedConfig, config);
      return privacyRouter as never;
    },
    createProfileRouter: (receivedConfig) => {
      assert.equal(receivedConfig, config);
      return profileRouter as never;
    },
    createSessionsRouter: (receivedConfig) => {
      assert.equal(receivedConfig, config);
      return sessionsRouter as never;
    },
    createTasksRouter: (receivedConfig) => {
      assert.equal(receivedConfig, config);
      return tasksRouter as never;
    },
    createSearchRouter: () => searchRouter as never,
    createUsersRouter: () => usersRouter as never,
    createWebhooksRouter: (receivedConfig) => {
      assert.equal(receivedConfig, config);
      return webhooksRouter as never;
    },
    createWorkflowsRouter: (receivedConfig) => {
      assert.equal(receivedConfig, config);
      return workflowsRouter as never;
    }
  });

  assert.deepEqual(calls, [
    [adminRouter],
    ["/api/v1/auth", authRouter],
    ["/api/v1", sessionsRouter],
    ["/api/v1", profileRouter],
    ["/api/v1", tasksRouter],
    ["/api/v1/apikeys", apiKeysRouter],
    ["/api/v1", breakGlassRouter],
    ["/api/v1/agents", installedAgentsRouter],
    ["/api/v1/agents", marketplaceRouter],
    ["/api/v1/analytics", analyticsRouter],
    [dashboardRouter],
    ["/api/v1/connectors", connectorsRouter],
    ["/api/v1", conversationsRouter],
    ["/api/v1/marketplace", marketplaceRouter],
    ["/api/v1/billing", billingRouter],
    ["/api/v1/budgets", budgetRouter],
    ["/api/v1", feedbackRouter],
    ["/api/v1", invitesRouter],
    ["/api/v1", notificationsRouter],
    ["/api/v1", organizationsRouter],
    ["/api/v1/packs", packInstallerRouter],
    ["/api/v1/outputs", outputsRouter],
    ["/api/v1/privacy", privacyRouter],
    ["/api/v1", searchRouter],
    ["/api/v1", usersRouter],
    [workflowsRouter],
    [webhooksRouter]
  ]);
});
