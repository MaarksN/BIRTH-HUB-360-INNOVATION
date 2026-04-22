import {
  HubspotCrmAdapter,
  type HubspotAdapterFetch
} from "@birthub/integrations/hubspot-crm-adapter";
import {
  OmieErpAdapter,
  type OmieAdapterFetch,
  type OmieCustomerUpsertInput,
  type OmieSalesOrderCreateInput
} from "@birthub/integrations/omie-erp-adapter";
import {
  SlackMessageAdapter,
  type SlackAdapterFetch,
  type SlackMessageSendInput
} from "@birthub/integrations/slack-message-adapter";
import {
  StripePaymentAdapter,
  type StripePaymentAdapterFetch
} from "@birthub/integrations/stripe-payment-adapter";
import {
  ZenviaMessageAdapter,
  type ZenviaAdapterFetch,
  type ZenviaMessageSendInput
} from "@birthub/integrations/zenvia-message-adapter";

import { ensureConnectorExecutionError } from "./errors.js";
import type {
  ConnectorActionHandler,
  ConnectorActionName,
  ConnectorExecutionRequest,
  ConnectorExecutionResult,
  ConnectorRuntimeDependencies
} from "./types.js";

function handlerKey(input: { action: string; provider: string }): string {
  return `${input.provider}:${input.action}`;
}

function resolveHubspotFetch(
  dependencies: ConnectorRuntimeDependencies
): HubspotAdapterFetch | undefined {
  return dependencies.fetchImpl as HubspotAdapterFetch | undefined;
}

function resolveOmieFetch(
  dependencies: ConnectorRuntimeDependencies
): OmieAdapterFetch | undefined {
  return dependencies.fetchImpl as OmieAdapterFetch | undefined;
}

function resolveSlackFetch(
  dependencies: ConnectorRuntimeDependencies
): SlackAdapterFetch | undefined {
  return dependencies.fetchImpl as SlackAdapterFetch | undefined;
}

function resolveStripeFetch(
  dependencies: ConnectorRuntimeDependencies
): StripePaymentAdapterFetch | undefined {
  return dependencies.fetchImpl as StripePaymentAdapterFetch | undefined;
}

function resolveZenviaFetch(
  dependencies: ConnectorRuntimeDependencies
): ZenviaAdapterFetch | undefined {
  return dependencies.fetchImpl as ZenviaAdapterFetch | undefined;
}

class MissingConnectorHandlerError extends Error {
  constructor(provider: string, action: string) {
    super(`No connector handler registered for ${provider}:${action}.`);
    this.name = "MissingConnectorHandlerError";
  }
}

class MissingConnectorCredentialError extends Error {
  constructor(provider: string, credentialType: string) {
    super(`Missing ${credentialType} credential for connector provider ${provider}.`);
    this.name = "MissingConnectorCredentialError";
  }
}

export class ConnectorRuntime {
  private readonly handlers = new Map<string, ConnectorActionHandler>();

  constructor(handlers: ConnectorActionHandler[] = []) {
    for (const handler of handlers) {
      this.register(handler);
    }
  }

  register(handler: ConnectorActionHandler): void {
    this.handlers.set(handlerKey(handler), handler);
  }

  async execute<Action extends ConnectorActionName>(
    request: ConnectorExecutionRequest<Action>
  ): Promise<ConnectorExecutionResult> {
    const handler = this.handlers.get(handlerKey(request));
    if (!handler) {
      throw new MissingConnectorHandlerError(request.provider, request.action);
    }

    try {
      return await handler.execute(request as ConnectorExecutionRequest);
    } catch (error) {
      throw ensureConnectorExecutionError(error, {
        action: request.action,
        provider: request.provider
      });
    }
  }
}

export function createHubspotContactUpsertHandler(
  dependencies: ConnectorRuntimeDependencies = {}
): ConnectorActionHandler<"crm.contact.upsert"> {
  return {
    action: "crm.contact.upsert",
    provider: "hubspot",
    async execute(request) {
      const accessToken = request.credentials.accessToken ?? request.credentials.apiKey;
      if (!accessToken) {
        throw new MissingConnectorCredentialError("hubspot", "accessToken");
      }

      const adapter = new HubspotCrmAdapter({
        accessToken,
        ...(request.credentials.baseUrl ? { baseUrl: request.credentials.baseUrl } : {}),
        ...(dependencies.fetchImpl ? { fetchImpl: resolveHubspotFetch(dependencies) } : {})
      });
      const response = await adapter.upsertContact(request.payload);

      return {
        action: request.action,
        externalId: response.objectId,
        provider: request.provider,
        request: response.request,
        response: response.body,
        status: "success",
        statusCode: response.status
      };
    }
  };
}

export function createHubspotCompanyUpsertHandler(
  dependencies: ConnectorRuntimeDependencies = {}
): ConnectorActionHandler<"crm.company.upsert"> {
  return {
    action: "crm.company.upsert",
    provider: "hubspot",
    async execute(request) {
      const accessToken = request.credentials.accessToken ?? request.credentials.apiKey;
      if (!accessToken) {
        throw new MissingConnectorCredentialError("hubspot", "accessToken");
      }

      const adapter = new HubspotCrmAdapter({
        accessToken,
        ...(request.credentials.baseUrl ? { baseUrl: request.credentials.baseUrl } : {}),
        ...(dependencies.fetchImpl ? { fetchImpl: resolveHubspotFetch(dependencies) } : {})
      });
      const response = await adapter.upsertCompany(request.payload);

      return {
        action: request.action,
        externalId: response.objectId,
        provider: request.provider,
        request: response.request,
        response: response.body,
        status: "success",
        statusCode: response.status
      };
    }
  };
}

export function createSlackMessageSendHandler(
  dependencies: ConnectorRuntimeDependencies = {}
): ConnectorActionHandler<"message.send"> {
  return {
    action: "message.send",
    provider: "slack",
    async execute(request) {
      const accessToken =
        request.credentials.botToken ??
        request.credentials.accessToken ??
        request.credentials.apiKey;
      if (!accessToken) {
        throw new MissingConnectorCredentialError("slack", "botToken");
      }

      const adapter = new SlackMessageAdapter({
        accessToken,
        ...(request.credentials.baseUrl ? { baseUrl: request.credentials.baseUrl } : {}),
        ...(dependencies.fetchImpl ? { fetchImpl: resolveSlackFetch(dependencies) } : {})
      });
      const response = await adapter.sendMessage(request.payload as SlackMessageSendInput);

      return {
        action: request.action,
        externalId: response.messageTs,
        provider: request.provider,
        request: response.request,
        response: response.body,
        status: "success",
        statusCode: response.status
      };
    }
  };
}

export function createOmieCustomerUpsertHandler(
  dependencies: ConnectorRuntimeDependencies = {}
): ConnectorActionHandler<"erp.customer.upsert"> {
  return {
    action: "erp.customer.upsert",
    provider: "omie",
    async execute(request) {
      const appKey = request.credentials.appKey ?? request.credentials.apiKey;
      const appSecret = request.credentials.appSecret ?? request.credentials.accessToken;
      if (!appKey) {
        throw new MissingConnectorCredentialError("omie", "appKey");
      }

      if (!appSecret) {
        throw new MissingConnectorCredentialError("omie", "appSecret");
      }

      const adapter = new OmieErpAdapter({
        appKey,
        appSecret,
        ...(request.credentials.baseUrl ? { baseUrl: request.credentials.baseUrl } : {}),
        ...(dependencies.fetchImpl ? { fetchImpl: resolveOmieFetch(dependencies) } : {})
      });
      const response = await adapter.upsertCustomer(request.payload as OmieCustomerUpsertInput);

      return {
        action: request.action,
        externalId: response.externalId,
        provider: request.provider,
        request: response.request,
        response: response.body,
        status: "success",
        statusCode: response.status
      };
    }
  };
}

export function createOmieSalesOrderCreateHandler(
  dependencies: ConnectorRuntimeDependencies = {}
): ConnectorActionHandler<"erp.sales-order.create"> {
  return {
    action: "erp.sales-order.create",
    provider: "omie",
    async execute(request) {
      const appKey = request.credentials.appKey ?? request.credentials.apiKey;
      const appSecret = request.credentials.appSecret ?? request.credentials.accessToken;
      if (!appKey) {
        throw new MissingConnectorCredentialError("omie", "appKey");
      }

      if (!appSecret) {
        throw new MissingConnectorCredentialError("omie", "appSecret");
      }

      const adapter = new OmieErpAdapter({
        appKey,
        appSecret,
        ...(request.credentials.baseUrl ? { baseUrl: request.credentials.baseUrl } : {}),
        ...(dependencies.fetchImpl ? { fetchImpl: resolveOmieFetch(dependencies) } : {})
      });
      const response = await adapter.createSalesOrder(request.payload as OmieSalesOrderCreateInput);

      return {
        action: request.action,
        externalId: response.externalId,
        provider: request.provider,
        request: response.request,
        response: response.body,
        status: "success",
        statusCode: response.status
      };
    }
  };
}

export function createStripePaymentReadHandler(
  dependencies: ConnectorRuntimeDependencies = {}
): ConnectorActionHandler<"payment.read"> {
  return {
    action: "payment.read",
    provider: "stripe",
    async execute(request) {
      const apiKey = request.credentials.apiKey;
      if (!apiKey) {
        throw new MissingConnectorCredentialError("stripe", "apiKey");
      }

      const adapter = new StripePaymentAdapter({
        apiKey,
        ...(request.credentials.baseUrl ? { baseUrl: request.credentials.baseUrl } : {}),
        ...(dependencies.fetchImpl ? { fetchImpl: resolveStripeFetch(dependencies) } : {})
      });
      const response = await adapter.readPayment(request.payload);

      return {
        action: request.action,
        externalId: response.objectId,
        provider: request.provider,
        request: response.request,
        response: response.body,
        status: "success",
        statusCode: response.status
      };
    }
  };
}

export function createZenviaMessageSendHandler(
  dependencies: ConnectorRuntimeDependencies = {}
): ConnectorActionHandler<"message.send"> {
  return {
    action: "message.send",
    provider: "zenvia",
    async execute(request) {
      const apiToken = request.credentials.apiKey ?? request.credentials.accessToken;
      if (!apiToken) {
        throw new MissingConnectorCredentialError("zenvia", "apiKey");
      }

      const adapter = new ZenviaMessageAdapter({
        apiToken,
        ...(request.credentials.baseUrl ? { baseUrl: request.credentials.baseUrl } : {}),
        ...(dependencies.fetchImpl ? { fetchImpl: resolveZenviaFetch(dependencies) } : {})
      });
      const response = await adapter.sendMessage(request.payload as ZenviaMessageSendInput);

      return {
        action: request.action,
        externalId: response.messageId ?? response.externalId,
        provider: request.provider,
        request: response.request,
        response: response.body,
        status: "success",
        statusCode: response.status
      };
    }
  };
}

export function createDefaultConnectorRuntime(
  dependencies: ConnectorRuntimeDependencies = {}
): ConnectorRuntime {
  return new ConnectorRuntime([
    createHubspotCompanyUpsertHandler(dependencies),
    createHubspotContactUpsertHandler(dependencies),
    createOmieCustomerUpsertHandler(dependencies),
    createOmieSalesOrderCreateHandler(dependencies),
    createSlackMessageSendHandler(dependencies),
    createStripePaymentReadHandler(dependencies),
    createZenviaMessageSendHandler(dependencies)
  ]);
}

export function createHubspotHealthCheckHandler(dependencies: ConnectorRuntimeDependencies = {}): ConnectorActionHandler<"health.check"> {
  return {
    action: "health.check",
    provider: "hubspot",
    async execute(request) {
      const accessToken = request.credentials.accessToken ?? request.credentials.apiKey;
      if (!accessToken) throw new MissingConnectorCredentialError("hubspot", "accessToken");
      const adapter = new HubspotCrmAdapter({
        accessToken,
        ...(request.credentials.baseUrl ? { baseUrl: request.credentials.baseUrl } : {}),
        ...(dependencies.fetchImpl ? { fetchImpl: resolveHubspotFetch(dependencies) } : {})
      });
      if (request.metadata?.credentialType === "apiKey") {
        await adapter.validateCrmAccess();
      } else {
        await adapter.validateAccessToken();
      }
      return { action: request.action, provider: request.provider, status: "success" };
    }
  };
}

export function createOmieHealthCheckHandler(dependencies: ConnectorRuntimeDependencies = {}): ConnectorActionHandler<"health.check"> {
  return {
    action: "health.check",
    provider: "omie",
    async execute(request) {
      const appKey = request.credentials.appKey ?? request.credentials.apiKey;
      const appSecret = request.credentials.appSecret ?? request.credentials.accessToken;
      if (!appKey) throw new MissingConnectorCredentialError("omie", "appKey");
      if (!appSecret) throw new MissingConnectorCredentialError("omie", "appSecret");
      const adapter = new OmieErpAdapter({
        appKey,
        appSecret,
        ...(request.credentials.baseUrl ? { baseUrl: request.credentials.baseUrl } : {}),
        ...(dependencies.fetchImpl ? { fetchImpl: resolveOmieFetch(dependencies) } : {})
      });
      await adapter.validateCredentials();
      return { action: request.action, provider: request.provider, status: "success" };
    }
  };
}

export function createSlackHealthCheckHandler(dependencies: ConnectorRuntimeDependencies = {}): ConnectorActionHandler<"health.check"> {
  return {
    action: "health.check",
    provider: "slack",
    async execute(request) {
      const accessToken = request.credentials.botToken ?? request.credentials.accessToken ?? request.credentials.apiKey;
      if (!accessToken) throw new MissingConnectorCredentialError("slack", "botToken");
      const adapter = new SlackMessageAdapter({
        accessToken,
        ...(request.credentials.baseUrl ? { baseUrl: request.credentials.baseUrl } : {}),
        ...(dependencies.fetchImpl ? { fetchImpl: resolveSlackFetch(dependencies) } : {})
      });
      await adapter.validateAccessToken();
      return { action: request.action, provider: request.provider, status: "success" };
    }
  };
}

export function createStripeHealthCheckHandler(dependencies: ConnectorRuntimeDependencies = {}): ConnectorActionHandler<"health.check"> {
  return {
    action: "health.check",
    provider: "stripe",
    async execute(request) {
      const apiKey = request.credentials.apiKey;
      if (!apiKey) throw new MissingConnectorCredentialError("stripe", "apiKey");
      const adapter = new StripePaymentAdapter({
        apiKey,
        ...(request.credentials.baseUrl ? { baseUrl: request.credentials.baseUrl } : {}),
        ...(dependencies.fetchImpl ? { fetchImpl: resolveStripeFetch(dependencies) } : {})
      });
      await adapter.validateApiKey();
      return { action: request.action, provider: request.provider, status: "success" };
    }
  };
}

export function createZenviaHealthCheckHandler(dependencies: ConnectorRuntimeDependencies = {}): ConnectorActionHandler<"health.check"> {
  return {
    action: "health.check",
    provider: "zenvia",
    async execute(request) {
      const apiToken = request.credentials.apiKey ?? request.credentials.accessToken;
      if (!apiToken) throw new MissingConnectorCredentialError("zenvia", "apiKey");
      const adapter = new ZenviaMessageAdapter({
        apiToken,
        ...(request.credentials.baseUrl ? { baseUrl: request.credentials.baseUrl } : {}),
        ...(dependencies.fetchImpl ? { fetchImpl: resolveZenviaFetch(dependencies) } : {})
      });
      await adapter.validateApiToken();
      return { action: request.action, provider: request.provider, status: "success" };
    }
  };
}

export function createDefaultConnectorRuntime(dependencies: ConnectorRuntimeDependencies = {}): ConnectorRuntime {
  return new ConnectorRuntime([
    createHubspotCompanyUpsertHandler(dependencies),
    createHubspotContactUpsertHandler(dependencies),
    createHubspotHealthCheckHandler(dependencies),
    createOmieCustomerUpsertHandler(dependencies),
    createOmieSalesOrderCreateHandler(dependencies),
    createOmieHealthCheckHandler(dependencies),
    createSlackMessageSendHandler(dependencies),
    createSlackHealthCheckHandler(dependencies),
    createStripePaymentReadHandler(dependencies),
    createStripeHealthCheckHandler(dependencies),
    createZenviaMessageSendHandler(dependencies),
    createZenviaHealthCheckHandler(dependencies)
  ]);
}
