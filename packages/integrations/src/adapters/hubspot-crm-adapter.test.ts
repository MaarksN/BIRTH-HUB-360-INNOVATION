import assert from "node:assert/strict";
import test from "node:test";

import {
  HubspotCrmAdapter,
  HubspotApiError,
  HubspotRateLimitError,
  HubspotTimeoutError,
  type HubspotAdapterFetch
} from "./hubspot-crm-adapter.js";

// ---------------------------------------------------------------------------
// Stub fetch helper
// ---------------------------------------------------------------------------

type FetchInit = {
  body?: string;
  headers: Record<string, string>;
  method: "GET" | "PATCH" | "POST";
  signal?: AbortSignal;
};

function stubFetch(
  handler: (url: string, init: FetchInit) => { body: string; ok: boolean; status: number }
): HubspotAdapterFetch {
  return async (url: string, init: FetchInit) => {
    const result = handler(url, init);
    return {
      json: async () => JSON.parse(result.body) as unknown,
      ok: result.ok,
      status: result.status,
      text: async () => result.body
    };
  };
}

// ---------------------------------------------------------------------------
// upsertContact
// ---------------------------------------------------------------------------

void test("HubSpot adapter upserts contact and returns objectId", async () => {
  const fetch = stubFetch((_url, _init) => ({
    body: JSON.stringify({ id: "hs-42", results: [{ id: "hs-42" }] }),
    ok: true,
    status: 200
  }));

  const adapter = new HubspotCrmAdapter({
    accessToken: "test-token",
    fetchImpl: fetch
  });

  const result = await adapter.upsertContact({
    email: "alice@example.com",
    firstName: "Alice",
    lastName: "Smith"
  });

  assert.equal(result.status, 200);
  assert.equal(result.objectId, "hs-42");
  assert.ok(result.request.path.includes("/contacts/batch/upsert"));
});

void test("HubSpot adapter lowercases email before sending", async () => {
  let capturedBody = "";
  const fetch = stubFetch((_url, init) => {
    capturedBody = init.body ?? "";
    return { body: JSON.stringify({ id: "hs-43" }), ok: true, status: 200 };
  });

  const adapter = new HubspotCrmAdapter({ accessToken: "test-token", fetchImpl: fetch });

  await adapter.upsertContact({ email: "Bob@Example.COM" });

  const parsed = JSON.parse(capturedBody) as {
    inputs: Array<{ id: string; properties: Record<string, string> }>;
  };
  assert.equal(parsed.inputs[0]?.id, "bob@example.com");
  assert.equal(parsed.inputs[0]?.properties?.email, "bob@example.com");
});

void test("HubSpot adapter throws on missing email", async () => {
  const fetch = stubFetch(() => ({ body: "", ok: true, status: 200 }));
  const adapter = new HubspotCrmAdapter({ accessToken: "test-token", fetchImpl: fetch });

  await assert.rejects(
    () => adapter.upsertContact({ email: "  " }),
    (error: unknown) =>
      error instanceof Error && error.message === "HUBSPOT_CONTACT_EMAIL_REQUIRED"
  );
});

// ---------------------------------------------------------------------------
// getContactById
// ---------------------------------------------------------------------------

void test("HubSpot adapter fetches contact by ID and returns properties", async () => {
  const fetch = stubFetch((_url) => ({
    body: JSON.stringify({
      id: "hs-100",
      properties: { email: "carol@example.com", firstname: "Carol" }
    }),
    ok: true,
    status: 200
  }));

  const adapter = new HubspotCrmAdapter({ accessToken: "test-token", fetchImpl: fetch });
  const record = await adapter.getContactById("hs-100");

  assert.equal(record.id, "hs-100");
  assert.equal(record.properties["email"], "carol@example.com");
  assert.equal(record.properties["firstname"], "Carol");
});

// ---------------------------------------------------------------------------
// validateAccessToken / validateCrmAccess
// ---------------------------------------------------------------------------

void test("HubSpot adapter validateAccessToken calls token info endpoint", async () => {
  let calledUrl = "";
  const fetch = stubFetch((url) => {
    calledUrl = url;
    return { body: JSON.stringify({ user: "alice@example.com" }), ok: true, status: 200 };
  });

  const adapter = new HubspotCrmAdapter({ accessToken: "my-token", fetchImpl: fetch });
  const result = await adapter.validateAccessToken();

  assert.ok(calledUrl.includes("/oauth/v1/access-tokens/my-token"));
  assert.equal(result.status, 200);
});

void test("HubSpot adapter validateCrmAccess calls contacts list endpoint", async () => {
  let calledUrl = "";
  const fetch = stubFetch((url) => {
    calledUrl = url;
    return { body: JSON.stringify({ results: [] }), ok: true, status: 200 };
  });

  const adapter = new HubspotCrmAdapter({ accessToken: "my-token", fetchImpl: fetch });
  await adapter.validateCrmAccess();

  assert.ok(calledUrl.includes("/crm/v3/objects/contacts"));
});

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------

void test("HubSpot adapter throws HubspotRateLimitError on 429", async () => {
  const fetch = stubFetch(() => ({
    body: JSON.stringify({ message: "Too Many Requests" }),
    ok: false,
    status: 429
  }));

  const adapter = new HubspotCrmAdapter({ accessToken: "test-token", fetchImpl: fetch });

  await assert.rejects(
    () => adapter.upsertContact({ email: "rate@example.com" }),
    (error: unknown) =>
      error instanceof HubspotRateLimitError &&
      error.retryable &&
      error.statusCode === 429
  );
});

void test("HubSpot adapter throws non-retryable error on 401", async () => {
  const fetch = stubFetch(() => ({
    body: JSON.stringify({ message: "Unauthorized" }),
    ok: false,
    status: 401
  }));

  const adapter = new HubspotCrmAdapter({ accessToken: "bad-token", fetchImpl: fetch });

  await assert.rejects(
    () => adapter.upsertContact({ email: "auth@example.com" }),
    (error: unknown) =>
      error instanceof HubspotApiError &&
      !error.retryable &&
      error.code === "HUBSPOT_AUTH_FAILED"
  );
});

void test("HubSpot adapter throws retryable error on 503", async () => {
  const fetch = stubFetch(() => ({
    body: JSON.stringify({ message: "Service Unavailable" }),
    ok: false,
    status: 503
  }));

  const adapter = new HubspotCrmAdapter({ accessToken: "test-token", fetchImpl: fetch });

  await assert.rejects(
    () => adapter.upsertContact({ email: "server@example.com" }),
    (error: unknown) =>
      error instanceof HubspotApiError &&
      error.retryable &&
      error.code === "HUBSPOT_SERVER_ERROR"
  );
});

void test("HubSpot adapter throws HubspotTimeoutError on AbortError", async () => {
  const fetch: HubspotAdapterFetch = async (_url, init) => {
    if (init.signal) {
      await new Promise<void>((_, reject) => {
        init.signal!.addEventListener("abort", () =>
          reject(Object.assign(new Error("Aborted"), { name: "AbortError" }))
        );
      });
    }
    throw new Error("should not reach here");
  };

  const adapter = new HubspotCrmAdapter({
    accessToken: "test-token",
    fetchImpl: fetch,
    timeoutMs: 1 // trigger abort immediately
  });

  await assert.rejects(
    () => adapter.upsertContact({ email: "timeout@example.com" }),
    (error: unknown) => error instanceof HubspotTimeoutError && error.retryable
  );
});

// ---------------------------------------------------------------------------
// upsertCompany
// ---------------------------------------------------------------------------

void test("HubSpot adapter creates new company when hubspotCompanyId is absent", async () => {
  let calledMethod = "";
  let calledPath = "";
  const fetch = stubFetch((_url, init) => {
    calledMethod = init.method;
    calledPath = _url;
    return { body: JSON.stringify({ id: "company-99" }), ok: true, status: 201 };
  });

  const adapter = new HubspotCrmAdapter({ accessToken: "test-token", fetchImpl: fetch });
  const result = await adapter.upsertCompany({ name: "BirthHub Inc" });

  assert.equal(calledMethod, "POST");
  assert.ok(calledPath.endsWith("/crm/v3/objects/companies"));
  assert.equal(result.objectId, "company-99");
});

void test("HubSpot adapter patches existing company when hubspotCompanyId is present", async () => {
  let calledMethod = "";
  let calledPath = "";
  const fetch = stubFetch((_url, init) => {
    calledMethod = init.method;
    calledPath = _url;
    return { body: JSON.stringify({ id: "company-77" }), ok: true, status: 200 };
  });

  const adapter = new HubspotCrmAdapter({ accessToken: "test-token", fetchImpl: fetch });
  await adapter.upsertCompany({ name: "BirthHub Inc", hubspotCompanyId: "company-77" });

  assert.equal(calledMethod, "PATCH");
  assert.ok(calledPath.endsWith("/crm/v3/objects/companies/company-77"));
});
