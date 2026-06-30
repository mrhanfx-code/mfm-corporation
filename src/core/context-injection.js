// Context Injection — Automatic context injection on session start

import { logger } from './logger.js';
import { saveMemory, getMemory } from '../tools/d1-store.js';
import { HybridSearchManager } from './hybrid-search.js';
import { readdir, stat } from 'fs/promises';
import { join } from 'path';

class ContextInjectionManager {
  constructor(env) {
    this.env = env;
    this.hybridSearch = new HybridSearchManager(env);
    this.sessionContext = new Map();
    this.projectStructure = null;
    this.recentChanges = [];
    this.maxRecentChanges = 50;
    this.userPreferences = new Map();
  }

  async injectContext(sessionId, task, options = {}) {
    const { includeRecent = true, maxResults = 20, includeRelated = true, includeProjectStructure = true, includeRecentChanges = true } = options;
    
    logger.info(`Context Injection: Injecting context for session ${sessionId}`, {
      task: task.description,
      includeRecent,
      maxResults,
      includeProjectStructure,
      includeRecentChanges
    });
    
    const context = {
      sessionId,
      task,
      injectedAt: new Date().toISOString(),
      recentContext: [],
      relatedContext: [],
      businessContext: null,
      projectStructure: null,
      recentChanges: [],
      totalContextSize: 0
    };
    
    // Get recent context
    if (includeRecent) {
      context.recentContext = await this.getRecentContext(sessionId, maxResults / 2);
    }
    
    // Get related context using hybrid search
    if (includeRelated) {
      context.relatedContext = await this.getRelatedContext(task, maxResults / 2);
    }
    
    // Get business context if available
    context.businessContext = await this.getBusinessContext(task);
    
    // Get project structure
    if (includeProjectStructure) {
      context.projectStructure = await this.getProjectStructure();
    }
    
    // Get recent changes
    if (includeRecentChanges) {
      context.recentChanges = await this.getRecentChanges();
    }
    
    // Calculate total context size
    context.totalContextSize = this.calculateContextSize(context);
    
    // Save context to session
    this.sessionContext.set(sessionId, context);
    await this.saveContext(sessionId, context);
    
    logger.info(`Context Injection: Context injected for ${sessionId}`, {
      recentCount: context.recentContext.length,
      relatedCount: context.relatedContext.length,
      hasProjectStructure: !!context.projectStructure,
      recentChangesCount: context.recentChanges.length,
      totalSize: context.totalContextSize
    });
    
    return context;
  }

  async getProjectStructure() {
    if (this.projectStructure) {
      return this.projectStructure;
    }

    try {
      // Analyze project structure
      const structure = {
        root: process.cwd(),
        directories: [],
        files: [],
        keyFiles: [],
        totalFiles: 0,
        totalDirectories: 0,
        analyzedAt: new Date().toISOString()
      };

      // Get root directory listing
      const rootListing = await readdir(structure.root, { withFileTypes: true });
      
      for (const item of rootListing) {
        const fullPath = join(structure.root, item.name);
        const stats = await stat(fullPath);
        
        if (item.isDirectory()) {
          structure.directories.push({
            name: item.name,
            itemCount: 0
          });
          structure.totalDirectories++;
        } else if (item.isFile()) {
          structure.files.push({
            name: item.name,
            size: stats.size
          });
          structure.totalFiles++;
          
          // Identify key files
          if (this.isKeyFile(item.name)) {
            structure.keyFiles.push(item.name);
          }
        }
      }

      this.projectStructure = structure;
      logger.info(`Context Injection: Project structure analyzed`, {
        totalFiles: structure.totalFiles,
        totalDirectories: structure.totalDirectories,
        keyFiles: structure.keyFiles.length
      });

      return structure;
    } catch (error) {
      logger.error(`Context Injection: Failed to analyze project structure`, {
        error: error.message
      });
      return null;
    }
  }

  isKeyFile(filePath) {
    const keyFilePatterns = [
      'package.json',
      'README.md',
      '.gitignore',
      'tsconfig.json',
      'vite.config',
      'wrangler.toml',
      'schema.sql',
      'index.js',
      'index.ts',
      'main.js',
      'main.ts'
    ];

    return keyFilePatterns.some(pattern => filePath.includes(pattern));
  }

  async getRecentChanges() {
    return this.recentChanges.slice(0, 20);
  }

  trackChange(change) {
    const changeRecord = {
      ...change,
      timestamp: new Date().toISOString()
    };

    this.recentChanges.unshift(changeRecord);

    // Keep only the most recent changes
    if (this.recentChanges.length > this.maxRecentChanges) {
      this.recentChanges = this.recentChanges.slice(0, this.maxRecentChanges);
    }

    logger.info(`Context Injection: Tracked change`, {
      type: change.type,
      file: change.file
    });
  }

  clearRecentChanges() {
    this.recentChanges = [];
    logger.info(`Context Injection: Cleared recent changes`);
  }

  setUserPreference(key, value) {
    this.userPreferences.set(key, value);
    logger.info(`Context Injection: Set user preference`, { key });
  }

  getUserPreference(key, defaultValue = null) {
    return this.userPreferences.get(key) ?? defaultValue;
  }

  getUserPreferences() {
    return Object.fromEntries(this.userPreferences);
  }

  clearUserPreferences() {
    this.userPreferences.clear();
    logger.info(`Context Injection: Cleared user preferences`);
  }

  async saveUserPreferences() {
    try {
      const memoryKey = 'user_preferences';
      const preferences = Object.fromEntries(this.userPreferences);
      await saveMemory(this.env, memoryKey, preferences);
      logger.info(`Context Injection: Saved user preferences`);
    } catch (error) {
      logger.error(`Context Injection: Failed to save user preferences`, {
        error: error.message
      });
    }
  }

  async loadUserPreferences() {
    try {
      const memoryKey = 'user_preferences';
      const saved = await getMemory(this.env, memoryKey, 1);
      
      if (saved && saved.length > 0) {
        const preferences = saved[0].content;
        if (typeof preferences === 'object') {
          for (const [key, value] of Object.entries(preferences)) {
            this.userPreferences.set(key, value);
          }
          logger.info(`Context Injection: Loaded user preferences`, {
            count: this.userPreferences.size
          });
        }
      }
    } catch (error) {
      logger.error(`Context Injection: Failed to load user preferences`, {
        error: error.message
      });
    }
  }

  async getRecentContext(sessionId, limit) {
    try {
      // Get recent memory for the session
      const recentMemory = await getMemory(this.env, sessionId, limit);
      
      return recentMemory.map(mem => ({
        type: 'recent',
        role: mem.role,
        content: mem.content,
        timestamp: mem.timestamp
      }));
    } catch (error) {
      logger.error(`Context Injection: Failed to get recent context`, {
        error: error.message
      });
      return [];
    }
  }

  async getRelatedContext(task, limit) {
    try {
      // Use hybrid search to find related context
      const query = task.description || task;
      const searchResults = await this.hybridSearch.hybridSearch(query, { limit });
      
      return searchResults.map(result => ({
        type: 'related',
        content: result.content,
        score: result.score,
        docId: result.docId
      }));
    } catch (error) {
      logger.error(`Context Injection: Failed to get related context`, {
        error: error.message
      });
      return [];
    }
  }

  async getBusinessContext(task) {
    try {
      // Get business context cards if available
      const contextCardKey = `business_context:${task.type || 'default'}`;
      const contextCard = await getMemory(this.env, contextCardKey, 1);
      
      if (contextCard && contextCard.length > 0) {
        return {
          type: 'business',
          content: contextCard[0].content,
          timestamp: contextCard[0].timestamp
        };
      }
      
      return null;
    } catch (error) {
      logger.error(`Context Injection: Failed to get business context`, {
        error: error.message
      });
      return null;
    }
  }

  calculateContextSize(context) {
    let size = 0;
    
    for (const item of context.recentContext) {
      size += item.content.length;
    }
    
    for (const item of context.relatedContext) {
      size += item.content.length;
    }
    
    if (context.businessContext) {
      size += context.businessContext.content.length;
    }
    
    if (context.projectStructure) {
      size += JSON.stringify(context.projectStructure).length;
    }
    
    if (context.recentChanges && Array.isArray(context.recentChanges)) {
      for (const change of context.recentChanges) {
        size += JSON.stringify(change).length;
      }
    }
    
    return size;
  }

  async saveContext(sessionId, context) {
    try {
      const memoryKey = `context_injection:${sessionId}`;
      await saveMemory(this.env, memoryKey, context);
    } catch (error) {
      logger.error(`Context Injection: Failed to save context`, {
        error: error.message
      });
    }
  }

  getSessionContext(sessionId) {
    return this.sessionContext.get(sessionId) || null;
  }

  async updateContext(sessionId, newContext) {
    const existing = this.sessionContext.get(sessionId);
    if (!existing) {
      logger.warn(`Context Injection: Session not found ${sessionId}`);
      return null;
    }
    
    // Merge new context with existing
    existing.recentContext.push(...newContext.recentContext);
    existing.relatedContext.push(...newContext.relatedContext);
    existing.totalContextSize = this.calculateContextSize(existing);
    existing.updatedAt = new Date().toISOString();
    
    this.sessionContext.set(sessionId, existing);
    await this.saveContext(sessionId, existing);
    
    return existing;
  }

  async clearContext(sessionId) {
    this.sessionContext.delete(sessionId);
    logger.info(`Context Injection: Context cleared for ${sessionId}`);
  }

  getContextStatistics() {
    const stats = {
      totalSessions: this.sessionContext.size,
      totalContextSize: 0,
      averageContextSize: 0,
      sessionsWithBusinessContext: 0
    };
    
    for (const context of this.sessionContext.values()) {
      stats.totalContextSize += context.totalContextSize;
      if (context.businessContext) {
        stats.sessionsWithBusinessContext++;
      }
    }
    
    if (stats.totalSessions > 0) {
      stats.averageContextSize = stats.totalContextSize / stats.totalSessions;
    }
    
    return stats;
  }
}

export { ContextInjectionManager };
