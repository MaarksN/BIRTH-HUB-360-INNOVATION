import { randomUUID } from "node:crypto";

import {
  prisma,
  WorkflowStatus,
  WorkflowTriggerType
} from "@birthub/database";
import { createLogger } from "@birthub/logger";

import type { WorkflowTriggerJobPayload } from "../engine/runner.js";
import {
  emitInternalEvent,
  onInternalEvent,
  type InternalEventPayload
} from "../events/internalEventBus.js";
import { AGENT_MESH_ORCHESTRATOR_ID } from "./runtime.mesh.js";

const logger = createLogger("agent-runtime-ingress");

export type AgentMeshTriggerEvent =
  | "customer.renewal_at_risk"
  | "operations.incident_opened"
  | "sales.new_lead"
  | "support.critical_ticket";

export type AgentMeshTriggerPriority = "high" | "normal";

export interface AgentMeshExecutionJobPayload {
  agentId: string;
  catalogAgentId: string;
  executionId: string;
  input: Record<string, unknown>;
  organizationId?: string | null;
  tenantId: string;
  userId?: string | null;
}

export interface AgentMeshTriggerExecutionBlueprint {
  canonicalEvent: AgentMeshTriggerEvent;
  executionPayload: AgentMeshExecutionJobPayload;
  priority: AgentMeshTriggerPriority;
  workflowTopics: string[];
}

export interface AgentMeshTriggerDispatchResult {
  agentExecutionId: string;
  canonicalEvent: AgentMeshTriggerEvent;
  priority: AgentMeshTriggerPriority;
  queuedWorkflowCount: number;
  workflowIds: string[];
  workflowTopics: string[];
}

export interface AgentMeshIngressDependencies {
  enqueueAgentExecution: (input: {
    payload: AgentMeshExecutionJobPayload;
    priority: AgentMeshTriggerPriority;
  }) => Promise<void>;
  enqueueWorkflowTrigger: (payload: WorkflowTriggerJobPayload) => Promise<void>;
}

const SUPPORTED_AGENT_MESH_EVENTS = [
  "sales.new_lead",
  "support.critical_ticket",
  "customer.renewal_at_risk",
  "operations.incident_opened",
  "tenant.churn_risk"
] as const;

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

function uniqueStrings(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values.map((item) => item.trim()).filter(Boolean)) {
    const normalized = value.toLowerCase();
    if (seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    result.push(value);
  }

  return result;
}

function inferCanonicalEvent(event: string): AgentMeshTriggerEvent | null {
  const normalized = event.trim().toLowerCase();

  if (["sales.new_lead", "crm.new_lead", "lead.created"].includes(normalized)) {
    return "sales.new_lead";
  }

  if (["support.critical_ticket", "ticket.critical", "support.ticket_critical"].includes(normalized)) {
    return "support.critical_ticket";
  }

  if (
    ["customer.renewal_at_risk", "tenant.churn_risk", "customer.churn_risk", "renewal.risk"].includes(
      normalized
    )
  ) {
    return "customer.renewal_at_risk";
  }

  if (
    ["operations.incident_opened", "incident.created", "incident.opened", "ops.incident"].includes(
      normalized
    )
  ) {
    return "operations.incident_opened";
  }

  return null;
}

function inferPriority(event: AgentMeshTriggerEvent, payload: Record<string, unknown>): AgentMeshTriggerPriority {
  const severity = readString(payload.severity)?.toLowerCase();
  if (severity && ["critical", "high", "sev1", "sev2", "p0", "p1"].includes(severity)) {
    return "high";
  }

  if (event === "sales.new_lead") {
    return "normal";
  }

  return "high";
}

function inferSourceSystem(event: InternalEventPayload): string {
  return (
    readString(event.source) ??
    readString(event.payload.sourceSystem) ??
    readString(event.payload.provider) ??
    readString(event.payload.platform) ??
    "internal-runtime"
  );
}

function deriveObjective(event: AgentMeshTriggerEvent, payload: Record<string, unknown>): string {
  const accountName =
    readString(payload.accountName) ??
    readString(payload.companyName) ??
    readString(payload.organizationName) ??
    readString(payload.customerName) ??
    readString(payload.leadName) ??
    readString(payload.ticketTitle) ??
    readString(payload.incidentTitle);

  switch (event) {
    case "sales.new_lead":
      return accountName
        ? `Qualificar e orquestrar a melhor abordagem comercial para o novo lead ${accountName}.`
        : "Qualificar e orquestrar a melhor abordagem comercial para o novo lead recebido.";
    case "support.critical_ticket":
      return accountName
        ? `Resolver rapidamente o ticket critico relacionado a ${accountName} sem perder contexto entre suporte, produto e operacoes.`
        : "Resolver rapidamente o ticket critico sem perder contexto entre suporte, produto e operacoes.";
    case "customer.renewal_at_risk":
      return accountName
        ? `Proteger a renovacao em risco da conta ${accountName} com plano preventivo multiagente.`
        : "Proteger a renovacao em risco com plano preventivo multiagente.";
    case "operations.incident_opened":
      return accountName
        ? `Conter o incidente operacional ${accountName} e coordenar diagnostico, mitigacao e comunicacao.`
        : "Conter o incidente operacional e coordenar diagnostico, mitigacao e comunicacao.";
    default:
      return "Orquestrar especialistas para responder ao evento operacional recebido.";
  }
}

function buildSessionId(event: AgentMeshTriggerEvent, payload: Record<string, unknown>): string {
  const reference =
    readString(payload.externalId) ??
    readString(payload.id) ??
    readString(payload.email) ??
    readString(payload.ticketId) ??
    readString(payload.incidentId) ??
    randomUUID();

  return `mesh:${event}:${slugify(reference)}`;
}

function buildWorkflowTopics(canonicalEvent: AgentMeshTriggerEvent, rawEvent: string): string[] {
  return uniqueStrings([
    canonicalEvent,
    rawEvent,
    `agent.mesh.${canonicalEvent}`
  ]);
}

function buildExecutionInput(event: InternalEventPayload, canonicalEvent: AgentMeshTriggerEvent, priority: AgentMeshTriggerPriority, workflowTopics: string[]): Record<string, unknown> {
  const sourceSystem = inferSourceSystem(event);
  const objective = deriveObjective(canonicalEvent, event.payload);
  const receivedAt = new Date().toISOString();

  return {
    ...event.payload,
    objective,
    owner: readString(event.payload.owner) ?? "agent-mesh-orchestrator",
    premiumMode: "market-premium-10",
    premiumMission:
      "processar dados, resolver situacoes, sugerir proximos passos, salvar contexto, conversar entre si e se moldar ao segmento do cliente",
    sessionId: buildSessionId(canonicalEvent, event.payload),
    sourcePayload: event.payload,
    sourceSystem,
    trigger: {
      canonicalType: canonicalEvent,
      event: event.event,
      priority,
      receivedAt,
      sourceSystem,
      workflowTopics
    },
    workflowContextSummary: `trigger=${canonicalEvent}; priority=${priority}; source=${sourceSystem}; receivedAt=${receivedAt}`
  };
}

export function buildAgentMeshTriggerExecution(
  event: InternalEventPayload
): AgentMeshTriggerExecutionBlueprint | null {
  const canonicalEvent = inferCanonicalEvent(event.event);
  if (!canonicalEvent) {
    return null;
  }

  const priority = inferPriority(canonicalEvent, event.payload);
  const workflowTopics = buildWorkflowTopics(canonicalEvent, event.event);

  return {
    canonicalEvent,
    executionPayload: {
      agentId: AGENT_MESH_ORCHESTRATOR_ID,
      catalogAgentId: AGENT_MESH_ORCHESTRATOR_ID,
      executionId: `mesh-trigger:${canonicalEvent}:${randomUUID()}`,
      input: buildExecutionInput(event, canonicalEvent, priority, workflowTopics),
      organizationId: event.organizationId ?? null,
      tenantId: event.tenantId,
      userId: event.userId ?? null
    },
    priority,
    workflowTopics
  };
}

export async function dispatchAgentMeshTrigger(
  dependencies: AgentMeshIngressDependencies,
  event: InternalEventPayload
): Promise<AgentMeshTriggerDispatchResult | null> {
  const blueprint = buildAgentMeshTriggerExecution(event);
  if (!blueprint) {
    return null;
  }

  await dependencies.enqueueAgentExecution({
    payload: blueprint.executionPayload,
    priority: blueprint.priority
  });

  const workflows = await prisma.workflow.findMany({
    orderBy: {
      createdAt: "asc"
    },
    select: {
      id: true,
      organizationId: true
    },
    where: {
      eventTopic: {
        in: blueprint.workflowTopics
      },
      status: WorkflowStatus.PUBLISHED,
      tenantId: event.tenantId,
      triggerType: WorkflowTriggerType.EVENT
    }
  });

  for (const workflow of workflows) {
    await dependencies.enqueueWorkflowTrigger({
      organizationId: workflow.organizationId,
      tenantId: event.tenantId,
      triggerPayload: blueprint.executionPayload.input,
      triggerType: WorkflowTriggerType.EVENT,
      workflowId: workflow.id
    });
  }

  logger.info(
    {
      agentExecutionId: blueprint.executionPayload.executionId,
      canonicalEvent: blueprint.canonicalEvent,
      priority: blueprint.priority,
      queuedWorkflowCount: workflows.length,
      tenantId: event.tenantId
    },
    "Agent mesh trigger dispatched"
  );

  return {
    agentExecutionId: blueprint.executionPayload.executionId,
    canonicalEvent: blueprint.canonicalEvent,
    priority: blueprint.priority,
    queuedWorkflowCount: workflows.length,
    workflowIds: workflows.map((workflow) => workflow.id),
    workflowTopics: blueprint.workflowTopics
  };
}

export function initializeAgentMeshIngressBridge(
  dependencies: AgentMeshIngressDependencies
): {
  close: () => void;
} {
  const unsubs = SUPPORTED_AGENT_MESH_EVENTS.map((eventName) =>
    onInternalEvent(eventName, (event) => {
      void dispatchAgentMeshTrigger(dependencies, event).catch((error) => {
        logger.error(
          {
            err: error,
            event: event.event,
            tenantId: event.tenantId
          },
          "Agent mesh trigger dispatch failed"
        );
      });
    })
  );

  return {
    close: () => {
      for (const unsubscribe of unsubs) {
        unsubscribe();
      }
    }
  };
}

function emitCanonicalMeshEvent(input: {
  event: AgentMeshTriggerEvent;
  organizationId?: string | null;
  payload: Record<string, unknown>;
  source?: string;
  tenantId: string;
  userId?: string | null;
}): void {
  emitInternalEvent({
    event: input.event,
    organizationId: input.organizationId ?? null,
    payload: input.payload,
    ...(input.source ? { source: input.source } : {}),
    tenantId: input.tenantId,
    ...(input.userId ? { userId: input.userId } : {})
  });
}

export function emitNewLeadEvent(input: {
  organizationId?: string | null;
  payload: Record<string, unknown>;
  source?: string;
  tenantId: string;
  userId?: string | null;
}): void {
  emitCanonicalMeshEvent({
    ...input,
    event: "sales.new_lead"
  });
}

export function emitCriticalTicketEvent(input: {
  organizationId?: string | null;
  payload: Record<string, unknown>;
  source?: string;
  tenantId: string;
  userId?: string | null;
}): void {
  emitCanonicalMeshEvent({
    ...input,
    event: "support.critical_ticket"
  });
}

export function emitRenewalRiskEvent(input: {
  organizationId?: string | null;
  payload: Record<string, unknown>;
  source?: string;
  tenantId: string;
  userId?: string | null;
}): void {
  emitCanonicalMeshEvent({
    ...input,
    event: "customer.renewal_at_risk"
  });
}

export function emitOperationalIncidentEvent(input: {
  organizationId?: string | null;
  payload: Record<string, unknown>;
  source?: string;
  tenantId: string;
  userId?: string | null;
}): void {
  emitCanonicalMeshEvent({
    ...input,
    event: "operations.incident_opened"
  });
}
