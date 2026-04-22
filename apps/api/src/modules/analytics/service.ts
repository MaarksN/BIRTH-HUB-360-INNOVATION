export * from "./reporting.service.js";
export * from "./usage.service.js";

import { analyticsDashboardService } from "./dashboard.service.js";
import {
  exportBillingCsv,
  getCsRiskAccounts,
  getExecutiveMetrics,
  getGlobalAgentPerformance,
  getQualityReport,
  getCohortMetrics
} from "./reporting.service.js";
import {
  getActiveTenantsMetrics,
  getUsageMetrics
} from "./usage.service.js";

export const analyticsRouterService = {
  ...analyticsDashboardService,
  exportBillingCsv,
  getActiveTenantsMetrics,
  getCohortMetrics,
  getCsRiskAccounts,
  getExecutiveMetrics,
  getGlobalAgentPerformance,
  getQualityReport,
  getUsageMetrics
} as const;

