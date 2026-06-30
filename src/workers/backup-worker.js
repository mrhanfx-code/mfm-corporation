// Backup Worker
// Entry point for automated backup system via Cloudflare Cron Trigger

import { BackupService } from '../core/backup-service.js';
import { BackupMetadataManager } from '../core/backup-metadata.js';
import { Logger } from '../core/logger.js';

export default {
  async scheduled(event, env, ctx) {
    const logger = new Logger('backup-worker');
    logger.info('Backup worker triggered', { cron: event.cron });

    try {
      // Initialize services
      const backupService = new BackupService(env.db, env.kv, env.mfm_corporation_backups);
      const metadataManager = new BackupMetadataManager(env.db);

      // Initialize metadata table
      await metadataManager.initialize();

      // Perform D1 backup
      logger.info('Starting D1 backup');
      const d1Backup = await backupService.backupD1();
      const d1BackupId = await metadataManager.recordBackup({
        type: 'd1',
        ...d1Backup
      });

      // Verify D1 backup
      const d1Verified = await backupService.verifyBackup(d1Backup.filePath, d1Backup.checksum);
      await metadataManager.updateVerification(d1BackupId, d1Verified);

      if (!d1Verified) {
        logger.error('D1 backup verification failed');
      }

      // Perform KV backup
      logger.info('Starting KV backup');
      const kvBackup = await backupService.backupKV();
      const kvBackupId = await metadataManager.recordBackup({
        type: 'kv',
        ...kvBackup
      });

      // Verify KV backup
      const kvVerified = await backupService.verifyBackup(kvBackup.filePath, kvBackup.checksum);
      await metadataManager.updateVerification(kvBackupId, kvVerified);

      if (!kvVerified) {
        logger.error('KV backup verification failed');
      }

      // Cleanup old backups
      logger.info('Starting backup cleanup');
      await backupService.cleanupOldBackups(30);
      await metadataManager.cleanupOldMetadata();

      // Get statistics
      const stats = await metadataManager.getStatistics();
      logger.info('Backup completed', {
        d1: d1Backup.fileName,
        kv: kvBackup.fileName,
        d1Verified,
        kvVerified,
        stats
      });

      return new Response(JSON.stringify({
        success: true,
        d1Backup: d1Backup.fileName,
        kvBackup: kvBackup.fileName,
        d1Verified,
        kvVerified,
        stats
      }), {
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      logger.error('Backup worker failed', { error: error.message, stack: error.stack });
      return new Response(JSON.stringify({
        success: false,
        error: error.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};
