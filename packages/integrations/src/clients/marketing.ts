// packages/integrations/src/clients/marketing.ts
import { postJson, getJson } from "./http.js";
import { withCircuitBreaker } from "./circuit-breaker.js";

// ─────────────────────────────────────────────
// RD STATION MARKETING
// ─────────────────────────────────────────────

const rdsmPostCb = withCircuitBreaker(
  "rds-marketing:api",
  (url: string, token: string, payload: Record<string, unknown>) =>
    postJson(url, payload, { apiKey: token, timeoutMs: 12_000, retries: 2 }),
);

const rdsmGetCb = withCircuitBreaker(
  "rds-marketing:api:get",
  (url: string, token: string) =>
    getJson(url, { apiKey: token, timeoutMs: 12_000, retries: 2 }),
);

export interface RDStationLead {
  email: string;
  name?: string;
  company?: string;
  phone?: string;
  tags?: string[];
  customFields?: Record<string, unknown>;
}

export class RDStationMarketingClient {
  constructor(
    private readonly accessToken: string,
    private readonly baseUrl = "https://api.rd.services",
  ) {}

  /** Upsert a lead (conversion) via the Conversions API */
  async upsertLead(payload: RDStationLead) {
    return rdsmPostCb(
      `${this.baseUrl}/platform/conversions`,
      this.accessToken,
      {
        event_type: "CONVERSION",
        event_family: "CDP",
        payload: {
          email: payload.email,
          name: payload.name,
          company: payload.company,
          mobile_phone: payload.phone,
          tags: payload.tags ?? [],
          ...payload.customFields,
        },
      },
    );
  }

  /** List segmentation (static) lists */
  async listSegmentations() {
    return rdsmGetCb(
      `${this.baseUrl}/platform/segmentations`,
      this.accessToken,
    );
  }

  /** Add contact to a static list */
  async addContactToList(listId: string, email: string) {
    return rdsmPostCb(
      `${this.baseUrl}/platform/segmentations/${listId}/contacts`,
      this.accessToken,
      { email },
    );
  }

  /** Trigger a landing-page automation event */
  async triggerEvent(conversionIdentifier: string, email: string, extraFields: Record<string, unknown> = {}) {
    return rdsmPostCb(
      `${this.baseUrl}/platform/conversions`,
      this.accessToken,
      {
        event_type: "CONVERSION",
        event_family: "CDP",
        payload: {
          conversion_identifier: conversionIdentifier,
          email,
          ...extraFields,
        },
      },
    );
  }
}

// ─────────────────────────────────────────────
// ACTIVECAMPAIGN
// ─────────────────────────────────────────────

const acPostCb = withCircuitBreaker(
  "activecampaign:api",
  (url: string, apiKey: string, payload: Record<string, unknown>) =>
    postJson(url, payload, {
      headers: { "Api-Token": apiKey },
      timeoutMs: 12_000,
      retries: 2,
    }),
);

const acGetCb = withCircuitBreaker(
  "activecampaign:api:get",
  (url: string, apiKey: string) =>
    getJson(url, { headers: { "Api-Token": apiKey }, timeoutMs: 12_000, retries: 2 }),
);

export interface ActiveCampaignContact {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  fieldValues?: Array<{ field: string; value: string }>;
}

export class ActiveCampaignClient {
  constructor(
    private readonly apiKey: string,
    private readonly accountUrl: string, // e.g. https://youraccountname.api-us1.com
  ) {}

  private get base() {
    return `${this.accountUrl}/api/3`;
  }

  /** Create or update a contact by email */
  async upsertContact(contact: ActiveCampaignContact) {
    return acPostCb(`${this.base}/contact/sync`, this.apiKey, {
      contact: {
        email: contact.email,
        firstName: contact.firstName,
        lastName: contact.lastName,
        phone: contact.phone,
        fieldValues: contact.fieldValues ?? [],
      },
    });
  }

  /** Add a contact to a list */
  async addToList(contactId: string, listId: string) {
    return acPostCb(`${this.base}/contactLists`, this.apiKey, {
      contactList: { list: listId, contact: contactId, status: 1 },
    });
  }

  /** Add a tag to a contact */
  async addTag(contactId: string, tagId: string) {
    return acPostCb(`${this.base}/contactTags`, this.apiKey, {
      contactTag: { contact: contactId, tag: tagId },
    });
  }

  /** List all lists */
  async getLists() {
    return acGetCb(`${this.base}/lists`, this.apiKey);
  }

  /** List all tags */
  async getTags() {
    return acGetCb(`${this.base}/tags`, this.apiKey);
  }

  /** Track an event for contact (site & event tracking) */
  async trackEvent(eventKey: string, eventName: string, contactEmail: string, extraData?: Record<string, unknown>) {
    return postJson(`${this.accountUrl}/api/3/events`, {
      key: eventKey,
      event: eventName,
      eventdata: JSON.stringify(extraData ?? {}),
      visit: { email: contactEmail },
    }, {
      headers: { "Api-Token": this.apiKey },
      timeoutMs: 10_000,
      retries: 2,
    });
  }
}

// ─────────────────────────────────────────────
// LINKEDIN ADS
// ─────────────────────────────────────────────

const liGetCb = withCircuitBreaker(
  "linkedin-ads:api",
  (url: string, token: string) =>
    getJson(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "LinkedIn-Version": "202405",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      timeoutMs: 15_000,
      retries: 2,
    }),
);

const liPostCb = withCircuitBreaker(
  "linkedin-ads:api:post",
  (url: string, token: string, payload: Record<string, unknown>) =>
    postJson(url, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        "LinkedIn-Version": "202405",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      timeoutMs: 15_000,
      retries: 2,
    }),
);

export class LinkedInAdsClient {
  constructor(
    private readonly accessToken: string,
    private readonly baseUrl = "https://api.linkedin.com/rest",
  ) {}

  /** List ad accounts the token has access to */
  async listAdAccounts() {
    return liGetCb(
      `${this.baseUrl}/adAccounts?q=search&search.type.values[0]=BUSINESS`,
      this.accessToken,
    );
  }

  /** Get campaign analytics */
  async getCampaignAnalytics(adAccountId: string, startDate: string, endDate: string) {
    const params = new URLSearchParams({
      q: "analytics",
      pivot: "CAMPAIGN",
      dateRange: JSON.stringify({ start: startDate, end: endDate }),
      "accounts[0]": `urn:li:sponsoredAccount:${adAccountId}`,
      fields: "costInLocalCurrency,impressions,clicks,conversions,dateRange",
    });
    return liGetCb(
      `${this.baseUrl}/adAnalytics?${params.toString()}`,
      this.accessToken,
    );
  }

  /** List campaigns under an account */
  async listCampaigns(adAccountId: string) {
    return liGetCb(
      `${this.baseUrl}/adCampaigns?q=search&search.account.values[0]=urn:li:sponsoredAccount:${adAccountId}`,
      this.accessToken,
    );
  }

  /** Submit a lead-gen form fill (Conversions API) */
  async submitConversionEvent(adAccountId: string, conversionId: string, payload: {
    email: string;
    timestamp: number;
    conversionValue?: number;
  }) {
    return liPostCb(
      `${this.baseUrl}/conversionEvents`,
      this.accessToken,
      {
        conversion: `urn:lla:llaPartnerConversion:${conversionId}`,
        account: `urn:li:sponsoredAccount:${adAccountId}`,
        conversionHappenedAt: payload.timestamp,
        conversionValue: payload.conversionValue
          ? { amount: String(payload.conversionValue), currencyCode: "BRL" }
          : undefined,
        user: { userIds: [{ idType: "SHA256_EMAIL", idValue: payload.email }] },
      },
    );
  }
}
