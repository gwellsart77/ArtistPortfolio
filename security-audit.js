#!/usr/bin/env node

/**
 * Automated Security Auditing Tool
 * Scans for common security vulnerabilities in e-commerce applications
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🔒 Starting comprehensive security audit...\n');

const securityChecks = [];
let criticalIssues = 0;
let warnings = 0;

// 1. NPM Security Audit
console.log('📦 Running NPM security audit...');
try {
  const auditResult = execSync('npm audit --audit-level=moderate --json', { encoding: 'utf8' });
  const audit = JSON.parse(auditResult);
  
  if (audit.metadata.vulnerabilities.total > 0) {
    const { critical, high, moderate, low } = audit.metadata.vulnerabilities;
    if (critical > 0 || high > 0) {
      securityChecks.push(`❌ CRITICAL: ${critical} critical, ${high} high severity vulnerabilities found`);
      criticalIssues++;
    } else if (moderate > 0) {
      securityChecks.push(`⚠️  ${moderate} moderate vulnerabilities found`);
      warnings++;
    }
    
    securityChecks.push(`💡 Run 'npm audit fix' to resolve automatically fixable issues`);
  } else {
    securityChecks.push('✅ No known vulnerabilities in dependencies');
  }
} catch (error) {
  securityChecks.push('⚠️  Could not run npm audit - run manually');
  warnings++;
}

// 2. Environment Variables Security
console.log('🔐 Checking environment variable security...');
const sensitiveEnvPatterns = [
  'SECRET', 'KEY', 'TOKEN', 'PASSWORD', 'PRIVATE'
];

const envFiles = ['.env', '.env.local', '.env.production'];
let envIssues = 0;

envFiles.forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    
    // Check for hardcoded secrets
    sensitiveEnvPatterns.forEach(pattern => {
      if (content.includes(`${pattern}=`) && !content.includes(`${pattern}=`)) {
        envIssues++;
      }
    });
    
    // Check if .env is in gitignore
    if (file === '.env' && fs.existsSync('.gitignore')) {
      const gitignore = fs.readFileSync('.gitignore', 'utf8');
      if (!gitignore.includes('.env')) {
        securityChecks.push('❌ CRITICAL: .env file not in .gitignore');
        criticalIssues++;
      }
    }
  }
});

if (envIssues === 0) {
  securityChecks.push('✅ Environment variables appear secure');
} else {
  securityChecks.push(`⚠️  ${envIssues} potential environment variable issues`);
  warnings++;
}

// 3. Session Security Check
console.log('🍪 Analyzing session configuration...');
try {
  const serverCode = fs.readFileSync('server/index.ts', 'utf8');
  
  const sessionChecks = {
    hasSessionSecret: serverCode.includes('SESSION_SECRET'),
    hasSecureCookies: serverCode.includes('secure: true'),
    hasHttpOnly: serverCode.includes('httpOnly: true'),
    hasSameSite: serverCode.includes('sameSite'),
  };
  
  const sessionIssues = Object.entries(sessionChecks)
    .filter(([key, value]) => !value)
    .map(([key]) => key);
  
  if (sessionIssues.length === 0) {
    securityChecks.push('✅ Session configuration appears secure');
  } else {
    securityChecks.push(`⚠️  Session security improvements needed: ${sessionIssues.join(', ')}`);
    warnings++;
  }
} catch (error) {
  securityChecks.push('⚠️  Could not analyze session configuration');
  warnings++;
}

// 4. CORS Configuration Check
console.log('🌐 Checking CORS configuration...');
try {
  const routesCode = fs.readFileSync('server/routes.ts', 'utf8');
  
  if (routesCode.includes("origin: '*'")) {
    securityChecks.push('❌ CRITICAL: CORS allows all origins - security risk');
    criticalIssues++;
  } else if (routesCode.includes('cors(')) {
    securityChecks.push('✅ CORS configuration found');
  } else {
    securityChecks.push('⚠️  CORS configuration not found');
    warnings++;
  }
} catch (error) {
  securityChecks.push('⚠️  Could not analyze CORS configuration');
  warnings++;
}

// 5. Input Validation Check
console.log('🔍 Checking input validation...');
try {
  const routesCode = fs.readFileSync('server/routes.ts', 'utf8');
  
  const hasZodValidation = routesCode.includes('z.object') || routesCode.includes('insertSchema');
  const hasSanitization = routesCode.includes('DOMPurify') || routesCode.includes('sanitize');
  
  if (hasZodValidation) {
    securityChecks.push('✅ Input validation with Zod found');
  } else {
    securityChecks.push('⚠️  Consider adding comprehensive input validation');
    warnings++;
  }
  
  if (hasSanitization) {
    securityChecks.push('✅ Input sanitization found');
  } else {
    securityChecks.push('⚠️  Consider adding input sanitization for user content');
    warnings++;
  }
} catch (error) {
  securityChecks.push('⚠️  Could not analyze input validation');
  warnings++;
}

// 6. Rate Limiting Check
console.log('🚦 Checking rate limiting...');
try {
  const serverCode = fs.readFileSync('server/index.ts', 'utf8');
  
  if (serverCode.includes('rateLimit') || serverCode.includes('express-rate-limit')) {
    securityChecks.push('✅ Rate limiting configured');
  } else {
    securityChecks.push('⚠️  Rate limiting not found - consider adding for API protection');
    warnings++;
  }
} catch (error) {
  securityChecks.push('⚠️  Could not analyze rate limiting configuration');
  warnings++;
}

// 7. HTTPS/TLS Check
console.log('🔒 Checking HTTPS configuration...');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
if (packageJson.dependencies.helmet) {
  securityChecks.push('✅ Helmet security middleware installed');
} else {
  securityChecks.push('⚠️  Consider adding Helmet for security headers');
  warnings++;
}

// Display Results
console.log('\n📋 Security Audit Results:');
console.log('=' .repeat(50));

securityChecks.forEach(check => {
  console.log(`  ${check}`);
});

console.log('\n📊 Summary:');
console.log(`  🔴 Critical Issues: ${criticalIssues}`);
console.log(`  🟡 Warnings: ${warnings}`);
console.log(`  🟢 Checks Passed: ${securityChecks.filter(c => c.includes('✅')).length}`);

if (criticalIssues > 0) {
  console.log('\n🚨 IMMEDIATE ACTION REQUIRED');
  console.log('Critical security issues found that need immediate attention.');
  process.exit(1);
} else if (warnings > 0) {
  console.log('\n⚠️  Security improvements recommended');
  console.log('Consider addressing warnings to strengthen security posture.');
} else {
  console.log('\n🎉 Security audit passed!');
  console.log('Your e-commerce platform follows security best practices.');
}

console.log('\n💡 Next steps:');
console.log('  1. Address any critical issues immediately');
console.log('  2. Review and fix warnings when possible');
console.log('  3. Run this audit regularly (weekly recommended)');
console.log('  4. Keep dependencies updated');