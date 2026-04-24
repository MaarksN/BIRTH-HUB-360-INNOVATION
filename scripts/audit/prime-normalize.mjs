#!/usr/bin/env node
// @ts-nocheck
// 
import path from "node:path";

import {
  firstMatchingLine,
  makeEvidenceRef,
  readText,
  reportDateParts,
  supportRoot,
  writeJson
} from "./shared-prime.mjs";
import {
  dimensionConfig,
  innovationCategoryConfig,
  innovationSeeds,
  insufficiencyTemplates,
  glossaryTerms
} from "./prime-catalog.mjs";

const fallbackRequirements = {
  architecture: [
    "docs/architecture/context.md",
    "docs/architecture/container.md",
    "docs/architecture/decision-log.md"
  ],
  code_quality: [
    "artifacts/quality/jscpd/current-report.json",
    "artifacts/quality/eslint/current-report.json",
    "artifacts/quality/typecheck/current-report.json"
  ],
  security: [
    "artifacts/security/semgrep-head.json",
    "artifacts/security/zap-baseline.json",
    "artifacts/security/authz-matrix.md"
  ],
  tests_observability: [
    "artifacts/testing/module-coverage.json",
    "docs/observability/slo-budget.md",
    "artifacts/observability/live-dashboard-export.json"
  ],
  performance: [
    "artifacts/performance/web-bundle-head.json",
    "artifacts/performance/load-head.json",
    "artifacts/performance/soak-head.json"
  ],
  devops: [
    "docs/operations/environment-parity.md",
    "artifacts/dora/lead-time.json",
    "docs/operations/on-call-playbook.md"
  ],
  product_ux: [
    "artifacts/accessibility/axe-report.json",
    "artifacts/web/cross-browser-smoke.json",
    "docs/product/onboarding-map.md"
  ],
  operations_multitenancy: [
    "docs/operations/sla.md",
    "artifacts/dr/latest-drill.json",
    "artifacts/tenancy/rls-proof-head.json"
  ]
};

function parseJson(text) {
  return JSON.parse(text);
}

function groupOccurrencesByPath(occurrences) {
  const map = new Map();
  for (const occurrence of occurrences ?? []) {
    const key = occurrence.path;
    if (!map.has(key)) {
      map.set(key, {
        path: occurrence.path,
        line: occurrence.line,
        samples: [],
        count: 0
      });
    }
    const bucket = map.get(key);
    bucket.count += 1;
    bucket.line = Math.min(bucket.line, occurrence.line);
    if (bucket.samples.length < 3) {
      bucket.samples.push(occurrence.text ?? occurrence.summary ?? "");
    }
  }
  return [...map.values()].sort((left, right) => right.count - left.count || left.path.localeCompare(right.path));
}

function normalizeArtifactPath(value) {
  return String(value ?? "").replaceAll("\\", "/");
}

function isCoreRelevantEvidencePath(value) {
  const normalized = normalizeArtifactPath(value);
  return /^(apps\/api|apps\/web|apps\/worker|packages\/database|infra\/|\.github\/workflows\/|scripts\/)/.test(normalized);
}

function semgrepSeverityWeight(result) {
  const severity = String(result.extra?.severity ?? result.extra?.metadata?.severity ?? "INFO").toUpperCase();
  if (severity === "ERROR") {
    return 3;
  }
  if (severity === "WARNING") {
    return 2;
  }
  return 1;
}

function computeVdi(vdiFactors) {
  const raw =
    vdiFactors.businessImpact * 0.35 +
    vdiFactors.securityRisk * 0.30 +
    vdiFactors.reverseEffort * 0.20 +
    vdiFactors.frequency * 0.15;
  return Number(raw.toFixed(2));
}

function vdiSeverity(vdiScore) {
  if (vdiScore >= 4.0) return "CRÍTICO";
  if (vdiScore >= 3.0) return "ALTO";
  if (vdiScore >= 2.0) return "MÉDIO";
  return "BAIXO";
}

function suggestedPhase(dimension, vdiScore) {
  if (vdiScore >= 4.0) return "Fase 0";
  if (dimension === "devops" || dimension === "security" || dimension === "tests_observability") return "Fase 1";
  if (dimension === "performance" || dimension === "code_quality" || dimension === "product_ux") return "Fase 2";
  if (dimension === "operations_multitenancy") return "Fase 3";
  return "Fase 2";
}

function baseCandidate({
  dimension,
  title,
  location,
  problem,
  impact,
  recommendation,
  vdiFactors,
  effort,
  confidence,
  evidenceRefs,
  inference = false,
  insufficient = false,
  dependencyHints = []
}) {
  const vdiScore = computeVdi(vdiFactors);
  return {
    dimension,
    title,
    location,
    problem,
    impact,
    recommendation,
    vdiFactors,
    vdiScore,
    effort,
    severity: vdiSeverity(vdiScore),
    phase: suggestedPhase(dimension, vdiScore),
    confidence,
    evidenceRefs,
    inference,
    insufficient,
    dependencyHints
  };
}

function sortCandidates(candidates) {
  return [...candidates].sort((left, right) => {
    if (right.vdiScore !== left.vdiScore) return right.vdiScore - left.vdiScore;
    if (right.confidence !== left.confidence) return right.confidence - left.confidence;
    return left.title.localeCompare(right.title);
  });
}

async function makeInsufficientItem(dimension, template, index) {
  const requirementPath = template.evidencePath;
  const lineRef = await firstMatchingLine(requirementPath, /.*/);
  return baseCandidate({
    dimension,
    title:
      index > 0 && !template.title.includes("complementar")
        ? `${template.title} (complementar ${index + 1})`
        : template.title,
    location: {
      path: requirementPath,
      lines: {
        start: lineRef.line,
        end: lineRef.line
      }
    },
    problem: template.problem,
    impact: template.impact,
    recommendation: template.recommendation,
    vdiFactors: {
      businessImpact: 3,
      securityRisk: dimension === "security" || dimension === "operations_multitenancy" ? 4 : 2,
      reverseEffort: 2,
      frequency: 2
    },
    effort: "0.5-1 dia para materializar a evidência; maior se a capacidade não existir.",
    confidence: 0.42,
    evidenceRefs: [makeEvidenceRef(requirementPath, lineRef.line, "Evidência atual insuficiente para concluir o item.")],
    insufficient: true,
    dependencyHints: dimension === "operations_multitenancy" ? ["tenant-proof"] : ["baseline-proof"]
  });
}

async function ensureTargetCount(dimension, candidates, target) {
  const results = [...candidates];
  let fallbackIndex = 0;
  while (results.length < target) {
    const templateList = insufficiencyTemplates[dimension] ?? [];
    const fallbackPath = fallbackRequirements[dimension]?.[fallbackIndex % (fallbackRequirements[dimension]?.length || 1)] ?? "README.md";
    const template =
      templateList[fallbackIndex % Math.max(1, templateList.length)] ?? {
        title: `[DADOS INSUFICIENTES — REQUER: ${fallbackPath}] Evidência complementar para ${dimension}`,
        problem: "A evidência atualmente versionada não é suficiente para fechar esta frente com precisão empírica no HEAD atual.",
        impact: "A decisão executiva sobre esta lacuna permanece parcialmente qualitativa até que a evidência faltante seja produzida.",
        recommendation: `Produzir a evidência solicitada em ${fallbackPath} e anexá-la ao pipeline soberano.`,
        evidencePath: "README.md"
      };
    results.push(await makeInsufficientItem(dimension, template, fallbackIndex));
    fallbackIndex += 1;
  }
  return results.slice(0, target);
}

async function buildArchitectureCandidates(raw) {
  const candidates = [];
  const hotspots = raw.complexity.hotspots
    .filter((entry) => /^(apps\/web|apps\/api|apps\/worker|packages\/database|packages\/workflows-core)/.test(entry.file))
    .slice(0, 8);

  for (const hotspot of hotspots) {
    candidates.push(
      baseCandidate({
        dimension: "architecture",
        title: `Complexidade acima do limiar em ${hotspot.functionName}`,
        location: {
          path: hotspot.file,
          lines: {
            start: hotspot.line,
            end: hotspot.endLine
          }
        },
        problem: `Identificado em ${hotspot.file}:${hotspot.line} uma função com complexidade ciclomática ${hotspot.complexity}, acima do limiar operacional recomendado (>10).`,
        impact: "Hotspots assim aumentam risco de regressão, dificultam revisão e ampliam o custo de mudança em fluxos centrais.",
        recommendation: "Fatiar a função em sub-rotinas orientadas por decisão e isolar políticas/branches em helpers com testes diretos.",
        vdiFactors: {
          businessImpact: hotspot.complexity >= 20 ? 4 : 3,
          securityRisk: hotspot.file.includes("auth") || hotspot.file.includes("billing") ? 3 : 2,
          reverseEffort: hotspot.length >= 80 ? 4 : 3,
          frequency: 3
        },
        effort: hotspot.length >= 80 ? "2-5 dias" : "1-3 dias",
        confidence: 0.94,
        evidenceRefs: [makeEvidenceRef(hotspot.file, hotspot.line, `Complexidade=${hotspot.complexity}; extensão=${hotspot.length} linhas.`)],
        dependencyHints: ["refactor-core"]
      })
    );
  }

  for (const cycle of raw.staticFindings.importCycles.slice(0, 3)) {
    const anchor = cycle.anchor;
    candidates.push(
      baseCandidate({
        dimension: "architecture",
        title: `Dependência circular entre ${cycle.nodes.length - 1} módulos`,
        location: {
          path: anchor,
          lines: {
            start: 1,
            end: 1
          }
        },
        problem: `Indício de ciclo de importação envolvendo ${cycle.nodes.join(" -> ")}.`,
        impact: "Ciclos reduzem previsibilidade de inicialização, impedem modularização limpa e ampliam acoplamento entre boundaries.",
        recommendation: "Extrair contratos compartilhados para pacote neutro ou inverter dependência via adapters/interfaces.",
        vdiFactors: {
          businessImpact: 3,
          securityRisk: 2,
          reverseEffort: 4,
          frequency: 3
        },
        effort: "2-5 dias",
        confidence: 0.73,
        evidenceRefs: [makeEvidenceRef(anchor, 1, `Ciclo detectado: ${cycle.nodes.join(" -> ")}`)],
        inference: true,
        dependencyHints: ["module-boundaries"]
      })
    );
  }

  for (const file of raw.staticFindings.largeFiles.filter((entry) => /^(apps\/web|apps\/api|apps\/worker|packages\/database)/.test(entry.path)).slice(0, 4)) {
    candidates.push(
      baseCandidate({
        dimension: "architecture",
        title: `Arquivo grande demais para o boundary atual (${file.lines} linhas)`,
        location: {
          path: file.path,
          lines: {
            start: 1,
            end: 1
          }
        },
        problem: `Identificado em ${file.path} um arquivo com ${file.lines} linhas dentro do core, sinal típico de boundary inchado ou múltiplas responsabilidades.`,
        impact: "Arquivos extensos concentram conhecimento, elevam custo de merge e pioram isolamento de testes.",
        recommendation: "Separar orchestration, adapters e regras de negócio em módulos menores alinhados ao boundary funcional.",
        vdiFactors: {
          businessImpact: 3,
          securityRisk: file.path.includes("auth") || file.path.includes("billing") ? 3 : 1,
          reverseEffort: 4,
          frequency: 4
        },
        effort: "2-5 dias",
        confidence: 0.88,
        evidenceRefs: [makeEvidenceRef(file.path, 1, `${file.lines} linhas no arquivo.`)],
        dependencyHints: ["refactor-core"]
      })
    );
  }

  if (raw.files.some((entry) => entry.path === "apps/api/src/middleware/tenant-context.ts") && raw.files.some((entry) => entry.path === "apps/api/src/middlewares/tenantContext.ts")) {
    candidates.push(
      baseCandidate({
        dimension: "architecture",
        title: "Superfícies duplicadas para contexto de tenant no mesmo serviço",
        location: {
          path: "apps/api/src/middleware/tenant-context.ts",
          lines: { start: 1, end: 1 }
        },
        problem: "O serviço expõe duas convenções de pasta/nome para middleware de tenant context, um indício de drift arquitetural e de nomenclatura.",
        impact: "Duplicidade de entrypoints aumenta o risco de importar a variante errada e dificulta consolidar políticas cross-cutting.",
        recommendation: "Consolidar a superfície oficial em um único módulo e adicionar teste/guardrail de import path permitido.",
        vdiFactors: {
          businessImpact: 3,
          securityRisk: 4,
          reverseEffort: 2,
          frequency: 3
        },
        effort: "0.5-1 dia",
        confidence: 0.9,
        evidenceRefs: [
          makeEvidenceRef("apps/api/src/middleware/tenant-context.ts", 1, "Primeira variante do middleware."),
          makeEvidenceRef("apps/api/src/middlewares/tenantContext.ts", 1, "Segunda variante do middleware.")
        ],
        dependencyHints: ["tenant-proof"]
      })
    );
  }

  if (raw.files.some((entry) => entry.path.startsWith("apps/legacy/dashboard/"))) {
    candidates.push(
      baseCandidate({
        dimension: "architecture",
        title: "Superfície legacy ainda versionada ao lado do core canônico",
        location: {
          path: "docs/service-catalog.md",
          lines: {
            start: 1,
            end: 1
          }
        },
        problem: "O catálogo canônico marca o dashboard legado como quarentena, mas a superfície continua presente e próxima do fluxo principal do monorepo.",
        impact: "Manter legado ao lado do core amplia ruído de manutenção e aumenta o risco de dependências regressivas no lane principal.",
        recommendation: "Fortalecer guardrails que bloqueiem imports/execução do legado no core e planejar isolamento físico adicional.",
        vdiFactors: {
          businessImpact: 3,
          securityRisk: 2,
          reverseEffort: 3,
          frequency: 4
        },
        effort: "1-3 dias",
        confidence: 0.81,
        evidenceRefs: [makeEvidenceRef("docs/service-catalog.md", 1, "Core canônico e legado/quarentena coexistem no catálogo.")],
        dependencyHints: ["module-boundaries"]
      })
    );
  }

  return ensureTargetCount("architecture", sortCandidates(candidates), dimensionConfig.find((entry) => entry.key === "architecture").target);
}

async function buildCodeQualityCandidates(raw) {
  const candidates = [];

  for (const grouped of groupOccurrencesByPath(raw.staticFindings.anyOccurrences).slice(0, 6)) {
    candidates.push(
      baseCandidate({
        dimension: "code_quality",
        title: `Uso recorrente de any em ${path.posix.basename(grouped.path)}`,
        location: {
          path: grouped.path,
          lines: { start: grouped.line, end: grouped.line }
        },
        problem: `Identificado em ${grouped.path}:${grouped.line} um cluster de ${grouped.count} ocorrência(s) de any em código de runtime.`,
        impact: "Esse padrão reduz garantias de tipo justamente nos pontos onde o core deveria ser mais explícito e previsível.",
        recommendation: "Substituir any por unions, schemas zod ou tipos derivados das entidades reais trafegadas pelo módulo.",
        vdiFactors: {
          businessImpact: 3,
          securityRisk: grouped.path.includes("auth") || grouped.path.includes("billing") ? 3 : 2,
          reverseEffort: grouped.count >= 6 ? 4 : 3,
          frequency: 4
        },
        effort: grouped.count >= 6 ? "2-5 dias" : "0.5-2 dias",
        confidence: 0.93,
        evidenceRefs: [makeEvidenceRef(grouped.path, grouped.line, `${grouped.count} ocorrência(s) de any.`)],
        dependencyHints: ["type-safety"]
      })
    );
  }

  for (const grouped of groupOccurrencesByPath(raw.staticFindings.envOccurrences).slice(0, 5)) {
    candidates.push(
      baseCandidate({
        dimension: "code_quality",
        title: `Acesso direto a process.env fora da camada de configuração`,
        location: {
          path: grouped.path,
          lines: { start: grouped.line, end: grouped.line }
        },
        problem: `Identificado em ${grouped.path}:${grouped.line} acesso direto a process.env em runtime fora de um boundary dedicado de config.`,
        impact: "Isso dispersa contrato de configuração, dificulta validação centralizada e fragiliza testes/observabilidade.",
        recommendation: "Encapsular leituras em surface única de configuração com validação e defaults explícitos.",
        vdiFactors: {
          businessImpact: 3,
          securityRisk: 3,
          reverseEffort: 2,
          frequency: 4
        },
        effort: "0.5-2 dias",
        confidence: 0.9,
        evidenceRefs: [makeEvidenceRef(grouped.path, grouped.line, `${grouped.count} leitura(s) direta(s) de env.`)],
        dependencyHints: ["foundation-config"]
      })
    );
  }

  for (const grouped of groupOccurrencesByPath(raw.staticFindings.consoleOccurrences).slice(0, 4)) {
    candidates.push(
      baseCandidate({
        dimension: "code_quality",
        title: `Logging ad-hoc com console.* em runtime`,
        location: {
          path: grouped.path,
          lines: { start: grouped.line, end: grouped.line }
        },
        problem: `Identificado em ${grouped.path}:${grouped.line} uso de console.* em uma superfície de runtime do core.`,
        impact: "Esse padrão dificulta padronização de logs, correlação por trace id e aplicação consistente de redaction.",
        recommendation: "Migrar o módulo para o logger estruturado do workspace e eliminar saídas diretas via console.",
        vdiFactors: {
          businessImpact: 2,
          securityRisk: 3,
          reverseEffort: 2,
          frequency: 4
        },
        effort: "0.5-1 dia",
        confidence: 0.92,
        evidenceRefs: [makeEvidenceRef(grouped.path, grouped.line, `${grouped.count} ocorrência(s) de console.*.`)],
        dependencyHints: ["observability-foundation"]
      })
    );
  }

  for (const occurrence of raw.staticFindings.emptyCatchOccurrences.slice(0, 4)) {
    candidates.push(
      baseCandidate({
        dimension: "code_quality",
        title: "Tratamento silencioso de erro com catch vazio",
        location: {
          path: occurrence.path,
          lines: { start: occurrence.line, end: occurrence.line }
        },
        problem: `Identificado em ${occurrence.path}:${occurrence.line} um catch vazio/silencioso em runtime.`,
        impact: "Falhas ficam invisíveis, reduzem depuração e podem mascarar inconsistências operacionais ou de negócio.",
        recommendation: "Adicionar contexto estruturado de erro e decidir explicitamente entre retry, fallback ou propagação.",
        vdiFactors: {
          businessImpact: 3,
          securityRisk: 3,
          reverseEffort: 2,
          frequency: 3
        },
        effort: "0.5-1 dia",
        confidence: 0.95,
        evidenceRefs: [makeEvidenceRef(occurrence.path, occurrence.line, occurrence.summary)],
        dependencyHints: ["observability-foundation"]
      })
    );
  }

  for (const occurrence of raw.staticFindings.todoOccurrences.slice(0, 4)) {
    candidates.push(
      baseCandidate({
        dimension: "code_quality",
        title: "Pendência explícita mantida em código versionado",
        location: {
          path: occurrence.path,
          lines: { start: occurrence.line, end: occurrence.line }
        },
        problem: `Identificado em ${occurrence.path}:${occurrence.line} um marcador ${occurrence.text.includes("FIXME") ? "FIXME" : "TODO/XXX"} ainda aberto no HEAD atual.`,
        impact: "Pendências abertas em superfícies centrais geram ambiguidade sobre o grau real de pronto do módulo.",
        recommendation: "Converter o marcador em issue rastreável ou resolver a pendência antes de consolidar o fluxo como estável.",
        vdiFactors: {
          businessImpact: 2,
          securityRisk: occurrence.path.includes("auth") ? 3 : 1,
          reverseEffort: 2,
          frequency: 3
        },
        effort: "0.5-1 dia",
        confidence: 0.85,
        evidenceRefs: [makeEvidenceRef(occurrence.path, occurrence.line, occurrence.text)],
        dependencyHints: ["backlog-hygiene"]
      })
    );
  }

  for (const fn of raw.staticFindings.longFunctions.slice(0, 5)) {
    candidates.push(
      baseCandidate({
        dimension: "code_quality",
        title: `Função longa demais (${fn.length} linhas)`,
        location: {
          path: fn.path,
          lines: { start: fn.line, end: fn.endLine }
        },
        problem: `Identificado em ${fn.path}:${fn.line} uma função com ${fn.length} linhas, acima do tamanho justificável para manutenção rotineira.`,
        impact: "Funções extensas combinam decisão, IO e transformação de dados no mesmo escopo, reduzindo clareza e testabilidade.",
        recommendation: "Quebrar a função em etapas nomeadas e mover validação/integração para helpers específicos.",
        vdiFactors: {
          businessImpact: 3,
          securityRisk: fn.path.includes("auth") || fn.path.includes("billing") ? 3 : 1,
          reverseEffort: fn.length >= 100 ? 4 : 3,
          frequency: 3
        },
        effort: fn.length >= 100 ? "2-5 dias" : "1-3 dias",
        confidence: 0.9,
        evidenceRefs: [makeEvidenceRef(fn.path, fn.line, `${fn.functionName} com ${fn.length} linhas.`)],
        dependencyHints: ["refactor-core"]
      })
    );
  }

  return ensureTargetCount("code_quality", sortCandidates(candidates), dimensionConfig.find((entry) => entry.key === "code_quality").target);
}

async function buildSecurityCandidates(raw) {
  const candidates = [];
  const semgrepResults = (raw.evidenceArtifacts?.semgrep?.data?.results ?? [])
    .map((entry) => ({
      ...entry,
      path: normalizeArtifactPath(entry.path)
    }))
    .filter((entry) => isCoreRelevantEvidencePath(entry.path))
    .sort((left, right) => semgrepSeverityWeight(right) - semgrepSeverityWeight(left));

  for (const occurrence of raw.staticFindings.rawQueryUnsafeOccurrences.slice(0, 4)) {
    candidates.push(
      baseCandidate({
        dimension: "security",
        title: "Uso de raw query insegura no acesso a dados",
        location: {
          path: occurrence.path,
          lines: { start: occurrence.line, end: occurrence.line }
        },
        problem: `Identificado em ${occurrence.path}:${occurrence.line} uso de prisma raw unsafe, o que amplia superfície para injection ou bypass de abstrações seguras.`,
        impact: "Esse padrão aumenta risco de falha crítica de segurança e dificulta validar tenancy e saneamento em todo call path.",
        recommendation: "Substituir por query parametrizada segura ou reintroduzir a operação em repository tipado com validação explícita.",
        vdiFactors: {
          businessImpact: 4,
          securityRisk: 5,
          reverseEffort: 3,
          frequency: 3
        },
        effort: "1-3 dias",
        confidence: 0.97,
        evidenceRefs: [makeEvidenceRef(occurrence.path, occurrence.line, occurrence.summary)],
        dependencyHints: ["tenant-proof", "data-contracts"]
      })
    );
  }

  for (const file of raw.staticFindings.networkWithoutTimeout.slice(0, 5)) {
    candidates.push(
      baseCandidate({
        dimension: "security",
        title: "Chamada externa sem timeout ou abort path explícito",
        location: {
          path: file.path,
          lines: { start: file.line, end: file.line }
        },
        problem: `Indício em ${file.path}:${file.line} de acesso externo sem timeout explícito no arquivo.`,
        impact: "Além de risco de latência, integrações sem timeout ampliam superfície para exaustão de recursos e cascata de indisponibilidade.",
        recommendation: "Padronizar client HTTP com timeout, retry com backoff e métricas por integração.",
        vdiFactors: {
          businessImpact: 4,
          securityRisk: 4,
          reverseEffort: 2,
          frequency: 4
        },
        effort: "0.5-2 dias",
        confidence: 0.74,
        evidenceRefs: [makeEvidenceRef(file.path, file.line, file.summary)],
        inference: true,
        dependencyHints: ["integration-guardrails"]
      })
    );
  }

  for (const grouped of groupOccurrencesByPath(raw.staticFindings.envOccurrences).filter((entry) => /auth|billing|webhook|connector|privacy/i.test(entry.path)).slice(0, 2)) {
    candidates.push(
      baseCandidate({
        dimension: "security",
        title: "Configuração sensível dispersa em módulo crítico",
        location: {
          path: grouped.path,
          lines: { start: grouped.line, end: grouped.line }
        },
        problem: `Identificado em módulo crítico (${grouped.path}) acesso direto a process.env, reduzindo auditabilidade de segredos e políticas de fallback.`,
        impact: "Módulos críticos com leitura dispersa de env facilitam drift entre ambientes e tornam segredos mais difíceis de governar.",
        recommendation: "Centralizar segredos/flags operacionais em config tipada e remover leitura direta no módulo de domínio.",
        vdiFactors: {
          businessImpact: 4,
          securityRisk: 4,
          reverseEffort: 2,
          frequency: 3
        },
        effort: "0.5-2 dias",
        confidence: 0.86,
        evidenceRefs: [makeEvidenceRef(grouped.path, grouped.line, `${grouped.count} leitura(s) direta(s) de env em módulo crítico.`)],
        dependencyHints: ["foundation-config"]
      })
    );
  }

  for (const gap of raw.staticFindings.coverageGaps.filter((entry) => /auth|billing|webhook|connector|privacy|workflow/i.test(entry.path)).slice(0, 2)) {
    candidates.push(
      baseCandidate({
        dimension: "security",
        title: "Superfície crítica sem teste relacionado por heurística de nome",
        location: {
          path: gap.path,
          lines: { start: 1, end: 1 }
        },
        problem: `Identificado em ${gap.path} ausência de arquivo de teste relacionado por heurística de nome em uma superfície potencialmente sensível.`,
        impact: "Sem cobertura direcionada, regressões de autenticação, autorização ou webhooks podem chegar ao lane principal sem sinal precoce.",
        recommendation: "Adicionar testes focados no boundary crítico e explicitamente vinculados ao módulo.",
        vdiFactors: {
          businessImpact: 4,
          securityRisk: 4,
          reverseEffort: 3,
          frequency: 3
        },
        effort: "1-3 dias",
        confidence: 0.64,
        evidenceRefs: [makeEvidenceRef(gap.path, 1, "Nenhum teste relacionado encontrado pela heurística de stem/module.")],
        inference: true,
        dependencyHints: ["security-tests"]
      })
    );
  }

  for (const finding of semgrepResults.slice(0, 5)) {
    const severityWeight = semgrepSeverityWeight(finding);
    const line = finding.start?.line ?? 1;
    const severity = String(finding.extra?.severity ?? finding.extra?.metadata?.severity ?? "INFO").toUpperCase();
    const shortMessage = String(finding.extra?.message ?? finding.check_id ?? "Semgrep finding").split(". ")[0];
    const recommendation = finding.extra?.fix
      ? `Aplicar a correção sugerida pelo Semgrep e validar o fluxo afetado. Fix sugerido: ${String(finding.extra.fix).slice(0, 180)}`
      : "Endereçar o padrão sinalizado pelo Semgrep e adicionar cobertura de regressão para o fluxo afetado.";

    candidates.push(
      baseCandidate({
        dimension: "security",
        title: `Semgrep ${severity} em ${path.posix.basename(finding.path)}`,
        location: {
          path: finding.path,
          lines: { start: line, end: line }
        },
        problem: `Semgrep sinalizou em ${finding.path}:${line} o padrão "${shortMessage}".`,
        impact: "Esse tipo de finding amplia a superfície de exploração e indica controles de segurança ainda incompletos no HEAD atual.",
        recommendation,
        vdiFactors: {
          businessImpact: severityWeight >= 3 ? 4 : 3,
          securityRisk: Math.min(5, severityWeight + 2),
          reverseEffort: severityWeight >= 3 ? 3 : 2,
          frequency: 3
        },
        effort: severityWeight >= 3 ? "1-3 dias" : "0.5-2 dias",
        confidence: 0.83,
        evidenceRefs: [
          makeEvidenceRef(finding.path, line, shortMessage),
          makeEvidenceRef(raw.evidenceArtifacts.semgrep.path, 1, `Semgrep ${severity} confirmado no artefato fresco.`)
        ],
        dependencyHints: ["security-tests", "integration-guardrails"]
      })
    );
  }

  return ensureTargetCount("security", sortCandidates(candidates), dimensionConfig.find((entry) => entry.key === "security").target);
}

async function buildTestsObservabilityCandidates(raw) {
  const candidates = [];
  const moduleCoverage = raw.evidenceArtifacts?.moduleCoverage?.data;

  for (const gap of raw.staticFindings.coverageGaps.slice(0, 7)) {
    candidates.push(
      baseCandidate({
        dimension: "tests_observability",
        title: "Módulo volumoso sem teste relacionado direto",
        location: {
          path: gap.path,
          lines: { start: 1, end: 1 }
        },
        problem: `Identificado em ${gap.path} um módulo relevante sem teste relacionado por heurística de nome/stem no workspace atual.`,
        impact: "A chance de regressão silenciosa cresce quando módulos grandes ou críticos não têm suite vinculada de forma óbvia.",
        recommendation: "Criar pelo menos um teste unitário ou integration diretamente associado ao boundary do arquivo.",
        vdiFactors: {
          businessImpact: 3,
          securityRisk: /auth|billing|webhook/i.test(gap.path) ? 4 : 2,
          reverseEffort: 2,
          frequency: 4
        },
        effort: "0.5-2 dias",
        confidence: 0.68,
        evidenceRefs: [makeEvidenceRef(gap.path, 1, "Heurística não encontrou arquivo de teste relacionado.")],
        inference: true,
        dependencyHints: ["test-harness"]
      })
    );
  }

  for (const grouped of groupOccurrencesByPath(raw.staticFindings.consoleOccurrences).slice(0, 2)) {
    candidates.push(
      baseCandidate({
        dimension: "tests_observability",
        title: "Observabilidade inconsistente por uso de console em runtime",
        location: {
          path: grouped.path,
          lines: { start: grouped.line, end: grouped.line }
        },
        problem: `Identificado em ${grouped.path}:${grouped.line} logging ad-hoc fora da cadeia estruturada de observabilidade.`,
        impact: "Sinais operacionais ficam parciais e dificultam correlação entre logs, métricas e traces durante incidentes.",
        recommendation: "Alinhar o módulo ao logger estruturado e adicionar contexto de tenant/trace nas saídas relevantes.",
        vdiFactors: {
          businessImpact: 3,
          securityRisk: 3,
          reverseEffort: 2,
          frequency: 4
        },
        effort: "0.5-1 dia",
        confidence: 0.91,
        evidenceRefs: [makeEvidenceRef(grouped.path, grouped.line, `${grouped.count} ocorrência(s) de console.*.`)],
        dependencyHints: ["observability-foundation"]
      })
    );
  }

  for (const occurrence of raw.staticFindings.todoOccurrences.filter((entry) => /metric|trace|health|observe|sentry|otel/i.test(entry.path) || /monitor|trace|alert/i.test(entry.text)).slice(0, 1)) {
    candidates.push(
      baseCandidate({
        dimension: "tests_observability",
        title: "Pendência explícita em superfície de observabilidade",
        location: {
          path: occurrence.path,
          lines: { start: occurrence.line, end: occurrence.line }
        },
        problem: `Há marcador pendente em ${occurrence.path}:${occurrence.line} dentro de uma superfície ligada a monitoramento/observabilidade.`,
        impact: "Pendências nesse tipo de módulo adiam a confiabilidade do diagnóstico operacional em produção.",
        recommendation: "Resolver a pendência ou vinculá-la a um issue com data/owner antes do go-live.",
        vdiFactors: {
          businessImpact: 3,
          securityRisk: 2,
          reverseEffort: 2,
          frequency: 3
        },
        effort: "0.5-1 dia",
        confidence: 0.84,
        evidenceRefs: [makeEvidenceRef(occurrence.path, occurrence.line, occurrence.text)],
        dependencyHints: ["observability-foundation"]
      })
    );
  }

  for (const surface of (moduleCoverage?.surfaces ?? [])
    .filter((entry) => entry.gaps.length > 0)
    .slice()
    .sort((left, right) => right.gaps.length - left.gaps.length || left.module.localeCompare(right.module))
    .slice(0, 3)) {
    const anchorPath = surface.gaps[0] ?? raw.evidenceArtifacts.moduleCoverage.path;
    candidates.push(
      baseCandidate({
        dimension: "tests_observability",
        title: `Cobertura estrutural baixa em ${surface.module}`,
        location: {
          path: anchorPath,
          lines: { start: 1, end: 1 }
        },
        problem: `O proxy de cobertura identifica ${surface.runtimeFiles} arquivos de runtime para ${surface.module}, mas apenas ${surface.directTestFiles} arquivos de teste diretos e ${surface.gaps.length} gaps principais.` ,
        impact: "Com poucos testes diretos para módulos extensos, regressões operacionais e de observabilidade tendem a aparecer tarde no ciclo.",
        recommendation: "Priorizar suites unit/integration nos primeiros arquivos do gap e anexar cobertura quantitativa real ao lane soberano.",
        vdiFactors: {
          businessImpact: surface.gaps.length >= 10 ? 4 : 3,
          securityRisk: /api|database/.test(surface.module) ? 4 : 2,
          reverseEffort: 3,
          frequency: 4
        },
        effort: "1-3 dias",
        confidence: 0.86,
        evidenceRefs: [
          makeEvidenceRef(anchorPath, 1, `Gap estrutural identificado para ${surface.module}.`),
          makeEvidenceRef(raw.evidenceArtifacts.moduleCoverage.path, 1, `${surface.module}: ${surface.directTestFiles} testes diretos, ${surface.gaps.length} gaps.`)
        ],
        dependencyHints: ["test-harness", "observability-foundation"]
      })
    );
  }

  return ensureTargetCount("tests_observability", sortCandidates(candidates), dimensionConfig.find((entry) => entry.key === "tests_observability").target);
}

async function buildPerformanceCandidates(raw) {
  const candidates = [];
  const bundleBaseline = raw.evidenceArtifacts?.bundleBaseline?.data;

  for (const occurrence of raw.staticFindings.findManyWithoutPagination.slice(0, 5)) {
    candidates.push(
      baseCandidate({
        dimension: "performance",
        title: "Consulta findMany sem paginação explícita",
        location: {
          path: occurrence.path,
          lines: { start: occurrence.line, end: occurrence.line }
        },
        problem: `Indício em ${occurrence.path}:${occurrence.line} de uso de findMany sem take/skip/cursor nas linhas adjacentes.`,
        impact: "Consultas amplas degradam latência, aumentam custo de banco e pioram risco de DoS por leitura excessiva.",
        recommendation: "Adicionar paginação explícita, limites defensivos e métricas por rota/serviço que consome a query.",
        vdiFactors: {
          businessImpact: 4,
          securityRisk: 3,
          reverseEffort: 2,
          frequency: 4
        },
        effort: "0.5-2 dias",
        confidence: 0.72,
        evidenceRefs: [makeEvidenceRef(occurrence.path, occurrence.line, occurrence.summary)],
        inference: true,
        dependencyHints: ["query-budget"]
      })
    );
  }

  for (const occurrence of raw.staticFindings.awaitInLoop.slice(0, 4)) {
    candidates.push(
      baseCandidate({
        dimension: "performance",
        title: "Await serial em loop de runtime",
        location: {
          path: occurrence.path,
          lines: { start: occurrence.line, end: occurrence.line }
        },
        problem: `Indício em ${occurrence.path}:${occurrence.line} de await dentro de loop sequencial.`,
        impact: "Esse padrão alonga tempo de resposta e throughput do worker/API, principalmente sob carga ou fan-out externo.",
        recommendation: "Avaliar paralelização controlada, batching ou filas dedicadas com limites explícitos.",
        vdiFactors: {
          businessImpact: 4,
          securityRisk: 2,
          reverseEffort: 3,
          frequency: 3
        },
        effort: "1-3 dias",
        confidence: 0.7,
        evidenceRefs: [makeEvidenceRef(occurrence.path, occurrence.line, occurrence.summary)],
        inference: true,
        dependencyHints: ["queue-throughput"]
      })
    );
  }

  for (const file of raw.staticFindings.networkWithoutTimeout.slice(0, 2)) {
    candidates.push(
      baseCandidate({
        dimension: "performance",
        title: "Integração externa sem deadline operacional explícito",
        location: {
          path: file.path,
          lines: { start: file.line, end: file.line }
        },
        problem: `Acesso externo em ${file.path}:${file.line} não expõe timeout/abort guard no arquivo atual.`,
        impact: "Deadlines ausentes permitem latência aberta, saturação de worker thread e aumento de fila em cascata.",
        recommendation: "Padronizar timeout, retry budget e instrumentação de latência por integração.",
        vdiFactors: {
          businessImpact: 4,
          securityRisk: 2,
          reverseEffort: 2,
          frequency: 4
        },
        effort: "0.5-2 dias",
        confidence: 0.74,
        evidenceRefs: [makeEvidenceRef(file.path, file.line, file.summary)],
        inference: true,
        dependencyHints: ["integration-guardrails"]
      })
    );
  }

  for (const hotspot of raw.complexity.hotspots.filter((entry) => entry.file.startsWith("apps/web/")).slice(0, 3)) {
    candidates.push(
      baseCandidate({
        dimension: "performance",
        title: `Página/estado web com complexidade alta (${hotspot.complexity})`,
        location: {
          path: hotspot.file,
          lines: { start: hotspot.line, end: hotspot.endLine }
        },
        problem: `Identificado em ${hotspot.file}:${hotspot.line} um componente/página com complexidade ${hotspot.complexity}.`,
        impact: "Componentes muito complexos prejudicam rendering predictability, manutenção de loading/error states e otimização futura de bundle.",
        recommendation: "Separar data-loading, rendering e actions do componente em camadas menores e mais previsíveis.",
        vdiFactors: {
          businessImpact: 3,
          securityRisk: 1,
          reverseEffort: 3,
          frequency: 3
        },
        effort: "1-3 dias",
        confidence: 0.89,
        evidenceRefs: [makeEvidenceRef(hotspot.file, hotspot.line, `Complexidade=${hotspot.complexity}.`)],
        dependencyHints: ["web-performance"]
      })
    );
  }

  if (bundleBaseline?.baseline?.chunks?.totalKiB) {
    const totalKiB = bundleBaseline.baseline.chunks.totalKiB;
    const topChunk = bundleBaseline.baseline.chunks.top10?.[0];
    candidates.push(
      baseCandidate({
        dimension: "performance",
        title: `Bundle web fresco acima de 2 MiB (${totalKiB} KiB)`,
        location: {
          path: raw.evidenceArtifacts.bundleBaseline.path,
          lines: { start: 1, end: 1 }
        },
        problem: `A baseline fresca do bundle registrou ${totalKiB} KiB distribuídos em ${bundleBaseline.baseline.chunks.files} arquivos, com chunk líder de ${topChunk?.bytes ?? "n/d"} bytes.`,
        impact: "Bundles desse porte pressionam LCP/TTI, aumentam custo de download e tendem a penalizar dispositivos móveis em jornadas críticas.",
        recommendation: "Aplicar code splitting por rota, revisar dependências pesadas do dashboard e estabelecer budget de bundle com fail em CI.",
        vdiFactors: {
          businessImpact: totalKiB >= 2000 ? 4 : 3,
          securityRisk: 1,
          reverseEffort: 3,
          frequency: 4
        },
        effort: "1-3 dias",
        confidence: 0.9,
        evidenceRefs: [
          makeEvidenceRef(raw.evidenceArtifacts.bundleBaseline.path, 1, `Bundle fresco com ${totalKiB} KiB.`),
          ...(topChunk?.file ? [makeEvidenceRef(normalizeArtifactPath(topChunk.file), 1, `Maior chunk atual com ${topChunk.bytes} bytes.`)] : [])
        ],
        dependencyHints: ["web-performance"]
      })
    );
  }

  return ensureTargetCount("performance", sortCandidates(candidates), dimensionConfig.find((entry) => entry.key === "performance").target);
}

async function buildDevOpsCandidates(raw) {
  const candidates = [];

  if (raw.git.deploymentFrequencyProxy.placeholderMessages.length > 0) {
    const first = raw.git.deploymentFrequencyProxy.placeholderMessages[0];
    candidates.push(
      baseCandidate({
        dimension: "devops",
        title: "Histórico recente contém mensagens de commit placeholder",
        location: {
          path: "package.json",
          lines: { start: 1, end: 1 }
        },
        problem: `O histórico local dos últimos 30 dias inclui mensagens placeholder como "${first.subject}", degradando rastreabilidade de mudança e auditoria operacional.`,
        impact: "Commit history fraco dificulta RCA, medição DORA e recuperação de contexto durante incidentes ou auditorias.",
        recommendation: "Fazer hard fail para mensagens placeholder no lane principal e limpar exceções históricas com política explícita.",
        vdiFactors: {
          businessImpact: 3,
          securityRisk: 2,
          reverseEffort: 2,
          frequency: 5
        },
        effort: "0.5-1 dia",
        confidence: 0.91,
        evidenceRefs: [makeEvidenceRef("package.json", 1, `${raw.git.deploymentFrequencyProxy.placeholderMessages.length} commit(s) placeholder nos últimos 30 dias.`)],
        dependencyHints: ["release-governance"]
      })
    );
  }

  if ((raw.capabilities.infra.k8sFiles ?? []).length === 0) {
    candidates.push(
      baseCandidate({
        dimension: "devops",
        title: "Diretório Kubernetes existe sem manifests ativos",
        location: {
          path: "infra/k8s/.gitkeep",
          lines: { start: 1, end: 1 }
        },
        problem: "O repositório reserva uma superfície `infra/k8s`, mas sem manifests ativos além do placeholder.",
        impact: "Esse estado sugere infraestrutura parcialmente planejada, o que pode confundir estratégia real de runtime e disaster recovery.",
        recommendation: "Ou materializar a estratégia Kubernetes com manifests mínimos, ou remover a superfície para reduzir falsa expectativa operacional.",
        vdiFactors: {
          businessImpact: 3,
          securityRisk: 2,
          reverseEffort: 2,
          frequency: 3
        },
        effort: "0.5-2 dias",
        confidence: 0.95,
        evidenceRefs: [makeEvidenceRef("infra/k8s/.gitkeep", 1, "Superfície k8s sem manifestos ativos.")],
        dependencyHints: ["environment-parity"]
      })
    );
  }

  for (const docker of raw.staticFindings.dockerFacts.filter((entry) => entry.fromStatements <= 1).slice(0, 3)) {
    candidates.push(
      baseCandidate({
        dimension: "devops",
        title: "Dockerfile sem evidência de multi-stage build",
        location: {
          path: docker.path,
          lines: { start: docker.line, end: docker.line }
        },
        problem: `Identificado em ${docker.path} apenas ${docker.fromStatements} instrução(ões) FROM.`,
        impact: "Imagens single-stage tendem a carregar toolchain desnecessária, elevar superfície de ataque e aumentar tempo de pull/deploy.",
        recommendation: "Converter o Dockerfile para multi-stage com base enxuta e assets finais mínimos.",
        vdiFactors: {
          businessImpact: 3,
          securityRisk: 3,
          reverseEffort: 2,
          frequency: 3
        },
        effort: "0.5-2 dias",
        confidence: 0.89,
        evidenceRefs: [makeEvidenceRef(docker.path, docker.line, `${docker.fromStatements} FROM no arquivo.`)],
        dependencyHints: ["container-hardening"]
      })
    );
  }

  return ensureTargetCount("devops", sortCandidates(candidates), dimensionConfig.find((entry) => entry.key === "devops").target);
}

async function buildProductUxCandidates(raw) {
  const candidates = [];
  const accessibility = raw.evidenceArtifacts?.accessibility?.data;

  for (const file of raw.staticFindings.hardcodedWebStrings.slice(0, 6)) {
    candidates.push(
      baseCandidate({
        dimension: "product_ux",
        title: "Strings de interface hardcoded em superfície web",
        location: {
          path: file.path,
          lines: { start: file.line, end: file.line }
        },
        problem: `Identificado em ${file.path}:${file.line} um cluster de ${file.count} linhas com texto hardcoded na UI.`,
        impact: "Esse padrão reduz prontidão para i18n, dificulta consistência editorial e aumenta custo de manutenção de UX.",
        recommendation: "Extrair strings para camada de mensagens/localização com organização por rota e contexto de uso.",
        vdiFactors: {
          businessImpact: 3,
          securityRisk: 1,
          reverseEffort: 3,
          frequency: 4
        },
        effort: "1-3 dias",
        confidence: 0.82,
        evidenceRefs: [makeEvidenceRef(file.path, file.line, file.summary)],
        dependencyHints: ["ux-foundation", "i18n-foundation"]
      })
    );
  }

  for (const route of raw.staticFindings.routeFallbacks.slice(0, 3)) {
    const missing = [route.missingLoading ? "loading.tsx" : null, route.missingError ? "error.tsx" : null].filter(Boolean).join(" + ");
    candidates.push(
      baseCandidate({
        dimension: "product_ux",
        title: `Rota sem estados auxiliares dedicados (${missing})`,
        location: {
          path: route.path,
          lines: { start: route.line, end: route.line }
        },
        problem: `A rota ${route.path} não traz todos os estados dedicados de loading/error esperados no App Router.`,
        impact: "Ausência desses estados degrada a UX percebida e deixa falhas/carregamentos longos sem tratamento consistente.",
        recommendation: "Adicionar arquivos dedicados de loading/error com feedback claro e recuperação assistida.",
        vdiFactors: {
          businessImpact: 4,
          securityRisk: 1,
          reverseEffort: 2,
          frequency: 3
        },
        effort: "0.5-1 dia",
        confidence: 0.91,
        evidenceRefs: [makeEvidenceRef(route.path, route.line, `Ausente: ${missing}`)],
        dependencyHints: ["ux-foundation"]
      })
    );
  }

  for (const occurrence of raw.staticFindings.imageWithoutAlt.slice(0, 2)) {
    candidates.push(
      baseCandidate({
        dimension: "product_ux",
        title: "Elemento de imagem sem alt explícito",
        location: {
          path: occurrence.path,
          lines: { start: occurrence.line, end: occurrence.line }
        },
        problem: `Identificado em ${occurrence.path}:${occurrence.line} um elemento <img> sem atributo alt na mesma linha.`,
        impact: "Esse padrão compromete acessibilidade e leitura assistiva em fluxos onde imagem carrega informação contextual.",
        recommendation: "Adicionar alt significativo ou marcar a imagem como decorativa quando aplicável.",
        vdiFactors: {
          businessImpact: 2,
          securityRisk: 1,
          reverseEffort: 1,
          frequency: 3
        },
        effort: "<2h",
        confidence: 0.92,
        evidenceRefs: [makeEvidenceRef(occurrence.path, occurrence.line, occurrence.summary)],
        dependencyHints: ["a11y-foundation"]
      })
    );
  }

  if ((raw.capabilities.docs.i18nFiles ?? []).length === 0) {
    candidates.push(
      baseCandidate({
        dimension: "product_ux",
        title: "Nenhuma superfície clara de i18n/localização encontrada no monorepo",
        location: {
          path: "apps/web/package.json",
          lines: { start: 1, end: 1 }
        },
        problem: "A auditoria não encontrou convenção explícita de i18n/locales/messages no frontend atual.",
        impact: "A expansão para múltiplos idiomas ou white-label com regionalização tende a exigir refactor transversal mais caro.",
        recommendation: "Definir uma base de i18n agora, antes de ampliar strings e jornadas do produto.",
        vdiFactors: {
          businessImpact: 3,
          securityRisk: 1,
          reverseEffort: 4,
          frequency: 4
        },
        effort: "2-5 dias",
        confidence: 0.75,
        evidenceRefs: [makeEvidenceRef("apps/web/package.json", 1, "Nenhuma infraestrutura explícita de i18n detectada por convenção de arquivos.")],
        inference: true,
        dependencyHints: ["i18n-foundation"]
      })
    );
  }

  for (const finding of (accessibility?.findings ?? []).slice(0, 4)) {
    const isRouteFinding = Boolean(finding.route);
    const locationPath = isRouteFinding
      ? raw.evidenceArtifacts.accessibility.path
      : normalizeArtifactPath(finding.file ?? raw.evidenceArtifacts.accessibility.path);

    candidates.push(
      baseCandidate({
        dimension: "product_ux",
        title: `A11y automatizada sinaliza ${finding.rule}`,
        location: {
          path: locationPath,
          lines: { start: Number(finding.line) || 1, end: Number(finding.line) || 1 }
        },
        problem: isRouteFinding
          ? `A evidência automatizada de acessibilidade encontrou ${finding.rule} na rota ${finding.route}.`
          : `A evidência automatizada de acessibilidade encontrou ${finding.rule} em ${locationPath}:${Number(finding.line) || 1}.`,
        impact: "Esse tipo de falha compromete navegação assistiva, semântica e prontidão WCAG em fluxos já renderizados.",
        recommendation: "Corrigir o elemento sinalizado e adicionar regressão automatizada para a rota/superfície afetada.",
        vdiFactors: {
          businessImpact: finding.severity === "medium" ? 3 : 2,
          securityRisk: 1,
          reverseEffort: 1,
          frequency: 3
        },
        effort: "<2h",
        confidence: 0.88,
        evidenceRefs: [makeEvidenceRef(raw.evidenceArtifacts.accessibility.path, 1, finding.message)],
        dependencyHints: ["a11y-foundation"]
      })
    );
  }

  return ensureTargetCount("product_ux", sortCandidates(candidates), dimensionConfig.find((entry) => entry.key === "product_ux").target);
}

async function buildOperationsCandidates(raw) {
  const candidates = [];
  const disasterRecovery = raw.evidenceArtifacts?.disasterRecovery?.data;
  const rlsProof = raw.evidenceArtifacts?.rlsProof?.data;

  if ((raw.capabilities.docs.slaFiles ?? []).length === 0) {
    candidates.push(
      baseCandidate({
        dimension: "operations_multitenancy",
        title: "SLA versionado não encontrado na documentação do repositório",
        location: {
          path: "docs/operational/README.md",
          lines: { start: 1, end: 1 }
        },
        problem: "A auditoria não encontrou um documento SLA explícito associado ao core ou aos tenants.",
        impact: "Sem SLA versionado, o alinhamento entre prioridade técnica, expectativa de tenant e operação de incidentes fica difuso.",
        recommendation: "Versionar um SLA mínimo por serviço crítico e vinculá-lo ao hub operacional.",
        vdiFactors: {
          businessImpact: 4,
          securityRisk: 2,
          reverseEffort: 2,
          frequency: 4
        },
        effort: "0.5-2 dias",
        confidence: 0.8,
        evidenceRefs: [makeEvidenceRef("docs/operational/README.md", 1, "Hub operacional presente, SLA explícito ausente por convenção de arquivos.")],
        inference: true,
        dependencyHints: ["ops-contract"]
      })
    );
  }

  if ((raw.capabilities.docs.onCallFiles ?? []).length === 0) {
    candidates.push(
      baseCandidate({
        dimension: "operations_multitenancy",
        title: "Playbook explícito de on-call não encontrado",
        location: {
          path: "docs/release/release-process.md",
          lines: { start: 1, end: 1 }
        },
        problem: "Há processo de release e runbook de go-live, mas sem playbook claro de on-call/escalation versionado no conjunto atual.",
        impact: "Sem definição formal de ownership e escalonamento, o tempo de restauração cresce em incidentes reais.",
        recommendation: "Publicar playbook de on-call com owners, contatos, severidades e critérios de escalonamento.",
        vdiFactors: {
          businessImpact: 4,
          securityRisk: 2,
          reverseEffort: 2,
          frequency: 3
        },
        effort: "0.5-1 dia",
        confidence: 0.76,
        evidenceRefs: [makeEvidenceRef("docs/release/release-process.md", 1, "Runbook de release presente; on-call playbook não identificado por convenção.")],
        inference: true,
        dependencyHints: ["ops-contract"]
      })
    );
  }

  if (!rlsProof?.sufficient && rlsProof?.runtimeProof?.status !== "passed") {
    candidates.push(
      baseCandidate({
        dimension: "operations_multitenancy",
        title: "Prova runtime de RLS por tenant ainda não fecha no runner soberano",
        location: {
          path: raw.evidenceArtifacts.rlsProof.path,
          lines: { start: 1, end: 1 }
        },
        problem: `A evidência fresca marca a prova runtime de RLS como "${rlsProof?.runtimeProof?.status ?? "indisponível"}", apesar de o audit estático de tenancy passar.`,
        impact: "Sem prova executada de isolamento no ciclo atual, o principal controle de multi-tenancy continua parcialmente presumido perto do lançamento.",
        recommendation: "Executar o teste de RLS contra Postgres efêmero acessível ao runner e anexar o artefato de sucesso ao pacote soberano.",
        vdiFactors: {
          businessImpact: 5,
          securityRisk: 5,
          reverseEffort: 3,
          frequency: 4
        },
        effort: "1-3 dias",
        confidence: 0.92,
        evidenceRefs: [
          makeEvidenceRef(raw.evidenceArtifacts.rlsProof.path, 1, `runtimeProof=${rlsProof?.runtimeProof?.status ?? "missing"}`),
          makeEvidenceRef("packages/database/test/rls.test.ts", 1, "Teste de RLS versionado no pacote database.")
        ],
        dependencyHints: ["tenant-proof"]
      })
    );
  }

  if (disasterRecovery?.status && disasterRecovery.status !== "recorded") {
    candidates.push(
      baseCandidate({
        dimension: "operations_multitenancy",
        title: "Drill de disaster recovery não registrado no ciclo atual",
        location: {
          path: raw.evidenceArtifacts.disasterRecovery.path,
          lines: { start: 1, end: 1 }
        },
        problem: `O artefato fresco de DR está em status "${disasterRecovery.status}", sem comprovação recente de exercício de recuperação.`,
        impact: "A recuperabilidade operacional segue mais assumida do que comprovada, elevando risco de restauração lenta em incidente real.",
        recommendation: "Executar o drill com o script operacional versionado e anexar o resultado ao pacote soberano do ciclo.",
        vdiFactors: {
          businessImpact: 4,
          securityRisk: 3,
          reverseEffort: 2,
          frequency: 3
        },
        effort: "0.5-2 dias",
        confidence: 0.89,
        evidenceRefs: [makeEvidenceRef(raw.evidenceArtifacts.disasterRecovery.path, 1, `status=${disasterRecovery.status}`)],
        dependencyHints: ["ops-contract"]
      })
    );
  }

  if ((raw.capabilities.docs.fhirFiles ?? []).length === 0) {
    candidates.push(
      baseCandidate({
        dimension: "operations_multitenancy",
        title: "Ausência de superfícies explícitas de interoperabilidade clínica padrão",
        location: {
          path: "packages/integrations/src/clients/http.ts",
          lines: { start: 1, end: 1 }
        },
        problem: "Há base de conectores genérica, mas a auditoria não encontrou superfícies FHIR/HL7 versionadas no HEAD atual.",
        impact: "Para healthtech, isso limita integração operacional com ecossistema clínico e aumenta esforço por implantação.",
        recommendation: "Planejar uma camada clínica padronizada de interoperabilidade antes de escalar tenants enterprise.",
        vdiFactors: {
          businessImpact: 4,
          securityRisk: 2,
          reverseEffort: 4,
          frequency: 3
        },
        effort: "1-2 semanas",
        confidence: 0.69,
        evidenceRefs: [makeEvidenceRef("packages/integrations/src/clients/http.ts", 1, "Base HTTP genérica presente; padrões clínicos não detectados por convenção de arquivos.")],
        inference: true,
        dependencyHints: ["clinical-interoperability"]
      })
    );
  }

  return ensureTargetCount("operations_multitenancy", sortCandidates(candidates), dimensionConfig.find((entry) => entry.key === "operations_multitenancy").target);
}

function buildInnovationItems(raw) {
  const hasLlm = raw.capabilities.runtimeFlags.hasLlmClient;
  const hasWorkflow = raw.capabilities.runtimeFlags.hasWorkflowsModule;
  const hasConnectors = raw.capabilities.runtimeFlags.hasConnectorsModule;
  const hasAnalytics = raw.capabilities.runtimeFlags.hasAnalyticsModule;
  const items = [];

  for (const category of innovationCategoryConfig) {
    const seeds = innovationSeeds[category.key] ?? [];
    for (const [name, description] of seeds) {
      const viabilityBoost =
        category.key === "ai_ml_native" && hasLlm
          ? 1
          : category.key === "clinical_automation" && hasWorkflow
            ? 1
            : category.key === "interoperability_data" && hasConnectors
              ? 1
              : category.key === "analytics_bi" && hasAnalytics
                ? 1
                : 0;
      items.push({
        category: category.label,
        categoryKey: category.key,
        name,
        technicalDescription: `${description} Base técnica observada no repositório: ${category.evidencePaths.join(", ")}.`,
        businessValue: "Aumenta diferenciação do produto, eleva barreira competitiva e cria oportunidade de expansão de receita no contexto healthtech multi-tenant.",
        technicalViability: Math.max(1, Math.min(5, 3 + viabilityBoost)),
        differentiationPotential: category.key === "marketplace_ecosystem" || category.key === "ai_ml_native" ? 5 : 4,
        phase: category.phase,
        currentStateEvidence: category.evidencePaths,
        dependencyHints: category.key === "ai_ml_native"
          ? ["data-contracts", "clinical-interoperability"]
          : category.key === "clinical_automation"
            ? ["workflow-runtime", "tenant-proof"]
            : category.key === "interoperability_data"
              ? ["clinical-interoperability", "data-contracts"]
              : category.key === "advanced_monetization"
                ? ["billing-foundation", "analytics-foundation"]
                : ["platform-foundation"]
      });
    }
  }

  return items;
}

async function main() {
  const { dateOnly } = reportDateParts();
  const supportDirectory = supportRoot(dateOnly);
  const raw = parseJson(await readText(path.join(supportDirectory, "01-raw-evidence.json")));

  const debtByDimension = {
    architecture: await buildArchitectureCandidates(raw),
    code_quality: await buildCodeQualityCandidates(raw),
    security: await buildSecurityCandidates(raw),
    tests_observability: await buildTestsObservabilityCandidates(raw),
    performance: await buildPerformanceCandidates(raw),
    devops: await buildDevOpsCandidates(raw),
    product_ux: await buildProductUxCandidates(raw),
    operations_multitenancy: await buildOperationsCandidates(raw)
  };

  const normalized = {
    metadata: raw.metadata,
    evidenceSummary: {
      repo: raw.repo,
      capabilities: raw.capabilities,
      git: raw.git,
      supportingReferences: raw.supportingReferences
    },
    debtCandidates: debtByDimension,
    innovationCandidates: buildInnovationItems(raw),
    glossaryTerms: glossaryTerms.map(([term, definition]) => ({ term, definition }))
  };

  await writeJson(path.join(supportDirectory, "02-normalized.json"), normalized);
  console.log(path.join(supportDirectory, "02-normalized.json"));
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
