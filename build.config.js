#!/usr/bin/env node

/**
 * Cross-platform build configuration
 * Fixes dual-compiler issues and ensures clean builds
 */

import { build } from 'esbuild';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const isProduction = process.env.NODE_ENV === 'production';

console.log('🔧 Starting cross-platform build process...');
console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);

// Clean previous builds to prevent stale file issues
if (fs.existsSync('dist')) {
  console.log('🧹 Cleaning previous build...');
  fs.rmSync('dist', { recursive: true, force: true });
}

try {
  // Step 1: Build frontend with Vite
  console.log('📦 Building frontend...');
  execSync('npx vite build', { stdio: 'inherit' });
  
  // Step 2: Build server with esbuild
  console.log('🏗️ Building server...');
  await build({
    entryPoints: ['server/index.ts'],
    bundle: true,
    platform: 'node',
    target: 'node20',
    format: 'esm',
    outdir: 'dist',
    packages: 'external',
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production')
    },
    banner: {
      js: `
// Cross-platform environment setup
const originalEnv = process.env.NODE_ENV;
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = '${process.env.NODE_ENV || 'production'}';
}
console.log('🚀 Server starting with NODE_ENV:', process.env.NODE_ENV);
      `.trim()
    },
    sourcemap: !isProduction,
    minify: isProduction,
    logLevel: 'info'
  });

  console.log('✅ Build completed successfully!');
  console.log('📁 Frontend: dist/public/');
  console.log('📁 Server: dist/index.js');
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}