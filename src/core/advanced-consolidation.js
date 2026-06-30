// Advanced Memory Consolidation — Automatic compression with pattern consolidation

import { logger } from './logger.js';

class AdvancedConsolidationManager {
  constructor(env) {
    this.env = env;
    this.memoryItems = new Map();
    this.patterns = new Map();
    this.compressionStats = {
      originalSize: 0,
      compressedSize: 0,
      compressionRatio: 0,
      itemsCompressed: 0,
      patternsFound: 0
    };
  }

  /**
   * Add memory item
   * @param {string} id - Item ID
   * @param {object} content - Item content
   * @param {object} metadata - Item metadata
   * @returns {object} Memory item
   */
  addMemoryItem(id, content, metadata = {}) {
    const item = {
      id,
      content,
      metadata: {
        ...metadata,
        createdAt: new Date().toISOString(),
        accessCount: 0,
        lastAccessed: new Date().toISOString(),
        decayScore: 1.0
      },
      size: JSON.stringify(content).length
    };
    
    this.memoryItems.set(id, item);
    this.compressionStats.originalSize += item.size;
    
    logger.debug(`Advanced Consolidation: Added memory item ${id}`, {
      size: item.size
    });
    
    return item;
  }

  /**
   * Apply lesson decay to memory items
   * @param {number} decayRate - Decay rate (0-1)
   * @param {number} threshold - Threshold for removal
   * @returns {Array} Removed item IDs
   */
  applyLessonDecay(decayRate = 0.1, threshold = 0.2) {
    const removed = [];
    const now = new Date();
    
    for (const [id, item] of this.memoryItems) {
      const age = (now - new Date(item.metadata.createdAt)) / (1000 * 60 * 60 * 24); // days
      
      // Calculate decay based on age and access frequency
      const accessFactor = 1 / (item.metadata.accessCount + 1);
      const ageFactor = Math.min(age / 30, 1); // Max decay at 30 days
      const decay = decayRate * accessFactor * ageFactor;
      
      item.metadata.decayScore = Math.max(0, item.metadata.decayScore - decay);
      
      // Remove if below threshold
      if (item.metadata.decayScore < threshold) {
        removed.push(id);
        this.memoryItems.delete(id);
        this.compressionStats.originalSize -= item.size;
      }
    }
    
    logger.info(`Advanced Consolidation: Applied lesson decay`, {
      removed: removed.length,
      remaining: this.memoryItems.size
    });
    
    return removed;
  }

  /**
   * Find patterns in memory items
   * @returns {Array} Found patterns
   */
  findPatterns() {
    const patterns = [];
    const contentMap = new Map();
    
    // Group similar content
    for (const [id, item] of this.memoryItems) {
      const contentStr = JSON.stringify(item.content);
      const signature = this.generateSignature(contentStr);
      
      if (!contentMap.has(signature)) {
        contentMap.set(signature, []);
      }
      contentMap.get(signature).push({ id, item, contentStr });
    }
    
    // Find patterns (groups with 3+ similar items)
    for (const [signature, items] of contentMap) {
      if (items.length >= 3) {
        const pattern = {
          id: `pattern-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          signature,
          items: items.map(i => i.id),
          count: items.length,
          sampleContent: items[0].content,
          createdAt: new Date().toISOString()
        };
        
        patterns.push(pattern);
        this.patterns.set(pattern.id, pattern);
      }
    }
    
    this.compressionStats.patternsFound = patterns.length;
    
    logger.info(`Advanced Consolidation: Found patterns`, {
      patterns: patterns.length
    });
    
    return patterns;
  }

  /**
   * Generate signature for content
   * @param {string} content - Content string
   * @returns {string} Signature
   */
  generateSignature(content) {
    // Simple signature based on word frequency
    const words = content.toLowerCase().split(/\s+/);
    const wordCount = {};
    
    for (const word of words) {
      if (word.length > 3) {
        wordCount[word] = (wordCount[word] || 0) + 1;
      }
    }
    
    // Sort by frequency and take top 10
    const sorted = Object.entries(wordCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
    
    return sorted.join(':');
  }

  /**
   * Consolidate patterns
   * @returns {object} Consolidation results
   */
  consolidatePatterns() {
    const patterns = this.findPatterns();
    const consolidated = {
      patterns: [],
      itemsRemoved: 0,
      spaceSaved: 0
    };
    
    for (const pattern of patterns) {
      // Keep one representative item, remove others
      const items = pattern.items;
      const representative = items[0];
      const toRemove = items.slice(1);
      
      // Calculate space saved
      for (const itemId of toRemove) {
        const item = this.memoryItems.get(itemId);
        if (item) {
          consolidated.spaceSaved += item.size;
          this.memoryItems.delete(itemId);
          this.compressionStats.originalSize -= item.size;
          consolidated.itemsRemoved++;
        }
      }
      
      // Update representative item metadata
      const repItem = this.memoryItems.get(representative);
      if (repItem) {
        repItem.metadata.patternId = pattern.id;
        repItem.metadata.patternCount = pattern.count;
      }
      
      consolidated.patterns.push(pattern);
    }
    
    this.compressionStats.itemsCompressed += consolidated.itemsRemoved;
    
    logger.info(`Advanced Consolidation: Consolidated patterns`, {
      patterns: consolidated.patterns.length,
      itemsRemoved: consolidated.itemsRemoved,
      spaceSaved: consolidated.spaceSaved
    });
    
    return consolidated;
  }

  /**
   * Optimize storage by compressing content
   * @returns {object} Optimization results
   */
  optimizeStorage() {
    const optimized = {
      itemsCompressed: 0,
      originalSize: 0,
      compressedSize: 0
    };
    
    for (const [id, item] of this.memoryItems) {
      const originalContent = JSON.stringify(item.content);
      optimized.originalSize += originalContent.length;
      
      // Simple compression: remove whitespace and redundant data
      const compressed = this.compressContent(item.content);
      const compressedStr = JSON.stringify(compressed);
      optimized.compressedSize += compressedStr.length;
      
      if (compressedStr.length < originalContent.length) {
        item.content = compressed;
        item.size = compressedStr.length;
        item.metadata.compressed = true;
        optimized.itemsCompressed++;
      }
    }
    
    this.compressionStats.compressedSize = optimized.compressedSize;
    this.compressionStats.compressionRatio = optimized.originalSize > 0 
      ? (1 - optimized.compressedSize / optimized.originalSize) * 100 
      : 0;
    
    logger.info(`Advanced Consolidation: Optimized storage`, {
      itemsCompressed: optimized.itemsCompressed,
      compressionRatio: this.compressionStats.compressionRatio.toFixed(2) + '%'
    });
    
    return optimized;
  }

  /**
   * Compress content
   * @param {object} content - Content to compress
   * @returns {object} Compressed content
   */
  compressContent(content) {
    if (typeof content === 'string') {
      return content.trim().replace(/\s+/g, ' ');
    }
    
    if (Array.isArray(content)) {
      return content.map(item => this.compressContent(item));
    }
    
    if (typeof content === 'object' && content !== null) {
      const compressed = {};
      for (const [key, value] of Object.entries(content)) {
        compressed[key] = this.compressContent(value);
      }
      return compressed;
    }
    
    return content;
  }

  /**
   * Get memory item
   * @param {string} id - Item ID
   * @returns {object|null} Memory item
   */
  getMemoryItem(id) {
    const item = this.memoryItems.get(id);
    if (item) {
      item.metadata.accessCount++;
      item.metadata.lastAccessed = new Date().toISOString();
    }
    return item || null;
  }

  /**
   * Get all memory items
   * @returns {Array} Memory items
   */
  getAllMemoryItems() {
    return Array.from(this.memoryItems.values());
  }

  /**
   * Get patterns
   * @returns {Array} Patterns
   */
  getPatterns() {
    return Array.from(this.patterns.values());
  }

  /**
   * Get compression statistics
   * @returns {object} Statistics
   */
  getCompressionStats() {
    const currentSize = Array.from(this.memoryItems.values())
      .reduce((sum, item) => sum + item.size, 0);
    
    return {
      ...this.compressionStats,
      currentSize,
      itemCount: this.memoryItems.size,
      patternCount: this.patterns.size,
      storageReduction: this.compressionStats.originalSize > 0
        ? ((1 - currentSize / this.compressionStats.originalSize) * 100).toFixed(2) + '%'
        : '0%'
    };
  }

  /**
   * Run full consolidation
   * @param {object} options - Consolidation options
   * @returns {object} Consolidation results
   */
  runConsolidation(options = {}) {
    const {
      decayRate = 0.1,
      decayThreshold = 0.2,
      compress = true
    } = options;
    
    const results = {
      decayRemoved: 0,
      patternsConsolidated: 0,
      itemsCompressed: 0,
      totalSpaceSaved: 0
    };
    
    // Apply lesson decay
    const removed = this.applyLessonDecay(decayRate, decayThreshold);
    results.decayRemoved = removed.length;
    
    // Consolidate patterns
    const patternResults = this.consolidatePatterns();
    results.patternsConsolidated = patternResults.patterns.length;
    results.totalSpaceSaved += patternResults.spaceSaved;
    
    // Optimize storage
    if (compress) {
      const optimized = this.optimizeStorage();
      results.itemsCompressed = optimized.itemsCompressed;
      results.totalSpaceSaved += (optimized.originalSize - optimized.compressedSize);
    }
    
    logger.info(`Advanced Consolidation: Full consolidation complete`, results);
    
    return results;
  }

  /**
   * Reset all data
   */
  reset() {
    this.memoryItems.clear();
    this.patterns.clear();
    this.compressionStats = {
      originalSize: 0,
      compressedSize: 0,
      compressionRatio: 0,
      itemsCompressed: 0,
      patternsFound: 0
    };
    
    logger.info('Advanced Consolidation: Reset all data');
  }
}

export { AdvancedConsolidationManager };
