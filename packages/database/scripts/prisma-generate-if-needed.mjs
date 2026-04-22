#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

import "./prisma-runtime-compat.mjs";

const require = createRequire(import.meta.url);
const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const schemaPath = path.join(packageRoot, "prisma", "schema.prisma");
const clientPackageJson = require.resolve("@prisma/client/package.json");
const generatedClientDir = path.join(
  path.dirname(clientPackageJson),
  "..",
  "..",
  ".prisma",
  "client"
);
const generatedSchemaPath = path.join(generatedClientDir, "schema.prisma");
const generatedIndexPath = path.join(generatedClientDir, "index.d.ts");
const generatedEnginePath = path.join(generatedClientDir, "query_engine-windows.dll.node");

function hashFile(filePath) {
  return createHash("sha256").update(readFileSync(filePath)).digest("hex");
}

function generatedClientIsCurrent() {
  if (process.env.BIRTHUB_FORCE_PRISMA_GENERATE === "1") {
    return false;
  }

  if (!existsSync(generatedSchemaPath) || !existsSync(generatedIndexPath)) {
    return false;
  }

  if (process.platform === "win32" && !existsSync(generatedEnginePath)) {
    return false;
  }

  return hashFile(schemaPath) === hashFile(generatedSchemaPath);
}

if (generatedClientIsCurrent()) {
  process.stdout.write("[prisma-generate-if-needed] Prisma client is current; skipping generate\n");
  process.exit(0);
}

const result = spawnSync("prisma", ["generate", "--schema", "prisma/schema.prisma"], {
  shell: process.platform === "win32",
  stdio: "inherit",
});

process.exit(result.status ?? 1);
