// D1 database backup to R2
// Automated daily backups with retention policy

const BACKUP_CONFIG = {
  retentionDays: 30, // Keep backups for 30 days
  compression: true,
  tables: [
    'tasks',
    'agent_memory',
    'subagent_tasks',
    'dashboard_commands',
    'model_usage',
    'security_alerts',
    'dead_letter_queue'
  ]
};

class D1BackupManager {
  constructor(env) {
    this.env = env;
    this.backupBucket = env['mfm-corporation-backups'];
  }

  async createBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupId = `d1-backup-${timestamp}`;
    
    console.log(`[D1Backup] Starting backup: ${backupId}`);
    
    const backupData = {
      id: backupId,
      timestamp: new Date().toISOString(),
      tables: {}
    };
    
    for (const table of BACKUP_CONFIG.tables) {
      try {
        console.log(`[D1Backup] Backing up table: ${table}`);
        const data = await this.backupTable(table);
        backupData.tables[table] = {
          rows: data.length,
          data: data
        };
      } catch (error) {
        console.error(`[D1Backup] Failed to backup table ${table}:`, error);
        backupData.tables[table] = {
          error: error.message,
          rows: 0
        };
      }
    }
    
    // Upload backup to R2
    if (this.backupBucket) {
      try {
        const backupJson = JSON.stringify(backupData);
        const backupBlob = new Blob([backupJson], { type: 'application/json' });
        
        await this.backupBucket.put(`${backupId}.json`, backupBlob, {
          customMetadata: {
            timestamp: backupData.timestamp,
            tables: Object.keys(backupData.tables).join(','),
            size: backupJson.length
          }
        });
        
        console.log(`[D1Backup] Backup uploaded: ${backupId}.json (${backupJson.length} bytes)`);
        
        // Clean up old backups
        await this.cleanupOldBackups();
        
        return { success: true, backupId, size: backupJson.length };
      } catch (error) {
        console.error('[D1Backup] Failed to upload backup:', error);
        return { success: false, error: error.message };
      }
    } else {
      console.error('[D1Backup] R2 backup bucket not configured');
      return { success: false, error: 'R2 bucket not configured' };
    }
  }

  async backupTable(tableName) {
    try {
      const result = await this.env.db.prepare(`SELECT * FROM ${tableName}`).all();
      return result.results || [];
    } catch (error) {
      console.error(`[D1Backup] Failed to backup table ${tableName}:`, error);
      throw error;
    }
  }

  async cleanupOldBackups() {
    if (!this.backupBucket) return;
    
    try {
      console.log('[D1Backup] Cleaning up old backups...');
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - BACKUP_CONFIG.retentionDays);
      
      const listed = await this.backupBucket.list();
      let deletedCount = 0;
      
      for (const object of listed.objects) {
        if (object.key.startsWith('d1-backup-')) {
          const objectDate = new Date(object.uploaded);
          
          if (objectDate < cutoffDate) {
            await this.backupBucket.delete(object.key);
            deletedCount++;
            console.log(`[D1Backup] Deleted old backup: ${object.key}`);
          }
        }
      }
      
      console.log(`[D1Backup] Cleanup complete: ${deletedCount} backups deleted`);
    } catch (error) {
      console.error('[D1Backup] Failed to cleanup old backups:', error);
    }
  }

  async listBackups() {
    if (!this.backupBucket) return [];
    
    try {
      const listed = await this.backupBucket.list();
      const backups = listed.objects
        .filter(obj => obj.key.startsWith('d1-backup-'))
        .map(obj => ({
          key: obj.key,
          size: obj.size,
          uploaded: obj.uploaded,
          metadata: obj.customMetadata
        }))
        .sort((a, b) => new Date(b.uploaded) - new Date(a.uploaded));
      
      return backups;
    } catch (error) {
      console.error('[D1Backup] Failed to list backups:', error);
      return [];
    }
  }

  async restoreBackup(backupId) {
    if (!this.backupBucket) {
      return { success: false, error: 'R2 bucket not configured' };
    }
    
    try {
      console.log(`[D1Backup] Restoring backup: ${backupId}`);
      
      const object = await this.backupBucket.get(`${backupId}.json`);
      if (!object) {
        return { success: false, error: 'Backup not found' };
      }
      
      const backupData = await object.json();
      
      // Restore each table
      for (const [tableName, tableData] of Object.entries(backupData.tables)) {
        if (tableData.error) {
          console.warn(`[D1Backup] Skipping table ${tableName} (backup had error)`);
          continue;
        }
        
        try {
          // Clear existing data
          await this.env.db.prepare(`DELETE FROM ${tableName}`).run();
          
          // Insert backup data
          for (const row of tableData.data) {
            const columns = Object.keys(row);
            const placeholders = columns.map(() => '?').join(', ');
            const values = columns.map(col => row[col]);
            
            await this.env.db.prepare(
              `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`
            ).bind(...values).run();
          }
          
          console.log(`[D1Backup] Restored table ${tableName} (${tableData.rows} rows)`);
        } catch (error) {
          console.error(`[D1Backup] Failed to restore table ${tableName}:`, error);
        }
      }
      
      return { success: true, backupId, tablesRestored: Object.keys(backupData.tables).length };
    } catch (error) {
      console.error('[D1Backup] Failed to restore backup:', error);
      return { success: false, error: error.message };
    }
  }
}

// Singleton instance
let backupManagerInstance = null;

export function getBackupManager(env) {
  if (!backupManagerInstance) {
    backupManagerInstance = new D1BackupManager(env);
  }
  return backupManagerInstance;
}

export function resetBackupManager() {
  backupManagerInstance = null;
}

// Scheduled backup handler
export async function handleScheduledBackup(env) {
  const manager = getBackupManager(env);
  const result = await manager.createBackup();
  
  console.log('[D1Backup] Scheduled backup completed:', result.success ? 'SUCCESS' : 'FAILED');
  
  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' }
  });
}
