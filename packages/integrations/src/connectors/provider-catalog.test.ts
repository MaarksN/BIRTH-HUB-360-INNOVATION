import assert from "node:assert/strict";
import test from "node:test";

import {
  getConnectorProviderDefinition,
  isRuntimeImplementedConnectorProvider,
  listConnectorProviderDefinitions,
  listImplementedConnectorProviders,
  runtimeImplementedConnectorProviders
} from "./provider-catalog.js";

void test("zenvia is exposed as an implemented messaging connector", () => {
  const zenvia = getConnectorProviderDefinition("zenvia");

  assert.equal(zenvia.displayName, "Zenvia");
  assert.equal(zenvia.defaultAuthType, "api_key");
  assert.equal(zenvia.implementationStage, "implemented");
  assert.equal(zenvia.capabilities.includes("messaging"), true);
  assert.equal(zenvia.capabilities.includes("webhook"), true);
});

void test("implemented provider listing includes zenvia", () => {
  const implementedProviders = listImplementedConnectorProviders();

  assert.equal(implementedProviders.some((provider) => provider.slug === "zenvia"), true);
});

void test("implemented provider listing matches connectors-core runtime providers", () => {
  const implementedProviders = listImplementedConnectorProviders()
    .map((provider) => provider.slug)
    .sort();

  assert.deepEqual(implementedProviders, [...runtimeImplementedConnectorProviders].sort());
  assert.deepEqual(implementedProviders, ["hubspot", "omie", "slack", "stripe", "zenvia"]);
});

void test("client-only providers are not exposed as runtime implemented", () => {
  const googleWorkspace = getConnectorProviderDefinition("google-workspace");
  const microsoftGraph = getConnectorProviderDefinition("microsoft-graph");

  assert.equal(googleWorkspace.implementationStage, "client_only");
  assert.equal(microsoftGraph.implementationStage, "planned");
  assert.equal(isRuntimeImplementedConnectorProvider(googleWorkspace.slug), false);
  assert.equal(isRuntimeImplementedConnectorProvider(microsoftGraph.slug), false);
});

void test("catalog cannot mark a provider implemented without a runtime handler", () => {
  const invalidImplementedProviders = listConnectorProviderDefinitions().filter(
    (provider) =>
      provider.implementationStage === "implemented" &&
      !isRuntimeImplementedConnectorProvider(provider.slug)
  );

  assert.deepEqual(invalidImplementedProviders, []);
});
