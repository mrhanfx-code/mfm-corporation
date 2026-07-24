// Approval Manager - User approval workflow management for social media posts

import { logger } from './logger.js';

const APPROVAL_TIMEOUT_MS = 24 * 60 * 60 * 1000; // 24 hours default
const APPROVAL_STATUSES = ['pending', 'approved', 'rejected', 'expired'];

/**
 * Create an approval request for a social media post
 * @param {object} postData - Post data (platform, content, media, etc.)
 * @param {string} userId - User ID requesting approval
 * @param {object} env - Cloudflare Workers environment
 * @returns {Promise<object>} - Approval request record
 */
export async function createApprovalRequest(postData, userId, env) {
  const approvalId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + APPROVAL_TIMEOUT_MS).toISOString();
  
  const approvalRecord = {
    id: approvalId,
    user_id: userId,
    platform: postData.platform,
    content: postData.content,
    media_url: postData.mediaUrl || null,
    scheduled_for: postData.scheduledFor || null,
    status: 'pending',
    created_at: new Date().toISOString(),
    expires_at: expiresAt,
    metadata: JSON.stringify(postData.metadata || {})
  };
  
  try {
    await env.db.prepare(`
      INSERT INTO approval_queue (id, user_id, platform, content, media_url, scheduled_for, status, created_at, expires_at, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      approvalRecord.id,
      approvalRecord.user_id,
      approvalRecord.platform,
      approvalRecord.content,
      approvalRecord.media_url,
      approvalRecord.scheduled_for,
      approvalRecord.status,
      approvalRecord.created_at,
      approvalRecord.expires_at,
      approvalRecord.metadata
    ).run();
    
    logger.info('approval-manager', 'request_created', { approvalId, userId, platform: postData.platform });
    
    return approvalRecord;
  } catch (error) {
    logger.error('approval-manager', 'request_creation_failed', { error: error.message });
    throw new Error(`Failed to create approval request: ${error.message}`);
  }
}

/**
 * Get approval request by ID
 * @param {string} approvalId - Approval request ID
 * @param {object} env - Cloudflare Workers environment
 * @returns {Promise<object|null>} - Approval request or null
 */
export async function getApprovalRequest(approvalId, env) {
  try {
    const result = await env.db.prepare(`
      SELECT * FROM approval_queue WHERE id = ?
    `).bind(approvalId).first();
    
    if (result) {
      result.metadata = JSON.parse(result.metadata || '{}');
    }
    
    return result;
  } catch (error) {
    logger.error('approval-manager', 'get_request_failed', { approvalId, error: error.message });
    throw new Error(`Failed to get approval request: ${error.message}`);
  }
}

/**
 * List pending approval requests for a user
 * @param {string} userId - User ID
 * @param {object} env - Cloudflare Workers environment
 * @returns {Promise<Array>} - List of pending approval requests
 */
export async function listPendingApprovals(userId, env) {
  try {
    const results = await env.db.prepare(`
      SELECT * FROM approval_queue 
      WHERE user_id = ? AND status = 'pending' 
      ORDER BY created_at DESC
    `).bind(userId).all();
    
    return results.results || [];
  } catch (error) {
    logger.error('approval-manager', 'list_pending_failed', { userId, error: error.message });
    throw new Error(`Failed to list pending approvals: ${error.message}`);
  }
}

/**
 * Approve an approval request
 * @param {string} approvalId - Approval request ID
 * @param {string} userId - User ID approving
 * @param {object} env - Cloudflare Workers environment
 * @returns {Promise<object>} - Updated approval request
 */
export async function approveRequest(approvalId, userId, env) {
  try {
    const request = await getApprovalRequest(approvalId, env);
    
    if (!request) {
      throw new Error('Approval request not found');
    }
    
    if (request.status !== 'pending') {
      throw new Error(`Cannot approve request with status: ${request.status}`);
    }
    
    if (request.user_id !== userId) {
      throw new Error('Unauthorized: You can only approve your own requests');
    }
    
    const now = new Date();
    if (new Date(request.expires_at) < now) {
      // Mark as expired instead of approving
      await env.db.prepare(`
        UPDATE approval_queue SET status = 'expired' WHERE id = ?
      `).bind(approvalId).run();
      
      throw new Error('Approval request has expired');
    }
    
    await env.db.prepare(`
      UPDATE approval_queue 
      SET status = 'approved', approved_at = ? 
      WHERE id = ?
    `).bind(now.toISOString(), approvalId).run();
    
    logger.info('approval-manager', 'request_approved', { approvalId, userId });
    
    return await getApprovalRequest(approvalId, env);
  } catch (error) {
    logger.error('approval-manager', 'approve_failed', { approvalId, userId, error: error.message });
    throw error;
  }
}

/**
 * Reject an approval request
 * @param {string} approvalId - Approval request ID
 * @param {string} userId - User ID rejecting
 * @param {string} reason - Rejection reason
 * @param {object} env - Cloudflare Workers environment
 * @returns {Promise<object>} - Updated approval request
 */
export async function rejectRequest(approvalId, userId, reason, env) {
  try {
    const request = await getApprovalRequest(approvalId, env);
    
    if (!request) {
      throw new Error('Approval request not found');
    }
    
    if (request.status !== 'pending') {
      throw new Error(`Cannot reject request with status: ${request.status}`);
    }
    
    if (request.user_id !== userId) {
      throw new Error('Unauthorized: You can only reject your own requests');
    }
    
    await env.db.prepare(`
      UPDATE approval_queue 
      SET status = 'rejected', rejected_at = ?, rejection_reason = ? 
      WHERE id = ?
    `).bind(new Date().toISOString(), reason, approvalId).run();
    
    logger.info('approval-manager', 'request_rejected', { approvalId, userId, reason });
    
    return await getApprovalRequest(approvalId, env);
  } catch (error) {
    logger.error('approval-manager', 'reject_failed', { approvalId, userId, error: error.message });
    throw error;
  }
}

/**
 * Check and expire overdue approval requests
 * @param {object} env - Cloudflare Workers environment
 * @returns {Promise<number>} - Number of expired requests
 */
export async function expireOverdueRequests(env) {
  try {
    const now = new Date().toISOString();
    
    const result = await env.db.prepare(`
      UPDATE approval_queue 
      SET status = 'expired' 
      WHERE status = 'pending' AND expires_at < ?
    `).bind(now).run();
    
    const expiredCount = result.meta.changes || 0;
    
    if (expiredCount > 0) {
      logger.info('approval-manager', 'expired_requests', { count: expiredCount });
    }
    
    return expiredCount;
  } catch (error) {
    logger.error('approval-manager', 'expire_failed', { error: error.message });
    return 0;
  }
}

/**
 * Get approval statistics for a user
 * @param {string} userId - User ID
 * @param {object} env - Cloudflare Workers environment
 * @returns {Promise<object>} - Approval statistics
 */
export async function getApprovalStats(userId, env) {
  try {
    const stats = await env.db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END) as expired
      FROM approval_queue 
      WHERE user_id = ?
    `).bind(userId).first();
    
    return stats || { total: 0, pending: 0, approved: 0, rejected: 0, expired: 0 };
  } catch (error) {
    logger.error('approval-manager', 'stats_failed', { userId, error: error.message });
    return { total: 0, pending: 0, approved: 0, rejected: 0, expired: 0 };
  }
}
