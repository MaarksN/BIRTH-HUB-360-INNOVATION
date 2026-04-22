import assert from "node:assert/strict";
import test from "node:test";

import { listWorkflows } from "../lib/workflows";

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

function getRequestUrl(input: RequestInfo | URL): string {
  if (input instanceof URL) {
    return input.toString();
  }

  if (typeof input === "string") {
    return input;
  }

  return input.url;
}

void test("workflow list helper loads canonical inventory endpoint", async () => {
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
    const url = getRequestUrl(input);
    calls.push({
      ...(init ? { init } : {}),
      url
    });

    return Promise.resolve(
      new Response(
        JSON.stringify({
          items: [
            {
              _count: {
                executions: 3,
                steps: 4
              },
              createdAt: "2026-04-07T10:00:00.000Z",
              description: "Fluxo principal",
              id: "wf_1",
              name: "Onboarding",
              status: "PUBLISHED",
              stepLint: {
                findings: [],
                score: 0,
                summary: {
                  critical: 0,
                  info: 0,
                  warning: 0
                }
              },
              triggerType: "WEBHOOK",
              updatedAt: "2026-04-07T12:00:00.000Z",
              version: 2
            }
          ],
          requestId: "req_1"
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
    const workflows = await listWorkflows();

    assert.equal(workflows.length, 1);
    assert.equal(workflows[0]?.name, "Onboarding");
    assert.equal(workflows[0]?._count.executions, 3);
    assert.equal(workflows[0]?.stepLint?.summary.critical, 0);
    assert.deepEqual(calls.map((call) => call.url), [
      "https://api.birthhub.test/api/v1/workflows"
    ]);
    assert.equal(calls[0]?.init?.credentials, "include");
  } finally {
    globalThis.fetch = originalFetch;
    restoreWindow(hadWindow, originalWindow);
    restoreEnvValue("NEXT_PUBLIC_API_URL", originalApiUrl);
    restoreEnvValue("NEXT_PUBLIC_ENVIRONMENT", originalEnvironment);
  }
});
