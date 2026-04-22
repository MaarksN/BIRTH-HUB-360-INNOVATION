import { interpolateValue } from "../interpolation/interpolate.js";
import type { WorkflowRuntimeContext } from "../types.js";

export interface AgentExecuteConfig {
  agentId: string;
  input?: Record<string, unknown>;
  onError?: "continue" | "stop";
}

export interface AgentExecutor {
  execute: (args: {
    agentId: string;
    contextSummary: string;
    input: Record<string, unknown>;
  }) => Promise<unknown>;
}

function summarizeContext(context: WorkflowRuntimeContext): string {
  const stepCount = Object.keys(context.steps).length;
  return `workflow=${context.workflowId}; execution=${context.executionId}; tenant=${context.tenantId}; steps=${stepCount}`;
}

import { createLogger } from "@birthub/logger";
const logger = createLogger("workflows-core:agent-execute");

export async function executeAgentNode(
  config: AgentExecuteConfig,
  context: WorkflowRuntimeContext,
  executor: AgentExecutor
): Promise<unknown> {
  const interpolated = interpolateValue(config, context);
  try {
    logger.info({ agentId: interpolated.agentId, workflowId: context.workflowId }, "Starting agent execution node");
    const result = await executor.execute({
      agentId: interpolated.agentId,
      contextSummary: summarizeContext(context),
      input: interpolated.input ?? {}
    });
    return result;
  } catch (error) {
    logger.error({ error, agentId: interpolated.agentId, workflowId: context.workflowId }, "Agent execution failed");
    if (config.onError === "continue") {
      return { error: error instanceof Error ? error.message : "Unknown error", status: "failed_continued" };
    }
    throw error;
  }
}
