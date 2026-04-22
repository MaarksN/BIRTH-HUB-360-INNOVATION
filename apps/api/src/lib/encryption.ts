import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

import { getApiConfig } from "@birthub/config";

const ALGORITHM = "aes-256-gcm";
const AUTH_TAG_LENGTH = 16;
const CONNECTOR_TOKEN_PREFIX = "enc:v1:";
const IV_LENGTH = 16;

type ConnectorEncryptionOptions = {
  allowLegacyPlaintext?: boolean;
  secret?: string;
};

type ParsedEncryptedConnectorToken = {
  authTagHex: string;
  encryptedHex: string;
  ivHex: string;
};

export class ConnectorSecretDecryptionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConnectorSecretDecryptionError";
  }
}

/**
 * Derives a 32-byte key from the AUTH_MFA_ENCRYPTION_KEY or another
 * 32-byte secret configuration. For agent connectors, we reuse the
 * configured MFA encryption key or assume it is at least 32 bytes long
 * (we pad/slice to 32 bytes).
 */
function getEncryptionKey(secret: string): Buffer {
  // Use SHA-256 to securely derive a 32-byte key from any string length
  return createHash("sha256").update(secret).digest();
}

function resolveConnectorEncryptionOptions(
  options: ConnectorEncryptionOptions = {}
): Required<ConnectorEncryptionOptions> {
  if (typeof options.secret === "string") {
    return {
      allowLegacyPlaintext: options.allowLegacyPlaintext ?? false,
      secret: options.secret
    };
  }

  const config = getApiConfig();

  return {
    allowLegacyPlaintext:
      options.allowLegacyPlaintext ?? config.ALLOW_LEGACY_PLAINTEXT_CONNECTOR_SECRETS,
    secret: config.AUTH_MFA_ENCRYPTION_KEY
  };
}

function isHexString(value: string): boolean {
  return /^[0-9a-f]+$/i.test(value);
}

function isValidEncryptedConnectorPayload(input: ParsedEncryptedConnectorToken): boolean {
  return (
    input.ivHex.length === IV_LENGTH * 2 &&
    input.authTagHex.length === AUTH_TAG_LENGTH * 2 &&
    input.encryptedHex.length % 2 === 0 &&
    isHexString(input.ivHex) &&
    isHexString(input.authTagHex) &&
    isHexString(input.encryptedHex)
  );
}

function parseDelimitedEncryptedConnectorToken(
  value: string
): ParsedEncryptedConnectorToken | null {
  const parts = value.split(":");

  if (parts.length !== 3) {
    return null;
  }

  const [ivHex, authTagHex, encryptedHex] = parts;

  if (!ivHex || !authTagHex || !encryptedHex) {
    return null;
  }

  const payload = { authTagHex, encryptedHex, ivHex };
  return isValidEncryptedConnectorPayload(payload) ? payload : null;
}

function parsePrefixedEncryptedConnectorToken(encryptedText: string): ParsedEncryptedConnectorToken {
  const rawPayload = encryptedText.slice(CONNECTOR_TOKEN_PREFIX.length);
  const parts = rawPayload.split(":");

  if (parts.length !== 3) {
    throw new ConnectorSecretDecryptionError(
      "Connector secret uses an invalid prefixed encryption format."
    );
  }

  const parsedToken = parseDelimitedEncryptedConnectorToken(rawPayload);

  if (!parsedToken) {
    throw new ConnectorSecretDecryptionError(
      "Connector secret uses an invalid prefixed encryption payload."
    );
  }

  return parsedToken;
}

function parseEncryptedConnectorToken(encryptedText: string): ParsedEncryptedConnectorToken | null {
  if (encryptedText.startsWith(CONNECTOR_TOKEN_PREFIX)) {
    return parsePrefixedEncryptedConnectorToken(encryptedText);
  }

  return parseDelimitedEncryptedConnectorToken(encryptedText);
}

export function encryptConnectorToken(
  text: string,
  options: ConnectorEncryptionOptions = {}
): string {
  if (!text) return text;

  const iv = randomBytes(IV_LENGTH);
  const { secret } = resolveConnectorEncryptionOptions(options);
  const key = getEncryptionKey(secret);
  const cipher = createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH
  });

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  return `${CONNECTOR_TOKEN_PREFIX}${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

export function decryptConnectorToken(
  encryptedText: string,
  options: ConnectorEncryptionOptions = {}
): string {
  if (!encryptedText) return encryptedText;

  const { allowLegacyPlaintext, secret } = resolveConnectorEncryptionOptions(options);
  const parsedToken = parseEncryptedConnectorToken(encryptedText);

  if (!parsedToken) {
    if (allowLegacyPlaintext) {
      return encryptedText;
    }

    throw new ConnectorSecretDecryptionError(
      "Connector secret is stored as plaintext. Re-encrypt it or temporarily enable ALLOW_LEGACY_PLAINTEXT_CONNECTOR_SECRETS during migration."
    );
  }

  try {
    const { authTagHex, encryptedHex, ivHex } = parsedToken;
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const key = getEncryptionKey(secret);

    const decipher = createDecipheriv(ALGORITHM, key, iv, {
      authTagLength: AUTH_TAG_LENGTH
    });
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch {
    throw new ConnectorSecretDecryptionError(
      "Connector secret could not be decrypted with the configured AUTH_MFA_ENCRYPTION_KEY."
    );
  }
}

export function encryptConnectorsMap(
  connectors: Record<string, unknown>,
  options: ConnectorEncryptionOptions = {}
): Record<string, unknown> {
  if (!connectors) return connectors;

  const encrypted: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(connectors)) {
    if (typeof value === "string") {
      encrypted[key] = encryptConnectorToken(value, options);
    } else if (typeof value === "object" && value !== null) {
      // Basic recursive encryption for nested connector objects like { hubspot: { token: '...' } }
      encrypted[key] = encryptConnectorsMap(value as Record<string, unknown>, options);
    } else {
      encrypted[key] = value;
    }
  }
  return encrypted;
}

export function decryptConnectorsMap(
  connectors: Record<string, unknown>,
  options: ConnectorEncryptionOptions = {}
): Record<string, unknown> {
  if (!connectors) return connectors;

  const decrypted: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(connectors)) {
    if (typeof value === "string") {
      decrypted[key] = decryptConnectorToken(value, options);
    } else if (typeof value === "object" && value !== null) {
      decrypted[key] = decryptConnectorsMap(value as Record<string, unknown>, options);
    } else {
      decrypted[key] = value;
    }
  }
  return decrypted;
}
