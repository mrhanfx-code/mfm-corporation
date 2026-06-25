// Backup Metadata Manager
// Track backup history, manage retention, query backup status

import { logger } from './logger.js';

export class BackupMetadataManager {
  constructor(db) {
    this.db = db;
  }

  /**
   * Initialize backup metadata table
   */
  async initialize() {
    try {
      await this.db.prepare(`
        CREATE TABLE IF NOT EXISTS backups (
          id TEXT PRIMARY KEY,
          type TEXT NOT NULL,
          timestamp INTEGER NOT NULL,
          file_path TEXT NOT NULL,
          file_size INTEGER NOT NULL,
          checksum TEXT NOT NULL,
          status TEXT NOT NULL,
          verified_at INTEGER,
          retention_date INTEGER
        )
      `).run();

      logger.info('backup-metadata', 'Backup metadata table initialized');
    } catch (error) {
      logger.error('backup-metadata', 'Failed to initialize backup metadata', { error: error.message });
      throw error;
    }
  }

  /**
   * Record backup metadata
   */
  async recordBackup(backup) {
    const id = crypto.randomUUID();
    const now = Date.now();
    const retentionDate = now + (30 * 24 * 60 * 60 * 1000); // 30 days

    try {
      await this.db.prepare(`
        INSERT INTO backups (id, type, timestamp, file_path, file_size, checksum, status, verified_at, retention_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        id,
        backup.type,
        now,
        backup.filePath,
        backup.size,
        backup.checksum,
        'completed',
        null,
        retentionDate
      ).run();

      logger.info('backup-metadata', 'Backup metadata recorded', { id, type: backup.type });
      return id;
    } catch (error) {
      logger.error('backup-metadata', 'Failed to record backup metadata', { error: error.message });
      throw error;
    }
  }

  /**
   * Update backup verification status
   */
  async updateVerification(id, verified) {
    try {
      await this.db.prepare(`
        UPDATE backups
        SET verified_at = ?, status = ?
        WHERE id = ?
      `).bind(Date.now(), verified ? 'verified' : 'verification_failed', id).run();

      logger.info('backup-metadata', 'Backup verification updated', { id, verified });
    } catch (error) {
      logger.error('backup-metadata', 'Failed to update verification', { error: error.message });
      throw error;
    }
  }

  /**
   * Get backup by ID
   */
  async getBackup(id) {
    try {
      const result = await this.db.prepare(`
        SELECT * FROM backups WHERE id = ?
      `).bind(id).first();
      return result;
    } catch (error) {
      logger.error('backup-metadata', 'Failed to get backup', { error: error.message });
      throw error;
    }
  }

  /**
   * List backups by type
   */
  async listBackups(type = null, limit = 50) {
    try {
      let query = 'SELECT * FROM backups';
      const params = [];

      if (type) {
        query += ' WHERE type = ?';
        params.push(type);
      }

      query += ' ORDER BY timestamp DESC LIMIT ?';
      params.push(limit);

      const result = await this.db.prepare(query).bind(...params).all();
      return result.results || [];
    } catch (error) {
      logger.error('backup-metadata', 'Failed to list backups', { error: error.message });
      throw error;
    }
  }

  /**
   * Get latest backup by type
   */
  async getLatestBackup(type) {
    try {
      const result = await this.db.prepare(`
        SELECT * FROM backups
        WHERE type = ? AND status = 'verified'
        ORDER BY timestamp DESC
        LIMIT 1
      `).bind(type).first();
      return result;
    } catch (error) {
      logger.error('backup-metadata', 'Failed to get latest backup', { error: error.message });
      throw error;
    }
  }

  /**
   * Get backup statistics
   */
  async getStatistics() {
    try {
      const total = await this.db.prepare('SELECT COUNT(*) as count FROM backups').first();
      const d1Count = await this.db.prepare("SELECT COUNT(*) as count FROM backups WHERE type = 'd1'").first();
      const kvCount = await this.db.prepare("SELECT COUNT(*) as count FROM backups WHERE type = 'kv'").first();
      const verified = await this.db.prepare("SELECT COUNT(*) as count FROM backups WHERE status = 'verified'").first();
      const failed = await this.db.prepare("SELECT COUNT(*) as count FROM backups WHERE status = 'verification_failed'").first();

      return {
        total: total.count,
        d1: d1Count.count,
        kv: kvCount.count,
        verified: verified.count,
        failed: failed.count
      };
    } catch (error) {
      logger.error('backup-metadata', 'Failed to get statistics', { error: error.message });
      throw error;
    }
  }

  /**
   * Delete backup metadata
   */
  async deleteBackup(id) {
    try {
      await this.db.prepare('DELETE FROM backups WHERE id = ?').bind(id).run();
      logger.info('backup-metadata', 'Backup metadata deleted', { id });
    } catch (error) {
      logger.error('backup-metadata', 'Failed to delete backup metadata', { error: error.message });
      throw error;
    }
  }

  /**
   * Cleanup old backup metadata
   */
  async cleanupOldMetadata() {
    const now = Date.now();
    try {
      const result = await this.db.prepare(`
        DELETE FROM backups WHERE retention_date < ?
      `).bind(now).run();

      logger.info('backup-metadata', 'Old backup metadata cleaned', { deleted: result.meta.changes });
      return result.meta.changes;
    } catch (error) {
      logger.error('backup-metadata', 'Failed to cleanup old metadata', { error: error.message });
      throw error;
    }
  }

  /**
   * Record restore operation
   */
  async recordRestore(backupId, success, error = null) {
    const id = crypto.randomUUID();
    try {
      await this.db.prepare(`
        INSERT INTO restores (id, backup_id, timestamp, success, error)
        VALUES (?, ?, ?, ?, ?)
      `).bind(id, backupId, Date.now(), success ? 1 : 0, error).run();

      logger.info('backup-metadata', 'Restore operation recorded', { id, backupId, success });
      return id;
    } catch (error) {
      logger.error('backup-metadata', 'Failed to record restore', { error: error.message });
      throw error;
    }
  }

  /**
   * Get restore history
   */
  async getRestoreHistory(limit = 20) {
    try {
      const result = await this.db.prepare(`
        SELECT r.*, b.type, b.file_path
        FROM restores r
        JOIN backups b ON r.backup_id = b.id
        ORDER BY r.timestamp DESC
        LIMIT ?
      `).bind(limit).all();
      return result.results || [];
    } catch (error) {
      logger.error('backup-metadata', 'Failed to get restore history', { error: error.message });
      throw error;
    }
  }
}
