// Recovery Service
// Disaster recovery procedures for system restoration

import { BackupService } from './backup-service.js';
import { BackupMetadataManager } from './backup-metadata.js';
import { logger } from './logger.js';

export class RecoveryService {
  constructor(db, kv, r2) {
    this.db = db;
    this.kv = kv;
    this.r2 = r2;
    this.backupService = new BackupService(db, kv, r2);
    this.metadataManager = new BackupMetadataManager(db);
  }

  /**
   * Initialize recovery service
   */
  async initialize() {
    await this.metadataManager.initialize();
    logger.info('recovery', 'Recovery service initialized');
  }

  /**
   * Get latest verified backup by type
   */
  async getLatestBackup(type) {
    return await this.metadataManager.getLatestBackup(type);
  }

  /**
   * Perform full system recovery
   */
  async fullSystemRecovery() {
    const startTime = Date.now();
    logger.info('recovery', 'Starting full system recovery');

    try {
      // Get latest D1 backup
      const d1Backup = await this.getLatestBackup('d1');
      if (!d1Backup) {
        throw new Error('No verified D1 backup available');
      }

      // Get latest KV backup
      const kvBackup = await this.getLatestBackup('kv');
      if (!kvBackup) {
        throw new Error('No verified KV backup available');
      }

      logger.info('recovery', 'Latest backups found', {
        d1: d1Backup.file_path,
        kv: kvBackup.file_path
      });

      // Restore D1
      logger.info('recovery', 'Restoring D1 database');
      const d1Restore = await this.backupService.restoreD1(d1Backup.file_path);
      await this.metadataManager.recordRestore(d1Backup.id, true);

      // Restore KV
      logger.info('recovery', 'Restoring KV namespace');
      const kvRestore = await this.backupService.restoreKV(kvBackup.file_path);
      await this.metadataManager.recordRestore(kvBackup.id, true);

      const duration = Date.now() - startTime;
      logger.info('recovery', 'Full system recovery completed', {
        duration: `${duration}ms`,
        d1Restore,
        kvRestore
      });

      return {
        success: true,
        duration,
        d1Backup: d1Backup.file_path,
        kvBackup: kvBackup.file_path,
        d1Restore,
        kvRestore
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('recovery', 'Full system recovery failed', {
        error: error.message,
        duration: `${duration}ms`
      });
      throw error;
    }
  }

  /**
   * Perform D1-only recovery
   */
  async d1Recovery() {
    const startTime = Date.now();
    logger.info('recovery', 'Starting D1 recovery');

    try {
      const d1Backup = await this.getLatestBackup('d1');
      if (!d1Backup) {
        throw new Error('No verified D1 backup available');
      }

      logger.info('recovery', 'Restoring D1 database', { backup: d1Backup.file_path });
      const result = await this.backupService.restoreD1(d1Backup.file_path);
      await this.metadataManager.recordRestore(d1Backup.id, true);

      const duration = Date.now() - startTime;
      logger.info('recovery', 'D1 recovery completed', {
        duration: `${duration}ms`,
        result
      });

      return {
        success: true,
        duration,
        backup: d1Backup.file_path,
        result
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('recovery', 'D1 recovery failed', {
        error: error.message,
        duration: `${duration}ms`
      });
      throw error;
    }
  }

  /**
   * Perform KV-only recovery
   */
  async kvRecovery() {
    const startTime = Date.now();
    logger.info('recovery', 'Starting KV recovery');

    try {
      const kvBackup = await this.getLatestBackup('kv');
      if (!kvBackup) {
        throw new Error('No verified KV backup available');
      }

      logger.info('recovery', 'Restoring KV namespace', { backup: kvBackup.file_path });
      const result = await this.backupService.restoreKV(kvBackup.file_path);
      await this.metadataManager.recordRestore(kvBackup.id, true);

      const duration = Date.now() - startTime;
      logger.info('recovery', 'KV recovery completed', {
        duration: `${duration}ms`,
        result
      });

      return {
        success: true,
        duration,
        backup: kvBackup.file_path,
        result
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('recovery', 'KV recovery failed', {
        error: error.message,
        duration: `${duration}ms`
      });
      throw error;
    }
  }

  /**
   * Perform recovery from specific backup
   */
  async recoveryFromBackup(backupId) {
    const startTime = Date.now();
    logger.info('recovery', 'Starting recovery from specific backup', { backupId });

    try {
      const backup = await this.metadataManager.getBackup(backupId);
      if (!backup) {
        throw new Error('Backup not found');
      }

      let result;
      if (backup.type === 'd1') {
        result = await this.backupService.restoreD1(backup.file_path);
      } else if (backup.type === 'kv') {
        result = await this.backupService.restoreKV(backup.file_path);
      } else {
        throw new Error('Unknown backup type');
      }

      await this.metadataManager.recordRestore(backupId, true);

      const duration = Date.now() - startTime;
      logger.info('recovery', 'Recovery from backup completed', {
        duration: `${duration}ms`,
        backupId,
        result
      });

      return {
        success: true,
        duration,
        backupId,
        type: backup.type,
        result
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('recovery', 'Recovery from backup failed', {
        error: error.message,
        duration: `${duration}ms`
      });
      await this.metadataManager.recordRestore(backupId, false, error.message);
      throw error;
    }
  }

  /**
   * Verify system health after recovery
   */
  async verifySystemHealth() {
    logger.info('recovery', 'Verifying system health');

    const checks = {
      d1: false,
      kv: false,
      r2: false
    };

    try {
      // Check D1
      await this.db.prepare('SELECT 1').first();
      checks.d1 = true;
      logger.info('recovery', 'D1 health check passed');
    } catch (error) {
      logger.error('recovery', 'D1 health check failed', { error: error.message });
    }

    try {
      // Check KV
      await this.kv.put('health-check', 'ok');
      const value = await this.kv.get('health-check');
      checks.kv = value === 'ok';
      logger.info('recovery', 'KV health check passed');
    } catch (error) {
      logger.error('recovery', 'KV health check failed', { error: error.message });
    }

    try {
      // Check R2
      await this.r2.list({ limit: 1 });
      checks.r2 = true;
      logger.info('recovery', 'R2 health check passed');
    } catch (error) {
      logger.error('recovery', 'R2 health check failed', { error: error.message });
    }

    const allHealthy = Object.values(checks).every(v => v);
    logger.info('recovery', 'System health verification completed', { checks, allHealthy });

    return {
      allHealthy,
      checks
    };
  }

  /**
   * Get recovery statistics
   */
  async getRecoveryStatistics() {
    const restores = await this.metadataManager.getRestoreHistory(100);
    const successful = restores.filter(r => r.success === 1).length;
    const failed = restores.filter(r => r.success === 0).length;

    const avgDuration = restores.length > 0
      ? restores.reduce((sum, r) => sum + (r.duration || 0), 0) / restores.length
      : 0;

    return {
      total: restores.length,
      successful,
      failed,
      successRate: restores.length > 0 ? (successful / restores.length) * 100 : 0,
      avgDuration
    };
  }

  /**
   * Emergency rollback to previous state
   */
  async emergencyRollback() {
    logger.warn('recovery', 'Initiating emergency rollback');

    try {
      // Get restore history
      const restores = await this.metadataManager.getRestoreHistory(1);
      if (restores.length === 0) {
        throw new Error('No restore history available for rollback');
      }

      const lastRestore = restores[0];
      logger.info('recovery', 'Rolling back to previous state', { backupId: lastRestore.backup_id });

      // Perform recovery from previous backup
      const result = await this.recoveryFromBackup(lastRestore.backup_id);

      logger.warn('recovery', 'Emergency rollback completed', { result });
      return result;
    } catch (error) {
      logger.error('recovery', 'Emergency rollback failed', { error: error.message });
      throw error;
    }
  }
}
