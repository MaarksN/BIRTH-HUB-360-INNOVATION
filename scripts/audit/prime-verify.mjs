#!/usr/bin/env node
// @ts-nocheck
// 
import path from "node:path";
import assert from "node:assert/strict";

import { readText, reportDateParts, supportRoot } from "./shared-prime.mjs";

function parseJson(text) {
  return JSON.parse(text);
}

function computeVdi(vdiFactors) {
  return Number(
    (
      vdiFactors.businessImpact * 0.35 +
      vdiFactors.securityRisk * 0.30 +
      vdiFactors.reverseEffort * 0.20 +
      vdiFactors.frequency * 0.15
    ).toFixed(2)
  );
}

async function main() {
  const { dateOnly, slug } = reportDateParts();
  const supportDirectory = supportRoot(dateOnly);
  const report = parseJson(await readText(path.join(supportDirectory, "03-scored-report.json")));
  const html = await readText(path.join("audit", `${slug}.html`));

  assert.equal(report.debtItems.length, 100, "debtItems must have exactly 100 entries");
  assert.equal(report.innovationItems.length, 100, "innovationItems must have exactly 100 entries");

  const categoryCounts = report.innovationItems.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] ?? 0) + 1;
    return acc;
  }, {});

  assert.equal(categoryCounts["AI/ML Nativa"], 12);
  assert.equal(categoryCounts["Automação de Fluxos Clínicos"], 12);
  assert.equal(categoryCounts["Interoperabilidade & Dados"], 10);
  assert.equal(categoryCounts["Engajamento & Retenção"], 10);
  assert.equal(categoryCounts["Analytics & Business Intelligence"], 10);
  assert.equal(categoryCounts["Marketplace & Ecossistema"], 8);
  assert.equal(categoryCounts["Infraestrutura & Developer Experience"], 8);
  assert.equal(categoryCounts["Compliance & Regulatório"], 10);
  assert.equal(categoryCounts["Monetização Avançada"], 10);
  assert.equal(categoryCounts["Experiência do Usuário Next-Gen"], 10);

  for (const item of report.debtItems) {
    assert.ok(item.location?.path, `${item.id} must include location.path`);
    assert.ok(item.location?.lines?.start >= 1, `${item.id} must include line start`);
    assert.equal(item.vdiScore, computeVdi(item.vdiFactors), `${item.id} VDI formula drift`);
  }

  for (const id of [
    "#executive-summary",
    "#debt-items",
    "#innovation-items",
    "#roadmap",
    "#dependency-matrix",
    "#glossary",
    "Copiar como Markdown",
    "Exportar JSON"
  ]) {
    assert.ok(html.includes(id), `HTML missing ${id}`);
  }

  console.log(`auditor-prime verification passed for ${slug}`);
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
