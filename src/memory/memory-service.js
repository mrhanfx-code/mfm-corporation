// Memory Service — simple keyword-based memory system
// Stores and retrieves contextual information for agents

import { logger } from '../core/logger.js';

/**
 * Store a memory entry.
 */
export async function storeMemory(env, content, keywords, agent, pinned = false) {
  if (!env.db) return null;
  
  try {
    const id = crypto.randomUUID();
    const keywordString = Array.isArray(keywords) ? keywords.join(',') : keywords;
    
    await env.db.prepare(`
      INSERT INTO memory (id, content, keywords, agent, pinned, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      content,
      keywordString,
      agent || 'general',
      pinned ? 1 : 0,
      Date.now()
    ).run();
    
    logger.info('memory-service', 'stored', { id, agent, pinned });
    return id;
  } catch (err) {
    logger.error('memory-service', 'store_failed', { error: err.message });
    return null;
  }
}

/**
 * Search memory by keywords.
 */
export async function searchMemory(env, query, limit = 10) {
  if (!env.db) return [];
  
  try {
    const keywords = query.toLowerCase().split(/\s+/).filter(k => k.length > 2);
    
    if (keywords.length === 0) return [];
    
    // Build LIKE query for each keyword
    const conditions = keywords.map(() => 'keywords LIKE ?').join(' OR ');
    const params = keywords.map(k => `%${k}%`);
    
    const result = await env.db.prepare(`
      SELECT id, content, keywords, agent, pinned, created_at
      FROM memory
      WHERE ${conditions}
      ORDER BY pinned DESC, created_at DESC
      LIMIT ?
    `).bind(...params, limit).all();
    
    return result.results || [];
  } catch (err) {
    logger.error('memory-service', 'search_failed', { error: err.message });
    return [];
  }
}

/**
 * Get recent memories for an agent.
 */
export async function getRecentMemories(env, agent, limit = 20) {
  if (!env.db) return [];
  
  try {
    const result = await env.db.prepare(`
      SELECT id, content, keywords, pinned, created_at
      FROM memory
      WHERE agent = ? OR agent = 'general'
      ORDER BY pinned DESC, created_at DESC
      LIMIT ?
    `).bind(agent || 'general', limit).all();
    
    return result.results || [];
  } catch (err) {
    logger.error('memory-service', 'recent_failed', { error: err.message });
    return [];
  }
}

/**
 * Pin a memory entry (mark as important).
 */
export async function pinMemory(env, memoryId) {
  if (!env.db) return false;
  
  try {
    await env.db.prepare(`
      UPDATE memory SET pinned = 1 WHERE id = ?
    `).bind(memoryId).run();
    
    logger.info('memory-service', 'pinned', { id: memoryId });
    return true;
  } catch (err) {
    logger.error('memory-service', 'pin_failed', { error: err.message });
    return false;
  }
}

/**
 * Unpin a memory entry.
 */
export async function unpinMemory(env, memoryId) {
  if (!env.db) return false;
  
  try {
    await env.db.prepare(`
      UPDATE memory SET pinned = 0 WHERE id = ?
    `).bind(memoryId).run();
    
    logger.info('memory-service', 'unpinned', { id: memoryId });
    return true;
  } catch (err) {
    logger.error('memory-service', 'unpin_failed', { error: err.message });
    return false;
  }
}

/**
 * Delete old memories (cleanup).
 */
export async function cleanupOldMemories(env, daysToKeep = 30) {
  if (!env.db) return 0;
  
  try {
    const cutoff = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
    
    const result = await env.db.prepare(`
      DELETE FROM memory
      WHERE pinned = 0 AND created_at < ?
    `).bind(cutoff).run();
    
    logger.info('memory-service', 'cleanup', { deleted: result.meta.changes });
    return result.meta.changes || 0;
  } catch (err) {
    logger.error('memory-service', 'cleanup_failed', { error: err.message });
    return 0;
  }
}

/**
 * Extract keywords from content.
 */
export function extractKeywords(content) {
  if (!content || typeof content !== 'string') return [];
  
  // Simple keyword extraction: words > 3 chars, lowercase
  const words = content
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3);
  
  // Remove common stop words
  const stopWords = new Set(['this', 'that', 'with', 'from', 'have', 'been', 'will', 'would', 'could', 'should', 'about', 'which', 'their', 'there', 'where', 'when', 'what', 'how', 'just', 'like', 'more', 'some', 'such', 'only', 'very', 'into', 'over', 'also']);
  
  return words.filter(w => !stopWords.has(w)).slice(0, 10);
}
