// Backup Service
// Automated backup system for D1 database and KV namespace

import { logger } from './logger.js';

export class BackupService {
  constructor(db, kv, r2) {
    this.db = db;
    this.kv = kv;
    this.r2 = r2;
  }

  /**
   * Backup D1 database to R2
   */
  async backupD1() {
    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = `d1-backup-${timestamp}.sql.gz`;
    const filePath = `backups/d1/${fileName}`;

    try {
      logger.info('backup', 'Starting D1 backup', { fileName });

      // Export D1 database to SQL
      const sqlDump = await this.exportD1ToSQL();

      // Compress with gzip
      const compressed = await this.compressGzip(sqlDump);

      // Calculate checksum
      const checksum = await this.calculateChecksum(compressed);

      // Upload to R2
      await this.r2.put(filePath, compressed, {
        httpMetadata: {
          contentType: 'application/gzip'
        },
        customMetadata: {
          type: 'd1',
          timestamp,
          checksum,
          uncompressedSize: sqlDump.length.toString()
        }
      });

      logger.info('backup', 'D1 backup completed', {
        fileName,
        size: compressed.length,
        checksum
      });

      return {
        success: true,
        fileName,
        filePath,
        size: compressed.length,
        checksum,
        timestamp
      };
    } catch (error) {
      logger.error('backup', 'D1 backup failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Backup KV namespace to R2
   */
  async backupKV() {
    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = `kv-backup-${timestamp}.json.gz`;
    const filePath = `backups/kv/${fileName}`;

    try {
      logger.info('backup', 'Starting KV backup', { fileName });

      // Export KV to JSON
      const kvData = await this.exportKVToJSON();

      // Compress with gzip
      const compressed = await this.compressGzip(JSON.stringify(kvData));

      // Calculate checksum
      const checksum = await this.calculateChecksum(compressed);

      // Upload to R2
      await this.r2.put(filePath, compressed, {
        httpMetadata: {
          contentType: 'application/gzip'
        },
        customMetadata: {
          type: 'kv',
          timestamp,
          checksum,
          keyCount: kvData.length.toString()
        }
      });

      logger.info('backup', 'KV backup completed', {
        fileName,
        size: compressed.length,
        checksum,
        keyCount: kvData.length
      });

      return {
        success: true,
        fileName,
        filePath,
        size: compressed.length,
        checksum,
        timestamp,
        keyCount: kvData.length
      };
    } catch (error) {
      logger.error('backup', 'KV backup failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Export D1 database to SQL
   */
  async exportD1ToSQL() {
    const tables = await this.listTables();
    let sql = '';

    for (const table of tables) {
      sql += `-- Table: ${table}\n`;
      sql += `DROP TABLE IF EXISTS ${table};\n`;
      
      const schema = await this.getTableSchema(table);
      sql += schema + ';\n\n';

      const data = await this.getTableData(table);
      if (data.length > 0) {
        sql += `INSERT INTO ${table} VALUES\n`;
        const values = data.map(row => {
          const cols = Object.values(row).map(val => {
            if (val === null) return 'NULL';
            if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
            return val;
          });
          return `(${cols.join(', ')})`;
        });
        sql += values.join(',\n');
        sql += ';\n\n';
      }
    }

    return sql;
  }

  /**
   * List all tables in D1
   */
  async listTables() {
    const result = await this.db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    ).all();
    return result.results.map(row => row.name);
  }

  /**
   * Get table schema
   */
  async getTableSchema(tableName) {
    const result = await this.db.prepare(
      `SELECT sql FROM sqlite_master WHERE type='table' AND name=?`
    ).bind(tableName).first();
    return result ? result.sql : '';
  }

  /**
   * Get all data from table
   */
  async getTableData(tableName) {
    const result = await this.db.prepare(`SELECT * FROM ${tableName}`).all();
    return result.results || [];
  }

  /**
   * Export KV namespace to JSON
   */
  async exportKVToJSON() {
    const keys = await this.listKVKeys();
    const data = [];

    for (const key of keys) {
      const value = await this.kv.get(key, { type: 'text' });
      if (value !== null) {
        data.push({ key, value });
      }
    }

    return data;
  }

  /**
   * List all KV keys
   */
  async listKVKeys() {
    const keys = [];
    let cursor = null;

    do {
      const result = await this.kv.list({ cursor, limit: 1000 });
      keys.push(...result.keys.map(k => k.name));
      cursor = result.list_complete ? null : result.cursor;
    } while (cursor);

    return keys;
  }

  /**
   * Compress data with gzip
   */
  async compressGzip(data) {
    // In Cloudflare Workers, use CompressionStream
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(data));
        controller.close();
      }
    });

    const compressedStream = stream.pipeThrough(new CompressionStream('gzip'));
    const compressedBuffer = await new Response(compressedStream).arrayBuffer();
    return new Uint8Array(compressedBuffer);
  }

  /**
   * Calculate SHA-256 checksum
   */
  async calculateChecksum(data) {
    const buffer = data instanceof Uint8Array ? data : new TextEncoder().encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Verify backup integrity
   */
  async verifyBackup(filePath, expectedChecksum) {
    try {
      const object = await this.r2.get(filePath);
      if (!object) {
        throw new Error('Backup file not found');
      }

      const data = await object.arrayBuffer();
      const actualChecksum = await this.calculateChecksum(new Uint8Array(data));

      const isValid = actualChecksum === expectedChecksum;
      logger.info('backup', 'Backup verification', {
        filePath,
        isValid,
        expectedChecksum,
        actualChecksum
      });

      return isValid;
    } catch (error) {
      logger.error('backup', 'Backup verification failed', {
        filePath,
        error: error.message
      });
      return false;
    }
  }

  /**
   * Restore D1 from backup
   */
  async restoreD1(filePath) {
    try {
      logger.info('backup', 'Starting D1 restore', { filePath });

      const object = await this.r2.get(filePath);
      if (!object) {
        throw new Error('Backup file not found');
      }

      const compressed = await object.arrayBuffer();
      const decompressedStream = new Response(compressed)
        .body
        .pipeThrough(new DecompressionStream('gzip'));
      const sql = await new Response(decompressedStream).text();

      // Execute SQL statements
      const statements = sql.split(';').filter(s => s.trim());
      for (const statement of statements) {
        if (statement.trim() && !statement.startsWith('--')) {
          await this.db.prepare(statement).run();
        }
      }

      logger.info('backup', 'D1 restore completed', { filePath });
      return { success: true };
    } catch (error) {
      logger.error('backup', 'D1 restore failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Restore KV from backup
   */
  async restoreKV(filePath) {
    try {
      logger.info('backup', 'Starting KV restore', { filePath });

      const object = await this.r2.get(filePath);
      if (!object) {
        throw new Error('Backup file not found');
      }

      const compressed = await object.arrayBuffer();
      const decompressedStream = new Response(compressed)
        .body
        .pipeThrough(new DecompressionStream('gzip'));
      const json = await new Response(decompressedStream).text();
      const data = JSON.parse(json);

      // Batch import to KV
      for (const { key, value } of data) {
        await this.kv.put(key, value);
      }

      logger.info('backup', 'KV restore completed', {
        filePath,
        keyCount: data.length
      });
      return { success: true, keyCount: data.length };
    } catch (error) {
      logger.error('backup', 'KV restore failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Delete old backups beyond retention period
   */
  async cleanupOldBackups(retentionDays = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    try {
      logger.info('backup', 'Starting backup cleanup', { retentionDays, cutoffDate });

      // List D1 backups
      const d1Backups = await this.r2.list({ prefix: 'backups/d1/' });
      for (const object of d1Backups.objects) {
        const objectDate = new Date(object.uploaded);
        if (objectDate < cutoffDate) {
          await this.r2.delete(object.key);
          logger.info('backup', 'Deleted old D1 backup', { key: object.key });
        }
      }

      // List KV backups
      const kvBackups = await this.r2.list({ prefix: 'backups/kv/' });
      for (const object of kvBackups.objects) {
        const objectDate = new Date(object.uploaded);
        if (objectDate < cutoffDate) {
          await this.r2.delete(object.key);
          logger.info('backup', 'Deleted old KV backup', { key: object.key });
        }
      }

      logger.info('backup', 'Backup cleanup completed');
    } catch (error) {
      logger.error('backup', 'Backup cleanup failed', { error: error.message });
      throw error;
    }
  }
}
