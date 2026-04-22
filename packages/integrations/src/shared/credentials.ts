const connectorCredentialTypeAliases = {
  accessToken: ["accessToken", "access_token"],
  apiKey: ["apiKey", "api_key"],
  appKey: ["appKey", "app_key"],
  appSecret: ["appSecret", "app_secret"],
  authorizationCode: ["authorizationCode", "authorization_code"],
  basicAuth: ["basicAuth", "basic_auth"],
  botToken: ["botToken", "bot_token"],
  clientSecret: ["clientSecret", "client_secret"],
  privateAppToken: ["privateAppToken", "private_app_token"],
  refreshToken: ["refreshToken", "refresh_token"],
  serviceAccount: ["serviceAccount", "service_account"],
  webhookSecret: ["webhookSecret", "webhook_secret"]
} as const satisfies Record<string, readonly string[]>;

const connectorCredentialTypeMap = new Map<string, string>(
  Object.entries(connectorCredentialTypeAliases).flatMap(([canonicalType, aliases]) =>
    aliases.map((alias) => [alias, canonicalType] as const)
  )
);

type ConnectorCredentialValue = {
  expiresAt?: string | undefined;
  value: string;
};

export function normalizeConnectorCredentialType(credentialType: string): string {
  const normalizedType = credentialType.trim();

  return connectorCredentialTypeMap.get(normalizedType) ?? normalizedType;
}

export function normalizeConnectorCredentialRecord<Value extends ConnectorCredentialValue>(
  credentials: Record<string, Value>
): Record<string, Value> {
  const normalizedCredentials: Record<string, Value> = {};

  for (const [credentialType, credential] of Object.entries(credentials)) {
    const normalizedType = normalizeConnectorCredentialType(credentialType);
    const existingCredential = normalizedCredentials[normalizedType];

    if (!existingCredential || credentialType === normalizedType) {
      normalizedCredentials[normalizedType] = credential;
    }
  }

  return normalizedCredentials;
}

export function findConnectorCredentialByType<T extends { credentialType: string }>(
  credentials: readonly T[],
  credentialTypes: readonly string[]
): T | undefined {
  const expectedTypes = new Set(
    credentialTypes.map((credentialType) =>
      normalizeConnectorCredentialType(credentialType)
    )
  );

  return credentials.find((credential) =>
    expectedTypes.has(normalizeConnectorCredentialType(credential.credentialType))
  );
}
