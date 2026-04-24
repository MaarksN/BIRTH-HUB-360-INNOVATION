#!/usr/bin/env node
// @ts-nocheck
// 
import path from "node:path";

import {
  copyFile,
  escapeHtml,
  latestArtifactPath,
  readText,
  relativePath,
  reportDateParts,
  supportRoot,
  writeJson,
  writeText
} from "./shared-prime.mjs";

function parseJson(text) {
  return JSON.parse(text);
}

function markdownForDebtItem(item) {
  const location = `${item.location.path}:${item.location.lines.start}`;
  return [
    `- ${item.id} | ${item.title}`,
    `  Localização: ${location}`,
    `  Problema: ${item.problem}`,
    `  Impacto: ${item.impact}`,
    `  Solução recomendada: ${item.recommendation}`,
    `  VDI: ${item.vdiScore} (${item.severity})`,
    `  Esforço: ${item.effort}`
  ].join("\n");
}

function markdownForInnovation(item) {
  return [
    `- ${item.id} | ${item.name}`,
    `  Categoria: ${item.category}`,
    `  Descrição técnica: ${item.technicalDescription}`,
    `  Valor de negócio: ${item.businessValue}`,
    `  Viabilidade técnica: ${item.technicalViability}/5`,
    `  Potencial de diferenciação: ${item.differentiationPotential}/5`,
    `  Fase: ${item.phase}`
  ].join("\n");
}

function buildMarkdown(report) {
  const lines = [
    `# Auditoria Soberana BirthHub360`,
    "",
    `## 1. EXECUTIVE SUMMARY`,
    "",
    `- Score geral de saúde técnica: ${report.executiveSummary.technicalHealthScore}/100`,
    `- Estimativa de custo de não-ação: ${report.executiveSummary.costOfNonActionWeeksPerMonth} semanas de engenharia perdidas/mês`,
    `- Viabilidade de lançamento: ${report.executiveSummary.launchViability.status} — ${report.executiveSummary.launchViability.justification}`,
    "",
    `### Top 5 riscos críticos`,
    ""
  ];

  for (const risk of report.executiveSummary.topRisks) {
    lines.push(`- ${risk.id} | ${risk.title} | ${risk.dimension} | VDI ${risk.vdiScore} | ${risk.location.path}:${risk.location.lines.start}`);
  }

  lines.push("", `### Análise Pendente`, "");
  if (report.pendingAnalysis.length === 0) {
    lines.push("- Nenhuma lacuna pendente acima do limiar de reporte.");
  } else {
    for (const pending of report.pendingAnalysis) {
      lines.push(`- ${pending.id} | ${pending.title} | requer: ${pending.requires}`);
    }
  }

  lines.push("", `## 2. MAPA DE DÍVIDA TÉCNICA — 100 ITENS DE MELHORIA`, "");
  const dimensionOrder = [...new Set(report.debtItems.map((item) => item.dimensionLabel))];
  for (const dimensionLabel of dimensionOrder) {
    lines.push(`### ${dimensionLabel}`, "");
    for (const item of report.debtItems.filter((row) => row.dimensionLabel === dimensionLabel)) {
      lines.push(markdownForDebtItem(item), "");
    }
  }

  lines.push("", `## 3. ROADMAP DE INOVAÇÃO — 100 ITENS DE NOVA IMPLEMENTAÇÃO`, "");
  const categoryOrder = [...new Set(report.innovationItems.map((item) => item.category))];
  for (const category of categoryOrder) {
    lines.push(`### ${category}`, "");
    for (const item of report.innovationItems.filter((row) => row.category === category)) {
      lines.push(markdownForInnovation(item), "");
    }
  }

  lines.push("", `## 4. ROADMAP DE EXECUÇÃO — FASES ESTRUTURADAS`, "");
  for (const phase of report.executionRoadmap) {
    lines.push(`### ${phase.phase} — ${phase.title}`, "");
    lines.push(`- Objetivo: ${phase.objective}`);
    lines.push(`- Itens de dívida: ${phase.debtIds.length}`);
    lines.push(`- Itens de inovação: ${phase.innovationIds.length}`);
    lines.push(`- Headcount recomendado: ${phase.headcount.recommendedHeadcount}${phase.headcount.exceedsAvailableTeam ? " (excede o time disponível de 2-4 pessoas)" : ""}`);
    lines.push("");
  }

  lines.push("", `## 5. MATRIZ DE DEPENDÊNCIAS`, "");
  lines.push(`- Caminho crítico: ${report.dependencyMatrix.criticalPath.join(" -> ") || "n/d"}`);
  lines.push(`- Nós mapeados: ${report.dependencyMatrix.nodes.length}`);
  lines.push(`- Arestas mapeadas: ${report.dependencyMatrix.edges.length}`);
  lines.push("");
  for (const edge of report.dependencyMatrix.edges.slice(0, 30)) {
    lines.push(`- ${edge.from} -> ${edge.to} (${edge.reason})`);
  }

  lines.push("", `## 6. GLOSSÁRIO TÉCNICO`, "");
  for (const entry of report.glossary) {
    lines.push(`- ${entry.term}: ${entry.definition}`);
  }

  return `${lines.join("\n")}\n`;
}

function buildHtml(report, markdown) {
  const serializedReport = JSON.stringify(report).replace(/</g, "\\u003c");
  const serializedMarkdown = JSON.stringify(markdown).replace(/</g, "\\u003c");

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Auditoria Soberana BirthHub360</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Plus+Jakarta+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
      :root {
        --bg-primary: #070B14;
        --bg-secondary: #0D1525;
        --glass: rgba(255,255,255,0.04);
        --glass-border: rgba(255,255,255,0.08);
        --aurora-1: #00D4FF;
        --aurora-2: #7B61FF;
        --aurora-3: #00FFB2;
        --aurora-4: #FF6B6B;
        --aurora-5: #FFB347;
        --text-primary: #F0F4FF;
        --text-secondary: rgba(240,244,255,0.6);
        --text-muted: rgba(240,244,255,0.35);
        --critical: #FF4D4D;
        --high: #FF8C42;
        --medium: #FFD166;
        --low: #06D6A0;
        --font-display: 'Syne', sans-serif;
        --font-body: 'Plus Jakarta Sans', sans-serif;
        --font-mono: 'JetBrains Mono', monospace;
      }
      * { box-sizing: border-box; }
      html { scroll-behavior: smooth; }
      body {
        margin: 0;
        color: var(--text-primary);
        font-family: var(--font-body);
        background:
          radial-gradient(circle at 12% 14%, rgba(0,212,255,0.15), transparent 28%),
          radial-gradient(circle at 85% 10%, rgba(123,97,255,0.16), transparent 28%),
          radial-gradient(circle at 50% 85%, rgba(0,255,178,0.1), transparent 26%),
          linear-gradient(180deg, #050912 0%, #07111f 100%);
      }
      a { color: var(--aurora-1); text-decoration: none; }
      .app {
        display: grid;
        grid-template-columns: 280px 1fr;
        min-height: 100vh;
      }
      nav {
        position: sticky;
        top: 0;
        height: 100vh;
        padding: 24px 18px;
        border-right: 1px solid var(--glass-border);
        background: rgba(7, 11, 20, 0.78);
        backdrop-filter: blur(16px);
      }
      nav h1 {
        margin: 0 0 12px;
        font-family: var(--font-display);
        font-size: 1.15rem;
      }
      nav .meta {
        color: var(--text-secondary);
        font-size: 0.9rem;
        margin-bottom: 18px;
      }
      nav ul {
        list-style: none;
        padding: 0;
        margin: 0 0 18px;
        display: grid;
        gap: 8px;
      }
      nav li a {
        display: block;
        padding: 10px 12px;
        border: 1px solid transparent;
        border-radius: 12px;
        background: rgba(255,255,255,0.02);
      }
      nav li a:hover {
        border-color: var(--glass-border);
        background: rgba(255,255,255,0.05);
      }
      main {
        padding: 28px;
        display: grid;
        gap: 22px;
      }
      header, section, footer, .panel {
        background: var(--glass);
        border: 1px solid var(--glass-border);
        border-radius: 22px;
        backdrop-filter: blur(14px);
      }
      header {
        padding: 24px;
        display: grid;
        gap: 18px;
      }
      .hero {
        display: grid;
        grid-template-columns: 1.3fr 1fr;
        gap: 18px;
      }
      .score-shell {
        display: grid;
        gap: 16px;
      }
      .score-ring {
        width: 180px;
        height: 180px;
        border-radius: 50%;
        background: conic-gradient(var(--aurora-1) calc(var(--score) * 1%), rgba(255,255,255,0.08) 0);
        display: grid;
        place-items: center;
        position: relative;
      }
      .score-ring::after {
        content: "";
        position: absolute;
        inset: 14px;
        border-radius: 50%;
        background: rgba(7,11,20,0.94);
        border: 1px solid var(--glass-border);
      }
      .score-ring span {
        position: relative;
        z-index: 1;
        font-family: var(--font-display);
        font-size: 2.7rem;
        font-weight: 800;
      }
      .kpis {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 14px;
      }
      .kpi, .subpanel {
        padding: 16px;
        border-radius: 18px;
        border: 1px solid var(--glass-border);
        background: rgba(255,255,255,0.03);
      }
      .kpi strong {
        display: block;
        font-size: 1.5rem;
        margin-top: 8px;
      }
      .label, .muted {
        color: var(--text-secondary);
      }
      .mono {
        font-family: var(--font-mono);
      }
      .toolbar {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
        gap: 12px;
        padding: 18px 22px;
      }
      input, select, button {
        width: 100%;
        border-radius: 14px;
        border: 1px solid var(--glass-border);
        background: rgba(255,255,255,0.04);
        color: var(--text-primary);
        padding: 12px 14px;
        font: inherit;
      }
      button {
        cursor: pointer;
        background: linear-gradient(135deg, rgba(0,212,255,0.18), rgba(123,97,255,0.18));
      }
      section {
        padding: 22px;
      }
      h2, h3 {
        margin-top: 0;
        font-family: var(--font-display);
      }
      .metrics-grid, .timeline, .glossary-grid {
        display: grid;
        gap: 14px;
      }
      .timeline .phase {
        padding: 16px;
        border-radius: 16px;
        border: 1px solid var(--glass-border);
        background: rgba(255,255,255,0.03);
      }
      .progress {
        height: 10px;
        border-radius: 999px;
        background: rgba(255,255,255,0.08);
        overflow: hidden;
      }
      .bar {
        height: 100%;
        background: linear-gradient(90deg, var(--aurora-1), var(--aurora-3));
      }
      .cards {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 14px;
      }
      details.card {
        border: 1px solid var(--glass-border);
        border-radius: 18px;
        background: rgba(255,255,255,0.03);
        overflow: hidden;
      }
      details summary {
        list-style: none;
        cursor: pointer;
        padding: 16px;
        display: grid;
        gap: 10px;
      }
      details summary::-webkit-details-marker { display: none; }
      .card-body {
        padding: 0 16px 16px;
        display: grid;
        gap: 10px;
      }
      .badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 10px;
        border-radius: 999px;
        font-size: 0.78rem;
        border: 1px solid var(--glass-border);
      }
      .critical { color: var(--critical); }
      .high { color: var(--high); }
      .medium { color: var(--medium); }
      .low { color: var(--low); }
      .split {
        display: grid;
        grid-template-columns: 1.1fr 0.9fr;
        gap: 16px;
      }
      .risk-matrix {
        width: 100%;
        height: 320px;
        border-radius: 18px;
        background: linear-gradient(180deg, rgba(255,107,107,0.08), rgba(0,255,178,0.05));
        border: 1px solid var(--glass-border);
      }
      .phase-counts {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 12px;
      }
      .tiny {
        font-size: 0.86rem;
        color: var(--text-secondary);
      }
      .footer-meta {
        padding: 18px 22px;
        color: var(--text-secondary);
      }
      @media (max-width: 1100px) {
        .app { grid-template-columns: 1fr; }
        nav { position: static; height: auto; }
        .hero, .split { grid-template-columns: 1fr; }
      }
    </style>
  </head>
  <body>
    <div class="app">
      <nav>
        <h1>BirthHub360</h1>
        <div class="meta">Auditoria soberana<br />${escapeHtml(report.metadata.reportDate)}<br /><span class="mono">${escapeHtml(report.metadata.headSha.slice(0, 12))}</span></div>
        <ul>
          <li><a href="#executive-summary">Executive Summary</a></li>
          <li><a href="#debt-items">Mapa de Dívida</a></li>
          <li><a href="#innovation-items">Roadmap de Inovação</a></li>
          <li><a href="#roadmap">Roadmap de Execução</a></li>
          <li><a href="#dependency-matrix">Matriz de Dependências</a></li>
          <li><a href="#glossary">Glossário</a></li>
        </ul>
        <div class="tiny">Filtros e status são persistidos via <span class="mono">localStorage</span>.</div>
      </nav>
      <main>
        <header>
          <div class="hero">
            <div class="score-shell">
              <div class="label">Score geral de saúde técnica</div>
              <div class="score-ring" id="score-ring" style="--score:0;"><span id="score-value">0</span></div>
              <div class="tiny" id="launch-status"></div>
            </div>
            <div class="kpis">
              <div class="kpi"><div class="label">Top riscos</div><strong>${report.executiveSummary.topRisks.length}</strong></div>
              <div class="kpi"><div class="label">Dívida técnica</div><strong>${report.debtItems.length}</strong></div>
              <div class="kpi"><div class="label">Inovação</div><strong>${report.innovationItems.length}</strong></div>
              <div class="kpi"><div class="label">Custo de não-ação</div><strong>${report.executiveSummary.costOfNonActionWeeksPerMonth} sem./mês</strong></div>
            </div>
          </div>
        </header>

        <div class="toolbar panel">
          <input id="search" placeholder="Busca em tempo real" />
          <select id="dimension-filter"><option value="">Todas as dimensões</option></select>
          <select id="severity-filter"><option value="">Todo VDI</option><option value="CRÍTICO">CRÍTICO</option><option value="ALTO">ALTO</option><option value="MÉDIO">MÉDIO</option><option value="BAIXO">BAIXO</option></select>
          <select id="phase-filter"><option value="">Todas as fases</option></select>
          <button id="copy-markdown">Copiar como Markdown</button>
          <button id="export-json">Exportar JSON</button>
        </div>

        <section id="executive-summary">
          <h2>Executive Summary</h2>
          <div class="split">
            <div class="subpanel">
              <h3>Top 5 riscos críticos</h3>
              <div id="top-risks" class="metrics-grid"></div>
            </div>
            <div class="subpanel">
              <h3>Análise pendente</h3>
              <div id="pending-analysis" class="metrics-grid"></div>
            </div>
          </div>
        </section>

        <section id="debt-items">
          <h2>Mapa de Dívida Técnica</h2>
          <div class="phase-counts" id="phase-counters"></div>
          <div class="cards" id="debt-cards"></div>
        </section>

        <section id="innovation-items">
          <h2>Roadmap de Inovação</h2>
          <div class="cards" id="innovation-cards"></div>
        </section>

        <section id="roadmap">
          <h2>Roadmap de Execução</h2>
          <div class="timeline" id="roadmap-timeline"></div>
        </section>

        <section id="dependency-matrix">
          <h2>Matriz de Dependências</h2>
          <div class="split">
            <div class="subpanel">
              <h3>Critical Path</h3>
              <div id="critical-path"></div>
              <h3 style="margin-top:18px;">Headcount por fase</h3>
              <div id="headcount"></div>
            </div>
            <div class="subpanel">
              <h3>Impacto × Probabilidade</h3>
              <svg class="risk-matrix" id="risk-matrix" viewBox="0 0 360 320"></svg>
            </div>
          </div>
        </section>

        <section id="glossary">
          <h2>Glossário Técnico</h2>
          <div class="glossary-grid" id="glossary-list"></div>
        </section>

        <footer class="footer-meta">
          Auditoria soberana gerada a partir do HEAD atual do monorepo. Artefatos históricos em <span class="mono">audit/</span> e <span class="mono">artifacts/</span> foram tratados como contexto, não como base decisória automática.
        </footer>
      </main>
    </div>
    <script>
      const report = ${serializedReport};
      const markdown = ${serializedMarkdown};
      const storageKey = "auditor-prime-state";
      const state = JSON.parse(localStorage.getItem(storageKey) || "{}");

      const elements = {
        search: document.getElementById("search"),
        dimension: document.getElementById("dimension-filter"),
        severity: document.getElementById("severity-filter"),
        phase: document.getElementById("phase-filter"),
        debtCards: document.getElementById("debt-cards"),
        innovationCards: document.getElementById("innovation-cards"),
        topRisks: document.getElementById("top-risks"),
        pending: document.getElementById("pending-analysis"),
        timeline: document.getElementById("roadmap-timeline"),
        counters: document.getElementById("phase-counters"),
        criticalPath: document.getElementById("critical-path"),
        headcount: document.getElementById("headcount"),
        glossary: document.getElementById("glossary-list"),
        scoreRing: document.getElementById("score-ring"),
        scoreValue: document.getElementById("score-value"),
        launchStatus: document.getElementById("launch-status")
      };

      function persist() {
        localStorage.setItem(storageKey, JSON.stringify(state));
      }

      function checked(id) {
        return Boolean(state.checked?.[id]);
      }

      function toggle(id, value) {
        state.checked = state.checked || {};
        state.checked[id] = value;
        persist();
        render();
      }

      function badgeClass(severity) {
        if (severity === "CRÍTICO") return "critical";
        if (severity === "ALTO") return "high";
        if (severity === "MÉDIO") return "medium";
        return "low";
      }

      function createCard(item, type) {
        const wrapper = document.createElement("details");
        wrapper.className = "card";
        wrapper.open = false;
        const summary = document.createElement("summary");
        const header = document.createElement("div");
        header.innerHTML = '<div class="tiny mono">' + item.id + '</div><div><strong>' + item.title + '</strong></div>';
        const meta = document.createElement("div");
        meta.innerHTML = type === "debt"
          ? '<span class="badge ' + badgeClass(item.severity) + '">' + item.severity + ' · VDI ' + item.vdiScore + '</span> <span class="badge">' + item.phase + '</span>'
          : '<span class="badge">' + item.category + '</span> <span class="badge">Viabilidade ' + item.technicalViability + '/5</span>';
        summary.append(header, meta);
        wrapper.append(summary);

        const body = document.createElement("div");
        body.className = "card-body";
        if (type === "debt") {
          body.innerHTML = [
            '<div><strong>Localização:</strong> <span class="mono">' + item.location.path + ':' + item.location.lines.start + '</span></div>',
            '<div><strong>Problema:</strong> ' + item.problem + '</div>',
            '<div><strong>Impacto:</strong> ' + item.impact + '</div>',
            '<div><strong>Solução:</strong> ' + item.recommendation + '</div>',
            '<div><strong>Esforço:</strong> ' + item.effort + '</div>',
            '<div class="tiny">Confiança: ' + item.confidence + ' · Dependências: ' + (item.dependencies?.join(", ") || "nenhuma") + '</div>'
          ].join("");
        } else {
          body.innerHTML = [
            '<div><strong>Descrição técnica:</strong> ' + item.technicalDescription + '</div>',
            '<div><strong>Valor de negócio:</strong> ' + item.businessValue + '</div>',
            '<div><strong>Evidência atual:</strong> <span class="mono">' + item.currentStateEvidence.join(" | ") + '</span></div>'
          ].join("");
        }
        const checkbox = document.createElement("label");
        checkbox.className = "tiny";
        checkbox.innerHTML = '<input type="checkbox" ' + (checked(item.id) ? 'checked' : '') + ' /> Marcar como resolvido';
        checkbox.querySelector("input").addEventListener("change", (event) => toggle(item.id, event.target.checked));
        body.append(checkbox);
        wrapper.append(body);
        return wrapper;
      }

      function filteredDebt() {
        const search = (elements.search.value || "").toLowerCase().trim();
        const dimension = elements.dimension.value;
        const severity = elements.severity.value;
        const phase = elements.phase.value;
        return report.debtItems.filter((item) => {
          const haystack = JSON.stringify(item).toLowerCase();
          if (search && !haystack.includes(search)) return false;
          if (dimension && item.dimensionLabel !== dimension) return false;
          if (severity && item.severity !== severity) return false;
          if (phase && item.phase !== phase) return false;
          return true;
        });
      }

      function filteredInnovation() {
        const search = (elements.search.value || "").toLowerCase().trim();
        const phase = elements.phase.value;
        return report.innovationItems.filter((item) => {
          const haystack = JSON.stringify(item).toLowerCase();
          if (search && !haystack.includes(search)) return false;
          if (phase && item.phase !== phase) return false;
          return true;
        });
      }

      function renderSummary() {
        elements.topRisks.innerHTML = "";
        report.executiveSummary.topRisks.forEach((risk) => {
          const block = document.createElement("div");
          block.className = "subpanel";
          block.innerHTML = '<div class="tiny mono">' + risk.id + '</div><strong>' + risk.title + '</strong><div class="tiny">' + risk.location.path + ':' + risk.location.lines.start + '</div><div>' + risk.impact + '</div>';
          elements.topRisks.append(block);
        });

        elements.pending.innerHTML = "";
        if (!report.pendingAnalysis.length) {
          elements.pending.innerHTML = '<div class="tiny">Nenhuma lacuna pendente acima do limiar de reporte.</div>';
        } else {
          report.pendingAnalysis.slice(0, 12).forEach((item) => {
            const block = document.createElement("div");
            block.className = "subpanel";
            block.innerHTML = '<strong>' + item.id + '</strong><div>' + item.title + '</div><div class="tiny">Requer: ' + item.requires + '</div>';
            elements.pending.append(block);
          });
        }

        elements.launchStatus.textContent = 'Viabilidade de lançamento: ' + report.executiveSummary.launchViability.status + ' — ' + report.executiveSummary.launchViability.justification;
      }

      function renderDebt() {
        elements.debtCards.innerHTML = "";
        filteredDebt().forEach((item) => elements.debtCards.append(createCard(item, "debt")));
      }

      function renderInnovation() {
        elements.innovationCards.innerHTML = "";
        filteredInnovation().forEach((item) => elements.innovationCards.append(createCard(item, "innovation")));
      }

      function renderTimeline() {
        elements.timeline.innerHTML = "";
        report.executionRoadmap.forEach((phase) => {
          const total = phase.debtIds.length + phase.innovationIds.length;
          const done = [...phase.debtIds, ...phase.innovationIds].filter((id) => checked(id)).length;
          const ratio = total ? Math.round((done / total) * 100) : 0;
          const card = document.createElement("div");
          card.className = "phase";
          card.innerHTML = '<strong>' + phase.phase + ' — ' + phase.title + '</strong><div class="tiny">' + phase.objective + '</div><div class="progress" style="margin:10px 0;"><div class="bar" style="width:' + ratio + '%"></div></div><div class="tiny">Progresso marcado: ' + ratio + '% · Headcount recomendado: ' + phase.headcount.recommendedHeadcount + (phase.headcount.exceedsAvailableTeam ? ' (reforço recomendado)' : '') + '</div>';
          elements.timeline.append(card);
        });
      }

      function renderPhaseCounters() {
        elements.counters.innerHTML = "";
        report.executionRoadmap.forEach((phase) => {
          const total = phase.debtIds.length + phase.innovationIds.length;
          const done = [...phase.debtIds, ...phase.innovationIds].filter((id) => checked(id)).length;
          const block = document.createElement("div");
          block.className = "kpi";
          block.innerHTML = '<div class="label">' + phase.phase + '</div><strong>' + done + '/' + total + '</strong><div class="tiny">' + phase.title + '</div>';
          elements.counters.append(block);
        });
      }

      function renderDependencies() {
        elements.criticalPath.innerHTML = '<div class="mono">' + (report.dependencyMatrix.criticalPath.join(" → ") || "n/d") + '</div>';
        elements.headcount.innerHTML = report.dependencyMatrix.headcountByPhase.map((entry) => '<div class="tiny">' + entry.phase + ': ' + entry.recommendedHeadcount + (entry.exceedsAvailableTeam ? ' (excede 2-4)' : '') + '</div>').join("");

        const svg = document.getElementById("risk-matrix");
        svg.innerHTML = '<rect x="20" y="20" width="300" height="240" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.08)" /><text x="20" y="290" fill="rgba(240,244,255,0.6)" font-size="12">Impacto de negócio</text><text x="8" y="18" fill="rgba(240,244,255,0.6)" font-size="12">Probabilidade</text>';
        report.debtItems.slice(0, 50).forEach((item) => {
          const x = 20 + ((item.vdiFactors.businessImpact - 1) / 4) * 300;
          const probability = (item.vdiFactors.securityRisk + item.vdiFactors.frequency) / 2;
          const y = 260 - ((probability - 1) / 4) * 240;
          svg.innerHTML += '<circle cx="' + x + '" cy="' + y + '" r="5" fill="' + (item.severity === "CRÍTICO" ? '#FF4D4D' : item.severity === "ALTO" ? '#FF8C42' : item.severity === "MÉDIO" ? '#FFD166' : '#06D6A0') + '"><title>' + item.id + ' - ' + item.title + '</title></circle>';
        });
      }

      function renderGlossary() {
        elements.glossary.innerHTML = report.glossary.map((entry) => '<div class="subpanel"><strong>' + entry.term + '</strong><div class="tiny">' + entry.definition + '</div></div>').join("");
      }

      function animateScore() {
        const target = report.executiveSummary.technicalHealthScore;
        const current = Number(elements.scoreValue.textContent);
        if (current === target) {
          elements.scoreRing.style.setProperty('--score', target);
          return;
        }
        let frame = 0;
        const maxFrames = 24;
        const start = current;
        const tick = () => {
          frame += 1;
          const next = Math.round(start + ((target - start) * (frame / maxFrames)));
          elements.scoreValue.textContent = String(next);
          elements.scoreRing.style.setProperty('--score', String(next));
          if (frame < maxFrames) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }

      function render() {
        state.search = elements.search.value;
        state.dimension = elements.dimension.value;
        state.severity = elements.severity.value;
        state.phase = elements.phase.value;
        persist();
        renderSummary();
        renderDebt();
        renderInnovation();
        renderTimeline();
        renderPhaseCounters();
        renderDependencies();
        renderGlossary();
        animateScore();
      }

      function bootstrapFilters() {
        const dimensions = [...new Set(report.debtItems.map((item) => item.dimensionLabel))];
        const phases = [...new Set([...report.debtItems.map((item) => item.phase), ...report.innovationItems.map((item) => item.phase)])];
        dimensions.forEach((label) => {
          const option = document.createElement("option");
          option.value = label;
          option.textContent = label;
          elements.dimension.append(option);
        });
        phases.forEach((label) => {
          const option = document.createElement("option");
          option.value = label;
          option.textContent = label;
          elements.phase.append(option);
        });

        elements.search.value = state.search || "";
        elements.dimension.value = state.dimension || "";
        elements.severity.value = state.severity || "";
        elements.phase.value = state.phase || "";
      }

      document.getElementById("copy-markdown").addEventListener("click", async () => {
        await navigator.clipboard.writeText(markdown);
      });

      document.getElementById("export-json").addEventListener("click", () => {
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = report.metadata.slug + ".json";
        link.click();
        URL.revokeObjectURL(url);
      });

      [elements.search, elements.dimension, elements.severity, elements.phase].forEach((element) => {
        element.addEventListener("input", render);
        element.addEventListener("change", render);
      });

      bootstrapFilters();
      render();
    </script>
  </body>
</html>
`;
}

async function main() {
  const { dateOnly, slug } = reportDateParts();
  const supportDirectory = supportRoot(dateOnly);
  const report = parseJson(await readText(path.join(supportDirectory, "03-scored-report.json")));
  const markdown = buildMarkdown(report);
  const html = buildHtml(report, markdown);

  const datedJson = path.join("audit", `${slug}.json`);
  const datedMd = path.join("audit", `${slug}.md`);
  const datedHtml = path.join("audit", `${slug}.html`);

  await writeJson(datedJson, report);
  await writeText(datedMd, markdown);
  await writeText(datedHtml, html);
  await copyFile(path.join(process.cwd(), datedJson), latestArtifactPath("json"));
  await copyFile(path.join(process.cwd(), datedMd), latestArtifactPath("md"));
  await copyFile(path.join(process.cwd(), datedHtml), latestArtifactPath("html"));

  console.log([datedJson, datedMd, datedHtml].map((entry) => relativePath(path.join(process.cwd(), entry))).join("\n"));
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
