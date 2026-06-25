// Feature flags system for gradual rollouts
// Allows enabling/disabling features without deployment

class FeatureFlags {
  constructor(env) {
    this.env = env;
    this.cache = new Map();
    this.cacheExpiry = 60000; // 1 minute cache
  }

  async isEnabled(flag, defaultValue = false) {
    // Check cache first
    const cached = this.cache.get(flag);
    if (cached && Date.now() < cached.expiry) {
      return cached.value;
    }

    // Check environment variable
    const envValue = this.env[`FEATURE_${flag.toUpperCase()}`];
    if (envValue !== undefined) {
      const value = envValue === 'true' || envValue === '1';
      this.cache.set(flag, { value, expiry: Date.now() + this.cacheExpiry });
      return value;
    }

    // Check KV if available
    if (this.env.KV) {
      try {
        const kvValue = await this.env.KV.get(`feature:${flag}`, { type: 'json' });
        if (kvValue !== null) {
          const value = kvValue.enabled;
          this.cache.set(flag, { value, expiry: Date.now() + this.cacheExpiry });
          return value;
        }
      } catch (error) {
        console.error(`[FeatureFlags] Failed to check KV for ${flag}:`, error);
      }
    }

    // Return default value
    this.cache.set(flag, { value: defaultValue, expiry: Date.now() + this.cacheExpiry });
    return defaultValue;
  }

  async setFlag(flag, enabled, ttl = 3600) {
    // Update cache
    this.cache.set(flag, { value: enabled, expiry: Date.now() + this.cacheExpiry });

    // Update KV if available
    if (this.env.KV) {
      try {
        await this.env.KV.put(
          `feature:${flag}`,
          JSON.stringify({ enabled }),
          { expirationTtl: ttl }
        );
        console.log(`[FeatureFlags] Set ${flag} to ${enabled}`);
        return true;
      } catch (error) {
        console.error(`[FeatureFlags] Failed to set ${flag}:`, error);
        return false;
      }
    }

    return false;
  }

  async getFlags() {
    const flags = {};
    
    // Get all environment variable flags
    for (const key in this.env) {
      if (key.startsWith('FEATURE_')) {
        const flagName = key.substring(8).toLowerCase();
        const value = this.env[key] === 'true' || this.env[key] === '1';
        flags[flagName] = value;
      }
    }

    // Get KV flags if available
    if (this.env.KV) {
      try {
        const kvFlags = await this.env.KV.list({ prefix: 'feature:' });
        for (const item of kvFlags.keys) {
          const flagName = item.name.substring(8);
          const value = await this.env.KV.get(item.name, { type: 'json' });
          if (value !== null) {
            flags[flagName] = value.enabled;
          }
        }
      } catch (error) {
        console.error('[FeatureFlags] Failed to list KV flags:', error);
      }
    }

    return flags;
  }

  clearCache() {
    this.cache.clear();
  }
}

// Singleton instance
let instance = null;

export function getFeatureFlags(env) {
  if (!instance) {
    instance = new FeatureFlags(env);
  }
  return instance;
}

export function resetFeatureFlags() {
  instance = null;
}

// Common feature flag definitions
export const FEATURE_FLAGS = {
  // Agent routing
  NEW_ROUTING_MODEL: 'new_routing_model',
  PARALLEL_AGENT_EXECUTION: 'parallel_agent_execution',
  
  // Dashboard
  DASHBOARD_V2: 'dashboard_v2',
  REALTIME_UPDATES: 'realtime_updates',
  
  // Tools
  GITHUB_TOOL_V2: 'github_tool_v2',
  EMAIL_TOOL_V2: 'email_tool_v2',
  
  // Performance
  CACHING_ENABLED: 'caching_enabled',
  QUERY_OPTIMIZATION: 'query_optimization',
  
  // Security
  ADVANCED_RATE_LIMITING: 'advanced_rate_limiting',
  REQUEST_SIGNING: 'request_signing',
  
  // Monitoring
  DETAILED_LOGGING: 'detailed_logging',
  PERFORMANCE_TRACKING: 'performance_tracking',
};
