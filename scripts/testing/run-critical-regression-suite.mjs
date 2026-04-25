import { spawnSync } from "node:child_process";

import { buildEnv, projectRoot } from "../ci/shared.mjs";

const suites = [
  {
    files: [
      "apps/api/tests/rbac.test.ts",
      "apps/api/tests/security.test.ts",
      "apps/api/tests/tenant-auth-hardening.test.ts",
      "apps/api/tests/webhooks.security.test.ts",
      "apps/api/tests/billing.idempotency.test.ts",
    ],
    name: "api-auth-tenant-webhooks",
  },
  {
    files: [
      "apps/worker/src/engine/runner.shared.test.ts",
      "apps/worker/src/engine/runner.execution.outcomes.test.ts",
      "apps/worker/src/worker.workflows.test.ts",
      "apps/worker/test/outbound.webhooks.test.ts",
      "apps/worker/test/queue.isolation.test.ts",
    ],
    name: "worker-idempotency-webhooks-concurrency",
  },
  {
    files: ["scripts/security/check-auth-guards.test.ts"],
    name: "security-guardrails",
  },
];

const env = buildEnv({
  NODE_ENV: "test",
});
const failures = [];

for (const suite of suites) {
  console.log(`\n[critical-regression] >>> ${suite.name}`);
  const result = spawnSync(
    process.execPath,
    ["--import", "tsx", "--test", "--test-concurrency=1", ...suite.files],
    {
      cwd: projectRoot,
      env,
      stdio: "inherit",
      windowsHide: true,
    }
  );

  if ((result.status ?? 1) !== 0) {
    failures.push(suite.name);
  }
}

if (failures.length > 0) {
  console.error(`\n[critical-regression] failed suites: ${failures.join(", ")}`);
  process.exitCode = 1;
} else {
  console.log("\n[critical-regression] all critical regression suites passed");
}
