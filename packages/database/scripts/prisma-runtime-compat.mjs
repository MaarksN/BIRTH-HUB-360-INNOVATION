#!/usr/bin/env node
// @ts-nocheck
// 
import { access, copyFile } from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const clientPkgJson = require.resolve('@prisma/client/package.json');
const clientPackageDir = path.dirname(clientPkgJson);
const runtimeDir = path.join(path.dirname(clientPkgJson), 'runtime');
const databaseRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const projectRoot = path.resolve(databaseRoot, '..', '..');

const targets = [
  'cockroachdb',
  'mysql',
  'postgresql',
  'sqlite',
  'sqlserver'
];

async function ensureAlias(sourceName, targetName) {
  const source = path.join(runtimeDir, sourceName);
  const target = path.join(runtimeDir, targetName);

  try {
    await access(target);
    return false;
  } catch {
    await copyFile(source, target);
    return true;
  }
}

async function pathExists(targetPath) {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function ensureGeneratedClientPackageAlias() {
  const virtualNodeModulesDir = path.resolve(clientPackageDir, '..', '..');
  const generatedPrismaPackageDir = path.join(virtualNodeModulesDir, '.prisma');
  const rootPrismaPackageDir = path.join(projectRoot, 'node_modules', '.prisma');

  if (!(await pathExists(generatedPrismaPackageDir)) || (await pathExists(rootPrismaPackageDir))) {
    return false;
  }

  await access(path.dirname(rootPrismaPackageDir));
  await fsSymlink(generatedPrismaPackageDir, rootPrismaPackageDir);
  return true;
}

async function fsSymlink(targetPath, aliasPath) {
  const { symlink } = await import('node:fs/promises');
  await symlink(targetPath, aliasPath, process.platform === 'win32' ? 'junction' : 'dir');
}

let created = 0;
for (const dialect of targets) {
  if (await ensureAlias(`query_compiler_bg.${dialect}.js`, `query_compiler_fast_bg.${dialect}.js`)) {
    created += 1;
  }
  if (await ensureAlias(`query_compiler_bg.${dialect}.mjs`, `query_compiler_fast_bg.${dialect}.mjs`)) {
    created += 1;
  }
  if (
    await ensureAlias(
      `query_compiler_bg.${dialect}.wasm-base64.js`,
      `query_compiler_fast_bg.${dialect}.wasm-base64.js`
    )
  ) {
    created += 1;
  }
  if (
    await ensureAlias(
      `query_compiler_bg.${dialect}.wasm-base64.mjs`,
      `query_compiler_fast_bg.${dialect}.wasm-base64.mjs`
    )
  ) {
    created += 1;
  }
}

const linkedGeneratedClient = await ensureGeneratedClientPackageAlias();

process.stdout.write(
  `[prisma-runtime-compat] runtime aliases ensured (created=${created}, generatedClientAlias=${linkedGeneratedClient ? 'created' : 'ready'})\n`
);
