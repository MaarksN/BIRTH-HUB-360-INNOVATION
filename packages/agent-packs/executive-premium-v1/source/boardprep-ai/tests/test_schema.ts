import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";

import { ZodError } from "zod";

import { BoardPrepAIAgent } from "../agent.js";
import { BoardPrepAIInputSchema, type BoardPrepAIInput } from "../schemas.js";

void test("BoardPrepAI schema rejects missing required fields", () => {
  const invalidPayload = {
    constraints: {
      currency: "BRL",
      language: "pt-BR",
      maxActions: 4
    },
    dateRange: {
      endDate: "2026-03-31",
      label: "Q1 2026",
      startDate: "2026-01-01"
    },
    decisionsPending: [],
    focusAreas: ["finance"],
    kpis: [
      {
        confirmed: true,
        name: "ARR",
        value: 12500000
      }
    ],
    meetingContext: "Board packet under validation.",
    requestId: "req-boardprepai-schema-invalid-001",
    requiredMetrics: ["ARR"],
    risks: []
  };

  assert.throws(
    () => BoardPrepAIInputSchema.parse(invalidPayload),
    (error) => error instanceof ZodError
  );
});

void test("BoardPrepAI run rejects unknown input fields", async () => {
  const agent = new BoardPrepAIAgent({
    contractPath: path.resolve(
      process.cwd(),
      "audit",
      "pending_review",
      "ciclo1_boardprepai",
      "missing_contract.yaml"
    ),
    sleep: async () => undefined
  });

  const invalidRuntimePayload = {
    constraints: {
      currency: "BRL",
      language: "pt-BR",
      maxActions: 4
    },
    dateRange: {
      endDate: "2026-03-31",
      label: "Q1 2026",
      startDate: "2026-01-01"
    },
    decisionsPending: [],
    focusAreas: ["finance", "risk"],
    kpis: [
      {
        confirmed: true,
        name: "ARR",
        source: "ERP",
        unit: "BRL",
        value: 12500000
      }
    ],
    meetingContext: "Board packet under runtime validation.",
    requestId: "req-boardprepai-runtime-invalid-001",
    requiredMetrics: ["ARR"],
    risks: [],
    tenantId: "tenant_exec_demo",
    unknownField: "not-allowed"
  } as unknown as BoardPrepAIInput;

  await assert.rejects(
    () => agent.run(invalidRuntimePayload),
    (error) => error instanceof ZodError
  );
});
