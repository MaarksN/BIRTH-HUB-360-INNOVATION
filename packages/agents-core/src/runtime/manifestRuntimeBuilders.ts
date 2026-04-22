import type { AgentRuntimeOutput, AgentRuntimeOutputInput } from "./manifestRuntime.js";
import {
  buildEmergingRisks,
  buildLeadingIndicators,
  buildOutputConfidence,
  buildPreventiveActionPlan,
  buildStatus,
  deriveSpecialistDeliverables,
  hasWorkflowContext,
  inferOutputGovernance,
  isRecord,
  normalizeJsonValue,
  readObjective,
  readPrimaryOwner,
  readTriggerSource,
  summarizeLearning,
  uniqueStrings
} from "./manifestRuntimeCore.js";
import {
  buildMemoryKey,
  buildPremiumLayersAssessment,
  buildRecommendedActions,
  inferCollaborationTargets,
  inferSegmentProfile,
  readNumericSignals,
  readTextSignals,
  summarizeNumericSignals,
  summarizePremiumLayers,
  type SegmentProfile
} from "./intelligence.js";

type AgentOrchestrationPlan = NonNullable<AgentRuntimeOutput["orchestration_plan"]>;
type RecommendedAgent = AgentOrchestrationPlan["recommended_agents"][number];
type WorkflowStep = AgentOrchestrationPlan["workflow_steps"][number];

function collectFocusDomains(output: Record<string, unknown>, focusDomains: string[]): void {
  if (!Array.isArray(output.focusDomains)) {
    return;
  }

  for (const value of output.focusDomains) {
    if (typeof value === "string") {
      focusDomains.push(value);
    }
  }
}

function collectRecommendedAgents(
  output: Record<string, unknown>,
  recommendedAgents: RecommendedAgent[]
): void {
  if (!Array.isArray(output.specialistLineup)) {
    return;
  }

  for (const value of output.specialistLineup) {
    if (
      isRecord(value) &&
      typeof value.agentId === "string" &&
      typeof value.name === "string" &&
      typeof value.reason === "string"
    ) {
      recommendedAgents.push({
        agent_id: value.agentId,
        domain: typeof value.domain === "string" ? value.domain : "unknown",
        name: value.name,
        reason: value.reason,
        use_case: typeof value.useCase === "string" ? value.useCase : "general"
      });
    }
  }
}

function collectWorkflowSteps(output: Record<string, unknown>, workflowSteps: WorkflowStep[]): void {
  if (!Array.isArray(output.workflowPlan)) {
    return;
  }

  for (const value of output.workflowPlan) {
    if (!isRecord(value) || typeof value.agentId !== "string") {
      continue;
    }

    workflowSteps.push({
      agent_id: value.agentId,
      expected_outcome:
        typeof value.expectedOutcome === "string"
          ? value.expectedOutcome
          : "Executar a etapa especializada.",
      order: typeof value.order === "number" ? value.order : workflowSteps.length + 1,
      reason: typeof value.reason === "string" ? value.reason : "Etapa sugerida pelo agent mesh."
    });
  }
}

function readApprovalRecommendation(output: Record<string, unknown>): {
  approvalReason: string;
  approvalRequired: boolean;
} {
  if (!isRecord(output.approvalRecommendation)) {
    return { approvalReason: "", approvalRequired: false };
  }

  return {
    approvalReason:
      typeof output.approvalRecommendation.reason === "string"
        ? output.approvalRecommendation.reason
        : "",
    approvalRequired: Boolean(output.approvalRecommendation.required)
  };
}

function dedupeRecommendedAgents(recommendedAgents: RecommendedAgent[]): RecommendedAgent[] {
  return uniqueStrings(recommendedAgents.map((item) => `${item.agent_id}:${item.name}`))
    .map((key) => {
      const [agentId] = key.split(":");
      return recommendedAgents.find((item) => item.agent_id === agentId)!;
    })
    .slice(0, 5);
}

function readMeshBlueprint(
  steps: AgentRuntimeOutputInput["steps"]
): AgentRuntimeOutput["orchestration_plan"] {
  const focusDomains: string[] = [];
  const recommendedAgents: RecommendedAgent[] = [];
  const workflowSteps: WorkflowStep[] = [];
  let approvalRequired = false;
  let approvalReason = "";

  for (const step of steps) {
    if (!isRecord(step.output)) {
      continue;
    }

    collectFocusDomains(step.output, focusDomains);
    collectRecommendedAgents(step.output, recommendedAgents);
    collectWorkflowSteps(step.output, workflowSteps);

    const recommendation = readApprovalRecommendation(step.output);
    approvalRequired = approvalRequired || recommendation.approvalRequired;
    if (!approvalReason && recommendation.approvalReason) {
      approvalReason = recommendation.approvalReason;
    }
  }

  if (recommendedAgents.length === 0 && workflowSteps.length === 0) {
    return null;
  }

  return {
    approval_reason: approvalReason || "Fluxo multiagente sem necessidade adicional de aprovacao.",
    approval_required: approvalRequired,
    focus_domains: uniqueStrings(focusDomains).slice(0, 5),
    recommended_agents: dedupeRecommendedAgents(recommendedAgents),
    workflow_steps: workflowSteps.sort((left, right) => left.order - right.order).slice(0, 5)
  };
}

function buildSuggestedHandoffs(
  input: {
    manifest: AgentRuntimeOutputInput["manifest"];
    collaborationTargets: string[];
    segmentProfile: SegmentProfile;
  }
): AgentRuntimeOutput["suggested_handoffs"] {
  const manifestSupportsHandoff = input.manifest.tools.some((tool) =>
    /(agent|handoff|delegate)/i.test(`${tool.id} ${tool.name}`)
  );

  if (!manifestSupportsHandoff && input.collaborationTargets.length === 0) {
    return [];
  }

  const targets =
    input.collaborationTargets.length > 0
      ? input.collaborationTargets
      : input.manifest.tags.domain.map((domain) => `${domain}-specialist`);

  return uniqueStrings(targets).slice(0, 3).map((target) => ({
    payload_focus: `${input.segmentProfile.industry} ${input.segmentProfile.clientSegment}`.trim(),
    reason: `Compartilhar contexto do segmento ${input.segmentProfile.clientSegment} e preservar continuidade da execucao.`,
    target
  }));
}

function buildDecisionsToAnticipate(input: {
  owner: string;
  recommendedAction: string;
  suggestedHandoffs: AgentRuntimeOutput["suggested_handoffs"];
}): AgentRuntimeOutput["decisions_to_anticipate"] {
  const decisions: AgentRuntimeOutput["decisions_to_anticipate"] = [
    {
      decision: "Publicar ou acionar o proximo passo recomendado",
      due_window: "Proxima janela operacional",
      owner: input.owner,
      recommended_action: input.recommendedAction,
      why_now: "A execucao terminou com sinais suficientes para uma decisao operacional."
    }
  ];

  const firstHandoff = input.suggestedHandoffs[0];
  if (firstHandoff) {
    decisions.push({
      decision: `Definir se o fluxo deve seguir para ${firstHandoff.target}`,
      due_window: "Ainda neste ciclo",
      owner: input.owner,
      recommended_action: `Enviar handoff com foco em ${firstHandoff.payload_focus}.`,
      why_now: firstHandoff.reason
    });
  }

  return decisions;
}

function buildOpportunitiesToCapture(input: {
  segmentProfile: SegmentProfile;
  sharedLearningCount: number;
  standoutLayers: string[];
  suggestedHandoffs: AgentRuntimeOutput["suggested_handoffs"];
  trend: string;
}): string[] {
  return uniqueStrings([
    `Adaptar o plano para ${input.segmentProfile.industry} com linguagem especifica de ${input.segmentProfile.clientSegment}.`,
    input.suggestedHandoffs.length > 0
      ? `Acelerar resolucao com handoff para ${input.suggestedHandoffs[0]?.target}.`
      : "",
    input.standoutLayers.length > 0
      ? `Escalar as camadas premium mais fortes: ${input.standoutLayers.join(", ")}.`
      : "",
    input.sharedLearningCount > 0
      ? "Reaproveitar aprendizado compartilhado validado no mesmo tenant."
      : "Registrar aprendizado novo para fortalecer os proximos ciclos.",
    input.trend === "up" ? "Capturar a tendencia positiva antes que a janela competitiva feche." : ""
  ]).slice(0, 4);
}

export function buildAgentRuntimeOutput(input: AgentRuntimeOutputInput): AgentRuntimeOutput {
  const owner = readPrimaryOwner(input.input);
  const objective = readObjective(input.input);
  const sharedLearning = input.sharedLearning ?? [];
  const governance = inferOutputGovernance({ manifest: input.manifest, plan: input.plan });
  const segmentProfile = inferSegmentProfile(input.input, input.manifest.tags);
  const combinedNumericSignals = readNumericSignals([input.input, ...input.steps.map((step) => step.output)]);
  const combinedTextSignals = readTextSignals([input.input, ...input.steps.map((step) => step.output)], 12);
  const numericSummary = summarizeNumericSignals(combinedNumericSignals);
  const collaborationTargets = inferCollaborationTargets(input.manifest);
  const orchestrationPlan = readMeshBlueprint(input.steps);
  const suggestedHandoffs = buildSuggestedHandoffs({
    collaborationTargets,
    manifest: input.manifest,
    segmentProfile
  });
  const specialistDeliverables = orchestrationPlan?.workflow_steps.length
    ? uniqueStrings([
        ...orchestrationPlan.workflow_steps.map((step) => `${step.order}. ${step.agent_id}`),
        ...deriveSpecialistDeliverables(input.manifest)
      ]).slice(0, 6)
    : deriveSpecialistDeliverables(input.manifest);
  const recommendedActions = buildRecommendedActions({
    capabilityType: "recommendation",
    collaborationTargets,
    numericSummary,
    objective,
    segmentProfile,
    textSignals: combinedTextSignals
  });
  const premiumLayers = buildPremiumLayersAssessment({
    collaborationTargets,
    governanceRequired: governance.requireApproval || Boolean(orchestrationPlan?.approval_required),
    hasMemoryWriteback: true,
    numericSummary,
    objective,
    segmentProfile,
    sharedLearningCount: sharedLearning.length,
    textSignals: combinedTextSignals,
    triggerSource: readTriggerSource(input.input),
    workflowReady: Boolean(orchestrationPlan?.workflow_steps.length) || hasWorkflowContext(input.input)
  });
  const premiumOverview = summarizePremiumLayers(premiumLayers);
  const summary = `${input.manifest.agent.name} concluiu a execucao live para ${segmentProfile.industry}/${segmentProfile.clientSegment}, processou ${numericSummary.count} sinal(is) numerico(s), capturou ${combinedTextSignals.length} evidencia(s) textual(is), deixou memoria pronta para reutilizacao e ativou ${premiumLayers.length} camadas premium com operating score de ${premiumOverview.overallScore}/100.`;

  return {
    agent_id: input.manifest.agent.id,
    approvals_or_dependencies: governance.requireApproval
      ? ["Aprovacao humana recomendada antes de compartilhar externamente."]
      : [],
    confidence: buildOutputConfidence(segmentProfile, sharedLearning.length, numericSummary.count),
    decisions_to_anticipate: buildDecisionsToAnticipate({
      owner,
      recommendedAction:
        recommendedActions[0]?.action ?? "Executar o proximo passo priorizado pelo agente.",
      suggestedHandoffs
    }),
    emerging_risks: buildEmergingRisks({
      governance,
      numericOutliers: numericSummary.outlierCount,
      premiumNeedsAttention: premiumOverview.needsAttention,
      segmentConfidence: segmentProfile.confidence
    }),
    executionMode: "LIVE",
    leading_indicators: buildLeadingIndicators({
      orchestrationPlan,
      overallScore: premiumOverview.overallScore,
      plan: input.plan,
      segmentProfile,
      signalCount: numericSummary.count,
      trend: numericSummary.trend
    }),
    learning_used: summarizeLearning(sharedLearning),
    memory_writeback: {
      key: buildMemoryKey(input.manifest.agent.id, segmentProfile, "latest-output"),
      reason:
        "Persistir resumo executivo, perfil de segmento e proximo checkpoint para continuidade entre agentes.",
      ttlHours: 24 * 30,
      value_preview: summary.slice(0, 220)
    },
    next_checkpoint: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    orchestration_plan: orchestrationPlan,
    opportunities_to_capture: buildOpportunitiesToCapture({
      segmentProfile,
      sharedLearningCount: sharedLearning.length,
      standoutLayers: premiumOverview.standoutLayers,
      suggestedHandoffs,
      trend: numericSummary.trend
    }),
    premium_layers: premiumLayers,
    premium_score: premiumOverview.overallScore,
    preventive_action_plan: buildPreventiveActionPlan(owner, recommendedActions),
    segment_profile: segmentProfile,
    sharedLearningCount: sharedLearning.length,
    specialist_deliverables: specialistDeliverables,
    status: buildStatus({
      governance,
      numericOutliers: numericSummary.outlierCount,
      segmentConfidence: segmentProfile.confidence,
      sharedLearningCount: sharedLearning.length
    }),
    suggested_handoffs: suggestedHandoffs,
    summary,
    tool_results: input.steps.map((step) => ({
      finishedAt: step.finishedAt,
      output: normalizeJsonValue(step.output),
      startedAt: step.startedAt,
      tool: step.call.tool
    }))
  };
}
