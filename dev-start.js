#!/usr/bin/env node

/**
 * Cross-platform development starter
 * Fixes NODE_ENV issues and prevents build conflicts
 */

// Set environment before any imports
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

console.log('🚀 Cross-platform dev server starting...');
console.log(`Environment: ${process.env.NODE_ENV}`);
console.log(`Platform: ${process.platform}`);
console.log(`Node version: ${process.version}`);

// Dynamic import to ensure environment is set first
async function startDev() {
  try {
    // Clear any existing dist files to prevent stale builds
    const fs = await import('fs');
    if (fs.existsSync('dist') && process.env.CLEAR_DIST !== 'false') {
      console.log('🧹 Clearing previous build artifacts...');
      fs.rmSync('dist', { recursive: true, force: true });
    }

    // Import and start tsx
    const { spawn } = await import('child_process');
    
    const child = spawn('npx', ['tsx', 'server/index.ts'], {
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_ENV: 'development',
        // Force tsx to use proper TypeScript compilation
        TSX_TSCONFIG_PATH: './tsconfig.json'
      },
      shell: process.platform === 'win32' // Handle Windows shell differences
    });

    // Handle graceful shutdown
    const shutdown = (signal) => {
      console.log(`\n📡 Received ${signal}, shutting down gracefully...`);
      child.kill(signal);
      process.exit(0);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

    child.on('error', (error) => {
      console.error('❌ Failed to start development server:', error.message);
      process.exit(1);
    });

    child.on('exit', (code) => {
      if (code !== 0) {
        console.error(`❌ Development server exited with code ${code}`);
        process.exit(code);
      }
    });

  } catch (error) {
    console.error('❌ Failed to start development environment:', error.message);
    process.exit(1);
  }
}

startDev();