import assert from "node:assert/strict";
import test from "node:test";

import { JSDOM } from "jsdom";

import {
  loadWorkflowSimulationResult,
  startWorkflowDryRun
} from "../app/(dashboard)/workflows/[id]/edit/workflow-editor-helpers";

function restoreEnvValue(key: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[key];
    return;
  }

  process.env[key] = value;
}

function installSessionDom() {
  const originalWindow = globalThis.window;
  const originalDocument = globalThis.document;
  const originalLocalStorage = globalThis.localStorage;

  const dom = new JSDOM("", {
    url: "https://app.birthub.test/workflows/workflow_alpha/edit"
  });
  dom.window.localStorage.setItem("bh_access_token", "atk_workflow_editor");
  dom.window.localStorage.setItem("bh_csrf_token", "csrf_workflow_editor");

  Object.defineProperty(globalThis, "window", { configurable: true, value: dom.window });
  Object.defineProperty(globalThis, "document", { configurable: true, value: dom.window.document });
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: dom.window.localStorage
  });

  return () => {
    Object.defineProperty(globalThis, "window", { configurable: true, value: originalWindow });
    Object.defineProperty(globalThis, "document", { configurable: true, value: originalDocument });
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: originalLocalStorage
    });
    dom.window.close();
  };
}

void test("workflow editor helpers use the session-aware timeout path for dry run and polling", async () => {
  const originalApiUrl = process.env.NEXT_PUBLIC_API_URL;
  const originalEnvironment = process.env.NEXT_PUBLIC_ENVIRONMENT;
  const originalFetch = globalThis.fetch;
  const cleanupDom = installSessionDom();

  process.env.NEXT_PUBLIC_API_URL = "https://api.birthub.test";
  process.env.NEXT_PUBLIC_ENVIRONMENT = "development";

  const requests: Array<{ body: string | null; method: string; url: string }> = [];
  globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    const url =
      typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    requests.push({
      body: typeof init?.body === "string" ? init.body : null,
      method: init?.method ?? "GET",
      url
    });

    if (url.endsWith("/api/v1/workflows/workflow_alpha/run")) {
      return Promise.resolve(
        new Response(JSON.stringify({ executionId: "execution_1" }), {
          headers: {
            "content-type": "application/json"
          },
          status: 200
        })
      );
    }

    if (url.endsWith("/api/v1/workflows/workflow_alpha")) {
      return Promise.resolve(
        new Response(
          JSON.stringify({
            workflow: {
              definition: null,
              executions: [
                {
                  id: "execution_1",
                  status: "SUCCESS",
                  stepResults: [
                    {
                      status: "SUCCESS",
                      step: {
                        key: "trigger_1"
                      }
                    }
                  ]
                }
              ],
              name: "Workflow Alpha",
              status: "DRAFT"
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
    }

    throw new Error(`Unexpected request: ${url}`);
  }) as typeof fetch;

  try {
    const dryRun = await startWorkflowDryRun("https://api.birthub.test", "workflow_alpha", {
      patientId: "patient_1"
    });
    const result = await loadWorkflowSimulationResult(
      "https://api.birthub.test",
      "workflow_alpha",
      dryRun.executionId
    );

    assert.equal(dryRun.executionId, "execution_1");
    assert.equal(result?.runStatus, "SUCCESS");
    assert.equal(result?.stepStatuses.trigger_1, "SUCCESS");
    assert.equal(requests[0]?.method, "POST");
    assert.match(requests[0]?.body ?? "", /patient_1/);
    assert.equal(requests[1]?.method, "GET");
  } finally {
    globalThis.fetch = originalFetch;
    cleanupDom();
    restoreEnvValue("NEXT_PUBLIC_API_URL", originalApiUrl);
    restoreEnvValue("NEXT_PUBLIC_ENVIRONMENT", originalEnvironment);
  }
});

