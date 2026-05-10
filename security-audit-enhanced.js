#!/usr/bin/env node

/**
 * Enhanced Security Auditing Tool
 * Implements AI consultant recommendations for automated security scanning
 */

import { execSync } from 'child_process';
import fs from 'fs';

console.log('🔒 Enhanced Security Audit (AI Consultant Recommendations)');
console.log('=' .repeat(60));

const securityIssues = [];
let criticalCount = 0;
let moderateCount = 0;

// 1. NPM Audit (Critical Recommendation)
console.log('📋 Running npm audit for known vulnerabilities...');
try {
  const auditResult = execSync('npm audit --json', { encoding: 'utf8' });
  const audit = JSON.parse(auditResult);
  
  if (audit.vulnerabilities) {
    const vulnCount = Object.keys(audit.vulnerabilities).length;
    if (vulnCount > 0) {
      securityIssues.push(`⚠️  Found ${vulnCount} package vulnerabilities`);
      criticalCount += audit.metadata?.vulnerabilities?.critical || 0;
      moderateCount += audit.metadata?.vulnerabilities?.moderate || 0;
    } else {
      securityIssues.push('✅ No known package vulnerabilities found');
    }
  }
} catch (error) {
  // npm audit returns non-zero exit code when vulnerabilities found
  const output = error.stdout?.toString() || error.message;
  if (output.includes('vulnerabilities')) {
    securityIssues.push('⚠️  Package vulnerabilities detected - run npm audit for details');
    criticalCount++;
  }
}

// 2. Environment Variable Security Check
console.log('🔐 Checking environment variable security...');
const envExample = '.env.example';
const serverFiles = ['server/index.ts', 'server/routes.ts'];

let hasEnvExample = fs.existsSync(envExample);
let hasHardcodedSecrets = false;

if (!hasEnvExample) {
  securityIssues.push('⚠️  Missing .env.example file for documenting required variables');
  moderateCount++;
}

// Check for potential hardcoded secrets
serverFiles.forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    const suspiciousPatterns = [
      /sk_[a-zA-Z0-9_]+/g, // Stripe secret keys
      /password.*=.*["'][^"']+["']/gi,
      /secret.*=.*["'][^"']+["']/gi,
      /api_key.*=.*["'][^"']+["']/gi
    ];
    
    suspiciousPatterns.forEach(pattern => {
      if (pattern.test(content)) {
        hasHardcodedSecrets = true;
      }
    });
  }
});

if (hasHardcodedSecrets) {
  securityIssues.push('🚨 Potential hardcoded secrets detected in server files');
  criticalCount++;
} else {
  securityIssues.push('✅ No hardcoded secrets detected');
}

// 3. Session Security Configuration
console.log('🍪 Analyzing session security...');
try {
  const serverContent = fs.readFileSync('server/index.ts', 'utf8');
  
  const sessionChecks = [
    { pattern: /secure:\s*true/i, message: 'Session cookies set to secure', critical: false },
    { pattern: /httpOnly:\s*true/i, message: 'Session cookies set to httpOnly', critical: false },
    { pattern: /sameSite:\s*['"]strict['"]|sameSite:\s*['"]lax['"]|sameSite:\s*['"]none['"]/i, message: 'SameSite policy configured', critical: false },
    { pattern: /connect-pg-simple/i, message: 'PostgreSQL session store configured', critical: false }
  ];
  
  sessionChecks.forEach(check => {
    if (check.pattern.test(serverContent)) {
      securityIssues.push(`✅ ${check.message}`);
    } else {
      securityIssues.push(`⚠️  Missing: ${check.message}`);
      if (check.critical) criticalCount++; else moderateCount++;
    }
  });
} catch (error) {
  securityIssues.push('⚠️  Could not analyze session security configuration');
}

// 4. CORS Configuration Check
console.log('🌐 Checking CORS security...');
try {
  const serverContent = fs.readFileSync('server/index.ts', 'utf8');
  
  if (serverContent.includes("origin: '*'")) {
    securityIssues.push('🚨 CORS configured with wildcard origin - security risk');
    criticalCount++;
  } else if (serverContent.includes('cors(')) {
    securityIssues.push('✅ CORS middleware configured (verify restrictive policy)');
  } else {
    securityIssues.push('⚠️  CORS middleware not detected');
    moderateCount++;
  }
} catch (error) {
  securityIssues.push('⚠️  Could not analyze CORS configuration');
}

// 5. Rate Limiting Check
console.log('🚦 Verifying rate limiting...');
try {
  const serverContent = fs.readFileSync('server/index.ts', 'utf8');
  
  if (serverContent.includes('express-rate-limit')) {
    securityIssues.push('✅ Rate limiting implemented');
  } else {
    securityIssues.push('⚠️  Rate limiting not detected');
    moderateCount++;
  }
} catch (error) {
  securityIssues.push('⚠️  Could not verify rate limiting');
}

// 6. HTTPS/TLS Check
console.log('🔒 Checking HTTPS configuration...');
try {
  const serverContent = fs.readFileSync('server/index.ts', 'utf8');
  
  if (serverContent.includes('helmet')) {
    securityIssues.push('✅ Helmet security middleware configured');
  } else {
    securityIssues.push('⚠️  Helmet security headers not detected');
    moderateCount++;
  }
} catch (error) {
  securityIssues.push('⚠️  Could not analyze security headers');
}

// Display Results
console.log('\n📊 Security Audit Results:');
console.log('=' .repeat(60));

securityIssues.forEach(issue => {
  console.log(`  ${issue}`);
});

console.log('\n📈 Security Summary:');
console.log(`  🚨 Critical Issues: ${criticalCount}`);
console.log(`  ⚠️  Moderate Issues: ${moderateCount}`);
console.log(`  ✅ Security Measures Active: ${securityIssues.filter(i => i.includes('✅')).length}`);

// AI Consultant Recommendations
console.log('\n🎯 AI Consultant Priority Actions:');

if (criticalCount > 0) {
  console.log('  🚨 URGENT: Address critical security issues immediately');
}

console.log('  1. Run "npm audit fix" to resolve package vulnerabilities');
console.log('  2. Create comprehensive .env.example documentation');
console.log('  3. Verify CORS policy is restrictive for production');
console.log('  4. Ensure all session security flags are enabled');
console.log('  5. Consider adding Content Security Policy headers');

console.log('\n💡 Continuous Security:');
console.log('  • Run this audit weekly during development');
console.log('  • Set up automated security scanning in CI/CD');
console.log('  • Monitor for new vulnerabilities in dependencies');
console.log('  • Regular security review of authentication flows');

// Return appropriate exit code
process.exit(criticalCount > 0 ? 1 : 0);