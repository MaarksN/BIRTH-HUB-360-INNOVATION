import assert from "node:assert/strict";
import test from "node:test";

import {
  extractOmieCustomerPayload,
  extractOmieSalesOrderPayload
} from "./omie-events.js";

// ---------------------------------------------------------------------------
// extractOmieCustomerPayload — happy paths
// ---------------------------------------------------------------------------

void test("extractOmieCustomerPayload: canonical camelCase fields", () => {
  const result = extractOmieCustomerPayload({
    customer: {
      contactName: "Dr. Alice",
      email: "alice@example.com",
      externalCode: "cust-001",
      legalName: "Acme LTDA",
      phone: "11999990000",
      taxId: "12345678000199",
      tradeName: "Acme"
    }
  });

  assert.ok(result);
  assert.equal(result.legalName, "Acme LTDA");
  assert.equal(result.externalCode, "cust-001");
  assert.equal(result.taxId, "12345678000199");
  assert.equal(result.tradeName, "Acme");
});

void test("extractOmieCustomerPayload: PT-BR alias razao_social", () => {
  const result = extractOmieCustomerPayload({
    customer: {
      codigo_cliente_integracao: "br-code-01",
      razao_social: "Empresa Brasileira LTDA"
    }
  });

  assert.ok(result);
  assert.equal(result.legalName, "Empresa Brasileira LTDA");
  assert.equal(result.externalCode, "br-code-01");
});

void test("extractOmieCustomerPayload: PT-BR alias cnpj_cpf for taxId", () => {
  const result = extractOmieCustomerPayload({
    customer: {
      cnpj_cpf: "98765432000155",
      externalCode: "cust-br",
      razao_social: "CNPJ Test LTDA"
    }
  });

  assert.ok(result);
  assert.equal(result.taxId, "98765432000155");
});

void test("extractOmieCustomerPayload: PT-BR alias nome_fantasia for tradeName", () => {
  const result = extractOmieCustomerPayload({
    customer: {
      externalCode: "cust-trade",
      legalName: "Trade Name Co",
      nome_fantasia: "TradeCo"
    }
  });

  assert.ok(result);
  assert.equal(result.tradeName, "TradeCo");
});

void test("extractOmieCustomerPayload: flat payload without customer wrapper", () => {
  const result = extractOmieCustomerPayload({
    externalCode: "flat-001",
    legalName: "Flat Co LTDA",
    taxId: "11111111000100"
  });

  assert.ok(result);
  assert.equal(result.legalName, "Flat Co LTDA");
  assert.equal(result.externalCode, "flat-001");
});

void test("extractOmieCustomerPayload: cliente alias as customer source", () => {
  const result = extractOmieCustomerPayload({
    cliente: {
      externalCode: "cust-cliente",
      legalName: "Cliente LTDA"
    }
  });

  assert.ok(result);
  assert.equal(result.legalName, "Cliente LTDA");
});

void test("extractOmieCustomerPayload: nested address with PT-BR fields", () => {
  const result = extractOmieCustomerPayload({
    customer: {
      address: {
        bairro: "Centro",
        cep: "01310-200",
        cidade: "São Paulo",
        estado: "SP",
        logradouro: "Av. Paulista",
        numero: "1000"
      },
      externalCode: "cust-addr",
      legalName: "Address Co LTDA"
    }
  });

  assert.ok(result?.address);
  assert.equal(result.address.city, "São Paulo");
  assert.equal(result.address.state, "SP");
  assert.equal(result.address.zipCode, "01310-200");
  assert.equal(result.address.district, "Centro");
  assert.equal(result.address.street, "Av. Paulista");
  assert.equal(result.address.number, "1000");
});

void test("extractOmieCustomerPayload: returns undefined when absent and not required", () => {
  assert.equal(extractOmieCustomerPayload({ unrelated: "value" }), undefined);
});

// ---------------------------------------------------------------------------
// extractOmieCustomerPayload — validation errors
// ---------------------------------------------------------------------------

void test("extractOmieCustomerPayload: throws OMIE_CONNECTOR_EVENT_CUSTOMER_REQUIRED when required and absent", () => {
  assert.throws(
    () => extractOmieCustomerPayload({ unrelated: "value" }, { required: true }),
    (error: unknown) =>
      error instanceof Error && error.message === "OMIE_CONNECTOR_EVENT_CUSTOMER_REQUIRED"
  );
});

void test("extractOmieCustomerPayload: throws OMIE_CONNECTOR_EVENT_CUSTOMER_NAME_REQUIRED", () => {
  assert.throws(
    () =>
      extractOmieCustomerPayload({
        customer: { externalCode: "no-name", taxId: "00000000000000" }
      }),
    (error: unknown) =>
      error instanceof Error &&
      error.message === "OMIE_CONNECTOR_EVENT_CUSTOMER_NAME_REQUIRED"
  );
});

void test("extractOmieCustomerPayload: throws OMIE_CONNECTOR_EVENT_CUSTOMER_IDENTIFIER_REQUIRED", () => {
  assert.throws(
    () => extractOmieCustomerPayload({ customer: { legalName: "No ID Co" } }),
    (error: unknown) =>
      error instanceof Error &&
      error.message === "OMIE_CONNECTOR_EVENT_CUSTOMER_IDENTIFIER_REQUIRED"
  );
});

// ---------------------------------------------------------------------------
// extractOmieSalesOrderPayload — happy paths
// ---------------------------------------------------------------------------

void test("extractOmieSalesOrderPayload: canonical camelCase fields", () => {
  const result = extractOmieSalesOrderPayload({
    salesOrder: {
      customerIntegrationCode: "cust-001",
      integrationCode: "order-001",
      items: [
        { integrationCode: "item-1", productCode: 123, quantity: 2, taxScenarioItemCode: 9, unitPrice: 49.9 }
      ],
      stage: "10",
      taxScenarioCode: 1
    }
  });

  assert.ok(result);
  assert.equal(result.integrationCode, "order-001");
  assert.equal(result.customerIntegrationCode, "cust-001");
  assert.equal(result.taxScenarioCode, 1);
  assert.equal(result.items[0]?.productCode, 123);
  assert.equal(result.items[0]?.quantity, 2);
  assert.equal(result.stage, "10");
});

void test("extractOmieSalesOrderPayload: PT-BR alias codigo_pedido_integracao", () => {
  const result = extractOmieSalesOrderPayload({
    salesOrder: {
      codigo_cliente_integracao: "cli-001",
      codigo_pedido_integracao: "pedido-001",
      items: [{ productCode: 1, quantity: 1, taxScenarioItemCode: 1, unitPrice: 10 }],
      taxScenarioCode: 1
    }
  });

  assert.ok(result);
  assert.equal(result.integrationCode, "pedido-001");
  assert.equal(result.customerIntegrationCode, "cli-001");
});

void test("extractOmieSalesOrderPayload: itens alias for items", () => {
  const result = extractOmieSalesOrderPayload({
    salesOrder: {
      customerIntegrationCode: "cust-itens",
      itens: [
        { productCode: 77, quantidade: 3, taxScenarioItemCode: 2, valor_unitario: 29.9 }
      ],
      taxScenarioCode: 2
    }
  });

  assert.ok(result);
  assert.equal(result.items[0]?.productCode, 77);
  assert.equal(result.items[0]?.quantity, 3);
  assert.equal(result.items[0]?.unitPrice, 29.9);
});

void test("extractOmieSalesOrderPayload: fallback customerIntegrationCode from options", () => {
  const result = extractOmieSalesOrderPayload(
    {
      salesOrder: {
        integrationCode: "order-fb",
        items: [{ productCode: 5, quantity: 1, taxScenarioItemCode: 1, unitPrice: 5 }],
        taxScenarioCode: 1
      }
    },
    { fallbackCustomerIntegrationCode: "fallback-cust-001" }
  );

  assert.ok(result);
  assert.equal(result.customerIntegrationCode, "fallback-cust-001");
});

void test("extractOmieSalesOrderPayload: auto-generates item integrationCode when absent", () => {
  const result = extractOmieSalesOrderPayload({
    salesOrder: {
      customerIntegrationCode: "cust-auto",
      integrationCode: "order-auto",
      items: [{ productCode: 3, quantity: 1, taxScenarioItemCode: 1, unitPrice: 15 }],
      taxScenarioCode: 1
    }
  });

  assert.ok(result);
  assert.equal(result.items[0]?.integrationCode, "order-auto:1");
});

void test("extractOmieSalesOrderPayload: detects flat payload via hasSalesOrderFields", () => {
  const result = extractOmieSalesOrderPayload({
    customerIntegrationCode: "cust-flat",
    integrationCode: "flat-order-001",
    items: [{ productCode: 8, quantity: 1, taxScenarioItemCode: 1, unitPrice: 99 }],
    taxScenarioCode: 3
  });

  assert.ok(result);
  assert.equal(result.integrationCode, "flat-order-001");
});

void test("extractOmieSalesOrderPayload: returns undefined when absent and not required", () => {
  assert.equal(extractOmieSalesOrderPayload({ unrelated: "value" }), undefined);
});

// ---------------------------------------------------------------------------
// extractOmieSalesOrderPayload — validation errors
// ---------------------------------------------------------------------------

void test("extractOmieSalesOrderPayload: throws when required and absent", () => {
  assert.throws(
    () => extractOmieSalesOrderPayload({ unrelated: "value" }, { required: true }),
    (error: unknown) =>
      error instanceof Error &&
      error.message === "OMIE_CONNECTOR_EVENT_SALES_ORDER_ITEMS_REQUIRED"
  );
});

void test("extractOmieSalesOrderPayload: throws OMIE_CONNECTOR_EVENT_SALES_ORDER_CUSTOMER_REQUIRED", () => {
  assert.throws(
    () =>
      extractOmieSalesOrderPayload({
        salesOrder: {
          integrationCode: "order-no-cust",
          items: [{ productCode: 1, quantity: 1, taxScenarioItemCode: 1, unitPrice: 1 }],
          taxScenarioCode: 1
        }
      }),
    (error: unknown) =>
      error instanceof Error &&
      error.message === "OMIE_CONNECTOR_EVENT_SALES_ORDER_CUSTOMER_REQUIRED"
  );
});

void test("extractOmieSalesOrderPayload: throws OMIE_CONNECTOR_EVENT_SALES_ORDER_ITEMS_REQUIRED when items empty", () => {
  assert.throws(
    () =>
      extractOmieSalesOrderPayload({
        salesOrder: {
          customerIntegrationCode: "cust-no-items",
          integrationCode: "order-no-items",
          items: [],
          taxScenarioCode: 1
        }
      }),
    (error: unknown) =>
      error instanceof Error &&
      error.message === "OMIE_CONNECTOR_EVENT_SALES_ORDER_ITEMS_REQUIRED"
  );
});

void test("extractOmieSalesOrderPayload: throws OMIE_CONNECTOR_EVENT_SALES_ORDER_TAX_SCENARIO_REQUIRED", () => {
  assert.throws(
    () =>
      extractOmieSalesOrderPayload({
        salesOrder: {
          customerIntegrationCode: "cust-no-tax",
          integrationCode: "order-no-tax",
          items: [{ productCode: 1, quantity: 1, taxScenarioItemCode: 1, unitPrice: 1 }]
        }
      }),
    (error: unknown) =>
      error instanceof Error &&
      error.message === "OMIE_CONNECTOR_EVENT_SALES_ORDER_TAX_SCENARIO_REQUIRED"
  );
});
