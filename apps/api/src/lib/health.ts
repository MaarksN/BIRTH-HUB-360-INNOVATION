import type { ApiConfig } from "@birthub/config";
import { healthResponseSchema } from "@birthub/config";
import { pingDatabase, pingDatabaseDeep } from "@birthub/database";

import { pingRedis } from "./queue.js";

const READINESS_MAX_LATENCY_MS = 750;
const DEEP_HEALTH_MAX_LATENCY_MS = 2_000;
const EXTERNAL_MAX_LATENCY_MS = 1_500;

type HealthMode = "liveness" | "readiness" | "diagnostic";
type HealthResponseMode = "deep" | "liveness" | "readiness";
type DependencyProbeStatus = "up" | "degraded" | "down";

type DependencyProbeResult = {
  latencyMs: number;
  message?: string;
  name?: string;
  status: DependencyProbeStatus;
  strict: boolean;
  thresholdMs: number;
};

type HealthResponse = ReturnType<typeof healthResponseSchema.parse>;
type RawDependencyProbeResult = {
  message?: string;
  status: "up" | "down";
};
type DependencyProbe = () => Promise<RawDependencyProbeResult>;
type HealthProbeDependencies = {
  now?: () => number;
  pingDatabase?: typeof pingDatabase;
  pingDatabaseDeep?: typeof pingDatabaseDeep;
  pingExternalDependency?: typeof pingExternalDependency;
  pingRedis?: typeof pingRedis;
};

const defaultHealthProbeDependencies: Required<HealthProbeDependencies> = {
  now: () => Date.now(),
  pingDatabase,
  pingDatabaseDeep,
  pingExternalDependency,
  pingRedis
};

async function pingExternalDependency(url: string): Promise<{ name: string; status: "up" | "down" }> {
  const name = new URL(url).hostname;

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(1500)
    });

    return {
      name,
      status: response.ok ? "up" : "down"
    };
  } catch {
    return {
      name,
      status: "down"
    };
  }
}

async function measureDependency(
  probe: DependencyProbe,
  options: {
    name?: string;
    strict: boolean;
    thresholdMs: number;
  },
  dependencies: Required<HealthProbeDependencies>
): Promise<DependencyProbeResult> {
  const startedAt = dependencies.now();
  const result = await probe();
  const latencyMs = dependencies.now() - startedAt;
  const latencyExceeded = latencyMs > options.thresholdMs;
  const messages = [result.message];

  if (latencyExceeded) {
    messages.push(`latency ${latencyMs}ms exceeded ${options.thresholdMs}ms`);
  }

  const status =
    result.status === "down" ? "down" : latencyExceeded ? "degraded" : "up";

  return {
    ...(messages.filter(Boolean).length > 0
      ? {
          message: messages.filter(Boolean).join("; ")
        }
      : {}),
    ...(options.name ? { name: options.name } : {}),
    latencyMs,
    status,
    strict: options.strict,
    thresholdMs: options.thresholdMs
  };
}

function toResponseMode(mode: HealthMode): HealthResponseMode {
  return mode === "diagnostic" ? "deep" : mode;
}

function resolveOverallStatus(input: {
  database: DependencyProbeResult;
  externalDependencies: DependencyProbeResult[];
  mode: HealthMode;
  redis: DependencyProbeResult;
}): "degraded" | "ok" {
  if (input.mode === "liveness") {
    return "ok";
  }

  const dependenciesToEvaluate =
    input.mode === "diagnostic"
      ? [input.database, input.redis, ...input.externalDependencies]
      : [
          input.database,
          input.redis,
          ...input.externalDependencies.filter((dependency) => dependency.strict)
        ];

  return dependenciesToEvaluate.every((dependency) => dependency.status === "up")
    ? "ok"
    : "degraded";
}

function finalizeHealthResponse(input: {
  database: DependencyProbeResult;
  externalDependencies: DependencyProbeResult[];
  mode: HealthMode;
  redis: DependencyProbeResult;
}): HealthResponse {
  const status = resolveOverallStatus(input);

  return healthResponseSchema.parse({
    checkedAt: new Date().toISOString(),
    mode: toResponseMode(input.mode),
    services: {
      database: input.database,
      externalDependencies: input.externalDependencies,
      redis: input.redis
    },
    status
  });
}

function createHealthServiceForMode(
  config: ApiConfig,
  mode: HealthMode,
  dependencies: HealthProbeDependencies = {}
) {
  const runtime = {
    ...defaultHealthProbeDependencies,
    ...dependencies
  };

  return async (): Promise<HealthResponse> => {
    const databaseProbe = mode === "diagnostic" ? runtime.pingDatabaseDeep : runtime.pingDatabase;
    const databaseThresholdMs =
      mode === "diagnostic" ? DEEP_HEALTH_MAX_LATENCY_MS : READINESS_MAX_LATENCY_MS;

    const [database, redis, externalDependencies] = await Promise.all([
      measureDependency(
        () => databaseProbe(),
        {
          strict: mode !== "liveness",
          thresholdMs: databaseThresholdMs
        },
        runtime
      ),
      measureDependency(
        () => runtime.pingRedis(config),
        {
          strict: mode !== "liveness",
          thresholdMs: READINESS_MAX_LATENCY_MS
        },
        runtime
      ),
      Promise.all(
        config.externalHealthcheckUrls.map((url) =>
          measureDependency(
            () => runtime.pingExternalDependency(url).then(({ status }) => ({ status })),
            {
              name: new URL(url).hostname,
              strict: false,
              thresholdMs: EXTERNAL_MAX_LATENCY_MS
            },
            runtime
          )
        )
      )
    ]);

    return finalizeHealthResponse({
      database,
      externalDependencies,
      mode,
      redis
    });
  };
}

export function createHealthService(config: ApiConfig, dependencies: HealthProbeDependencies = {}) {
  return createHealthServiceForMode(config, "liveness", dependencies);
}

export function createDeepHealthService(
  config: ApiConfig,
  dependencies: HealthProbeDependencies = {}
) {
  return createHealthServiceForMode(config, "diagnostic", dependencies);
}

export function createReadinessHealthService(
  config: ApiConfig,
  dependencies: HealthProbeDependencies = {}
) {
  return createHealthServiceForMode(config, "readiness", dependencies);
}
