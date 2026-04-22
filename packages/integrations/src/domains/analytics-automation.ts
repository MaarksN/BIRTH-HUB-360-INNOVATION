import {
  GoogleAnalytics4Client,
  MetabaseClient,
  PowerBIClient,
} from "../clients/analytics.js";
import { MakeClient, N8nClient, ZapierClient } from "../clients/automation.js";
import { ConnectorExecutionError } from "../shared/errors.js";
import { ensureNotDuplicate } from "../shared/idempotency.js";
import { runWithLogging } from "../shared/run.js";
import type {
  ConnectorExecutionContext,
  ConnectorResult,
} from "../shared/types.js";

export async function executeAnalyticsAndAutomation(
  ctx: ConnectorExecutionContext,
): Promise<ConnectorResult> {
  await ensureNotDuplicate(ctx);

  return runWithLogging(ctx, async () => {
    const secrets = ctx.credentials.secrets;
    const payload = ctx.payload;

    switch (`${ctx.provider}.${ctx.action}`) {
      case "ga4.event.track": {
        const client = new GoogleAnalytics4Client(
          requiredSecret(secrets, "measurementId"),
          requiredSecret(secrets, "apiSecret"),
          requiredSecret(secrets, "propertyId"),
          secrets.dataApiToken,
        );

        return {
          tracked: true,
          result: await client.sendEvent(String(payload.clientId), [
            {
              name: String(payload.name),
              params: isRecord(payload.params)
                ? (payload.params as Record<
                    string,
                    string | number | boolean
                  >)
                : {},
            },
          ]),
        };
      }
      case "power-bi.report.run": {
        const client = createPowerBiClient(secrets);
        return {
          ran: true,
          result: await client.listReports(String(payload.workspaceId)),
        };
      }
      case "metabase.report.run": {
        const client = new MetabaseClient(
          requiredSecret(secrets, "username"),
          requiredSecret(secrets, "password"),
          requiredSecret(secrets, "baseUrl"),
        );

        await client.authenticate();

        return {
          ran: true,
          result: await client.runQuestion(
            Number(payload.cardId),
            Array.isArray(payload.parameters) ? payload.parameters : [],
          ),
        };
      }
      case "make.workflow.trigger":
        return {
          triggered: true,
          result: await MakeClient.triggerWebhook(
            requiredSecret(secrets, "webhookUrl"),
            isRecord(payload.data) ? payload.data : {},
          ),
        };
      case "zapier.workflow.trigger":
        return {
          triggered: true,
          result: await ZapierClient.triggerWebhook(
            requiredSecret(secrets, "webhookUrl"),
            isRecord(payload.data) ? payload.data : {},
          ),
        };
      case "n8n.workflow.trigger":
        return {
          triggered: true,
          result: await N8nClient.triggerWebhook(
            requiredSecret(secrets, "webhookPath"),
            requiredSecret(secrets, "n8nBaseUrl"),
            isRecord(payload.data) ? payload.data : {},
            payload.method === "GET" ? "GET" : "POST",
          ),
        };
      default:
        throw new ConnectorExecutionError(
          "UNSUPPORTED_ANALYTICS_AUTOMATION_ACTION",
          `Unsupported action: ${ctx.provider}.${ctx.action}`,
          false,
        );
    }
  });
}

function createPowerBiClient(
  secrets: Record<string, string | undefined>,
): PowerBIClient {
  const accessToken = requiredSecret(secrets, "accessToken");
  const baseUrl = secrets.baseUrl;
  return typeof baseUrl === "string"
    ? new PowerBIClient(accessToken, baseUrl)
    : new PowerBIClient(accessToken);
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
