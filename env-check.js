#!/usr/bin/env node

/**
 * Cross-platform environment validator
 * Prevents silent build failures and environment issues
 */

console.log('🔍 Validating development environment...');

const checks = [];

// Check Node.js version
const nodeVersion = process.version;
const requiredNodeVersion = '18.0.0';
if (nodeVersion < `v${requiredNodeVersion}`) {
  checks.push(`❌ Node.js ${requiredNodeVersion}+ required, found ${nodeVersion}`);
} else {
  checks.push(`✅ Node.js ${nodeVersion}`);
}

// Check platform compatibility
checks.push(`✅ Platform: ${process.platform} ${process.arch}`);

// Check environment variables
const requiredEnvs = ['DATABASE_URL'];
const missingEnvs = requiredEnvs.filter(env => !process.env[env]);

if (missingEnvs.length > 0) {
  checks.push(`⚠️  Missing environment variables: ${missingEnvs.join(', ')}`);
} else {
  checks.push(`✅ Required environment variables present`);
}

// Check for conflicting builds
const fs = await import('fs');
const distExists = fs.existsSync('dist');
const nodeModulesExists = fs.existsSync('node_modules');

if (distExists) {
  checks.push(`⚠️  Previous build found in dist/ - will be cleared on next dev start`);
} else {
  checks.push(`✅ Clean build environment`);
}

if (!nodeModulesExists) {
  checks.push(`❌ node_modules not found - run 'npm install'`);
} else {
  checks.push(`✅ Dependencies installed`);
}

// Display results
console.log('\n📋 Environment Check Results:');
checks.forEach(check => console.log(`  ${check}`));

const hasErrors = checks.some(check => check.startsWith('❌'));
const hasWarnings = checks.some(check => check.startsWith('⚠️'));

if (hasErrors) {
  console.log('\n🚨 Critical issues found - please resolve before continuing');
  process.exit(1);
} else if (hasWarnings) {
  console.log('\n⚠️  Warnings detected - development may continue but issues should be addressed');
} else {
  console.log('\n🎉 Environment ready for development!');
}

console.log('\n💡 To start development with cross-platform support:');
console.log('   node dev-start.js');
console.log('\n💡 To build for production:');
console.log('   node build.config.js');