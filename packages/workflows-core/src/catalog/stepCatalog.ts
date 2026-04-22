
// 
import type { WorkflowStepType } from "../types.js";

export type StepLifecycle = "active" | "deprecated";

export interface StepCatalogEntry {
  category: "action" | "connector" | "logic" | "trigger";
  key: WorkflowStepType;
  lifecycle: StepLifecycle;
  replacement?: WorkflowStepType;
  riskWeight: number;
}

export const STEP_CATALOG: Record<WorkflowStepType, StepCatalogEntry> = {
  AGENT_EXECUTE: {
    category: "action",
    key: "AGENT_EXECUTE",
    lifecycle: "active",
    riskWeight: 10
  },
  AGENT_HANDOFF: {
    category: "action",
    key: "AGENT_HANDOFF",
    lifecycle: "active",
    riskWeight: 8
  },
  AI_TEXT_EXTRACT: {
    category: "action",
    key: "AI_TEXT_EXTRACT",
    lifecycle: "active",
    riskWeight: 8
  },
  CODE: {
    category: "logic",
    key: "CODE",
    lifecycle: "active",
    riskWeight: 20
  },
  CONDITION: {
    category: "logic",
    key: "CONDITION",
    lifecycle: "active",
    riskWeight: 6
  },
  CONNECTOR_ACTION: {
    category: "connector",
    key: "CONNECTOR_ACTION",
    lifecycle: "active",
    riskWeight: 12
  },
  CRM_UPSERT: {
    category: "connector",
    key: "CRM_UPSERT",
    lifecycle: "active",
    riskWeight: 15
  },
  DELAY: {
    category: "logic",
    key: "DELAY",
    lifecycle: "active",
    riskWeight: 3
  },
  GOOGLE_EVENT: {
    category: "connector",
    key: "GOOGLE_EVENT",
    lifecycle: "active",
    riskWeight: 9
  },
  HTTP_REQUEST: {
    category: "connector",
    key: "HTTP_REQUEST",
    lifecycle: "active",
    riskWeight: 18
  },
  MS_EVENT: {
    category: "connector",
    key: "MS_EVENT",
    lifecycle: "active",
    riskWeight: 9
  },
  SEND_NOTIFICATION: {
    category: "action",
    key: "SEND_NOTIFICATION",
    lifecycle: "active",
    riskWeight: 6
  },
  TRANSFORMER: {
    category: "logic",
    key: "TRANSFORMER",
    lifecycle: "active",
    riskWeight: 6
  },
  TRIGGER_CRON: {
    category: "trigger",
    key: "TRIGGER_CRON",
    lifecycle: "active",
    riskWeight: 4
  },
  TRIGGER_EVENT: {
    category: "trigger",
    key: "TRIGGER_EVENT",
    lifecycle: "active",
    riskWeight: 4
  },
  TRIGGER_WEBHOOK: {
    category: "trigger",
    key: "TRIGGER_WEBHOOK",
    lifecycle: "active",
    riskWeight: 5
  },
  WHATSAPP_SEND: {
    category: "connector",
    key: "WHATSAPP_SEND",
    lifecycle: "deprecated",
    replacement: "SEND_NOTIFICATION",
    riskWeight: 14
  }
};
