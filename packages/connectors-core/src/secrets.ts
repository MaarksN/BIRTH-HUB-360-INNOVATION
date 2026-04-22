import { createDecipheriv, createHash } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const AUTH_TAG_LENGTH = 16;
const CONNECTOR_TOKEN_PREFIX = "enc:v1:";
const IV_LENGTH = 16;

export interface ConnectorSecretDecryptionOptions {
  allowLegacyPlaintext?: boolean | undefined;
  secret: string;
}

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

function getEncryptionKey(secret: string): Buffer {
  return createHash("sha256").update(secret).digest();
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

  const payload = {
    authTagHex,
    encryptedHex,
    ivHex
  };

  return isValidEncryptedConnectorPayload(payload) ? payload : null;
}

function parseEncryptedConnectorToken(encryptedText: string): ParsedEncryptedConnectorToken | null {
  if (encryptedText.startsWith(CONNECTOR_TOKEN_PREFIX)) {
    const rawPayload = encryptedText.slice(CONNECTOR_TOKEN_PREFIX.length);
    const parsed = parseDelimitedEncryptedConnectorToken(rawPayload);
    if (!parsed) {
      throw new ConnectorSecretDecryptionError(
        "Connector secret uses an invalid prefixed encryption payload."
      );
    }

    return parsed;
  }

  return parseDelimitedEncryptedConnectorToken(encryptedText);
}

export function decryptConnectorToken(
  encryptedText: string,
  options: ConnectorSecretDecryptionOptions
): string {
  if (!encryptedText) {
    return encryptedText;
  }

  const parsedToken = parseEncryptedConnectorToken(encryptedText);
  if (!parsedToken) {
    if (options.allowLegacyPlaintext) {
      return encryptedText;
    }

    throw new ConnectorSecretDecryptionError(
      "Connector secret is stored as plaintext. Re-encrypt it or temporarily enable plaintext connector secret compatibility."
    );
  }

  try {
    const iv = Buffer.from(parsedToken.ivHex, "hex");
    const authTag = Buffer.from(parsedToken.authTagHex, "hex");
    const key = getEncryptionKey(options.secret);
    const decipher = createDecipheriv(ALGORITHM, key, iv, {
      authTagLength: AUTH_TAG_LENGTH
    });
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(parsedToken.encryptedHex, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch {
    throw new ConnectorSecretDecryptionError(
      "Connector secret could not be decrypted with the configured encryption key."
    );
  }
}
