import type { JobsOptions } from "bullmq";

import { QueueName } from "@birthub/shared-types";

export interface QueueDefinition {
  attempts: number;
  backoff?: JobsOptions["backoff"];
  cron?: string;
  priority?: number;
  removeOnComplete?: JobsOptions["removeOnComplete"];
  removeOnFail?: JobsOptions["removeOnFail"];
}

export const DEFAULT_REMOVE_ON_COMPLETE = { count: 100 } as const;
export const DEFAULT_REMOVE_ON_FAIL = { count: 500 } as const;

export const AGENT_QUEUE_NAMES = {
  high: "agent-high",
  low: "agent-low",
  normal: "agent-normal"
} as const;

export type AgentQueuePriority = keyof typeof AGENT_QUEUE_NAMES;

export const WORKFLOW_QUEUE_NAMES = {
  execution: "workflow-execution",
  trigger: "workflow-trigger"
} as const;

export const ENGAGEMENT_QUEUE_NAMES = {
  crmSync: "engagement.crm-sync",
  email: "engagement.email",
  outboundWebhook: "engagement.outbound-webhook"
} as const;

export const SYSTEM_QUEUE_NAMES = {
  auditFlush: "system.audit-flush",
  billingExport: "system.billing-export",
  failRateAlerts: "system.fail-rate-alerts",
  healthScore: "system.health-score",
  inviteCleanup: "system.invite-cleanup",
  queueMetrics: "system.queue-metrics",
  quotaReset: "system.quota-reset",
  suspendedUserCleanup: "system.suspended-user-cleanup",
  sunsetPolicy: "system.sunset-policy",
  webhookLogPrune: "system.webhook-log-prune"
} as const;

export function getAgentQueueName(priority: AgentQueuePriority): string {
  return AGENT_QUEUE_NAMES[priority];
}

export const QUEUE_CONFIG: Record<string, QueueDefinition> = {
  // Agent Queues
  [QueueName.SDR_QUEUE]: {
    attempts: 3,
    backoff: { type: "exponential", delay: 1000 },
    priority: 10
  },
  [QueueName.LDR_QUEUE]: {
    attempts: 3,
    backoff: { type: "exponential", delay: 1000 },
    priority: 10
  },
  [QueueName.AE_QUEUE]: {
    attempts: 3,
    backoff: { type: "exponential", delay: 1000 },
    priority: 10
  },
  [QueueName.ANALISTA_QUEUE]: {
    attempts: 3,
    backoff: { type: "exponential", delay: 1000 },
    priority: 10
  },
  [QueueName.FINANCEIRO_QUEUE]: {
    attempts: 3,
    backoff: { type: "exponential", delay: 1000 },
    priority: 10
  },
  [QueueName.JURIDICO_QUEUE]: {
    attempts: 3,
    backoff: { type: "exponential", delay: 1000 },
    priority: 10
  },
  [QueueName.MARKETING_QUEUE]: {
    attempts: 3,
    backoff: { type: "exponential", delay: 1000 },
    priority: 10
  },
  [QueueName.POS_VENDA_QUEUE]: {
    attempts: 3,
    backoff: { type: "exponential", delay: 1000 },
    priority: 10
  },
  [QueueName.BDR_QUEUE]: {
    attempts: 3,
    backoff: { type: "exponential", delay: 1000 },
    priority: 10
  },
  [QueueName.CLOSER_QUEUE]: {
    attempts: 3,
    backoff: { type: "exponential", delay: 1000 },
    priority: 10
  },
  [QueueName.SALES_OPS_QUEUE]: {
    attempts: 3,
    backoff: { type: "exponential", delay: 1000 },
    priority: 10
  },
  [QueueName.ENABLEMENT_QUEUE]: {
    attempts: 3,
    backoff: { type: "exponential", delay: 1000 },
    priority: 10
  },
  [QueueName.KAM_QUEUE]: {
    attempts: 3,
    backoff: { type: "exponential", delay: 1000 },
    priority: 10
  },
  [QueueName.PARTNERS_QUEUE]: {
    attempts: 3,
    backoff: { type: "exponential", delay: 1000 },
    priority: 10
  },
  [QueueName.FIELD_QUEUE]: {
    attempts: 3,
    backoff: { type: "exponential", delay: 1000 },
    priority: 10
  },
  [QueueName.PRE_SALES_QUEUE]: {
    attempts: 3,
    backoff: { type: "exponential", delay: 1000 },
    priority: 10
  },
  [QueueName.COPYWRITER_QUEUE]: {
    attempts: 3,
    backoff: { type: "exponential", delay: 1000 },
    priority: 10
  },
  [QueueName.SOCIAL_QUEUE]: {
    attempts: 3,
    backoff: { type: "exponential", delay: 1000 },
    priority: 10
  },

  // Task Queues
  [QueueName.LEAD_ENRICHMENT]: {
    attempts: 3,
    backoff: { type: "exponential", delay: 1000 },
    priority: 10,
    removeOnFail: { count: 1000 },
    removeOnComplete: { count: 100 }
  },
  [QueueName.DEAL_CLOSED_WON]: {
    attempts: 5,
    backoff: { type: "fixed", delay: 1000 },
    priority: 10,
    removeOnFail: { count: 1000 },
    removeOnComplete: { count: 100 }
  },
  [QueueName.HEALTH_ALERT]: { attempts: 4, backoff: { type: "exponential", delay: 800 }, priority: 9 },
  [QueueName.CHURN_RISK_HIGH]: { attempts: 4, backoff: { type: "exponential", delay: 800 }, priority: 9 },
  [QueueName.HEALTH_SCORE_UPDATE]: { attempts: 3, priority: 8 },
  [QueueName.EMAIL_CADENCE_SEND]: { attempts: 3, priority: 5 },
  [QueueName.INVOICE_GENERATE]: { attempts: 5, priority: 7 },
  [QueueName.NPS_ANALYSIS]: { attempts: 2, priority: 5 },
  [QueueName.CONTRACT_ANALYSIS]: { attempts: 2, priority: 6 },
  [QueueName.BANK_RECONCILIATION]: {
    attempts: 2,
    priority: 2,
    cron: "0 2 * * *"
  },
  [QueueName.COMMISSION_CALC]: { attempts: 3, priority: 3, cron: "0 18 L * *" },
  [QueueName.BOARD_REPORT]: { attempts: 2, priority: 2, cron: "0 8 * * 1" },
  [QueueName.CONTRACT_DEADLINES]: {
    attempts: 2,
    priority: 4,
    cron: "0 8 * * 1"
  },
  [QueueName.DOMAIN_WARMUP]: { attempts: 1, priority: 1, cron: "*/30 * * * *" },

  [AGENT_QUEUE_NAMES.high]: {
    attempts: 5,
    backoff: { type: "exponential", delay: 1000 },
    priority: 1,
    removeOnComplete: { count: 500 },
    removeOnFail: { count: 1000 }
  },
  [AGENT_QUEUE_NAMES.normal]: {
    attempts: 5,
    backoff: { type: "exponential", delay: 1000 },
    priority: 5,
    removeOnComplete: { count: 500 },
    removeOnFail: { count: 1000 }
  },
  [AGENT_QUEUE_NAMES.low]: {
    attempts: 5,
    backoff: { type: "exponential", delay: 1000 },
    priority: 10,
    removeOnComplete: { count: 500 },
    removeOnFail: { count: 1000 }
  },
  [WORKFLOW_QUEUE_NAMES.execution]: {
    attempts: 5,
    backoff: { type: "exponential", delay: 1000 },
    removeOnComplete: { count: 500 },
    removeOnFail: { count: 500 }
  },
  [WORKFLOW_QUEUE_NAMES.trigger]: {
    attempts: 5,
    backoff: { type: "exponential", delay: 1000 },
    removeOnComplete: { count: 500 },
    removeOnFail: { count: 500 }
  },
  [ENGAGEMENT_QUEUE_NAMES.crmSync]: {
    attempts: 5,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 250 }
  },
  [ENGAGEMENT_QUEUE_NAMES.email]: {
    attempts: 3,
    backoff: { type: "exponential", delay: 1000 },
    removeOnComplete: { count: 200 },
    removeOnFail: { count: 200 }
  },
  [ENGAGEMENT_QUEUE_NAMES.outboundWebhook]: {
    attempts: 5,
    backoff: { type: "exponential", delay: 1500 },
    removeOnComplete: { count: 200 },
    removeOnFail: { count: 300 }
  },
  [SYSTEM_QUEUE_NAMES.inviteCleanup]: {
    attempts: 3,
    backoff: { type: "exponential", delay: 1000 },
    removeOnComplete: { count: 200 },
    removeOnFail: { count: 400 }
  },
  [SYSTEM_QUEUE_NAMES.auditFlush]: {
    attempts: 3,
    backoff: { type: "exponential", delay: 500 },
    removeOnComplete: { count: 200 },
    removeOnFail: { count: 400 }
  },
  [SYSTEM_QUEUE_NAMES.quotaReset]: {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 200 }
  },
  [SYSTEM_QUEUE_NAMES.billingExport]: {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 200 }
  },
  [SYSTEM_QUEUE_NAMES.healthScore]: {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 200 }
  },
  [SYSTEM_QUEUE_NAMES.webhookLogPrune]: {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 200 }
  },
  [SYSTEM_QUEUE_NAMES.sunsetPolicy]: {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 200 }
  },
  [SYSTEM_QUEUE_NAMES.suspendedUserCleanup]: {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 200 }
  },
  [SYSTEM_QUEUE_NAMES.failRateAlerts]: {
    attempts: 2,
    backoff: { type: "exponential", delay: 1000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 200 }
  },
  [SYSTEM_QUEUE_NAMES.queueMetrics]: {
    attempts: 2,
    backoff: { type: "exponential", delay: 1000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 200 }
  }
};
