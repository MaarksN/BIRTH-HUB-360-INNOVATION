// packages/integrations/src/clients/customer-success.ts
import { postJson, getJson } from "./http.js";
import { withCircuitBreaker } from "./circuit-breaker.js";

// ─────────────────────────────────────────────
// SENSEDATA
// ─────────────────────────────────────────────

const senseGetCb = withCircuitBreaker(
  "sensedata:api:get",
  (url: string, token: string) =>
    getJson(url, { apiKey: token, timeoutMs: 12_000, retries: 2 }),
);

const sensePostCb = withCircuitBreaker(
  "sensedata:api",
  (url: string, token: string, payload: Record<string, unknown>) =>
    postJson(url, payload, { apiKey: token, timeoutMs: 12_000, retries: 2 }),
);

export interface SenseDataCustomer {
  externalId: string;
  name: string;
  email?: string;
  healthScore?: number;
  plan?: string;
  mrr?: number;
  tags?: string[];
  customFields?: Record<string, unknown>;
}

export class SenseDataClient {
  constructor(
    private readonly apiToken: string,
    private readonly baseUrl = "https://api.sensedata.io/v2",
  ) {}

  /** Upsert a customer (account) */
  upsertCustomer(customer: SenseDataCustomer) {
    return sensePostCb(`${this.baseUrl}/customers`, this.apiToken, { ...customer });
  }

  /** Update health score for a customer */
  updateHealthScore(externalId: string, score: number, reason?: string) {
    return sensePostCb(`${this.baseUrl}/customers/${externalId}/health-score`, this.apiToken, {
      score,
      reason,
      date: new Date().toISOString(),
    });
  }

  /** Create a CS touch point (interaction) */
  createTouchpoint(externalId: string, type: string, description: string, metadata: Record<string, unknown> = {}) {
    return sensePostCb(`${this.baseUrl}/customers/${externalId}/touchpoints`, this.apiToken, {
      type,
      description,
      date: new Date().toISOString(),
      ...metadata,
    });
  }

  /** Log a churn risk alert */
  createChurnRisk(externalId: string, riskLevel: "low" | "medium" | "high", notes?: string) {
    return sensePostCb(`${this.baseUrl}/customers/${externalId}/churn-risks`, this.apiToken, {
      risk_level: riskLevel,
      notes,
      date: new Date().toISOString(),
    });
  }

  /** Get customer health metrics */
  getCustomerMetrics(externalId: string) {
    return senseGetCb(`${this.baseUrl}/customers/${externalId}/metrics`, this.apiToken);
  }

  /** List at-risk customers */
  listAtRiskCustomers(riskLevel?: "low" | "medium" | "high") {
    const qs = riskLevel ? `?risk_level=${riskLevel}` : "";
    return senseGetCb(`${this.baseUrl}/customers/at-risk${qs}`, this.apiToken);
  }
}

// ─────────────────────────────────────────────
// INTERCOM
// ─────────────────────────────────────────────

const intercomPostCb = withCircuitBreaker(
  "intercom:api",
  (url: string, token: string, payload: Record<string, unknown>) =>
    postJson(url, payload, {
      headers: { Authorization: `Bearer ${token}`, "Intercom-Version": "2.10" },
      timeoutMs: 12_000,
      retries: 2,
    }),
);

const intercomGetCb = withCircuitBreaker(
  "intercom:api:get",
  (url: string, token: string) =>
    getJson(url, {
      headers: { Authorization: `Bearer ${token}`, "Intercom-Version": "2.10" },
      timeoutMs: 12_000,
      retries: 2,
    }),
);

export interface IntercomContact {
  external_id: string;
  email?: string;
  name?: string;
  phone?: string;
  role?: "user" | "lead";
  custom_attributes?: Record<string, unknown>;
}

export class IntercomClient {
  constructor(
    private readonly accessToken: string,
    private readonly baseUrl = "https://api.intercom.io",
  ) {}

  /** Create or update a contact (user or lead) */
  async upsertContact(contact: IntercomContact) {
    return intercomPostCb(`${this.baseUrl}/contacts/merge`, this.accessToken, { ...contact });
  }

  /** Create a contact directly */
  async createContact(contact: IntercomContact) {
    return intercomPostCb(`${this.baseUrl}/contacts`, this.accessToken, { ...contact });
  }

  /** Send an outbound message (in-app or email) to a contact */
  async sendMessage(params: {
    from: { type: "admin"; id: string };
    to: { type: "user" | "lead"; id: string };
    body: string;
    messageType?: "inapp" | "email";
    subject?: string;
  }) {
    return intercomPostCb(`${this.baseUrl}/messages`, this.accessToken, {
      message_type: params.messageType ?? "inapp",
      subject: params.subject,
      body: params.body,
      from: params.from,
      to: params.to,
    });
  }

  /** Add a note to a conversation */
  async addNote(contactId: string, body: string, adminId: string) {
    return intercomPostCb(`${this.baseUrl}/notes`, this.accessToken, {
      body,
      contact_id: contactId,
      admin_id: adminId,
    });
  }

  /** Tag a contact */
  async tagContact(contactId: string, tagName: string) {
    return intercomPostCb(`${this.baseUrl}/tags`, this.accessToken, {
      name: tagName,
      users: [{ id: contactId }],
    });
  }

  /** Track an event for a contact */
  async trackEvent(event: {
    userId: string;
    eventName: string;
    createdAt?: number;
    metadata?: Record<string, unknown>;
  }) {
    return intercomPostCb(`${this.baseUrl}/events`, this.accessToken, {
      user_id: event.userId,
      event_name: event.eventName,
      created_at: event.createdAt ?? Math.floor(Date.now() / 1000),
      metadata: event.metadata ?? {},
    });
  }

  /** Search contacts */
  async searchContacts(query: string) {
    return intercomPostCb(`${this.baseUrl}/contacts/search`, this.accessToken, {
      query: {
        field: "email",
        operator: "~",
        value: query,
      },
    });
  }

  /** List conversations */
  async listConversations(params: { status?: string; page?: number } = {}) {
    const qs = new URLSearchParams({
      ...(params.status ? { open: params.status === "open" ? "true" : "false" } : {}),
      page: String(params.page ?? 1),
    });
    return intercomGetCb(`${this.baseUrl}/conversations?${qs}`, this.accessToken);
  }
}
