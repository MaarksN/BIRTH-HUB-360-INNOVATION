import {
  AgendorClient,
  RDStationCRMClient,
} from "../clients/crm-extended.js";
import {
  TakeBlipClient,
  WhatsAppBusinessApiClient,
  ZendeskClient,
} from "../clients/messaging-extended.js";
import { ConnectorExecutionError } from "../shared/errors.js";
import { ensureNotDuplicate } from "../shared/idempotency.js";
import { runWithLogging } from "../shared/run.js";
import type {
  ConnectorExecutionContext,
  ConnectorResult,
} from "../shared/types.js";

export async function executeCommunicationAndCrm(
  ctx: ConnectorExecutionContext,
): Promise<ConnectorResult> {
  await ensureNotDuplicate(ctx);

  return runWithLogging(ctx, async () => {
    const secrets = ctx.credentials.secrets;
    const payload = ctx.payload;

    switch (`${ctx.provider}.${ctx.action}`) {
      case "whatsapp-business-api.whatsapp.send": {
        const client = createWhatsappBusinessClient(secrets);
        return {
          sent: true,
          result: await client.sendText({
            to: String(payload.to),
            text: String(payload.text),
            previewUrl: Boolean(payload.previewUrl ?? false),
          }),
        };
      }
      case "zendesk.zendesk.ticket.create": {
        const client = new ZendeskClient(
          requiredSecret(secrets, "subdomain"),
          requiredSecret(secrets, "email"),
          requiredSecret(secrets, "apiToken"),
        );

        return {
          created: true,
          result: await client.createTicket({
            subject: String(payload.subject),
            body: String(payload.body),
            requesterEmail: String(payload.requesterEmail),
            requesterName:
              typeof payload.requesterName === "string"
                ? payload.requesterName
                : undefined,
            priority: payload.priority as
              | "urgent"
              | "high"
              | "normal"
              | "low"
              | undefined,
            tags: Array.isArray(payload.tags) ? payload.tags.map(String) : [],
          }),
        };
      }
      case "take-blip.blip.message.send": {
        const client = createTakeBlipClient(secrets);
        return {
          sent: true,
          result: await client.sendMessage(
            String(payload.to),
            String(payload.text),
          ),
        };
      }
      case "rd-station-crm.rdcrm.deal.create": {
        const client = createRdStationCrmClient(secrets);
        return {
          created: true,
          result: await client.createDeal({
            name: String(payload.name),
            amount:
              typeof payload.amount === "number"
                ? payload.amount
                : undefined,
            win:
              typeof payload.win === "boolean" ? payload.win : undefined,
            userId:
              typeof payload.userId === "string" ? payload.userId : undefined,
            contactId:
              typeof payload.contactId === "string"
                ? payload.contactId
                : undefined,
            campaignId:
              typeof payload.campaignId === "string"
                ? payload.campaignId
                : undefined,
            customFields: isRecord(payload.customFields)
              ? payload.customFields
              : undefined,
          }),
        };
      }
      case "agendor.agendor.deal.create": {
        const client = createAgendorClient(secrets);
        return {
          created: true,
          result: await client.createDeal({
            title: String(payload.title),
            value:
              typeof payload.value === "number" ? payload.value : undefined,
            personId:
              typeof payload.personId === "number"
                ? payload.personId
                : undefined,
            organizationId:
              typeof payload.organizationId === "number"
                ? payload.organizationId
                : undefined,
            funnelId:
              typeof payload.funnelId === "number"
                ? payload.funnelId
                : undefined,
            stageId:
              typeof payload.stageId === "number"
                ? payload.stageId
                : undefined,
            dealStatusText:
              typeof payload.dealStatusText === "string"
                ? payload.dealStatusText
                : undefined,
          }),
        };
      }
      default:
        throw new ConnectorExecutionError(
          "UNSUPPORTED_COMMUNICATION_OR_CRM_ACTION",
          `Unsupported action: ${ctx.provider}.${ctx.action}`,
          false,
        );
    }
  });
}

function createWhatsappBusinessClient(
  secrets: Record<string, string | undefined>,
): WhatsAppBusinessApiClient {
  const accessToken = requiredSecret(secrets, "accessToken");
  const phoneNumberId = requiredSecret(secrets, "phoneNumberId");
  const baseUrl = secrets.baseUrl;
  return typeof baseUrl === "string"
    ? new WhatsAppBusinessApiClient(accessToken, phoneNumberId, baseUrl)
    : new WhatsAppBusinessApiClient(accessToken, phoneNumberId);
}

function createTakeBlipClient(
  secrets: Record<string, string | undefined>,
): TakeBlipClient {
  const authorizationKey = requiredSecret(secrets, "authorizationKey");
  const baseUrl = secrets.baseUrl;
  return typeof baseUrl === "string"
    ? new TakeBlipClient(authorizationKey, baseUrl)
    : new TakeBlipClient(authorizationKey);
}

function createRdStationCrmClient(
  secrets: Record<string, string | undefined>,
): RDStationCRMClient {
  const apiKey = requiredSecret(secrets, "apiKey");
  const baseUrl = secrets.baseUrl;
  return typeof baseUrl === "string"
    ? new RDStationCRMClient(apiKey, baseUrl)
    : new RDStationCRMClient(apiKey);
}

function createAgendorClient(
  secrets: Record<string, string | undefined>,
): AgendorClient {
  const apiToken = requiredSecret(secrets, "apiToken");
  const baseUrl = secrets.baseUrl;
  return typeof baseUrl === "string"
    ? new AgendorClient(apiToken, baseUrl)
    : new AgendorClient(apiToken);
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
