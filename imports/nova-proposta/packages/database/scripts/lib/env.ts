export type SchemaDriftEnvironment = {
  databaseUrl: string | undefined;
  shadowDatabaseUrl: string | undefined;
};

function readBooleanEnv(env: NodeJS.ProcessEnv, key: string): boolean {
  const value = env[key]?.trim().toLowerCase();

  if (!value) {
    return false;
  }

  return ["1", "true", "yes", "on"].includes(value);
}

function readOptionalEnv(env: NodeJS.ProcessEnv, key: string): string | undefined {
  const value = env[key]?.trim();
  return value ? value : undefined;
}

export function getSchemaDriftEnvironment(
  env: NodeJS.ProcessEnv = process.env
): SchemaDriftEnvironment {
  return {
    databaseUrl: readOptionalEnv(env, "DATABASE_URL"),
    shadowDatabaseUrl: readOptionalEnv(env, "SHADOW_DATABASE_URL")
  };
}

export function shouldRequireSchemaDriftEvidence(
  env: NodeJS.ProcessEnv = process.env
): boolean {
  return readBooleanEnv(env, "BIRTHUB_REQUIRE_SCHEMA_DRIFT_EVIDENCE");
}

export function readRequiredEnv(
  env: NodeJS.ProcessEnv,
  key: string,
  consumerName: string
): string {
  const value = readOptionalEnv(env, key);

  if (!value) {
    throw new Error(`${key} is required for ${consumerName}.`);
  }

  return value;
}
