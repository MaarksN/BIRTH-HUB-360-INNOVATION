import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { BoardPrepAIAgent } from "../agent.js";
import {
  DEFAULT_BOARDPREPAI_CONTRACT,
  type BoardPrepAIInput,
  type BoardPrepEvent
} from "../schemas.js";
import type { BoardPrepAIToolAdapters } from "../tools.js";

const VALID_INPUT: BoardPrepAIInput = {
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
  decisionsPending: [
    {
      confirmed: true,
      decision: "Approve the proposed hiring plan for the customer success recovery pod.",
      dueDate: "2026-04-05",
      owner: "CEO",
      topic: "Customer Success staffing"
    }
  ],
  focusAreas: ["finance", "risk", "culture"],
  kpis: [
    {
      confirmed: true,
      name: "ARR",
      source: "ERP",
      unit: "BRL",
      value: 12_500_000
    },
    {
      confirmed: true,
      name: "Net Revenue Retention",
      source: "CRM",
      unit: "%",
      value: 108.4
    },
    {
      confirmed: true,
      name: "Burn Multiple",
      source: "ERP",
      unit: "x",
      value: 1.6
    }
  ],
  meetingContext:
    "Board packet for Q1 2026 with emphasis on retention risk, operating leverage, and executive focus areas.",
  requestId: "req-boardprepai-unit-001",
  requiredMetrics: ["ARR", "Net Revenue Retention", "Burn Multiple"],
  risks: [
    {
      confirmed: true,
      impact: "Retention recovery may slow without dedicated leadership attention.",
      mitigation: "Assign an executive sponsor to the top ten at-risk accounts.",
      owner: "CRO",
      severity: "high",
      title: "Strategic account churn pressure"
    }
  ],
  tenantId: "tenant_exec_demo"
};

void test("BoardPrepAI returns success output on happy path", async () => {
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

  const output = await agent.run(VALID_INPUT);

  assert.equal(output.status, "success");
  assert.equal(output.fallback.applied, false);
  assert.ok(output.boardBrief.kpis_chave.length >= 3);
  assert.ok(output.boardBrief.summary_report.includes("## 1. Resumo Executivo"));
  assert.ok(output.observability.metrics.toolCalls >= 3);
  assert.ok(
    output.observability.events.every(
      (event: BoardPrepEvent) => event.details.requestId === VALID_INPUT.requestId
    )
  );
  assert.ok(
    output.observability.events.some(
      (event: BoardPrepEvent) => event.name === "boardprepai.response.generated"
    )
  );
});

void test("BoardPrepAI marks missing required metrics as fallback", async () => {
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

  const output = await agent.run({
    ...VALID_INPUT,
    requiredMetrics: [...VALID_INPUT.requiredMetrics, "Board Approved EBITDA"]
  });

  assert.equal(output.status, "fallback");
  assert.equal(output.fallback.applied, true);
  assert.equal(output.fallback.mode, "human_handoff");
  assert.ok(
    output.boardBrief.lacunas_de_informacao.some((gap) =>
      gap.includes("Board Approved EBITDA")
    )
  );
});

void test("BoardPrepAI returns error when contract mode is hard_fail", async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "boardprepai-contract-"));
  const contractPath = path.join(tempDir, "contract.yaml");
  const contract = {
    ...DEFAULT_BOARDPREPAI_CONTRACT,
    failureMode: "hard_fail",
    retry: {
      baseDelayMs: 1,
      maxAttempts: 2
    }
  };
  await writeFile(contractPath, JSON.stringify(contract, null, 2), "utf8");

  const failingAdapters: BoardPrepAIToolAdapters = {
    async fetchCRMBoardSnapshot() {
      throw new Error("crm board snapshot unavailable");
    },
    async fetchERPBoardSnapshot() {
      throw new Error("erp board snapshot unavailable");
    },
    async fetchHRBoardSnapshot() {
      throw new Error("hr board snapshot unavailable");
    }
  };

  try {
    const agent = new BoardPrepAIAgent({
      contractPath,
      sleep: async () => undefined,
      toolAdapters: failingAdapters
    });
    const output = await agent.run(VALID_INPUT);

    assert.equal(output.status, "error");
    assert.equal(output.fallback.applied, true);
    assert.equal(output.fallback.mode, "hard_fail");
    assert.ok(output.fallback.reasons.length >= 3);
    assert.ok(output.observability.metrics.retries >= 3);
  } finally {
    await rm(tempDir, { force: true, recursive: true });
  }
});
