import {
  ActiveCampaignClient,
  LinkedInAdsClient,
  RDStationMarketingClient,
} from "../clients/marketing.js";
import { ConnectorExecutionError } from "../shared/errors.js";
import { ensureNotDuplicate } from "../shared/idempotency.js";
import { runWithLogging } from "../shared/run.js";
import type {
  ConnectorExecutionContext,
  ConnectorResult,
} from "../shared/types.js";

export async function executeMarketing(
  ctx: ConnectorExecutionContext,
): Promise<ConnectorResult> {
  await ensureNotDuplicate(ctx);

  return runWithLogging(ctx, async () => {
    const secrets = ctx.credentials.secrets;
    const payload = ctx.payload;

    switch (`${ctx.provider}.${ctx.action}`) {
      case "rd-station-marketing.lead.upsert": {
        const client = createRdStationMarketingClient(secrets);
        return {
          upserted: true,
          result: await client.upsertLead({
            email: String(payload.email),
            name: typeof payload.name === "string" ? payload.name : undefined,
            company:
              typeof payload.company === "string" ? payload.company : undefined,
            phone:
              typeof payload.phone === "string" ? payload.phone : undefined,
            tags: Array.isArray(payload.tags) ? payload.tags.map(String) : [],
            customFields: isRecord(payload.customFields)
              ? payload.customFields
              : undefined,
          }),
        };
      }
      case "rd-station-marketing.campaign.trigger": {
        const client = createRdStationMarketingClient(secrets);
        return {
          triggered: true,
          result: await client.triggerEvent(
            String(payload.conversionIdentifier),
            String(payload.email),
            isRecord(payload.extraFields) ? payload.extraFields : {},
          ),
        };
      }
      case "activecampaign.lead.upsert": {
        const client = new ActiveCampaignClient(
          requiredSecret(secrets, "apiKey"),
          requiredSecret(secrets, "accountUrl"),
        );

        return {
          upserted: true,
          result: await client.upsertContact({
            email: String(payload.email),
            firstName:
              typeof payload.firstName === "string"
                ? payload.firstName
                : undefined,
            lastName:
              typeof payload.lastName === "string"
                ? payload.lastName
                : undefined,
            phone:
              typeof payload.phone === "string" ? payload.phone : undefined,
            fieldValues: Array.isArray(payload.fieldValues)
              ? (payload.fieldValues as Array<{ field: string; value: string }>)
              : [],
          }),
        };
      }
      case "activecampaign.event.track": {
        const client = new ActiveCampaignClient(
          requiredSecret(secrets, "apiKey"),
          requiredSecret(secrets, "accountUrl"),
        );

        return {
          tracked: true,
          result: await client.trackEvent(
            String(payload.eventKey),
            String(payload.eventName),
            String(payload.contactEmail),
            isRecord(payload.extraData) ? payload.extraData : undefined,
          ),
        };
      }
      case "linkedin-ads.event.track": {
        const client = createLinkedInAdsClient(secrets);
        return {
          tracked: true,
          result: await client.submitConversionEvent(
            String(payload.adAccountId),
            String(payload.conversionId),
            {
              email: String(payload.email),
              timestamp: Number(payload.timestamp),
              conversionValue:
                typeof payload.conversionValue === "number"
                  ? payload.conversionValue
                  : undefined,
            },
          ),
        };
      }
      default:
        throw new ConnectorExecutionError(
          "UNSUPPORTED_MARKETING_ACTION",
          `Unsupported marketing action: ${ctx.provider}.${ctx.action}`,
          false,
        );
    }
  });
}

function createRdStationMarketingClient(
  secrets: Record<string, string | undefined>,
): RDStationMarketingClient {
  const accessToken = requiredSecret(secrets, "accessToken");
  const baseUrl = secrets.baseUrl;
  return typeof baseUrl === "string"
    ? new RDStationMarketingClient(accessToken, baseUrl)
    : new RDStationMarketingClient(accessToken);
}

function createLinkedInAdsClient(
  secrets: Record<string, string | undefined>,
): LinkedInAdsClient {
  const accessToken = requiredSecret(secrets, "accessToken");
  const baseUrl = secrets.baseUrl;
  return typeof baseUrl === "string"
    ? new LinkedInAdsClient(accessToken, baseUrl)
    : new LinkedInAdsClient(accessToken);
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
