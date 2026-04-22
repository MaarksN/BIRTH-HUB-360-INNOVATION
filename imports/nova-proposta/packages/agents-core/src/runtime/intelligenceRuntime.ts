import type { AgentManifest } from "../manifest/schema.js";
import type {
  CapabilityType,
  NumericSignalSummary,
  PremiumLayerAssessment,
  PremiumLayerAssessmentInput,
  PremiumLayerOverview,
  PremiumLayerStatus,
  RecommendedAction,
  SegmentProfile
} from "./intelligence.js";
import { PREMIUM_LAYER_LIBRARY } from "./premiumProtocol.js";

type PremiumLayerContext = {
  collaborationTargets: string[];
  governanceRequired: boolean;
  hasMemoryWriteback: boolean;
  objective: string;
  opportunitySignalsDetected: boolean;
  recommendationSignals: number;
  regulatedBonus: number;
  riskSignalsDetected: boolean;
  segmentConfidenceScore: number;
  sharedLearningCount: number;
  textSignals: string[];
  workflowReady: boolean;
};

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

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function toPremiumLayerStatus(score: number): PremiumLayerStatus {
  if (score >= 85) {
    return "elite";
  }

  if (score >= 70) {
    return "strong";
  }

  return "watch";
}

function containsOpportunitySignal(signals: string[]): boolean {
  return signals.some((signal) =>
    /(upsell|cross[- ]sell|expansion|pipeline|lead|roi|growth|efficien|win|upgrade|adoption|campaign)/i.test(
      signal
    )
  );
}

function containsRiskSignal(signals: string[]): boolean {
  return signals.some((signal) =>
    /(risk|churn|incident|critical|breach|drop|delay|blocked|escalat|fraud|complaint|ticket|outage)/i.test(
      signal
    )
  );
}

function getSegmentConfidenceScore(confidence: SegmentProfile["confidence"]): number {
  if (confidence === "high") {
    return 94;
  }

  if (confidence === "medium") {
    return 82;
  }

  return 68;
}

function createPremiumLayerContext(input: PremiumLayerAssessmentInput): PremiumLayerContext {
  const textSignals = input.textSignals ?? [];

  return {
    collaborationTargets: input.collaborationTargets ?? [],
    governanceRequired: input.governanceRequired ?? false,
    hasMemoryWriteback: input.hasMemoryWriteback ?? false,
    objective: input.objective?.trim() ?? "",
    opportunitySignalsDetected:
      containsOpportunitySignal(textSignals) || input.numericSummary.trend === "up",
    recommendationSignals: input.numericSummary.count + textSignals.length,
    regulatedBonus: /regulated/.test(input.segmentProfile.regulation) ? 6 : 0,
    riskSignalsDetected: containsRiskSignal(textSignals) || input.numericSummary.outlierCount > 0,
    segmentConfidenceScore: getSegmentConfidenceScore(input.segmentProfile.confidence),
    sharedLearningCount: input.sharedLearningCount ?? 0,
    textSignals,
    workflowReady: input.workflowReady ?? false
  };
}

function calculatePillarBaseScore(
  pillarId: string,
  input: PremiumLayerAssessmentInput,
  context: PremiumLayerContext
): number {
  switch (pillarId) {
    case "signal-fusion":
      return (
        56 +
        Math.min(input.numericSummary.count * 4, 16) +
        Math.min(context.textSignals.length * 2, 12) +
        (input.numericSummary.outlierCount > 0 ? 4 : 0)
      );
    case "evidence-confidence":
      return (
        58 +
        Math.floor((context.segmentConfidenceScore - 60) / 6) +
        Math.min(context.sharedLearningCount * 3, 12) +
        (context.objective ? 4 : 0)
      );
    case "decision-intelligence":
      return (
        57 +
        (context.objective ? 8 : 2) +
        Math.min(context.recommendationSignals * 2, 18) +
        (context.governanceRequired ? 4 : 0)
      );
    case "risk-governance":
      return (
        58 +
        (context.riskSignalsDetected ? 12 : 4) +
        Math.min(input.numericSummary.outlierCount * 6, 18) +
        context.regulatedBonus +
        (context.governanceRequired ? 6 : 0)
      );
    case "opportunity-orchestration":
      return (
        55 +
        (context.opportunitySignalsDetected ? 13 : 5) +
        (input.numericSummary.trend === "up" ? 8 : 0) +
        Math.min(context.textSignals.length, 8)
      );
    case "segment-communication":
      return (
        56 +
        Math.floor((context.segmentConfidenceScore - 60) / 5) +
        (context.objective ? 5 : 0) +
        Math.min(context.textSignals.length, 6)
      );
    case "collaboration-handoff":
      return (
        54 +
        Math.min(context.collaborationTargets.length * 6, 24) +
        (context.workflowReady ? 8 : 0) +
        (context.governanceRequired ? 4 : 0)
      );
    case "workflow-execution":
      return (
        56 +
        (context.workflowReady ? 16 : 4) +
        (input.triggerSource ? 8 : 0) +
        (context.hasMemoryWriteback ? 4 : 0)
      );
    case "resilience-recovery":
      return (
        55 +
        (context.riskSignalsDetected ? 8 : 3) +
        (context.governanceRequired ? 8 : 0) +
        Math.min(input.numericSummary.outlierCount * 4, 12) +
        (context.hasMemoryWriteback ? 4 : 0)
      );
    case "memory-learning":
      return (
        56 +
        (context.hasMemoryWriteback ? 12 : 0) +
        Math.min(context.sharedLearningCount * 5, 20) +
        Math.floor((context.segmentConfidenceScore - 60) / 8)
      );
    default:
      return 60;
  }
}

function calculateSublayerModifier(
  sublayerId: string,
  input: PremiumLayerAssessmentInput,
  context: PremiumLayerContext
): number {
  switch (sublayerId) {
    case "baseline-control":
      return input.numericSummary.count > 0 ? 5 : 1;
    case "anomaly-isolation":
      return context.riskSignalsDetected || input.numericSummary.outlierCount > 0 ? 7 : 2;
    case "context-anchoring":
      return context.objective && context.textSignals.length > 0 ? 6 : 3;
    case "confidence-grading":
      return Math.floor((context.segmentConfidenceScore - 60) / 8);
    case "priority-queueing":
      return Math.min(Math.max(context.recommendationSignals - 1, 0), 7);
    case "narrative-clarity":
      return (context.objective ? 4 : 1) + Math.min(context.textSignals.length, 4);
    case "timing-orchestration":
      return (context.workflowReady ? 6 : 2) + (input.triggerSource ? 3 : 0);
    case "escalation-readiness":
      return context.governanceRequired || context.riskSignalsDetected ? 7 : 2;
    case "control-integrity":
      return context.regulatedBonus + (context.hasMemoryWriteback ? 3 : 0);
    case "learning-loop":
      return Math.min(context.sharedLearningCount * 3, 9) + (context.hasMemoryWriteback ? 3 : 0);
    default:
      return 0;
  }
}

function buildLayerNextAction(
  definition: (typeof PREMIUM_LAYER_LIBRARY)[number],
  input: PremiumLayerAssessmentInput,
  context: PremiumLayerContext
): string {
  const segment = `${input.segmentProfile.industry}/${input.segmentProfile.clientSegment}`;
  const objective = context.objective || "o objetivo atual";

  switch (definition.sublayerId) {
    case "baseline-control":
      return `Refinar baseline historico por tenant para ${objective} no segmento ${segment}.`;
    case "anomaly-isolation":
      return `Isolar desvio material e validar se exige resposta imediata para ${segment}.`;
    case "context-anchoring":
      return `Ancorar a leitura de ${definition.pillarName} em restricoes reais, janela e dono da decisao.`;
    case "confidence-grading":
      return `Explicitar melhor o nivel de confianca, lacunas e validacoes pendentes antes do proximo movimento.`;
    case "priority-queueing":
      return `Reordenar backlog decisorio para atacar primeiro o que destrava ${objective}.`;
    case "narrative-clarity":
      return `Resumir a leitura em linguagem executiva clara, sem perder nuance nem rastreabilidade.`;
    case "timing-orchestration":
      return `Ajustar checkpoint, deadline e gatilho operacional para ${definition.pillarName}.`;
    case "escalation-readiness":
      return `Preparar escalacao enxuta com contexto, risco, opcao recomendada e pedido objetivo.`;
    case "control-integrity":
      return `Reforcar trilha de auditoria, limites e aprovacoes antes da proxima acao sensivel.`;
    case "learning-loop":
      return `Registrar aprendizado reutilizavel e memoria premium para elevar o proximo ciclo.`;
    default:
      return `Reforcar ${definition.name.toLowerCase()} sem degradar governanca nem clareza.`;
  }
}

function buildLayerSummary(
  definition: (typeof PREMIUM_LAYER_LIBRARY)[number],
  input: PremiumLayerAssessmentInput,
  context: PremiumLayerContext
): string {
  return [
    `${definition.name} reforca ${definition.purpose}`,
    `com ${input.numericSummary.count} sinal(is) numerico(s) e ${context.textSignals.length} evidencia(s) textual(is)`,
    `para ${input.segmentProfile.industry}/${input.segmentProfile.clientSegment}.`
  ].join(" ");
}

export function buildPremiumLayersAssessment(
  input: PremiumLayerAssessmentInput
): PremiumLayerAssessment[] {
  const context = createPremiumLayerContext(input);

  return PREMIUM_LAYER_LIBRARY.map((definition, index) => {
    const pillarScore = calculatePillarBaseScore(definition.pillarId, input, context);
    const sublayerScore = calculateSublayerModifier(definition.sublayerId, input, context);
    const dispersion = ((index % 5) - 2) * 2;
    const score = clampScore(pillarScore + sublayerScore + dispersion);

    return {
      id: definition.id,
      name: definition.name,
      nextAction: buildLayerNextAction(definition, input, context),
      score,
      status: toPremiumLayerStatus(score),
      summary: buildLayerSummary(definition, input, context)
    };
  });
}

export function summarizePremiumLayers(layers: PremiumLayerAssessment[]): PremiumLayerOverview {
  if (layers.length === 0) {
    return {
      needsAttention: [],
      overallScore: 0,
      standoutLayers: []
    };
  }

  const overallScore =
    layers.reduce((total, layer) => total + layer.score, 0) / Math.max(layers.length, 1);

  return {
    needsAttention: layers
      .filter((layer) => layer.status === "watch")
      .map((layer) => layer.name)
      .slice(0, 6),
    overallScore: clampScore(overallScore),
    standoutLayers: layers
      .filter((layer) => layer.status === "elite")
      .map((layer) => layer.name)
      .slice(0, 6)
  };
}

export function inferCapabilityType(input: {
  description?: string;
  id?: string;
  name?: string;
}): CapabilityType {
  const corpus = `${input.id ?? ""} ${input.name ?? ""} ${input.description ?? ""}`.toLowerCase();

  if (/(handoff|delegate|agent|collab|partner|thread)/.test(corpus)) {
    return "collaboration";
  }

  if (/(memory|history|knowledge|vault|save|store|context)/.test(corpus)) {
    return "memory";
  }

  if (/(segment|persona|vertical|industry|tier|localiz|adapt)/.test(corpus)) {
    return "segment-adaptation";
  }

  if (/(data|sql|anal|detect|monitor|model|aggreg|process|validator|mapper|estimator)/.test(corpus)) {
    return "data-processing";
  }

  if (/(recommend|optimi|advisor|allocator|score|forecast|priorit|next best)/.test(corpus)) {
    return "recommendation";
  }

  return "execution";
}

export function describeCapabilityIntent(capabilityType: CapabilityType): string {
  switch (capabilityType) {
    case "collaboration":
      return "alinhar especialistas, transferir contexto e coordenar a proxima etapa";
    case "data-processing":
      return "processar sinais quantitativos e qualitativos para achar padroes acionaveis";
    case "memory":
      return "registrar contexto reutilizavel e preservar continuidade operacional";
    case "recommendation":
      return "priorizar a melhor decisao ou acao para o contexto atual";
    case "segment-adaptation":
      return "ajustar linguagem, sugestao e plano ao segmento do cliente";
    default:
      return "executar a etapa operacional com governanca e rastreabilidade";
  }
}

export function inferCollaborationTargets(manifest: AgentManifest): string[] {
  const targets = [
    ...manifest.keywords.filter((keyword) =>
      /(planner|implementer|reviewer|analyst|manager|architect|engineer|concierge)/i.test(keyword)
    ),
    ...manifest.tags.domain.map((domain) => `${domain}-specialist`)
  ];

  const normalized = targets.map((target) => slugify(target).replace(/-/g, " "));
  return uniqueStrings(normalized).slice(0, 5);
}

export function buildRecommendedActions(input: {
  capabilityType: CapabilityType;
  collaborationTargets?: string[];
  numericSummary: NumericSignalSummary;
  objective?: string | null;
  segmentProfile: SegmentProfile;
  textSignals?: string[];
}): RecommendedAction[] {
  const actions: RecommendedAction[] = [];
  const objective = input.objective?.trim() || "avancar o objetivo principal";
  const topEvidence = input.textSignals?.[0] ?? "contexto operacional atual";

  actions.push({
    action: `Priorizar uma recomendacao para ${objective} considerando o segmento ${input.segmentProfile.clientSegment}.`,
    priority: "now",
    reason: `O agente deve agir com contexto moldado para ${input.segmentProfile.industry} e ${input.segmentProfile.geography}.`
  });

  if (input.numericSummary.count > 0) {
    actions.push({
      action: `Usar ${input.numericSummary.count} sinais numericos para validar tendencia ${input.numericSummary.trend}.`,
      priority: input.numericSummary.outlierCount > 0 ? "now" : "next",
      reason:
        input.numericSummary.outlierCount > 0
          ? `Existem ${input.numericSummary.outlierCount} outlier(s) que podem esconder risco ou oportunidade.`
          : `A base numerica sustenta a recomendacao com media ${input.numericSummary.average}.`
    });
  }

  if (input.capabilityType === "memory") {
    actions.push({
      action: "Salvar memoria operacional reutilizavel com contexto, decisao e proximo checkpoint.",
      priority: "next",
      reason: "Persistencia aumenta continuidade, reaproveitamento e qualidade do proximo ciclo."
    });
  }

  if (input.capabilityType === "collaboration" || (input.collaborationTargets?.length ?? 0) > 0) {
    actions.push({
      action: `Preparar handoff estruturado para ${input.collaborationTargets?.[0] ?? "outro especialista"}.`,
      priority: "next",
      reason: `A colaboracao multiagente acelera resolucao e reduz perda de contexto sobre '${topEvidence}'.`
    });
  }

  if (input.capabilityType === "segment-adaptation") {
    actions.push({
      action: "Reescrever a recomendacao na linguagem, objecoes e maturidade do cliente alvo.",
      priority: "now",
      reason: "Adaptacao ao segmento aumenta aderencia, conversao e qualidade da decisao."
    });
  }

  return actions.slice(0, 4);
}

export function buildMemoryKey(
  agentId: string,
  segmentProfile: SegmentProfile,
  suffix: string
): string {
  return uniqueStrings([
    "memory",
    slugify(agentId),
    slugify(segmentProfile.industry),
    slugify(segmentProfile.clientSegment),
    slugify(suffix)
  ]).join(":");
}
