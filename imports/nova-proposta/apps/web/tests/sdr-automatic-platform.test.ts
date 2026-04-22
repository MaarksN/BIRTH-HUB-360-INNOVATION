import assert from "node:assert/strict";
import test from "node:test";

import {
  getSdrAutomaticConfig,
  getSdrAutomaticViewDefinitions,
  toneForScore
} from "../components/sales-os/sdr-automatic-data";

void test("sdr automatic platform exposes the localized navigation contract", () => {
  const portuguese = getSdrAutomaticViewDefinitions(getSdrAutomaticConfig("pt-BR").copy);
  const english = getSdrAutomaticViewDefinitions(getSdrAutomaticConfig("en-US").copy);

  assert.deepEqual(
    portuguese.map((view) => view.id),
    ["leadScore", "assistente", "agendador", "handoff"]
  );
  assert.equal(portuguese[0]?.label, "Co-piloto: Lead Score Preditivo");
  assert.equal(english[0]?.label, "Co-pilot: Predictive Lead Score");
  assert.equal(portuguese[2]?.label, "Co-piloto: Agendador Inteligente");
  assert.equal(english[3]?.label, "Co-pilot: Handoff Briefing");
});

void test("sdr automatic platform exposes premium executive copy in both locales", () => {
  const portuguese = getSdrAutomaticConfig("pt-BR").copy;
  const english = getSdrAutomaticConfig("en-US").copy;

  assert.equal(portuguese.premiumTitle, "Overlay premium pronto para board");
  assert.match(portuguese.premiumDescription, /handoff premium/i);
  assert.equal(english.premiumTitle, "Board-ready premium overlay");
  assert.match(english.premiumDescription, /decision memory/i);
});

void test("sdr automatic platform ships the expected priority data and time slots", () => {
  const { leads, timeSlots } = getSdrAutomaticConfig("pt-BR");

  assert.equal(leads.length >= 3, true);
  assert.equal(leads[0]?.name, "Julia Andrade");
  assert.equal(leads[0]?.priorityTone, "critical");
  assert.equal(leads[1]?.priorityTone, "high");
  assert.equal(leads[2]?.priorityTone, "warm");
  assert.equal(timeSlots[0]?.label, "09:30");
  assert.equal(timeSlots[0]?.recommended, true);
});

void test("sdr automatic platform keeps score-to-tone mapping stable", () => {
  assert.equal(toneForScore(98), "critical");
  assert.equal(toneForScore(82), "high");
  assert.equal(toneForScore(74), "warm");
});
