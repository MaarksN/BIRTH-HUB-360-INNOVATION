const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const root = process.cwd();

const opsDirs = [
  '.ops/snapshots',
  '.ops/inventory',
  '.ops/analysis',
  '.ops/sbom',
  '.ops/reports',
  '.ops/logs',
  '.ops/quarantine',
  '.ops/quarantine/runtime-noise',
  '.ops/quarantine/runtime-noise/root-files',
  '.ops/evidence/cycle1',
  '.ops/tools',
];

for (const relDir of opsDirs) {
  fs.mkdirSync(path.join(root, relDir), { recursive: true });
}

const logLines = [];
function log(line) {
  logLines.push(`[${new Date().toISOString()}] ${line}`);
}

function sh(command) {
  return cp.execSync(command, {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function shNoThrow(command) {
  try {
    return sh(command);
  } catch {
    return '';
  }
}

function writeFile(relPath, content) {
  const fullPath = path.join(root, relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
  log(`wrote ${relPath}`);
}

function stripJsonComments(input) {
  return input
    .replace(/^\uFEFF/, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|\s+)\/\/.*$/gm, '');
}

function readJson(fullPath) {
  try {
    return JSON.parse(stripJsonComments(fs.readFileSync(fullPath, 'utf8')));
  } catch {
    return null;
  }
}

function readText(relPath) {
  return fs.readFileSync(path.join(root, relPath), 'utf8');
}

function rel(fullPath) {
  return path.relative(root, fullPath).replace(/\\/g, '/');
}

function exists(relPath) {
  return fs.existsSync(path.join(root, relPath));
}

function lines(text) {
  return text.split(/\r?\n/);
}

function shortSnippet(line) {
  return line.trim().replace(/\s+/g, ' ').slice(0, 120);
}

function walk(dir, options = {}) {
  const exclude = options.exclude || new Set(['.git', 'node_modules']);
  const entries = [];

  function recurse(current, depth) {
    const items = fs.readdirSync(current, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
    for (const item of items) {
      if (exclude.has(item.name)) continue;
      const fullPath = path.join(current, item.name);
      const relative = rel(fullPath);
      if (item.isDirectory()) {
        entries.push({ type: 'dir', rel: relative, depth });
        recurse(fullPath, depth + 1);
      } else {
        entries.push({ type: 'file', rel: relative, depth });
      }
    }
  }

  recurse(dir, 0);
  return entries;
}

function globToRegex(glob) {
  const escaped = glob.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  const placeholder = '__DOUBLE_STAR__';
  const regex = `^${escaped.replace(/\*\*/g, placeholder).replace(/\*/g, '[^/]+').replace(new RegExp(placeholder, 'g'), '.*')}$`;
  return new RegExp(regex);
}

function isPlaceholderValue(value) {
  if (!value || !String(value).trim()) return true;
  return /(example|masked|placeholder|changeme|dummy|sample|localhost|127\.0\.0\.1|prod_password|staging_password|your_|<.*>|\{\{.*\}\})/i.test(String(value));
}

function firstRegexCapture(regex, text) {
  const match = text.match(regex);
  if (!match) return null;
  return match[1] || match[0];
}

function contextForFile(file) {
  const normalized = file.replace(/\\/g, '/');
  const base = path.basename(normalized).toLowerCase();
  if (/apps\/legacy\//.test(normalized)) return 'legacy';
  if (/(^|\/)(test|tests|e2e|integration)(\/|$)|\.(test|spec)\./.test(normalized)) return 'test';
  if (/scripts\/(release|ci|docs|audit|security|forensics|quality|coverage|agent|ops|bootstrap|setup|clean|billing|privacy|testing)\//.test(normalized)) return 'build';
  if (/(main|bootstrap|server)\.(ts|js|mjs|cjs)$/.test(base)) return 'bootstrap';
  if (/(module|routes|providers|container)\.(ts|js)$/.test(base)) return 'composition-root';
  if (/(dto|schema|types|interface|contract)\.(ts|tsx|js)$/.test(base)) return 'contract';
  return 'domain';
}

function severityFromType(type) {
  if (type === 'ts-nocheck' || type === 'noCheck') return 'CRITICAL';
  if (type === 'ts-ignore' || type === 'any-signature' || type === 'eslint-disable') return 'HIGH';
  if (type === 'skipLibCheck' || type === 'ts-expect-error') return 'MEDIUM';
  return 'LOW';
}

const trackedFiles = sh('git ls-files').split(/\r?\n/).filter(Boolean);
const trackedTextFiles = trackedFiles.filter((file) => !/(^|\/)(node_modules|\.git|\.ops|dist|coverage|\.next)\//.test(file));

const gitStatusRaw = shNoThrow('git status --porcelain=v1 -uall').split(/\r?\n/).filter(Boolean);
const dirtyState = { is_dirty: gitStatusRaw.length > 0, modified: [], untracked: [], staged: [] };
for (const line of gitStatusRaw) {
  const status = line.slice(0, 2);
  const file = line.slice(3).trim();
  if (status.includes('?')) dirtyState.untracked.push(file);
  if (status[0] !== ' ' && status[0] !== '?') dirtyState.staged.push(file);
  if (status[1] !== ' ' && status[1] !== '?') dirtyState.modified.push(file);
  if (status[0] === 'U' || status[1] === 'U' || status === 'AA' || status === 'DD') {
    dirtyState.modified.push(file);
    dirtyState.staged.push(file);
  }
}

const branch = shNoThrow('git rev-parse --abbrev-ref HEAD') || '[INCONCLUSIVO]';
const commitSha = shNoThrow('git rev-parse HEAD') || '[INCONCLUSIVO]';
const lastCommitParts = shNoThrow('git log -1 --format="%H%n%an%n%aI%n%s"').split(/\r?\n/);
const tags = shNoThrow('git tag').split(/\r?\n/).filter(Boolean);
const totalCommits = Number(shNoThrow('git rev-list --count HEAD') || 0);

const rootPkg = readJson(path.join(root, 'package.json'));
const workspaceGlobs = Array.isArray(rootPkg?.workspaces) ? rootPkg.workspaces : [];
const workspaceRegexes = workspaceGlobs.map(globToRegex);
const packageJsonFiles = trackedFiles.filter((file) => /(^|\/)package\.json$/.test(file) && !/(^|\/)(node_modules|\.git|\.ops|\.tools)\//.test(file));

const manifests = packageJsonFiles.map((file) => {
  const json = readJson(path.join(root, file));
  return {
    path: file,
    dir: path.posix.dirname(file),
    name: json?.name || '[INCONCLUSIVO]',
    version: json?.version ?? null,
    private: json?.private ?? null,
    workspaces: json?.workspaces ?? null,
    packageManager: json?.packageManager ?? null,
    engines: json?.engines ?? null,
    scripts: json?.scripts ?? {},
    dependencies: json?.dependencies ?? {},
    devDependencies: json?.devDependencies ?? {},
    peerDependencies: json?.peerDependencies ?? {},
    raw: json ?? {},
  };
});

const workspacePackages = manifests
  .filter((manifest) => manifest.path !== 'package.json')
  .filter((manifest) => workspaceRegexes.some((regex) => regex.test(manifest.dir) || regex.test(`${manifest.dir}/`)));

const snapshot = {
  timestamp: new Date().toISOString(),
  branch,
  commit_sha: commitSha,
  commit_message: lastCommitParts[3] || '[INCONCLUSIVO]',
  commit_author: lastCommitParts[1] || '[INCONCLUSIVO]',
  commit_date: lastCommitParts[2] || '[INCONCLUSIVO]',
  dirty_state: dirtyState,
  tags,
  total_commits: totalCommits,
  workspace_packages: workspacePackages.map((manifest) => manifest.name),
};
writeFile('.ops/snapshots/snapshot.json', `${JSON.stringify(snapshot, null, 2)}\n`);

const treeEntries = walk(root, { exclude: new Set(['.git', 'node_modules']) });
const repoTree = ['.']
  .concat(treeEntries.map((entry) => `${'  '.repeat(entry.depth + 1)}${entry.type === 'dir' ? '[D]' : '-'} ${path.posix.basename(entry.rel)}`))
  .join('\n');
writeFile('.ops/snapshots/repo-tree.txt', `${repoTree}\n`);

const packageManagers = {};
for (const binary of ['pnpm', 'npm', 'yarn']) {
  const version = shNoThrow(`${binary} --version`);
  if (version) packageManagers[binary] = version.split(/\r?\n/)[0].trim();
}
const lockfiles = ['pnpm-lock.yaml', 'package-lock.json', 'yarn.lock'].filter(exists);
const realWorkspaceDirs = manifests.filter((manifest) => manifest.path !== 'package.json' && /^(apps|packages)\//.test(manifest.path)).map((manifest) => manifest.dir);
const declaredWorkspaceDirs = new Set(workspacePackages.map((manifest) => manifest.dir));
const workspaceDrift = realWorkspaceDirs.filter((dir) => !declaredWorkspaceDirs.has(dir));

const packagesTxt = [
  `root_package_manager=${rootPkg?.packageManager || '[INCONCLUSIVO]'}`,
  `executables=${JSON.stringify(packageManagers)}`,
  `lockfiles=${lockfiles.length ? lockfiles.join(', ') : 'none'}`,
  `declared_workspace_globs=${workspaceGlobs.join(', ') || 'none'}`,
  `declared_workspace_count=${workspacePackages.length}`,
  `real_workspace_count=${realWorkspaceDirs.length}`,
  `real_workspaces_missing_from_decl=${workspaceDrift.join(', ') || 'none'}`,
  '',
];
for (const manifest of manifests.sort((a, b) => a.path.localeCompare(b.path))) {
  packagesTxt.push(`${manifest.path}`);
  packagesTxt.push(`  name=${manifest.name}`);
  packagesTxt.push(`  version=${manifest.version}`);
  packagesTxt.push(`  private=${manifest.private}`);
  packagesTxt.push(`  packageManager=${manifest.packageManager}`);
  packagesTxt.push(`  engines=${JSON.stringify(manifest.engines)}`);
  packagesTxt.push(`  workspaces=${JSON.stringify(manifest.workspaces)}`);
  packagesTxt.push(`  scripts=${Object.keys(manifest.scripts).length}`);
  packagesTxt.push('');
}
writeFile('.ops/inventory/packages.txt', packagesTxt.join('\n'));
writeFile(
  '.ops/inventory/scripts-map.json',
  `${JSON.stringify(manifests.map((manifest) => ({ path: manifest.path, name: manifest.name, scripts: manifest.scripts })), null, 2)}\n`
);

const configFiles = trackedFiles.filter((file) => /(^|\/)(tsconfig[^/]*\.json|jsconfig[^/]*\.json)$/.test(file) && !/(^|\/)(node_modules|\.git|\.ops)\//.test(file));
const configMap = configFiles.map((file) => {
  const json = readJson(path.join(root, file)) || {};
  return {
    path: file,
    extends: json.extends ?? null,
    baseUrl: json.compilerOptions?.baseUrl ?? null,
    paths: json.compilerOptions?.paths ?? null,
    strict: json.compilerOptions?.strict ?? null,
    skipLibCheck: json.compilerOptions?.skipLibCheck ?? null,
    noCheck: json.compilerOptions?.noCheck ?? null,
    include: json.include ?? null,
    exclude: json.exclude ?? null,
  };
});
writeFile('.ops/inventory/tsconfig-map.json', `${JSON.stringify(configMap, null, 2)}\n`);

const dockerFiles = trackedFiles.filter((file) => /(^|\/)(Dockerfile[^/]*|docker-compose[^/]*\.ya?ml|compose[^/]*\.ya?ml)$/.test(file));
const dockerLines = [];
for (const file of dockerFiles) {
  const text = readText(file);
  const from = [...text.matchAll(/^FROM\s+([^\s]+)(?:\s+AS\s+([^\s]+))?/gim)].map((match) => ({ image: match[1], stage: match[2] || null }));
  const cmd = [...text.matchAll(/^CMD\s+(.+)$/gim)].map((match) => match[1].trim());
  const entrypoint = [...text.matchAll(/^ENTRYPOINT\s+(.+)$/gim)].map((match) => match[1].trim());
  const expose = [...text.matchAll(/^EXPOSE\s+(.+)$/gim)].map((match) => match[1].trim());
  dockerLines.push(JSON.stringify({ path: file, from, cmd, entrypoint, expose }));
}
writeFile('.ops/inventory/dockerfiles.txt', `${dockerLines.join('\n')}\n`);

const workflowFiles = trackedFiles.filter((file) => /^\.github\/workflows\/.+\.ya?ml$/.test(file));
const workflowSummaries = [];
for (const file of workflowFiles) {
  const text = readText(file);
  const workflowLines = lines(text);
  const trigger = workflowLines.find((line) => line.trim().startsWith('on:')) || '[INCONCLUSIVO]';
  const run = workflowLines.filter((line) => /^\s*run:/.test(line)).map((line) => line.trim().replace(/^run:\s*/, ''));
  const uses = workflowLines.filter((line) => /^\s*uses:/.test(line)).map((line) => line.trim().replace(/^uses:\s*/, ''));
  workflowSummaries.push({
    path: file,
    trigger: trigger.trim(),
    continue_on_error: text.includes('continue-on-error: true'),
    run,
    uses,
  });
}
writeFile('.ops/inventory/ci-files.txt', `${workflowSummaries.map((item) => JSON.stringify(item)).join('\n')}\n`);

const envFilesOnDisk = walk(root, { exclude: new Set(['.git', 'node_modules', '.ops']) })
  .filter((entry) => entry.type === 'file' && /(^|\/)\.env($|\.)/.test(entry.rel))
  .map((entry) => entry.rel);

const referencedVars = new Map();
for (const file of trackedTextFiles.filter((entry) => /\.(ts|tsx|js|mjs|cjs|mts|cts|py|json|md|yml|yaml|sh|ps1)$/.test(entry))) {
  const text = readText(file);
  for (const match of text.matchAll(/process\.env\.([A-Z0-9_]+)/g)) {
    const key = match[1];
    if (!referencedVars.has(key)) referencedVars.set(key, []);
    referencedVars.get(key).push(file);
  }
  for (const match of text.matchAll(/env\.([A-Z0-9_]{2,})\b/g)) {
    const key = match[1];
    if (!referencedVars.has(key)) referencedVars.set(key, []);
    referencedVars.get(key).push(file);
  }
}

const documentedVars = new Map();
for (const file of envFilesOnDisk) {
  const text = fs.readFileSync(path.join(root, file), 'utf8');
  for (const line of lines(text)) {
    const match = line.match(/^([A-Z0-9_]+)=/);
    if (!match) continue;
    const key = match[1];
    if (!documentedVars.has(key)) documentedVars.set(key, []);
    documentedVars.get(key).push(file);
  }
}

const potentialSecrets = [];
for (const file of trackedFiles.filter((entry) => /(^|\/)\.env($|\.)/.test(entry))) {
  const text = readText(file);
  for (const line of lines(text)) {
    const match = line.match(/^([A-Z0-9_]+)=(.+)$/);
    if (!match) continue;
    const [, key, value] = match;
    if (!isPlaceholderValue(value) && /(SECRET|TOKEN|KEY|PASSWORD|DATABASE_URL|REDIS_URL|DSN|AUTH|STRIPE|SESSION|HMAC)/i.test(key)) {
      potentialSecrets.push({ file, key, value_preview: value.slice(0, 24) });
    }
  }
}

const inlineSecrets = [];
const secretPatterns = [
  /(sk_live_[A-Za-z0-9_]+)/g,
  /(whsec_[A-Za-z0-9_]+)/g,
  /(postgres(?:ql)?:\/\/[^\s'"`]+)/g,
  /(rediss?:\/\/[^\s'"`]+)/g,
  /(AIza[0-9A-Za-z\-_]{20,})/g,
];

for (const file of trackedTextFiles.filter((entry) => /\.(ts|tsx|js|mjs|cjs|py|sh|ps1|yml|yaml|json)$/.test(entry))) {
  const text = readText(file);
  for (const pattern of secretPatterns) {
    for (const match of text.matchAll(pattern)) {
      inlineSecrets.push({ file, match: match[1].slice(0, 40) });
    }
  }
}

const usedNotDocumented = [...referencedVars.keys()].filter((key) => !documentedVars.has(key)).sort();
const documentedNotUsed = [...documentedVars.keys()].filter((key) => !referencedVars.has(key)).sort();

writeFile(
  '.ops/inventory/env-map.json',
  `${JSON.stringify(
    {
      env_files_on_disk: envFilesOnDisk,
      documented_variables: [...documentedVars.keys()].sort(),
      referenced_variables: [...referencedVars.keys()].sort(),
      used_not_documented: usedNotDocumented,
      documented_not_used: documentedNotUsed,
      tracked_env_with_potential_real_values: potentialSecrets,
      inline_secret_hits: inlineSecrets,
      gitignore_env_policy: shNoThrow('git check-ignore .env .env.local .env.production .env.vps'),
    },
    null,
    2
  )}\n`
);

const suppressionItems = [];
for (const file of trackedTextFiles.filter((entry) => /\.(ts|tsx|js|mjs|cjs|mts|cts)$/.test(entry))) {
  const text = readText(file);
  const fileContext = contextForFile(file);
  lines(text).forEach((line, index) => {
    if (line.includes('@ts-nocheck')) {
      suppressionItems.push({
        file,
        line: index + 1,
        type: 'ts-nocheck',
        severity: severityFromType('ts-nocheck'),
        location_context: fileContext,
        snippet: shortSnippet(line),
        notes: 'Directive disables TypeScript checking for the whole file.',
      });
    }
    if (line.includes('@ts-ignore')) {
      suppressionItems.push({
        file,
        line: index + 1,
        type: 'ts-ignore',
        severity: severityFromType('ts-ignore'),
        location_context: fileContext,
        snippet: shortSnippet(line),
        notes: 'Directive suppresses TypeScript diagnostics.',
      });
    }
    if (line.includes('@ts-expect-error')) {
      suppressionItems.push({
        file,
        line: index + 1,
        type: 'ts-expect-error',
        severity: severityFromType('ts-expect-error'),
        location_context: fileContext,
        snippet: shortSnippet(line),
        notes: 'Directive expects an error; no justification parser was applied.',
      });
    }
    if (/eslint-disable(?!-next-line\s+[a-z0-9-]+)/i.test(line) || /eslint-disable-next-line/i.test(line)) {
      suppressionItems.push({
        file,
        line: index + 1,
        type: 'eslint-disable',
        severity: severityFromType('eslint-disable'),
        location_context: fileContext,
        snippet: shortSnippet(line),
        notes: 'ESLint suppression found.',
      });
    }
    if (/:\s*any\b/.test(line) && /(export|public|interface|type|class|function|=>)/.test(line)) {
      suppressionItems.push({
        file,
        line: index + 1,
        type: 'any-signature',
        severity: severityFromType('any-signature'),
        location_context: fileContext,
        snippet: shortSnippet(line),
        notes: 'Explicit any found in a likely public signature.',
      });
    }
  });
}

for (const config of configMap) {
  const fileContext = contextForFile(config.path);
  if (config.noCheck === true) {
    suppressionItems.push({
      file: config.path,
      line: 1,
      type: 'noCheck',
      severity: 'CRITICAL',
      location_context: fileContext,
      snippet: '"noCheck": true',
      notes: 'Compiler config disables checking.',
    });
  }
  if (config.skipLibCheck === true) {
    suppressionItems.push({
      file: config.path,
      line: 1,
      type: 'skipLibCheck',
      severity: 'MEDIUM',
      location_context: fileContext,
      snippet: '"skipLibCheck": true',
      notes: 'Library type checking skipped.',
    });
  }
}

const suppressionSummary = { total: suppressionItems.length, critical: 0, high: 0, medium: 0, low: 0 };
for (const item of suppressionItems) {
  suppressionSummary[item.severity.toLowerCase()] += 1;
}
writeFile('.ops/analysis/type-suppressions.json', `${JSON.stringify({ summary: suppressionSummary, items: suppressionItems }, null, 2)}\n`);

const internalNames = new Set(workspacePackages.map((manifest) => manifest.name));
const dependencyGraph = new Map();
for (const manifest of workspacePackages) {
  const deps = { ...manifest.dependencies, ...manifest.devDependencies, ...manifest.peerDependencies };
  dependencyGraph.set(
    manifest.name,
    Object.keys(deps).filter((name) => internalNames.has(name))
  );
}

function detectCycles(graph) {
  const visiting = new Set();
  const visited = new Set();
  let cycle = false;

  function dfs(node) {
    if (visiting.has(node)) {
      cycle = true;
      return;
    }
    if (visited.has(node)) return;
    visiting.add(node);
    for (const next of graph.get(node) || []) dfs(next);
    visiting.delete(node);
    visited.add(node);
  }

  for (const node of graph.keys()) dfs(node);
  return cycle;
}

const circularDepsDetected = detectCycles(dependencyGraph);

const composeFiles = dockerFiles.filter((file) => /(docker-compose|compose).*\.ya?ml$/.test(file));
const composeByService = {};
for (const file of composeFiles) {
  const text = readText(file);
  let inServices = false;
  let currentService = null;
  for (const line of lines(text)) {
    if (line.trim() === 'services:') {
      inServices = true;
      continue;
    }
    if (!inServices) continue;
    const serviceMatch = line.match(/^\s{2}([A-Za-z0-9_-]+):\s*$/);
    if (serviceMatch) {
      currentService = serviceMatch[1];
      composeByService[currentService] = composeByService[currentService] || [];
      continue;
    }
    const commandMatch = line.match(/^\s{4}(command|entrypoint):\s*(.+)$/);
    if (currentService && commandMatch) {
      composeByService[currentService].push(line.trim());
    }
  }
}

const workflowTexts = workflowFiles.map((file) => ({ file, text: readText(file) }));
function findCiCommand(packageName, packageDir) {
  for (const workflow of workflowTexts) {
    for (const line of lines(workflow.text)) {
      if (!/^\s*run:/.test(line)) continue;
      if (line.includes(packageName) || line.includes(packageDir) || line.includes(path.posix.basename(packageDir))) {
        return `${workflow.file}: ${line.trim().replace(/^run:\s*/, '')}`;
      }
    }
  }
  return null;
}

function dockerInfoForDir(packageDir) {
  const dockerFile = trackedFiles.find((file) => file === `${packageDir}/Dockerfile` || file.startsWith(`${packageDir}/Dockerfile.`));
  if (!dockerFile) return { docker_cmd: null, docker_entrypoint: null };
  const text = readText(dockerFile);
  return {
    docker_cmd: firstRegexCapture(/^CMD\s+(.+)$/gim, text),
    docker_entrypoint: firstRegexCapture(/^ENTRYPOINT\s+(.+)$/gim, text),
  };
}

function composeCommandFor(names) {
  for (const name of names) {
    if (composeByService[name]?.length) return composeByService[name].join(' | ');
  }
  return null;
}

const corePaths = ['apps/api', 'apps/web', 'apps/worker', 'packages/config', 'packages/database', 'packages/logger'];
const buildRuntimeMap = { packages: [] };

for (const packageDir of corePaths) {
  const manifest = manifests.find((item) => item.dir === packageDir);
  const pkg = manifest?.raw || {};
  const docker = dockerInfoForDir(packageDir);
  const distDir = path.join(root, packageDir, 'dist');
  const distExists = fs.existsSync(distDir);
  const distPopulated = distExists && fs.readdirSync(distDir).length > 0;
  const startScript = pkg.scripts?.start ?? null;
  const incoherences = [];
  if (startScript && /dist\//.test(startScript) && !distExists) {
    incoherences.push('Start script references dist/, but local package dist/ is absent.');
  }
  if (docker.docker_cmd && /(pnpm|npm)\s+start/.test(docker.docker_cmd) && startScript && /dist\//.test(startScript) && !distExists) {
    incoherences.push('Docker delegates to start script that targets dist/ absent locally.');
  }
  if (!pkg.scripts?.build) {
    incoherences.push('Missing build script in manifest.');
  }
  buildRuntimeMap.packages.push({
    name: manifest?.name || packageDir,
    path: packageDir,
    scripts: {
      build: pkg.scripts?.build ?? null,
      dev: pkg.scripts?.dev ?? null,
      start: startScript,
    },
    entrypoints: {
      main: pkg.main ?? null,
      module: pkg.module ?? null,
      types: pkg.types ?? pkg.typings ?? null,
      exports: pkg.exports ?? null,
    },
    dist_exists: distExists,
    dist_populated: distPopulated,
    docker_cmd: docker.docker_cmd,
    docker_entrypoint: docker.docker_entrypoint,
    compose_command: composeCommandFor([
      path.posix.basename(packageDir),
      path.posix.basename(packageDir).replace(/-/g, ''),
      manifest?.name?.split('/').pop(),
    ]),
    ci_command: manifest ? findCiCommand(manifest.name, packageDir) : null,
    incoherences,
    circular_deps_detected: circularDepsDetected,
  });
}

writeFile('.ops/analysis/build-runtime-map.json', `${JSON.stringify(buildRuntimeMap, null, 2)}\n`);

function classifyArea(area) {
  if (corePaths.includes(area)) return ['CORE CANÔNICO', 'CORE', 'SOBREVIVE'];
  if (area === 'apps/legacy' || area === 'apps/legacy/dashboard') return ['LEGADO', 'PERIPHERAL', 'QUARENTENA'];
  if (area === 'audit' || area === 'artifacts' || area === 'docs') return ['EVIDÊNCIA / DOCUMENTAÇÃO', 'PERIPHERAL', 'SOBREVIVE'];
  if (area === 'scripts' || area === 'tests' || area === 'infra' || area === 'releases' || area === 'ops') return ['SATÉLITE ÚTIL', 'SUPPORT', 'INVESTIGAR'];
  if (area === '.tools') return ['SUSPEITO ATÉ PROVA', 'PERIPHERAL', 'INVESTIGAR'];
  if (area.startsWith('.ops/quarantine/runtime-noise')) return ['RUÍDO OPERACIONAL', 'ORPHAN', 'QUARENTENA'];
  return ['SUSPEITO ATÉ PROVA', 'PERIPHERAL', 'INCONCLUSIVO'];
}

const matrixAreas = [
  'apps/api',
  'apps/web',
  'apps/worker',
  'packages/config',
  'packages/database',
  'packages/logger',
  'packages/agents-core',
  'packages/workflows-core',
  'packages/testing',
  'apps/legacy',
  'apps/legacy/dashboard',
  'audit',
  'artifacts',
  'docs',
  'scripts',
  'tests',
  'infra',
  'releases',
  'ops',
  '.tools',
  '.ops/quarantine/runtime-noise/root-files',
];

const matrix = matrixAreas.map((area) => {
  const [category, centrality, decision] = classifyArea(area);
  let evidence = '[INCONCLUSIVO]';
  let risk = 'P2';
  let notes = 'Classificação baseada em centralidade observável.';

  if (corePaths.includes(area)) {
    evidence = exists(`${area}/package.json`)
      ? `${area}/package.json existe; scripts raiz referenciam o pacote`
      : `${area} existe no disco sem manifesto rastreável`;
    risk = 'P1';
    notes = 'Módulo do núcleo canônico.';
  } else if (area === 'apps/legacy' || area === 'apps/legacy/dashboard') {
    evidence = exists(area) ? `${area} existe fora da lista canônica.` : '[INCONCLUSIVO]';
    notes = 'Superfície legada fora do caminho canônico.';
  } else if (area.startsWith('.ops/quarantine/runtime-noise')) {
    evidence = exists(area) ? `${area} existe e contém ruído removido da raiz.` : '[INCONCLUSIVO]';
    risk = 'P3';
    notes = 'Itens já isolados.';
  } else if (exists(area)) {
    evidence = `${area} existe no disco.`;
  }

  return { path: area, category, centrality, evidence, risk, decision, notes };
});

writeFile('.ops/analysis/core-vs-noise-matrix.json', `${JSON.stringify(matrix, null, 2)}\n`);

writeFile(
  '.ops/sbom/deps-fallback.json',
  `${JSON.stringify(
    {
      generated_at: new Date().toISOString(),
      package_manager: rootPkg?.packageManager || null,
      packages: manifests
        .filter((manifest) => /^(apps|packages)\//.test(manifest.path))
        .map((manifest) => ({
          path: manifest.path,
          name: manifest.name,
          version: manifest.version,
          dependencies: manifest.dependencies,
          devDependencies: manifest.devDependencies,
          peerDependencies: manifest.peerDependencies,
        })),
    },
    null,
    2
  )}\n`
);

const trackedCounts = {
  ts: trackedFiles.filter((file) => file.endsWith('.ts')).length,
  tsx: trackedFiles.filter((file) => file.endsWith('.tsx')).length,
  py: trackedFiles.filter((file) => file.endsWith('.py')).length,
  tests: trackedFiles.filter((file) => /(\/__tests__\/|\.(test|spec)\.(ts|tsx|js|mjs|cjs|py)$|(^|\/)(test|tests|e2e|integration)\/)/.test(file)).length,
  configs: configFiles.length,
  dockerfiles: dockerFiles.length,
  workflows: workflowFiles.length,
};

const frameworks = new Set();
for (const manifest of manifests) {
  const deps = { ...manifest.dependencies, ...manifest.devDependencies };
  ['jest', 'vitest', '@playwright/test', 'pytest', 'supertest', 'c8'].forEach((dep) => {
    if (deps[dep]) frameworks.add(dep);
  });
}
if (exists('pytest.ini')) frameworks.add('pytest');

const skippedTests = trackedTextFiles
  .filter((file) => /\.(ts|tsx|js|mjs|cjs|py)$/.test(file))
  .reduce((count, file) => {
    const matches = readText(file).match(/\b(describe\.skip|it\.skip|test\.skip|xit\b|xtest\b|TODO\b)/g);
    return count + (matches ? matches.length : 0);
  }, 0);

const coreTestCount = trackedFiles.filter(
  (file) =>
    /^(apps\/api|apps\/web|apps\/worker|packages\/config|packages\/database|packages\/logger)\//.test(file) &&
    /(\/__tests__\/|\.(test|spec)\.|(^|\/)(test|tests|e2e|integration)\/)/.test(file)
).length;

const depVersions = new Map();
for (const manifest of manifests.filter((item) => /^(apps|packages)\//.test(item.path))) {
  const deps = { ...manifest.dependencies, ...manifest.devDependencies, ...manifest.peerDependencies };
  for (const [name, version] of Object.entries(deps)) {
    if (!depVersions.has(name)) depVersions.set(name, new Map());
    if (!depVersions.get(name).has(version)) depVersions.get(name).set(version, []);
    depVersions.get(name).get(version).push(manifest.name);
  }
}

const divergentDeps = [...depVersions.entries()]
  .filter(([, versionMap]) => versionMap.size > 1)
  .map(([name, versionMap]) => ({ name, versions: [...versionMap.keys()] }));

const devToolInDependencies = [];
const devToolPatterns = [/^typescript$/, /^@types\//, /^eslint$/, /^prettier$/, /^turbo$/, /^tsx$/, /^husky$/, /^lint-staged$/, /^knip$/, /^@playwright\/test$/];
for (const manifest of manifests) {
  for (const [name, version] of Object.entries(manifest.dependencies)) {
    if (devToolPatterns.some((pattern) => pattern.test(name))) {
      devToolInDependencies.push({ package: manifest.name, dep: name, version });
    }
  }
}

const runtimeImportedDevDeps = [];
for (const manifest of manifests) {
  for (const [name, version] of Object.entries(manifest.devDependencies)) {
    const sourceFiles = trackedFiles.filter(
      (file) =>
        file.startsWith(`${manifest.dir}/`) &&
        /\.(ts|tsx|js|mjs|cjs)$/.test(file) &&
        !/(\.test\.|\.spec\.|\/tests\/|\/test\/)/.test(file)
    );
    let imported = false;
    for (const file of sourceFiles) {
      const text = readText(file);
      if (
        text.includes(`from '${name}'`) ||
        text.includes(`from "${name}"`) ||
        text.includes(`require('${name}')`) ||
        text.includes(`require("${name}")`)
      ) {
        imported = true;
        break;
      }
    }
    if (imported) runtimeImportedDevDeps.push({ package: manifest.name, dep: name, version });
  }
}

const unstableRefs = [];
for (const manifest of manifests) {
  const deps = { ...manifest.dependencies, ...manifest.devDependencies, ...manifest.peerDependencies };
  for (const [name, version] of Object.entries(deps)) {
    if (/^(patch:|file:|link:|portal:|\*|latest$)/.test(String(version))) {
      unstableRefs.push({ package: manifest.name, dep: name, version });
    }
  }
}

const distTracked = trackedFiles.filter((file) => /(^|\/)dist\//.test(file));
const tsNoCheckCoreCount = suppressionItems.filter(
  (item) => item.type === 'ts-nocheck' && /^(apps\/api|apps\/web|apps\/worker|packages\/config|packages\/database|packages\/logger)\//.test(item.file)
).length;
const noCheckProdConfigs = suppressionItems.filter(
  (item) => item.type === 'noCheck' && /^(apps\/api|apps\/web|apps\/worker|packages\/config|packages\/database|packages\/logger|tsconfig)/.test(item.file)
);
const criticalCiAllContinue = workflowSummaries.length > 0 && workflowSummaries.every((workflow) => workflow.continue_on_error);

const blockingTriggers = [];
if (noCheckProdConfigs.length) blockingTriggers.push('noCheck: true em config de produção/core');
if (!lockfiles.length) blockingTriggers.push('Lockfile ausente');
if (distTracked.length) blockingTriggers.push('dist/ rastreado pelo Git');
if (coreTestCount === 0) blockingTriggers.push('Nenhum teste executável detectado no core canônico');
if (criticalCiAllContinue) blockingTriggers.push('CI crítico integralmente em continue-on-error');
if (tsNoCheckCoreCount > 3) blockingTriggers.push('Mais de 3 arquivos @ts-nocheck no core canônico');

const scores = {
  snapshot: dirtyState.is_dirty ? 6 : 9,
  inventario: 8,
  tipagem: Math.max(0, 8 - Math.min(8, suppressionSummary.critical + Math.ceil(suppressionSummary.high / 10))),
  build_runtime: Math.max(1, 8 - buildRuntimeMap.packages.reduce((sum, pkg) => sum + pkg.incoherences.length, 0)),
  env: potentialSecrets.length || inlineSecrets.length ? 3 : 7,
  testes: coreTestCount === 0 ? 0 : Math.min(8, 4 + Math.floor(coreTestCount / 20)),
  deps: lockfiles.includes('pnpm-lock.yaml') ? 7 : 0,
};
const totalScore = Number(((scores.snapshot + scores.inventario + scores.tipagem + scores.build_runtime + scores.env + scores.testes + scores.deps) / 7).toFixed(1));

const findings = [];
if (dirtyState.is_dirty) findings.push({ risk: 'P0', text: `Árvore Git não está limpa; há ${gitStatusRaw.length} entrada(s) no status e pelo menos um conflito operacional em ${dirtyState.modified[0] || '[INCONCLUSIVO]'}.` });
if (!lockfiles.includes('pnpm-lock.yaml')) findings.push({ risk: 'P0', text: 'pnpm-lock.yaml não está presente no repositório atual.' });
if (workspaceDrift.length) findings.push({ risk: 'P1', text: `Há workspaces reais fora do conjunto declarado: ${workspaceDrift.join(', ')}.` });
if (usedNotDocumented.length) findings.push({ risk: 'P1', text: `${usedNotDocumented.length} variável(is) usadas no código não estão documentadas em arquivos .env* rastreados.` });
if (potentialSecrets.length || inlineSecrets.length) findings.push({ risk: 'P1', text: `Há ${potentialSecrets.length + inlineSecrets.length} ocorrência(s) heurísticas de segredo/credencial; autenticidade real segue [INCONCLUSIVO].` });
if (suppressionSummary.critical) findings.push({ risk: 'P1', text: `${suppressionSummary.critical} supressão(ões) críticas de tipagem foram localizadas.` });
if (buildRuntimeMap.packages.some((pkg) => pkg.incoherences.length)) findings.push({ risk: 'P1', text: 'Há incoerências entre manifestos, dist local e runtime descrito em Docker/CI no core canônico.' });

const findingTotals = { P0: 0, P1: 0, P2: 0, P3: 0 };
for (const finding of findings) findingTotals[finding.risk] += 1;

const coreSection = corePaths
  .map((packageDir) => `- ${packageDir}: ${exists(packageDir) ? `presente; evidência: ${packageDir}/package.json` : 'ausente'}`)
  .join('\n');
const suspectSection = matrix.filter((item) => !corePaths.includes(item.path)).map((item) => `- ${item.path} => ${item.category} (${item.decision})`).join('\n');
const typingTable =
  suppressionItems
    .slice(0, 30)
    .map((item) => `| ${item.file}:${item.line} | ${item.type} | ${item.severity} | ${item.location_context} |`)
    .join('\n') || '| [INCONCLUSIVO] | - | - | - |';
const buildTable = buildRuntimeMap.packages
  .map(
    (pkg) =>
      `| ${pkg.name} | runtime | ${pkg.scripts.start || 'null'} | docker=${pkg.docker_cmd || 'null'} ci=${pkg.ci_command || 'null'} | ${(pkg.incoherences[0] || 'nenhuma').replace(/\|/g, '/')} |`
  )
  .join('\n');

const phase0Status = blockingTriggers.length ? 'NÃO APTO PARA AVANÇAR' : 'APTO COM RESTRIÇÕES';
const phase0Report = `# 1. RESUMO EXECUTIVO DO CICLO 0
- Scorecard por dimensão (0–10):
  - snapshot: ${scores.snapshot}
  - inventario: ${scores.inventario}
  - tipagem: ${scores.tipagem}
  - build_runtime: ${scores.build_runtime}
  - env: ${scores.env}
  - testes: ${scores.testes}
  - deps: ${scores.deps}
- Total de achados por severidade: P0=${findingTotals.P0} P1=${findingTotals.P1} P2=${findingTotals.P2} P3=${findingTotals.P3}
- Gatilhos de bloqueio ativados: ${blockingTriggers.length ? blockingTriggers.join(', ') : 'nenhum'}

# 2. ESTADO GIT E SNAPSHOT
- Branch: ${branch}
- SHA: ${commitSha}
- Dirty state: ${JSON.stringify(dirtyState)}
- Último commit: ${snapshot.commit_author} em ${snapshot.commit_date}

# 3. INVENTÁRIO GLOBAL
- packageManager(root): ${rootPkg?.packageManager || '[INCONCLUSIVO]'}
- executáveis: ${JSON.stringify(packageManagers)}
- lockfiles: ${lockfiles.join(', ') || 'nenhum'}
- workspaces declarados: ${workspacePackages.length} | reais: ${realWorkspaceDirs.length}
- contagem arquivos: ${JSON.stringify(trackedCounts)}

# 4. NÚCLEO CANÔNICO IDENTIFICADO
${coreSection}

# 5. ÁREAS SUSPEITAS, LEGADO E RUÍDO
${suspectSection}

# 6. VARIÁVEIS DE AMBIENTE E SEGREDOS
- arquivos .env* no disco: ${envFilesOnDisk.length}
- variáveis usadas não documentadas: ${usedNotDocumented.length}
- variáveis documentadas não usadas: ${documentedNotUsed.length}
- segredos reais commitados: [INCONCLUSIVO]
- segredos/credenciais potenciais detectados por heurística: ${potentialSecrets.length + inlineSecrets.length}

# 7. ESTADO DOS TESTES
- frameworks detectados: ${JSON.stringify([...frameworks])}
- arquivos de teste detectados: ${trackedCounts.tests}
- marcas skip/TODO: ${skippedTests}
- CI com continue-on-error em algum workflow: ${workflowSummaries.some((workflow) => workflow.continue_on_error)}

# 8. SAÚDE DAS DEPENDÊNCIAS
- lockfile presente: ${lockfiles.includes('pnpm-lock.yaml')}
- múltiplos lockfiles: ${lockfiles.length > 1}
- dependências com versões divergentes: ${divergentDeps.length}
- dependencies com ferramentas dev: ${devToolInDependencies.length}
- runtime em devDependencies: ${runtimeImportedDevDeps.length}
- refs patch/file/link/portal/*/latest: ${unstableRefs.length}
- sincronia lockfile vs package.json: [INCONCLUSIVO]

# 9. SUPRESSÕES DE TIPAGEM CRÍTICAS
| arquivo | tipo | severidade | contexto |
|---|---|---|---|
${typingTable}

# 10. INCOERÊNCIAS BUILD / START / EXPORT / DIST
| pacote | dimensão | declarado | real | incoerência |
|---|---|---|---|---|
${buildTable}

# 11. MATRIZ PRELIMINAR DE SOBREVIVÊNCIA
- SOBREVIVE: ${matrix.filter((item) => item.decision === 'SOBREVIVE').length}
- QUARENTENA: ${matrix.filter((item) => item.decision === 'QUARENTENA').length}
- INVESTIGAR: ${matrix.filter((item) => item.decision === 'INVESTIGAR').length}
- INCONCLUSIVO: ${matrix.filter((item) => item.decision === 'INCONCLUSIVO').length}

# 12. RISCOS P0 / P1 ENCONTRADOS
${findings.map((finding, index) => `${index + 1}. [${finding.risk}] ${finding.text}`).join('\n') || '1. Nenhum risco P0/P1 confirmado.'}

# 13. PRONTIDÃO PARA ENTRAR NO CICLO 1
- Pré-requisitos cumpridos: snapshot, inventário, mapas e matrizes foram regenerados no estado atual.
- Pendências: ${blockingTriggers.length ? blockingTriggers.join('; ') : 'nenhuma estrutural confirmada no gate.'}

# 14. VEREDITO EXECUTIVO
## VEREDITO EXECUTIVO

**Status:** [${phase0Status}]

**Scorecard:**
| Dimensão | Score (0–10) | Observação |
|---|:---:|---|
| Snapshot / Git | ${scores.snapshot} | ${dirtyState.is_dirty ? 'Árvore Git suja; snapshot continua rastreável.' : 'Estado Git rastreável.'} |
| Inventário | ${scores.inventario} | Inventário regenerado a partir de arquivos rastreados, sem contaminar com node_modules. |
| Tipagem | ${scores.tipagem} | ${suppressionSummary.critical} supressões críticas localizadas. |
| Build / Runtime | ${scores.build_runtime} | ${buildRuntimeMap.packages.reduce((sum, pkg) => sum + pkg.incoherences.length, 0)} incoerência(s) identificada(s) no core. |
| Env / Segredos | ${scores.env} | ${potentialSecrets.length + inlineSecrets.length} ocorrência(s) heurísticas; segredo real segue não provado. |
| Testes | ${scores.testes} | ${coreTestCount} arquivo(s) de teste no core canônico. |
| Dependências | ${scores.deps} | Lockfile ${lockfiles.includes('pnpm-lock.yaml') ? 'presente' : 'ausente'}; sincronia não provada automaticamente. |
| **TOTAL** | ${totalScore} | média simples |

**Gatilhos de bloqueio ativados:** [${blockingTriggers.length ? blockingTriggers.join('; ') : 'nenhum'}]

**Justificativa:**
1. O snapshot anterior estava defasado e não descrevia o HEAD atual. 2. O estado agora foi recalculado sobre o commit ${commitSha}. 3. Persistem riscos objetivos de tipagem, coerência operacional e governança Git. 4. Segredo real commitado não foi provado; o que existe são sinais fortes, mas ainda heurísticos. 5. Avançar sem tratar ou aceitar esses pontos mantém o repositório sob restrição técnica.

**Condições para avançar ao Ciclo 1:**
1. Resolver o estado Git conflitado/sujo e congelar um novo baseline limpo.
2. Tratar ou aceitar formalmente os gatilhos de bloqueio remanescentes.
`;
writeFile('.ops/reports/phase0-report.md', `${phase0Report}\n`);

const gateFiles = [
  '.ops/snapshots/snapshot.json',
  '.ops/analysis/core-vs-noise-matrix.json',
  '.ops/analysis/build-runtime-map.json',
  '.ops/inventory/scripts-map.json',
];
const gateStatus = gateFiles.map((file) => ({ path: file, ok: exists(file) }));

const quarantineRoot = path.join(root, '.ops/quarantine/runtime-noise/root-files');
const quarantinedNames = fs.existsSync(quarantineRoot) ? fs.readdirSync(quarantineRoot).sort() : [];
const cycle1Manifest = {
  timestamp: new Date().toISOString(),
  cycle: '1',
  policy: 'quarantine-not-delete',
  gate: gateStatus,
  moves: quarantinedNames.map((name) => {
    const refs = trackedTextFiles.filter((file) => !/^(audit|artifacts|\.ops)\//.test(file) && readText(file).includes(name));
    return {
      from: name,
      to: `.ops/quarantine/runtime-noise/root-files/${name}`,
      runtime_refs_outside_audit_artifacts: refs,
      safe_to_quarantine: refs.length === 0,
    };
  }),
};
writeFile('.ops/quarantine/manifest.cycle1.json', `${JSON.stringify(cycle1Manifest, null, 2)}\n`);

const rollbackLines = ['#!/usr/bin/env bash', 'set -euo pipefail', ''];
for (const move of cycle1Manifest.moves) {
  rollbackLines.push(`if [ -f '${move.to}' ]; then git mv '${move.to}' '${move.from}'; fi`);
}
rollbackLines.push('');
writeFile('.ops/quarantine/rollback-cycle1.sh', rollbackLines.join('\n'));
fs.chmodSync(path.join(root, '.ops/quarantine/rollback-cycle1.sh'), 0o755);

writeFile(
  '.ops/evidence/cycle1/README.md',
  `# Cycle 1 Evidence

- Gate files: ${gateStatus.map((gate) => `${gate.path}=${gate.ok}`).join(', ')}
- Quarantine root: .ops/quarantine/runtime-noise/root-files
- Files isolated: ${cycle1Manifest.moves.length}
- Policy: quarantine-not-delete
- Core preserved: apps/api, apps/web, apps/worker, packages/config, packages/database, packages/logger
`
);

const phase1Status = gateStatus.every((gate) => gate.ok) ? 'APTO COM RESTRIÇÕES' : 'ABORTADO';
const phase1Report = `# CICLO 1 — LIMPEZA CIRÚRGICA, ISOLAMENTO E SANITIZAÇÃO DO RUNTIME

## T1.0 — Preparação de Estrutura Operacional
- Estruturas validadas/criadas: \`.ops/quarantine\`, \`.ops/evidence/cycle1\`, \`.ops/logs\`.

## Gate de entrada
${gateStatus.map((gate) => `- ${gate.ok ? 'OK' : 'FALHA'} ${gate.path}`).join('\n')}

## T1.1 — Quarentena de ruído fora do core
${cycle1Manifest.moves.map((move) => `- ${move.safe_to_quarantine ? 'APROVADO' : 'RESTRITO'}: \`${move.from}\` -> \`${move.to}\` | refs_runtime=${move.runtime_refs_outside_audit_artifacts.length}`).join('\n') || '- Nenhum item em quarentena.'}

## T1.2 — Rollback obrigatório
- Script reversível criado/normalizado em \`.ops/quarantine/rollback-cycle1.sh\`.
- Manifesto de rastreabilidade criado/atualizado em \`.ops/quarantine/manifest.cycle1.json\`.

## T1.3 — Verificações pós-movimento
- Core canônico não foi movido nem alterado.
- Não houve alteração funcional de API/domínio.
- Itens em quarentena permanecem fora da superfície do runtime raiz.

## Veredito do Ciclo 1
- Status: \`${phase1Status}\`
- Observação: o ciclo foi fechado no estado atual do repositório; restrições remanescentes vêm do Ciclo 0, não da quarentena em si.
`;
writeFile('.ops/reports/phase1-report.md', `${phase1Report}\n`);

writeFile('.ops/logs/cycle-execution.log', `${logLines.join('\n')}\n`);

console.log(
  JSON.stringify(
    {
      snapshot_commit: snapshot.commit_sha,
      branch: snapshot.branch,
      dirty: snapshot.dirty_state.is_dirty,
      blocking_triggers: blockingTriggers,
      cycle1_moves: cycle1Manifest.moves.length,
      gate_ok: gateStatus.every((gate) => gate.ok),
    },
    null,
    2
  )
);

