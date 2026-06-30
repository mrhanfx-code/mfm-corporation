// Graceful degradation patterns
// Provides fallback responses when services are degraded

class GracefulDegradation {
  constructor(env) {
    this.env = env;
    this.cache = new Map();
    this.cacheTTL = 300000; // 5 minutes
  }

  async getCachedResponse(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() < cached.expiry) {
      console.log(`[GracefulDegradation] Using cached response for ${key}`);
      return cached.data;
    }
    return null;
  }

  async setCachedResponse(key, data) {
    this.cache.set(key, {
      data,
      expiry: Date.now() + this.cacheTTL
    });
    
    // Also store in KV if available
    if (this.env.KV) {
      try {
        await this.env.KV.put(
          `cache:${key}`,
          JSON.stringify(data),
          { expirationTtl: 300 }
        );
      } catch (error) {
        console.error('[GracefulDegradation] Failed to cache in KV:', error);
      }
    }
  }

  async getCachedFromKV(key) {
    if (!this.env.KV) return null;
    
    try {
      const cached = await this.env.KV.get(`cache:${key}`, { type: 'json' });
      if (cached) {
        this.cache.set(key, {
          data: cached,
          expiry: Date.now() + this.cacheTTL
        });
        return cached;
      }
    } catch (error) {
      console.error('[GracefulDegradation] Failed to get from KV:', error);
    }
    
    return null;
  }

  async executeWithFallback(operation, fallback, cacheKey = null) {
    // Try cache first if cacheKey provided
    if (cacheKey) {
      const cached = await this.getCachedResponse(cacheKey);
      if (cached) {
        return { source: 'cache', data: cached };
      }
      
      const kvCached = await this.getCachedFromKV(cacheKey);
      if (kvCached) {
        return { source: 'kv_cache', data: kvCached };
      }
    }
    
    try {
      const result = await operation();
      
      // Cache successful result
      if (cacheKey && result) {
        await this.setCachedResponse(cacheKey, result);
      }
      
      return { source: 'live', data: result };
    } catch (error) {
      console.error('[GracefulDegradation] Operation failed, using fallback:', error.message);
      
      try {
        const fallbackResult = await fallback(error);
        return { source: 'fallback', data: fallbackResult, error: error.message };
      } catch (fallbackError) {
        console.error('[GracefulDegradation] Fallback also failed:', fallbackError.message);
        return { source: 'error', error: error.message, fallbackError: fallbackError.message };
      }
    }
  }

  // LLM fallback with cached responses
  async getLLMResponseWithFallback(prompt, context = {}) {
    const cacheKey = `llm:${context.agent || 'default'}:${prompt.substring(0, 50)}`;
    
    return await this.executeWithFallback(
      async () => {
        const { callLLM } = await import('./llm-client.js');
        return await callLLM(prompt, this.env, context);
      },
      async (error) => {
        // Fallback: Return cached response or generic message
        const cached = await this.getCachedFromKV(cacheKey);
        if (cached) {
          return cached;
        }
        
        return {
          content: "I'm experiencing some technical difficulties right now. Please try again in a moment.",
          degraded: true,
          error: error.message
        };
      },
      cacheKey
    );
  }

  // Database fallback with cached data
  async getDatabaseDataWithFallback(query, params = [], cacheKey = null) {
    return await this.executeWithFallback(
      async () => {
        const result = await this.env.db.prepare(query).bind(...params).all();
        return result.results || [];
      },
      async (error) => {
        // Fallback: Return empty array or cached data
        if (cacheKey) {
          const cached = await this.getCachedFromKV(cacheKey);
          if (cached) {
            return cached;
          }
        }
        
        return [];
      },
      cacheKey
    );
  }

  // External API fallback
  async fetchWithFallback(url, options = {}, fallbackData = null) {
    const cacheKey = `fetch:${url}`;
    
    return await this.executeWithFallback(
      async () => {
        const response = await fetch(url, options);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
      },
      async (error) => {
        // Fallback: Return cached data or provided fallback
        if (fallbackData) return fallbackData;
        
        const cached = await this.getCachedFromKV(cacheKey);
        if (cached) return cached;
        
        return { error: error.message, degraded: true };
      },
      cacheKey
    );
  }

  // Health-based degradation
  async checkServiceHealth(serviceName) {
    const healthKey = `health:${serviceName}`;
    const cached = this.cache.get(healthKey);
    
    if (cached && Date.now() < cached.expiry) {
      return cached.healthy;
    }
    
    // Perform health check
    let healthy = true;
    
    try {
      switch (serviceName) {
        case 'llm':
          healthy = !!(this.env.CEREBRAS_API_KEY || this.env.OPENROUTER_API_KEY);
          break;
        case 'database':
          await this.env.db.prepare('SELECT 1').first();
          break;
        case 'kv':
          await this.env.KV.get('health-check');
          break;
        default:
          healthy = true;
      }
    } catch (error) {
      healthy = false;
      console.error(`[GracefulDegradation] Health check failed for ${serviceName}:`, error);
    }
    
    this.cache.set(healthKey, {
      healthy,
      expiry: Date.now() + 60000 // 1 minute cache
    });
    
    return healthy;
  }

  async shouldDegrade(serviceName) {
    const healthy = await this.checkServiceHealth(serviceName);
    return !healthy;
  }

  clearCache() {
    this.cache.clear();
  }
}

// Singleton instance
let degradationInstance = null;

export function getGracefulDegradation(env) {
  if (!degradationInstance) {
    degradationInstance = new GracefulDegradation(env);
  }
  return degradationInstance;
}

export function resetGracefulDegradation() {
  degradationInstance = null;
}
