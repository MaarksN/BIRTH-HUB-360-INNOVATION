import assert from "node:assert/strict";
import test from "node:test";

import {
  describeResolvedSecret,
  describeSecretSource,
  resolveSecretCandidates
} from "./secrets.js";

void test("resolveSecretCandidates trims, deduplicates and preserves order", () => {
  assert.deepEqual(
    resolveSecretCandidates(" primary-secret ", [
      "legacy-secret",
      "primary-secret",
      " legacy-secret-2 "
    ]),
    ["primary-secret", "legacy-secret", "legacy-secret-2"]
  );
});

void test("describeSecretSource recognizes external secret references for future resolvers", () => {
  assert.deepEqual(describeSecretSource("vault://kv/birthub/session"), {
    backend: "vault",
    externalized: true,
    managed: true,
    raw: "vault://kv/birthub/session",
    reference: "kv/birthub/session"
  });

  assert.deepEqual(describeSecretSource("env://SESSION_SECRET_CURRENT"), {
    backend: "env",
    externalized: true,
    managed: false,
    raw: "env://SESSION_SECRET_CURRENT",
    reference: "SESSION_SECRET_CURRENT"
  });
});

void test("describeResolvedSecret exposes managed backends and fallback metadata", () => {
  const descriptor = describeResolvedSecret({
    fallbacks: "env://SESSION_SECRET_PREVIOUS, vault://kv/birthub/session-prev",
    primary: "env://SESSION_SECRET_CURRENT"
  });

  assert.equal(descriptor.primarySource.backend, "env");
  assert.equal(descriptor.externalized, true);
  assert.deepEqual(descriptor.managedBackends, ["vault"]);
  assert.deepEqual(descriptor.fallbackSources.map((entry) => entry.backend), [
    "env",
    "vault"
  ]);
});
