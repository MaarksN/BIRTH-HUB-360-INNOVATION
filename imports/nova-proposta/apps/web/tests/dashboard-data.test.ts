import assert from "node:assert/strict";
import test from "node:test";

import { loadDashboardSnapshot } from "../lib/dashboard";

function restoreEnvValue(key: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[key];
    return;
  }

  process.env[key] = value;
}

function restoreWindow(hadWindow: boolean, value: unknown) {
  if (hadWindow) {
    Object.defineProperty(globalThis, "window", { configurable: true, value });
    return;
  }

  Reflect.deleteProperty(globalThis, "window");
}

function resolveRequestUrl(input: RequestInfo | URL): string {
  if (input instanceof URL) {
    return input.toString();
  }

  if (typeof input === "string") {
    return input;
  }

  return input.url;
}

void test("dashboard lib loads canonical dashboard endpoints with session-aware fetch", async () => {
  const originalApiUrl = process.env.NEXT_PUBLIC_API_URL;
  const originalEnvironment = process.env.NEXT_PUBLIC_ENVIRONMENT;
  const originalFetch = globalThis.fetch;
  const hadWindow = "window" in globalThis;
  const originalWindow = hadWindow ? globalThis.window : undefined;

  process.env.NEXT_PUBLIC_API_URL = "https://api.birthhub.test";
  process.env.NEXT_PUBLIC_ENVIRONMENT = "development";
  Object.defineProperty(globalThis, "window", { configurable: true, value: {} });

  const calls: Array<{ init?: RequestInit; url: string }> = [];
  globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    const url = resolveRequestUrl(input);
    calls.push({
      ...(init ? { init } : {}),
      url
    });

    if (url.endsWith("/metrics")) {
      return Promise.resolve(
        new Response(
          JSON.stringify({
            finance: [{ delta: "ok", label: "MRR", value: "R$ 100,00" }],
            pipeline: [{ stage: "Clientes ativos", trend: "+2 clientes", value: 12 }]
          }),
          {
            headers: {
              "content-type": "application/json"
            },
            status: 200
          }
        )
      );
    }

    if (url.endsWith("/agent-statuses")) {
      return Promise.resolve(
        new Response(
          JSON.stringify({
            healthScore: [{ client: "Alpha", nps: 73, risk: "baixo", score: 81 }]
          }),
          {
            headers: {
              "content-type": "application/json"
            },
            status: 200
          }
        )
      );
    }

    if (url.endsWith("/recent-tasks")) {
      return Promise.resolve(
        new Response(
          JSON.stringify({
            attribution: [{ cac: "R$ 40,00", conversion: "20%", leads: 4, source: "direct" }],
            contracts: [{ customer: "Alpha", mrr: "R$ 100,00", owner: "Ops", status: "active" }]
          }),
          {
            headers: {
              "content-type": "application/json"
            },
            status: 200
          }
        )
      );
    }

    return Promise.resolve(
      new Response(
        JSON.stringify({
          finance: [{ delta: "steady", label: "Receita 30d", value: "R$ 80,00" }]
        }),
        {
          headers: {
            "content-type": "application/json"
          },
          status: 200
        }
      )
    );
  }) as typeof fetch;

  try {
    const snapshot = await loadDashboardSnapshot();

    assert.equal(snapshot.metrics.finance[0]?.label, "MRR");
    assert.equal(snapshot.agentStatuses.healthScore[0]?.client, "Alpha");
    assert.equal(snapshot.recentTasks.contracts[0]?.owner, "Ops");
    assert.equal(snapshot.billingSummary.finance[0]?.value, "R$ 80,00");
    assert.deepEqual(
      calls.map((call) => call.url),
      [
        "https://api.birthhub.test/api/v1/dashboard/metrics",
        "https://api.birthhub.test/api/v1/dashboard/agent-statuses",
        "https://api.birthhub.test/api/v1/dashboard/recent-tasks",
        "https://api.birthhub.test/api/v1/dashboard/billing-summary"
      ]
    );
    assert.equal(calls.every((call) => call.init?.credentials === "include"), true);
  } finally {
    globalThis.fetch = originalFetch;
    restoreWindow(hadWindow, originalWindow);
    restoreEnvValue("NEXT_PUBLIC_API_URL", originalApiUrl);
    restoreEnvValue("NEXT_PUBLIC_ENVIRONMENT", originalEnvironment);
  }
});

