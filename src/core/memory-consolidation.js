// Memory Consolidation — Automatic memory compression and organization

import { logger } from './logger.js';
import { saveMemory, getMemory } from '../tools/d1-store.js';

class MemoryConsolidationManager {
  constructor(env) {
    this.env = env;
    this.consolidationHistory = new Map();
    this.consolidationSchedule = new Map();
  }

  async consolidateSession(sessionId, observations) {
    const consolidationId = `consolidation:${sessionId}:${Date.now()}`;
    
    logger.info(`Memory Consolidation: Consolidating session ${sessionId}`, {
      observations: observations.length
    });
    
    const consolidation = {
      id: consolidationId,
      sessionId,
      originalObservations: observations.length,
      consolidatedAt: new Date().toISOString(),
      keyInsights: [],
      patterns: [],
      summary: '',
      compressed: false,
      compressionRatio: 0
    };
    
    // Extract key insights
    consolidation.keyInsights = this.extractKeyInsights(observations);
    
    // Identify patterns
    consolidation.patterns = this.identifyPatterns(observations);
    
    // Generate summary
    consolidation.summary = this.generateSummary(observations, consolidation.keyInsights, consolidation.patterns);
    
    // Calculate compression ratio
    const originalSize = JSON.stringify(observations).length;
    const compressedSize = JSON.stringify(consolidation).length;
    consolidation.compressionRatio = (originalSize - compressedSize) / originalSize;
    consolidation.compressed = consolidation.compressionRatio > 0.3;
    
    // Save consolidation
    this.consolidationHistory.set(consolidationId, consolidation);
    await this.saveConsolidation(consolidationId, consolidation);
    
    // Replace original observations with consolidated version
    await this.replaceSessionMemory(sessionId, consolidation);
    
    logger.info(`Memory Consolidation: Consolidation complete ${consolidationId}`, {
      compressionRatio: `${(consolidation.compressionRatio * 100).toFixed(1)}%`,
      keyInsights: consolidation.keyInsights.length,
      patterns: consolidation.patterns.length
    });
    
    return consolidation;
  }

  extractKeyInsights(observations) {
    const insights = [];
    const insightKeywords = ['important', 'critical', 'key', 'essential', 'must', 'should', 'recommend', 'suggestion', 'decision', 'conclusion'];
    
    for (const obs of observations) {
      const content = obs.content || obs.message || '';
      const lowerContent = content.toLowerCase();
      
      for (const keyword of insightKeywords) {
        if (lowerContent.includes(keyword)) {
          insights.push({
            content: content.substring(0, 200),
            keyword,
            timestamp: obs.timestamp || new Date().toISOString(),
            relevance: this.calculateRelevance(content, keyword)
          });
          break;
        }
      }
    }
    
    // Remove duplicates and sort by relevance
    const uniqueInsights = this.removeDuplicates(insights, 'content');
    return uniqueInsights.sort((a, b) => b.relevance - a.relevance).slice(0, 10);
  }

  calculateRelevance(content, keyword) {
    const lowerContent = content.toLowerCase();
    const keywordCount = (lowerContent.match(new RegExp(keyword, 'g')) || []).length;
    const position = lowerContent.indexOf(keyword);
    
    // Higher relevance if keyword appears early and multiple times
    return (keywordCount * 0.5) + (1 - (position / content.length) * 0.5);
  }

  identifyPatterns(observations) {
    const patterns = [];
    const patternTypes = {
      error: ['error', 'failed', 'exception', 'bug', 'issue'],
      success: ['success', 'completed', 'finished', 'done', 'resolved'],
      request: ['request', 'ask', 'need', 'want', 'require'],
      decision: ['decided', 'chose', 'selected', 'approved', 'rejected'],
      action: ['did', 'executed', 'performed', 'ran', 'started']
    };
    
    for (const [type, keywords] of Object.entries(patternTypes)) {
      let count = 0;
      const examples = [];
      
      for (const obs of observations) {
        const content = obs.content || obs.message || '';
        const lowerContent = content.toLowerCase();
        
        for (const keyword of keywords) {
          if (lowerContent.includes(keyword)) {
            count++;
            if (examples.length < 3) {
              examples.push(content.substring(0, 100));
            }
            break;
          }
        }
      }
      
      if (count > 0) {
        patterns.push({
          type,
          count,
          frequency: count / observations.length,
          examples
        });
      }
    }
    
    return patterns.sort((a, b) => b.frequency - a.frequency);
  }

  generateSummary(observations, keyInsights, patterns) {
    const summaryParts = [];
    
    // Session overview
    summaryParts.push(`Session with ${observations.length} observations.`);
    
    // Key insights
    if (keyInsights.length > 0) {
      summaryParts.push(`Key insights: ${keyInsights.length} critical points identified.`);
    }
    
    // Patterns
    if (patterns.length > 0) {
      const topPatterns = patterns.slice(0, 3).map(p => p.type).join(', ');
      summaryParts.push(`Dominant patterns: ${topPatterns}.`);
    }
    
    // Time range
    if (observations.length > 0) {
      const firstObs = observations[0];
      const lastObs = observations[observations.length - 1];
      const duration = this.calculateDuration(firstObs.timestamp, lastObs.timestamp);
      summaryParts.push(`Duration: ${duration}.`);
    }
    
    return summaryParts.join(' ');
  }

  calculateDuration(start, end) {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diff = endDate - startDate;
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} day(s)`;
    if (hours > 0) return `${hours} hour(s)`;
    if (minutes > 0) return `${minutes} minute(s)`;
    return '< 1 minute';
  }

  removeDuplicates(items, key) {
    const seen = new Set();
    return items.filter(item => {
      const value = item[key];
      if (seen.has(value)) return false;
      seen.add(value);
      return true;
    });
  }

  async replaceSessionMemory(sessionId, consolidation) {
    try {
      const memoryKey = `memory:${sessionId}`;
      await saveMemory(this.env, memoryKey, {
        type: 'consolidated',
        consolidationId: consolidation.id,
        keyInsights: consolidation.keyInsights,
        patterns: consolidation.patterns,
        summary: consolidation.summary,
        consolidatedAt: consolidation.consolidatedAt
      });
    } catch (error) {
      logger.error(`Memory Consolidation: Failed to replace session memory`, {
        error: error.message
      });
    }
  }

  async scheduleConsolidation(sessionId, delayMinutes = 60) {
    const scheduleTime = new Date(Date.now() + delayMinutes * 60 * 1000);
    
    this.consolidationSchedule.set(sessionId, {
      sessionId,
      scheduledFor: scheduleTime.toISOString(),
      status: 'scheduled'
    });
    
    logger.info(`Memory Consolidation: Scheduled consolidation for ${sessionId}`, {
      scheduledFor: scheduleTime.toISOString()
    });
  }

  async processScheduledConsolidations() {
    const now = new Date();
    const toProcess = [];
    
    for (const [sessionId, schedule] of this.consolidationSchedule) {
      if (schedule.status === 'scheduled' && new Date(schedule.scheduledFor) <= now) {
        toProcess.push(sessionId);
      }
    }
    
    for (const sessionId of toProcess) {
      try {
        const observations = await getMemory(this.env, sessionId, 100);
        await this.consolidateSession(sessionId, observations);
        
        const schedule = this.consolidationSchedule.get(sessionId);
        schedule.status = 'completed';
        schedule.completedAt = new Date().toISOString();
      } catch (error) {
        logger.error(`Memory Consolidation: Failed to process scheduled consolidation`, {
          sessionId,
          error: error.message
        });
      }
    }
    
    if (toProcess.length > 0) {
      logger.info(`Memory Consolidation: Processed ${toProcess.length} scheduled consolidations`);
    }
  }

  async saveConsolidation(consolidationId, consolidation) {
    try {
      const memoryKey = `consolidation:${consolidationId}`;
      await saveMemory(this.env, memoryKey, consolidation);
    } catch (error) {
      logger.error(`Memory Consolidation: Failed to save consolidation`, {
        error: error.message
      });
    }
  }

  getConsolidation(consolidationId) {
    return this.consolidationHistory.get(consolidationId) || null;
  }

  getAllConsolidations() {
    return Array.from(this.consolidationHistory.values());
  }

  getConsolidationStatistics() {
    const consolidations = this.getAllConsolidations();
    
    const stats = {
      total: consolidations.length,
      compressed: consolidations.filter(c => c.compressed).length,
      averageCompressionRatio: 0,
      totalObservationsConsolidated: 0,
      averageKeyInsights: 0,
      averagePatterns: 0
    };
    
    if (consolidations.length > 0) {
      stats.averageCompressionRatio = consolidations.reduce((sum, c) => sum + c.compressionRatio, 0) / consolidations.length;
      stats.totalObservationsConsolidated = consolidations.reduce((sum, c) => sum + c.originalObservations, 0);
      stats.averageKeyInsights = consolidations.reduce((sum, c) => sum + c.keyInsights.length, 0) / consolidations.length;
      stats.averagePatterns = consolidations.reduce((sum, c) => sum + c.patterns.length, 0) / consolidations.length;
    }
    
    return stats;
  }

  async clearHistory() {
    this.consolidationHistory.clear();
    this.consolidationSchedule.clear();
    logger.info(`Memory Consolidation: History cleared`);
  }
}

export { MemoryConsolidationManager };
