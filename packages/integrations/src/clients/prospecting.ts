// packages/integrations/src/clients/prospecting.ts
import { postJson, getJson } from "./http.js";
import { withCircuitBreaker } from "./circuit-breaker.js";

// ─────────────────────────────────────────────
// ECONODATA
// ─────────────────────────────────────────────

const econoGetCb = withCircuitBreaker(
  "econodata:api",
  (url: string, apiKey: string) =>
    getJson(url, { apiKey, timeoutMs: 15_000, retries: 2 }),
);

export interface EconodataCompanyFilter {
  city?: string;
  state?: string;
  cnae?: string;
  employeeCount?: string; // e.g. "50-100"
  page?: number;
  limit?: number;
}

export class EconodataClient {
  constructor(
    private readonly apiKey: string,
    private readonly baseUrl = "https://api.econodata.com.br",
  ) {}

  /** Search companies with filters */
  searchCompanies(filters: EconodataCompanyFilter) {
    const qs = new URLSearchParams(
      Object.fromEntries(
        Object.entries({
          city: filters.city,
          state: filters.state,
          cnae: filters.cnae,
          employee_count: filters.employeeCount,
          page: String(filters.page ?? 1),
          limit: String(filters.limit ?? 50),
        }).filter(([, v]) => v !== undefined),
      ) as Record<string, string>,
    );
    return econoGetCb(`${this.baseUrl}/v1/companies?${qs}`, this.apiKey);
  }

  /** Enrich a company by CNPJ */
  enrichByCnpj(cnpj: string) {
    return econoGetCb(`${this.baseUrl}/v1/companies/${cnpj.replace(/\D/g, "")}`, this.apiKey);
  }
}

// ─────────────────────────────────────────────
// NEOWAY
// ─────────────────────────────────────────────

const neowayPostCb = withCircuitBreaker(
  "neoway:api",
  (url: string, token: string, payload: Record<string, unknown>) =>
    postJson(url, payload, { apiKey: token, timeoutMs: 20_000, retries: 2 }),
);

export class NeowayClient {
  constructor(
    private readonly apiToken: string,
    private readonly baseUrl = "https://plataforma.neoway.com.br/api/v1",
  ) {}

  /** Get company data by CNPJ */
  async enrichCompany(cnpj: string) {
    return neowayPostCb(`${this.baseUrl}/company/search`, this.apiToken, {
      cnpj: cnpj.replace(/\D/g, ""),
    });
  }

  /** Get risk score for a CNPJ */
  async getRiskScore(cnpj: string) {
    return neowayPostCb(`${this.baseUrl}/risk/company`, this.apiToken, {
      cnpj: cnpj.replace(/\D/g, ""),
    });
  }

  /** Batch enrich (up to 100 CNPJs) */
  async batchEnrich(cnpjs: string[]) {
    return neowayPostCb(`${this.baseUrl}/company/batch`, this.apiToken, {
      cnpjs: cnpjs.map((c) => c.replace(/\D/g, "")),
    });
  }
}

// ─────────────────────────────────────────────
// APOLLO.IO
// ─────────────────────────────────────────────

const apolloPostCb = withCircuitBreaker(
  "apollo-io:api",
  (url: string, apiKey: string, payload: Record<string, unknown>) =>
    postJson(url, payload, {
      headers: { "X-Api-Key": apiKey, "Cache-Control": "no-cache" },
      timeoutMs: 15_000,
      retries: 2,
    }),
);

const apolloGetCb = withCircuitBreaker(
  "apollo-io:api:get",
  (url: string, apiKey: string) =>
    getJson(url, {
      headers: { "X-Api-Key": apiKey, "Cache-Control": "no-cache" },
      timeoutMs: 15_000,
      retries: 2,
    }),
);

export interface ApolloSearchFilter {
  personTitles?: string[];
  personLocations?: string[];
  organizationLocations?: string[];
  organizationNumEmployeesRanges?: string[];
  organizationIndustryTagIds?: string[];
  q_keywords?: string;
  page?: number;
  perPage?: number;
}

export class ApolloClient {
  constructor(
    private readonly apiKey: string,
    private readonly baseUrl = "https://api.apollo.io/v1",
  ) {}

  /** Search people (leads) */
  searchPeople(filters: ApolloSearchFilter) {
    return apolloPostCb(`${this.baseUrl}/mixed_people/search`, this.apiKey, {
      person_titles: filters.personTitles,
      person_locations: filters.personLocations,
      organization_locations: filters.organizationLocations,
      organization_num_employees_ranges: filters.organizationNumEmployeesRanges,
      q_keywords: filters.q_keywords,
      page: filters.page ?? 1,
      per_page: filters.perPage ?? 25,
    });
  }

  /** Enrich a contact by email */
  enrichContact(email: string) {
    return apolloPostCb(`${this.baseUrl}/people/match`, this.apiKey, { email });
  }

  /** Enrich a company by domain */
  enrichCompany(domain: string) {
    return apolloPostCb(`${this.baseUrl}/organizations/enrich`, this.apiKey, { domain });
  }

  /** Add to a sequence (outbound cadence) */
  addContactToSequence(contactId: string, sequenceId: string, emailAccountId: string) {
    return apolloPostCb(`${this.baseUrl}/emailer_pushes/create`, this.apiKey, {
      emailer_campaign_id: sequenceId,
      contact_ids: [contactId],
      send_email_from_email_account_id: emailAccountId,
    });
  }
}
