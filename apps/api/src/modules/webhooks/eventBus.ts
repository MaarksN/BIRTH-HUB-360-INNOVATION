import { randomUUID } from "node:crypto";

import type { ApiConfig } from "@birthub/config";
import { WorkflowTriggerType } from "@birthub/database";

import { workflowQueueAdapter } from "../workflows/service.js";

interface WorkflowInternalEvent {
  payload: Record<string, unknown>;
  tenantId: string;
  topic: string;
}

let bridgeConfig: ApiConfig | null = null;

export function initializeWorkflowInternalEventBridge(config: ApiConfig): void {
  bridgeConfig = config;
}

export function emitWorkflowInternalEvent(event: WorkflowInternalEvent): void {
  if (!bridgeConfig) {
    return;
  }

  void workflowQueueAdapter.enqueueWorkflowTrigger(bridgeConfig, {
    eventSource: "internal",
    idempotencyKey: `internal:${event.topic}:${randomUUID()}`,
    organizationId: event.tenantId,
    tenantId: event.tenantId,
    topic: event.topic,
    triggerPayload: event.payload,
    triggerType: WorkflowTriggerType.EVENT
  });
}
