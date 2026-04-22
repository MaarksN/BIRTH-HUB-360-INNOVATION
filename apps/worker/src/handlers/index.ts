import { defineJobHandler, jobHandlerRegistry, type JobHandlerDefinition } from "./job-handler-registry.js";

/**
 * Specialized job handler modules
 * Each module groups related job handlers
 */

// ============ SYSTEM HANDLERS ============
import type { Job } from "bullmq";
import { createLogger } from "@birthub/logger";
import { SYSTEM_QUEUE_NAMES } from "@birthub/queue";

const sysLogger = createLogger("system-handlers");

export const SYSTEM_JOB_HANDLERS: JobHandlerDefinition[] = [
  defineJobHandler({
    name: "fail-rate-alerts",
    queueName: SYSTEM_QUEUE_NAMES.failRateAlerts,
    handler: async (job: Job) => {
      sysLogger.debug({ jobId: job.id }, "Processing fail rate alert");
      // Alert evaluation logic here
      return { processed: true };
    },
    concurrency: 1,
    timeout: 60000
  }),

  defineJobHandler({
    name: "queue-metrics",
    queueName: SYSTEM_QUEUE_NAMES.queueMetrics,
    handler: async (job: Job) => {
      sysLogger.debug({ jobId: job.id }, "Collecting queue metrics");
      // Metrics collection logic here
      return { processed: true };
    },
    concurrency: 1,
    timeout: 30000
  })
];

// ============ WORKFLOW HANDLERS ============
export const WORKFLOW_JOB_HANDLERS: JobHandlerDefinition[] = [
  defineJobHandler({
    name: "execute-workflow",
    queueName: "workflows",
    handler: async (job: Job<{ workflowId: string }>) => {
      sysLogger.info({ workflowId: job.data.workflowId }, "Executing workflow");
      // Workflow execution logic
      return { executed: true };
    },
    concurrency: 5,
    timeout: 120000,
    retries: 2
  }),

  defineJobHandler({
    name: "validate-workflow",
    queueName: "workflows",
    handler: async (job: Job<{ workflowId: string }>) => {
      sysLogger.debug({ workflowId: job.data.workflowId }, "Validating workflow");
      // Validation logic
      return { valid: true };
    },
    concurrency: 10,
    timeout: 30000
  })
];

// ============ AGENT HANDLERS ============
export const AGENT_JOB_HANDLERS: JobHandlerDefinition[] = [
  defineJobHandler({
    name: "run-agent",
    queueName: "agents",
    handler: async (job: Job<{ agentId: string; input: unknown }>) => {
      sysLogger.info({ agentId: job.data.agentId }, "Running agent");
      // Agent execution logic
      return { output: {} };
    },
    concurrency: 5,
    timeout: 300000,
    retries: 1
  }),

  defineJobHandler({
    name: "sync-agent",
    queueName: "agents",
    handler: async (job: Job<{ agentId: string }>) => {
      sysLogger.info({ agentId: job.data.agentId }, "Syncing agent state");
      // Sync logic
      return { synced: true };
    },
    concurrency: 3,
    timeout: 60000
  })
];

// ============ CONNECTOR HANDLERS ============
export const CONNECTOR_JOB_HANDLERS: JobHandlerDefinition[] = [
  defineJobHandler({
    name: "sync-connector",
    queueName: "connectors",
    handler: async (job: Job<{ connectorId: string; source: string }>) => {
      sysLogger.info({ connectorId: job.data.connectorId }, "Syncing connector data");
      // Sync from external source
      return { synced: 0 };
    },
    concurrency: 3,
    timeout: 600000,
    retries: 2,
    backoff: { type: "exponential", delay: 1000 }
  }),

  defineJobHandler({
    name: "validate-connector",
    queueName: "connectors",
    handler: async (job: Job<{ connectorId: string }>) => {
      sysLogger.debug({ connectorId: job.data.connectorId }, "Validating connector");
      return { valid: true };
    },
    concurrency: 5,
    timeout: 30000
  })
];

// ============ NOTIFICATION HANDLERS ============
export const NOTIFICATION_JOB_HANDLERS: JobHandlerDefinition[] = [
  defineJobHandler({
    name: "send-notification",
    queueName: "notifications",
    handler: async (
      job: Job<{ userId: string; message: string; channel: string }>
    ) => {
      sysLogger.info(
        { userId: job.data.userId, channel: job.data.channel },
        "Sending notification"
      );
      return { sent: true };
    },
    concurrency: 10,
    timeout: 30000,
    retries: 3
  }),

  defineJobHandler({
    name: "batch-notifications",
    queueName: "notifications",
    handler: async (
      job: Job<{ userIds: string[]; message: string; channel: string }>
    ) => {
      sysLogger.info(
        { count: job.data.userIds.length, channel: job.data.channel },
        "Sending batch notifications"
      );
      return { sent: job.data.userIds.length };
    },
    concurrency: 2,
    timeout: 120000,
    retries: 2
  })
];

// ============ INTEGRATION HANDLERS ============
export const INTEGRATION_JOB_HANDLERS: JobHandlerDefinition[] = [
  defineJobHandler({
    name: "process-webhook",
    queueName: "integrations",
    handler: async (
      job: Job<{ webhookId: string; payload: unknown }>
    ) => {
      sysLogger.info({ webhookId: job.data.webhookId }, "Processing webhook");
      return { processed: true };
    },
    concurrency: 5,
    timeout: 60000,
    retries: 2
  }),

  defineJobHandler({
    name: "sync-external-data",
    queueName: "integrations",
    handler: async (
      job: Job<{ integrationId: string; source: string }>
    ) => {
      sysLogger.info(
        { integrationId: job.data.integrationId, source: job.data.source },
        "Syncing external data"
      );
      return { synced: true };
    },
    concurrency: 2,
    timeout: 600000,
    retries: 1,
    backoff: { type: "exponential", delay: 5000 }
  })
];

// ============ BULK EXPORT ============
export const ALL_JOB_HANDLERS = [
  ...SYSTEM_JOB_HANDLERS,
  ...WORKFLOW_JOB_HANDLERS,
  ...AGENT_JOB_HANDLERS,
  ...CONNECTOR_JOB_HANDLERS,
  ...NOTIFICATION_JOB_HANDLERS,
  ...INTEGRATION_JOB_HANDLERS
];

/**
 * Initialize all handlers into registry
 */
export function initializeJobHandlers(): void {
  jobHandlerRegistry.registerBatch(ALL_JOB_HANDLERS);
}
