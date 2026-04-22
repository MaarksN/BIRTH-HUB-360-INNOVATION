import assert from "node:assert/strict";
import test from "node:test";

import {
  buildLifecycleFunnelData,
  getChurnWatchlist,
  getRegionalPerformance
} from "../components/sales-os/sdr-automatic-dashboard";
import { getSdrAutomaticConfig } from "../components/sales-os/sdr-automatic-data";
import {
  buildLeadInsightDetail,
  buildScoreFillColor,
  buildSequenceStatusTone,
  buildStageColor
} from "../components/sales-os/SdrLeadScoreWorkspace.helpers";

void test("sdr automatic config hydrates lead scores with base score preserved", () => {
  const { leads } = getSdrAutomaticConfig("pt-BR");
  const lead = leads.find((item) => item.id === "lead_julia_andrade");

  assert.ok(lead);
  assert.equal(lead.baseScore, 91);
  assert.equal(lead.score > lead.baseScore, true);
  assert.equal(lead.sequenceStatus, "active");
});

void test("regional analytics respect focused regions and enrich active account coverage", () => {
  const { crmRegions, leads } = getSdrAutomaticConfig("pt-BR");
  const latinAmericaRegion = crmRegions.find((entry) => entry.region === "latin-america");
  const latinAmericaLeads = leads.filter((lead) => lead.region === "latin-america");

  assert.ok(latinAmericaRegion);

  const funnel = buildLifecycleFunnelData(crmRegions, "pt-BR", ["latin-america"]);
  const regionMetrics = getRegionalPerformance(crmRegions, latinAmericaLeads, "pt-BR");
  const latinAmericaMetrics = regionMetrics.find((entry) => entry.region === "latin-america");

  assert.equal(funnel[0]?.count, latinAmericaRegion.lifecycle.subscriber);
  assert.equal(funnel.at(-1)?.count, latinAmericaRegion.lifecycle.customer);
  assert.equal(funnel[4]?.label, "Oportunidade");
  assert.ok(latinAmericaMetrics);
  assert.equal(latinAmericaMetrics.regionLabel, "America Latina");
  assert.equal(latinAmericaMetrics.activeAccounts > latinAmericaRegion.activeAccounts, true);
  assert.equal(latinAmericaMetrics.x, 28);
  assert.equal(latinAmericaMetrics.y, 66);
});

void test("churn watchlist prioritizes the riskiest accounts first", () => {
  const { leads } = getSdrAutomaticConfig("pt-BR");
  const watchlist = getChurnWatchlist(leads, "pt-BR");

  assert.equal(watchlist.length, 4);
  assert.equal(watchlist[0]?.lead.company, "Prime Industrial");
  assert.equal(watchlist[0]?.tone, "critical");
  assert.equal((watchlist[0]?.riskScore ?? 0) >= (watchlist[1]?.riskScore ?? 0), true);
  assert.match(watchlist[0]?.riskLabel ?? "", /alto risco/i);
});

void test("lead insight helpers keep colors, tones, and compact fallback summaries stable", () => {
  const { leads } = getSdrAutomaticConfig("pt-BR");
  const lead = leads[0];

  assert.ok(lead);

  const detail = buildLeadInsightDetail(lead, "pt-BR", "Resumo executivo ".repeat(40));

  assert.equal(buildScoreFillColor(96), "#f97316");
  assert.equal(buildScoreFillColor(82), "#f59e0b");
  assert.equal(buildScoreFillColor(72), "#0ea5e9");
  assert.equal(buildStageColor("proposal"), "#f97316");
  assert.equal(buildStageColor("new"), "#22c55e");
  assert.equal(buildSequenceStatusTone("paused"), "watch");
  assert.match(detail.highlights[0] ?? "", /America Latina/i);
  assert.match(detail.recommendedActions[1] ?? "", /Disparar sequencia/i);
  assert.equal(detail.scoreBreakdown[0]?.value, `${lead.baseScore}`);
  assert.equal(detail.summary.length, 420);
  assert.equal(detail.summary.endsWith("..."), true);
});
