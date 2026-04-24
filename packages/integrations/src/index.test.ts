
// 
import assert from "node:assert/strict";
import test from "node:test";

import {
  AsaasClient,
  ConnectorExecutionError,
  CRMAdapterFactory,
  GoogleCalendarClient,
  GoogleAnalytics4Client,
  HubspotClient,
  MakeClient,
  PagarmeClient,
  RDStationMarketingClient,
  buildIdempotencyKey,
  canonicalIntegrationDomains,
  executeAnalyticsAndAutomation,
  executeCommunicationAndCrm,
  executeContracts,
  executeCustomerSuccess,
  executeErp,
  executeMarketing,
  executePayments,
  executeProspecting,
  getConnectorProviderDefinition,
  isConnectorProviderSlug,
  listImplementedConnectorProviders
} from "./index.js";

void test("integrations entrypoint exposes critical clients and adapters", () => {
  assert.equal(typeof HubspotClient, "function");
  assert.equal(typeof PagarmeClient, "function");
  assert.equal(typeof AsaasClient, "function");
  assert.equal(typeof GoogleCalendarClient, "function");
  assert.equal(typeof GoogleAnalytics4Client, "function");
  assert.equal(typeof RDStationMarketingClient, "function");
  assert.equal(typeof MakeClient, "function");
  assert.equal(typeof executeCommunicationAndCrm, "function");
  assert.equal(typeof executePayments, "function");
  assert.equal(typeof executeErp, "function");
  assert.equal(typeof executeMarketing, "function");
  assert.equal(typeof executeCustomerSuccess, "function");
  assert.equal(typeof executeContracts, "function");
  assert.equal(typeof executeProspecting, "function");
  assert.equal(typeof executeAnalyticsAndAutomation, "function");
  assert.equal(typeof buildIdempotencyKey, "function");
  assert.equal(typeof ConnectorExecutionError, "function");
  assert.equal(typeof CRMAdapterFactory, "function");
});

void test("provider catalog exposes implemented anchors and validates slugs", () => {
  assert.equal(isConnectorProviderSlug("hubspot"), true);
  assert.equal(isConnectorProviderSlug("omie"), true);
  assert.equal(isConnectorProviderSlug("slack"), true);
  assert.equal(isConnectorProviderSlug("unknown-provider"), false);

  const hubspot = getConnectorProviderDefinition("hubspot");
  assert.equal(hubspot.displayName, "HubSpot");
  assert.equal(hubspot.anchor, true);
  assert.equal(hubspot.defaultAuthType, "oauth");

  const implementedProviders = listImplementedConnectorProviders();
  assert.deepEqual(
    implementedProviders.map((provider) => provider.slug).sort(),
    ["hubspot", "omie", "slack", "stripe", "zenvia"]
  );
  assert.equal(getConnectorProviderDefinition("google-workspace").implementationStage, "client_only");
  assert.equal(implementedProviders.some((provider) => provider.slug === "omie"), true);
  assert.equal(implementedProviders.some((provider) => provider.slug === "slack"), true);
  assert.equal(implementedProviders.some((provider) => provider.slug === "stripe"), true);
  assert.equal(implementedProviders.some((provider) => provider.slug === "twilio-whatsapp"), false);
  assert.equal(implementedProviders.some((provider) => provider.slug === "zenvia"), true);
});

void test("canonical domains include the main integration surfaces", () => {
  assert.deepEqual(canonicalIntegrationDomains.includes("crm"), true);
  assert.deepEqual(canonicalIntegrationDomains.includes("payments"), true);
  assert.deepEqual(canonicalIntegrationDomains.includes("automation"), true);
});

void test("idempotency helper builds stable keys for the runtime layer", () => {
  const key = buildIdempotencyKey({
    tenantId: "tenant_1",
    provider: "asaas",
    action: "pix.create",
    eventId: "evt_1",
    externalEventId: "ext_1",
    credentials: {
      provider: "asaas",
      tenantId: "tenant_1",
      secrets: {}
    },
    payload: {}
  });

  assert.equal(key, "tenant_1:asaas:pix.create:ext_1");
});
