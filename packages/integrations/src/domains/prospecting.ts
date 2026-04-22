import {
  ApolloClient,
  EconodataClient,
  NeowayClient,
} from "../clients/prospecting.js";
import { ConnectorExecutionError } from "../shared/errors.js";
import { ensureNotDuplicate } from "../shared/idempotency.js";
import { runWithLogging } from "../shared/run.js";
import type {
  ConnectorExecutionContext,
  ConnectorResult,
} from "../shared/types.js";

export async function executeProspecting(
  ctx: ConnectorExecutionContext,
): Promise<ConnectorResult> {
  await ensureNotDuplicate(ctx);

  return runWithLogging(ctx, async () => {
    const secrets = ctx.credentials.secrets;
    const payload = ctx.payload;

    switch (`${ctx.provider}.${ctx.action}`) {
      case "econodata.company.enrich": {
        const client = createEconodataClient(secrets);
        return {
          enriched: true,
          result: await client.enrichByCnpj(String(payload.cnpj)),
        };
      }
      case "econodata.lead.search": {
        const client = createEconodataClient(secrets);
        return {
          searched: true,
          result: await client.searchCompanies({
            city: typeof payload.city === "string" ? payload.city : undefined,
            state:
              typeof payload.state === "string" ? payload.state : undefined,
            cnae: typeof payload.cnae === "string" ? payload.cnae : undefined,
            employeeCount:
              typeof payload.employeeCount === "string"
                ? payload.employeeCount
                : undefined,
            page: typeof payload.page === "number" ? payload.page : undefined,
            limit:
              typeof payload.limit === "number" ? payload.limit : undefined,
          }),
        };
      }
      case "neoway.company.enrich": {
        const client = createNeowayClient(secrets);
        return {
          enriched: true,
          result: await client.enrichCompany(String(payload.cnpj)),
        };
      }
      case "apollo-io.lead.search": {
        const client = createApolloClient(secrets);
        return {
          searched: true,
          result: await client.searchPeople({
            personTitles: Array.isArray(payload.personTitles)
              ? payload.personTitles.map(String)
              : [],
            personLocations: Array.isArray(payload.personLocations)
              ? payload.personLocations.map(String)
              : [],
            organizationLocations: Array.isArray(payload.organizationLocations)
              ? payload.organizationLocations.map(String)
              : [],
            organizationNumEmployeesRanges: Array.isArray(
              payload.organizationNumEmployeesRanges,
            )
              ? payload.organizationNumEmployeesRanges.map(String)
              : [],
            organizationIndustryTagIds: Array.isArray(
              payload.organizationIndustryTagIds,
            )
              ? payload.organizationIndustryTagIds.map(String)
              : [],
            q_keywords:
              typeof payload.q_keywords === "string"
                ? payload.q_keywords
                : undefined,
            page: typeof payload.page === "number" ? payload.page : undefined,
            perPage:
              typeof payload.perPage === "number"
                ? payload.perPage
                : undefined,
          }),
        };
      }
      default:
        throw new ConnectorExecutionError(
          "UNSUPPORTED_PROSPECTING_ACTION",
          `Unsupported prospecting action: ${ctx.provider}.${ctx.action}`,
          false,
        );
    }
  });
}

function createEconodataClient(
  secrets: Record<string, string | undefined>,
): EconodataClient {
  const apiKey = requiredSecret(secrets, "apiKey");
  const baseUrl = secrets.baseUrl;
  return typeof baseUrl === "string"
    ? new EconodataClient(apiKey, baseUrl)
    : new EconodataClient(apiKey);
}

function createNeowayClient(
  secrets: Record<string, string | undefined>,
): NeowayClient {
  const apiToken = requiredSecret(secrets, "apiToken");
  const baseUrl = secrets.baseUrl;
  return typeof baseUrl === "string"
    ? new NeowayClient(apiToken, baseUrl)
    : new NeowayClient(apiToken);
}

function createApolloClient(
  secrets: Record<string, string | undefined>,
): ApolloClient {
  const apiKey = requiredSecret(secrets, "apiKey");
  const baseUrl = secrets.baseUrl;
  return typeof baseUrl === "string"
    ? new ApolloClient(apiKey, baseUrl)
    : new ApolloClient(apiKey);
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
