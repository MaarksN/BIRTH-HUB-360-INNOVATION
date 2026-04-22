#!/usr/bin/env node
/**
 * Automated development setup script
 * Run: node scripts/setup-dev.js [command]
 */

import { execSync } from 'child_process';
import { existsSync, copyFileSync } from 'fs';
import { resolve } from 'path';
import { platform } from 'os';

const rootDir = resolve(import.meta.url, '../../');
const isWindows = platform() === 'win32';

const log = {
  info: (msg) => console.log(`\x1b[36mℹ\x1b[0m ${msg}`),
  success: (msg) => console.log(`\x1b[32m✓\x1b[0m ${msg}`),
  error: (msg) => console.error(`\x1b[31m✗\x1b[0m ${msg}`),
  warn: (msg) => console.warn(`\x1b[33m⚠\x1b[0m ${msg}`),
};

const run = (cmd, opts = {}) => {
  try {
    return execSync(cmd, {
      cwd: rootDir,
      stdio: 'inherit',
      shell: isWindows ? true : '/bin/bash',
      ...opts,
    });
  } catch (err) {
    log.error(`Command failed: ${cmd}`);
    process.exit(1);
  }
};

async function checkPrerequisites() {
  log.info('🔍 Checking prerequisites...');

  const checks = [
    { name: 'Docker', cmd: isWindows ? 'docker --version' : 'which docker' },
    { name: 'Git', cmd: isWindows ? 'git --version' : 'which git' },
    { name: 'Node.js', cmd: isWindows ? 'node --version' : 'which node' },
  ];

  for (const check of checks) {
    try {
      execSync(check.cmd, { stdio: 'ignore', shell: isWindows ? true : '/bin/bash' });
      log.success(`${check.name} is installed`);
    } catch {
      log.error(`${check.name} is not installed`);
      process.exit(1);
    }
  }

  // Check Node version
  const nodeVersion = execSync('node -v', { encoding: 'utf-8' }).trim().replace('v', '');
  const major = parseInt(nodeVersion.split('.')[0]);
  if (major < 20) {
    log.error(`Node.js 20+ required (you have ${nodeVersion})`);
    process.exit(1);
  }

  log.success('All prerequisites met!');
}

async function setupDev() {
  log.info('⚙️ Setting up development environment...');

  // Install pnpm globally
  log.info('Installing pnpm...');
  run('npm install -g pnpm@9.15.9');

  // Install dependencies
  log.info('Installing dependencies...');
  run('pnpm install');

  // Generate Prisma client
  log.info('Generating Prisma client...');
  run('pnpm db:generate');

  // Create .env.local if not exists
  if (!existsSync(resolve(rootDir, '.env.local'))) {
    log.info('Creating .env.local from .env.example...');
    copyFileSync(
      resolve(rootDir, '.env.example'),
      resolve(rootDir, '.env.local')
    );
    log.warn('⚠️  Please review and update .env.local with your settings');
  }

  log.success('Setup complete!');
  log.info('Next: run "pnpm setup:dev start" to start dev environment');
}

async function startDev() {
  log.info('🚀 Starting dev environment...');

  // Start Docker Compose
  log.info('Starting Docker services...');
  run('docker-compose -f docker-compose.dev.yml up -d');

  // Wait for services
  log.info('Waiting for services to be ready...');
  await new Promise((resolve) => setTimeout(resolve, 5000));

  // Run migrations
  log.info('Running database migrations...');
  try {
    run('pnpm db:migrate:deploy', { stdio: 'pipe' });
  } catch {
    log.warn('Migration warning - continuing anyway');
  }

  log.info('Starting dev servers...');
  run('pnpm dev');
}

async function runTests() {
  log.info('🧪 Running tests...');
  run('pnpm test --coverage');
  log.success('Tests completed!');
}

async function buildDocker() {
  log.info('🏗️ Building Docker images...');
  run('docker-compose build');
  log.success('Docker images built!');
}

async function cleanup() {
  log.info('🧹 Cleaning up...');
  run('docker-compose -f docker-compose.dev.yml down -v');
  run('pnpm clean');
  log.success('Cleanup complete!');
}

async function main() {
  const cmd = process.argv[2] || 'help';

  switch (cmd) {
    case 'check':
      await checkPrerequisites();
      break;
    case 'setup':
      await checkPrerequisites();
      await setupDev();
      break;
    case 'start':
      await startDev();
      break;
    case 'test':
      await runTests();
      break;
    case 'build':
      await buildDocker();
      break;
    case 'cleanup':
      await cleanup();
      break;
    case 'help':
    default:
      console.log(`
BirthHub 360 - Development Setup

Usage: pnpm setup:dev <command>

Commands:
  check      Check prerequisites (Docker, Git, Node)
  setup      Initial setup (install deps, create .env.local)
  start      Start dev environment (Docker + migrations + servers)
  test       Run tests with coverage
  build      Build Docker images
  cleanup    Clean up containers and build artifacts
  help       Show this help message

Examples:
  pnpm setup:dev check      # Verify you can develop
  pnpm setup:dev setup      # First time setup
  pnpm setup:dev start      # Start development
      `);
      break;
  }
}

main().catch((err) => {
  log.error(err.message);
  process.exit(1);
});
