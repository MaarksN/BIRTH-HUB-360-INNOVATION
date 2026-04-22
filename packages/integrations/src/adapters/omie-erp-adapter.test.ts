import assert from "node:assert/strict";
import test from "node:test";

import {
  OmieApiError,
  OmieErpAdapter,
  OmieRateLimitError
} from "./omie-erp-adapter.js";

void test("OmieErpAdapter upserts customers with the official JSON envelope", async () => {
  let capturedUrl = "";
  let capturedBody = "";
  const adapter = new OmieErpAdapter({
    appKey: "app-key-1",
    appSecret: "app-secret-1",
    fetchImpl: async (input, init) => {
      capturedUrl = input;
      capturedBody = init.body ?? "";

      return {
        json: async () => ({
          codigo_cliente_integracao: "customer-001",
          codigo_cliente_omie: 1234
        }),
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            codigo_cliente_integracao: "customer-001",
            codigo_cliente_omie: 1234
          })
      };
    }
  });

  const response = await adapter.upsertCustomer({
    email: "financeiro@example.com",
    externalCode: "customer-001",
    legalName: "Acme LTDA",
    tradeName: "Acme"
  });

  assert.equal(capturedUrl, "https://app.omie.com.br/api/v1/geral/clientes/");
  assert.deepEqual(JSON.parse(capturedBody), {
    app_key: "app-key-1",
    app_secret: "app-secret-1",
    call: "UpsertCliente",
    param: [
      {
        codigo_cliente_integracao: "customer-001",
        email: "financeiro@example.com",
        nome_fantasia: "Acme",
        razao_social: "Acme LTDA"
      }
    ]
  });
  assert.equal(response.externalId, "1234");
  assert.equal(response.request.call, "UpsertCliente");
});

void test("OmieErpAdapter creates sales orders with Omie defaults for stage and installment", async () => {
  let capturedBody = "";
  const adapter = new OmieErpAdapter({
    appKey: "app-key-1",
    appSecret: "app-secret-1",
    fetchImpl: async (_input, init) => {
      capturedBody = init.body ?? "";

      return {
        json: async () => ({
          codigo_pedido: 9876,
          codigo_pedido_integracao: "order-001"
        }),
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            codigo_pedido: 9876,
            codigo_pedido_integracao: "order-001"
          })
      };
    }
  });

  const response = await adapter.createSalesOrder({
    customerCode: 1234,
    forecastDate: "2026-04-20T10:30:00.000Z",
    integrationCode: "order-001",
    items: [
      {
        productCode: 456,
        quantity: 2,
        taxScenarioItemCode: 789,
        unitPrice: 19.9
      }
    ],
    taxScenarioCode: 321
  });

  assert.deepEqual(JSON.parse(capturedBody), {
    app_key: "app-key-1",
    app_secret: "app-secret-1",
    call: "AdicionarPedido",
    param: [
      {
        codigo_cenario_impostos: 321,
        codigo_cliente: 1234,
        codigo_parcela: "000",
        codigo_pedido_integracao: "order-001",
        data_previsao: "20/04/2026",
        etapa: "10",
        itens: [
          {
            codigo_cenario_impostos_item: 789,
            codigo_produto: 456,
            quantidade: 2,
            valor_unitario: 19.9
          }
        ]
      }
    ]
  });
  assert.equal(response.externalId, "9876");
});

void test("OmieErpAdapter classifies rate limiting and auth failures", async () => {
  const rateLimitedAdapter = new OmieErpAdapter({
    appKey: "app-key-1",
    appSecret: "app-secret-1",
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
    rateLimitedAdapter.validateCredentials(),
    (error: unknown) => error instanceof OmieRateLimitError
  );

  const authFailedAdapter = new OmieErpAdapter({
    appKey: "app-key-1",
    appSecret: "invalid-secret",
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
    authFailedAdapter.validateCredentials(),
    (error: unknown) =>
      error instanceof OmieApiError &&
      error.code === "OMIE_AUTH_FAILED" &&
      error.retryable === false
  );
});
