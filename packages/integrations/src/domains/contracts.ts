import {
  AutentiqueClient,
  DocuSignClient,
  ZapSignClient,
} from "../clients/contracts-extended.js";
import type { Signer } from "../clients/signatures.js";
import { ConnectorExecutionError } from "../shared/errors.js";
import { ensureNotDuplicate } from "../shared/idempotency.js";
import { runWithLogging } from "../shared/run.js";
import type {
  ConnectorExecutionContext,
  ConnectorResult,
} from "../shared/types.js";

export async function executeContracts(
  ctx: ConnectorExecutionContext,
): Promise<ConnectorResult> {
  await ensureNotDuplicate(ctx);

  return runWithLogging(ctx, async () => {
    const signers = readSigners(ctx.payload);

    switch (ctx.provider) {
      case "zapsign": {
        const client = createZapSignClient(ctx);

        if (ctx.action === "document.status") {
          return {
            fetched: true,
            result: await client.getStatus(String(ctx.payload.documentId)),
          };
        }

        return {
          requested: true,
          result: await client.createDocument(
            String(ctx.payload.templateId),
            signers,
            String(ctx.payload.path ?? ctx.payload.name ?? "document"),
            ctx.tenantId,
          ),
        };
      }
      case "autentique": {
        const client = createAutentiqueClient(ctx);

        if (ctx.action === "document.status") {
          return {
            fetched: true,
            result: await client.getStatus(String(ctx.payload.documentId)),
          };
        }

        return {
          requested: true,
          result: await client.createDocument(
            String(ctx.payload.templateId ?? ""),
            signers,
            String(ctx.payload.name),
            ctx.tenantId,
          ),
        };
      }
      case "docusign": {
        const client = createDocuSignClient(ctx);

        if (ctx.action === "document.status") {
          return {
            fetched: true,
            result: await client.getStatus(String(ctx.payload.documentId)),
          };
        }

        return {
          requested: true,
          result: await client.createEnvelopeFromBase64(
            String(ctx.payload.pdfBase64),
            signers,
            String(ctx.payload.emailSubject ?? ctx.payload.name ?? "Please sign"),
            ctx.tenantId,
          ),
        };
      }
      default:
        throw new ConnectorExecutionError(
          "UNSUPPORTED_CONTRACT_ACTION",
          `Unsupported contracts action: ${ctx.provider}.${ctx.action}`,
          false,
        );
    }
  });
}

function createZapSignClient(ctx: ConnectorExecutionContext): ZapSignClient {
  const apiToken = requiredSecret(ctx, "apiToken");
  const baseUrl = ctx.credentials.secrets.baseUrl;
  return typeof baseUrl === "string"
    ? new ZapSignClient(apiToken, baseUrl)
    : new ZapSignClient(apiToken);
}

function createAutentiqueClient(
  ctx: ConnectorExecutionContext,
): AutentiqueClient {
  const apiToken = requiredSecret(ctx, "apiToken");
  const baseUrl = ctx.credentials.secrets.baseUrl;
  return typeof baseUrl === "string"
    ? new AutentiqueClient(apiToken, baseUrl)
    : new AutentiqueClient(apiToken);
}

function createDocuSignClient(ctx: ConnectorExecutionContext): DocuSignClient {
  const accessToken = requiredSecret(ctx, "accessToken");
  const accountId = requiredSecret(ctx, "accountId");
  const baseUrl = ctx.credentials.secrets.baseUrl;
  return typeof baseUrl === "string"
    ? new DocuSignClient(accessToken, accountId, baseUrl)
    : new DocuSignClient(accessToken, accountId);
}

function readSigners(payload: Record<string, unknown>): Signer[] {
  if (!Array.isArray(payload.signers)) {
    return [];
  }

  return payload.signers.map((signer) => {
    const value = asRecord(signer);

    return {
      name: String(value.name),
      email: String(value.email),
      phoneNumber:
        typeof value.phoneNumber === "string" ? value.phoneNumber : undefined,
      authMethod:
        value.authMethod === "sms" ||
        value.authMethod === "whatsapp" ||
        value.authMethod === "email"
          ? value.authMethod
          : undefined,
    };
  });
}

function requiredSecret(
  ctx: ConnectorExecutionContext,
  key: string,
): string {
  const value = ctx.credentials.secrets[key];

  if (!value) {
    throw new ConnectorExecutionError(
      "MISSING_CREDENTIAL",
      `Missing credential: ${key}`,
      false,
    );
  }

  return value;
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    const emptyRecord: Record<string, unknown> = {};
    return emptyRecord;
  }

  return value as Record<string, unknown>;
}
