#!/usr/bin/env node

import { createRequire } from "node:module";
import path from "node:path";

import { portableNodeExecutable, projectRoot, run } from "./shared.mjs";

const databaseWorkspacePath = "packages/database";
const databaseWorkspaceDir = path.join(projectRoot, databaseWorkspacePath);
const requireFromDatabaseWorkspace = createRequire(path.join(databaseWorkspaceDir, "package.json"));
const prismaCli = requireFromDatabaseWorkspace.resolve("prisma/build/index.js");
const prismaRuntimeCompatScript = path.join(
  databaseWorkspaceDir,
  "scripts",
  "prisma-runtime-compat.mjs"
);

run(portableNodeExecutable, [prismaRuntimeCompatScript], {
  cwd: databaseWorkspaceDir
});

run(portableNodeExecutable, [prismaCli, "generate", "--schema", "prisma/schema.prisma"], {
  cwd: databaseWorkspaceDir
});
