import {
  getEnvironmentSource,
  readEnvironmentValue,
  readTrimmedEnvironmentValue
} from "@birthub/config";

const DEFAULT_DEVELOPMENT_DATABASE_URL =
  "postgresql://postgres:postgres@localhost:5432/birthub?schema=public";

function isImplicitDevelopmentFallback(databaseUrl: string): boolean {
  try {
    const parsed = new URL(databaseUrl);

    return (
      parsed.protocol.startsWith("postgres") &&
      parsed.username === "postgres" &&
      parsed.password === "postgres" &&
      parsed.hostname === "localhost" &&
      parsed.port === "5432" &&
      parsed.pathname === "/birthub"
    );
  } catch {
    return databaseUrl === DEFAULT_DEVELOPMENT_DATABASE_URL;
  }
}

export function hasExplicitDatabaseUrl(env: NodeJS.ProcessEnv = getEnvironmentSource()): boolean {
  const runtimeEnvironment = getEnvironmentSource(env);
  const databaseUrl = readTrimmedEnvironmentValue("DATABASE_URL", runtimeEnvironment);

  if (!databaseUrl) {
    return false;
  }

  if (readEnvironmentValue("BIRTHUB_ENABLE_DB_TESTS", runtimeEnvironment) === "1") {
    return true;
  }

  return !isImplicitDevelopmentFallback(databaseUrl);
}

export function isDatabaseUnavailableError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === "PrismaClientInitializationError" ||
      error.name === "PrismaClientRustPanicError" ||
      error.message.includes("Environment variable not found: DATABASE_URL") ||
      error.message.includes("Authentication failed against database server") ||
      error.message.includes("ECONNREFUSED") ||
      error.message.includes("Can't reach database server"))
  );
}
