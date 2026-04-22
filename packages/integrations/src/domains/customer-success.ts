import {
  IntercomClient,
  SenseDataClient,
} from "../clients/customer-success.js";
import { ConnectorExecutionError } from "../shared/errors.js";
import { ensureNotDuplicate } from "../shared/idempotency.js";
import { runWithLogging } from "../shared/run.js";
import type {
  ConnectorExecutionContext,
  ConnectorResult,
} from "../shared/types.js";

export async function executeCustomerSuccess(
  ctx: ConnectorExecutionContext,
): Promise<ConnectorResult> {
  await ensureNotDuplicate(ctx);

  return runWithLogging(ctx, async () => {
    const secrets = ctx.credentials.secrets;
    const payload = ctx.payload;

    switch (`${ctx.provider}.${ctx.action}`) {
      case "sensedata.customer.upsert": {
        const client = createSenseDataClient(secrets);
        return {
          upserted: true,
          result: await client.upsertCustomer({
            externalId: String(payload.externalId),
            name: String(payload.name),
            email: typeof payload.email === "string" ? payload.email : undefined,
            healthScore:
              typeof payload.healthScore === "number"
                ? payload.healthScore
                : undefined,
            plan: typeof payload.plan === "string" ? payload.plan : undefined,
            mrr: typeof payload.mrr === "number" ? payload.mrr : undefined,
            tags: Array.isArray(payload.tags) ? payload.tags.map(String) : [],
            customFields: isRecord(payload.customFields)
              ? payload.customFields
              : undefined,
          }),
        };
      }
      case "sensedata.health.update": {
        const client = createSenseDataClient(secrets);
        return {
          updated: true,
          result: await client.updateHealthScore(
            String(payload.externalId),
            Number(payload.score),
            typeof payload.reason === "string" ? payload.reason : undefined,
          ),
        };
      }
      case "intercom.customer.upsert": {
        const client = createIntercomClient(secrets);
        return {
          upserted: true,
          result: await client.upsertContact({
            external_id: String(payload.external_id),
            email:
              typeof payload.email === "string" ? payload.email : undefined,
            name: typeof payload.name === "string" ? payload.name : undefined,
            phone:
              typeof payload.phone === "string" ? payload.phone : undefined,
            role: payload.role === "lead" ? "lead" : "user",
            custom_attributes: isRecord(payload.custom_attributes)
              ? payload.custom_attributes
              : undefined,
          }),
        };
      }
      case "intercom.message.send": {
        const client = createIntercomClient(secrets);
        return {
          sent: true,
          result: await client.sendMessage({
            from: { type: "admin", id: String(payload.adminId) },
            to: {
              type: payload.toType === "lead" ? "lead" : "user",
              id: String(payload.contactId),
            },
            body: String(payload.body),
            messageType:
              payload.messageType === "email" ? "email" : "inapp",
            subject:
              typeof payload.subject === "string"
                ? payload.subject
                : undefined,
          }),
        };
      }
      default:
        throw new ConnectorExecutionError(
          "UNSUPPORTED_CUSTOMER_SUCCESS_ACTION",
          `Unsupported action: ${ctx.provider}.${ctx.action}`,
          false,
        );
    }
  });
}

function createSenseDataClient(
  secrets: Record<string, string | undefined>,
): SenseDataClient {
  const apiToken = requiredSecret(secrets, "apiToken");
  const baseUrl = secrets.baseUrl;
  return typeof baseUrl === "string"
    ? new SenseDataClient(apiToken, baseUrl)
    : new SenseDataClient(apiToken);
}

function createIntercomClient(
  secrets: Record<string, string | undefined>,
): IntercomClient {
  const accessToken = requiredSecret(secrets, "accessToken");
  const baseUrl = secrets.baseUrl;
  return typeof baseUrl === "string"
    ? new IntercomClient(accessToken, baseUrl)
    : new IntercomClient(accessToken);
}

function requiredSecret(
  secrets: Record<string, string | undefined>,
  key: string,
): string {
  const value = secrets[key];

  if (!value) {
    throw new ConnectorExecutionError(
      "MISSING_CREDENTIAL",
      `Missing credential: ${key}`,
      false,
    );
  }

  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
