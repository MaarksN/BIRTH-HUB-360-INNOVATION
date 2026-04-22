// packages/integrations/src/clients/analytics.ts
import { postJson, getJson } from "./http.js";
import { withCircuitBreaker } from "./circuit-breaker.js";

// ─────────────────────────────────────────────
// GOOGLE ANALYTICS 4 (Measurement Protocol + Data API)
// ─────────────────────────────────────────────

const ga4PostCb = withCircuitBreaker(
  "ga4:measurement",
  (url: string, payload: Record<string, unknown>) =>
    postJson(url, payload, { timeoutMs: 10_000, retries: 2 }),
);

const ga4DataCb = withCircuitBreaker(
  "ga4:data-api",
  (url: string, token: string, payload: Record<string, unknown>) =>
    postJson(url, payload, { apiKey: token, timeoutMs: 20_000, retries: 2 }),
);

export interface GA4Event {
  name: string;
  params?: Record<string, string | number | boolean>;
}

export class GoogleAnalytics4Client {
  constructor(
    private readonly measurementId: string,
    private readonly apiSecret: string,
    private readonly propertyId: string,
    private readonly dataApiToken?: string, // OAuth token for Data API
  ) {}

  /** Send server-side event via Measurement Protocol */
  sendEvent(clientId: string, events: GA4Event[]) {
    return ga4PostCb(
      `https://www.google-analytics.com/mp/collect?measurement_id=${this.measurementId}&api_secret=${this.apiSecret}`,
      {
        client_id: clientId,
        events: events.map((e) => ({
          name: e.name,
          params: e.params ?? {},
        })),
      },
    );
  }

  /** Run a report via GA4 Data API (requires OAuth token) */
  runReport(params: {
    dateRanges: Array<{ startDate: string; endDate: string }>;
    dimensions?: Array<{ name: string }>;
    metrics: Array<{ name: string }>;
    dimensionFilter?: Record<string, unknown>;
    limit?: number;
  }) {
    if (!this.dataApiToken) throw new Error("GA4_DATA_API_TOKEN_REQUIRED");
    return ga4DataCb(
      `https://analyticsdata.googleapis.com/v1beta/properties/${this.propertyId}:runReport`,
      this.dataApiToken,
      {
        dateRanges: params.dateRanges,
        dimensions: params.dimensions ?? [],
        metrics: params.metrics,
        dimensionFilter: params.dimensionFilter,
        limit: params.limit ?? 1000,
      },
    );
  }

  /** Get realtime data */
  runRealtimeReport(metrics: string[], dimensions?: string[]) {
    if (!this.dataApiToken) throw new Error("GA4_DATA_API_TOKEN_REQUIRED");
    return ga4DataCb(
      `https://analyticsdata.googleapis.com/v1beta/properties/${this.propertyId}:runRealtimeReport`,
      this.dataApiToken,
      {
        metrics: metrics.map((name) => ({ name })),
        dimensions: (dimensions ?? []).map((name) => ({ name })),
      },
    );
  }
}

// ─────────────────────────────────────────────
// POWER BI (Microsoft Power BI REST API)
// ─────────────────────────────────────────────

const pbiGetCb = withCircuitBreaker(
  "powerbi:api:get",
  (url: string, token: string) =>
    getJson(url, { apiKey: token, timeoutMs: 20_000, retries: 2 }),
);

const pbiPostCb = withCircuitBreaker(
  "powerbi:api",
  (url: string, token: string, payload: Record<string, unknown>) =>
    postJson(url, payload, { apiKey: token, timeoutMs: 20_000, retries: 2 }),
);

export class PowerBIClient {
  constructor(
    private readonly accessToken: string, // OAuth2 token from Azure AD
    private readonly baseUrl = "https://api.powerbi.com/v1.0/myorg",
  ) {}

  /** List workspaces (groups) */
  listWorkspaces() {
    return pbiGetCb(`${this.baseUrl}/groups`, this.accessToken);
  }

  /** List reports in a workspace */
  listReports(workspaceId: string) {
    return pbiGetCb(`${this.baseUrl}/groups/${workspaceId}/reports`, this.accessToken);
  }

  /** Get an embed token for a report (for embedding in app) */
  getReportEmbedToken(workspaceId: string, reportId: string) {
    return pbiPostCb(
      `${this.baseUrl}/groups/${workspaceId}/reports/${reportId}/GenerateToken`,
      this.accessToken,
      { accessLevel: "View" },
    );
  }

  /** List datasets */
  listDatasets(workspaceId: string) {
    return pbiGetCb(`${this.baseUrl}/groups/${workspaceId}/datasets`, this.accessToken);
  }

  /** Push rows to a streaming dataset */
  pushRows(workspaceId: string, datasetId: string, tableName: string, rows: Record<string, unknown>[]) {
    return pbiPostCb(
      `${this.baseUrl}/groups/${workspaceId}/datasets/${datasetId}/tables/${tableName}/rows`,
      this.accessToken,
      { rows },
    );
  }

  /** Trigger a dataset refresh */
  triggerRefresh(workspaceId: string, datasetId: string) {
    return pbiPostCb(
      `${this.baseUrl}/groups/${workspaceId}/datasets/${datasetId}/refreshes`,
      this.accessToken,
      {},
    );
  }

  /** List dashboards */
  listDashboards(workspaceId: string) {
    return pbiGetCb(`${this.baseUrl}/groups/${workspaceId}/dashboards`, this.accessToken);
  }
}

// ─────────────────────────────────────────────
// METABASE
// ─────────────────────────────────────────────

const mbGetCb = withCircuitBreaker(
  "metabase:api:get",
  (url: string, token: string) =>
    getJson(url, { headers: { "X-Metabase-Session": token }, timeoutMs: 20_000, retries: 2 }),
);

const mbPostCb = withCircuitBreaker(
  "metabase:api",
  (url: string, token: string, payload: Record<string, unknown>) =>
    postJson(url, payload, {
      headers: { "X-Metabase-Session": token },
      timeoutMs: 20_000,
      retries: 2,
    }),
);

export class MetabaseClient {
  private sessionToken: string | null = null;

  constructor(
    private readonly username: string,
    private readonly password: string,
    private readonly baseUrl: string, // e.g. https://metabase.yourcompany.com
  ) {}

  /** Authenticate and get session token */
  async authenticate(): Promise<void> {
    const res = await postJson<{ id: string }>(
      `${this.baseUrl}/api/session`,
      { username: this.username, password: this.password },
      { timeoutMs: 10_000, retries: 1 },
    );
    this.sessionToken = res.id;
  }

  private async getToken(): Promise<string> {
    if (!this.sessionToken) await this.authenticate();
    return this.sessionToken!;
  }

  /** List all collections */
  async listCollections() {
    const t = await this.getToken();
    return mbGetCb(`${this.baseUrl}/api/collection`, t);
  }

  /** List all dashboards */
  async listDashboards() {
    const t = await this.getToken();
    return mbGetCb(`${this.baseUrl}/api/dashboard`, t);
  }

  /** Get a dashboard with its cards */
  async getDashboard(dashboardId: number) {
    const t = await this.getToken();
    return mbGetCb(`${this.baseUrl}/api/dashboard/${dashboardId}`, t);
  }

  /** Execute a saved question (card) */
  async runQuestion(cardId: number, parameters: unknown[] = []) {
    const t = await this.getToken();
    return mbPostCb(`${this.baseUrl}/api/card/${cardId}/query`, t, { parameters });
  }

  /** Run an ad-hoc SQL query against a database */
  async runNativeQuery(databaseId: number, sql: string, parameters: unknown[] = []) {
    const t = await this.getToken();
    return mbPostCb(`${this.baseUrl}/api/dataset`, t, {
      database: databaseId,
      type: "native",
      native: { query: sql, template_tags: {} },
      parameters,
    });
  }

  /** Generate a signed embed URL for a dashboard */
  async getEmbedToken(dashboardId: number, params: Record<string, unknown> = {}) {
    const t = await this.getToken();
    return mbPostCb(`${this.baseUrl}/api/preview_embed/dashboard/${dashboardId}/query`, t, {
      resource: { dashboard: dashboardId },
      params,
    });
  }

  /** Create an alert for a question */
  async createAlert(cardId: number, channels: unknown[]) {
    const t = await this.getToken();
    return mbPostCb(`${this.baseUrl}/api/alert`, t, {
      card: { id: cardId, include_csv: false, include_xls: false },
      channels,
      alert_condition: "rows",
    });
  }
}
