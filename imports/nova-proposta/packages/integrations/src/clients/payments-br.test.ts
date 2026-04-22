
// 
import assert from "node:assert/strict";
import test from "node:test";

import { PagarmeClient } from "./payments-br.js";

function createJsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    headers: {
      "content-type": "application/json"
    },
    status
  });
}

void test("Pagarme client maps typed PIX charge responses", async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = ((_: RequestInfo | URL) =>
    Promise.resolve(
      createJsonResponse({
        charges: [
          {
            id: "charge_1",
            last_transaction: {
              qr_code: "pix-code",
              qr_code_url: "https://pay.example/pix"
            },
            status: "pending"
          }
        ],
        id: "order_1"
      })
    )) as typeof fetch;

  try {
    const client = new PagarmeClient("pay_key_123", "https://payments.example");
    const response = await client.generatePix(
      125.5,
      "Assinatura",
      "tenant_alpha",
      {
        document: "12345678900",
        email: "ana@example.com",
        name: "Ana"
      }
    );

    assert.deepEqual(response, {
      amount: 125.5,
      gatewayId: "charge_1",
      id: "order_1",
      qrCode: "pix-code",
      qrCodeUrl: "https://pay.example/pix",
      status: "pending"
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

void test("Pagarme client fails fast when the provider omits charges", async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = ((_: RequestInfo | URL) =>
    Promise.resolve(
      createJsonResponse({
        charges: [],
        id: "order_1"
      })
    )) as typeof fetch;

  try {
    const client = new PagarmeClient("pay_key_123", "https://payments.example");

    await assert.rejects(
      () =>
        client.generateBoleto(
          90,
          "Assinatura",
          "tenant_alpha",
          {
            document: "12345678900",
            email: "ana@example.com",
            name: "Ana"
          },
          new Date("2026-04-09T00:00:00.000Z")
        ),
      /did not include any charges/i
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
