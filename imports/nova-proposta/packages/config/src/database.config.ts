import { z } from "zod";

import { getEnvironmentSource } from "./environment.js";
import { nodeEnvSchema, optionalUrlString, parseEnv } from "./shared.js";

const optionalPositiveInt = z.preprocess(
  (value) => {
    if (value === undefined || value === null) {
      return undefined;
    }

    if (typeof value === "string" && value.trim() === "") {
      return undefined;
    }

    const normalized = Number(value);
    return Number.isFinite(normalized) && normalized > 0 ? normalized : undefined;
  },
  z.number().int().positive().optional()
);

export const databaseEnvSchema = z.object({
  DATABASE_CONNECTION_LIMIT: optionalPositiveInt,
  DATABASE_URL: optionalUrlString,
  DB_SLOW_QUERY_MS: z.coerce.number().int().positive().default(750),
  NODE_ENV: nodeEnvSchema,
  PRISMA_QUERY_TIMEOUT_MS: z.coerce.number().int().positive().default(5_000)
});

export type DatabaseConfig = z.infer<typeof databaseEnvSchema>;

export function getDatabaseConfig(env: NodeJS.ProcessEnv = getEnvironmentSource()): DatabaseConfig {
  return parseEnv("database", databaseEnvSchema, getEnvironmentSource(env));
}
