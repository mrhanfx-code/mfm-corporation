// Memory Slots — Dedicated memory slots for specific contexts

import { logger } from './logger.js';
import { saveMemory, getMemory } from '../tools/d1-store.js';

class MemorySlotsManager {
  constructor(env) {
    this.env = env;
    this.slots = new Map();
    this.slotDefinitions = new Map();
  }

  defineSlot(slotId, config) {
    const slotConfig = {
      id: slotId,
      name: config.name || slotId,
      description: config.description || '',
      maxSize: config.maxSize || 10000, // characters
      maxItems: config.maxItems || 100,
      retention: config.retention || '7d',
      priority: config.priority || 'medium',
      autoConsolidate: config.autoConsolidate || false,
      createdAt: new Date().toISOString()
    };
    
    this.slotDefinitions.set(slotId, slotConfig);
    this.slots.set(slotId, []);
    
    logger.info(`Memory Slots: Defined slot ${slotId}`, {
      name: slotConfig.name,
      maxSize: slotConfig.maxSize,
      maxItems: slotConfig.maxItems
    });
    
    return slotConfig;
  }

  async addToSlot(slotId, item, metadata = {}) {
    const slotConfig = this.slotDefinitions.get(slotId);
    if (!slotConfig) {
      throw new Error(`Slot not defined: ${slotId}`);
    }
    
    const slot = this.slots.get(slotId);
    
    // Check size limit
    const itemSize = JSON.stringify(item).length;
    if (itemSize > slotConfig.maxSize) {
      throw new Error(`Item too large for slot ${slotId}: ${itemSize} > ${slotConfig.maxSize}`);
    }
    
    // Check item limit
    if (slot.length >= slotConfig.maxItems) {
      // Remove oldest item
      slot.shift();
      logger.warn(`Memory Slots: Slot ${slotId} at capacity, removed oldest item`);
    }
    
    const slotItem = {
      id: `item:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`,
      content: item,
      metadata,
      addedAt: new Date().toISOString(),
      size: itemSize
    };
    
    slot.push(slotItem);
    
    // Auto-consolidate if enabled
    if (slotConfig.autoConsolidate && slot.length >= slotConfig.maxItems * 0.8) {
      await this.consolidateSlot(slotId);
    }
    
    // Save to memory
    await this.saveSlot(slotId);
    
    logger.debug(`Memory Slots: Added item to ${slotId}`, {
      itemId: slotItem.id,
      slotSize: slot.length
    });
    
    return slotItem;
  }

  async getFromSlot(slotId, options = {}) {
    const slotConfig = this.slotDefinitions.get(slotId);
    if (!slotConfig) {
      throw new Error(`Slot not defined: ${slotId}`);
    }
    
    const slot = this.slots.get(slotId);
    
    let items = slot;
    
    // Filter by metadata if provided
    if (options.metadata) {
      items = items.filter(item => {
        for (const [key, value] of Object.entries(options.metadata)) {
          if (item.metadata[key] !== value) return false;
        }
        return true;
      });
    }
    
    // Limit results
    if (options.limit) {
      items = items.slice(-options.limit);
    }
    
    // Sort by date
    if (options.sort === 'oldest') {
      items = [...items].reverse();
    }
    
    return items;
  }

  async removeFromSlot(slotId, itemId) {
    const slot = this.slots.get(slotId);
    if (!slot) {
      throw new Error(`Slot not found: ${slotId}`);
    }
    
    const index = slot.findIndex(item => item.id === itemId);
    if (index === -1) {
      throw new Error(`Item not found in slot: ${itemId}`);
    }
    
    slot.splice(index, 1);
    
    await this.saveSlot(slotId);
    
    logger.debug(`Memory Slots: Removed item ${itemId} from ${slotId}`);
    
    return true;
  }

  async clearSlot(slotId) {
    const slotConfig = this.slotDefinitions.get(slotId);
    if (!slotConfig) {
      throw new Error(`Slot not defined: ${slotId}`);
    }
    
    this.slots.set(slotId, []);
    
    await this.saveSlot(slotId);
    
    logger.info(`Memory Slots: Cleared slot ${slotId}`);
    
    return true;
  }

  async consolidateSlot(slotId) {
    const slot = this.slots.get(slotId);
    if (!slot) {
      throw new Error(`Slot not found: ${slotId}`);
    }
    
    const slotConfig = this.slotDefinitions.get(slotId);
    
    // Extract key insights
    const insights = this.extractInsights(slot);
    
    // Generate summary
    const summary = this.generateSummary(slot);
    
    // Replace with consolidated version
    const consolidated = {
      type: 'consolidated',
      insights,
      summary,
      consolidatedAt: new Date().toISOString(),
      originalCount: slot.length
    };
    
    this.slots.set(slotId, [consolidated]);
    
    await this.saveSlot(slotId);
    
    logger.info(`Memory Slots: Consolidated slot ${slotId}`, {
      originalCount: slot.length,
      insights: insights.length
    });
    
    return consolidated;
  }

  extractInsights(slot) {
    const insights = [];
    const insightKeywords = ['important', 'critical', 'key', 'essential', 'decision', 'conclusion'];
    
    for (const item of slot) {
      const content = JSON.stringify(item.content).toLowerCase();
      
      for (const keyword of insightKeywords) {
        if (content.includes(keyword)) {
          insights.push({
            content: JSON.stringify(item.content).substring(0, 200),
            keyword,
            timestamp: item.addedAt
          });
          break;
        }
      }
    }
    
    return insights.slice(0, 10);
  }

  generateSummary(slot) {
    return {
      totalItems: slot.length,
      totalSize: slot.reduce((sum, item) => sum + item.size, 0),
      dateRange: {
        earliest: slot[0]?.addedAt,
        latest: slot[slot.length - 1]?.addedAt
      },
      metadataSummary: this.summarizeMetadata(slot)
    };
  }

  summarizeMetadata(slot) {
    const summary = {};
    
    for (const item of slot) {
      for (const [key, value] of Object.entries(item.metadata)) {
        if (!summary[key]) {
          summary[key] = new Set();
        }
        summary[key].add(value);
      }
    }
    
    // Convert Sets to arrays
    for (const key in summary) {
      summary[key] = Array.from(summary[key]);
    }
    
    return summary;
  }

  async saveSlot(slotId) {
    try {
      const slot = this.slots.get(slotId);
      const memoryKey = `memory_slot:${slotId}`;
      await saveMemory(this.env, memoryKey, slot);
    } catch (error) {
      logger.error(`Memory Slots: Failed to save slot`, {
        error: error.message
      });
    }
  }

  async loadSlot(slotId) {
    try {
      const memoryKey = `memory_slot:${slotId}`;
      const data = await getMemory(this.env, memoryKey, 1);
      
      if (data && data.length > 0) {
        this.slots.set(slotId, data[0]);
        logger.info(`Memory Slots: Loaded slot ${slotId}`);
      }
    } catch (error) {
      logger.error(`Memory Slots: Failed to load slot`, {
        error: error.message
      });
    }
  }

  getSlotInfo(slotId) {
    const slotConfig = this.slotDefinitions.get(slotId);
    const slot = this.slots.get(slotId);
    
    if (!slotConfig) return null;
    
    return {
      id: slotId,
      name: slotConfig.name,
      description: slotConfig.description,
      itemCount: slot.length,
      totalSize: slot.reduce((sum, item) => sum + item.size, 0),
      capacity: {
        items: slot.length / slotConfig.maxItems,
        size: slot.reduce((sum, item) => sum + item.size, 0) / slotConfig.maxSize
      },
      retention: slotConfig.retention,
      priority: slotConfig.priority
    };
  }

  getAllSlots() {
    const slots = [];
    
    for (const [slotId, config] of this.slotDefinitions) {
      slots.push(this.getSlotInfo(slotId));
    }
    
    return slots;
  }

  getSlotStatistics() {
    const slots = this.getAllSlots();
    
    const stats = {
      totalSlots: slots.length,
      totalItems: slots.reduce((sum, s) => sum + s.itemCount, 0),
      totalSize: slots.reduce((sum, s) => sum + s.totalSize, 0),
      byPriority: {},
      averageCapacity: 0
    };
    
    for (const slot of slots) {
      stats.byPriority[slot.priority] = (stats.byPriority[slot.priority] || 0) + 1;
    }
    
    if (slots.length > 0) {
      stats.averageCapacity = slots.reduce((sum, s) => sum + s.capacity.items, 0) / slots.length;
    }
    
    return stats;
  }

  async cleanupExpiredSlots() {
    const now = new Date();
    
    for (const [slotId, config] of this.slotDefinitions) {
      const slot = this.slots.get(slotId);
      if (!slot) continue;
      
      const retentionMs = this.parseRetention(config.retention);
      
      // Filter out expired items
      const filtered = slot.filter(item => {
        const age = now - new Date(item.addedAt);
        return age < retentionMs;
      });
      
      if (filtered.length < slot.length) {
        logger.info(`Memory Slots: Cleaned up ${slot.length - filtered.length} expired items from ${slotId}`);
        this.slots.set(slotId, filtered);
        await this.saveSlot(slotId);
      }
    }
  }

  parseRetention(retention) {
    const match = retention.match(/(\d+)([dhm])/);
    if (!match) return 7 * 24 * 60 * 60 * 1000; // Default to 7 days
    
    const value = parseInt(match[1]);
    const unit = match[2];
    
    const multipliers = {
      d: 24 * 60 * 60 * 1000,
      h: 60 * 60 * 1000,
      m: 60 * 1000
    };
    
    return value * (multipliers[unit] || multipliers.d);
  }
}

export { MemorySlotsManager };
