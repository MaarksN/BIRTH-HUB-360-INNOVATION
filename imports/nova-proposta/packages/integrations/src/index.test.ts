
// 
import assert from "node:assert/strict";
import test from "node:test";

import {
  CRMAdapterFactory,
  GoogleCalendarClient,
  HubspotClient,
  PagarmeClient,
  WebhookRegistry,
  canonicalIntegrationDomains,
  getConnectorProviderDefinition,
  isConnectorProviderSlug,
  listImplementedConnectorProviders
} from "./index.js";

void test("integrations entrypoint exposes critical clients and adapters", () => {
  assert.equal(typeof HubspotClient, "function");
  assert.equal(typeof PagarmeClient, "function");
  assert.equal(typeof GoogleCalendarClient, "function");
  assert.equal(typeof CRMAdapterFactory, "function");
  assert.equal(typeof WebhookRegistry, "function");
});

void test("webhook registry signs and verifies payloads", () => {
  const registry = new WebhookRegistry();
  const endpoint = registry.register("tenant_1", {
    eventTypes: ["billing.updated"],
    secret: "test-secret-placeholder",
    url: "https://birthhub.test/hooks"
  });
  const payload = JSON.stringify({ ok: true });
  const signature = registry.createSignature(endpoint, payload);

  assert.equal(registry.verifySignature(endpoint, payload, signature), true);
  assert.equal(registry.verifySignature(endpoint, payload, "invalid"), false);
});

void test("provider catalog exposes implemented anchors and validates slugs", () => {
  assert.equal(isConnectorProviderSlug("hubspot"), true);
  assert.equal(isConnectorProviderSlug("unknown-provider"), false);

  const hubspot = getConnectorProviderDefinition("hubspot");
  assert.equal(hubspot.displayName, "HubSpot");
  assert.equal(hubspot.anchor, true);
  assert.equal(hubspot.defaultAuthType, "oauth");

  const implementedProviders = listImplementedConnectorProviders();
  assert.equal(implementedProviders.some((provider) => provider.slug === "google-workspace"), true);
  assert.equal(implementedProviders.some((provider) => provider.slug === "twilio-whatsapp"), true);
});

void test("canonical domains include the main integration surfaces", () => {
  assert.deepEqual(canonicalIntegrationDomains.includes("crm"), true);
  assert.deepEqual(canonicalIntegrationDomains.includes("payments"), true);
  assert.deepEqual(canonicalIntegrationDomains.includes("automation"), true);
});
