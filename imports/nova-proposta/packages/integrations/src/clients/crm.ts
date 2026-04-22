
// 
import { postJson } from "./http.js";
import { withCircuitBreaker } from "./circuit-breaker.js";

const hubspotCb = withCircuitBreaker("hubspot:api", (url: string, token: string, payload: Record<string, unknown>) => {
  return postJson(url, payload, {
    apiKey: token,
    timeoutMs: 10_000,
    retries: 2,
  });
});

const pipedriveCb = withCircuitBreaker("pipedrive:api", (url: string, payload: Record<string, unknown>) => {
  return postJson(url, payload, {
    timeoutMs: 10_000,
    retries: 2,
  });
});

export class HubspotClient {
  constructor(
    private readonly token: string,
    private readonly baseUrl = "https://api.hubapi.com",
  ) {}

  createContact(payload: Record<string, unknown>) {
    return hubspotCb(`${this.baseUrl}/crm/v3/objects/contacts`, this.token, payload);
  }
}

export class PipedriveClient {
  constructor(
    private readonly token: string,
    private readonly baseUrl = "https://api.pipedrive.com/v1",
  ) {}

  createPerson(payload: Record<string, unknown>) {
    return pipedriveCb(`${this.baseUrl}/persons?api_token=${this.token}`, payload);
  }
}
