#!/usr/bin/env node
// @ts-nocheck
// 
import path from "node:path";

import {
  copyFile,
  latestArtifactPath,
  readText,
  reportDateParts,
  writeJson,
  writeText
} from "./shared-prime.mjs";

function parseJson(text) {
  return JSON.parse(text);
}

function rankTopDebtItems(report) {
  return [...report.debtItems]
    .sort((left, right) => right.vdiScore - left.vdiScore || right.confidence - left.confidence)
    .slice(0, 15);
}

function sprintForDimension(dimension) {
  if (dimension === "security" || dimension === "operations_multitenancy") {
    return 1;
  }
  if (dimension === "code_quality" || dimension === "tests_observability" || dimension === "devops") {
    return 2;
  }
  return 3;
}

function ownerForItem(item) {
  const location = item.location?.path ?? "";

  if (location.startsWith("packages/database/")) return "@platform-data";
  if (location.startsWith("apps/api/")) return "@platform-api";
  if (location.startsWith("apps/web/")) return "@product-frontend";
  if (location.startsWith("apps/worker/")) return "@platform-automation";
  if (location.startsWith("infra/") || location.startsWith("docs/operations/")) return "@platform-architecture";
  if (item.dimension === "security") return "@platform-security";
  if (item.dimension === "tests_observability") return "@platform-observability";
  return "@platform-architecture";
}

function acceptanceCriteria(item) {
  if (/raw query/i.test(item.title)) {
    return "Nenhum uso inseguro remanescente no escopo do item; validação direcionada executada; auditor-prime rerodado sem reincidência do achado.";
  }
  if (/RLS|row-level security|tenant/i.test(item.title)) {
    return "Prova de isolamento atualizada em `artifacts/tenancy/rls-proof-head.json`, controles de tenancy verificados e item rebaixado/removido na próxima auditoria.";
  }
  if (item.dimension === "operations_multitenancy") {
    return "Capacidade operacional/multi-tenant materializada com evidência versionada, critério técnico validado e item rebaixado/removido na próxima auditoria.";
  }
  if (item.dimension === "tests_observability") {
    return "Evidência fresca anexada ao pipeline soberano, com referência versionada e consumo automático pelo `audit:prime`.";
  }
  if (item.dimension === "performance" || item.dimension === "product_ux") {
    return "Hotspot segmentado sem regressão funcional, com baseline atualizada e critério de experiência/performance validado.";
  }
  return "Correção aplicada, dependências fechadas, evidência regenerada e item reavaliado pelo auditor-prime no próximo ciclo.";
}

function buildSprintSections(items) {
  const grouped = new Map([
    [1, []],
    [2, []],
    [3, []]
  ]);

  for (const item of items) {
    grouped.get(sprintForDimension(item.dimension)).push({
      id: item.id,
      title: item.title,
      owner: ownerForItem(item),
      effort: item.effort,
      dependencies: item.dependencies ?? [],
      acceptanceCriteria: acceptanceCriteria(item),
      path: item.location?.path ?? ""
    });
  }

  return [
    {
      sprint: 1,
      theme: "Segurança + multi-tenancy",
      items: grouped.get(1)
    },
    {
      sprint: 2,
      theme: "Qualidade + observabilidade",
      items: grouped.get(2)
    },
    {
      sprint: 3,
      theme: "Performance + UX técnica",
      items: grouped.get(3)
    },
    {
      sprint: 4,
      theme: "Inovação somente após estabilização do core",
      items: [],
      gate:
        "Iniciar inovação apenas depois que os critérios de aceite dos sprints 1-3 estiverem fechados e os itens VDI 4.0+ tiverem sido eliminados ou rebaixados."
    }
  ];
}

async function main() {
  const { dateOnly, slug } = reportDateParts();
  const reportPath = path.join("audit", `${slug}.json`);
  const report = parseJson(await readText(reportPath));
  const top15 = rankTopDebtItems(report);
  const sprints = buildSprintSections(top15);
  const payload = {
    generatedAt: new Date().toISOString(),
    sourceReport: reportPath,
    top15Ids: top15.map((item) => item.id),
    sprints
  };

  const markdown = [
    "# Top 15 VDI Backlog",
    "",
    `- Generated at: ${payload.generatedAt}`,
    `- Source report: \`${payload.sourceReport}\``,
    "",
    ...sprints.flatMap((sprint) => {
      const lines = [
        `## Sprint ${sprint.sprint} — ${sprint.theme}`,
        ""
      ];

      if (sprint.gate) {
        lines.push(`- Gate: ${sprint.gate}`, "");
      }

      if (sprint.items.length === 0) {
        lines.push("- Sem itens de dívida adicionais alocados neste sprint.", "");
        return lines;
      }

      lines.push("| Item | Owner | Esforço | Dependências | Critério de aceite |");
      lines.push("| --- | --- | --- | --- | --- |");
      for (const item of sprint.items) {
        lines.push(
          `| ${item.id} ${item.title} (\`${item.path}\`) | ${item.owner} | ${item.effort} | ${item.dependencies.join(", ") || "nenhuma"} | ${item.acceptanceCriteria} |`
        );
      }
      lines.push("");
      return lines;
    })
  ].join("\n");

  const jsonPath = path.join("audit", `top-15-vdi-backlog-${dateOnly}.json`);
  const mdPath = path.join("audit", `top-15-vdi-backlog-${dateOnly}.md`);

  await writeJson(jsonPath, payload);
  await writeText(mdPath, `${markdown}\n`);
  await copyFile(jsonPath, latestArtifactPath("backlog.json"));
  await copyFile(mdPath, latestArtifactPath("backlog.md"));

  console.log(mdPath);
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
