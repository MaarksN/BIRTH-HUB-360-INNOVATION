import { executeAgentNode, type AgentExecutor } from "./agentExecute.js";
import {
  executeAgentHandoffNode,
  type HandoffExecutor
} from "./agentHandoff.js";
import { executeAiTextExtractNode } from "./aiTextExtract.js";
import { executeCodeNode } from "./code.js";
import { executeConditionNode } from "./condition.js";
import {
  executeConnectorActionNode,
  type ConnectorExecutor
} from "./connectorAction.js";
import { executeDelayNode } from "./delay.js";
import { executeHttpRequestNode } from "./httpRequest.js";
import {
  executeNotificationNode,
  type NotificationDispatcher
} from "./notification.js";
import { executeTransformerNode } from "./transformer.js";
import type { StepDefinition } from "../schemas/step.schema.js";
import type { WorkflowRuntimeContext } from "../types.js";

export interface StepExecutionDependencies {
  agentExecutor?: AgentExecutor;
  connectorExecutor?: ConnectorExecutor;
  handoffExecutor?: HandoffExecutor;
  notificationDispatcher?: NotificationDispatcher;
  httpRequestRateLimiter?: { consume: (key: string, limit: number, windowSeconds: number) => Promise<void> };
}

type StepType = StepDefinition["type"];
type StepOf<TType extends StepType> = Extract<StepDefinition, { type: TType }>;
type StepHandler<TType extends StepType> = (
  step: StepOf<TType>,
  context: WorkflowRuntimeContext,
  dependencies: StepExecutionDependencies
) => Promise<unknown>;

function requireAgentExecutor(dependencies: StepExecutionDependencies): AgentExecutor {
  if (!dependencies.agentExecutor) {
    throw new Error("AGENT_EXECUTOR_NOT_CONFIGURED");
  }

  return dependencies.agentExecutor;
}

function requireHandoffExecutor(dependencies: StepExecutionDependencies): HandoffExecutor {
  if (!dependencies.handoffExecutor) {
    throw new Error("HANDOFF_EXECUTOR_NOT_CONFIGURED");
  }

  return dependencies.handoffExecutor;
}

function requireConnectorExecutor(dependencies: StepExecutionDependencies): ConnectorExecutor {
  if (!dependencies.connectorExecutor) {
    throw new Error("CONNECTOR_EXECUTOR_NOT_CONFIGURED");
  }

  return dependencies.connectorExecutor;
}

function withConnectorAccountId(connectorAccountId?: string): { connectorAccountId?: string } {
  return connectorAccountId ? { connectorAccountId } : {};
}

function withOptionalString<TKey extends string>(
  key: TKey,
  value?: string
): Partial<Record<TKey, string>> {
  return value ? { [key]: value } as Record<TKey, string> : {};
}

function buildHandoffConfig(config: StepOf<"AGENT_HANDOFF">["config"]) {
  return {
    context: config.context,
    ...withOptionalString("correlationId", config.correlationId),
    sourceAgentId: config.sourceAgentId,
    summary: config.summary,
    targetAgentId: config.targetAgentId,
    ...withOptionalString("threadId", config.threadId)
  };
}

function buildCrmUpsertConfig(config: StepOf<"CRM_UPSERT">["config"]) {
  return {
    kind: "CRM_UPSERT" as const,
    ...withConnectorAccountId(config.connectorAccountId),
    objectType: config.objectType,
    operation: config.operation,
    payload: config.payload,
    provider: config.provider,
    ...withOptionalString("scope", config.scope)
  };
}

function buildConnectorActionConfig(config: StepOf<"CONNECTOR_ACTION">["config"]) {
  return {
    action: config.action,
    ...withConnectorAccountId(config.connectorAccountId),
    kind: "CONNECTOR_ACTION" as const,
    payload: config.payload
  };
}

function buildWhatsappSendConfig(config: StepOf<"WHATSAPP_SEND">["config"]) {
  return {
    kind: "WHATSAPP_SEND" as const,
    ...withConnectorAccountId(config.connectorAccountId),
    message: config.message,
    ...withOptionalString("template", config.template),
    ...withOptionalString("threadId", config.threadId),
    to: config.to
  };
}

function buildCalendarEventConfig<TType extends "GOOGLE_EVENT" | "MS_EVENT">(
  kind: TType,
  config: StepOf<TType>["config"]
) {
  return {
    kind,
    attendees: config.attendees,
    ...withOptionalString("calendarId", config.calendarId),
    ...withConnectorAccountId(config.connectorAccountId),
    ...withOptionalString("description", config.description),
    end: config.end,
    start: config.start,
    title: config.title
  };
}

async function executeAgentStep(
  step: StepOf<"AGENT_EXECUTE">,
  context: WorkflowRuntimeContext,
  dependencies: StepExecutionDependencies
) {
  return executeAgentNode(step.config, context, requireAgentExecutor(dependencies));
}

async function executeAgentHandoffStep(
  step: StepOf<"AGENT_HANDOFF">,
  context: WorkflowRuntimeContext,
  dependencies: StepExecutionDependencies
) {
  return executeAgentHandoffNode(
    buildHandoffConfig(step.config),
    context,
    requireHandoffExecutor(dependencies)
  );
}

function executeAiTextExtractStep(
  step: StepOf<"AI_TEXT_EXTRACT">,
  context: WorkflowRuntimeContext
) {
  return Promise.resolve(executeAiTextExtractNode(step.config, context));
}

function executeCodeStep(step: StepOf<"CODE">, context: WorkflowRuntimeContext) {
  return Promise.resolve(executeCodeNode(step.config, context.steps, context));
}

function executeConditionStep(step: StepOf<"CONDITION">, context: WorkflowRuntimeContext) {
  return Promise.resolve(executeConditionNode({ ...step.config, value: step.config.value ?? "" }, context));
}

async function executeCrmUpsertStep(
  step: StepOf<"CRM_UPSERT">,
  context: WorkflowRuntimeContext,
  dependencies: StepExecutionDependencies
) {
  return executeConnectorActionNode(
    buildCrmUpsertConfig(step.config),
    context,
    requireConnectorExecutor(dependencies)
  );
}

async function executeConnectorActionStep(
  step: StepOf<"CONNECTOR_ACTION">,
  context: WorkflowRuntimeContext,
  dependencies: StepExecutionDependencies
) {
  return executeConnectorActionNode(
    buildConnectorActionConfig(step.config),
    context,
    requireConnectorExecutor(dependencies)
  );
}

function executeDelayStep(step: StepOf<"DELAY">) {
  return Promise.resolve(executeDelayNode(step.config));
}

async function executeGoogleEventStep(
  step: StepOf<"GOOGLE_EVENT">,
  context: WorkflowRuntimeContext,
  dependencies: StepExecutionDependencies
) {
  return executeConnectorActionNode(
    buildCalendarEventConfig("GOOGLE_EVENT", step.config),
    context,
    requireConnectorExecutor(dependencies)
  );
}

async function executeHttpRequestStep(
  step: StepOf<"HTTP_REQUEST">,
  context: WorkflowRuntimeContext,
  dependencies: StepExecutionDependencies
) {
  return executeHttpRequestNode(step.config, context, dependencies.httpRequestRateLimiter);
}

async function executeMsEventStep(
  step: StepOf<"MS_EVENT">,
  context: WorkflowRuntimeContext,
  dependencies: StepExecutionDependencies
) {
  return executeConnectorActionNode(
    buildCalendarEventConfig("MS_EVENT", step.config),
    context,
    requireConnectorExecutor(dependencies)
  );
}

async function executeNotificationStep(
  step: StepOf<"SEND_NOTIFICATION">,
  context: WorkflowRuntimeContext,
  dependencies: StepExecutionDependencies
) {
  return executeNotificationNode(step.config, context, dependencies.notificationDispatcher);
}

function executeTransformerStep(
  step: StepOf<"TRANSFORMER">,
  context: WorkflowRuntimeContext
) {
  return Promise.resolve(executeTransformerNode(step.config, context));
}

function executeTriggerStep(
  _step: StepOf<"TRIGGER_CRON" | "TRIGGER_EVENT" | "TRIGGER_WEBHOOK">,
  context: WorkflowRuntimeContext
) {
  return Promise.resolve(context.trigger.output);
}

async function executeWhatsappSendStep(
  step: StepOf<"WHATSAPP_SEND">,
  context: WorkflowRuntimeContext,
  dependencies: StepExecutionDependencies
) {
  return executeConnectorActionNode(
    buildWhatsappSendConfig(step.config),
    context,
    requireConnectorExecutor(dependencies)
  );
}

const stepHandlers = {
  AGENT_EXECUTE: executeAgentStep,
  AGENT_HANDOFF: executeAgentHandoffStep,
  AI_TEXT_EXTRACT: executeAiTextExtractStep,
  CODE: executeCodeStep,
  CONDITION: executeConditionStep,
  CONNECTOR_ACTION: executeConnectorActionStep,
  CRM_UPSERT: executeCrmUpsertStep,
  DELAY: executeDelayStep,
  GOOGLE_EVENT: executeGoogleEventStep,
  HTTP_REQUEST: executeHttpRequestStep,
  MS_EVENT: executeMsEventStep,
  SEND_NOTIFICATION: executeNotificationStep,
  TRANSFORMER: executeTransformerStep,
  TRIGGER_CRON: executeTriggerStep,
  TRIGGER_EVENT: executeTriggerStep,
  TRIGGER_WEBHOOK: executeTriggerStep,
  WHATSAPP_SEND: executeWhatsappSendStep
} satisfies { [TType in StepType]: StepHandler<TType> };

import { createLogger } from "@birthub/logger";
const logger = createLogger("workflows-core:execute-step");

export async function executeStep(
  step: StepDefinition,
  context: WorkflowRuntimeContext,
  dependencies: StepExecutionDependencies = {}
): Promise<unknown> {
  const handler = stepHandlers[step.type] as StepHandler<typeof step.type>;
  logger.info({ stepId: step.key, stepType: step.type, workflowId: context.workflowId }, "Executing workflow step");
  try {
    const result = await handler(step as never, context, dependencies);
    return result;
  } catch (error) {
    logger.error({ error, stepId: step.key, stepType: step.type, workflowId: context.workflowId }, "Workflow step execution failed");
    throw error;
  }
}
