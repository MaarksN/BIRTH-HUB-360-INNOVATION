import { ProblemDetailsError } from "./problem-details.js";

export function readPrismaModel<T = Record<string, unknown>>(
  client: object,
  modelName: string,
  capability: string
): T {
  const model: unknown = Reflect.get(client, modelName);

  if (!model) {
    throw new ProblemDetailsError({
      detail: `The active database client does not expose the '${modelName}' model required by ${capability}.`,
      status: 503,
      title: "Service Unavailable"
    });
  }

  return model as T;
}

export function assertPrismaModelsAvailable(
  client: object,
  modelNames: readonly string[],
  capability: string
): void {
  for (const modelName of modelNames) {
    readPrismaModel(client, modelName, capability);
  }
}
