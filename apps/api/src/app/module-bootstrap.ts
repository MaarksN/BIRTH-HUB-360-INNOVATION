import type { ApiConfig } from "@birthub/config";
import type { Router } from "express";
import { globalModuleRegistry, mountRegisteredModules, type RegisteredModule } from "./module-registry.js";

// Import all module definitions
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

/**
 * Priority tiers:
 * 0-10: Infrastructure (auth, sessions)
 * 10-50: Core business (users, orgs, profiles)
 * 50-100: Feature modules (agents, workflows, tasks)
 * 100-200: Integrations (webhooks, marketplace)
 * 200+: Admin/debug endpoints
 */

const MODULE_DEFINITIONS: RegisteredModule[] = [
  // Infrastructure layer (0-10)
  {
    name: "auth",
    basePath: "/api/auth",
    priority: 0,
    createRouter: (config) => createAuthRouter(config)
  },
  {
    name: "sessions",
    basePath: "/api/v1",
    priority: 5,
    createRouter: (config) => createSessionsRouter(config)
  },

  // Core business layer (10-50)
  {
    name: "profile",
    basePath: "/api",
    priority: 10,
    createRouter: (config) => createProfileRouter(config)
  },
  {
    name: "users",
    basePath: "/api/v1",
    priority: 12,
    createRouter: () => createUsersRouter()
  },
  {
    name: "organizations",
    basePath: "/api/v1",
    priority: 14,
    createRouter: () => createOrganizationsRouter()
  },
  {
    name: "invites",
    basePath: "/api/v1",
    priority: 16,
    createRouter: () => createInvitesRouter()
  },
  {
    name: "apikeys",
    basePath: "/api/v1/apikeys",
    priority: 18,
    createRouter: (config) => createApiKeysRouter(config)
  },

  // Feature modules (50-100)
  {
    name: "agents",
    basePath: "/api/v1/agents",
    priority: 50,
    createRouter: () => createInstalledAgentsRouter()
  },
  {
    name: "workflows",
    basePath: "/api",
    priority: 52,
    createRouter: (config) => createWorkflowsRouter(config)
  },
  {
    name: "tasks",
    basePath: "/api",
    priority: 54,
    createRouter: (config) => createTasksRouter(config)
  },
  {
    name: "connectors",
    basePath: "/api/v1/connectors",
    priority: 56,
    createRouter: (config) => createConnectorsRouter(config)
  },
  {
    name: "conversations",
    basePath: "/api/v1",
    priority: 58,
    createRouter: () => createConversationsRouter()
  },
  {
    name: "notifications",
    basePath: "/api/v1",
    priority: 60,
    createRouter: () => createNotificationsRouter()
  },
  {
    name: "feedback",
    basePath: "/api/v1",
    priority: 62,
    createRouter: () => createFeedbackRouter()
  },
  {
    name: "search",
    basePath: "/api/v1",
    priority: 64,
    createRouter: () => createSearchRouter()
  },
  {
    name: "analytics",
    basePath: "/api/v1/analytics",
    priority: 66,
    createRouter: () => createAnalyticsRouter()
  },
  {
    name: "dashboard",
    basePath: "/api",
    priority: 68,
    createRouter: (config) => createDashboardRouter(config)
  },
  {
    name: "outputs",
    basePath: "/api/v1/outputs",
    priority: 70,
    createRouter: () => createOutputRouter()
  },
  {
    name: "packs",
    basePath: "/api/v1/packs",
    priority: 72,
    createRouter: () => createPackInstallerRouter()
  },

  // Integration layer (100-200)
  {
    name: "billing",
    basePath: "/api/v1/billing",
    priority: 100,
    createRouter: (config) => createBillingRouter(config)
  },
  {
    name: "budgets",
    basePath: "/api/v1/budgets",
    priority: 102,
    createRouter: () => createBudgetRouter()
  },
  {
    name: "privacy",
    basePath: "/api/v1/privacy",
    priority: 104,
    createRouter: (config) => createPrivacyRouter(config)
  },
  {
    name: "marketplace",
    basePath: "/api/v1/marketplace",
    priority: 106,
    createRouter: () => createMarketplaceRouter()
  },
  {
    name: "webhooks",
    basePath: "/api",
    priority: 108,
    createRouter: (config) => createWebhooksRouter(config)
  },
  {
    name: "break-glass",
    basePath: "/api/v1",
    priority: 110,
    createRouter: (config) => createBreakGlassRouter(config)
  },

  // Admin/debug layer (200+)
  {
    name: "admin",
    basePath: "/api",
    priority: 200,
    createRouter: (config) => createAdminRouter(config)
  }
];

/**
 * Initialize module registry with all modules
 */
export function initializeModuleRegistry(): void {
  for (const module of MODULE_DEFINITIONS) {
    globalModuleRegistry.register(module);
  }
}

/**
 * Mount all registered modules onto Express app
 */
export async function mountAllModules(app: Express, config: ApiConfig): Promise<void> {
  initializeModuleRegistry();
  await mountRegisteredModules(app, config);

  // Mount special routes that need custom handling
  await mountAuthRoutes(app, config, {
    createAuthRouter
  });

  await mountProfileRoutes(app, config, {
    createProfileRouter
  });

  await mountTasksRoutes(app, config, {
    createTasksRouter
  });
}

export function getModuleRegistry() {
  return globalModuleRegistry;
}
