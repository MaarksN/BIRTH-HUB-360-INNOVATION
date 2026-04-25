import assert from "node:assert/strict";
import test from "node:test";

import { main as checkSchemaDriftMain } from "../scripts/check-schema-drift.js";
import {
  assertValidationEnvironment,
  main as validateMigrationsMain,
  resolveValidationSeedProfile
} from "../scripts/validate-migrations-on-test-db.js";

void test("check-schema-drift writes a skipped report when evidence is optional", async () => {
  const reports: Array<{ path: string; payload: unknown }> = [];
  const textReports: Array<{ path: string; content: string }> = [];

  const exitCode = await checkSchemaDriftMain(
    {},
    {
      runtimeDependencies: {
        createRunId: () => "run-schema-drift-skip",
        writeJsonReport: (path, payload) => {
          reports.push({ path, payload });
          return Promise.resolve(path);
        }
      },
      writeTextReport: (path, content) => {
        textReports.push({ path, content });
        return Promise.resolve(path);
      }
    }
  );

  assert.equal(exitCode, 0);
  assert.equal(reports.length, 1);
  assert.equal(reports[0]?.path, "f8/schema-drift-report.json");
  assert.match(JSON.stringify(reports[0]?.payload), /"runId":"run-schema-drift-skip"/);
  assert.match(JSON.stringify(reports[0]?.payload), /"script":"db-check-schema-drift"/);
  assert.match(JSON.stringify(reports[0]?.payload), /"status":"skipped"/);
  assert.match(JSON.stringify(reports[0]?.payload), /"status":"skipped"/);
  assert.match(JSON.stringify(reports[0]?.payload), /"type":"check"/);
  assert.equal(textReports.length, 1);
  assert.equal(textReports[0]?.path, "f8/schema-drift-report.txt");
});

void test("check-schema-drift fails when the official evidence gate has no DATABASE_URL", async () => {
  const reports: Array<{ path: string; payload: unknown }> = [];
  const textReports: Array<{ path: string; content: string }> = [];
  const originalExitCode = process.exitCode;

  try {
    const exitCode = await checkSchemaDriftMain(
      {
        BIRTHUB_REQUIRE_SCHEMA_DRIFT_EVIDENCE: "true"
      },
      {
        runtimeDependencies: {
          createRunId: () => "run-schema-drift-required",
          writeJsonReport: (path, payload) => {
            reports.push({ path, payload });
            return Promise.resolve(path);
          }
        },
        writeTextReport: (path, content) => {
          textReports.push({ path, content });
          return Promise.resolve(path);
        }
      }
    );

    assert.equal(exitCode, 1);
    assert.equal(reports.length, 1);
    assert.equal(reports[0]?.path, "f8/schema-drift-report.json");
    assert.match(JSON.stringify(reports[0]?.payload), /"runId":"run-schema-drift-required"/);
    assert.match(JSON.stringify(reports[0]?.payload), /"status":"failed"/);
    assert.match(JSON.stringify(reports[0]?.payload), /official schema drift evidence gate/i);
    assert.equal(textReports.length, 1);
    assert.equal(textReports[0]?.path, "f8/schema-drift-report.txt");
    assert.match(textReports[0]?.content ?? "", /Schema drift check: FAIL/);
  } finally {
    process.exitCode = originalExitCode;
  }
});

void test("validate-migrations-on-test-db enforces CI or NODE_ENV=test", () => {
  assert.throws(
    () => assertValidationEnvironment({ CI: "false", NODE_ENV: "production" }),
    /CI or with NODE_ENV=test/
  );
});

void test("validate-migrations-on-test-db requires an explicit seed profile", () => {
  assert.throws(
    () => resolveValidationSeedProfile([], {}),
    /Validation seed profile must be provided/
  );
});

void test("validate-migrations-on-test-db runs the reset, seed and checklist pipeline with explicit seed CLI", async () => {
  const commands: Array<{ args: string[]; command: string }> = [];
  const reports: Array<{ path: string; payload: unknown }> = [];

  const exitCode = await validateMigrationsMain(
    ["--seed-profile=ci"],
    {
      DATABASE_URL: "postgresql://localhost:5432/birthub_validation?schema=public",
      NODE_ENV: "test"
    },
    {
      runtimeDependencies: {
        createRunId: () => "run-validate-migrations",
        runCommand: (command, args) => {
          commands.push({ args, command });
          return Promise.resolve({ code: 0, output: "ok\n" });
        },
        writeJsonReport: (path, payload) => {
          reports.push({ path, payload });
          return Promise.resolve(path);
        }
      }
    }
  );

  assert.equal(exitCode, 0);
  assert.equal(commands.length, 3);
  assert.match(commands[0]!.args.join(" "), /migrate reset/);
  assert.match(commands[1]!.args.join(" "), /prisma[\\/]seed\.ts/);
  assert.match(commands[1]!.args.join(" "), /--profile=ci/);
  assert.match(commands[2]!.args.join(" "), /post-migration-checklist\.ts/);
  assert.equal(reports.length, 1);
  assert.match(JSON.stringify(reports[0]?.payload), /"runId":"run-validate-migrations"/);
  assert.match(JSON.stringify(reports[0]?.payload), /"script":"db-validate-migrations-on-test-db"/);
  assert.match(JSON.stringify(reports[0]?.payload), /"status":"success"/);
  assert.match(JSON.stringify(reports[0]?.payload), /"type":"migrate"/);
  assert.match(JSON.stringify(reports[0]?.payload), /"type":"seed"/);
  assert.match(JSON.stringify(reports[0]?.payload), /"type":"check"/);
  assert.match(JSON.stringify(reports[0]?.payload), /"type":"infra"/);
});
