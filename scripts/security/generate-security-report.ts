// @ts-expect-error TODO: remover suppressão ampla
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

type CheckStatus = "cancelled" | "failure" | "skipped" | "success" | "unknown";

type SecurityCheck = {
  artifactPath?: string;
  description: string;
  id: string;
  label: string;
  status: CheckStatus;
};

type SecurityModule = {
  checks: string;
  name: string;
};

export type SecurityCoverageReport = {
  checks: SecurityCheck[];
  dast: {
    targetStrategy: string;
    targetUrl: string | null;
  };
  generatedAt: string;
  modules: SecurityModule[];
  overallStatus: "fail" | "pass";
};

const CHECKS: Array<Omit<SecurityCheck, "status"> & { envKey: string }> = [
  {
    artifactPath: "artifacts/security/semgrep-head.json",
    description: "Semgrep baseline for TypeScript and Express surfaces.",
    envKey: "SEMGREP_STATUS",
    id: "semgrep",
    label: "semgrep",
  },
  {
    description: "High-severity npm audit gate.",
    envKey: "NPM_AUDIT_STATUS",
    id: "dependency_audit",
    label: "dependency audit",
  },
  {
    description: "Bandit, pip-audit and Safety lane for Python surfaces.",
    envKey: "PYTHON_SECURITY_STATUS",
    id: "python_security",
    label: "python security",
  },
  {
    description: "RBAC regression suite on critical API endpoints.",
    envKey: "RBAC_STATUS",
    id: "rbac_suite",
    label: "RBAC suite",
  },
  {
    artifactPath: "artifacts/security/zap",
    description:
      "OWASP ZAP baseline against the canonical local web login route.",
    envKey: "ZAP_STATUS",
    id: "zap_baseline",
    label: "ZAP baseline",
  },
];

const MODULES: SecurityModule[] = [
  {
    checks: "login/logout/session rotation + MFA challenge tests",
    name: "auth",
  },
  { checks: "role matrix on critical endpoints", name: "rbac" },
  { checks: "introspection + scoped auth guards", name: "api-keys" },
  { checks: "CSP report-only, origin checks, CSRF double-submit", name: "web" },
  {
    checks: "signed payload verification + tenant context checks",
    name: "worker",
  },
];

function normalizeStatus(value: string | undefined): CheckStatus {
  const normalized = value?.trim().toLowerCase();

  if (
    normalized === "success" ||
    normalized === "failure" ||
    normalized === "cancelled" ||
    normalized === "skipped"
  ) {
    return normalized;
  }

  return "unknown";
}

export function buildSecurityCoverageReport(
  env: NodeJS.ProcessEnv = process.env,
): SecurityCoverageReport {
  const checks = CHECKS.map(({ envKey, ...check }) => ({
    ...check,
    status: normalizeStatus(env[envKey]),
  }));

  return {
    checks,
    dast: {
      targetStrategy:
        env.DAST_TARGET_STRATEGY?.trim() || "local-web-login-route",
      targetUrl: env.DAST_TARGET_URL?.trim() || null,
    },
    generatedAt: new Date().toISOString(),
    modules: MODULES,
    overallStatus: checks.every((check) => check.status === "success")
      ? "pass"
      : "fail",
  };
}

export function renderSecurityCoverageMarkdown(
  report: SecurityCoverageReport,
): string {
  const checksTable = report.checks
    .map((check) => {
      const artifact = check.artifactPath ? `\`${check.artifactPath}\`` : "-";
      return `| ${check.label} | ${check.status} | ${artifact} | ${check.description} |`;
    })
    .join("\n");

  const modulesTable = report.modules
    .map((module) => `| ${module.name} | ${module.checks} |`)
    .join("\n");

  const dastTarget = report.dast.targetUrl
    ? `\`${report.dast.targetUrl}\``
    : "n/a";

  return `# Security Coverage Report

- generatedAt: ${report.generatedAt}
- overall_status: ${report.overallStatus}
- dast_target_strategy: ${report.dast.targetStrategy}
- dast_target_url: ${dastTarget}

## Checks

| Check | Status | Artifact | Description |
| --- | --- | --- | --- |
${checksTable}

## Modules

| Module | Checks |
| --- | --- |
${modulesTable}
`;
}

export function writeSecurityCoverageReport(
  report: SecurityCoverageReport,
  rootDirectory: string = process.cwd(),
): {
  jsonPath: string;
  markdownPath: string;
} {
  const markdownDirectory = resolve(rootDirectory, "docs", "security");
  const artifactsDirectory = resolve(rootDirectory, "artifacts", "security");
  const markdownPath = resolve(
    markdownDirectory,
    "security-coverage-report.md",
  );
  const jsonPath = resolve(artifactsDirectory, "security-coverage-report.json");

  mkdirSync(markdownDirectory, { recursive: true });
  mkdirSync(artifactsDirectory, { recursive: true });

  writeFileSync(markdownPath, renderSecurityCoverageMarkdown(report), "utf8");
  writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  return { jsonPath, markdownPath };
}

function isExecutedAsScript(): boolean {
  const entryPoint = process.argv[1];

  if (!entryPoint) {
    return false;
  }

  return resolve(entryPoint) === fileURLToPath(import.meta.url);
}

if (isExecutedAsScript()) {
  const report = buildSecurityCoverageReport();
  const paths = writeSecurityCoverageReport(report);

  console.log(`Security report generated at ${paths.markdownPath}`);
  console.log(`Security artifact generated at ${paths.jsonPath}`);
}
