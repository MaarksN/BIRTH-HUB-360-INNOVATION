import assert from "node:assert/strict";
import test from "node:test";

import { ConnectorExecutionError } from "./errors.js";
import { createDefaultConnectorRuntime } from "./runtime.js";
import { connectorRuntimeProviders } from "./types.js";

void test("runtime provider set is the implemented connector source of truth", () => {
  assert.deepEqual([...connectorRuntimeProviders].sort(), [
    "hubspot",
    "omie",
    "slack",
    "stripe",
    "zenvia"
  ]);
});

void test("runtime upserts HubSpot companies through the default runtime", async () => {
  const calls: Array<{ body?: string; input: string; method: string }> = [];
  const runtime = createDefaultConnectorRuntime({
    fetchImpl: async (input, init) => {
      calls.push({
        body: init.body,
        input: String(input),
        method: init.method
      });

      return {
        json: async () => ({ id: "company_123" }),
        ok: true,
        status: 201,
        text: async () => JSON.stringify({ id: "company_123" })
      };
    }
  });

  const result = await runtime.execute({
    action: "crm.company.upsert",
    credentials: {
      accessToken: "token"
    },
    payload: {
      name: "BirthHub",
      tenantId: "tenant_1"
    },
    provider: "hubspot"
  });

  assert.equal(result.externalId, "company_123");
  assert.equal(result.status, "success");
  assert.equal(calls[0]?.method, "POST");
  assert.match(calls[0]?.input ?? "", /\/crm\/v3\/objects\/companies$/);
});

void test("runtime surfaces retryable connector errors for HubSpot rate limiting", async () => {
  const runtime = createDefaultConnectorRuntime({
    fetchImpl: async () => ({
      json: async () => ({ status: "rate_limited" }),
      ok: false,
      status: 429,
      text: async () => JSON.stringify({ status: "rate_limited" })
    })
  });

  await assert.rejects(
    runtime.execute({
      action: "crm.contact.upsert",
      credentials: {
        accessToken: "token"
      },
      payload: {
        email: "lead@example.com"
      },
      provider: "hubspot"
    }),
    (error: unknown) =>
      error instanceof ConnectorExecutionError &&
      error.code === "HUBSPOT_RATE_LIMIT" &&
      error.retryable === true &&
      error.statusCode === 429
  );
});

void test("runtime surfaces fatal connector errors for HubSpot auth failures", async () => {
  const runtime = createDefaultConnectorRuntime({
    fetchImpl: async () => ({
      json: async () => ({ status: "error" }),
      ok: false,
      status: 401,
      text: async () => JSON.stringify({ status: "error" })
    })
  });

  await assert.rejects(
    runtime.execute({
      action: "crm.contact.upsert",
      credentials: {
        accessToken: "token"
      },
      payload: {
        email: "lead@example.com"
      },
      provider: "hubspot"
    }),
    (error: unknown) =>
      error instanceof ConnectorExecutionError &&
      error.code === "HUBSPOT_AUTH_FAILED" &&
      error.retryable === false &&
      error.statusCode === 401
  );
});

void test("runtime surfaces retryable connector errors for Slack rate limiting", async () => {
  const runtime = createDefaultConnectorRuntime({
    fetchImpl: async () => ({
      headers: {
        get(name: string) {
          return name.toLowerCase() === "retry-after" ? "30" : null;
        }
      },
      json: async () => ({ ok: false }),
      ok: false,
      status: 429,
      text: async () => JSON.stringify({ ok: false })
    })
  });

  await assert.rejects(
    runtime.execute({
      action: "message.send",
      credentials: {
        botToken: "xoxb-test-token"
      },
      payload: {
        channel: "C123",
        text: "BirthHub ping"
      },
      provider: "slack"
    }),
    (error: unknown) =>
      error instanceof ConnectorExecutionError &&
      error.code === "SLACK_RATE_LIMIT" &&
      error.retryable === true &&
      error.statusCode === 429
  );
});

void test("runtime surfaces fatal connector errors for Slack auth failures", async () => {
  const runtime = createDefaultConnectorRuntime({
    fetchImpl: async () => ({
      json: async () => ({
        error: "invalid_auth",
        ok: false
      }),
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          error: "invalid_auth",
          ok: false
        })
    })
  });

  await assert.rejects(
    runtime.execute({
      action: "message.send",
      credentials: {
        botToken: "xoxb-invalid"
      },
      payload: {
        channel: "C123",
        text: "BirthHub ping"
      },
      provider: "slack"
    }),
    (error: unknown) =>
      error instanceof ConnectorExecutionError &&
      error.code === "SLACK_AUTH_FAILED" &&
      error.retryable === false &&
      error.statusCode === 401
  );
});

void test("runtime surfaces retryable connector errors for Omie rate limiting", async () => {
  const runtime = createDefaultConnectorRuntime({
    fetchImpl: async () => ({
      json: async () => ({
        faultstring: "Too many requests"
      }),
      ok: false,
      status: 429,
      text: async () =>
        JSON.stringify({
          faultstring: "Too many requests"
        })
    })
  });

  await assert.rejects(
    runtime.execute({
      action: "erp.customer.upsert",
      credentials: {
        appKey: "app-key",
        appSecret: "app-secret"
      },
      payload: {
        externalCode: "customer-1",
        legalName: "Acme LTDA"
      },
      provider: "omie"
    }),
    (error: unknown) =>
      error instanceof ConnectorExecutionError &&
      error.code === "OMIE_RATE_LIMIT" &&
      error.retryable === true &&
      error.statusCode === 429
  );
});

void test("runtime surfaces fatal connector errors for Omie auth failures", async () => {
  const runtime = createDefaultConnectorRuntime({
    fetchImpl: async () => ({
      json: async () => ({
        faultcode: "OMIE-401",
        faultstring: "app_secret invalido"
      }),
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          faultcode: "OMIE-401",
          faultstring: "app_secret invalido"
        })
    })
  });

  await assert.rejects(
    runtime.execute({
      action: "erp.customer.upsert",
      credentials: {
        appKey: "app-key",
        appSecret: "invalid-secret"
      },
      payload: {
        externalCode: "customer-1",
        legalName: "Acme LTDA"
      },
      provider: "omie"
    }),
    (error: unknown) =>
      error instanceof ConnectorExecutionError &&
      error.code === "OMIE_AUTH_FAILED" &&
      error.retryable === false &&
      error.statusCode === 401
  );
});

void test("runtime surfaces retryable connector errors for Stripe rate limiting", async () => {
  const runtime = createDefaultConnectorRuntime({
    fetchImpl: async () => ({
      json: async () => ({
        error: {
          message: "Too many requests"
        }
      }),
      ok: false,
      status: 429,
      text: async () =>
        JSON.stringify({
          error: {
            message: "Too many requests"
          }
        })
    })
  });

  await assert.rejects(
    runtime.execute({
      action: "payment.read",
      credentials: {
        apiKey: "sk_test_rate_limited"
      },
      payload: {
        objectId: "pi_123",
        objectType: "payment_intent"
      },
      provider: "stripe"
    }),
    (error: unknown) =>
      error instanceof ConnectorExecutionError &&
      error.code === "STRIPE_RATE_LIMIT" &&
      error.retryable === true &&
      error.statusCode === 429
  );
});

void test("runtime surfaces fatal connector errors for Stripe auth failures", async () => {
  const runtime = createDefaultConnectorRuntime({
    fetchImpl: async () => ({
      json: async () => ({
        error: {
          message: "Invalid API Key provided"
        }
      }),
      ok: false,
      status: 401,
      text: async () =>
        JSON.stringify({
          error: {
            message: "Invalid API Key provided"
          }
        })
    })
  });

  await assert.rejects(
    runtime.execute({
      action: "payment.read",
      credentials: {
        apiKey: "sk_test_invalid"
      },
      payload: {
        objectId: "pi_123",
        objectType: "payment_intent"
      },
      provider: "stripe"
    }),
    (error: unknown) =>
      error instanceof ConnectorExecutionError &&
      error.code === "STRIPE_AUTH_FAILED" &&
      error.retryable === false &&
      error.statusCode === 401
  );
});

void test("runtime surfaces retryable connector errors for Zenvia rate limiting", async () => {
  const runtime = createDefaultConnectorRuntime({
    fetchImpl: async () => ({
      headers: {
        get(name: string) {
          return name.toLowerCase() === "retry-after" ? "30" : null;
        }
      },
      json: async () => ({ message: "Too many requests" }),
      ok: false,
      status: 429,
      text: async () => JSON.stringify({ message: "Too many requests" })
    })
  });

  await assert.rejects(
    runtime.execute({
      action: "message.send",
      credentials: {
        apiKey: "zenvia-rate-limited"
      },
      payload: {
        channel: "whatsapp",
        from: "5511999999999",
        text: "BirthHub ping",
        to: "5511888888888"
      },
      provider: "zenvia"
    }),
    (error: unknown) =>
      error instanceof ConnectorExecutionError &&
      error.code === "ZENVIA_RATE_LIMIT" &&
      error.retryable === true &&
      error.statusCode === 429
  );
});

void test("runtime surfaces fatal connector errors for Zenvia auth failures", async () => {
  const runtime = createDefaultConnectorRuntime({
    fetchImpl: async () => ({
      json: async () => ({ message: "invalid token" }),
      ok: false,
      status: 401,
      text: async () => JSON.stringify({ message: "invalid token" })
    })
  });

  await assert.rejects(
    runtime.execute({
      action: "message.send",
      credentials: {
        apiKey: "zenvia-invalid"
      },
      payload: {
        channel: "whatsapp",
        from: "5511999999999",
        text: "BirthHub ping",
        to: "5511888888888"
      },
      provider: "zenvia"
    }),
    (error: unknown) =>
      error instanceof ConnectorExecutionError &&
      error.code === "ZENVIA_AUTH_FAILED" &&
      error.retryable === false &&
      error.statusCode === 401
  );
});
