// packages/integrations/src/clients/contracts-extended.ts
import { postJson, getJson } from "./http.js";
import { withCircuitBreaker } from "./circuit-breaker.js";
import type { Signer, SignatureDocument, ISignaturesClient } from "./signatures.js";

// ─────────────────────────────────────────────
// ZAPSIGN
// ─────────────────────────────────────────────

const zapPostCb = withCircuitBreaker(
  "zapsign:api",
  (url: string, token: string, payload: Record<string, unknown>) =>
    postJson(url, payload, { apiKey: token, timeoutMs: 15_000, retries: 2 }),
);

const zapGetCb = withCircuitBreaker(
  "zapsign:api:get",
  (url: string, token: string) =>
    getJson(url, { apiKey: token, timeoutMs: 15_000, retries: 2 }),
);

interface ZapSignDocResponse {
  open_id: string;
  token: string;
  name: string;
  status: string;
  signers: Array<{ email: string; status: string; sign_url: string; signed_at?: string }>;
}

export class ZapSignClient implements ISignaturesClient {
  constructor(
    private readonly apiToken: string,
    private readonly baseUrl = "https://api.zapsign.com.br/api/v1",
  ) {}

  async createDocument(
    templateId: string,
    signers: Signer[],
    _path: string,
    tenantId: string,
  ): Promise<SignatureDocument> {
    const res = await zapPostCb(`${this.baseUrl}/docs/`, this.apiToken, {
      template_id: templateId,
      signers: signers.map((s) => ({
        name: s.name,
        email: s.email,
        phone_country: "55",
        phone_number: s.phoneNumber,
        auth_mode: this._mapAuthMode(s.authMethod),
      })),
      external_id: tenantId,
    }) as ZapSignDocResponse;

    return this._mapDoc(res);
  }

  async sendForSignature(documentId: string): Promise<void> {
    // ZapSign sends automatically on creation; this triggers a reminder
    await zapPostCb(
      `${this.baseUrl}/docs/${documentId}/send-reminder/`,
      this.apiToken,
      {},
    );
  }

  async getStatus(documentId: string): Promise<SignatureDocument> {
    const res = await zapGetCb(
      `${this.baseUrl}/docs/${documentId}/`,
      this.apiToken,
    ) as ZapSignDocResponse;
    return this._mapDoc(res);
  }

  private _mapAuthMode(method?: Signer["authMethod"]): string {
    const map: Record<NonNullable<Signer["authMethod"]>, string> = {
      email: "assinaturaTela",
      sms: "tokenSms",
      whatsapp: "tokenWhatsapp",
    };
    return method ? (map[method] ?? "assinaturaTela") : "assinaturaTela";
  }

  private _mapDoc(d: ZapSignDocResponse): SignatureDocument {
    return {
      id: d.open_id,
      name: d.name,
      status: d.status,
      signers: d.signers.map((s) => ({
        email: s.email,
        signed: s.status === "signed",
        signedAt: s.signed_at ? new Date(s.signed_at) : undefined,
      })),
    };
  }
}

// ─────────────────────────────────────────────
// AUTENTIQUE
// ─────────────────────────────────────────────

const autGetCb = withCircuitBreaker(
  "autentique:api:get",
  (url: string, token: string) =>
    getJson(url, { apiKey: token, timeoutMs: 15_000, retries: 2 }),
);

const autPostCb = withCircuitBreaker(
  "autentique:api",
  (url: string, token: string, payload: Record<string, unknown>) =>
    postJson(url, payload, { apiKey: token, timeoutMs: 15_000, retries: 2 }),
);

interface AutentiqueDocResponse {
  data: {
    createDocument: {
      id: string;
      name: string;
      status: { name: string };
      signatures: Array<{
        public_id: string;
        name: string;
        email: string;
        signed: { created_at?: string } | null;
        link: { short_link: string };
      }>;
    };
  };
}

export class AutentiqueClient implements ISignaturesClient {
  constructor(
    private readonly apiToken: string,
    private readonly baseUrl = "https://api.autentique.com.br/v2/graphql",
  ) {}

  async createDocument(
    _templateId: string,
    signers: Signer[],
    name: string,
    _tenantId: string,
  ): Promise<SignatureDocument> {
    const mutation = `
      mutation CreateDocument($document: DocumentInput!, $signers: [SignerInput!]!, $file: Upload!) {
        createDocument(document: $document, signers: $signers, file: $file) {
          id name status { name }
          signatures { public_id name email signed { created_at } link { short_link } }
        }
      }
    `;

    // Autentique uses GraphQL + multipart — this sends the mutation metadata
    // File upload must be handled separately via FormData in the actual service layer
    const res = await autPostCb(this.baseUrl, this.apiToken, {
      query: mutation,
      variables: {
        document: { name },
        signers: signers.map((s) => ({
          name: s.name,
          email: s.email,
          action: { name: "SIGN" },
          positions: [],
        })),
      },
    }) as AutentiqueDocResponse;

    return this._mapDoc(res.data.createDocument);
  }

  async sendForSignature(documentId: string): Promise<void> {
    const mutation = `mutation { resendDocument(id: "${documentId}") { id } }`;
    await autPostCb(this.baseUrl, this.apiToken, { query: mutation });
  }

  async getStatus(documentId: string): Promise<SignatureDocument> {
    const query = `
      query GetDocument($id: String!) {
        document(id: $id) {
          id name status { name }
          signatures { public_id name email signed { created_at } }
        }
      }
    `;
    const res = await autPostCb(this.baseUrl, this.apiToken, {
      query,
      variables: { id: documentId },
    }) as { data: { document: AutentiqueDocResponse["data"]["createDocument"] } };
    return this._mapDoc(res.data.document);
  }

  private _mapDoc(d: AutentiqueDocResponse["data"]["createDocument"]): SignatureDocument {
    return {
      id: d.id,
      name: d.name,
      status: d.status.name,
      signers: d.signatures.map((s) => ({
        email: s.email,
        signed: !!s.signed?.created_at,
        signedAt: s.signed?.created_at ? new Date(s.signed.created_at) : undefined,
      })),
    };
  }
}

// ─────────────────────────────────────────────
// DOCUSIGN
// ─────────────────────────────────────────────

const dsPostCb = withCircuitBreaker(
  "docusign:api",
  (url: string, token: string, payload: Record<string, unknown>) =>
    postJson(url, payload, { apiKey: token, timeoutMs: 20_000, retries: 2 }),
);

const dsGetCb = withCircuitBreaker(
  "docusign:api:get",
  (url: string, token: string) =>
    getJson(url, { apiKey: token, timeoutMs: 15_000, retries: 2 }),
);

export class DocuSignClient implements ISignaturesClient {
  constructor(
    private readonly accessToken: string,
    private readonly accountId: string,
    private readonly baseUrl = "https://na4.docusign.net/restapi/v2.1",
  ) {}

  /** Create an envelope (document package) from a base64-encoded PDF */
  async createEnvelopeFromBase64(
    pdfBase64: string,
    signers: Signer[],
    emailSubject: string,
    _tenantId: string,
  ): Promise<SignatureDocument> {
    const res = await dsPostCb(
      `${this.baseUrl}/accounts/${this.accountId}/envelopes`,
      this.accessToken,
      {
        emailSubject,
        documents: [
          {
            documentBase64: pdfBase64,
            name: emailSubject,
            fileExtension: "pdf",
            documentId: "1",
          },
        ],
        recipients: {
          signers: signers.map((s, i) => ({
            email: s.email,
            name: s.name,
            recipientId: String(i + 1),
            routingOrder: String(i + 1),
            tabs: {
              signHereTabs: [
                { anchorString: "**signature**", anchorYOffset: "-30", anchorUnits: "pixels" },
              ],
            },
          })),
        },
        status: "sent",
      },
    ) as { envelopeId: string; status: string };

    return {
      id: res.envelopeId,
      name: emailSubject,
      status: res.status,
      signers: signers.map((s) => ({ email: s.email, signed: false })),
    };
  }

  /** @deprecated Use createEnvelopeFromBase64 directly */
  async createDocument(
    _templateId: string,
    signers: Signer[],
    name: string,
    tenantId: string,
  ): Promise<SignatureDocument> {
    return this.createEnvelopeFromTemplate(_templateId, signers, name, tenantId);
  }

  /** Create an envelope from a saved DocuSign template */
  async createEnvelopeFromTemplate(
    templateId: string,
    signers: Signer[],
    emailSubject: string,
    _tenantId: string,
  ): Promise<SignatureDocument> {
    const res = await dsPostCb(
      `${this.baseUrl}/accounts/${this.accountId}/envelopes`,
      this.accessToken,
      {
        templateId,
        emailSubject,
        status: "sent",
        templateRoles: signers.map((s, i) => ({
          roleName: `signer${i + 1}`,
          name: s.name,
          email: s.email,
        })),
      },
    ) as { envelopeId: string; status: string };

    return {
      id: res.envelopeId,
      name: emailSubject,
      status: res.status,
      signers: signers.map((s) => ({ email: s.email, signed: false })),
    };
  }

  async sendForSignature(_documentId: string): Promise<void> {
    // DocuSign envelopes are sent on creation when status="sent"
    return;
  }

  async getStatus(envelopeId: string): Promise<SignatureDocument> {
    const env = await dsGetCb(
      `${this.baseUrl}/accounts/${this.accountId}/envelopes/${envelopeId}`,
      this.accessToken,
    ) as { envelopeId: string; emailSubject: string; status: string };

    const recipientsData = await dsGetCb(
      `${this.baseUrl}/accounts/${this.accountId}/envelopes/${envelopeId}/recipients`,
      this.accessToken,
    ) as { signers: Array<{ email: string; status: string; signedDateTime?: string }> };

    return {
      id: env.envelopeId,
      name: env.emailSubject,
      status: env.status,
      signers: (recipientsData.signers ?? []).map((s) => ({
        email: s.email,
        signed: s.status === "completed",
        signedAt: s.signedDateTime ? new Date(s.signedDateTime) : undefined,
      })),
    };
  }
}
