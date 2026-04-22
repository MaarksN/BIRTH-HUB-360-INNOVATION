import assert from "node:assert/strict";
import { createCipheriv, createHash, randomBytes } from "node:crypto";
import test from "node:test";

import {
  ConnectorSecretDecryptionError,
  decryptConnectorToken,
  decryptConnectorsMap,
  encryptConnectorToken
} from "../src/lib/encryption.js";

const ALGORITHM = "aes-256-gcm";
const AUTH_TAG_LENGTH = 16;
const IV_LENGTH = 16;
const TEST_SECRET = "connector-encryption-test-secret";

function encryptLegacyConnectorToken(text: string, secret: string): string {
  const iv = randomBytes(IV_LENGTH);
  const key = createHash("sha256").update(secret).digest();
  const cipher = createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH
  });

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  return `${iv.toString("hex")}:${cipher.getAuthTag().toString("hex")}:${encrypted}`;
}

void test("connector encryption round-trips with the versioned prefix", () => {
  const encrypted = encryptConnectorToken("hubspot-secret", {
    secret: TEST_SECRET
  });

  assert.match(encrypted, /^enc:v1:/);
  assert.equal(
    decryptConnectorToken(encrypted, {
      secret: TEST_SECRET
    }),
    "hubspot-secret"
  );
});

void test("connector decryption remains compatible with legacy encrypted payloads", () => {
  const encrypted = encryptLegacyConnectorToken("legacy-secret", TEST_SECRET);

  assert.equal(
    decryptConnectorToken(encrypted, {
      secret: TEST_SECRET
    }),
    "legacy-secret"
  );
});

void test("connector decryption blocks plaintext secrets unless migration mode is explicit", () => {
  assert.throws(
    () =>
      decryptConnectorToken("plain-text-token", {
        secret: TEST_SECRET
      }),
    (error: unknown) => {
      assert.ok(error instanceof ConnectorSecretDecryptionError);
      assert.match(error.message, /stored as plaintext/i);
      return true;
    }
  );

  assert.equal(
    decryptConnectorToken("plain-text-token", {
      allowLegacyPlaintext: true,
      secret: TEST_SECRET
    }),
    "plain-text-token"
  );
});

void test("connector map decryption does not silently accept tampered ciphertext", () => {
  assert.throws(
    () =>
      decryptConnectorsMap(
        {
          hubspot: "enc:v1:deadbeef:deadbeef:deadbeef"
        },
        {
          allowLegacyPlaintext: true,
          secret: TEST_SECRET
        }
      ),
    (error: unknown) => {
      assert.ok(error instanceof ConnectorSecretDecryptionError);
      assert.match(error.message, /invalid prefixed encryption payload|could not be decrypted/i);
      return true;
    }
  );
});
