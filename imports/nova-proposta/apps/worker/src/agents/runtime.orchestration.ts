import {
  buildSegmentKeywords,
  buildAgentRuntimeOutput,
  buildAgentRuntimePlan,
  buildRuntimePolicyRules,
  computeOutputHash,
  inferSegmentProfile
} from "@birthub/agents-core";
import { PolicyEngine } from "@birthub/agents-core/policy";
import { getWorkerConfig } from "@birthub/config";
import { Prisma, prisma } from "@birthub/database";

import { PlanExecutor } from "../executors/planExecutor.js";
import { runtimeMemory } from "./runtime.memory.js";
import type {
  RuntimeExecutionInput,
  RuntimeExecutionResult
} from "./runtime.types.js";
import { readSessionId, roundCurrency } from "./runtime.shared.js";
import { resolveRuntimeAgent, resolveManagedPolicies } from "./runtime.catalog.js";
import { querySharedLearning, appendConversationMessage, buildLearningRecord, createOutputArtifact } from "./runtime.telemetry.js";
import { createRuntimeTools } from "./runtime.tools.js";
import { ensureBudgetHeadroom, consumeBudget } from "./runtime.budget.js";

export async function executeManifestAgentRuntime(
  input: RuntimeExecutionInput
): Promise<RuntimeExecutionResult> {
  const resolved = await resolveRuntimeAgent({
    agentId: input.agentId,
    ...(input.catalogAgentId !== undefined ? { catalogAgentId: input.catalogAgentId } : {}),
    tenantId: input.tenantId
  });
  const organizationId =
    input.organizationId ??
    resolved.organizationId ??
    (
      await prisma.organization.findFirst({
        where: {
          tenantId: input.tenantId
        }
      })
    )?.id ??
    null;

  if (!organizationId) {
    throw new Error(`Organization not found for tenant ${input.tenantId}.`);
  }

  const workerConfig = getWorkerConfig();
  const sessionId = readSessionId(input.input);
  const segmentProfile = inferSegmentProfile(input.input, resolved.manifest.tags);
  const sharedLearningKeywords = Array.from(
    new Set([...resolved.manifest.keywords, ...buildSegmentKeywords(segmentProfile)])
  );
  const sharedLearning = await querySharedLearning({
    keywords: sharedLearningKeywords,
    tenantId: input.tenantId
  });
  const managedPolicies = await resolveManagedPolicies({
    installedAgentId: resolved.installedAgentId,
    tenantId: input.tenantId
  });
  const policyEngine = new PolicyEngine(buildRuntimePolicyRules(resolved.manifest, managedPolicies));
  const plan = buildAgentRuntimePlan({
    input: input.input,
    manifest: resolved.manifest,
    sharedLearning,
    tenantId: input.tenantId,
    ...(input.contextSummary !== undefined ? { contextSummary: input.contextSummary } : {})
  });
  const logs = [...plan.logs];
  const actorId = input.userId ?? "system";
  const { costs: toolCostTable, tools: runtimeTools } = createRuntimeTools(
    resolved.manifest,
    policyEngine,
    workerConfig.AGENT_DEFAULT_TOOL_COST_BRL,
    {
      ...(workerConfig.SENDGRID_API_KEY !== undefined
        ? { sendEmailApiKey: workerConfig.SENDGRID_API_KEY }
        : {}),
      ...(workerConfig.EMAIL_FROM_ADDRESS !== undefined
        ? { sendEmailFromEmail: workerConfig.EMAIL_FROM_ADDRESS }
        : {})
    }
  );

  const persistLogs = async (): Promise<void> => {
    await prisma.agentExecution.updateMany({
      data: {
        metadata: {
          logs
        } as Prisma.InputJsonValue
      },
      where: {
        id: input.executionId
      }
    });
  };

  await appendConversationMessage({
    agentId: resolved.runtimeAgentId,
    content: JSON.stringify(input.input),
    correlationId: input.executionId,
    organizationId,
    role: "user",
    sessionId,
    tenantId: input.tenantId
  }).catch(() => undefined);

  await persistLogs();

  const plannedCostBrl = roundCurrency(
    plan.toolCalls.reduce((total, call) => total + (toolCostTable[call.tool] ?? workerConfig.AGENT_DEFAULT_TOOL_COST_BRL), 0)
  );
  await ensureBudgetHeadroom({
    actorId,
    agentId: resolved.runtimeAgentId,
    estimatedCostBrl: plannedCostBrl,
    executionId: input.executionId,
    organizationId,
    tenantId: input.tenantId
  });
  logs.push(`Budget preflight aprovado para custo estimado de R$ ${plannedCostBrl.toFixed(2)}.`);
  await persistLogs();

  const executor = new PlanExecutor({
    circuitBreaker: {
      cooldownMs: workerConfig.AGENT_CIRCUIT_BREAKER_COOLDOWN_MS,
      failureThreshold: workerConfig.AGENT_CIRCUIT_BREAKER_FAILURES
    },
    executionTimeoutMs: workerConfig.AGENT_EXECUTION_TIMEOUT_MS,
    hooks: {
      onPlanBuilt: async (toolCalls) => {
        logs.push(`Planner confirmou ${toolCalls.length} chamada(s) de ferramenta.`);
        await persistLogs();
      },
      onStepCompleted: async (step, context) => {
        logs.push(
          `Step ${context.index}/${context.total} concluido com ${step.call.tool} (R$ ${step.estimatedCostBrl.toFixed(2)}).`
        );
        await persistLogs();
      }
    },
    maxCostBrl: workerConfig.AGENT_MAX_COST_BRL,
    maxPlanSteps: workerConfig.AGENT_MAX_PLAN_STEPS,
    redis: input.redis,
    retryAttempts: workerConfig.AGENT_TOOL_RETRY_ATTEMPTS,
    toolCostEstimator: ({ call }) =>
      toolCostTable[call.tool] ?? workerConfig.AGENT_DEFAULT_TOOL_COST_BRL,
    tools: runtimeTools
  });
  const execution = await executor.execute({
    agentId: resolved.manifest.agent.id,
    executionId: input.executionId,
    input: input.input,
    tenantId: input.tenantId,
    toolCalls: plan.toolCalls.map((call) => ({
      input: call.input,
      tool: call.tool
    }))
  });
  const output = buildAgentRuntimeOutput({
    input: input.input,
    logs,
    manifest: resolved.manifest,
    plan,
    sharedLearning,
    steps: execution.steps
  });
  const budgetState = await consumeBudget({
    actorId,
    agentId: resolved.runtimeAgentId,
    costBrl: execution.estimatedCostBrlTotal,
    executionId: input.executionId,
    organizationId,
    tenantId: input.tenantId
  });
  const learningRecord = buildLearningRecord({
    agentId: resolved.runtimeAgentId,
    manifest: resolved.manifest,
    outputPreview: JSON.stringify(output).slice(0, 400),
    outputSummary: output.summary,
    segmentKeywords: buildSegmentKeywords(segmentProfile),
    tenantId: input.tenantId
  });
  const governanceRequireApproval = output.approvals_or_dependencies.length > 0;
  const outputType = governanceRequireApproval ? "executive-report" : "technical-log";
  const outputArtifactId = await createOutputArtifact({
    content: JSON.stringify(output, null, 2),
    executionId: input.executionId,
    manifest: resolved.manifest,
    organizationId,
    requireApproval: governanceRequireApproval,
    tenantId: input.tenantId,
    type: outputType,
    userId: input.userId ?? null
  });

  await prisma.auditLog.create({
    data: {
      action: "AGENT_LEARNING_PUBLISHED",
      actorId: input.userId ?? null,
      diff: learningRecord as unknown as Prisma.InputJsonValue,
      entityId: learningRecord.id,
      entityType: "agent_learning",
      tenantId: input.tenantId
    }
  });
  await runtimeMemory.publishSharedLearning(input.tenantId, learningRecord);
  await Promise.allSettled([
    runtimeMemory.store(
      input.tenantId,
      resolved.runtimeAgentId,
      `segment-profile:${sessionId ?? input.executionId}`,
      output.segment_profile,
      30 * 24 * 60 * 60
    ),
    runtimeMemory.store(
      input.tenantId,
      resolved.runtimeAgentId,
      `latest-output:${input.executionId}`,
      {
        nextCheckpoint: output.next_checkpoint,
        outputArtifactId,
        segmentProfile: output.segment_profile,
        status: output.status,
        suggestedHandoffs: output.suggested_handoffs,
        summary: output.summary
      },
      30 * 24 * 60 * 60
    ),
    runtimeMemory.store(
      input.tenantId,
      resolved.runtimeAgentId,
      output.memory_writeback.key,
      {
        objective: input.input.objective ?? input.input.task ?? null,
        outputArtifactId,
        segmentProfile: output.segment_profile,
        specialistDeliverables: output.specialist_deliverables,
        summary: output.summary,
        toolResultsCount: execution.steps.length
      },
      output.memory_writeback.ttlHours * 60 * 60
    )
  ]);
  await appendConversationMessage({
    agentId: resolved.runtimeAgentId,
    content: output.summary,
    correlationId: input.executionId,
    organizationId,
    role: "assistant",
    sessionId,
    tenantId: input.tenantId
  }).catch(() => undefined);

  logs.push(`Shared learning ${learningRecord.id} publicado.`);
  logs.push(`Segment memory persisted for ${output.segment_profile.industry}/${output.segment_profile.clientSegment}.`);
  logs.push(`Output artifact ${outputArtifactId} criado automaticamente.`);
  logs.push(
    `Budget consumido: R$ ${execution.estimatedCostBrlTotal.toFixed(2)} (saldo ${budgetState.consumedBrl.toFixed(2)}/${budgetState.limitBrl.toFixed(2)}).`
  );
  await persistLogs();

  const toolCost = execution.estimatedCostBrlTotal;
  const runtimeStatus = governanceRequireApproval ? "WAITING_APPROVAL" : "SUCCESS";
  const metadata = {
    budgetConsumedBrl: budgetState.consumedBrl,
    budgetLimitBrl: budgetState.limitBrl,
    budgetAlertLevel: budgetState.lastAlertLevel,
    catalogAgentId: resolved.manifest.agent.id,
    executionStatus: runtimeStatus,
    learningRecordId: learningRecord.id,
    logs,
    managedPolicies,
    outputArtifactId,
    runtimeProvider: "manifest-runtime",
    plannedCostBrl,
    steps: execution.steps.length,
    toolCost,
    trace: execution.trace
  };

  return {
    learningRecord,
    logs,
    metadata,
    output: output as unknown as Record<string, unknown>,
    outputArtifactId,
    outputHash: computeOutputHash(JSON.stringify(output)),
    status: runtimeStatus,
    toolCost
  };
}
