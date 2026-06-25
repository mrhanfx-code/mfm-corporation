// Data retention policies
// Manages automatic cleanup of old data per compliance requirements

const RETENTION_POLICIES = {
  tasks: {
    retentionDays: 90,
    archiveDays: 365,
    reason: 'Task history for performance analysis'
  },
  agent_memory: {
    retentionDays: 180,
    archiveDays: 730,
    reason: 'Agent learning context'
  },
  model_usage: {
    retentionDays: 365,
    archiveDays: 1825, // 5 years
    reason: 'Cost tracking and compliance'
  },
  security_alerts: {
    retentionDays: 365,
    archiveDays: 1825,
    reason: 'Security incident records'
  },
  audit_log: {
    retentionDays: 365,
    archiveDays: 3650, // 10 years
    reason: 'Audit trail compliance'
  },
  dead_letter_queue: {
    retentionDays: 30,
    archiveDays: 90,
    reason: 'Failed task analysis'
  },
  dashboard_commands: {
    retentionDays: 90,
    archiveDays: 365,
    reason: 'Command history'
  }
};

class DataRetentionManager {
  constructor(env) {
    this.env = env;
    this.policies = RETENTION_POLICIES;
  }

  async applyRetentionPolicies() {
    console.log('[DataRetention] Applying retention policies...');
    
    const results = {};
    
    for (const [table, policy] of Object.entries(this.policies)) {
      try {
        const result = await this.applyTablePolicy(table, policy);
        results[table] = result;
      } catch (error) {
        console.error(`[DataRetention] Failed to apply policy for ${table}:`, error);
        results[table] = { error: error.message };
      }
    }
    
    console.log('[DataRetention] Retention policies applied:', results);
    
    return {
      timestamp: new Date().toISOString(),
      results
    };
  }

  async applyTablePolicy(table, policy) {
    const retentionDate = new Date();
    retentionDate.setDate(retentionDate.getDate() - policy.retentionDays);
    
    const archiveDate = new Date();
    archiveDate.setDate(archiveDate.getDate() - policy.archiveDays);
    
    // Archive old data before deletion
    const archived = await this.archiveOldData(table, archiveDate);
    
    // Delete expired data
    const deleted = await this.deleteExpiredData(table, retentionDate);
    
    return {
      archived: archived.count,
      deleted: deleted.count,
      retentionDate: retentionDate.toISOString(),
      archiveDate: archiveDate.toISOString()
    };
  }

  async archiveOldData(table, beforeDate) {
    if (!this.env['mfm-corporation-archives']) {
      console.warn('[DataRetention] Archive bucket not configured');
      return { count: 0 };
    }
    
    try {
      // Get data to archive
      const data = await this.env.db.prepare(`
        SELECT * FROM ${table}
        WHERE created_at < ?
        LIMIT 1000
      `).bind(beforeDate.toISOString()).all();
      
      if (!data.results || data.results.length === 0) {
        return { count: 0 };
      }
      
      // Upload to archive bucket
      const archiveKey = `${table}/${beforeDate.toISOString().split('T')[0]}/${crypto.randomUUID()}.json`;
      const archiveData = {
        table,
        archivedAt: new Date().toISOString(),
        records: data.results
      };
      
      const archiveBlob = new Blob([JSON.stringify(archiveData)], { type: 'application/json' });
      await this.env['mfm-corporation-archives'].put(archiveKey, archiveBlob);
      
      console.log(`[DataRetention] Archived ${data.results.length} records from ${table}`);
      
      return { count: data.results.length };
    } catch (error) {
      console.error(`[DataRetention] Failed to archive ${table}:`, error);
      return { count: 0, error: error.message };
    }
  }

  async deleteExpiredData(table, beforeDate) {
    try {
      const result = await this.env.db.prepare(`
        DELETE FROM ${table}
        WHERE created_at < ?
      `).bind(beforeDate.toISOString()).run();
      
      console.log(`[DataRetention] Deleted ${result.meta.changes} records from ${table}`);
      
      return { count: result.meta.changes };
    } catch (error) {
      console.error(`[DataRetention] Failed to delete from ${table}:`, error);
      return { count: 0, error: error.message };
    }
  }

  async getRetentionStatus() {
    const status = {};
    
    for (const [table, policy] of Object.entries(this.policies)) {
      try {
        const retentionDate = new Date();
        retentionDate.setDate(retentionDate.getDate() - policy.retentionDays);
        
        const count = await this.env.db.prepare(`
          SELECT COUNT(*) as count FROM ${table}
          WHERE created_at < ?
        `).bind(retentionDate.toISOString()).first();
        
        status[table] = {
          retentionDays: policy.retentionDays,
          retentionDate: retentionDate.toISOString(),
          expiredCount: count?.count || 0,
          reason: policy.reason
        };
      } catch (error) {
        status[table] = { error: error.message };
      }
    }
    
    return status;
  }

  async getUserDataRetention(userId) {
    // Get retention status for user-specific data
    const userData = {
      userId,
      tasks: 0,
      memory: 0,
      usage: 0
    };
    
    try {
      const tasks = await this.env.db.prepare(`
        SELECT COUNT(*) as count FROM tasks
        WHERE user_id = ?
      `).bind(userId).first();
      userData.tasks = tasks?.count || 0;
      
      const memory = await this.env.db.prepare(`
        SELECT COUNT(*) as count FROM agent_memory
        WHERE user_id = ?
      `).bind(userId).first();
      userData.memory = memory?.count || 0;
      
      const usage = await this.env.db.prepare(`
        SELECT COUNT(*) as count FROM model_usage
        WHERE user_id = ?
      `).bind(userId).first();
      userData.usage = usage?.count || 0;
    } catch (error) {
      console.error('[DataRetention] Failed to get user data:', error);
    }
    
    return userData;
  }

  async deleteUserData(userId) {
    // GDPR-style data deletion request
    console.log(`[DataRetention] Deleting data for user: ${userId}`);
    
    const results = {};
    
    try {
      const tables = ['tasks', 'agent_memory', 'model_usage', 'audit_log'];
      
      for (const table of tables) {
        try {
          const result = await this.env.db.prepare(`
            DELETE FROM ${table} WHERE user_id = ?
          `).bind(userId).run();
          
          results[table] = result.meta.changes;
        } catch (error) {
          results[table] = { error: error.message };
        }
      }
    } catch (error) {
      console.error('[DataRetention] Failed to delete user data:', error);
    }
    
    return {
      userId,
      timestamp: new Date().toISOString(),
      results
    };
  }

  addCustomPolicy(table, retentionDays, archiveDays, reason) {
    this.policies[table] = {
      retentionDays,
      archiveDays,
      reason
    };
  }

  removePolicy(table) {
    delete this.policies[table];
  }
}

// Singleton instance
let retentionInstance = null;

export function getDataRetentionManager(env) {
  if (!retentionInstance) {
    retentionInstance = new DataRetentionManager(env);
  }
  return retentionInstance;
}

export function resetDataRetentionManager() {
  retentionInstance = null;
}

// Scheduled data retention handler
export async function handleScheduledDataRetention(env) {
  const manager = getDataRetentionManager(env);
  const result = await manager.applyRetentionPolicies();
  
  console.log('[DataRetention] Scheduled retention completed');
  
  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' }
  });
}
