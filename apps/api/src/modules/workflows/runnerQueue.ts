import { createHash } from "node:crypto";

import type { ApiConfig } from "@birthub/config";
import type { WorkflowTriggerType } from "@birthub/database";
import { WORKFLOW_QUEUE_NAMES, queueClient } from "@birthub/queue";

export interface WorkflowExecutionJobPayload {
  attempt: number;
  executionId: string;
  isDryRun?: boolean | undefined;
  organizationId: string;
  stepKey: string;
  tenantId: string;
  triggerEventId?: string | undefined;
  triggerPayload: Record<string, unknown>;
  triggerType: WorkflowTriggerType;
  workflowId: string;
}

export interface WorkflowTriggerJobPayload {
  actorId?: string | undefined;
  eventSource?: string | undefined;
  idempotencyKey?: string | undefined;
  isDryRun?: boolean | undefined;
  organizationId: string;
  triggerEventId?: string | undefined;
  tenantId: string;
  topic?: string | undefined;
  triggerPayload: Record<string, unknown>;
  triggerType: WorkflowTriggerType;
  workflowId?: string | undefined;
}

export async function enqueueWorkflowExecution(
  config: ApiConfig,
  payload: WorkflowExecutionJobPayload,
  options?: {
    delay?: number;
    jobId?: string;
  }
): Promise<void> {
  await queueClient.enqueue({
    data: payload,
    jobName: "workflow-step",
    options: {
      ...(options?.delay !== undefined ? { delay: options.delay } : {}),
      jobId: options?.jobId ?? `${payload.executionId}:${payload.stepKey}:${payload.attempt}`
    },
    queue: WORKFLOW_QUEUE_NAMES.execution,
    redisUrl: config.REDIS_URL,
    tenantId: payload.tenantId
  });
}

export async function enqueueWorkflowTrigger(
  config: ApiConfig,
  payload: WorkflowTriggerJobPayload
): Promise<void> {
  await queueClient.enqueue({
    data: payload,
    jobName: "workflow-trigger",
    options: {
      jobId: payload.idempotencyKey ?? `${payload.workflowId ?? payload.topic ?? "event"}:${Date.now()}`
    },
    queue: WORKFLOW_QUEUE_NAMES.trigger,
    redisUrl: config.REDIS_URL,
    tenantId: payload.tenantId
  });
}

export async function scheduleCronWorkflow(
  config: ApiConfig,
  payload: WorkflowTriggerJobPayload & { cron: string }
): Promise<void> {
  await queueClient.upsertRepeatableJob({
    data: payload,
    jobId: `cron:${payload.workflowId}`,
    jobName: "workflow-trigger-cron",
    queue: WORKFLOW_QUEUE_NAMES.trigger,
    redisUrl: config.REDIS_URL,
    repeat: {
      pattern: payload.cron
    }
  });
}

export async function dedupeTriggerPayload(
  config: ApiConfig,
  tenantId: string,
  payload: Record<string, unknown>
): Promise<boolean> {
  const hash = createHash("sha256")
    .update(JSON.stringify({ payload, tenantId }))
    .digest("hex");
  const key = `workflow:trigger:dedupe:${tenantId}:${hash}`;
  return queueClient.claimDeduplicationKey(key, 5, { redisUrl: config.REDIS_URL });
}
