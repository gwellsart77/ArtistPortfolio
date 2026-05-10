/**
 * Backup Scheduler - Phase 5
 * Automated daily PostgreSQL backups in production
 * No external dependencies - uses Node.js built-ins only
 */

import { spawn } from 'child_process';
import { logger } from './utils/logger.js';

let backupInterval: NodeJS.Timeout | null = null;

export function startBackupScheduler(): void {
  // Only run in production when explicitly enabled
  if (process.env.NODE_ENV !== 'production') {
    logger.debug('Backup scheduler disabled - not in production environment');
    return;
  }

  if (process.env.BACKUPS_ENABLED !== 'true') {
    logger.info('Backup scheduler disabled - BACKUPS_ENABLED not set to true');
    return;
  }

  if (!process.env.DATABASE_URL) {
    logger.warn('Backup scheduler disabled - DATABASE_URL not available');
    return;
  }

  logger.info('Starting automated backup scheduler for production environment');
  
  // Calculate milliseconds until next backup (daily at 2 AM UTC)
  const now = new Date();
  const nextBackup = new Date();
  nextBackup.setUTCHours(2, 0, 0, 0);
  
  // If it's already past 2 AM today, schedule for tomorrow
  if (now.getUTCHours() >= 2) {
    nextBackup.setUTCDate(nextBackup.getUTCDate() + 1);
  }
  
  const msUntilFirstBackup = nextBackup.getTime() - now.getTime();
  
  logger.info(`Next backup scheduled for: ${nextBackup.toISOString()}`);
  logger.info(`Time until first backup: ${Math.round(msUntilFirstBackup / 1000 / 60)} minutes`);
  
  // Schedule first backup
  setTimeout(() => {
    runScheduledBackup();
    
    // Then run every 24 hours
    backupInterval = setInterval(() => {
      runScheduledBackup();
    }, 24 * 60 * 60 * 1000); // 24 hours
    
  }, msUntilFirstBackup);
  
  logger.info('✅ Backup scheduler started successfully');
}

export function stopBackupScheduler(): void {
  if (backupInterval) {
    clearInterval(backupInterval);
    backupInterval = null;
    logger.info('Backup scheduler stopped');
  }
}

async function runScheduledBackup(): Promise<void> {
  try {
    logger.info('🔄 Starting scheduled database backup...');
    
    // Run backup script using tsx (already available)
    const backupProcess = spawn('npx', ['tsx', 'scripts/db/backup.ts'], {
      stdio: 'pipe',
      cwd: process.cwd()
    });
    
    let stdout = '';
    let stderr = '';
    
    backupProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    backupProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    backupProcess.on('close', (code) => {
      if (code === 0) {
        logger.info('✅ Scheduled backup completed successfully');
        logger.debug('Backup output:', { stdout: stdout.trim() });
        
        // Log next backup time
        const nextBackup = new Date();
        nextBackup.setUTCDate(nextBackup.getUTCDate() + 1);
        nextBackup.setUTCHours(2, 0, 0, 0);
        logger.info(`Next backup scheduled for: ${nextBackup.toISOString()}`);
        
      } else {
        logger.error('❌ Scheduled backup failed', {
          exitCode: code,
          stdout: stdout.trim(),
          stderr: stderr.trim()
        });
      }
    });
    
    backupProcess.on('error', (error) => {
      logger.error('❌ Failed to start backup process', {
        error: error.message,
        stack: error.stack
      });
    });
    
  } catch (error) {
    logger.error('❌ Backup scheduler error', {
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

// Graceful shutdown
process.on('SIGTERM', stopBackupScheduler);
process.on('SIGINT', stopBackupScheduler);