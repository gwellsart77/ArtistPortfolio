#!/usr/bin/env tsx
/**
 * PostgreSQL Restore Verification Script - Phase 5
 * Tests backup integrity without affecting production data
 * Development-only tool for backup validation
 */

import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import { join } from 'path';

const BACKUPS_DIR = join(process.cwd(), 'backups');

async function runCommand(command: string, args: string[]): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((resolve) => {
    const child = spawn(command, args, { stdio: 'pipe' });
    
    let stdout = '';
    let stderr = '';
    
    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    child.on('close', (code) => {
      resolve({ stdout, stderr, code: code || 0 });
    });
  });
}

async function listBackups(): Promise<string[]> {
  try {
    const files = await fs.readdir(BACKUPS_DIR);
    return files.filter(f => f.endsWith('.dump')).sort().reverse(); // Newest first
  } catch {
    return [];
  }
}

async function verifyDumpStructure(dumpPath: string): Promise<boolean> {
  console.log(`🔍 Verifying dump structure: ${dumpPath}`);
  
  const result = await runCommand('pg_restore', ['--list', dumpPath]);
  
  if (result.code !== 0) {
    console.error(`❌ pg_restore --list failed:`, result.stderr);
    return false;
  }
  
  const lines = result.stdout.split('\n').filter(l => l.trim());
  console.log(`✅ Dump contains ${lines.length} schema objects`);
  
  // Show first few entries for verification
  console.log('\n📋 Schema objects (first 10):');
  lines.slice(0, 10).forEach((line, idx) => {
    console.log(`   ${idx + 1}. ${line.substring(0, 80)}${line.length > 80 ? '...' : ''}`);
  });
  
  return true;
}

async function verifyChecksums(): Promise<boolean> {
  console.log('\n🔐 Verifying checksums...');
  
  const backups = await listBackups();
  let verified = 0;
  
  for (const backup of backups) {
    const dumpPath = join(BACKUPS_DIR, backup);
    const checksumPath = `${dumpPath}.sha256`;
    
    try {
      const checksumContent = await fs.readFile(checksumPath, 'utf8');
      const expectedChecksum = checksumContent.split(' ')[0];
      
      // Verify checksum by recomputing
      const { createHash } = await import('crypto');
      const { createReadStream } = await import('fs');
      
      const computedChecksum = await new Promise<string>((resolve, reject) => {
        const hash = createHash('sha256');
        const stream = createReadStream(dumpPath);
        
        stream.on('data', (data) => hash.update(data));
        stream.on('end', () => resolve(hash.digest('hex')));
        stream.on('error', reject);
      });
      
      if (computedChecksum === expectedChecksum) {
        console.log(`✅ ${backup}: checksum verified`);
        verified++;
      } else {
        console.error(`❌ ${backup}: checksum mismatch!`);
        console.error(`   Expected: ${expectedChecksum}`);
        console.error(`   Computed: ${computedChecksum}`);
      }
    } catch (error) {
      console.warn(`⚠️  ${backup}: checksum file missing or unreadable`);
    }
  }
  
  console.log(`\n🔐 Checksums verified: ${verified}/${backups.length}`);
  return verified === backups.length;
}

async function main(): Promise<void> {
  try {
    console.log('🧪 PostgreSQL Backup Verification Tool');
    console.log('=====================================');
    
    const backups = await listBackups();
    
    if (backups.length === 0) {
      console.log('⚠️  No backup files found in', BACKUPS_DIR);
      console.log('💡 Run `npm run db:backup` to create a backup first');
      return;
    }
    
    console.log(`📁 Found ${backups.length} backup file(s)`);
    
    // Verify checksums for all backups
    const checksumsValid = await verifyChecksums();
    
    // Verify structure of latest backup
    const latestBackup = backups[0];
    const latestPath = join(BACKUPS_DIR, latestBackup);
    const structureValid = await verifyDumpStructure(latestPath);
    
    console.log('\n📊 Verification Summary:');
    console.log(`   Checksums: ${checksumsValid ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Structure: ${structureValid ? '✅ PASS' : '❌ FAIL'}`);
    
    if (checksumsValid && structureValid) {
      console.log('\n🎉 All verifications passed! Backups are healthy.');
    } else {
      console.log('\n⚠️  Some verifications failed. Check backup integrity.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  }
}

// ES Module detection for main script execution
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main as verifyBackups };