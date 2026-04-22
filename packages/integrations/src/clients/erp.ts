// packages/integrations/src/clients/erp.ts
import { postJson, getJson } from "./http.js";
import { withCircuitBreaker } from "./circuit-breaker.js";

// ─────────────────────────────────────────────
// CONTA AZUL
// ─────────────────────────────────────────────

const caPostCb = withCircuitBreaker(
  "conta-azul:api",
  (url: string, token: string, payload: Record<string, unknown>) =>
    postJson(url, payload, { apiKey: token, timeoutMs: 12_000, retries: 2 }),
);

const caGetCb = withCircuitBreaker(
  "conta-azul:api:get",
  (url: string, token: string) =>
    getJson(url, { apiKey: token, timeoutMs: 12_000, retries: 2 }),
);

export interface ContaAzulCustomer {
  person_type: "F" | "J"; // F=Fisica, J=Juridica
  company_name?: string;
  name: string;
  email: string;
  document?: string; // CPF or CNPJ
  phone_number?: string;
}

export interface ContaAzulSale {
  customer_id: string;
  items: Array<{ product_or_service_id: string; quantity: number; value: number }>;
  issue_date: string; // YYYY-MM-DD
  notes?: string;
}

export class ContaAzulClient {
  constructor(
    private readonly accessToken: string,
    private readonly baseUrl = "https://api.contaazul.com/v1",
  ) {}

  /** Create a customer */
  createCustomer(customer: ContaAzulCustomer) {
    return caPostCb(`${this.baseUrl}/customers`, this.accessToken, { ...customer });
  }

  /** List customers */
  listCustomers(page = 1, size = 50) {
    return caGetCb(`${this.baseUrl}/customers?page=${page}&size=${size}`, this.accessToken);
  }

  /** Create a sale */
  createSale(sale: ContaAzulSale) {
    return caPostCb(`${this.baseUrl}/sales`, this.accessToken, { ...sale });
  }

  /** List invoices (notas fiscais) */
  listInvoices(page = 1) {
    return caGetCb(`${this.baseUrl}/invoices?page=${page}`, this.accessToken);
  }

  /** Get financial summary */
  getFinancialSummary(startDate: string, endDate: string) {
    return caGetCb(
      `${this.baseUrl}/financial-movements?startDate=${startDate}&endDate=${endDate}`,
      this.accessToken,
    );
  }

  /** Create a receivable */
  createReceivable(payload: {
    customer_id: string;
    description: string;
    amount: number;
    due_date: string;
  }) {
    return caPostCb(`${this.baseUrl}/receivables`, this.accessToken, payload);
  }
}

// ─────────────────────────────────────────────
// SANKHYA
// ─────────────────────────────────────────────

export class SankhyaClient {
  private sessionId: string | null = null;

  constructor(
    private readonly username: string,
    private readonly password: string,
    private readonly appKey: string,
    private readonly baseUrl = "https://api.sankhya.com.br/gateway/v1",
  ) {}

  /** Login and acquire session */
  async login(): Promise<void> {
    const res = await postJson<{ bearerToken: string }>(
      `${this.baseUrl}/mge/service.sbr?serviceName=MobileLoginSP.login&outputType=json`,
      {
        serviceName: "MobileLoginSP.login",
        requestBody: {
          NOMUSU: { $: this.username },
          INTERNO: { $: this.password },
          NUNFEMP: { $: "1" },
        },
      },
      { headers: { "AppKey": this.appKey }, timeoutMs: 15_000, retries: 1 },
    );
    this.sessionId = res.bearerToken;
  }

  private async ensureSession(): Promise<string> {
    if (!this.sessionId) await this.login();
    return this.sessionId!;
  }

  /** Execute a Sankhya CRUD operation */
  async loadRecords(entityName: string, fields: string[], criteria?: string) {
    const token = await this.ensureSession();
    return postJson(
      `${this.baseUrl}/mge/service.sbr?serviceName=CRUDServiceProvider.loadRecords&outputType=json`,
      {
        serviceName: "CRUDServiceProvider.loadRecords",
        requestBody: {
          dataSet: {
            rootEntity: entityName,
            includePresentationFields: "S",
            criteria: criteria ? { expression: { $: criteria } } : undefined,
            entity: {
              fieldset: {
                list: fields.map((f) => ({ $: f })),
              },
            },
          },
        },
      },
      { headers: { Cookie: `JSESSIONID=${token}`, AppKey: this.appKey }, timeoutMs: 15_000, retries: 2 },
    );
  }

  /** Save (create/update) a record */
  async saveRecord(entityName: string, fields: Record<string, unknown>, pk?: Record<string, unknown>) {
    const token = await this.ensureSession();
    return postJson(
      `${this.baseUrl}/mge/service.sbr?serviceName=CRUDServiceProvider.saveRecord&outputType=json`,
      {
        serviceName: "CRUDServiceProvider.saveRecord",
        requestBody: {
          dataSet: {
            rootEntity: entityName,
            dataRow: { localFields: { field: Object.entries(fields).map(([name, value]) => ({ $: { name }, _: value })) } },
            ...(pk ? { pk } : {}),
          },
        },
      },
      { headers: { Cookie: `JSESSIONID=${token}`, AppKey: this.appKey }, timeoutMs: 15_000, retries: 2 },
    );
  }
}

// ─────────────────────────────────────────────
// BLING
// ─────────────────────────────────────────────

const blingGetCb = withCircuitBreaker(
  "bling:api:get",
  (url: string, token: string) =>
    getJson(url, { headers: { Authorization: `Bearer ${token}` }, timeoutMs: 12_000, retries: 2 }),
);

const blingPostCb = withCircuitBreaker(
  "bling:api",
  (url: string, token: string, payload: Record<string, unknown>) =>
    postJson(url, payload, {
      headers: { Authorization: `Bearer ${token}` },
      timeoutMs: 12_000,
      retries: 2,
    }),
);

export interface BlingProduct {
  nome: string;
  preco: number;
  codigo?: string;
  descricao?: string;
  estoque?: number;
}

export interface BlingOrder {
  clienteId: number;
  items: Array<{ produtoId: number; quantidade: number; preco: number }>;
  transportadoraId?: number;
  observacoes?: string;
}

export class BlingClient {
  constructor(
    private readonly accessToken: string,
    private readonly baseUrl = "https://www.bling.com.br/Api/v3",
  ) {}

  /** List products */
  listProducts(page = 1, limit = 100) {
    return blingGetCb(`${this.baseUrl}/produtos?pagina=${page}&limite=${limit}`, this.accessToken);
  }

  /** Create a product */
  createProduct(product: BlingProduct) {
    return blingPostCb(`${this.baseUrl}/produtos`, this.accessToken, { ...product });
  }

  /** List contacts (customers) */
  listContacts(page = 1) {
    return blingGetCb(`${this.baseUrl}/contatos?pagina=${page}`, this.accessToken);
  }

  /** Create a contact */
  createContact(contact: { nome: string; email?: string; cnpj?: string; ie?: string; tipoPessoa?: "F" | "J" }) {
    return blingPostCb(`${this.baseUrl}/contatos`, this.accessToken, contact);
  }

  /** List orders (pedidos) */
  listOrders(page = 1) {
    return blingGetCb(`${this.baseUrl}/pedidos/vendas?pagina=${page}`, this.accessToken);
  }

  /** Create an order */
  createOrder(order: BlingOrder) {
    return blingPostCb(`${this.baseUrl}/pedidos/vendas`, this.accessToken, { ...order });
  }

  /** Get stock for a product */
  getStock(productId: string) {
    return blingGetCb(`${this.baseUrl}/estoques/${productId}`, this.accessToken);
  }
}

// ─────────────────────────────────────────────
// TINY ERP
// ─────────────────────────────────────────────

const tinyPostCb = withCircuitBreaker(
  "tiny:api",
  (url: string, token: string, payload: Record<string, unknown>) =>
    postJson(url, payload, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      timeoutMs: 12_000,
      retries: 2,
    }),
);

export class TinyERPClient {
  constructor(
    private readonly apiToken: string,
    private readonly baseUrl = "https://api.tiny.com.br/api2",
  ) {}

  /** Raw API request helper */
  private async request<T>(action: string, params: Record<string, unknown>): Promise<T> {
    const body = new URLSearchParams({
      token: this.apiToken,
      formato: "json",
      ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, JSON.stringify(v)])),
    });
    return tinyPostCb(`${this.baseUrl}/${action}.php`, this.apiToken, Object.fromEntries(body)) as Promise<T>;
  }

  /** List products */
  listProducts(searchTerm?: string) {
    return this.request("produtos.pesquisa", searchTerm ? { pesquisa: searchTerm } : {});
  }

  /** List orders */
  listOrders(situacao?: string) {
    return this.request("pedidos.pesquisa", situacao ? { situacao } : {});
  }

  /** List contacts */
  listContacts(searchTerm?: string) {
    return this.request("contatos.pesquisa", searchTerm ? { pesquisa: searchTerm } : {});
  }

  /** Create a contact */
  createContact(contact: { nome: string; cpfCnpj?: string; email?: string; fone?: string }) {
    return this.request("contato.incluir", { contato: contact });
  }

  /** Emit a nota fiscal (NF-e) */
  emitNFe(nfe: Record<string, unknown>) {
    return this.request("nota.incluir", { nota: nfe });
  }
}

// ─────────────────────────────────────────────
// TOTVS FLUIG / RM / PROTHEUS
// ─────────────────────────────────────────────

const totvsGetCb = withCircuitBreaker(
  "totvs:api:get",
  (url: string, basicAuth: string) =>
    getJson(url, {
      headers: { Authorization: `Basic ${basicAuth}`, "X-TOTVS-License-Alias": "" },
      timeoutMs: 20_000,
      retries: 2,
    }),
);

const totvsPostCb = withCircuitBreaker(
  "totvs:api",
  (url: string, basicAuth: string, payload: Record<string, unknown>) =>
    postJson(url, payload, {
      headers: { Authorization: `Basic ${basicAuth}`, "X-TOTVS-License-Alias": "" },
      timeoutMs: 20_000,
      retries: 2,
    }),
);

export class TotvsClient {
  private readonly basicAuth: string;

  constructor(
    username: string,
    password: string,
    private readonly baseUrl: string, // e.g. https://yourcompany.totvs.app/api/framework/v1
  ) {
    this.basicAuth = Buffer.from(`${username}:${password}`).toString("base64");
  }

  /** Get TOTVS REST API resources (Protheus) */
  getResource(path: string) {
    return totvsGetCb(`${this.baseUrl}${path}`, this.basicAuth);
  }

  /** Post to a TOTVS REST API endpoint */
  postResource(path: string, payload: Record<string, unknown>) {
    return totvsPostCb(`${this.baseUrl}${path}`, this.basicAuth, payload);
  }

  /** Get customers (TOTVS Protheus: /api/mrp/v1/customers) */
  listCustomers(page = 1, pageSize = 50) {
    return this.getResource(`/customers?page=${page}&pageSize=${pageSize}`);
  }

  /** Get financial titles (Protheus FINA050) */
  listFinancialTitles(params: { startDate?: string; endDate?: string } = {}) {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return this.getResource(`/financialtitles${qs ? "?" + qs : ""}`);
  }

  /** Create a sales order */
  createSalesOrder(order: Record<string, unknown>) {
    return this.postResource("/salesorders", order);
  }
}
