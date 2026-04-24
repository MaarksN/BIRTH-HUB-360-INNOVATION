import type { AgentLearningRecord, AgentManifest } from "@birthub/agents-core";
import { PolicyEngine } from "@birthub/agents-core/policy";

import type { AgentExecutionRequest, PlanBuilder, PlannedToolCall } from "../executors/planExecutor.js";
import { generateAgentPlan, type RuntimeLlmLikeClient } from "./runtime.llm.js";

const READ_ONLY_FALLBACK_TOOLS = ["memory-read", "db-read"];

function buildAllowedToolSet(manifest: AgentManifest): Set<string> {
  return new Set([
    "db-read",
    "db-write",
    "http",
    "send-email",
    "handoff",
    "memory-read",
    "memory-write",
    "artifact-create",
    "approval-request",
    "workflow-enqueue",
    "connector-action",
    ...manifest.tools.map((tool) => tool.id)
  ]);
}

export class LLMPlanner implements PlanBuilder {
  constructor(
    private readonly options: {
      contextSummary?: string;
      input: Record<string, unknown>;
      llmClient?: RuntimeLlmLikeClient;
      manifest: AgentManifest;
      policyEngine: PolicyEngine;
      sharedLearning: AgentLearningRecord[];
      tenantId: string;
    }
  ) {}

  async build(request: AgentExecutionRequest): Promise<PlannedToolCall[]> {
    const allowedTools = buildAllowedToolSet(this.options.manifest);

    try {
      const plan = await generateAgentPlan({
        context: {
          input: this.options.input,
          manifest: this.options.manifest,
          memory: {
            contextSummary: this.options.contextSummary ?? null,
            sharedLearning: this.options.sharedLearning
          },
          policies: this.options.manifest.policies,
          systemPrompt:
            "You are an agent planner. Produce governed tool calls only from provided catalog and never produce non-JSON output.",
          toolCatalog: Array.from(allowedTools).map((name) => ({
            description: `Runtime tool ${name}`,
            name
          }))
        },
        llmClient: this.options.llmClient
      });

      return plan.toolCalls.filter((call) => {
        if (!allowedTools.has(call.tool)) {
          return false;
        }

        const evaluation = this.options.policyEngine.evaluate(
          request.agentId,
          `tool.${call.tool}`,
          {
            tenantId: this.options.tenantId
          }
        );

        return evaluation.granted;
      });
    } catch {
      const safeTool = READ_ONLY_FALLBACK_TOOLS.find((tool) => {
        if (!allowedTools.has(tool)) {
          return false;
        }

        const evaluation = this.options.policyEngine.evaluate(request.agentId, `tool.${tool}`, {
          tenantId: this.options.tenantId
        });

        return evaluation.granted;
      });

      if (!safeTool) {
        return [];
      }

      return [
        {
          input: {
            key: `latest-output:${request.executionId}`
          },
          tool: safeTool
        }
      ];
    }
  }
}
