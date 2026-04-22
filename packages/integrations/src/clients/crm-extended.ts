// packages/integrations/src/clients/crm-extended.ts
import { postJson, getJson } from "./http.js";
import { withCircuitBreaker } from "./circuit-breaker.js";

// ─────────────────────────────────────────────
// RD STATION CRM
// ─────────────────────────────────────────────

const rdsCrmPostCb = withCircuitBreaker(
  "rdstation-crm:api",
  (url: string, token: string, payload: Record<string, unknown>) =>
    postJson(url, payload, { apiKey: token, timeoutMs: 12_000, retries: 2 }),
);

const rdsCrmGetCb = withCircuitBreaker(
  "rdstation-crm:api:get",
  (url: string, token: string) =>
    getJson(url, { apiKey: token, timeoutMs: 12_000, retries: 2 }),
);

export interface RDStationCRMDeal {
  name: string;
  amount?: number;
  win?: boolean;
  userId?: string;
  contactId?: string;
  campaignId?: string;
  customFields?: Record<string, unknown>;
}

export interface RDStationCRMContact {
  name: string;
  email?: string;
  phone?: string;
  title?: string;
  organization?: string;
}

export class RDStationCRMClient {
  constructor(
    private readonly apiKey: string,
    private readonly baseUrl = "https://crm.rdstation.com/api/v1",
  ) {}

  /** Create a contact */
  createContact(contact: RDStationCRMContact) {
    return rdsCrmPostCb(`${this.baseUrl}/contacts`, this.apiKey, { contact });
  }

  /** List deals (negócios) with optional filters */
  listDeals(params: { page?: number; limit?: number; userId?: string } = {}) {
    const qs = new URLSearchParams({
      token: this.apiKey,
      page: String(params.page ?? 1),
      limit: String(params.limit ?? 50),
      ...(params.userId ? { user_id: params.userId } : {}),
    });
    return rdsCrmGetCb(`${this.baseUrl}/deals?${qs}`, this.apiKey);
  }

  /** Create a deal */
  createDeal(deal: RDStationCRMDeal) {
    return rdsCrmPostCb(`${this.baseUrl}/deals`, this.apiKey, { deal });
  }

  /** Create an activity (task) linked to a deal */
  createActivity(dealId: string, subject: string, type: string, dueDate: string) {
    return rdsCrmPostCb(`${this.baseUrl}/activities`, this.apiKey, {
      activity: { deal_id: dealId, subject, type, due_date: dueDate },
    });
  }

  /** List all pipelines */
  listPipelines() {
    return rdsCrmGetCb(`${this.baseUrl}/pipelines?token=${this.apiKey}`, this.apiKey);
  }
}

// ─────────────────────────────────────────────
// AGENDOR
// ─────────────────────────────────────────────

const agendorGetCb = withCircuitBreaker(
  "agendor:api:get",
  (url: string, token: string) =>
    getJson(url, { headers: { Authorization: `Token ${token}` }, timeoutMs: 12_000, retries: 2 }),
);

const agendorPostCb = withCircuitBreaker(
  "agendor:api",
  (url: string, token: string, payload: Record<string, unknown>) =>
    postJson(url, payload, {
      headers: { Authorization: `Token ${token}` },
      timeoutMs: 12_000,
      retries: 2,
    }),
);

export interface AgendorPerson {
  name: string;
  email?: string;
  cpf?: string;
  role?: string;
  phones?: string[];
  organizationId?: number;
}

export interface AgendorDeal {
  title: string;
  value?: number;
  personId?: number;
  organizationId?: number;
  funnelId?: number;
  stageId?: number;
  dealStatusText?: string;
}

export class AgendorClient {
  constructor(
    private readonly apiToken: string,
    private readonly baseUrl = "https://api.agendor.com.br/v3",
  ) {}

  /** List people (contacts) */
  listPeople(page = 1, perPage = 50) {
    return agendorGetCb(
      `${this.baseUrl}/people?page=${page}&per_page=${perPage}`,
      this.apiToken,
    );
  }

  /** Create a person */
  createPerson(person: AgendorPerson) {
    return agendorPostCb(`${this.baseUrl}/people`, this.apiToken, { ...person });
  }

  /** List deals */
  listDeals(funnelId?: string) {
    const qs = funnelId ? `?funnel_id=${funnelId}` : "";
    return agendorGetCb(`${this.baseUrl}/deals${qs}`, this.apiToken);
  }

  /** Create a deal */
  createDeal(deal: AgendorDeal) {
    return agendorPostCb(`${this.baseUrl}/deals`, this.apiToken, { ...deal });
  }

  /** Create a note on a deal */
  createNote(dealId: string, text: string) {
    return agendorPostCb(`${this.baseUrl}/deals/${dealId}/notes`, this.apiToken, {
      text,
    });
  }

  /** List organizations (companies) */
  listOrganizations(page = 1) {
    return agendorGetCb(`${this.baseUrl}/organizations?page=${page}`, this.apiToken);
  }
}

// ─────────────────────────────────────────────
// EXACT SALES (ExactSales / Exact Spotter)
// ─────────────────────────────────────────────

const exactPostCb = withCircuitBreaker(
  "exact-sales:api",
  (url: string, token: string, payload: Record<string, unknown>) =>
    postJson(url, payload, { apiKey: token, timeoutMs: 12_000, retries: 2 }),
);

const exactGetCb = withCircuitBreaker(
  "exact-sales:api:get",
  (url: string, token: string) =>
    getJson(url, { apiKey: token, timeoutMs: 12_000, retries: 2 }),
);

export interface ExactSalesLead {
  nome: string;
  email: string;
  telefone?: string;
  empresa?: string;
  cargo?: string;
  origemLead?: string;
  camposPersonalizados?: Record<string, unknown>;
}

export class ExactSalesClient {
  constructor(
    private readonly apiKey: string,
    private readonly baseUrl = "https://api.exactsales.com.br/v2",
  ) {}

  /** Create a new lead for prospecting qualification */
  createLead(lead: ExactSalesLead) {
    return exactPostCb(`${this.baseUrl}/leads`, this.apiKey, { ...lead });
  }

  /** Get lead by id */
  getLead(leadId: string) {
    return exactGetCb(`${this.baseUrl}/leads/${leadId}`, this.apiKey);
  }

  /** List leads with filters */
  listLeads(params: { page?: number; status?: string } = {}) {
    const qs = new URLSearchParams({
      page: String(params.page ?? 1),
      ...(params.status ? { status: params.status } : {}),
    });
    return exactGetCb(`${this.baseUrl}/leads?${qs}`, this.apiKey);
  }

  /** Update lead status/stage */
  updateLeadStatus(leadId: string, status: string, notes?: string) {
    return postJson(`${this.baseUrl}/leads/${leadId}`, {
      status,
      observacoes: notes,
    }, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
      timeoutMs: 12_000,
      retries: 2,
    });
  }
}
