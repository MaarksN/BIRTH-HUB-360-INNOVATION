import type { ApiConfig } from "@birthub/config";
import type { Express } from "express";

import { createAdminRouter } from "../modules/admin/router.js";
import { createInstalledAgentsRouter } from "../modules/agents/router.js";
import { createAnalyticsRouter } from "../modules/analytics/router.js";
import { createApiKeysRouter } from "../modules/apikeys/router.js";
import { createAuthRouter, mountAuthRoutes } from "../modules/auth/router.js";
import { createBillingRouter } from "../modules/billing/index.js";
import { createBreakGlassRouter } from "../modules/break-glass/router.js";
import { createBudgetRouter } from "../modules/budget/budget-routes.js";
import { createConnectorsRouter } from "../modules/connectors/index.js";
import { createConversationsRouter } from "../modules/conversations/index.js";
import { createDashboardRouter } from "../modules/dashboard/router.js";
import { createFeedbackRouter } from "../modules/feedback/index.js";
import { createInvitesRouter } from "../modules/invites/router.js";
import { createMarketplaceRouter } from "../modules/marketplace/marketplace-routes.js";
import { createNotificationsRouter } from "../modules/notifications/index.js";
import { createOrganizationsRouter } from "../modules/organizations/router.js";
import { createOutputRouter } from "../modules/outputs/output-routes.js";
import { createPackInstallerRouter } from "../modules/packs/pack-installer-routes.js";
import { createPrivacyRouter } from "../modules/privacy/router.js";
import { createProfileRouter, mountProfileRoutes } from "../modules/profile/router.js";
import { createSearchRouter } from "../modules/search/index.js";
import { createSessionsRouter } from "../modules/sessions/router.js";
import { createTasksRouter, mountTasksRoutes } from "../modules/tasks/router.js";
import { createUsersRouter } from "../modules/users/router.js";
import { createWebhooksRouter } from "../modules/webhooks/index.js";
import { createWorkflowsRouter } from "../modules/workflows/index.js";

type ModuleRouterDependencies = {
  createAdminRouter: typeof createAdminRouter;
  createAnalyticsRouter: typeof createAnalyticsRouter;
  createApiKeysRouter: typeof createApiKeysRouter;
  createAuthRouter: typeof createAuthRouter;
  createBillingRouter: typeof createBillingRouter;
  createBreakGlassRouter: typeof createBreakGlassRouter;
  createBudgetRouter: typeof createBudgetRouter;
  createConnectorsRouter: typeof createConnectorsRouter;
  createConversationsRouter: typeof createConversationsRouter;
  createDashboardRouter: typeof createDashboardRouter;
  createFeedbackRouter: typeof createFeedbackRouter;
  createInstalledAgentsRouter: typeof createInstalledAgentsRouter;
  createInvitesRouter: typeof createInvitesRouter;
  createMarketplaceRouter: typeof createMarketplaceRouter;
  createNotificationsRouter: typeof createNotificationsRouter;
  createOrganizationsRouter: typeof createOrganizationsRouter;
  createOutputRouter: typeof createOutputRouter;
  createPackInstallerRouter: typeof createPackInstallerRouter;
  createPrivacyRouter: typeof createPrivacyRouter;
  createProfileRouter: typeof createProfileRouter;
  createSearchRouter: typeof createSearchRouter;
  createSessionsRouter: typeof createSessionsRouter;
  createTasksRouter: typeof createTasksRouter;
  createUsersRouter: typeof createUsersRouter;
  createWebhooksRouter: typeof createWebhooksRouter;
  createWorkflowsRouter: typeof createWorkflowsRouter;
};

const defaultDependencies: ModuleRouterDependencies = {
  createAdminRouter,
  createAnalyticsRouter,
  createApiKeysRouter,
  createAuthRouter,
  createBillingRouter,
  createBreakGlassRouter,
  createBudgetRouter,
  createConnectorsRouter,
  createConversationsRouter,
  createDashboardRouter,
  createFeedbackRouter,
  createInstalledAgentsRouter,
  createInvitesRouter,
  createMarketplaceRouter,
  createNotificationsRouter,
  createOrganizationsRouter,
  createOutputRouter,
  createPackInstallerRouter,
  createPrivacyRouter,
  createProfileRouter,
  createSearchRouter,
  createSessionsRouter,
  createTasksRouter,
  createUsersRouter,
  createWebhooksRouter,
  createWorkflowsRouter
};

export function mountModuleRouters(
  app: Express,
  config: ApiConfig,
  dependencies: Partial<ModuleRouterDependencies> = {}
): void {
  const resolvedDependencies: ModuleRouterDependencies = {
    ...defaultDependencies,
    ...dependencies
  };
  const marketplaceRouter = resolvedDependencies.createMarketplaceRouter();
  const installedAgentsRouter = resolvedDependencies.createInstalledAgentsRouter();

  app.use(resolvedDependencies.createAdminRouter(config));
  mountAuthRoutes(app, config, {
    createAuthRouter: resolvedDependencies.createAuthRouter
  });
  app.use("/api/v1", resolvedDependencies.createSessionsRouter(config));
  mountProfileRoutes(app, config, {
    createProfileRouter: resolvedDependencies.createProfileRouter
  });
  mountTasksRoutes(app, config, {
    createTasksRouter: resolvedDependencies.createTasksRouter
  });
  app.use("/api/v1/apikeys", resolvedDependencies.createApiKeysRouter(config));
  app.use("/api/v1", resolvedDependencies.createBreakGlassRouter(config));
  app.use("/api/v1/agents", installedAgentsRouter);
  app.use("/api/v1/agents", marketplaceRouter);
  app.use("/api/v1/analytics", resolvedDependencies.createAnalyticsRouter());
  app.use(resolvedDependencies.createDashboardRouter(config));
  app.use("/api/v1/connectors", resolvedDependencies.createConnectorsRouter(config));
  app.use("/api/v1", resolvedDependencies.createConversationsRouter());
  app.use("/api/v1/marketplace", marketplaceRouter);
  app.use("/api/v1/billing", resolvedDependencies.createBillingRouter(config));
  app.use("/api/v1/budgets", resolvedDependencies.createBudgetRouter());
  app.use("/api/v1", resolvedDependencies.createFeedbackRouter());
  app.use("/api/v1", resolvedDependencies.createInvitesRouter());
  app.use("/api/v1", resolvedDependencies.createNotificationsRouter());
  app.use("/api/v1", resolvedDependencies.createOrganizationsRouter());
  app.use("/api/v1/packs", resolvedDependencies.createPackInstallerRouter());
  app.use("/api/v1/outputs", resolvedDependencies.createOutputRouter());
  app.use("/api/v1/privacy", resolvedDependencies.createPrivacyRouter(config));
  app.use("/api/v1", resolvedDependencies.createSearchRouter());
  app.use("/api/v1", resolvedDependencies.createUsersRouter());
  app.use(resolvedDependencies.createWorkflowsRouter(config));
  app.use(resolvedDependencies.createWebhooksRouter(config));
}
