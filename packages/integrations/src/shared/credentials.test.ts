import assert from "node:assert/strict";
import test from "node:test";

import {
  findConnectorCredentialByType,
  normalizeConnectorCredentialRecord,
  normalizeConnectorCredentialType
} from "./credentials.js";

void test("normalizeConnectorCredentialType resolves supported snake_case aliases", () => {
  assert.equal(normalizeConnectorCredentialType("access_token"), "accessToken");
  assert.equal(normalizeConnectorCredentialType("refresh_token"), "refreshToken");
  assert.equal(normalizeConnectorCredentialType("webhook_secret"), "webhookSecret");
  assert.equal(normalizeConnectorCredentialType("customSecret"), "customSecret");
});

void test("normalizeConnectorCredentialRecord prefers canonical credential keys", () => {
  const normalized = normalizeConnectorCredentialRecord({
    access_token: {
      value: "legacy-access-token"
    },
    accessToken: {
      expiresAt: "2026-04-20T12:00:00.000Z",
      value: "canonical-access-token"
    },
    refresh_token: {
      value: "refresh-token"
    }
  });

  assert.deepEqual(normalized, {
    accessToken: {
      expiresAt: "2026-04-20T12:00:00.000Z",
      value: "canonical-access-token"
    },
    refreshToken: {
      value: "refresh-token"
    }
  });
});

void test("findConnectorCredentialByType resolves legacy aliases while preserving order", () => {
  const credential = findConnectorCredentialByType(
    [
      {
        credentialType: "access_token",
        encryptedValue: "enc-1"
      },
      {
        credentialType: "accessToken",
        encryptedValue: "enc-2"
      }
    ],
    ["accessToken", "apiKey"]
  );

  assert.deepEqual(credential, {
    credentialType: "access_token",
    encryptedValue: "enc-1"
  });
});
