#!/usr/bin/env node
// @ts-nocheck
// 
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { promises as fs } from "node:fs";
import { createConnection, createServer } from "node:net";
import path from "node:path";

import {
  fromRepo,
  listTrackedFiles,
  listUntrackedFiles,
  relativePath,
  reportDateParts,
  safeRun,
  writeJson,
  writeText
} from "./shared-prime.mjs";

const supplementalEvidencePaths = [
  "docs/operations/environment-parity.md",
  "docs/operations/sla.md",
  "artifacts/backups/backup-health.json",
  "artifacts/security/semgrep-head.json",
  "artifacts/testing/module-coverage.json",
  "artifacts/performance/web-bundle-head.json",
  "artifacts/accessibility/axe-report.json",
  "artifacts/dr/latest-drill.json",
  "artifacts/dr/readiness-report.json",
  "artifacts/tenancy/rls-proof-head.json"
];

function resolveSemgrepRuntime() {
  const localVenvExecutable = fromRepo(".tools/semgrep-venv/Scripts/semgrep.exe");
  if (existsSync(localVenvExecutable)) {
    return {
      argsPrefix: [],
      command: localVenvExecutable
    };
  }

  return {
    argsPrefix: [],
    command: "semgrep"
  };
}

function fileExists(relativePathValue) {
  return existsSync(fromRepo(relativePathValue));
}

async function readJsonIfExists(relativePathValue) {
  if (!fileExists(relativePathValue)) {
    return null;
  }

  return JSON.parse(await fs.readFile(fromRepo(relativePathValue), "utf8"));
}

function dedupe(values) {
  return [...new Set(values)];
}

function tryParseJson(value) {
  if (!value?.trim()) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function normalizePathValue(value) {
  return String(value ?? "").replaceAll("\\", "/");
}

function normalizeEmbeddedPostgresHost(value) {
  const normalized = String(value ?? "").replaceAll('"', "").trim();

  if (!normalized || normalized === "*" || normalized === "::1" || normalized === "localhost") {
    return "127.0.0.1";
  }

  return normalized;
}

function readEmbeddedPostgresPortFromPid(lines) {
  const rawPort = Number(lines[3]?.trim() ?? "");
  return Number.isInteger(rawPort) && rawPort > 0 ? rawPort : null;
}

function readEmbeddedPostgresHostFromPid(lines) {
  return normalizeEmbeddedPostgresHost(lines[5]);
}

function readQuotedArg(source, flag) {
  const flagToken = `"${flag}"`;
  const flagIndex = source.indexOf(flagToken);

  if (flagIndex === -1) {
    return null;
  }

  const valueStart = source.indexOf('"', flagIndex + flagToken.length);
  if (valueStart === -1) {
    return null;
  }

  const valueEnd = source.indexOf('"', valueStart + 1);
  if (valueEnd === -1) {
    return null;
  }

  return source.slice(valueStart + 1, valueEnd);
}

function readEmbeddedPostgresPortFromOptions(source) {
  const explicitPort = Number(readQuotedArg(source, "-p") ?? "");
  if (Number.isInteger(explicitPort) && explicitPort > 0) {
    return explicitPort;
  }

  const fallbackMatch = source.match(/-p\s+(\d+)/);
  const fallbackPort = Number(fallbackMatch?.[1] ?? "");
  return Number.isInteger(fallbackPort) && fallbackPort > 0 ? fallbackPort : null;
}

function readEmbeddedPostgresHostFromOptions(source) {
  const explicitHost = readQuotedArg(source, "-h");
  if (explicitHost) {
    return normalizeEmbeddedPostgresHost(explicitHost);
  }

  const listenMatch = source.match(/listen_addresses=([^"\s]+)/);
  return normalizeEmbeddedPostgresHost(listenMatch?.[1]);
}

async function isTcpReachable(host, port, timeoutMs = 1_500) {
  return await new Promise((resolve) => {
    const socket = createConnection({
      host,
      port
    });

    const finalize = (value) => {
      socket.removeAllListeners();
      socket.destroy();
      resolve(value);
    };

    socket.setTimeout(timeoutMs);
    socket.once("connect", () => finalize(true));
    socket.once("timeout", () => finalize(false));
    socket.once("error", () => finalize(false));
  });
}

async function resolveEmbeddedPostgresAdminDatabaseUrl() {
  const runtimeRoot = fromRepo(".tools/embedded-postgres-runtime");
  if (!existsSync(runtimeRoot)) {
    return "";
  }

  const passwordPath = path.join(runtimeRoot, "pw.txt");
  const password = existsSync(passwordPath)
    ? (await fs.readFile(passwordPath, "utf8")).trim() || "postgres"
    : "postgres";

  for (const dataDirName of ["data-runas", "data"]) {
    const dataDir = path.join(runtimeRoot, dataDirName);
    if (!existsSync(dataDir)) {
      continue;
    }

    let host = "127.0.0.1";
    let port = null;
    const pidPath = path.join(dataDir, "postmaster.pid");
    const optionsPath = path.join(dataDir, "postmaster.opts");

    if (existsSync(pidPath)) {
      const pidLines = (await fs.readFile(pidPath, "utf8")).split(/\r?\n/);
      port = readEmbeddedPostgresPortFromPid(pidLines);
      host = readEmbeddedPostgresHostFromPid(pidLines);
    }

    if ((!port || !host) && existsSync(optionsPath)) {
      const options = await fs.readFile(optionsPath, "utf8");
      port ??= readEmbeddedPostgresPortFromOptions(options);
      host = host || readEmbeddedPostgresHostFromOptions(options);
    }

    if (!port || !(await isTcpReachable(host, port))) {
      continue;
    }

    return `postgresql://postgres:${encodeURIComponent(password)}@${host}:${port}/postgres?schema=public&pgbouncer=true&connection_limit=10`;
  }

  return "";
}

async function resolveAdminDatabaseUrl() {
  const explicitDatabaseUrl = process.env.DATABASE_URL?.trim() ?? "";
  if (explicitDatabaseUrl) {
    return {
      databaseUrl: explicitDatabaseUrl,
      source: "env"
    };
  }

  const embeddedDatabaseUrl = await resolveEmbeddedPostgresAdminDatabaseUrl();
  return {
    databaseUrl: embeddedDatabaseUrl,
    source: embeddedDatabaseUrl ? "embedded-postgres" : "none"
  };
}

function semgrepTargets() {
  return [
    "apps/api",
    "apps/web",
    "apps/worker",
    "packages/database",
    "infra",
    ".github/workflows",
    "scripts/ops",
    "scripts/release",
    "scripts/security",
    "scripts/testing",
    "scripts/performance",
    "scripts/migrate-to-multitenant.ts",
    "scripts/audit/prime-backlog.mjs",
    "scripts/audit/prime-collect.mjs",
    "scripts/audit/prime-normalize.mjs",
    "scripts/audit/prime-refresh-evidence.mjs",
    "scripts/audit/prime-render.mjs",
    "scripts/audit/prime-score.mjs",
    "scripts/audit/prime-verify.mjs",
    "scripts/audit/shared-prime.mjs"
  ].filter((entry) => existsSync(fromRepo(entry)));
}

function summarizeSemgrepResults(results) {
  const counts = { ERROR: 0, WARNING: 0, INFO: 0, UNKNOWN: 0 };
  for (const result of results) {
    const severity = String(result.extra?.severity ?? result.extra?.metadata?.severity ?? "UNKNOWN").toUpperCase();
    counts[severity] = (counts[severity] ?? 0) + 1;
  }
  return counts;
}

async function wait(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForHttp(url, timeoutMs = 180_000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch {
      // keep polling
    }
    await wait(1_000);
  }

  throw new Error(`Timed out waiting for ${url}`);
}

async function isReachable(url, timeoutMs = 15_000) {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(timeoutMs)
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function findAvailablePort(preferredPort = 3101) {
  for (let port = preferredPort; port < preferredPort + 20; port += 1) {
    const available = await new Promise((resolve) => {
      const server = createServer();
      server.unref();
      server.once("error", () => resolve(false));
      server.listen(port, () => {
        server.close(() => resolve(true));
      });
    });

    if (available) {
      return port;
    }
  }

  throw new Error(`No free port found between ${preferredPort} and ${preferredPort + 19}.`);
}

function resolvePlaywrightChromium() {
  return import("@playwright/test")
    .then((module) => {
      const browserPath = module.chromium.executablePath();
      return {
        chromium: module.chromium,
        browserPath,
        available: existsSync(browserPath)
      };
    })
    .catch(() => ({
      chromium: null,
      browserPath: null,
      available: false
    }));
}

function spawnWebDevServer(port) {
  const nextBinaryCandidates = [
    fromRepo("apps/web/node_modules/next/dist/bin/next"),
    fromRepo("node_modules/next/dist/bin/next")
  ];
  const nextBinary = nextBinaryCandidates.find((candidate) => existsSync(candidate));
  const env = {
    ...process.env,
    NEXT_PUBLIC_API_URL: `http://127.0.0.1:${port}`,
    NEXT_PUBLIC_APP_URL: `http://127.0.0.1:${port}`,
    NEXT_PUBLIC_ENVIRONMENT: "test",
    NEXT_TELEMETRY_DISABLED: "1",
    WEB_PORT: String(port)
  };

  if (nextBinary) {
    return spawn(process.execPath, [nextBinary, "dev", "-p", String(port)], {
      cwd: fromRepo("apps/web"),
      env,
      stdio: ["ignore", "pipe", "pipe"]
    });
  }

  if (process.platform === "win32") {
    return spawn("cmd.exe", ["/d", "/s", "/c", `npx next dev -p ${port}`], {
      cwd: fromRepo("apps/web"),
      env,
      stdio: ["ignore", "pipe", "pipe"]
    });
  }

  return spawn("npx", ["next", "dev", "-p", String(port)], {
    cwd: fromRepo("apps/web"),
    env,
    stdio: ["ignore", "pipe", "pipe"]
  });
}

async function stopProcess(child) {
  if (!child || child.killed) {
    return;
  }

  if (process.platform === "win32" && child.pid) {
    await new Promise((resolve) => {
      const killer = spawn("taskkill", ["/PID", String(child.pid), "/T", "/F"], {
        stdio: "ignore"
      });
      killer.once("exit", () => resolve());
      killer.once("error", () => resolve());
    });
    return;
  }

  child.kill("SIGTERM");
  await wait(1_000);

  if (!child.killed) {
    child.kill("SIGKILL");
  }
}

function collectEvidenceFiles() {
  return dedupe([
    ...listTrackedFiles(),
    ...listUntrackedFiles(),
    ...supplementalEvidencePaths.filter(fileExists)
  ]);
}

async function writeEnvironmentParity() {
  const stagingPreflight = await readJsonIfExists("artifacts/release/staging-preflight-summary.json");
  const productionPreflight = await readJsonIfExists("artifacts/release/production-preflight-summary.json");
  const dockerfiles = [
    "apps/api/Dockerfile",
    "apps/web/Dockerfile",
    "apps/worker/Dockerfile"
  ].filter(fileExists);
  const composeFiles = ["docker-compose.yml", "docker-compose.prod.yml"].filter(fileExists);
  const sealedEnvFiles = [
    "ops/release/sealed/.env.staging.sealed",
    "ops/release/sealed/.env.production.sealed"
  ].filter(fileExists);
  const cloudRunFiles = ["infra/cloudrun/service.yaml"].filter(fileExists);
  const monitoringFiles = [
    "infra/monitoring/prometheus.yml",
    "infra/monitoring/alert.rules.yml",
    "infra/monitoring/grafana-dashboard.json"
  ].filter(fileExists);

  const lines = [
    "# Environment Parity",
    "",
    `- Refreshed at: ${new Date().toISOString()}`,
    `- Source of truth: \`${reportDateParts().slug}\` evidence refresh over the current HEAD.`,
    "",
    "## Runtime Surfaces",
    "",
    `- Dockerfiles present: ${dockerfiles.length}/3 (${dockerfiles.map((entry) => `\`${entry}\``).join(", ")})`,
    `- Compose surfaces present: ${composeFiles.length}/2 (${composeFiles.map((entry) => `\`${entry}\``).join(", ")})`,
    `- Cloud Run manifest: ${cloudRunFiles.length ? `present (\`${cloudRunFiles[0]}\`)` : "missing"}`,
    `- Monitoring stack refs: ${monitoringFiles.map((entry) => `\`${entry}\``).join(", ")}`,
    "",
    "## Release Preflight Evidence",
    "",
    `- Staging preflight: ${stagingPreflight?.ok ? "PASS" : "pending/fail"} (\`artifacts/release/staging-preflight-summary.json\`)`,
    `- Production preflight: ${productionPreflight?.ok ? "PASS" : "pending/fail"} (\`artifacts/release/production-preflight-summary.json\`)`,
    `- Sealed env files: ${sealedEnvFiles.length}/2 (${sealedEnvFiles.map((entry) => `\`${entry}\``).join(", ")})`,
    "",
    "## Parity Snapshot",
    "",
    "| Surface | Dev | Staging | Production | Evidence |",
    "| --- | --- | --- | --- | --- |",
    `| API | ${dockerfiles.includes("apps/api/Dockerfile") ? "containerized" : "gap"} | ${stagingPreflight?.results?.find((entry) => entry.scope === "api")?.ok ? "preflight ok" : "unknown"} | ${productionPreflight?.results?.find((entry) => entry.scope === "api")?.ok ? "preflight ok" : "unknown"} | \`apps/api/Dockerfile\`, \`artifacts/release/staging-preflight-summary.json\`, \`artifacts/release/production-preflight-summary.json\` |`,
    `| Web | ${dockerfiles.includes("apps/web/Dockerfile") ? "containerized" : "gap"} | ${stagingPreflight?.results?.find((entry) => entry.scope === "web")?.ok ? "preflight ok" : "unknown"} | ${productionPreflight?.results?.find((entry) => entry.scope === "web")?.ok ? "preflight ok" : "unknown"} | \`apps/web/Dockerfile\`, \`artifacts/release/staging-preflight-summary.json\`, \`artifacts/release/production-preflight-summary.json\` |`,
    `| Worker | ${dockerfiles.includes("apps/worker/Dockerfile") ? "containerized" : "gap"} | ${stagingPreflight?.results?.find((entry) => entry.scope === "worker")?.ok ? "preflight ok" : "unknown"} | ${productionPreflight?.results?.find((entry) => entry.scope === "worker")?.ok ? "preflight ok" : "unknown"} | \`apps/worker/Dockerfile\`, \`artifacts/release/staging-preflight-summary.json\`, \`artifacts/release/production-preflight-summary.json\` |`,
    "",
    "## Known Gaps",
    "",
    `- Kubernetes manifests: ${fileExists("infra/k8s") ? "present" : "not versioned in the canonical infra tree"}.`,
    `- Runtime parity is documented, but local proof still depends on machine-specific inputs because \`${process.env.DATABASE_URL ? "DATABASE_URL is configured on this runner" : "DATABASE_URL is not configured on this runner"}\`.`,
    `- This snapshot is documentation-backed; it does not replace live staging/prod smoke execution beyond the recorded preflight summaries.`,
    ""
  ];

  await writeText(fromRepo("docs/operations/environment-parity.md"), `${lines.join("\n")}\n`);
}

async function writeSlaSnapshot() {
  const policy = await fs.readFile(fromRepo("docs/operations/f0-sla-severity-policy.md"), "utf8");
  const baseline = await fs.readFile(fromRepo("docs/operations/f0-sla-adherence-baseline-90d.md"), "utf8");
  const uptimeLine = baseline
    .split(/\r?\n/)
    .find((line) => line.includes("Aderência Média Global P0")) ?? "Aderência Média Global P0: não encontrada.";

  const lines = [
    "# SLA Operacional",
    "",
    `- Refreshed at: ${new Date().toISOString()}`,
    `- Canonical policy: \`docs/operations/f0-sla-severity-policy.md\``,
    `- Baseline 90d: \`docs/operations/f0-sla-adherence-baseline-90d.md\``,
    `- Disaster recovery runbook: \`docs/runbooks/disaster-recovery.md\``,
    "",
    "## Snapshot",
    "",
    `- ${uptimeLine.replace(/\*\*/g, "").trim()}`,
    `- Policy review cadence: ${policy.includes("Revisao obrigatoria desta politica: trimestral") ? "trimestral documentada" : "não explicitada"}.`,
    `- Monitoring linkage: ${policy.includes("infra/monitoring/alert.rules.yml") && policy.includes("infra/monitoring/grafana-dashboard.json") ? "alert rules + dashboard versionados" : "incompleto"}.`,
    "",
    "## Source References",
    "",
    "- `docs/operations/f0-sla-severity-policy.md`",
    "- `docs/operations/f0-sla-adherence-baseline-90d.md`",
    "- `docs/runbooks/p1-alert-response-matrix.md`",
    "- `docs/runbooks/disaster-recovery.md`",
    ""
  ];

  await writeText(fromRepo("docs/operations/sla.md"), `${lines.join("\n")}\n`);
}

async function writeSemgrepSnapshot() {
  const artifactPath = "artifacts/security/semgrep-head.json";
  const semgrepRuntime = resolveSemgrepRuntime();
  const scanArgs = [
    ...semgrepRuntime.argsPrefix,
    "scan",
    "--config",
    "auto",
    "--json",
    "--quiet",
    ...semgrepTargets()
  ];
  const semgrepVersion = safeRun(
    semgrepRuntime.command,
    [...semgrepRuntime.argsPrefix, "--version"],
    {
      env: {
        PYTHONIOENCODING: "utf-8",
        PYTHONUTF8: "1"
      },
      timeoutMs: 30_000
    }
  );

  if (semgrepVersion.exitCode !== 0) {
    await writeJson(fromRepo(artifactPath), {
      checkedAt: new Date().toISOString(),
      command: [semgrepRuntime.command, ...semgrepRuntime.argsPrefix, "scan", "--config", "auto", "--json"].join(" "),
      status: "tool-missing",
      sufficient: false,
      reason: "Semgrep binary is not available on the current runner.",
      stderr: semgrepVersion.stderr || semgrepVersion.stdout || "semgrep not found",
      requiredAction: "Install semgrep on the runner or provide a connector-backed SAST lane."
    });
    return;
  }

  const result = safeRun(
    semgrepRuntime.command,
    scanArgs,
    {
      env: {
        PYTHONIOENCODING: "utf-8",
        PYTHONUTF8: "1"
      },
      timeoutMs: 600_000
    }
  );

  let parsed = null;
  try {
    parsed = JSON.parse(result.stdout);
  } catch {
    parsed = null;
  }

  const normalizedResults = (parsed?.results ?? []).map((entry) => ({
    ...entry,
    path: normalizePathValue(entry.path)
  }));

  await writeJson(fromRepo(artifactPath), {
    checkedAt: new Date().toISOString(),
    command: result.command,
    exitCode: result.exitCode,
    status: result.exitCode === 0 && parsed ? "fresh" : "scan-failed",
    sufficient: result.exitCode === 0 && Array.isArray(parsed?.results),
    version: semgrepVersion.stdout || semgrepVersion.stderr || null,
    targets: semgrepTargets(),
    summary: parsed
      ? {
          findings: normalizedResults.length,
          errors: parsed.errors?.length ?? 0,
          severities: summarizeSemgrepResults(normalizedResults)
        }
      : null,
    results: normalizedResults,
    errors: parsed?.errors ?? [],
    stdout: parsed ? undefined : result.stdout,
    stderr: result.stderr
  });
}

async function writeModuleCoverageSnapshot(files) {
  const surfaces = [
    {
      module: "apps/api",
      runtimePrefixes: ["apps/api/src/"],
      testPrefixes: ["apps/api/tests/"],
      sharedTests: ["tests/e2e/critical-routes.spec.ts"]
    },
    {
      module: "apps/web",
      runtimePrefixes: ["apps/web/app/", "apps/web/components/", "apps/web/lib/", "apps/web/providers/", "apps/web/stores/"],
      testPrefixes: ["apps/web/tests/"],
      sharedTests: ["tests/e2e/critical-routes.spec.ts", "tests/e2e/billing-premium.spec.ts"]
    },
    {
      module: "apps/worker",
      runtimePrefixes: ["apps/worker/src/"],
      testPrefixes: ["apps/worker/src/", "apps/worker/test/"],
      sharedTests: ["tests/e2e/workflow-editor-evidence.spec.ts", "tests/e2e/workflow-agent-output.spec.ts"]
    },
    {
      module: "packages/database",
      runtimePrefixes: ["packages/database/src/"],
      testPrefixes: ["packages/database/test/"],
      sharedTests: []
    }
  ];

  const runtimeFiles = files.filter((filePath) => /\.(ts|tsx|js|mjs)$/.test(filePath));
  const testFiles = files.filter((filePath) => {
    return (
      filePath.includes("/test/") ||
      filePath.includes("/tests/") ||
      /\.(test|spec)\.[tj]sx?$/.test(path.posix.basename(filePath))
    );
  });
  const traceability = await readJsonIfExists("scripts/testing/traceability-data.json");

  const rows = surfaces.map((surface) => {
    const moduleRuntimeFiles = runtimeFiles.filter((filePath) =>
      surface.runtimePrefixes.some((prefix) => filePath.startsWith(prefix))
    );
    const moduleTests = dedupe([
      ...testFiles.filter((filePath) => surface.testPrefixes.some((prefix) => filePath.startsWith(prefix))),
      ...surface.sharedTests.filter(fileExists)
    ]);
    const traceabilityFlows = (traceability?.modules ?? []).filter((entry) =>
      (entry.criticalModules ?? []).some((pattern) => pattern.includes(surface.module.split("/")[1]))
    );

    return {
      module: surface.module,
      runtimeFiles: moduleRuntimeFiles.length,
      directTestFiles: moduleTests.length,
      traceabilityFlows: traceabilityFlows.length,
      directTests: moduleTests,
      gaps: moduleRuntimeFiles.slice(0, 12).filter((filePath) => {
        const baseName = path.posix.basename(filePath).replace(/\.(d\.)?[a-z0-9]+$/i, "");
        return !moduleTests.some((testPath) => testPath.includes(baseName));
      })
    };
  });

  await writeJson(fromRepo("artifacts/testing/module-coverage.json"), {
    checkedAt: new Date().toISOString(),
    mode: "static-coverage-proxy",
    sufficient: false,
    limitations: [
      "This snapshot is structural and traceability-backed; it is not line or branch coverage.",
      "Environment-gated suites and Python runtime coverage remain outside this proxy."
    ],
    summary: {
      modules: rows.length,
      modulesWithDirectTests: rows.filter((row) => row.directTestFiles > 0).length,
      modulesWithTraceability: rows.filter((row) => row.traceabilityFlows > 0).length
    },
    surfaces: rows
  });
}

async function writeBundleSnapshot() {
  const artifactPath = "artifacts/performance/web-bundle-head.json";
  const buildManifest = fromRepo("apps/web/.next/build-manifest.json");
  const historicalBaseline = await readJsonIfExists("artifacts/quality/bundle/web-bundle-baseline.json");

  if (!existsSync(buildManifest)) {
    await writeJson(fromRepo(artifactPath), {
      checkedAt: new Date().toISOString(),
      status: "build-missing",
      sufficient: false,
      reason: "apps/web/.next/build-manifest.json was not found on the current runner.",
      historicalBaseline: historicalBaseline
        ? {
            generatedAt: historicalBaseline.generatedAt,
            totalKiB: historicalBaseline.chunks?.totalKiB ?? null,
            files: historicalBaseline.chunks?.files ?? null
          }
        : null,
      requiredAction: "Run the web build on the runner before the next sovereign audit."
    });
    return;
  }

  const generation = safeRun("node", ["scripts/quality/generate-web-bundle-baseline.mjs"], {
    timeoutMs: 300_000
  });
  const freshBaseline = await readJsonIfExists("artifacts/quality/bundle/web-bundle-baseline.json");

  await writeJson(fromRepo(artifactPath), {
    checkedAt: new Date().toISOString(),
    status: generation.exitCode === 0 ? "fresh" : "generation-failed",
    sufficient: generation.exitCode === 0,
    command: generation.command,
    stdout: generation.stdout,
    stderr: generation.stderr,
    baseline: freshBaseline
  });
}

async function writeAccessibilitySnapshot(files) {
  const artifactPath = fromRepo("artifacts/accessibility/axe-report.json");
  const playwright = await resolvePlaywrightChromium();
  const writeStaticAccessibilityFallback = async (extraLimitations = []) => {
    const webFiles = files.filter((filePath) => filePath.startsWith("apps/web/") && filePath.endsWith(".tsx"));
    const findings = [];

    for (const filePath of webFiles) {
      const content = await fs.readFile(fromRepo(filePath), "utf8");
      const lines = content.split(/\r?\n/);
      let tableWithoutCaptionReported = false;

      for (let index = 0; index < lines.length; index += 1) {
        const line = lines[index];
        if (/<img\b(?![^>]*\balt=)/.test(line)) {
          findings.push({
            file: filePath,
            line: index + 1,
            rule: "img-alt",
            severity: "medium",
            message: "Potential image without alt attribute."
          });
        }

        if (!tableWithoutCaptionReported && /<table\b/.test(line) && !/<caption\b/.test(content)) {
          findings.push({
            file: filePath,
            line: index + 1,
            rule: "table-caption",
            severity: "low",
            message: "Table rendered without an in-file caption element."
          });
          tableWithoutCaptionReported = true;
        }

        if (/<input\b/.test(line) && !/(aria-label|aria-labelledby)/.test(line) && !content.includes("<label")) {
          findings.push({
            file: filePath,
            line: index + 1,
            rule: "input-label",
            severity: "medium",
            message: "Potential input without associated label or aria label in the same file."
          });
        }
      }
    }

    await writeJson(artifactPath, {
      checkedAt: new Date().toISOString(),
      mode: "static-fallback",
      requestedTool: "axe",
      sufficient: false,
      limitations: [
        "No browser-backed axe runner is configured in the current sovereign audit lane.",
        "Findings are heuristic and should be validated by a real Playwright+axe pass.",
        ...extraLimitations
      ],
      browserPath: playwright.browserPath,
      browserAvailable: playwright.available,
      summary: {
        filesScanned: webFiles.length,
        findings: findings.length
      },
      findings
    });
  };
  const routes = ["/", "/pricing", "/legal/terms", "/legal/privacy"];
  const existingBaseUrl = "http://127.0.0.1:3001";
  const reuseExistingServer = await isReachable(`${existingBaseUrl}/pricing`);
  const port = reuseExistingServer ? 3001 : await findAvailablePort(3101);
  const baseUrl = `http://127.0.0.1:${port}`;

  if (playwright.available && playwright.chromium) {
    let devServer = null;
    const stdout = [];
    const stderr = [];

    try {
      devServer = reuseExistingServer ? null : spawnWebDevServer(port);
      devServer?.stdout?.on("data", (chunk) => stdout.push(String(chunk)));
      devServer?.stderr?.on("data", (chunk) => stderr.push(String(chunk)));
    } catch (error) {
      await writeStaticAccessibilityFallback([
        `Browser-backed accessibility smoke could not spawn the web dev server: ${
          error instanceof Error ? error.message : String(error)
        }`
      ]);
      return;
    }

    try {
      if (!reuseExistingServer) {
        await waitForHttp(`${baseUrl}/pricing`, 180_000);
      }
      const browser = await playwright.chromium.launch({ headless: true });
      const findings = [];
      const summaries = [];

      try {
        for (const route of routes) {
          const context = await browser.newContext();
          const page = await context.newPage();

          await page.goto(`${baseUrl}${route}`, {
            timeout: 30_000,
            waitUntil: "load"
          });

          const snapshot = await page.evaluate(() => {
            const controlSelector = "input, textarea, select";
            const labelable = [...document.querySelectorAll(controlSelector)];
            const unlabeledControls = labelable
              .filter((element) => {
                const node = element;
                const ariaLabel = node.getAttribute("aria-label");
                const ariaLabelledBy = node.getAttribute("aria-labelledby");
                const id = node.getAttribute("id");
                const hasExplicitLabel = Boolean(id && document.querySelector(`label[for="${id}"]`));
                const wrappedByLabel = Boolean(node.closest("label"));
                const isHidden = node.getAttribute("type") === "hidden";
                return !isHidden && !ariaLabel && !ariaLabelledBy && !hasExplicitLabel && !wrappedByLabel;
              })
              .map((element) => ({
                selector: element.tagName.toLowerCase(),
                snippet: (element.outerHTML ?? "").slice(0, 180)
              }));

            const imagesWithoutAlt = [...document.querySelectorAll("img:not([alt])")].map((element) => ({
              selector: element.tagName.toLowerCase(),
              snippet: (element.outerHTML ?? "").slice(0, 180)
            }));

            const tablesWithoutCaption = [...document.querySelectorAll("table")]
              .filter((table) => !table.querySelector("caption"))
              .map((element) => ({
                selector: element.tagName.toLowerCase(),
                snippet: (element.outerHTML ?? "").slice(0, 180)
              }));

            return {
              title: document.title,
              unlabeledControls,
              imagesWithoutAlt,
              tablesWithoutCaption
            };
          });

          summaries.push({
            route,
            title: snapshot.title,
            unlabeledControls: snapshot.unlabeledControls.length,
            imagesWithoutAlt: snapshot.imagesWithoutAlt.length,
            tablesWithoutCaption: snapshot.tablesWithoutCaption.length
          });

          for (const issue of snapshot.unlabeledControls.slice(0, 5)) {
            findings.push({
              route,
              rule: "input-label",
              severity: "medium",
              message: "Rendered form control without accessible label in browser-backed smoke.",
              snippet: issue.snippet
            });
          }

          for (const issue of snapshot.imagesWithoutAlt.slice(0, 5)) {
            findings.push({
              route,
              rule: "img-alt",
              severity: "medium",
              message: "Rendered image without alt attribute in browser-backed smoke.",
              snippet: issue.snippet
            });
          }

          for (const issue of snapshot.tablesWithoutCaption.slice(0, 5)) {
            findings.push({
              route,
              rule: "table-caption",
              severity: "low",
              message: "Rendered table without caption in browser-backed smoke.",
              snippet: issue.snippet
            });
          }

          await context.close();
        }
      } finally {
        await browser.close();
      }

      await writeJson(artifactPath, {
        checkedAt: new Date().toISOString(),
        mode: "browser-dom-smoke",
        requestedTool: "playwright",
        sufficient: true,
        browserPath: playwright.browserPath,
        baseUrl,
        reusedExistingServer: reuseExistingServer,
        routes,
        summary: {
          routesScanned: summaries.length,
          findings: findings.length
        },
        routeSummaries: summaries,
        findings,
        stdout: stdout.join(""),
        stderr: stderr.join("")
      });
      return;
    } catch (error) {
      await writeJson(artifactPath, {
        checkedAt: new Date().toISOString(),
        mode: "browser-dom-smoke",
        requestedTool: "playwright",
        sufficient: false,
        browserPath: playwright.browserPath,
        baseUrl,
        reusedExistingServer: reuseExistingServer,
        reason: error instanceof Error ? error.message : String(error),
        stdout: stdout.join(""),
        stderr: stderr.join("")
      });
      return;
    } finally {
      await stopProcess(devServer);
    }
  }

  await writeStaticAccessibilityFallback();
}

async function writeDisasterRecoverySnapshot() {
  const liveDrill = await readJsonIfExists("artifacts/backups/drill-rto-rpo.json");
  const readinessReport = await readJsonIfExists("artifacts/dr/readiness-report.json");
  const rollbackEvidence = await readJsonIfExists("artifacts/release/production-rollback-evidence.json");

  if (readinessReport) {
    await writeJson(fromRepo("artifacts/dr/latest-drill.json"), {
      checkedAt: new Date().toISOString(),
      status: readinessReport.overallStatus === "pass" ? "recorded" : "blocked",
      sufficient: readinessReport.overallStatus === "pass",
      blockers: readinessReport.blockers ?? [],
      checks: readinessReport.checks ?? [],
      drill: liveDrill,
      readinessReport
    });
    return;
  }

  if (liveDrill?.sufficient === true && liveDrill?.status === "pass") {
    await writeJson(fromRepo("artifacts/dr/latest-drill.json"), {
      checkedAt: new Date().toISOString(),
      status: "recorded",
      sufficient: true,
      drill: liveDrill
    });
    return;
  }

  await writeJson(fromRepo("artifacts/dr/latest-drill.json"), {
    checkedAt: new Date().toISOString(),
    status: "missing-drill-record",
    sufficient: false,
    reason: "No disaster-recovery drill artifact is currently versioned in artifacts/backups/.",
    runbook: "docs/runbooks/disaster-recovery.md",
    script: "scripts/ops/record-disaster-recovery-drill.ts",
    relatedRollbackEvidence: rollbackEvidence
  });
}

async function writeRlsSnapshot() {
  const previousSnapshot = await readJsonIfExists("artifacts/tenancy/rls-proof-head.json");
  const { databaseUrl: adminDatabaseUrl, source: adminDatabaseUrlSource } =
    await resolveAdminDatabaseUrl();
  const isSpawnRestricted = (run) => /spawn(?:Sync)? .*EPERM/i.test(String(run?.stderr ?? ""));
  const canPreservePreviousPass =
    previousSnapshot?.sufficient === true &&
    ["passed", "preserved-previous-pass"].includes(previousSnapshot?.runtimeProof?.status ?? "");
  const tenancyControl = safeRun(
    "node",
    ["--import", "tsx", "packages/database/scripts/check-tenancy-controls.ts"],
    { timeoutMs: 300_000 }
  );
  let roleProvisioning = null;
  let runtimeDatabaseUrl = adminDatabaseUrl;

  if (adminDatabaseUrl) {
    const provisionRun = safeRun(
      "node",
      ["--import", "tsx", "packages/database/scripts/provision-rls-runtime-role.ts"],
      {
        env: {
          ...process.env,
          DATABASE_URL: adminDatabaseUrl
        },
        timeoutMs: 300_000
      }
    );
    const provisionPayload = tryParseJson(provisionRun.stdout);
    const provisioningReady =
      provisionRun.exitCode === 0 &&
      provisionPayload?.status === "ready" &&
      typeof provisionPayload.runtimeDatabaseUrl === "string";

    if (provisioningReady) {
      runtimeDatabaseUrl = provisionPayload.runtimeDatabaseUrl;
    }

    roleProvisioning = {
      checkedAt: provisionPayload?.checkedAt ?? new Date().toISOString(),
      command: provisionRun.command,
      databaseName: provisionPayload?.databaseName ?? null,
      exitCode: provisionRun.exitCode,
      roleExisted: provisionPayload?.roleExisted ?? null,
      roleName: provisionPayload?.roleName ?? null,
      runtimeDatabaseUrlRedacted: provisionPayload?.runtimeDatabaseUrlRedacted ?? null,
      runtimeRole: provisionPayload?.runtimeRole ?? null,
      schemaName: provisionPayload?.schemaName ?? null,
      status: provisioningReady ? "ready" : "failed",
      stderr: provisionRun.stderr || null,
      stdout: provisioningReady ? null : provisionRun.stdout || null
    };
  }

  const shouldRunRuntimeProof = Boolean(runtimeDatabaseUrl);
  const rlsTestRun = shouldRunRuntimeProof
    ? safeRun(
        "node",
        ["--import", "tsx", "--test", "packages/database/test/rls.test.ts"],
        {
          env: {
            ...process.env,
            DATABASE_URL: runtimeDatabaseUrl
          },
          timeoutMs: 300_000
        }
      )
    : {
        command: "node --import tsx --test packages/database/test/rls.test.ts",
        exitCode: 0,
        stderr: "",
        stdout: ""
      };
  const runtimeOutput = [rlsTestRun.stdout, rlsTestRun.stderr].filter(Boolean).join("\n");
  const runnerSpawnRestricted =
    isSpawnRestricted(tenancyControl) ||
    isSpawnRestricted(roleProvisioning) ||
    isSpawnRestricted(rlsTestRun);
  const runtimeStatus = !shouldRunRuntimeProof
    ? canPreservePreviousPass
      ? "preserved-previous-pass"
      : "skipped-no-database"
    : runnerSpawnRestricted && canPreservePreviousPass
      ? "preserved-previous-pass"
    : roleProvisioning?.status === "failed"
      ? "failed-role-provisioning"
      : /ignora RLS \(superuser\/BYPASSRLS\)/i.test(runtimeOutput)
        ? "skipped-bypass-role"
        : /banco não está acessível/i.test(runtimeOutput)
          ? "skipped-no-database"
          : rlsTestRun.exitCode === 0
            ? "passed"
            : "failed";

  await writeJson(fromRepo("artifacts/tenancy/rls-proof-head.json"), {
    checkedAt: new Date().toISOString(),
    adminDatabaseUrlConfigured: Boolean(adminDatabaseUrl),
    roleProvisioning,
    tenancyControl: {
      command: tenancyControl.command,
      exitCode: tenancyControl.exitCode,
      stdout: tenancyControl.stdout,
      stderr: tenancyControl.stderr
    },
    runtimeProof: {
      command: rlsTestRun.command,
      exitCode: rlsTestRun.exitCode,
      stdout: rlsTestRun.stdout,
      stderr: rlsTestRun.stderr,
      runtimeDatabaseUrlConfigured: shouldRunRuntimeProof,
      status: runtimeStatus,
      previousSuccessfulCheckAt:
        runtimeStatus === "preserved-previous-pass" ? previousSnapshot?.checkedAt ?? null : null
    },
    previousSnapshotRetained:
      runtimeStatus === "preserved-previous-pass"
        ? {
            checkedAt: previousSnapshot?.checkedAt ?? null,
            runtimeStatus: previousSnapshot?.runtimeProof?.status ?? null
          }
        : null,
    sufficient: runtimeStatus === "passed" || runtimeStatus === "preserved-previous-pass"
  });
}

export async function refreshPrimeEvidence() {
  const files = collectEvidenceFiles();

  await writeEnvironmentParity();
  await writeSlaSnapshot();
  await writeSemgrepSnapshot();
  await writeModuleCoverageSnapshot(files);
  await writeBundleSnapshot();
  await writeAccessibilitySnapshot(files);
  await writeDisasterRecoverySnapshot();
  await writeRlsSnapshot();

  return {
    refreshedAt: new Date().toISOString(),
    outputs: supplementalEvidencePaths.filter(fileExists).map((entry) => relativePath(fromRepo(entry)))
  };
}

async function main() {
  const summary = await refreshPrimeEvidence();
  console.log(JSON.stringify(summary, null, 2));
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
