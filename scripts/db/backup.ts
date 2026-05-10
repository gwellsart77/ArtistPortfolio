#!/usr/bin/env tsx
/**
 * PostgreSQL Backup Script - Phase 5
 * Creates compressed dumps with checksums and manifest tracking
 * No external dependencies - uses Node.js built-ins only
 */

import { spawn } from 'child_process';
import { createHash } from 'crypto';
import { createReadStream, createWriteStream, promises as fs } from 'fs';
import { join } from 'path';

interface BackupManifestEntry {
  file: string;
  size: number;
  sha256: string;
  createdAt: string;
}

interface BackupManifest {
  entries: BackupManifestEntry[];
  lastUpdated: string;
}

const BACKUPS_DIR = join(process.cwd(), 'backups');
const MANIFEST_PATH = join(BACKUPS_DIR, 'manifest.json');
const RETENTION_DAYS = parseInt(process.env.BACKUP_RETENTION_DAYS || '7');

async function ensureBackupsDir(): Promise<void> {
  try {
    await fs.access(BACKUPS_DIR);
  } catch {
    await fs.mkdir(BACKUPS_DIR, { recursive: true });
    console.log(`✅ Created backups directory: ${BACKUPS_DIR}`);
  }
}

async function createDump(): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `${timestamp}.dump`;
  const filepath = join(BACKUPS_DIR, filename);

  console.log(`🔄 Creating PostgreSQL dump: ${filename}`);

  return new Promise((resolve, reject) => {
    const pgDump = spawn('pg_dump', [
      '--format=custom',
      '--compress=9',
      '--verbose',
      '--file', filepath,
      process.env.DATABASE_URL!
    ], {
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let stderr = '';
    pgDump.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    pgDump.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ Dump created successfully: ${filename}`);
        resolve(filepath);
      } else {
        console.error(`❌ pg_dump failed with code ${code}`);
        console.error('Error output:', stderr);
        reject(new Error(`pg_dump failed: ${stderr}`));
      }
    });

    pgDump.on('error', (error) => {
      console.error(`❌ Failed to start pg_dump:`, error);
      reject(error);
    });
  });
}

async function computeChecksum(filepath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256');
    const stream = createReadStream(filepath);

    stream.on('data', (data) => {
      hash.update(data);
    });

    stream.on('end', () => {
      const checksum = hash.digest('hex');
      resolve(checksum);
    });

    stream.on('error', reject);
  });
}

async function saveChecksum(filepath: string, checksum: string): Promise<void> {
  const checksumPath = `${filepath}.sha256`;
  const filename = filepath.split('/').pop();
  const content = `${checksum}  ${filename}\n`;
  
  await fs.writeFile(checksumPath, content, 'utf8');
  console.log(`✅ Checksum saved: ${checksumPath}`);
}

async function loadManifest(): Promise<BackupManifest> {
  try {
    const content = await fs.readFile(MANIFEST_PATH, 'utf8');
    return JSON.parse(content);
  } catch {
    return { entries: [], lastUpdated: new Date().toISOString() };
  }
}

async function saveManifest(manifest: BackupManifest): Promise<void> {
  manifest.lastUpdated = new Date().toISOString();
  await fs.writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf8');
  console.log(`✅ Manifest updated: ${manifest.entries.length} entries`);
}

async function updateManifest(filepath: string, checksum: string): Promise<void> {
  const stats = await fs.stat(filepath);
  const filename = filepath.split('/').pop()!;
  
  const manifest = await loadManifest();
  
  const entry: BackupManifestEntry = {
    file: filename,
    size: stats.size,
    sha256: checksum,
    createdAt: new Date().toISOString()
  };

  manifest.entries.push(entry);
  await saveManifest(manifest);
}

async function enforceRetention(): Promise<void> {
  const manifest = await loadManifest();
  
  if (manifest.entries.length <= RETENTION_DAYS) {
    console.log(`📁 Retention: ${manifest.entries.length} entries, keeping all`);
    return;
  }

  // Sort by creation date, newest first
  manifest.entries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  // Keep newest RETENTION_DAYS entries
  const toKeep = manifest.entries.slice(0, RETENTION_DAYS);
  const toDelete = manifest.entries.slice(RETENTION_DAYS);

  for (const entry of toDelete) {
    try {
      const filepath = join(BACKUPS_DIR, entry.file);
      const checksumPath = `${filepath}.sha256`;
      
      await fs.unlink(filepath);
      await fs.unlink(checksumPath).catch(() => {}); // Ignore if checksum file missing
      
      console.log(`🗑️  Deleted old backup: ${entry.file}`);
    } catch (error) {
      console.warn(`⚠️  Failed to delete ${entry.file}:`, error);
    }
  }

  manifest.entries = toKeep;
  await saveManifest(manifest);
  
  console.log(`✅ Retention enforced: kept ${toKeep.length}, deleted ${toDelete.length}`);
}

async function main(): Promise<void> {
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is required');
    }

    console.log('🚀 Starting PostgreSQL backup process...');
    console.log(`📁 Backup directory: ${BACKUPS_DIR}`);
    console.log(`⏰ Retention: ${RETENTION_DAYS} days`);

    await ensureBackupsDir();
    
    const filepath = await createDump();
    const checksum = await computeChecksum(filepath);
    
    await saveChecksum(filepath, checksum);
    await updateManifest(filepath, checksum);
    await enforceRetention();

    const stats = await fs.stat(filepath);
    const sizeKB = Math.round(stats.size / 1024);
    
    console.log('\n🎉 Backup completed successfully!');
    console.log(`📁 File: ${filepath.split('/').pop()}`);
    console.log(`📏 Size: ${sizeKB} KB`);
    console.log(`🔐 SHA256: ${checksum}`);
    
  } catch (error) {
    console.error('❌ Backup failed:', error);
    process.exit(1);
  }
}

// ES Module detection for main script execution
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main as createBackup };