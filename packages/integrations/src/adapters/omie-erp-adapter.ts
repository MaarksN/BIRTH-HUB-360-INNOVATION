export interface OmieAdapterFetchResponse {
  json(): Promise<unknown>;
  ok: boolean;
  status: number;
  text(): Promise<string>;
}

export type OmieAdapterFetch = (
  input: string,
  init: {
    body?: string;
    headers: Record<string, string>;
    method: "POST";
    signal?: AbortSignal;
  }
) => Promise<OmieAdapterFetchResponse>;

export interface OmieErpAdapterOptions {
  appKey: string;
  appSecret: string;
  baseUrl?: string;
  fetchImpl?: OmieAdapterFetch;
  timeoutMs?: number;
}

export interface OmieCustomerAddressInput {
  city?: string | undefined;
  complement?: string | undefined;
  countryCode?: string | undefined;
  district?: string | undefined;
  number?: string | undefined;
  state?: string | undefined;
  street?: string | undefined;
  zipCode?: string | undefined;
}

export interface OmieCustomerUpsertInput {
  address?: OmieCustomerAddressInput | undefined;
  contactName?: string | undefined;
  email?: string | undefined;
  externalCode?: string | undefined;
  legalName: string;
  phone?: string | undefined;
  taxId?: string | undefined;
  tradeName?: string | undefined;
}

export interface OmieSalesOrderItemInput {
  cfop?: string | undefined;
  integrationCode?: string | undefined;
  productCode: number;
  quantity: number;
  taxScenarioItemCode: number;
  unitPrice: number;
}

export interface OmieSalesOrderCreateInput {
  customerCode?: number | undefined;
  customerIntegrationCode?: string | undefined;
  forecastDate?: string | undefined;
  installmentCode?: string | undefined;
  integrationCode: string;
  items: OmieSalesOrderItemInput[];
  stage?: string | undefined;
  taxScenarioCode: number;
}

export interface OmieErpAdapterResponse {
  body: unknown;
  bodyText: string;
  externalId: string | null;
  request: {
    call: string;
    method: "POST";
    path: string;
    payload: Record<string, unknown>;
  };
  status: number;
}

export class OmieApiError extends Error {
  readonly code: string;
  readonly responseBody?: string | undefined;
  readonly retryable: boolean;
  readonly statusCode?: number | undefined;

  constructor(input: {
    code: string;
    message: string;
    responseBody?: string | undefined;
    retryable: boolean;
    statusCode?: number | undefined;
  }) {
    super(input.message);
    this.name = "OmieApiError";
    this.code = input.code;
    this.responseBody = input.responseBody;
    this.retryable = input.retryable;
    this.statusCode = input.statusCode;
  }
}

export class OmieRateLimitError extends OmieApiError {
  constructor(message = "Omie API rate limit reached.", responseBody?: string) {
    super({
      code: "OMIE_RATE_LIMIT",
      message,
      responseBody,
      retryable: true,
      statusCode: 429
    });
    this.name = "OmieRateLimitError";
  }
}

export class OmieTimeoutError extends OmieApiError {
  constructor(message = "Omie API request timed out.") {
    super({
      code: "OMIE_TIMEOUT",
      message,
      retryable: true,
      statusCode: 504
    });
    this.name = "OmieTimeoutError";
  }
}

function readObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function readNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function readIdentifier(value: unknown): string | null {
  const fromString = readString(value);
  if (fromString) {
    return fromString;
  }

  const fromNumber = readNumber(value);
  return fromNumber !== null ? String(fromNumber) : null;
}

function removeEmptyProperties(input: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => {
      if (value === undefined || value === null) {
        return false;
      }

      if (typeof value === "string") {
        return value.trim().length > 0;
      }

      if (Array.isArray(value)) {
        return value.length > 0;
      }

      return true;
    })
  );
}

function splitPhone(value: string | undefined): {
  ddd?: string | undefined;
  number?: string | undefined;
} {
  const digits = value?.replace(/\D+/g, "") ?? "";
  if (!digits) {
    return {};
  }

  if (digits.length <= 2) {
    return {
      number: digits
    };
  }

  return {
    ddd: digits.slice(0, 2),
    number: digits.slice(2)
  };
}

function formatOmieDate(value?: string): string {
  const candidate = value?.trim();
  if (!candidate) {
    return formatOmieDate(new Date().toISOString());
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(candidate)) {
    return candidate;
  }

  const parsed = new Date(candidate);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("OMIE_SALES_ORDER_FORECAST_DATE_INVALID");
  }

  const day = String(parsed.getUTCDate()).padStart(2, "0");
  const month = String(parsed.getUTCMonth() + 1).padStart(2, "0");
  const year = String(parsed.getUTCFullYear());
  return `${day}/${month}/${year}`;
}

function parseOmieFault(body: unknown): {
  code?: string | undefined;
  message: string;
} | null {
  const parsed = readObject(body);
  if (!parsed) {
    return null;
  }

  const message =
    readString(parsed.faultstring) ??
    readString(parsed.error_description) ??
    readString(parsed.error) ??
    readString(parsed.message);
  if (!message) {
    return null;
  }

  return {
    ...(readString(parsed.faultcode) ?? readString(parsed.code)
      ? {
          code: readString(parsed.faultcode) ?? readString(parsed.code) ?? undefined
        }
      : {}),
    message
  };
}

function buildOmieApiError(input: {
  fault?: {
    code?: string | undefined;
    message: string;
  } | null;
  responseBody: string;
  status: number;
}): OmieApiError {
  const combined = `${input.fault?.code ?? ""} ${input.fault?.message ?? input.responseBody}`.toLowerCase();
  const status = input.status;

  if (status === 429 || combined.includes("rate limit")) {
    return new OmieRateLimitError(undefined, input.responseBody);
  }

  if (
    status === 401 ||
    status === 403 ||
    combined.includes("app_key") ||
    combined.includes("app_secret") ||
    combined.includes("autentic")
  ) {
    return new OmieApiError({
      code: "OMIE_AUTH_FAILED",
      message: input.fault
        ? `Omie authentication failed: ${input.fault.message}`
        : `Omie authentication failed with status ${status}.`,
      responseBody: input.responseBody,
      retryable: false,
      statusCode: status >= 400 ? status : 401
    });
  }

  if (status === 408 || combined.includes("timeout")) {
    return new OmieApiError({
      code: "OMIE_TIMEOUT",
      message: input.fault
        ? `Omie request timed out: ${input.fault.message}`
        : `Omie request timed out with status ${status}.`,
      responseBody: input.responseBody,
      retryable: true,
      statusCode: status >= 400 ? status : 504
    });
  }

  if (
    status >= 500 ||
    combined.includes("indispon") ||
    combined.includes("temporar") ||
    combined.includes("server")
  ) {
    return new OmieApiError({
      code: "OMIE_SERVER_ERROR",
      message: input.fault
        ? `Omie server error: ${input.fault.message}`
        : `Omie server error with status ${status}.`,
      responseBody: input.responseBody,
      retryable: true,
      statusCode: status >= 500 ? status : 503
    });
  }

  return new OmieApiError({
    code: "OMIE_REQUEST_FAILED",
    message: input.fault
      ? `Omie request failed: ${input.fault.message}`
      : `Omie request failed with status ${status}.`,
    responseBody: input.responseBody,
    retryable: false,
    statusCode: status >= 400 ? status : 400
  });
}

async function readResponseBody(response: OmieAdapterFetchResponse): Promise<{
  parsed: unknown;
  text: string;
}> {
  const text = await response.text();
  if (!text) {
    return {
      parsed: null,
      text
    };
  }

  try {
    return {
      parsed: JSON.parse(text) as unknown,
      text
    };
  } catch {
    return {
      parsed: text,
      text
    };
  }
}

function parseCustomerExternalId(body: unknown): string | null {
  const parsed = readObject(body);

  return (
    readIdentifier(parsed?.codigo_cliente_omie) ??
    readIdentifier(parsed?.codigo_cliente) ??
    readIdentifier(parsed?.codigo_cliente_integracao)
  );
}

function parseSalesOrderExternalId(body: unknown): string | null {
  const parsed = readObject(body);

  return (
    readIdentifier(parsed?.codigo_pedido) ??
    readIdentifier(parsed?.codigo_pedido_omie) ??
    readIdentifier(parsed?.codigo_pedido_integracao)
  );
}

export class OmieErpAdapter {
  private readonly baseUrl: string;
  private readonly fetchImpl: OmieAdapterFetch;
  private readonly timeoutMs: number;

  constructor(private readonly options: OmieErpAdapterOptions) {
    this.baseUrl = (options.baseUrl ?? "https://app.omie.com.br/api/v1").replace(/\/+$/, "");
    this.fetchImpl = options.fetchImpl ?? (fetch as unknown as OmieAdapterFetch);
    this.timeoutMs = options.timeoutMs ?? 10_000;
  }

  private async request(input: {
    call: string;
    parseExternalId: (body: unknown) => string | null;
    path: string;
    payload: Record<string, unknown>;
  }): Promise<OmieErpAdapterResponse> {
    const abortController = new AbortController();
    const timeout = setTimeout(() => abortController.abort(), this.timeoutMs);

    try {
      const requestBody = {
        app_key: this.options.appKey,
        app_secret: this.options.appSecret,
        call: input.call,
        param: [input.payload]
      };
      const response = await this.fetchImpl(`${this.baseUrl}${input.path}`, {
        body: JSON.stringify(requestBody),
        headers: {
          "content-type": "application/json; charset=utf-8",
          "user-agent": "birthub-integrations/1.0"
        },
        method: "POST",
        signal: abortController.signal
      });
      const body = await readResponseBody(response);
      const fault = parseOmieFault(body.parsed);

      if (response.status === 429) {
        throw new OmieRateLimitError(undefined, body.text);
      }

      if (!response.ok || fault) {
        throw buildOmieApiError({
          fault,
          responseBody: body.text,
          status: response.ok ? 400 : response.status
        });
      }

      return {
        body: body.parsed,
        bodyText: body.text,
        externalId: input.parseExternalId(body.parsed),
        request: {
          call: input.call,
          method: "POST",
          path: input.path,
          payload: input.payload
        },
        status: response.status
      };
    } catch (error) {
      if (error instanceof OmieApiError) {
        throw error;
      }

      if (error instanceof Error && error.name === "AbortError") {
        throw new OmieTimeoutError();
      }

      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  async validateCredentials(): Promise<OmieErpAdapterResponse> {
    return this.request({
      call: "ListarClientesResumido",
      parseExternalId: parseCustomerExternalId,
      path: "/geral/clientes/",
      payload: {
        apenas_importado_api: "N",
        pagina: 1,
        registros_por_pagina: 1
      }
    });
  }

  async upsertCustomer(input: OmieCustomerUpsertInput): Promise<OmieErpAdapterResponse> {
    const legalName = input.legalName.trim();
    if (!legalName) {
      throw new Error("OMIE_CUSTOMER_NAME_REQUIRED");
    }

    const externalCode = readString(input.externalCode);
    const taxId = readString(input.taxId);
    if (!externalCode && !taxId) {
      throw new Error("OMIE_CUSTOMER_EXTERNAL_CODE_OR_TAX_ID_REQUIRED");
    }

    const phone = splitPhone(input.phone);

    return this.request({
      call: taxId ? "UpsertClienteCpfCnpj" : "UpsertCliente",
      parseExternalId: parseCustomerExternalId,
      path: "/geral/clientes/",
      payload: removeEmptyProperties({
        bairro: input.address?.district,
        cep: input.address?.zipCode,
        cidade: input.address?.city,
        codigo_cliente_integracao: externalCode,
        codigo_pais: input.address?.countryCode,
        complemento: input.address?.complement,
        cnpj_cpf: taxId,
        contato: input.contactName,
        email: input.email,
        endereco: input.address?.street,
        endereco_numero: input.address?.number,
        estado: input.address?.state,
        nome_fantasia: readString(input.tradeName) ?? legalName,
        razao_social: legalName,
        telefone1_ddd: phone.ddd,
        telefone1_numero: phone.number
      })
    });
  }

  async createSalesOrder(input: OmieSalesOrderCreateInput): Promise<OmieErpAdapterResponse> {
    const integrationCode = input.integrationCode.trim();
    if (!integrationCode) {
      throw new Error("OMIE_SALES_ORDER_INTEGRATION_CODE_REQUIRED");
    }

    if (!Array.isArray(input.items) || input.items.length === 0) {
      throw new Error("OMIE_SALES_ORDER_ITEMS_REQUIRED");
    }

    if (
      readNumber(input.customerCode) === null &&
      !readString(input.customerIntegrationCode)
    ) {
      throw new Error("OMIE_SALES_ORDER_CUSTOMER_REQUIRED");
    }

    if (readNumber(input.taxScenarioCode) === null) {
      throw new Error("OMIE_SALES_ORDER_TAX_SCENARIO_REQUIRED");
    }

    const items = input.items.map((item, index) => {
      if (readNumber(item.productCode) === null) {
        throw new Error(`OMIE_SALES_ORDER_ITEM_PRODUCT_REQUIRED:${index}`);
      }

      if (readNumber(item.taxScenarioItemCode) === null) {
        throw new Error(`OMIE_SALES_ORDER_ITEM_TAX_SCENARIO_REQUIRED:${index}`);
      }

      return removeEmptyProperties({
        cfop: item.cfop,
        codigo_cenario_impostos_item: item.taxScenarioItemCode,
        codigo_item_integracao: item.integrationCode,
        codigo_produto: item.productCode,
        quantidade: item.quantity,
        valor_unitario: item.unitPrice
      });
    });

    return this.request({
      call: "AdicionarPedido",
      parseExternalId: parseSalesOrderExternalId,
      path: "/produtos/pedidovenda/",
      payload: removeEmptyProperties({
        ...(readNumber(input.customerCode) !== null
          ? { codigo_cliente: input.customerCode }
          : { codigo_cliente_integracao: input.customerIntegrationCode }),
        codigo_cenario_impostos: input.taxScenarioCode,
        codigo_parcela: readString(input.installmentCode) ?? "000",
        codigo_pedido_integracao: integrationCode,
        data_previsao: formatOmieDate(input.forecastDate),
        etapa: readString(input.stage) ?? "10",
        itens: items
      })
    });
  }
}
