
//
import assert from "node:assert/strict";
import test from "node:test";

import { ENotasClient } from "./fiscal.js";

function createJsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    headers: {
      "content-type": "application/json",
    },
    status,
  });
}

void test("ENotas client maps typed invoice responses without any casts", async () => {
  const originalFetch = globalThis.fetch;
  let authorizationHeader = "";

  globalThis.fetch = ((_: RequestInfo | URL, init?: RequestInit) => {
    authorizationHeader = new Headers(init?.headers).get("authorization") ?? "";
    return Promise.resolve(
      createJsonResponse({
        id: "nfe_1",
        linkPdf: "https://fiscal.example/nfe_1.pdf",
        linkXml: "https://fiscal.example/nfe_1.xml",
        status: "processing",
      }),
    );
  }) as typeof fetch;

  try {
    const client = new ENotasClient("api_key_123", "https://fiscal.example");
    const result = await client.emitNFe(
      {
        amount: 100,
        customerAddress: "Rua 1",
        customerDocument: "12345678900",
        customerEmail: "ana@example.com",
        customerName: "Ana",
        description: "Consulta",
        referenceId: "invoice_1",
        serviceCode: "8630503",
      },
      "tenant_alpha",
    );

    assert.equal(result.id, "nfe_1");
    assert.equal(result.status, "processing");
    assert.equal(result.nfeUrl, "https://fiscal.example/nfe_1.pdf");
    assert.equal(result.xmlUrl, "https://fiscal.example/nfe_1.xml");
    assert.match(authorizationHeader, /^Basic /);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
