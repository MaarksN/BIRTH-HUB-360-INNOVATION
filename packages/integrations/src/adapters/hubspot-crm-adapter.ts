export interface HubspotAdapterFetchResponse {
  json(): Promise<unknown>;
  ok: boolean;
  status: number;
  text(): Promise<string>;
}

export type HubspotAdapterFetch = (
  input: string,
  init: {
    body?: string;
    headers: Record<string, string>;
    method: "GET" | "PATCH" | "POST";
    signal?: AbortSignal;
  }
) => Promise<HubspotAdapterFetchResponse>;

export interface HubspotCrmAdapterOptions {
  accessToken: string;
  baseUrl?: string;
  fetchImpl?: HubspotAdapterFetch;
  timeoutMs?: number;
}

export interface HubspotContactUpsertInput {
  companyName?: string | undefined;
  customProperties?: Record<string, unknown> | undefined;
  email: string;
  firstName?: string | undefined;
  lastName?: string | undefined;
  leadStatus?: string | undefined;
  lifecycleStage?: string | undefined;
  phone?: string | undefined;
}

export interface HubspotCompanyUpsertInput {
  arrCents?: number | undefined;
  customProperties?: Record<string, unknown> | undefined;
  domain?: string | null | undefined;
  healthScore?: number | undefined;
  hubspotCompanyId?: string | null | undefined;
  name: string;
  organizationId?: string | undefined;
  planCode?: string | undefined;
  status?: string | undefined;
  tenantId?: string | undefined;
}

export interface HubspotCrmAdapterResponse {
  body: unknown;
  bodyText: string;
  objectId: string | null;
  request: {
    method: "GET" | "PATCH" | "POST";
    path: string;
    payload?: Record<string, unknown> | undefined;
  };
  status: number;
}

export interface HubspotContactRecord {
  id: string | null;
  properties: Record<string, unknown>;
}

export class HubspotApiError extends Error {
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
    this.name = "HubspotApiError";
    this.code = input.code;
    this.responseBody = input.responseBody;
    this.retryable = input.retryable;
    this.statusCode = input.statusCode;
  }
}

export class HubspotRateLimitError extends HubspotApiError {
  constructor(message = "HubSpot API rate limit reached.", responseBody?: string) {
    super({
      code: "HUBSPOT_RATE_LIMIT",
      message,
      responseBody,
      retryable: true,
      statusCode: 429
    });
    this.name = "HubspotRateLimitError";
  }
}

export class HubspotTimeoutError extends HubspotApiError {
  constructor(message = "HubSpot API request timed out.") {
    super({
      code: "HUBSPOT_TIMEOUT",
      message,
      retryable: true,
      statusCode: 504
    });
    this.name = "HubspotTimeoutError";
  }
}

function buildHubspotApiError(status: number, responseBody: string): HubspotApiError {
  if (status === 401 || status === 403) {
    return new HubspotApiError({
      code: "HUBSPOT_AUTH_FAILED",
      message: `HubSpot authentication failed with status ${status}.`,
      responseBody,
      retryable: false,
      statusCode: status
    });
  }

  if (status === 408) {
    return new HubspotApiError({
      code: "HUBSPOT_TIMEOUT",
      message: `HubSpot request timed out with status ${status}.`,
      responseBody,
      retryable: true,
      statusCode: status
    });
  }

  if (status >= 500) {
    return new HubspotApiError({
      code: "HUBSPOT_SERVER_ERROR",
      message: `HubSpot server error with status ${status}.`,
      responseBody,
      retryable: true,
      statusCode: status
    });
  }

  return new HubspotApiError({
    code: "HUBSPOT_REQUEST_FAILED",
    message: `HubSpot CRM request failed with status ${status}.`,
    responseBody,
    retryable: false,
    statusCode: status
  });
}

function removeEmptyProperties(input: Record<string, unknown>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(input)
      .filter(([, value]) => value !== undefined && value !== null && String(value).trim().length > 0)
      .map(([key, value]) => [key, String(value)])
  );
}

function readObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function parseObjectId(body: unknown): string | null {
  if (!body || typeof body !== "object") {
    return null;
  }

  const candidate = body as {
    id?: unknown;
    results?: Array<{
      id?: unknown;
    }>;
  };
  if (typeof candidate.id === "string") {
    return candidate.id;
  }

  const firstResult = candidate.results?.[0];
  return typeof firstResult?.id === "string" ? firstResult.id : null;
}

async function readResponseBody(response: HubspotAdapterFetchResponse): Promise<{
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

export class HubspotCrmAdapter {
  private readonly baseUrl: string;
  private readonly fetchImpl: HubspotAdapterFetch;
  private readonly timeoutMs: number;

  constructor(private readonly options: HubspotCrmAdapterOptions) {
    this.baseUrl = options.baseUrl ?? "https://api.hubapi.com";
    this.fetchImpl = options.fetchImpl ?? (fetch as unknown as HubspotAdapterFetch);
    this.timeoutMs = options.timeoutMs ?? 10_000;
  }

  private async request(input: {
    method: "GET" | "PATCH" | "POST";
    path: string;
    payload?: Record<string, unknown> | undefined;
  }): Promise<HubspotCrmAdapterResponse> {
    const abortController = new AbortController();
    const timeout = setTimeout(() => abortController.abort(), this.timeoutMs);

    try {
      const response = await this.fetchImpl(`${this.baseUrl}${input.path}`, {
        ...(input.method === "GET" ? {} : { body: JSON.stringify(input.payload ?? {}) }),
        headers: {
          authorization: `Bearer ${this.options.accessToken}`,
          "content-type": "application/json",
          "user-agent": "birthub-integrations/1.0"
        },
        method: input.method,
        signal: abortController.signal
      });
      const body = await readResponseBody(response);

      if (response.status === 429) {
        throw new HubspotRateLimitError(undefined, body.text);
      }

      if (!response.ok) {
        throw buildHubspotApiError(response.status, body.text);
      }

      return {
        body: body.parsed,
        bodyText: body.text,
        objectId: parseObjectId(body.parsed),
        request: input,
        status: response.status
      };
    } catch (error) {
      if (error instanceof HubspotApiError) {
        throw error;
      }

      if (error instanceof Error && error.name === "AbortError") {
        throw new HubspotTimeoutError();
      }

      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  async upsertContact(input: HubspotContactUpsertInput): Promise<HubspotCrmAdapterResponse> {
    const email = input.email.trim().toLowerCase();
    if (!email) {
      throw new Error("HUBSPOT_CONTACT_EMAIL_REQUIRED");
    }

    const properties = removeEmptyProperties({
      company: input.companyName,
      email,
      firstname: input.firstName,
      hs_lead_status: input.leadStatus,
      lastname: input.lastName,
      lifecyclestage: input.lifecycleStage,
      phone: input.phone,
      ...(input.customProperties ?? {})
    });

    return this.request({
      method: "POST",
      path: "/crm/v3/objects/contacts/batch/upsert",
      payload: {
        inputs: [
          {
            id: email,
            idProperty: "email",
            properties
          }
        ]
      }
    });
  }

  async getContactById(
    contactId: string,
    properties = [
      "email",
      "firstname",
      "lastname",
      "phone",
      "company",
      "hs_lead_status",
      "lifecyclestage"
    ]
  ): Promise<HubspotContactRecord> {
    const id = contactId.trim();
    if (!id) {
      throw new Error("HUBSPOT_CONTACT_ID_REQUIRED");
    }

    const query = new URLSearchParams({
      properties: properties.join(",")
    });
    const response = await this.request({
      method: "GET",
      path: `/crm/v3/objects/contacts/${encodeURIComponent(id)}?${query.toString()}`
    });
    const body = readObject(response.body);
    const propertiesBody = body ? readObject(body.properties) : null;

    return {
      id: typeof body?.id === "string" ? body.id : response.objectId,
      properties: propertiesBody ?? {}
    };
  }

  async validateAccessToken(): Promise<HubspotCrmAdapterResponse> {
    return this.request({
      method: "GET",
      path: `/oauth/v1/access-tokens/${encodeURIComponent(this.options.accessToken)}`
    });
  }

  async validateCrmAccess(): Promise<HubspotCrmAdapterResponse> {
    return this.request({
      method: "GET",
      path: "/crm/v3/objects/contacts?limit=1&properties=email"
    });
  }

  async upsertCompany(input: HubspotCompanyUpsertInput): Promise<HubspotCrmAdapterResponse> {
    const properties = removeEmptyProperties({
      bh_arr_cents: input.arrCents,
      bh_health_score: input.healthScore,
      bh_plan_code: input.planCode,
      bh_subscription_status: input.status,
      bh_tenant_id: input.tenantId,
      domain: input.domain ?? undefined,
      name: input.name,
      ...(input.customProperties ?? {})
    });

    if (input.hubspotCompanyId) {
      return this.request({
        method: "PATCH",
        path: `/crm/v3/objects/companies/${input.hubspotCompanyId}`,
        payload: {
          properties
        }
      });
    }

    return this.request({
      method: "POST",
      path: "/crm/v3/objects/companies",
      payload: {
        properties
      }
    });
  }
}
