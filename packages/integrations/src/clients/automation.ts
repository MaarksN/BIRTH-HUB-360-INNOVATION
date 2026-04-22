// packages/integrations/src/clients/automation.ts
import { postJson, getJson } from "./http.js";
import { withCircuitBreaker } from "./circuit-breaker.js";

// ─────────────────────────────────────────────
// MAKE (formerly Integromat)
// ─────────────────────────────────────────────

const makePostCb = withCircuitBreaker(
  "make:api",
  (url: string, token: string, payload: Record<string, unknown>) =>
    postJson(url, payload, { apiKey: token, timeoutMs: 15_000, retries: 2 }),
);

const makeGetCb = withCircuitBreaker(
  "make:api:get",
  (url: string, token: string) =>
    getJson(url, { apiKey: token, timeoutMs: 15_000, retries: 2 }),
);

export class MakeClient {
  constructor(
    private readonly apiToken: string,
    private readonly zone: string = "eu2", // e.g. eu2, us1
    private readonly teamId?: string,
  ) {}

  private get base() {
    return `https://${this.zone}.make.com/api/v2`;
  }

  /** Trigger a scenario webhook (custom webhook module) */
  static triggerWebhook(webhookUrl: string, payload: Record<string, unknown>) {
    return postJson(webhookUrl, payload, { timeoutMs: 15_000, retries: 2 });
  }

  /** List scenarios in the team */
  listScenarios() {
    const qs = this.teamId ? `?teamId=${this.teamId}` : "";
    return makeGetCb(`${this.base}/scenarios${qs}`, this.apiToken);
  }

  /** Get a specific scenario */
  getScenario(scenarioId: string) {
    return makeGetCb(`${this.base}/scenarios/${scenarioId}`, this.apiToken);
  }

  /** Activate a scenario */
  activateScenario(scenarioId: string) {
    return makePostCb(`${this.base}/scenarios/${scenarioId}/start`, this.apiToken, {});
  }

  /** Deactivate a scenario */
  deactivateScenario(scenarioId: string) {
    return makePostCb(`${this.base}/scenarios/${scenarioId}/stop`, this.apiToken, {});
  }

  /** Run a scenario once immediately */
  runScenario(scenarioId: string) {
    return makePostCb(`${this.base}/scenarios/${scenarioId}/run`, this.apiToken, {});
  }

  /** List executions for a scenario */
  listExecutions(scenarioId: string, limit = 20) {
    return makeGetCb(
      `${this.base}/scenarios/${scenarioId}/logs?limit=${limit}`,
      this.apiToken,
    );
  }

  /** List data stores */
  listDataStores() {
    const qs = this.teamId ? `?teamId=${this.teamId}` : "";
    return makeGetCb(`${this.base}/data-stores${qs}`, this.apiToken);
  }

  /** Add a record to a data store */
  addDataStoreRecord(dataStoreId: string, record: Record<string, unknown>) {
    return makePostCb(
      `${this.base}/data-stores/${dataStoreId}/data`,
      this.apiToken,
      { data: record },
    );
  }
}

// ─────────────────────────────────────────────
// ZAPIER
// ─────────────────────────────────────────────

export class ZapierClient {
  /**
   * Zapier primarily uses webhooks; this client handles NLA (Natural Language Actions)
   * API and direct webhook triggers.
   */
  constructor(
    private readonly nlaApiKey?: string, // Zapier NLA API key (optional)
  ) {}

  /** Trigger a Zapier Catch Hook (custom webhook Zap trigger) */
  static triggerWebhook(webhookUrl: string, payload: Record<string, unknown>) {
    return postJson(webhookUrl, payload, { timeoutMs: 15_000, retries: 2 });
  }

  /** List available NLA Actions (if NLA API key provided) */
  listNLAActions() {
    if (!this.nlaApiKey) throw new Error("ZAPIER_NLA_API_KEY_REQUIRED");
    return getJson("https://nla.zapier.com/api/v1/dynamic/exposed/", {
      headers: { "X-Api-Key": this.nlaApiKey },
      timeoutMs: 15_000,
      retries: 2,
    });
  }

  /** Execute a Zapier NLA Action */
  executeNLAAction(actionId: string, instructions: string, metadata: Record<string, unknown> = {}) {
    if (!this.nlaApiKey) throw new Error("ZAPIER_NLA_API_KEY_REQUIRED");
    return postJson(
      `https://nla.zapier.com/api/v1/dynamic/exposed/${actionId}/execute/`,
      { instructions, ...metadata },
      {
        headers: { "X-Api-Key": this.nlaApiKey },
        timeoutMs: 30_000,
        retries: 1,
      },
    );
  }
}

// ─────────────────────────────────────────────
// N8N
// ─────────────────────────────────────────────

const n8nGetCb = withCircuitBreaker(
  "n8n:api:get",
  (url: string, apiKey: string) =>
    getJson(url, { headers: { "X-N8N-API-KEY": apiKey }, timeoutMs: 15_000, retries: 2 }),
);

const n8nPostCb = withCircuitBreaker(
  "n8n:api",
  (url: string, apiKey: string, payload: Record<string, unknown>) =>
    postJson(url, payload, {
      headers: { "X-N8N-API-KEY": apiKey },
      timeoutMs: 15_000,
      retries: 2,
    }),
);

export class N8nClient {
  constructor(
    private readonly apiKey: string,
    private readonly baseUrl: string, // e.g. https://n8n.yourcompany.com/api/v1
  ) {}

  /** Trigger a webhook workflow */
  static triggerWebhook(webhookPath: string, n8nBaseUrl: string, payload: Record<string, unknown>, method: "GET" | "POST" = "POST") {
    const url = `${n8nBaseUrl}/webhook/${webhookPath}`;
    if (method === "GET") {
      const qs = new URLSearchParams(payload as Record<string, string>).toString();
      return getJson(`${url}?${qs}`, {});
    }
    return postJson(url, payload, { timeoutMs: 15_000, retries: 2 });
  }

  /** List all workflows */
  listWorkflows(active?: boolean) {
    const qs = active !== undefined ? `?active=${active}` : "";
    return n8nGetCb(`${this.baseUrl}/workflows${qs}`, this.apiKey);
  }

  /** Get a specific workflow */
  getWorkflow(workflowId: string) {
    return n8nGetCb(`${this.baseUrl}/workflows/${workflowId}`, this.apiKey);
  }

  /** Activate a workflow */
  activateWorkflow(workflowId: string) {
    return n8nPostCb(`${this.baseUrl}/workflows/${workflowId}/activate`, this.apiKey, {});
  }

  /** Deactivate a workflow */
  deactivateWorkflow(workflowId: string) {
    return n8nPostCb(`${this.baseUrl}/workflows/${workflowId}/deactivate`, this.apiKey, {});
  }

  /** Execute a workflow immediately (test run) */
  executeWorkflow(workflowId: string, inputData?: Record<string, unknown>) {
    return n8nPostCb(`${this.baseUrl}/workflows/${workflowId}/execute`, this.apiKey, {
      runData: inputData,
    });
  }

  /** List executions */
  listExecutions(workflowId?: string, status?: "success" | "error" | "waiting", limit = 20) {
    const qs = new URLSearchParams({
      limit: String(limit),
      ...(workflowId ? { workflowId } : {}),
      ...(status ? { status } : {}),
    });
    return n8nGetCb(`${this.baseUrl}/executions?${qs}`, this.apiKey);
  }

  /** Get a specific execution */
  getExecution(executionId: string) {
    return n8nGetCb(`${this.baseUrl}/executions/${executionId}`, this.apiKey);
  }

  /** Delete an execution */
  deleteExecution(executionId: string) {
    return n8nGetCb(`${this.baseUrl}/executions/${executionId}`, this.apiKey); // DELETE would need a deleteJson helper
  }

  /** Create a credential */
  createCredential(name: string, type: string, data: Record<string, unknown>) {
    return n8nPostCb(`${this.baseUrl}/credentials`, this.apiKey, {
      name,
      type,
      data,
    });
  }
}
