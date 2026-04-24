#!/usr/bin/env node
// @ts-nocheck
// 
import { runPnpm } from './ci/shared.mjs';

runPnpm([
  '--filter',
  '@birthub/config',
  '--filter',
  '@birthub/logger',
  '--filter',
  '@birthub/agents-core',
  '--filter',
  '@birthub/workflows-core',
  '--filter',
  '@birthub/database',
  'build'
]);
