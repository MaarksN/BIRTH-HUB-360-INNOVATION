import assert from "node:assert/strict";
import test from "node:test";

import { getSdrAutomaticConfig } from "../components/sales-os/sdr-automatic-data";
import {
  applyPollingFrameToTrend,
  buildChurnSummaryFallback,
  buildLifecycleFunnelData,
  buildLeadCsv,
  buildSupportReply,
  createInitialMetrics,
  createInitialTrendSeries,
  filterLeads,
  getChurnWatchlist,
  getPipelineData,
  getRegionalPerformance,
  LEAD_POLLING_FRAMES,
  paginateLeads
} from "../components/sales-os/sdr-automatic-dashboard";
import { buildLeadSequenceDetail } from "../components/sales-os/SdrLeadScoreWorkspace.helpers";

void test("lead dashboard filters by stage, score band, email, region, and creation date", () => {
  const { leads } = getSdrAutomaticConfig("pt-BR");
  const filtered = filterLeads(leads, {
    createdFrom: "2026-04-14",
    createdTo: "2026-04-15",
    query: "connecta",
    regions: ["latin-america"],
    scoreBands: ["critical"],
    stages: ["proposal"]
  });

  assert.equal(filtered.length, 1);
  assert.equal(filtered[0]?.name, "Julia Andrade");
});

void test("lead dashboard paginates large lead queues safely", () => {
  const { leads } = getSdrAutomaticConfig("pt-BR");
  const page = paginateLeads(leads, 2, 4);

  assert.equal(page.currentPage, 2);
  assert.equal(page.totalPages, 3);
  assert.equal(page.items.length, 4);
  assert.equal(page.items[0]?.id, "lead_marcos_lima");
});

void test("lead dashboard CSV export includes localized headers and row content", () => {
  const { leads } = getSdrAutomaticConfig("pt-BR");
  const csv = buildLeadCsv(leads.slice(0, 1), "pt-BR");

  assert.match(csv, /"E-mail"/);
  assert.match(csv, /"Regiao"/);
  assert.match(csv, /"Julia Andrade"/);
  assert.match(csv, /"Violado"/);
});

void test("support reply summarizes SLA pressure from live metrics", () => {
  const { leads } = getSdrAutomaticConfig("pt-BR");
  const reply = buildSupportReply({
    filters: {
      createdFrom: "",
      createdTo: "",
      query: "",
      regions: [],
      scoreBands: [],
      stages: []
    },
    leads,
    locale: "pt-BR",
    metrics: createInitialMetrics(leads),
    question: "Resuma o risco de SLA"
  });

  assert.match(reply, /violacoes de SLA/i);
  assert.match(reply, /Julia Andrade|Rafael Castro/i);
});

void test("live trend polling keeps a rolling chart window with fresh timestamps", () => {
  const trend = createInitialTrendSeries("pt-BR");
  const frame = LEAD_POLLING_FRAMES[0];
  const expectedLabel = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).format(new Date("2026-04-15T13:45:30.000Z"));

  assert.ok(frame);

  const updated = applyPollingFrameToTrend(
    trend,
    frame,
    "pt-BR",
    new Date("2026-04-15T13:45:30.000Z")
  );

  assert.equal(updated.length, trend.length);
  assert.equal(updated[0]?.label, trend[1]?.label);
  assert.equal(updated[updated.length - 1]?.label, expectedLabel);
  assert.equal(
    updated[updated.length - 1]?.leads,
    (trend[trend.length - 1]?.leads ?? 0) + frame.activeLeadsDelta
  );
});

void test("support reply lists active date, stage, and score filters", () => {
  const { leads } = getSdrAutomaticConfig("pt-BR");
  const reply = buildSupportReply({
    filters: {
      createdFrom: "2026-04-14",
      createdTo: "2026-04-15",
      query: "connecta",
      regions: [],
      scoreBands: ["critical"],
      stages: ["proposal"]
    },
    leads,
    locale: "pt-BR",
    metrics: createInitialMetrics(leads),
    question: "Quais filtros estao ativos?"
  });

  assert.match(reply, /E-mail: connecta/i);
  assert.match(reply, /De: 2026-04-14/i);
  assert.match(reply, /Ate: 2026-04-15/i);
  assert.match(reply, /Estagios: Proposta/i);
  assert.match(reply, /Faixas de score: Critico/i);
});

void test("support reply handles empty score views gracefully", () => {
  const reply = buildSupportReply({
    filters: {
      createdFrom: "2026-04-14",
      createdTo: "2026-04-15",
      query: "sem.resultado@birthub.com",
      regions: [],
      scoreBands: [],
      stages: []
    },
    leads: [],
    locale: "pt-BR",
    metrics: createInitialMetrics([]),
    question: "Quem tem maior score?"
  });

  assert.match(reply, /Nao ha leads na visao filtrada atual/i);
});

void test("pipeline data keeps the stage order and conversion math stable", () => {
  const { leads } = getSdrAutomaticConfig("pt-BR");
  const pipeline = getPipelineData(leads, "pt-BR");

  assert.deepEqual(
    pipeline.map((entry) => entry.stage),
    ["new", "qualified", "demo", "proposal", "negotiation"]
  );
  assert.equal(pipeline[0]?.count, 2);
  assert.equal(pipeline[1]?.count, 3);
  assert.equal(pipeline[1]?.conversionRate, 150);
  assert.equal(pipeline[4]?.conversionRate, 50);
});

void test("lifecycle funnel data narrows the CRM view to the selected region", () => {
  const { crmRegions } = getSdrAutomaticConfig("pt-BR");
  const funnel = buildLifecycleFunnelData(crmRegions, "pt-BR", ["north-america"]);

  assert.equal(funnel.length, 6);
  assert.equal(funnel[0]?.id, "subscriber");
  assert.equal(funnel[0]?.count, 412);
  assert.equal(funnel[5]?.id, "customer");
  assert.equal(funnel[5]?.count, 18);
});

void test("regional performance localizes labels and folds filtered leads into the snapshot", () => {
  const { crmRegions, leads } = getSdrAutomaticConfig("pt-BR");
  const metrics = getRegionalPerformance(crmRegions, leads, "pt-BR");
  const northAmerica = metrics.find((entry) => entry.region === "north-america");

  assert.ok(northAmerica);
  assert.equal(northAmerica.regionLabel, "America do Norte");
  assert.equal(northAmerica.activeAccounts, 145);
  assert.equal(northAmerica.pipelineCoverage, 3.9);
  assert.equal(northAmerica.revenuePotential, 1262500);
});

void test("churn watchlist ranks the highest-risk accounts first", () => {
  const { leads } = getSdrAutomaticConfig("pt-BR");
  const watchlist = getChurnWatchlist(leads, "pt-BR");

  assert.equal(watchlist.length, 4);
  assert.equal(watchlist[0]?.lead.company, "Prime Industrial");
  assert.equal(watchlist[0]?.tone, "critical");
  assert.equal(watchlist[0]?.riskLabel, "Alto risco");
  assert.equal((watchlist[0]?.riskScore ?? 0) >= (watchlist[1]?.riskScore ?? 0), true);
});

void test("fallback churn summary names the top risky account", () => {
  const { leads } = getSdrAutomaticConfig("pt-BR");
  const summary = buildChurnSummaryFallback(leads, "pt-BR");

  assert.match(summary, /Prime Industrial/);
  assert.match(summary, /churn|risco/i);
});

void test("sequence detail builds a three-touch cadence with localized day labels", () => {
  const { leads } = getSdrAutomaticConfig("pt-BR");
  const detail = buildLeadSequenceDetail(leads[0]!, "pt-BR");

  assert.equal(detail.steps.length, 3);
  assert.equal(detail.steps[0]?.label, "Dia 0");
  assert.equal(detail.steps[1]?.label, "Dia 3");
  assert.equal(detail.steps[2]?.label, "Dia 6");
  assert.match(detail.summary, /cadencia|sequencia/i);
});

void test("sequence detail preserves agent summary when the sequencer returns custom guidance", () => {
  const { leads } = getSdrAutomaticConfig("en-US");
  const lead = leads[0]!;
  const detail = buildLeadSequenceDetail(
    lead,
    "en-US",
    "Use a tight ROI angle first, then follow with proof and a single CTA."
  );

  assert.match(detail.summary, /ROI angle/i);
  assert.match(detail.steps[0]?.subject ?? "", new RegExp(lead.company));
});
