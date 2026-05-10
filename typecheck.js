#!/usr/bin/env node
/**
 * Phase 4 TypeScript Check Guard - Dev Only
 * Runs 'tsc --noEmit' to validate TypeScript without building
 */

const { execSync } = require('child_process');

try {
  console.log('🔍 Running TypeScript type checking...');
  execSync('npx tsc --noEmit', { stdio: 'inherit' });
  console.log('✅ TypeScript check passed!');
  process.exit(0);
} catch (error) {
  console.error('❌ TypeScript check failed!');
  process.exit(1);
}