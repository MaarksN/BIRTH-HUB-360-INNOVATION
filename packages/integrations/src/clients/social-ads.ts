
// 
import { getJson, postJson } from "./http.js";

export class MetaCloudApiClient {
  constructor(
    private readonly token: string,
    private readonly baseUrl = "https://graph.facebook.com/v19.0",
  ) {}

  sendWhatsAppTemplate(
    phoneNumberId: string,
    payload: Record<string, unknown>,
  ) {
    return postJson(
      `${this.baseUrl}/${phoneNumberId}/messages`,
      payload,
      { apiKey: this.token, timeoutMs: 10_000, retries: 2 },
    );
  }
}

export class MetaAdsApiClient {
  constructor(
    private readonly token: string,
    private readonly baseUrl = "https://graph.facebook.com/v19.0",
  ) {}

  listCampaigns(adAccountId: string) {
    return getJson(`${this.baseUrl}/${adAccountId}/campaigns`, {
      apiKey: this.token,
      retries: 2,
      timeoutMs: 10_000
    });
  }
}

export class GoogleAdsApiClient {
  constructor(
    private readonly developerToken: string,
    private readonly baseUrl = "https://googleads.googleapis.com/v17",
  ) {}

  search(customerId: string, query: string) {
    return postJson(
      `${this.baseUrl}/customers/${customerId}/googleAds:search`,
      { query },
      { apiKey: this.developerToken, timeoutMs: 15_000, retries: 2 },
    );
  }
}
