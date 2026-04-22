import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";

process.env.WEBHOOK_RECEIVER_AUTOSTART = "false";

const {
  buildStripeForwardPayload,
  createWebhookReceiverServer,
  signBirthHubWebhookPayload,
  verifyStripeSignature,
  verifySvixSignature
} =
  await import("./index.ts");

function stripeSignature(body: string, secret: string, timestamp = Math.floor(Date.now() / 1_000)): string {
  const signature = createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
  return `t=${timestamp},v1=${signature}`;
}

function svixSignature(input: {
  body: string;
  id: string;
  secret: string;
  timestamp?: string;
}): { signature: string; timestamp: string } {
  const timestamp = input.timestamp ?? String(Math.floor(Date.now() / 1_000));
  const signature = createHmac("sha256", input.secret)
    .update(`${input.id}.${timestamp}.${input.body}`)
    .digest("base64");

  return {
    signature: `v1,${signature}`,
    timestamp
  };
}

function createTestIdempotencyStore(options: { failClaim?: boolean } = {}) {
  const claims = new Map<string, string>();
  let sequence = 0;

  return {
    completed: [] as Array<{ key: string; token: string }>,
    released: [] as Array<{ key: string; token: string }>,
    async claim(key: string): Promise<{ key: string; token: string } | null> {
      if (options.failClaim) {
        throw new Error("Redis unavailable");
      }

      if (claims.has(key)) {
        return null;
      }

      const claim = {
        key,
        token: `claim_${++sequence}`
      };
      claims.set(key, claim.token);
      return claim;
    },
    async complete(claim: { key: string; token: string }): Promise<void> {
      if (claims.get(claim.key) === claim.token) {
        this.completed.push(claim);
      }
    },
    async release(claim: { key: string; token: string }): Promise<void> {
      if (claims.get(claim.key) === claim.token) {
        claims.delete(claim.key);
        this.released.push(claim);
      }
    }
  };
}

void test("buildStripeForwardPayload preserves Stripe event identity and raw metadata", () => {
  const payload = buildStripeForwardPayload({
    rawBody: '{"id":"evt_123","type":"payment_intent.succeeded"}',
    rawPayload: {
      data: {
        object: {
          id: "pi_123",
          object: "payment_intent"
        }
      },
      id: "evt_123",
      type: "payment_intent.succeeded"
    },
    signature: "t=123,v1=test",
    url: new URL(
      "http://localhost/webhooks/stripe?tenantId=tenant_1&organizationId=org_1&accountKey=primary"
    )
  });

  assert.deepEqual(payload, {
    accountKey: "primary",
    eventType: "payment_intent.succeeded",
    externalEventId: "evt_123",
    idempotencyKey: "evt_123",
    organizationId: "org_1",
    payload: {
      stripe: {
        data: {
          object: {
            id: "pi_123",
            object: "payment_intent"
          }
        },
        id: "evt_123",
        type: "payment_intent.succeeded"
      }
    },
    rawBody: '{"id":"evt_123","type":"payment_intent.succeeded"}',
    tenantId: "tenant_1",
    webhookSignature: "t=123,v1=test"
  });
});

void test("createWebhookReceiverServer forwards signed Stripe webhooks to the API", async () => {
  const originalFetch = globalThis.fetch;
  const recorded: {
    body?: string;
    headers?: HeadersInit;
    url?: string;
  } = {};

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const target = String(input);
    if (target.startsWith("http://127.0.0.1:")) {
      return originalFetch(input, init);
    }

    recorded.url = target;
    recorded.body = typeof init?.body === "string" ? init.body : undefined;
    recorded.headers = init?.headers;

    return new Response(JSON.stringify({ accepted: true }), {
      headers: {
        "content-type": "application/json"
      },
      status: 202
    });
  }) as typeof fetch;

  const server = createWebhookReceiverServer({
    apiGatewayUrl: "http://api.local",
    birthhubSigningSecret: "receiver-secret",
    nodeEnv: "test",
    port: 0,
    primaryApiUrl: "http://api.local",
    strictRuntime: false
  });

  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  assert.ok(address && typeof address === "object");

  try {
    const stripePayload = JSON.stringify({
      data: {
        object: {
          id: "pi_success",
          object: "payment_intent"
        }
      },
      id: "evt_success",
      type: "payment_intent.succeeded"
    });
    const response = await fetch(`http://127.0.0.1:${address.port}/webhooks/stripe?tenantId=tenant_1`, {
      body: stripePayload,
      headers: {
        "content-type": "application/json",
        "stripe-signature": "t=123,v1=signature"
      },
      method: "POST"
    });

    assert.equal(response.status, 202);
    assert.equal(recorded.url, "http://api.local/api/v1/connectors/webhooks/stripe");
    assert.ok(recorded.body);

    const forwardedPayload = JSON.parse(recorded.body ?? "{}") as Record<string, unknown>;
    assert.equal(forwardedPayload.eventType, "payment_intent.succeeded");
    assert.equal(forwardedPayload.externalEventId, "evt_success");
    assert.equal(forwardedPayload.idempotencyKey, "evt_success");
    assert.equal(forwardedPayload.tenantId, "tenant_1");
    assert.equal(forwardedPayload.rawBody, stripePayload);
    assert.equal(forwardedPayload.webhookSignature, "t=123,v1=signature");

    const headers = new Headers(recorded.headers);
    assert.equal(
      headers.get("x-birthhub-signature"),
      signBirthHubWebhookPayload(forwardedPayload, "receiver-secret")
    );
  } finally {
    globalThis.fetch = originalFetch;
    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
});

void test("createWebhookReceiverServer preserves Stripe API validation failures", async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const target = String(input);
    if (target.startsWith("http://127.0.0.1:")) {
      return originalFetch(input, init);
    }

    return new Response(
      JSON.stringify({
        detail: "Invalid Stripe webhook signature.",
        title: "Unauthorized"
      }),
      {
        headers: {
          "content-type": "application/json"
        },
        status: 401
      }
    );
  }) as typeof fetch;

  const server = createWebhookReceiverServer({
    apiGatewayUrl: "http://api.local",
    birthhubSigningSecret: "receiver-secret",
    nodeEnv: "test",
    port: 0,
    primaryApiUrl: "http://api.local",
    strictRuntime: false
  });

  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  assert.ok(address && typeof address === "object");

  try {
    const response = await fetch(`http://127.0.0.1:${address.port}/webhooks/stripe`, {
      body: JSON.stringify({
        data: {
          object: {
            id: "pi_invalid",
            object: "payment_intent"
          }
        },
        id: "evt_invalid",
        type: "payment_intent.payment_failed"
      }),
      headers: {
        "content-type": "application/json",
        "stripe-signature": "t=123,v1=invalid"
      },
      method: "POST"
    });

    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), {
      detail: "Invalid Stripe webhook signature.",
      title: "Unauthorized"
    });
  } finally {
    globalThis.fetch = originalFetch;
    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
});

void test("createWebhookReceiverServer rejects invalid Stripe signatures before forwarding", async () => {
  const originalFetch = globalThis.fetch;
  let forwarded = false;

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const target = String(input);
    if (target.startsWith("http://127.0.0.1:")) {
      return originalFetch(input, init);
    }

    forwarded = true;
    return new Response(null, { status: 202 });
  }) as typeof fetch;

  const server = createWebhookReceiverServer({
    apiGatewayUrl: "http://api.local",
    birthhubSigningSecret: "receiver-secret",
    nodeEnv: "test",
    port: 0,
    primaryApiUrl: "http://api.local",
    strictRuntime: false,
    stripeWebhookSecret: "whsec_test"
  });

  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  assert.ok(address && typeof address === "object");

  try {
    const response = await fetch(`http://127.0.0.1:${address.port}/webhooks/stripe`, {
      body: JSON.stringify({ id: "evt_bad", type: "payment_intent.succeeded" }),
      headers: {
        "content-type": "application/json",
        "stripe-signature": "t=123,v1=invalid"
      },
      method: "POST"
    });

    assert.equal(response.status, 401);
    assert.equal(forwarded, false);
  } finally {
    globalThis.fetch = originalFetch;
    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
});

void test("createWebhookReceiverServer accepts Stripe signatures signed with a fallback secret", async () => {
  const originalFetch = globalThis.fetch;
  let forwarded = false;

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const target = String(input);
    if (target.startsWith("http://127.0.0.1:")) {
      return originalFetch(input, init);
    }

    forwarded = true;
    return new Response(JSON.stringify({ accepted: true }), { status: 202 });
  }) as typeof fetch;

  const server = createWebhookReceiverServer({
    apiGatewayUrl: "http://api.local",
    birthhubSigningSecret: "receiver-secret",
    nodeEnv: "test",
    port: 0,
    primaryApiUrl: "http://api.local",
    strictRuntime: false,
    stripeWebhookSecret: "whsec_current",
    stripeWebhookSecretCandidates: ["whsec_current", "whsec_legacy"]
  });

  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  assert.ok(address && typeof address === "object");

  try {
    const body = JSON.stringify({ id: "evt_rotated", type: "payment_intent.succeeded" });
    const response = await fetch(`http://127.0.0.1:${address.port}/webhooks/stripe`, {
      body,
      headers: {
        "content-type": "application/json",
        "stripe-signature": stripeSignature(body, "whsec_legacy")
      },
      method: "POST"
    });

    assert.equal(response.status, 202);
    assert.equal(forwarded, true);
  } finally {
    globalThis.fetch = originalFetch;
    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
});

void test("createWebhookReceiverServer deduplicates processed Stripe events", async () => {
  const originalFetch = globalThis.fetch;
  const idempotencyStore = createTestIdempotencyStore();
  let forwards = 0;

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const target = String(input);
    if (target.startsWith("http://127.0.0.1:")) {
      return originalFetch(input, init);
    }

    forwards += 1;
    return new Response(JSON.stringify({ accepted: true }), { status: 202 });
  }) as typeof fetch;

  const server = createWebhookReceiverServer({
    apiGatewayUrl: "http://api.local",
    birthhubSigningSecret: "receiver-secret",
    idempotencyStore,
    nodeEnv: "test",
    port: 0,
    primaryApiUrl: "http://api.local",
    strictRuntime: false
  });

  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  assert.ok(address && typeof address === "object");

  try {
    const body = JSON.stringify({
      data: { object: { id: "pi_duplicate", object: "payment_intent" } },
      id: "evt_duplicate",
      type: "payment_intent.succeeded"
    });
    const url = `http://127.0.0.1:${address.port}/webhooks/stripe?tenantId=tenant_dupe`;
    const first = await fetch(url, {
      body,
      headers: {
        "content-type": "application/json",
        "stripe-signature": "t=123,v1=signature"
      },
      method: "POST"
    });
    const second = await fetch(url, {
      body,
      headers: {
        "content-type": "application/json",
        "stripe-signature": "t=123,v1=signature"
      },
      method: "POST"
    });

    assert.equal(first.status, 202);
    assert.equal(second.status, 202);
    assert.deepEqual(await second.json(), {
      accepted: true,
      duplicate: true
    });
    assert.equal(forwards, 1);
    assert.equal(idempotencyStore.completed.length, 1);
  } finally {
    globalThis.fetch = originalFetch;
    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
});

void test("createWebhookReceiverServer uses an explicit permissive fallback without Redis", async () => {
  const originalFetch = globalThis.fetch;
  let forwards = 0;

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const target = String(input);
    if (target.startsWith("http://127.0.0.1:")) {
      return originalFetch(input, init);
    }

    forwards += 1;
    return new Response(JSON.stringify({ accepted: true }), { status: 202 });
  }) as typeof fetch;

  const server = createWebhookReceiverServer({
    apiGatewayUrl: "http://api.local",
    birthhubSigningSecret: "receiver-secret",
    nodeEnv: "test",
    port: 0,
    primaryApiUrl: "http://api.local",
    strictRuntime: false
  });

  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  assert.ok(address && typeof address === "object");

  try {
    const body = JSON.stringify({
      id: "evt_permissive_fallback",
      type: "payment_intent.succeeded"
    });
    const url = `http://127.0.0.1:${address.port}/webhooks/stripe?tenantId=tenant_no_redis`;
    const first = await fetch(url, {
      body,
      headers: {
        "content-type": "application/json",
        "stripe-signature": "t=123,v1=signature"
      },
      method: "POST"
    });
    const second = await fetch(url, {
      body,
      headers: {
        "content-type": "application/json",
        "stripe-signature": "t=123,v1=signature"
      },
      method: "POST"
    });

    assert.equal(first.status, 202);
    assert.equal(second.status, 202);
    assert.deepEqual(await second.json(), {
      accepted: true
    });
    assert.equal(forwards, 2);
  } finally {
    globalThis.fetch = originalFetch;
    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
});

void test("createWebhookReceiverServer treats idempotency store failures explicitly", async () => {
  const originalFetch = globalThis.fetch;
  let forwarded = false;

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const target = String(input);
    if (target.startsWith("http://127.0.0.1:")) {
      return originalFetch(input, init);
    }

    forwarded = true;
    return new Response(JSON.stringify({ accepted: true }), { status: 202 });
  }) as typeof fetch;

  const server = createWebhookReceiverServer({
    apiGatewayUrl: "http://api.local",
    birthhubSigningSecret: "receiver-secret",
    idempotencyStore: createTestIdempotencyStore({ failClaim: true }),
    nodeEnv: "test",
    port: 0,
    primaryApiUrl: "http://api.local",
    strictRuntime: false
  });

  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  assert.ok(address && typeof address === "object");

  try {
    const response = await fetch(`http://127.0.0.1:${address.port}/webhooks/stripe?tenantId=tenant_down`, {
      body: JSON.stringify({
        id: "evt_redis_down",
        type: "payment_intent.succeeded"
      }),
      headers: {
        "content-type": "application/json",
        "stripe-signature": "t=123,v1=signature"
      },
      method: "POST"
    });

    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), {
      error: "Webhook idempotency store is unavailable."
    });
    assert.equal(forwarded, false);
  } finally {
    globalThis.fetch = originalFetch;
    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
});

void test("createWebhookReceiverServer releases idempotency after retryable API failure", async () => {
  const originalFetch = globalThis.fetch;
  const idempotencyStore = createTestIdempotencyStore();
  let forwards = 0;

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const target = String(input);
    if (target.startsWith("http://127.0.0.1:")) {
      return originalFetch(input, init);
    }

    forwards += 1;
    return new Response(JSON.stringify({ accepted: forwards > 1 }), {
      status: forwards === 1 ? 503 : 202
    });
  }) as typeof fetch;

  const server = createWebhookReceiverServer({
    apiGatewayUrl: "http://api.local",
    birthhubSigningSecret: "receiver-secret",
    idempotencyStore,
    nodeEnv: "test",
    port: 0,
    primaryApiUrl: "http://api.local",
    strictRuntime: false
  });

  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  assert.ok(address && typeof address === "object");

  try {
    const body = JSON.stringify({
      id: "evt_retry_after_failure",
      type: "payment_intent.succeeded"
    });
    const url = `http://127.0.0.1:${address.port}/webhooks/stripe?tenantId=tenant_retry`;
    const first = await fetch(url, {
      body,
      headers: {
        "content-type": "application/json",
        "stripe-signature": "t=123,v1=signature"
      },
      method: "POST"
    });
    const second = await fetch(url, {
      body,
      headers: {
        "content-type": "application/json",
        "stripe-signature": "t=123,v1=signature"
      },
      method: "POST"
    });

    assert.equal(first.status, 503);
    assert.equal(second.status, 202);
    assert.equal(forwards, 2);
    assert.equal(idempotencyStore.released.length, 1);
    assert.equal(idempotencyStore.completed.length, 1);
  } finally {
    globalThis.fetch = originalFetch;
    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
});

void test("createWebhookReceiverServer processes Svix Resend webhooks in Node", async () => {
  const originalFetch = globalThis.fetch;
  const calls: Array<{ body?: string; headers?: HeadersInit; method?: string; url: string }> = [];

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const target = String(input);
    if (target.startsWith("http://127.0.0.1:")) {
      return originalFetch(input, init);
    }

    calls.push({
      body: typeof init?.body === "string" ? init.body : undefined,
      headers: init?.headers,
      method: init?.method,
      url: target
    });
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }) as typeof fetch;

  const server = createWebhookReceiverServer({
    apiGatewayUrl: "http://api.local",
    birthhubSigningSecret: "receiver-secret",
    internalServiceToken: "svc_test",
    nodeEnv: "test",
    port: 0,
    primaryApiUrl: "http://api.local",
    strictRuntime: false,
    svixWebhookSecret: "svix_secret"
  });

  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  assert.ok(address && typeof address === "object");

  try {
    const body = JSON.stringify({
      data: {
        activityId: "activity_123"
      },
      type: "email.opened"
    });
    const headers = svixSignature({
      body,
      id: "evt_resend_1",
      secret: "svix_secret"
    });
    const response = await fetch(`http://127.0.0.1:${address.port}/webhooks/resend`, {
      body,
      headers: {
        "content-type": "application/json",
        "svix-id": "evt_resend_1",
        "svix-signature": headers.signature,
        "svix-timestamp": headers.timestamp
      },
      method: "POST"
    });

    assert.equal(response.status, 202);
    assert.deepEqual(await response.json(), {
      accepted: true,
      processed: true
    });
    assert.equal(calls.length, 1);
    assert.equal(calls[0]?.url, "http://api.local/api/v1/internal/activities/activity_123");
    assert.equal(calls[0]?.method, "PATCH");
    assert.deepEqual(JSON.parse(calls[0]?.body ?? "{}"), { status: "OPENED" });
    assert.equal(new Headers(calls[0]?.headers).get("x-service-token"), "svc_test");
  } finally {
    globalThis.fetch = originalFetch;
    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
});

void test("signature helpers validate Stripe and Svix payloads", () => {
  const body = JSON.stringify({ ok: true });
  const stripeHeader = stripeSignature(body, "stripe_secret");
  const svix = svixSignature({
    body,
    id: "evt_signature",
    secret: "svix_secret"
  });

  assert.equal(
    verifyStripeSignature({
      body,
      secret: "stripe_secret",
      signature: stripeHeader
    }),
    true
  );
  assert.equal(
    verifySvixSignature({
      body,
      id: "evt_signature",
      secret: "svix_secret",
      signature: svix.signature,
      timestamp: svix.timestamp
    }),
    true
  );
});

void test("createWebhookReceiverServer requires persistent idempotency in strict runtime", () => {
  assert.throws(
    () =>
      createWebhookReceiverServer({
        apiGatewayUrl: "http://api.local",
        birthhubSigningSecret: "receiver-secret",
        nodeEnv: "production",
        port: 0,
        primaryApiUrl: "http://api.local",
        strictRuntime: true
      }),
    /REDIS_URL \(or an explicit persistent idempotencyStore\) is required in strict runtime\./
  );
});
