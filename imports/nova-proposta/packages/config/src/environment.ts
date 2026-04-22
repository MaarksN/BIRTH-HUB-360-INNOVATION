import type { z } from "zod";

import { deploymentEnvironmentSchema, nodeEnvSchema } from "./shared.js";

export type RuntimeEnvironment = NodeJS.ProcessEnv;
export type NodeEnvironment = z.infer<typeof nodeEnvSchema>;
export type DeploymentEnvironment = z.infer<typeof deploymentEnvironmentSchema>;

export function getEnvironmentSource(env: RuntimeEnvironment = process.env): RuntimeEnvironment {
  return env;
}

export function readEnvironmentValue(
  key: string,
  env: RuntimeEnvironment = process.env
): string | undefined {
  const value = getEnvironmentSource(env)[key];
  return typeof value === "string" ? value : undefined;
}

export function readTrimmedEnvironmentValue(
  key: string,
  env: RuntimeEnvironment = process.env
): string | undefined {
  const value = readEnvironmentValue(key, env);
  const trimmedValue = value?.trim();
  return trimmedValue ? trimmedValue : undefined;
}

export function resolveNodeEnvironment(env: RuntimeEnvironment = process.env): NodeEnvironment {
  return nodeEnvSchema.parse(readEnvironmentValue("NODE_ENV", env));
}

export function resolveDeploymentEnvironment(
  env: RuntimeEnvironment = process.env
): DeploymentEnvironment {
  return deploymentEnvironmentSchema.parse(readEnvironmentValue("DEPLOYMENT_ENVIRONMENT", env));
}

export function isProductionEnvironment(env: RuntimeEnvironment = process.env): boolean {
  return resolveNodeEnvironment(env) === "production";
}
