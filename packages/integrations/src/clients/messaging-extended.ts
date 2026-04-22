// packages/integrations/src/clients/messaging-extended.ts
import { postJson, getJson } from "./http.js";
import { withCircuitBreaker } from "./circuit-breaker.js";

// ─────────────────────────────────────────────
// WHATSAPP BUSINESS API (Meta Cloud API)
// ─────────────────────────────────────────────

const wabPostCb = withCircuitBreaker(
  "whatsapp-biz:api",
  (url: string, token: string, payload: Record<string, unknown>) =>
    postJson(url, payload, { apiKey: token, timeoutMs: 10_000, retries: 2 }),
);

export interface WhatsAppTextMessage {
  to: string; // E.164 format
  text: string;
  previewUrl?: boolean;
}

export interface WhatsAppTemplateMessage {
  to: string;
  templateName: string;
  languageCode: string;
  components?: unknown[];
}

export class WhatsAppBusinessApiClient {
  constructor(
    private readonly accessToken: string,
    private readonly phoneNumberId: string,
    private readonly baseUrl = "https://graph.facebook.com/v19.0",
  ) {}

  /** Send a plain text message */
  sendText(msg: WhatsAppTextMessage) {
    return wabPostCb(
      `${this.baseUrl}/${this.phoneNumberId}/messages`,
      this.accessToken,
      {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: msg.to,
        type: "text",
        text: { preview_url: msg.previewUrl ?? false, body: msg.text },
      },
    );
  }

  /** Send a template message (approved template required) */
  sendTemplate(msg: WhatsAppTemplateMessage) {
    return wabPostCb(
      `${this.baseUrl}/${this.phoneNumberId}/messages`,
      this.accessToken,
      {
        messaging_product: "whatsapp",
        to: msg.to,
        type: "template",
        template: {
          name: msg.templateName,
          language: { code: msg.languageCode },
          components: msg.components ?? [],
        },
      },
    );
  }

  /** Mark a message as read */
  markRead(messageId: string) {
    return wabPostCb(
      `${this.baseUrl}/${this.phoneNumberId}/messages`,
      this.accessToken,
      {
        messaging_product: "whatsapp",
        status: "read",
        message_id: messageId,
      },
    );
  }

  /** Get webhook verification challenge */
  static verifyWebhook(params: { hubMode: string; hubChallenge: string; hubVerifyToken: string }, expectedToken: string): string | null {
    if (params.hubMode === "subscribe" && params.hubVerifyToken === expectedToken) {
      return params.hubChallenge;
    }
    return null;
  }
}

// ─────────────────────────────────────────────
// TAKE BLIP
// ─────────────────────────────────────────────

const blipPostCb = withCircuitBreaker(
  "take-blip:api",
  (url: string, key: string, payload: Record<string, unknown>) =>
    postJson(url, payload, {
      headers: { Authorization: key },
      timeoutMs: 12_000,
      retries: 2,
    }),
);

export interface BlipContact {
  identity: string; // e.g. "553199999999@wa.gw.msging.net"
  name?: string;
  email?: string;
  extras?: Record<string, string>;
}

export class TakeBlipClient {
  constructor(
    private readonly authorizationKey: string, // Base64 "botName:accessKey"
    private readonly baseUrl = "https://msging.net",
  ) {}

  /** Send a plain text message via HTTP API */
  sendMessage(to: string, text: string) {
    return blipPostCb(`${this.baseUrl}/messages`, this.authorizationKey, {
      id: crypto.randomUUID(),
      to,
      type: "text/plain",
      content: text,
    });
  }

  /** Send a command to the server */
  sendCommand(command: Record<string, unknown>) {
    return blipPostCb(`${this.baseUrl}/commands`, this.authorizationKey, {
      id: crypto.randomUUID(),
      ...command,
    });
  }

  /** Upsert a contact in the chatbot's contact book */
  upsertContact(contact: BlipContact) {
    return blipPostCb(`${this.baseUrl}/commands`, this.authorizationKey, {
      id: crypto.randomUUID(),
      method: "merge",
      uri: `/contacts`,
      type: "application/vnd.lime.contact+json",
      resource: {
        identity: contact.identity,
        name: contact.name,
        email: contact.email,
        extras: contact.extras ?? {},
      },
    });
  }
}

// ─────────────────────────────────────────────
// ZENDESK
// ─────────────────────────────────────────────

const zdPostCb = withCircuitBreaker(
  "zendesk:api",
  (url: string, basicAuth: string, payload: Record<string, unknown>) =>
    postJson(url, payload, {
      headers: { Authorization: `Basic ${basicAuth}` },
      timeoutMs: 12_000,
      retries: 2,
    }),
);

const zdGetCb = withCircuitBreaker(
  "zendesk:api:get",
  (url: string, basicAuth: string) =>
    getJson(url, {
      headers: { Authorization: `Basic ${basicAuth}` },
      timeoutMs: 12_000,
      retries: 2,
    }),
);

export interface ZendeskTicket {
  subject: string;
  body: string;
  requesterEmail: string;
  requesterName?: string;
  priority?: "urgent" | "high" | "normal" | "low";
  tags?: string[];
  customFields?: Array<{ id: number; value: unknown }>;
}

export class ZendeskClient {
  private readonly basicAuth: string;

  constructor(
    private readonly subdomain: string,
    email: string,
    apiToken: string,
  ) {
    this.basicAuth = Buffer.from(`${email}/token:${apiToken}`).toString("base64");
  }

  private get base() {
    return `https://${this.subdomain}.zendesk.com/api/v2`;
  }

  /** Create a new support ticket */
  createTicket(ticket: ZendeskTicket) {
    return zdPostCb(`${this.base}/tickets`, this.basicAuth, {
      ticket: {
        subject: ticket.subject,
        comment: { body: ticket.body },
        requester: { name: ticket.requesterName ?? ticket.requesterEmail, email: ticket.requesterEmail },
        priority: ticket.priority ?? "normal",
        tags: ticket.tags ?? [],
        custom_fields: ticket.customFields ?? [],
      },
    });
  }

  /** Update ticket status */
  updateTicket(ticketId: string, updates: { status?: string; tags?: string[]; comment?: string }) {
    return postJson(`${this.base}/tickets/${ticketId}`, {
      ticket: {
        status: updates.status,
        tags: updates.tags,
        comment: updates.comment ? { body: updates.comment } : undefined,
      },
    }, {
      headers: { Authorization: `Basic ${this.basicAuth}` },
      timeoutMs: 12_000,
      retries: 2,
    });
  }

  /** Search tickets by query */
  searchTickets(query: string) {
    return zdGetCb(
      `${this.base}/search.json?query=type:ticket ${encodeURIComponent(query)}`,
      this.basicAuth,
    );
  }

  /** Create or update a user (end-user) */
  upsertUser(email: string, name: string, attributes: Record<string, unknown> = {}) {
    return zdPostCb(`${this.base}/users/create_or_update`, this.basicAuth, {
      user: { email, name, ...attributes },
    });
  }
}

// ─────────────────────────────────────────────
// DISCORD
// ─────────────────────────────────────────────

const discordPostCb = withCircuitBreaker(
  "discord:api",
  (url: string, botToken: string, payload: Record<string, unknown>) =>
    postJson(url, payload, {
      headers: { Authorization: `Bot ${botToken}` },
      timeoutMs: 10_000,
      retries: 2,
    }),
);

export class DiscordClient {
  constructor(
    private readonly botToken: string,
    private readonly baseUrl = "https://discord.com/api/v10",
  ) {}

  /** Send a message to a channel */
  sendMessage(channelId: string, content: string, embeds?: unknown[]) {
    return discordPostCb(
      `${this.baseUrl}/channels/${channelId}/messages`,
      this.botToken,
      { content, embeds: embeds ?? [] },
    );
  }

  /** Send a rich embed message */
  sendEmbed(channelId: string, embed: {
    title: string;
    description?: string;
    color?: number;
    fields?: Array<{ name: string; value: string; inline?: boolean }>;
    footer?: { text: string };
  }) {
    return discordPostCb(
      `${this.baseUrl}/channels/${channelId}/messages`,
      this.botToken,
      { embeds: [embed] },
    );
  }

  /** Execute a webhook (no bot token needed, separate flow) */
  static executeWebhook(webhookUrl: string, payload: { content?: string; username?: string; embeds?: unknown[] }) {
    return postJson(webhookUrl, payload, { timeoutMs: 10_000, retries: 2 });
  }

  /** Create a DM channel then send message */
  async sendDM(userId: string, content: string) {
    const dmChannel = await discordPostCb(
      `${this.baseUrl}/users/@me/channels`,
      this.botToken,
      { recipient_id: userId },
    ) as { id: string };

    return this.sendMessage(dmChannel.id, content);
  }
}

// ─────────────────────────────────────────────
// MICROSOFT TEAMS (via Incoming Webhook)
// ─────────────────────────────────────────────

export class MicrosoftTeamsClient {
  constructor(private readonly webhookUrl: string) {}

  /** Send an Adaptive Card or plain text via Incoming Webhook */
  sendMessage(title: string, text: string, themeColor = "0076D7") {
    return postJson(this.webhookUrl, {
      "@type": "MessageCard",
      "@context": "http://schema.org/extensions",
      themeColor,
      summary: title,
      sections: [{ activityTitle: title, activityText: text }],
    }, { timeoutMs: 10_000, retries: 2 });
  }

  /** Send an Adaptive Card payload (Teams v2 card) */
  sendAdaptiveCard(card: Record<string, unknown>) {
    return postJson(this.webhookUrl, {
      type: "message",
      attachments: [
        {
          contentType: "application/vnd.microsoft.card.adaptive",
          contentUrl: null,
          content: card,
        },
      ],
    }, { timeoutMs: 10_000, retries: 2 });
  }
}
