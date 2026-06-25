// Agent versioning system
// Manages multiple versions of agents for gradual rollouts and rollbacks

class AgentVersionManager {
  constructor(env) {
    this.env = env;
    this.versions = new Map();
  }

  async registerVersion(agentId, version, config) {
    const versionKey = `${agentId}:${version}`;
    
    const versionRecord = {
      agentId,
      version,
      config,
      createdAt: new Date().toISOString(),
      status: 'active'
    };
    
    // Store in database
    if (this.env.db) {
      try {
        await this.env.db.prepare(`
          INSERT INTO agent_versions (agent_id, version, config, created_at, status)
          VALUES (?, ?, ?, ?, ?)
        `).bind(agentId, version, JSON.stringify(config), versionRecord.createdAt, 'active').run();
      } catch (error) {
        console.error('[AgentVersioning] Failed to register version:', error);
      }
    }
    
    // Store in memory
    this.versions.set(versionKey, versionRecord);
    
    console.log(`[AgentVersioning] Registered version ${version} for agent ${agentId}`);
    
    return versionRecord;
  }

  async getActiveVersion(agentId) {
    // Check KV first for current active version
    if (this.env.KV) {
      try {
        const activeVersion = await this.env.KV.get(`agent:${agentId}:active_version`);
        if (activeVersion) {
          return activeVersion;
        }
      } catch (error) {
        console.error('[AgentVersioning] Failed to get active version from KV:', error);
      }
    }
    
    // Fall back to database
    if (this.env.db) {
      try {
        const result = await this.env.db.prepare(`
          SELECT version FROM agent_versions
          WHERE agent_id = ? AND status = 'active'
          ORDER BY created_at DESC
          LIMIT 1
        `).bind(agentId).first();
        
        return result?.version || '1.0.0';
      } catch (error) {
        console.error('[AgentVersioning] Failed to get active version from DB:', error);
      }
    }
    
    return '1.0.0';
  }

  async setActiveVersion(agentId, version) {
    // Update in KV
    if (this.env.KV) {
      try {
        await this.env.KV.put(`agent:${agentId}:active_version`, version);
      } catch (error) {
        console.error('[AgentVersioning] Failed to set active version in KV:', error);
      }
    }
    
    // Update in database
    if (this.env.db) {
      try {
        // Deactivate all versions for this agent
        await this.env.db.prepare(`
          UPDATE agent_versions SET status = 'inactive'
          WHERE agent_id = ?
        `).bind(agentId).run();
        
        // Activate the specified version
        await this.env.db.prepare(`
          UPDATE agent_versions SET status = 'active'
          WHERE agent_id = ? AND version = ?
        `).bind(agentId, version).run();
      } catch (error) {
        console.error('[AgentVersioning] Failed to set active version in DB:', error);
      }
    }
    
    console.log(`[AgentVersioning] Set active version ${version} for agent ${agentId}`);
  }

  async getVersion(agentId, version) {
    const versionKey = `${agentId}:${version}`;
    
    // Check memory first
    if (this.versions.has(versionKey)) {
      return this.versions.get(versionKey);
    }
    
    // Check database
    if (this.env.db) {
      try {
        const result = await this.env.db.prepare(`
          SELECT * FROM agent_versions
          WHERE agent_id = ? AND version = ?
        `).bind(agentId, version).first();
        
        if (result) {
          const versionRecord = {
            agentId: result.agent_id,
            version: result.version,
            config: JSON.parse(result.config),
            createdAt: result.created_at,
            status: result.status
          };
          
          this.versions.set(versionKey, versionRecord);
          return versionRecord;
        }
      } catch (error) {
        console.error('[AgentVersioning] Failed to get version:', error);
      }
    }
    
    return null;
  }

  async listVersions(agentId) {
    if (this.env.db) {
      try {
        const results = await this.env.db.prepare(`
          SELECT * FROM agent_versions
          WHERE agent_id = ?
          ORDER BY created_at DESC
        `).bind(agentId).all();
        
        return (results.results || []).map(r => ({
          agentId: r.agent_id,
          version: r.version,
          config: JSON.parse(r.config),
          createdAt: r.created_at,
          status: r.status
        }));
      } catch (error) {
        console.error('[AgentVersioning] Failed to list versions:', error);
      }
    }
    
    return [];
  }

  async rollback(agentId, targetVersion = null) {
    const versions = await this.listVersions(agentId);
    
    if (versions.length === 0) {
      throw new Error('No versions found for agent');
    }
    
    let rollbackVersion = targetVersion;
    
    if (!rollbackVersion) {
      // Rollback to previous version
      const activeVersion = await this.getActiveVersion(agentId);
      const activeIndex = versions.findIndex(v => v.version === activeVersion);
      
      if (activeIndex === -1) {
        rollbackVersion = versions[0].version;
      } else if (activeIndex < versions.length - 1) {
        rollbackVersion = versions[activeIndex + 1].version;
      } else {
        throw new Error('No previous version to rollback to');
      }
    }
    
    const versionExists = versions.some(v => v.version === rollbackVersion);
    if (!versionExists) {
      throw new Error(`Version ${rollbackVersion} not found`);
    }
    
    await this.setActiveVersion(agentId, rollbackVersion);
    
    console.log(`[AgentVersioning] Rolled back agent ${agentId} to version ${rollbackVersion}`);
    
    return {
      agentId,
      previousVersion: await this.getActiveVersion(agentId),
      rollbackVersion,
      timestamp: new Date().toISOString()
    };
  }

  async canaryRollout(agentId, newVersion, percentage = 10) {
    // Implement canary rollout using feature flags
    const { getFeatureFlags } = await import('./feature-flags.js');
    const featureFlags = getFeatureFlags(this.env);
    
    // Set feature flag for canary
    await featureFlags.setFlag(`agent_${agentId}_canary`, true, 3600);
    await featureFlags.setFlag(`agent_${agentId}_version`, newVersion, 3600);
    await featureFlags.setFlag(`agent_${agentId}_canary_percentage`, percentage.toString(), 3600);
    
    console.log(`[AgentVersioning] Canary rollout for ${agentId}: ${percentage}% to version ${newVersion}`);
    
    return {
      agentId,
      newVersion,
      percentage,
      timestamp: new Date().toISOString()
    };
  }

  async getAgentConfig(agentId) {
    const version = await this.getActiveVersion(agentId);
    const versionRecord = await this.getVersion(agentId, version);
    
    if (!versionRecord) {
      // Return default config
      return {
        agentId,
        version: '1.0.0',
        config: {}
      };
    }
    
    return versionRecord;
  }

  async deleteVersion(agentId, version) {
    // Only allow deletion of inactive versions
    const versionRecord = await this.getVersion(agentId, version);
    
    if (!versionRecord) {
      throw new Error('Version not found');
    }
    
    if (versionRecord.status === 'active') {
      throw new Error('Cannot delete active version');
    }
    
    if (this.env.db) {
      try {
        await this.env.db.prepare(`
          DELETE FROM agent_versions
          WHERE agent_id = ? AND version = ?
        `).bind(agentId, version).run();
      } catch (error) {
        console.error('[AgentVersioning] Failed to delete version:', error);
      }
    }
    
    this.versions.delete(`${agentId}:${version}`);
    
    console.log(`[AgentVersioning] Deleted version ${version} for agent ${agentId}`);
  }
}

// Singleton instance
let versionManagerInstance = null;

export function getAgentVersionManager(env) {
  if (!versionManagerInstance) {
    versionManagerInstance = new AgentVersionManager(env);
  }
  return versionManagerInstance;
}

export function resetAgentVersionManager() {
  versionManagerInstance = null;
}
