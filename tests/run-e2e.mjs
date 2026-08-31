#!/usr/bin/env node

/**
 * End-to-End Analytics & Event Tracking Test Runner
 *
 * Runs all 4 Tiers of E2E verification:
 * - Tier 1: Feature Coverage (Schema DDL, Ingestion API, Admin Guard, Tracker Script)
 * - Tier 2: Boundary & Corner Cases (Malformed JSON, SendBeacon text/plain, Missing Session ID, Invalid Types)
 * - Tier 3: Cross-Feature Combinations (Multi-Event Session Correlation, Edge Metadata Enrichment, Dual-Theme Layout)
 * - Tier 4: Real-World User Journey (End-to-End Visitor & Admin Lifecycle Flow)
 */

import { spawn } from 'node:child_process';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('\n======================================================================');
console.log('🚀 Edge Analytics & Event Tracking System - E2E Test Runner');
console.log('======================================================================\n');

const tsxCli = path.resolve(rootDir, 'node_modules', 'tsx', 'dist', 'cli.mjs');
const testFile = path.resolve(__dirname, 'analytics-e2e.test.ts');

if (!fs.existsSync(testFile)) {
  console.error(`❌ Test file not found: ${testFile}`);
  process.exit(1);
}

const args = [tsxCli, '--test', testFile];

const startTime = Date.now();
const child = spawn(process.execPath, args, {
  cwd: rootDir,
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'test'
  }
});

child.on('close', (code) => {
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log('\n----------------------------------------------------------------------');
  if (code === 0) {
    console.log(`✅ All E2E test suites passed in ${duration}s! (Exit code: 0)`);
  } else {
    console.log(`❌ Test suite finished with exit code ${code} in ${duration}s`);
  }
  console.log('----------------------------------------------------------------------\n');
  process.exit(code || 0);
});

child.on('error', (err) => {
  console.error('❌ Failed to start test runner child process:', err);
  process.exit(1);
});
