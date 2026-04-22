import type { AgentManifest } from "../manifest/schema.js";

export const GLOBAL_PREMIUM_PROTOCOL_MARKER = "PROTOCOLO PREMIUM GLOBAL 100";
export const GLOBAL_PREMIUM_CHANGELOG_ENTRY =
  "Runtime premiumized with 100 layered communication, decision and execution protocol.";

type PremiumPillarDefinition = {
  id: string;
  name: string;
  purpose: string;
};

type PremiumSublayerDefinition = {
  id: string;
  name: string;
  purpose: string;
};

export interface PremiumLayerDefinition {
  id: string;
  name: string;
  pillarId: string;
  pillarName: string;
  purpose: string;
  sublayerId: string;
  sublayerName: string;
}

export const PREMIUM_PILLARS: PremiumPillarDefinition[] = [
  {
    id: "signal-fusion",
    name: "Signal Fusion",
    purpose: "ler sinais numericos, textuais e contextuais como um sistema unico antes de concluir"
  },
  {
    id: "evidence-confidence",
    name: "Evidence Confidence",
    purpose: "qualificar evidencia, confianca e lacunas antes de recomendar qualquer movimento"
  },
  {
    id: "decision-intelligence",
    name: "Decision Intelligence",
    purpose: "transformar diagnostico em decisao clara, reversivel quando possivel e priorizada"
  },
  {
    id: "risk-governance",
    name: "Risk Governance",
    purpose: "antecipar risco material, reforcar controle e respeitar governanca sensivel"
  },
  {
    id: "opportunity-orchestration",
    name: "Opportunity Orchestration",
    purpose: "capturar upside, eficiencia e timing competitivo antes da janela fechar"
  },
  {
    id: "segment-communication",
    name: "Segment Communication",
    purpose: "adaptar linguagem, framing e narrativa ao perfil do decisor e do cliente"
  },
  {
    id: "collaboration-handoff",
    name: "Collaboration Handoff",
    purpose: "sincronizar especialistas, dependencias e contexto sem ruido de transicao"
  },
  {
    id: "workflow-execution",
    name: "Workflow Execution",
    purpose: "converter intencao em execucao rastreavel, automatizavel e monitorada"
  },
  {
    id: "resilience-recovery",
    name: "Resilience Recovery",
    purpose: "operar com fallback seguro, continuidade e recuperacao controlada sob falha parcial"
  },
  {
    id: "memory-learning",
    name: "Memory Learning",
    purpose: "preservar memoria operacional e aprendizado reutilizavel por tenant"
  }
];

export const PREMIUM_SUBLAYERS: PremiumSublayerDefinition[] = [
  {
    id: "baseline-control",
    name: "Baseline Control",
    purpose: "firmar baseline antes de reagir a oscilacoes isoladas"
  },
  {
    id: "anomaly-isolation",
    name: "Anomaly Isolation",
    purpose: "separar ruido, desvio, excecao e impacto material"
  },
  {
    id: "context-anchoring",
    name: "Context Anchoring",
    purpose: "ancorar a leitura no contexto operacional, historico e restricoes reais"
  },
  {
    id: "confidence-grading",
    name: "Confidence Grading",
    purpose: "graduar certeza, incerteza e necessidade de verificacao adicional"
  },
  {
    id: "priority-queueing",
    name: "Priority Queueing",
    purpose: "ordenar o que fazer agora, depois e o que deve esperar"
  },
  {
    id: "narrative-clarity",
    name: "Narrative Clarity",
    purpose: "comunicar a leitura com clareza, concisao e impacto executivo"
  },
  {
    id: "timing-orchestration",
    name: "Timing Orchestration",
    purpose: "sincronizar janela, checkpoint e cadencia da acao"
  },
  {
    id: "escalation-readiness",
    name: "Escalation Readiness",
    purpose: "preparar escalacao quando houver irreversibilidade, sensibilidade ou baixa confianca"
  },
  {
    id: "control-integrity",
    name: "Control Integrity",
    purpose: "preservar rastreabilidade, politicas, limites e integridade da execucao"
  },
  {
    id: "learning-loop",
    name: "Learning Loop",
    purpose: "fechar o ciclo entre resultado, memoria e ajuste do proximo movimento"
  }
];

export const PREMIUM_LAYER_LIBRARY: PremiumLayerDefinition[] = PREMIUM_PILLARS.flatMap((pillar) =>
  PREMIUM_SUBLAYERS.map((sublayer) => ({
    id: `${pillar.id}-${sublayer.id}`,
    name: `${pillar.name} ${sublayer.name}`,
    pillarId: pillar.id,
    pillarName: pillar.name,
    purpose: `${sublayer.purpose} enquanto ${pillar.purpose}.`,
    sublayerId: sublayer.id,
    sublayerName: sublayer.name
  }))
);

export const TOTAL_PREMIUM_LAYER_COUNT = PREMIUM_LAYER_LIBRARY.length;

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

export function renderGlobalPremiumPromptAppendix(agentName?: string): string {
  const label = agentName?.trim() || "Este agente";

  return [
    GLOBAL_PREMIUM_PROTOCOL_MARKER,
    `- ${label} opera com ${TOTAL_PREMIUM_LAYER_COUNT} camadas premium distribuidas em ${PREMIUM_PILLARS.length} pilares, com ${PREMIUM_SUBLAYERS.length} subcamadas por pilar.`,
    "- Este protocolo reforca o contrato original do agente. Nao substitui schemas, guardrails, ferramentas ou eventos especificos do manifesto.",
    "",
    "PILARES PREMIUM",
    ...PREMIUM_PILLARS.map(
      (pillar) => `- ${pillar.name}: ${pillar.purpose}.`
    ),
    "",
    "COMUNICACAO PREMIUM",
    "- abrir com uma leitura executiva objetiva do que esta acontecendo e por que importa agora",
    "- separar fato, inferencia, lacuna e hipotese sem misturar niveis de certeza",
    "- adaptar linguagem, profundidade e framing ao segmento, maturidade e perfil do decisor",
    "- explicitar risco, oportunidade, impacto, confianca e trade-off sem prolixidade",
    "- fechar sempre com decisao recomendada, proximo passo, dono e checkpoint",
    "- manter tom profissional, claro, assertivo, respeitoso e sem teatralidade",
    "",
    "DECISAO PREMIUM",
    "- medir irreversibilidade, urgencia, dependencia critica, risco e custo de atraso antes de agir",
    "- preferir a menor acao segura que aumenta opcionalidade executiva",
    "- nunca recomendar movimento material sem evidencia suficiente e sem dizer o nivel de confianca",
    "- escalar quando houver risco alto, baixa confianca ou necessidade de aprovacao humana",
    "- preservar rastreabilidade da recomendacao e registrar o aprendizado reaproveitavel"
  ].join("\n");
}

export function enhanceManifestWithPremiumProtocol(manifest: AgentManifest): AgentManifest {
  const prompt = manifest.agent.prompt.includes(GLOBAL_PREMIUM_PROTOCOL_MARKER)
    ? manifest.agent.prompt
    : `${manifest.agent.prompt}\n\n${renderGlobalPremiumPromptAppendix(manifest.agent.name)}`;
  const changelog = manifest.agent.changelog.includes(GLOBAL_PREMIUM_CHANGELOG_ENTRY)
    ? manifest.agent.changelog
    : [...manifest.agent.changelog, GLOBAL_PREMIUM_CHANGELOG_ENTRY];
  const keywords = uniqueStrings([
    ...manifest.keywords,
    "premium-100",
    "communication-premium",
    "decision-intelligence",
    "risk-aware-execution",
    "tenant-safe-learning"
  ]);

  return {
    ...manifest,
    agent: {
      ...manifest.agent,
      changelog,
      prompt
    },
    keywords
  };
}
