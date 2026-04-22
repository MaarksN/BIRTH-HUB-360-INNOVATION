import assert from "node:assert/strict";
import test from "node:test";

import {
  buildGraph,
  loadWorkflowRuns,
  maskSecrets,
  retryWorkflowRun
} from "../app/(dashboard)/workflows/[id]/runs/page.data";

function restoreEnvValue(key: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[key];
    return;
  }

  process.env[key] = value;
}

void test("workflow runs helpers build graph output and redact secret-like keys", () => {
  const graph = buildGraph({
    steps: [
      {
        config: {
          method: "POST",
          path: "/webhooks/trigger/default"
        },
        isTrigger: true,
        key: "trigger_1",
        name: "Trigger",
        type: "TRIGGER_WEBHOOK"
      },
      {
        config: {
          batchWindowMs: 0,
          channel: "email",
          message: "Notify the care team.",
          to: "ops@birthub.test"
        },
        key: "action_1",
        name: "Action",
        type: "SEND_NOTIFICATION"
      }
    ],
    transitions: [
      {
        route: "ON_SUCCESS",
        source: "trigger_1",
        target: "action_1"
      }
    ]
  });

  assert.equal(graph.nodes.length, 2);
  assert.equal(graph.edges.length, 1);
  assert.equal(graph.nodes[0]?.id, "trigger_1");
  assert.equal(graph.edges[0]?.label, "ON_SUCCESS");
  assert.equal(
    maskSecrets({
      accessToken: "atk_123",
      nestedSecret: "s3cr3t",
      publicValue: "ok"
    }),
    JSON.stringify(
      {
        accessToken: "***",
        nestedSecret: "***",
        publicValue: "ok"
      },
      null,
      2
    )
  );
});

void test("workflow runs helpers load and retry through the session-aware timeout path", async () => {
  const originalApiUrl = process.env.NEXT_PUBLIC_API_URL;
  const originalEnvironment = process.env.NEXT_PUBLIC_ENVIRONMENT;
  const originalFetch = globalThis.fetch;

  process.env.NEXT_PUBLIC_API_URL = "https://api.birthub.test";
  process.env.NEXT_PUBLIC_ENVIRONMENT = "development";

  const calls: Array<{ init?: RequestInit; url: string }> = [];
  globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    const urlString = input instanceof URL ? input.toString() : (input as string);
    calls.push({
      ...(init ? { init } : {}),
      url: urlString
    });

    if (urlString.endsWith("/run")) {
      return Promise.resolve(new Response(null, { status: 202 }));
    }

    return Promise.resolve(
      new Response(
        JSON.stringify({
          workflow: {
            definition: null,
            executions: [],
            name: "Workflow Alpha"
          }
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
    const payload = await loadWorkflowRuns("workflow alpha");
    await retryWorkflowRun({
      failedExecutionId: "exec_failed_1",
      failedStepKey: "http_step",
      workflowId: "workflow alpha"
    });

    assert.equal(payload.workflow.name, "Workflow Alpha");
    assert.equal(calls[0]?.url, "https://api.birthub.test/api/v1/workflows/workflow%20alpha");
    assert.equal(calls[1]?.url, "https://api.birthub.test/api/v1/workflows/workflow%20alpha/run");
    assert.equal(calls[1]?.init?.method, "POST");

    const bodyStr = calls[1]?.init?.body as string | undefined;
    assert.match(bodyStr || "", /"fromExecutionId":"exec_failed_1"/);
    assert.match(bodyStr || "", /"fromStepKey":"http_step"/);

    assert.equal(calls[0]?.init?.credentials, "include");
    assert.equal(calls[1]?.init?.credentials, "include");
  } finally {
    globalThis.fetch = originalFetch;
    restoreEnvValue("NEXT_PUBLIC_API_URL", originalApiUrl);
    restoreEnvValue("NEXT_PUBLIC_ENVIRONMENT", originalEnvironment);
  }
});

