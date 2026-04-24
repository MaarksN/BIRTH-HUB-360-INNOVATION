#!/usr/bin/env node
// @ts-nocheck
// 
import path from "node:path";

import { readText, reportDateParts, supportRoot, writeJson } from "./shared-prime.mjs";
import { dimensionConfig } from "./prime-catalog.mjs";

function parseJson(text) {
  return JSON.parse(text);
}

function assignIds(items, prefix) {
  return items.map((item, index) => ({
    ...item,
    id: `${prefix}-${String(index + 1).padStart(3, "0")}`
  }));
}

function flattenDebtCandidates(normalized) {
  const rows = [];
  for (const dimension of dimensionConfig) {
    for (const candidate of normalized.debtCandidates[dimension.key] ?? []) {
      rows.push({
        ...candidate,
        dimensionLabel: dimension.label
      });
    }
  }
  return assignIds(rows, "TD");
}

function assignInnovationIds(items) {
  return items.map((item, index) => ({
    ...item,
    id: `IN-${String(index + 1).padStart(3, "0")}`
  }));
}

function mapHintOwners(debtItems) {
  const owners = new Map();
  for (const item of debtItems) {
    for (const hint of item.dependencyHints ?? []) {
      if (!owners.has(hint)) {
        owners.set(hint, item.id);
      }
    }
  }
  return owners;
}

function resolveDependencies(items, hintOwners) {
  return items.map((item) => {
    const dependencies = [...new Set(
      (item.dependencyHints ?? [])
        .map((hint) => hintOwners.get(hint))
        .filter(Boolean)
        .filter((dependencyId) => dependencyId !== item.id)
    )];
    return {
      ...item,
      dependencies
    };
  });
}

function dimensionWeights() {
  return {
    architecture: 14,
    code_quality: 12,
    security: 18,
    tests_observability: 12,
    performance: 12,
    devops: 12,
    product_ux: 10,
    operations_multitenancy: 10
  };
}

function computeHealthByDimension(debtItems) {
  const weights = dimensionWeights();
  const results = [];

  for (const dimension of dimensionConfig) {
    const items = debtItems.filter((item) => item.dimension === dimension.key);
    const topThree = items.slice(0, 3);
    const avgVdi = topThree.length
      ? topThree.reduce((sum, item) => sum + item.vdiScore, 0) / topThree.length
      : 0;
    const weight = weights[dimension.key] ?? 10;
    const deduction = weight * (avgVdi / 5) * 0.75;
    const score = Math.max(0, Number((weight - deduction).toFixed(2)));

    results.push({
      key: dimension.key,
      label: dimension.label,
      weight,
      avgTopVdi: Number(avgVdi.toFixed(2)),
      score
    });
  }

  return results;
}

function computeOverallHealth(dimensionScores) {
  return Math.max(
    0,
    Math.min(
      100,
      Math.round(dimensionScores.reduce((sum, item) => sum + item.score, 0))
    )
  );
}

function computeCostOfNonAction(debtItems) {
  const topFifteen = [...debtItems]
    .sort((left, right) => right.vdiScore - left.vdiScore || right.confidence - left.confidence)
    .slice(0, 15);
  const weeks = topFifteen.reduce((sum, item) => sum + item.vdiScore / 6, 0);
  return Number(weeks.toFixed(1));
}

function computeLaunchViability(healthScore, debtItems) {
  const critical = debtItems.filter((item) => item.vdiScore >= 4.0);
  const criticalSecurity = critical.filter((item) => item.dimension === "security" || item.dimension === "operations_multitenancy");

  if (healthScore < 45 || criticalSecurity.length >= 4) {
    return {
      status: "NÃO",
      justification: "Há massa crítica de riscos de segurança/multi-tenancy ou score técnico baixo demais para uma janela segura de 30 dias."
    };
  }
  if (healthScore < 70 || critical.length >= 5) {
    return {
      status: "CONDICIONAL",
      justification: "O lançamento depende de fechamento disciplinado dos itens VDI 4.0+ nas fases 0 e 1."
    };
  }
  return {
    status: "SIM",
    justification: "O estado técnico atual permite lançamento sem bloqueadores imediatos relevantes."
  };
}

function phaseWorkUnits(items) {
  return items.reduce((sum, item) => sum + item.vdiFactors.reverseEffort, 0);
}

function phaseHeadcount(phase, items, weeks) {
  const units = phaseWorkUnits(items);
  const required = Math.max(2, Math.ceil(units / Math.max(1, weeks * 3)));
  return {
    phase,
    recommendedHeadcount: required,
    exceedsAvailableTeam: required > 4
  };
}

function buildExecutionRoadmap(debtItems, innovationItems) {
  const phaseConfig = [
    {
      phase: "Fase 0",
      title: "Estabilização (Semanas 1-2)",
      objective: "Resolver todos os itens VDI 4.0+ que bloqueiam segurança, isolamento de tenant ou funcionamento básico.",
      weeks: 2,
      debtFilter: (item) => item.phase === "Fase 0"
    },
    {
      phase: "Fase 1",
      title: "Fundação (Semanas 3-8)",
      objective: "Infraestrutura, CI/CD, cobertura mínima, segurança operacional e governança de configuração.",
      weeks: 6,
      debtFilter: (item) => item.phase === "Fase 1"
    },
    {
      phase: "Fase 2",
      title: "Qualidade (Semanas 9-16)",
      objective: "Refactor de hotspots, performance, experiência do usuário e observabilidade end-to-end.",
      weeks: 8,
      debtFilter: (item) => item.phase === "Fase 2"
    },
    {
      phase: "Fase 3",
      title: "Escala (Semanas 17-24)",
      objective: "Fortalecer multi-tenancy, billing avançado, interoperabilidade clínica e recuperabilidade.",
      weeks: 8,
      debtFilter: (item) => item.phase === "Fase 3"
    },
    {
      phase: "Fase 4",
      title: "Inovação (Semanas 25-52)",
      objective: "Executar os 100 itens de inovação em ordem de ROI e dependência técnica.",
      weeks: 28,
      debtFilter: () => false
    }
  ];

  return phaseConfig.map((phase) => {
    const phaseDebt = debtItems.filter(phase.debtFilter);
    const phaseInnovations = innovationItems.filter((item) => item.phase === phase.phase);
    const headcount = phaseHeadcount(phase.phase, phaseDebt, phase.weeks);
    return {
      phase: phase.phase,
      title: phase.title,
      objective: phase.objective,
      debtIds: phaseDebt.map((item) => item.id),
      innovationIds: phaseInnovations.map((item) => item.id),
      progressWeight: phaseDebt.length + phaseInnovations.length,
      headcount
    };
  });
}

function buildDependencyMatrix(debtItems, innovationItems, roadmap) {
  const topDebt = [...debtItems]
    .sort((left, right) => right.vdiScore - left.vdiScore || right.confidence - left.confidence)
    .slice(0, 12);
  const topInnovation = innovationItems.slice(0, 10);
  const nodes = [
    ...topDebt.map((item) => ({
      id: item.id,
      label: item.title,
      phase: item.phase,
      type: "debt"
    })),
    ...topInnovation.map((item) => ({
      id: item.id,
      label: item.name,
      phase: item.phase,
      type: "innovation"
    }))
  ];

  const edges = [];
  for (const item of topDebt) {
    for (const dependency of item.dependencies ?? []) {
      edges.push({
        from: dependency,
        to: item.id,
        reason: "Debt dependency"
      });
    }
  }

  const firstPhase0 = roadmap.find((phase) => phase.phase === "Fase 0")?.debtIds[0] ?? null;
  const firstPhase1 = roadmap.find((phase) => phase.phase === "Fase 1")?.debtIds[0] ?? null;
  const firstPhase2 = roadmap.find((phase) => phase.phase === "Fase 2")?.debtIds[0] ?? null;
  const firstPhase3 = roadmap.find((phase) => phase.phase === "Fase 3")?.debtIds[0] ?? null;

  for (const innovation of topInnovation) {
    if (innovation.phase === "Fase 4" && firstPhase3) {
      edges.push({
        from: firstPhase3,
        to: innovation.id,
        reason: "Scale foundation before innovation"
      });
    } else if (innovation.phase === "Fase 3" && firstPhase2) {
      edges.push({
        from: firstPhase2,
        to: innovation.id,
        reason: "Quality foundation before scale innovation"
      });
    } else if (innovation.phase === "Fase 2" && firstPhase1) {
      edges.push({
        from: firstPhase1,
        to: innovation.id,
        reason: "Foundation before DX innovation"
      });
    }
  }

  const criticalPath = [firstPhase0, firstPhase1, firstPhase2, firstPhase3].filter(Boolean);

  return {
    nodes,
    edges,
    criticalPath,
    headcountByPhase: roadmap.map((phase) => phase.headcount)
  };
}

function buildExecutiveSummary(healthScore, debtItems, costOfNonAction, launchViability) {
  const topRisks = [...debtItems]
    .sort((left, right) => right.vdiScore - left.vdiScore || right.confidence - left.confidence)
    .slice(0, 5)
    .map((item) => ({
    id: item.id,
    title: item.title,
    dimension: item.dimensionLabel,
    impact: item.impact,
    vdiScore: item.vdiScore,
    location: item.location
  }));

  return {
    technicalHealthScore: healthScore,
    topRisks,
    costOfNonActionWeeksPerMonth: costOfNonAction,
    launchViability
  };
}

function buildPendingAnalysis(debtItems) {
  return debtItems
    .filter((item) => item.insufficient)
    .map((item) => ({
      id: item.id,
      title: item.title,
      requires: item.title.match(/REQUER:\s*([^\]]+)/)?.[1] ?? "evidência adicional",
      location: item.location
    }));
}

async function main() {
  const { dateOnly, slug } = reportDateParts();
  const supportDirectory = supportRoot(dateOnly);
  const normalized = parseJson(await readText(path.join(supportDirectory, "02-normalized.json")));

  const debtItems = resolveDependencies(
    flattenDebtCandidates(normalized),
    mapHintOwners(flattenDebtCandidates(normalized))
  );
  const innovationItems = assignInnovationIds(normalized.innovationCandidates);

  const dimensionScores = computeHealthByDimension(debtItems);
  const healthScore = computeOverallHealth(dimensionScores);
  const costOfNonAction = computeCostOfNonAction(debtItems);
  const launchViability = computeLaunchViability(healthScore, debtItems);
  const roadmap = buildExecutionRoadmap(debtItems, innovationItems);
  const dependencyMatrix = buildDependencyMatrix(debtItems, innovationItems, roadmap);
  const executiveSummary = buildExecutiveSummary(healthScore, debtItems, costOfNonAction, launchViability);
  const pendingAnalysis = buildPendingAnalysis(debtItems);

  const finalReport = {
    metadata: {
      ...normalized.metadata,
      slug,
      reportFiles: {
        html: `audit/${slug}.html`,
        json: `audit/${slug}.json`,
        markdown: `audit/${slug}.md`
      }
    },
    executiveSummary,
    debtItems,
    innovationItems,
    executionRoadmap: roadmap,
    dependencyMatrix,
    glossary: normalized.glossaryTerms,
    pendingAnalysis,
    analytics: {
      dimensionScores,
      debtCount: debtItems.length,
      innovationCount: innovationItems.length,
      innovationCategoryCounts: innovationItems.reduce((acc, item) => {
        acc[item.category] = (acc[item.category] ?? 0) + 1;
        return acc;
      }, {})
    },
    evidenceSummary: normalized.evidenceSummary
  };

  await writeJson(path.join(supportDirectory, "03-scored-report.json"), finalReport);
  console.log(path.join(supportDirectory, "03-scored-report.json"));
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
