import type { JobsOptions } from "bullmq";
export interface QueueDefinition {
    attempts: number;
    backoff?: JobsOptions["backoff"];
    cron?: string;
    priority?: number;
    removeOnComplete?: JobsOptions["removeOnComplete"];
    removeOnFail?: JobsOptions["removeOnFail"];
}
export declare const DEFAULT_REMOVE_ON_COMPLETE: {
    readonly count: 100;
};
export declare const DEFAULT_REMOVE_ON_FAIL: {
    readonly count: 500;
};
export declare const AGENT_QUEUE_NAMES: {
    readonly high: "agent-high";
    readonly low: "agent-low";
    readonly normal: "agent-normal";
};
export type AgentQueuePriority = keyof typeof AGENT_QUEUE_NAMES;
export declare const WORKFLOW_QUEUE_NAMES: {
    readonly execution: "workflow-execution";
    readonly trigger: "workflow-trigger";
};
export declare const ENGAGEMENT_QUEUE_NAMES: {
    readonly crmSync: "engagement.crm-sync";
    readonly email: "engagement.email";
    readonly outboundWebhook: "engagement.outbound-webhook";
};
export declare const SYSTEM_QUEUE_NAMES: {
    readonly auditFlush: "system.audit-flush";
    readonly billingExport: "system.billing-export";
    readonly failRateAlerts: "system.fail-rate-alerts";
    readonly healthScore: "system.health-score";
    readonly inviteCleanup: "system.invite-cleanup";
    readonly queueMetrics: "system.queue-metrics";
    readonly quotaReset: "system.quota-reset";
    readonly suspendedUserCleanup: "system.suspended-user-cleanup";
    readonly sunsetPolicy: "system.sunset-policy";
    readonly webhookLogPrune: "system.webhook-log-prune";
};
export declare function getAgentQueueName(priority: AgentQueuePriority): string;
export declare const QUEUE_CONFIG: Record<string, QueueDefinition>;
