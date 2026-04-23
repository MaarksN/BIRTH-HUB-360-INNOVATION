import type { AgentManifest } from "../manifest/schema.js";

export const GLOBAL_PREMIUM_PROTOCOL_MARKER = "PROTOCOLO PREMIUM GLOBAL 100";
export const COMMON_PREMIUM_PROTOCOL_MARKER = "PROTOCOLO PREMIUM COMUM";
export const GLOBAL_PREMIUM_CHANGELOG_ENTRY =
  "Runtime premiumized with 100 layered communication, decision and execution protocol.";
export const SHARED_LEARNING_CLAUSE = "Todo agente aprende com todo agente.";
export const AUTONOMOUS_OPERATION_CLAUSE = "operar de forma autonoma dentro do escopo permitido";
export const PREVENTIVE_ALERT_CLAUSE =
  "nunca esperar um risco relevante virar incidente para alertar";
export const EVIDENCE_CONFIDENCE_CLAUSE =
  "separar fato, inferencia, lacuna e hipotese sem misturar niveis de certeza";
export const APPROVAL_GOVERNANCE_CLAUSE =
  "escalar quando houver risco alto, baixa confianca ou necessidade de aprovacao humana";
export const HANDOFF_CONTEXT_CLAUSE =
  "preparar handoff estruturado com objetivo, contexto, evidencias, lacunas, dono e checkpoint";

export const COMMON_AUTONOMOUS_KEYWORDS = [
  "automacao preventiva",
  "analise proativa",
  "sinais lideres",
  "deteccao de anomalias",
  "antecipacao de decisao",
  "alerta antecipado",
  "mitigacao preventiva",
  "next best action",
  "scenario planning",
  "risk radar",
  "premium-100",
  "trigger ingress"
];

export const COMMON_AUTONOMOUS_SKILLS = [
  {
    description:
      "Detectar cedo sinais lideres, anomalias, gargalos e riscos emergentes antes que virem incidente ou perda material.",
    name: "Radar Preventivo"
  },
  {
    description:
      "Antecipar decisoes que precisam ser tomadas nos proximos ciclos e propor a melhor acao dentro da janela ideal.",
    name: "Antecipacao de Decisao"
  },
  {
    description:
      "Transformar risco ou oportunidade em plano acionavel com prioridade, dono, prazo, checkpoint e criterio de escalacao.",
    name: "Plano Preventivo"
  }
];

export const COMMON_AUTONOMOUS_OUTPUTS = [
  "alertas preventivos priorizados",
  "decisoes que precisam ser antecipadas",
  "plano preventivo com dono, prazo e checkpoint",
  "oportunidades capturaveis antes da janela fechar"
];

export const COMMON_AUTONOMOUS_GUARDRAILS = [
  "nunca esperar um risco relevante virar incidente para alertar",
  "nunca deixar dependencia critica sem dono, prazo ou checkpoint",
  "sempre explicitar impacto, urgencia, reversibilidade e confianca",
  "sempre antecipar o que pode dar errado e o que pode ser capturado antes da janela fechar",
  "nunca misturar dados entre tenants",
  "nunca afirmar certeza quando a confianca for baixa",
  "sempre registrar motivo, proximo passo e risco relevante"
];

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

export const REQUIRED_RUNTIME_PROMPT_SECTION_GROUPS = [
  { label: "IDENTIDADE E MISSAO", anyOf: ["IDENTIDADE E MISSAO"] },
  { label: "QUANDO USAR", anyOf: ["QUANDO ACIONAR", "QUANDO USAR"] },
  { label: "ENTRADAS OBRIGATORIAS", anyOf: ["ENTRADAS OBRIGATORIAS"] },
  { label: "RACIOCINIO OPERACIONAL ESPERADO", anyOf: ["RACIOCINIO OPERACIONAL ESPERADO"] },
  { label: "MODO DE OPERACAO AUTONOMA", anyOf: ["MODO DE OPERACAO AUTONOMA"] },
  {
    label: "ROTINA DE MONITORAMENTO E ANTECIPACAO",
    anyOf: ["ROTINA DE MONITORAMENTO E ANTECIPACAO"]
  },
  { label: "CRITERIOS DE PRIORIZACAO", anyOf: ["CRITERIOS DE PRIORIZACAO"] },
  { label: "CRITERIOS DE ESCALACAO", anyOf: ["CRITERIOS DE ESCALACAO"] },
  { label: "OBJETIVO", anyOf: ["OBJETIVOS PRIORITARIOS", "OBJETIVO"] },
  { label: "FERRAMENTAS REAIS", anyOf: ["FERRAMENTAS ESPERADAS", "FERRAMENTAS REAIS"] },
  { label: "SAIDA ESPERADA", anyOf: ["SAIDAS OBRIGATORIAS", "SAIDA ESPERADA"] },
  { label: "GUARDRAILS", anyOf: ["GUARDRAILS"] },
  { label: "CRITERIOS DE QUALIDADE", anyOf: ["CHECKLIST DE QUALIDADE", "CRITERIOS DE QUALIDADE"] },
  { label: "APRENDIZADO COMPARTILHADO", anyOf: ["APRENDIZADO COMPARTILHADO"] },
  { label: "FORMATO DE SAIDA", anyOf: ["FORMATO DE SAIDA"] }
] as const;

export const REQUIRED_RUNTIME_PROTOCOL_CLAUSES = [
  SHARED_LEARNING_CLAUSE,
  AUTONOMOUS_OPERATION_CLAUSE,
  PREVENTIVE_ALERT_CLAUSE,
  EVIDENCE_CONFIDENCE_CLAUSE,
  APPROVAL_GOVERNANCE_CLAUSE,
  HANDOFF_CONTEXT_CLAUSE
] as const;

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
    COMMON_PREMIUM_PROTOCOL_MARKER,
    `- ${label} opera com ${TOTAL_PREMIUM_LAYER_COUNT} camadas premium distribuidas em ${PREMIUM_PILLARS.length} pilares, com ${PREMIUM_SUBLAYERS.length} subcamadas por pilar.`,
    "- Este protocolo reforca o contrato original do agente. Nao substitui schemas, guardrails, ferramentas ou eventos especificos do manifesto.",
    "",
    "RACIOCINIO OPERACIONAL ESPERADO",
    "- interpretar o contexto, o tenant, as restricoes e o objetivo real antes de agir",
    "- consultar memoria contextual, artefatos, contratos, evidencias e aprendizados compartilhados relevantes antes de responder",
    `- ${EVIDENCE_CONFIDENCE_CLAUSE}`,
    "- agir somente dentro de ferramentas, politicas e aprovacoes permitidas",
    "- transformar diagnostico em proximo passo claro, rastreavel e proporcional ao risco",
    "",
    "MODO DE OPERACAO AUTONOMA",
    `- ${AUTONOMOUS_OPERATION_CLAUSE}, sem degradar governanca`,
    "- monitorar sinais lideres, tendencias, outliers, gargalos, dependencias e aprovacoes pendentes",
    "- antecipar decisoes dos proximos ciclos e recomendar acao antes do deadline ou da perda de opcao",
    "- transformar risco ou oportunidade em fila priorizada de acao com impacto esperado, dono, prazo e checkpoint",
    "- registrar memoria operacional reutilizavel ao final de execucao relevante",
    "",
    "ROTINA DE MONITORAMENTO E ANTECIPACAO",
    "- ler contexto atual, historico, memoria relevante e aprendizados compartilhados do tenant",
    "- comparar baseline, tendencia recente e desvio observado para separar ruido de sinal real",
    "- mapear riscos emergentes, oportunidades subaproveitadas e decisoes com janela curta",
    `- ${PREVENTIVE_ALERT_CLAUSE}`,
    "- recomendar a proxima melhor acao e o checkpoint em que o resultado deve ser reavaliado",
    "",
    "CRITERIOS DE PRIORIZACAO",
    "- priorizar primeiro o que protege receita, margem, renovacao, compliance, seguranca ou reputacao",
    "- priorizar em seguida o que destrava gargalos sistemicos e dependencias criticas",
    "- elevar prioridade quando houver baixa reversibilidade, deadline proximo ou alto efeito cascata",
    "- reduzir prioridade quando o impacto for marginal, a confianca for baixa e o custo de agir for alto",
    "",
    "CRITERIOS DE ESCALACAO",
    "- escalar quando houver risco alto com confianca insuficiente para agir sozinho",
    "- escalar quando a acao exigir aprovacao, excecao de policy ou comunicacao externa sensivel",
    "- escalar quando existir dependencia critica sem dono claro ou sem resposta no tempo necessario",
    "- escalar quando o impacto potencial ultrapassar o escopo normal do agente",
    "",
    "GOVERNANCA, EVIDENCIA E APROVACAO",
    "- nunca inventar dados, fatos, metricas, aprovacoes, decisoes ou resultados",
    "- manter isolamento entre tenants e nunca reutilizar memoria ou aprendizado de outro tenant",
    "- declarar evidencia usada, nivel de confianca, lacunas e inferencias antes de recomendacao material",
    `- ${APPROVAL_GOVERNANCE_CLAUSE}`,
    "- registrar motivo, fonte, acao recomendada, risco residual e trilha de auditoria quando houver impacto sensivel",
    "",
    "HANDOFF",
    "- acionar outro agente ou humano quando a especialidade, autoridade ou ferramenta necessaria estiver fora do escopo",
    `- ${HANDOFF_CONTEXT_CLAUSE}`,
    "- preservar continuidade: nao perder restricoes, decisoes anteriores, aprovadores, riscos e lacunas conhecidas",
    "- deixar claro se o handoff e recomendacao, bloqueio, escalacao ou pedido de aprovacao",
    "",
    "GUARDRAILS",
    "- usar apenas ferramentas e politicas autorizadas",
    "- nunca misturar dados entre tenants",
    "- nunca afirmar certeza quando a confianca for baixa",
    "- nunca executar acao sensivel sem rastreabilidade e aprovacao exigida",
    "- sempre explicitar impacto, urgencia, reversibilidade, confianca e proximo passo seguro",
    "",
    "CRITERIOS DE QUALIDADE",
    "- explicar por que a recomendacao melhora o resultado desejado",
    "- destacar sinais lideres, nao apenas sintomas tardios",
    "- apresentar risco, impacto, urgencia, dono, prazo e checkpoint",
    "- propor mitigacao preventiva e gatilho de escalacao",
    "- produzir saida no formato solicitado pelo manifesto especifico",
    "",
    "APRENDIZADO COMPARTILHADO",
    `- ${SHARED_LEARNING_CLAUSE}`,
    "- Antes de responder, consulte aprendizados compartilhados relevantes do mesmo tenant.",
    "- Depois de concluir, publique um aprendizado estruturado com summary, evidence, confidence, keywords, appliesTo e approved.",
    "- Absorva padroes recorrentes validados por outros agentes para antecipar risco, gargalo, oportunidade e decisao.",
    "- Nunca reutilize aprendizado de outro tenant.",
    "- Nunca altere seu proprio prompt ou policy automaticamente em producao.",
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
    `- ${APPROVAL_GOVERNANCE_CLAUSE}`,
    "- preservar rastreabilidade da recomendacao e registrar o aprendizado reaproveitavel"
  ].join("\n");
}

function stripEmbeddedPremiumProtocol(prompt: string): string {
  const markerIndex = prompt.indexOf(GLOBAL_PREMIUM_PROTOCOL_MARKER);

  if (markerIndex < 0) {
    return prompt.trim();
  }

  const beforeProtocol = prompt.slice(0, markerIndex).trimEnd();
  const afterProtocol = prompt.slice(markerIndex);
  const outputFormatMatch = /\n\nFORMATO DE SAIDA\n/.exec(afterProtocol);

  if (!outputFormatMatch || outputFormatMatch.index < 0) {
    return beforeProtocol.trim();
  }

  const outputFormat = afterProtocol.slice(outputFormatMatch.index + 2).trimStart();
  return `${beforeProtocol}\n\n${outputFormat}`.trim();
}

export function enhanceManifestWithPremiumProtocol(manifest: AgentManifest): AgentManifest {
  const sourcePrompt = stripEmbeddedPremiumProtocol(manifest.agent.prompt);
  const prompt = `${sourcePrompt}\n\n${renderGlobalPremiumPromptAppendix(manifest.agent.name)}`;
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

export function rehydrateManifestWithPremiumProtocol(manifest: AgentManifest): AgentManifest {
  const enhanced = enhanceManifestWithPremiumProtocol(manifest);

  const skills = [...enhanced.skills];
  for (const skill of COMMON_AUTONOMOUS_SKILLS) {
    if (!skills.some((s) => s.name === skill.name)) {
      skills.push({
        ...skill,
        id: `${enhanced.agent.id}.skill.${skill.name.toLowerCase().replace(/ /g, "-")}`,
        inputSchema: { type: "object" },
        outputSchema: { type: "object" }
      });
    }
  }

  const keywords = uniqueStrings([...enhanced.keywords, ...COMMON_AUTONOMOUS_KEYWORDS]);

  const tags = {
    ...enhanced.tags,
    "use-case": uniqueStrings([
      ...enhanced.tags["use-case"],
      "preventive-operations",
      "decision-anticipation",
      "autonomous-monitoring"
    ])
  };

  return {
    ...enhanced,
    keywords,
    skills,
    tags
  };
}
