import type {
  OmieCustomerUpsertInput,
  OmieSalesOrderCreateInput
} from "@birthub/integrations/omie-erp-adapter";

function readObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function readNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

function readNestedString(input: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const direct = readString(input[key]);
    if (direct) {
      return direct;
    }
  }

  const properties = readObject(input.properties);
  if (!properties) {
    return undefined;
  }

  for (const key of keys) {
    const nested = readString(properties[key]);
    if (nested) {
      return nested;
    }
  }

  return undefined;
}

function readNestedNumber(input: Record<string, unknown>, keys: string[]): number | undefined {
  for (const key of keys) {
    const direct = readNumber(input[key]);
    if (direct !== undefined) {
      return direct;
    }
  }

  const properties = readObject(input.properties);
  if (!properties) {
    return undefined;
  }

  for (const key of keys) {
    const nested = readNumber(properties[key]);
    if (nested !== undefined) {
      return nested;
    }
  }

  return undefined;
}

function compactRecord<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => {
      if (entry === undefined || entry === null) {
        return false;
      }

      if (typeof entry === "string") {
        return entry.trim().length > 0;
      }

      if (Array.isArray(entry)) {
        return entry.length > 0;
      }

      if (typeof entry === "object") {
        return Object.keys(entry).length > 0;
      }

      return true;
    })
  ) as T;
}

function hasCustomerFields(input: Record<string, unknown>): boolean {
  return (
    !!readNestedString(input, ["externalCode", "integrationCode", "codigo_cliente_integracao"]) ||
    !!readNestedString(input, ["taxId", "cnpj_cpf", "cpfCnpj", "document"]) ||
    !!readNestedString(input, ["legalName", "razao_social", "name", "nome"])
  );
}

function hasSalesOrderFields(input: Record<string, unknown>): boolean {
  return (
    Array.isArray(input.items) ||
    Array.isArray(input.itens) ||
    !!readNestedString(input, ["integrationCode", "codigo_pedido_integracao", "externalCode"])
  );
}

function resolveCustomerSource(payload: Record<string, unknown>): Record<string, unknown> | null {
  return readObject(payload.customer) ?? readObject(payload.cliente) ?? (hasCustomerFields(payload) ? payload : null);
}

function resolveSalesOrderSource(payload: Record<string, unknown>): Record<string, unknown> | null {
  return (
    readObject(payload.salesOrder) ??
    readObject(payload.order) ??
    readObject(payload.pedido) ??
    (hasSalesOrderFields(payload) ? payload : null)
  );
}

function normalizeCustomerAddress(input: Record<string, unknown>): OmieCustomerUpsertInput["address"] | undefined {
  const addressSource = readObject(input.address) ?? readObject(input.endereco) ?? input;

  return compactRecord({
    city: readNestedString(addressSource, ["city", "cidade"]),
    complement: readNestedString(addressSource, ["complement", "complemento"]),
    countryCode: readNestedString(addressSource, ["countryCode", "codigo_pais"]),
    district: readNestedString(addressSource, ["district", "bairro"]),
    number: readNestedString(addressSource, ["number", "numero", "endereco_numero"]),
    state: readNestedString(addressSource, ["state", "estado", "uf"]),
    street: readNestedString(addressSource, ["street", "endereco", "logradouro"]),
    zipCode: readNestedString(addressSource, ["zipCode", "cep"])
  });
}

function normalizeCustomer(source: Record<string, unknown>): OmieCustomerUpsertInput {
  const externalCode = readNestedString(source, [
    "externalCode",
    "integrationCode",
    "codigo_cliente_integracao"
  ]);
  const legalName = readNestedString(source, ["legalName", "razao_social", "name", "nome"]);
  const taxId = readNestedString(source, ["taxId", "cnpj_cpf", "cpfCnpj", "document"]);

  if (!legalName) {
    throw new Error("OMIE_CONNECTOR_EVENT_CUSTOMER_NAME_REQUIRED");
  }

  if (!externalCode && !taxId) {
    throw new Error("OMIE_CONNECTOR_EVENT_CUSTOMER_IDENTIFIER_REQUIRED");
  }

  return compactRecord({
    address: normalizeCustomerAddress(source),
    contactName: readNestedString(source, ["contactName", "contato", "contact"]),
    email: readNestedString(source, ["email"]),
    externalCode,
    legalName,
    phone: readNestedString(source, ["phone", "telefone", "mobilePhone"]),
    taxId,
    tradeName: readNestedString(source, ["tradeName", "nome_fantasia", "fantasyName"])
  });
}

function normalizeSalesOrder(
  source: Record<string, unknown>,
  input: {
    fallbackCustomerCode?: string | undefined;
    fallbackCustomerIntegrationCode?: string | undefined;
  }
): OmieSalesOrderCreateInput {
  const integrationCode = readNestedString(source, [
    "integrationCode",
    "codigo_pedido_integracao",
    "externalCode"
  ]);
  const customerCode =
    readNestedNumber(source, ["customerCode", "codigo_cliente"]) ??
    readNumber(input.fallbackCustomerCode);
  const customerIntegrationCode =
    readNestedString(source, [
      "customerIntegrationCode",
      "codigo_cliente_integracao",
      "customerExternalCode",
      "clientIntegrationCode"
    ]) ?? input.fallbackCustomerIntegrationCode;
  const taxScenarioCode = readNestedNumber(source, [
    "taxScenarioCode",
    "codigo_cenario_impostos",
    "taxScenario"
  ]);
  const itemsSource = Array.isArray(source.items)
    ? source.items
    : Array.isArray(source.itens)
      ? source.itens
      : [];

  if (customerCode === undefined && !customerIntegrationCode) {
    throw new Error("OMIE_CONNECTOR_EVENT_SALES_ORDER_CUSTOMER_REQUIRED");
  }

  if (itemsSource.length === 0) {
    throw new Error("OMIE_CONNECTOR_EVENT_SALES_ORDER_ITEMS_REQUIRED");
  }

  if (taxScenarioCode === undefined) {
    throw new Error("OMIE_CONNECTOR_EVENT_SALES_ORDER_TAX_SCENARIO_REQUIRED");
  }

  return compactRecord({
    ...(customerCode !== undefined ? { customerCode } : { customerIntegrationCode }),
    forecastDate: readNestedString(source, ["forecastDate", "data_previsao", "expectedDate"]),
    installmentCode: readNestedString(source, ["installmentCode", "codigo_parcela"]),
    integrationCode,
    items: itemsSource.map((entry, index) => {
      const item = readObject(entry) ?? {};

      return compactRecord({
        cfop: readNestedString(item, ["cfop"]),
        integrationCode:
          readNestedString(item, [
            "integrationCode",
            "codigo_item_integracao",
            "externalCode"
          ]) ?? `${integrationCode ?? "omie-item"}:${index + 1}`,
        productCode: readNestedNumber(item, ["productCode", "codigo_produto", "productId"]),
        quantity: readNestedNumber(item, ["quantity", "quantidade"]) ?? 1,
        taxScenarioItemCode:
          readNestedNumber(item, [
            "taxScenarioItemCode",
            "codigo_cenario_impostos_item"
          ]) ?? taxScenarioCode,
        unitPrice: readNestedNumber(item, ["unitPrice", "valor_unitario", "price"]) ?? 0
      });
    }),
    stage: readNestedString(source, ["stage", "etapa"]),
    taxScenarioCode
  });
}

export function extractOmieCustomerPayload(
  payload: Record<string, unknown>,
  options: {
    required?: boolean | undefined;
  } = {}
): OmieCustomerUpsertInput | undefined {
  const source = resolveCustomerSource(payload);

  if (!source) {
    if (options.required) {
      throw new Error("OMIE_CONNECTOR_EVENT_CUSTOMER_REQUIRED");
    }

    return undefined;
  }

  return normalizeCustomer(source);
}

export function extractOmieSalesOrderPayload(
  payload: Record<string, unknown>,
  options: {
    fallbackCustomerCode?: string | undefined;
    fallbackCustomerIntegrationCode?: string | undefined;
    required?: boolean | undefined;
  } = {}
): OmieSalesOrderCreateInput | undefined {
  const source = resolveSalesOrderSource(payload);

  if (!source) {
    if (options.required) {
      throw new Error("OMIE_CONNECTOR_EVENT_SALES_ORDER_ITEMS_REQUIRED");
    }

    return undefined;
  }

  return normalizeSalesOrder(source, {
    fallbackCustomerCode: options.fallbackCustomerCode,
    fallbackCustomerIntegrationCode: options.fallbackCustomerIntegrationCode
  });
}
