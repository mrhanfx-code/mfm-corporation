// Data migration strategy
// Manages database schema migrations and data transformations

class DataMigrationManager {
  constructor(env) {
    this.env = env;
    this.migrations = new Map();
    this.currentVersion = '1.0.0';
  }

  registerMigration(version, up, down, description) {
    this.migrations.set(version, {
      version,
      up,
      down,
      description,
      appliedAt: null
    });
  }

  async getCurrentVersion() {
    if (this.env.KV) {
      try {
        const version = await this.env.KV.get('schema_version');
        if (version) {
          this.currentVersion = version;
          return version;
        }
      } catch (error) {
        console.error('[DataMigration] Failed to get current version:', error);
      }
    }
    
    if (this.env.db) {
      try {
        const result = await this.env.db.prepare(`
          SELECT version FROM schema_migrations ORDER BY applied_at DESC LIMIT 1
        `).first();
        
        if (result) {
          this.currentVersion = result.version;
          return result.version;
        }
      } catch (error) {
        console.error('[DataMigration] Failed to get current version from DB:', error);
      }
    }
    
    return this.currentVersion;
  }

  async migrate(targetVersion = null) {
    const currentVersion = await this.getCurrentVersion();
    const versions = Array.from(this.migrations.keys()).sort();
    
    const target = targetVersion || versions[versions.length - 1];
    const currentIndex = versions.indexOf(currentVersion);
    const targetIndex = versions.indexOf(target);
    
    if (currentIndex === -1) {
      console.warn(`[DataMigration] Current version ${currentVersion} not found in migrations`);
    }
    
    if (targetIndex === -1) {
      throw new Error(`Target version ${target} not found in migrations`);
    }
    
    const results = [];
    
    if (targetIndex > currentIndex) {
      // Migrate up
      for (let i = currentIndex + 1; i <= targetIndex; i++) {
        const version = versions[i];
        const migration = this.migrations.get(version);
        
        try {
          console.log(`[DataMigration] Migrating up to ${version}: ${migration.description}`);
          await migration.up(this.env);
          
          await this.recordMigration(version, 'up');
          results.push({ version, direction: 'up', status: 'success' });
        } catch (error) {
          console.error(`[DataMigration] Failed to migrate to ${version}:`, error);
          results.push({ version, direction: 'up', status: 'failed', error: error.message });
          throw error;
        }
      }
    } else if (targetIndex < currentIndex) {
      // Migrate down
      for (let i = currentIndex; i > targetIndex; i--) {
        const version = versions[i];
        const migration = this.migrations.get(version);
        
        try {
          console.log(`[DataMigration] Migrating down from ${version}: ${migration.description}`);
          await migration.down(this.env);
          
          await this.recordMigration(version, 'down');
          results.push({ version, direction: 'down', status: 'success' });
        } catch (error) {
          console.error(`[DataMigration] Failed to migrate from ${version}:`, error);
          results.push({ version, direction: 'down', status: 'failed', error: error.message });
          throw error;
        }
      }
    }
    
    // Update current version
    this.currentVersion = target;
    await this.setCurrentVersion(target);
    
    console.log(`[DataMigration] Migration complete: ${currentVersion} -> ${target}`);
    
    return {
      from: currentVersion,
      to: target,
      results,
      timestamp: new Date().toISOString()
    };
  }

  async recordMigration(version, direction) {
    const migration = this.migrations.get(version);
    migration.appliedAt = new Date().toISOString();
    
    if (this.env.db) {
      try {
        await this.env.db.prepare(`
          INSERT INTO schema_migrations (version, description, direction, applied_at)
          VALUES (?, ?, ?, ?)
        `).bind(version, migration.description, direction, migration.appliedAt).run();
      } catch (error) {
        console.error('[DataMigration] Failed to record migration:', error);
      }
    }
  }

  async setCurrentVersion(version) {
    if (this.env.KV) {
      try {
        await this.env.KV.put('schema_version', version);
      } catch (error) {
        console.error('[DataMigration] Failed to set current version in KV:', error);
      }
    }
  }

  async getMigrationHistory() {
    if (this.env.db) {
      try {
        const results = await this.env.db.prepare(`
          SELECT * FROM schema_migrations ORDER BY applied_at DESC
        `).all();
        
        return results.results || [];
      } catch (error) {
        console.error('[DataMigration] Failed to get migration history:', error);
      }
    }
    
    return [];
  }

  async rollback(steps = 1) {
    const currentVersion = await this.getCurrentVersion();
    const versions = Array.from(this.migrations.keys()).sort();
    const currentIndex = versions.indexOf(currentVersion);
    
    if (currentIndex === -1) {
      throw new Error(`Current version ${currentVersion} not found`);
    }
    
    if (currentIndex === 0) {
      throw new Error('Cannot rollback from initial version');
    }
    
    const targetIndex = Math.max(0, currentIndex - steps);
    const targetVersion = versions[targetIndex];
    
    return await this.migrate(targetVersion);
  }

  // Common migrations
  initializeCommonMigrations() {
    // Migration 1.0.0 -> 1.1.0: Add audit_log table
    this.registerMigration('1.1.0', 
      async (env) => {
        await env.db.prepare(`
          CREATE TABLE IF NOT EXISTS audit_log (
            id TEXT PRIMARY KEY,
            action TEXT NOT NULL,
            resource TEXT,
            user_id TEXT,
            details TEXT,
            status TEXT,
            category TEXT,
            timestamp TEXT NOT NULL
          )
        `).run();
        
        await env.db.prepare(`
          CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit_log(timestamp)
        `).run();
        
        await env.db.prepare(`
          CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id)
        `).run();
      },
      async (env) => {
        await env.db.prepare(`DROP TABLE IF EXISTS audit_log`).run();
      },
      'Add audit logging table'
    );

    // Migration 1.1.0 -> 1.2.0: Add agent_versions table
    this.registerMigration('1.2.0',
      async (env) => {
        await env.db.prepare(`
          CREATE TABLE IF NOT EXISTS agent_versions (
            agent_id TEXT NOT NULL,
            version TEXT NOT NULL,
            config TEXT NOT NULL,
            created_at TEXT NOT NULL,
            status TEXT NOT NULL,
            PRIMARY KEY (agent_id, version)
          )
        `).run();
        
        await env.db.prepare(`
          CREATE INDEX IF NOT EXISTS idx_agent_versions_status ON agent_versions(status)
        `).run();
      },
      async (env) => {
        await env.db.prepare(`DROP TABLE IF EXISTS agent_versions`).run();
      },
      'Add agent versioning table'
    );

    // Migration 1.2.0 -> 1.3.0: Add ab_experiments table
    this.registerMigration('1.3.0',
      async (env) => {
        await env.db.prepare(`
          CREATE TABLE IF NOT EXISTS ab_experiments (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            config TEXT NOT NULL,
            created_at TEXT NOT NULL,
            status TEXT NOT NULL,
            traffic_split TEXT NOT NULL,
            metrics TEXT NOT NULL,
            ended_at TEXT,
            winner TEXT
          )
        `).run();
        
        await env.db.prepare(`
          CREATE INDEX IF NOT EXISTS idx_ab_experiments_status ON ab_experiments(status)
        `).run();
      },
      async (env) => {
        await env.db.prepare(`DROP TABLE IF EXISTS ab_experiments`).run();
      },
      'Add A/B testing table'
    );

    // Migration 1.3.0 -> 1.4.0: Add schema_migrations table
    this.registerMigration('1.4.0',
      async (env) => {
        await env.db.prepare(`
          CREATE TABLE IF NOT EXISTS schema_migrations (
            version TEXT PRIMARY KEY,
            description TEXT,
            direction TEXT,
            applied_at TEXT NOT NULL
          )
        `).run();
      },
      async (env) => {
        await env.db.prepare(`DROP TABLE IF EXISTS schema_migrations`).run();
      },
      'Add schema migrations tracking table'
    );
  }
}

// Singleton instance
let migrationManagerInstance = null;

export function getDataMigrationManager(env) {
  if (!migrationManagerInstance) {
    migrationManagerInstance = new DataMigrationManager(env);
    migrationManagerInstance.initializeCommonMigrations();
  }
  return migrationManagerInstance;
}

export function resetDataMigrationManager() {
  migrationManagerInstance = null;
}

// Scheduled migration handler
export async function handleScheduledMigration(env) {
  const manager = getDataMigrationManager(env);
  const result = await manager.migrate();
  
  console.log('[DataMigration] Scheduled migration completed');
  
  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' }
  });
}
