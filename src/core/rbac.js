// RBAC System — Role-Based Access Control for MFM Corporation
// Implements principle of least privilege with role-based permissions

import { logger } from './logger.js';

// Role definitions
export const ROLES = {
  CEO: 'ceo',
  C_LEVEL: 'c_level',
  TEAM_LEAD: 'team_lead',
  AGENT: 'agent',
  SYSTEM: 'system'
};

// Permission definitions
export const PERMISSIONS = {
  TASKS_READ: 'tasks:read',
  TASKS_WRITE: 'tasks:write',
  TASKS_DELETE: 'tasks:delete',
  AGENTS_READ: 'agents:read',
  AGENTS_WRITE: 'agents:write',
  USERS_READ: 'users:read',
  USERS_WRITE: 'users:write',
  AUDIT_READ: 'audit:read',
  SETTINGS_READ: 'settings:read',
  SETTINGS_WRITE: 'settings:write'
};

// Role-permission matrix
const ROLE_PERMISSIONS = {
  [ROLES.CEO]: [
    '*', // Full access
  ],
  [ROLES.C_LEVEL]: [
    PERMISSIONS.TASKS_READ,
    PERMISSIONS.TASKS_WRITE,
    PERMISSIONS.TASKS_DELETE,
    PERMISSIONS.AGENTS_READ,
    PERMISSIONS.AGENTS_WRITE,
    PERMISSIONS.AUDIT_READ,
  ],
  [ROLES.TEAM_LEAD]: [
    PERMISSIONS.TASKS_READ,
    PERMISSIONS.TASKS_WRITE,
    PERMISSIONS.AGENTS_READ,
    PERMISSIONS.AUDIT_READ,
  ],
  [ROLES.AGENT]: [
    PERMISSIONS.TASKS_READ,
  ],
  [ROLES.SYSTEM]: [
    PERMISSIONS.TASKS_READ,
    PERMISSIONS.AGENTS_READ,
    PERMISSIONS.SETTINGS_READ,
  ],
};

class RBACService {
  constructor(db, kv) {
    this.db = db;
    this.kv = kv;
    this.cache = new Map();
    this.cacheTTL = 300000; // 5 minutes
  }

  /**
   * Check if user has permission
   * @param {string} userId - User ID
   * @param {string} permission - Permission to check
   * @param {object} context - Resource context (department, team, etc.)
   * @returns {Promise<boolean>} Permission granted status
   */
  async hasPermission(userId, permission, context = {}) {
    try {
      const role = await this.getUserRole(userId);
      if (!role) {
        logger.warn('rbac', 'no_role', { userId });
        return false;
      }

      const granted = this.checkRolePermission(role, permission, context);
      
      logger.debug('rbac', 'permission_check', { 
        userId, 
        role, 
        permission, 
        granted,
        context 
      });
      
      return granted;
    } catch (err) {
      logger.error('rbac', 'permission_check_failed', { 
        userId, 
        permission, 
        error: err.message 
      });
      return false;
    }
  }

  /**
   * Check if role has permission
   * @param {string} role - User role
   * @param {string} permission - Permission to check
   * @param {object} context - Resource context
   * @returns {boolean} Permission granted status
   */
  checkRolePermission(role, permission, context) {
    const permissions = ROLE_PERMISSIONS[role];
    if (!permissions) return false;

    // Wildcard access
    if (permissions.includes('*')) return true;

    // Direct permission
    if (permissions.includes(permission)) return true;

    // Context-aware checks
    if (context) {
      return this.checkContextPermission(role, permission, context);
    }

    return false;
  }

  /**
   * Check context-aware permissions
   * @param {string} role - User role
   * @param {string} permission - Permission to check
   * @param {object} context - Resource context
   * @returns {boolean} Permission granted status
   */
  checkContextPermission(role, permission, context) {
    const { department, team, resourceDepartment, resourceTeam } = context;

    // C-Level can access their department
    if (role === ROLES.C_LEVEL && permission === PERMISSIONS.AUDIT_READ) {
      if (resourceDepartment && department === resourceDepartment) {
        return true;
      }
    }

    // Team Lead can access their team
    if (role === ROLES.TEAM_LEAD && permission === PERMISSIONS.AUDIT_READ) {
      if (resourceTeam && team === resourceTeam) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get user role
   * @param {string} userId - User ID
   * @returns {Promise<string|null>} User role
   */
  async getUserRole(userId) {
    try {
      // Check cache first
      const cacheKey = `rbac:role:${userId}`;
      const cached = this.cache.get(cacheKey);
      if (cached) {
        const { role, timestamp } = cached;
        if (Date.now() - timestamp < this.cacheTTL) {
          return role;
        }
        this.cache.delete(cacheKey);
      }

      // Query database
      const result = await this.db.prepare(`
        SELECT role FROM user_roles WHERE user_id = ?
      `).bind(userId).first();

      if (result) {
        // Cache the result
        this.cache.set(cacheKey, {
          role: result.role,
          timestamp: Date.now()
        });
        return result.role;
      }

      return null;
    } catch (err) {
      logger.error('rbac', 'get_role_failed', { userId, error: err.message });
      return null;
    }
  }

  /**
   * Assign role to user
   * @param {string} userId - User ID
   * @param {string} role - Role to assign
   * @param {string} assignedBy - User ID of assigner
   * @returns {Promise<boolean>} Success status
   */
  async assignRole(userId, role, assignedBy) {
    try {
      // Validate role
      if (!Object.values(ROLES).includes(role)) {
        logger.warn('rbac', 'invalid_role', { role });
        return false;
      }

      // Check if assigner has permission (must be CEO)
      const assignerRole = await this.getUserRole(assignedBy);
      if (assignerRole !== ROLES.CEO) {
        logger.warn('rbac', 'unauthorized_assignment', { 
          assignedBy, 
          assignerRole 
        });
        return false;
      }

      // Insert or update role
      await this.db.prepare(`
        INSERT INTO user_roles (user_id, role, assigned_by, assigned_at)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET
          role = excluded.role,
          assigned_by = excluded.assigned_by,
          assigned_at = excluded.assigned_at
      `).bind(userId, role, assignedBy, Date.now()).run();

      // Clear cache
      const cacheKey = `rbac:role:${userId}`;
      this.cache.delete(cacheKey);

      logger.info('rbac', 'role_assigned', { userId, role, assignedBy });
      return true;
    } catch (err) {
      logger.error('rbac', 'assign_role_failed', { 
        userId, 
        role, 
        error: err.message 
      });
      return false;
    }
  }

  /**
   * Get all permissions for a role
   * @param {string} role - Role
   * @returns {Array<string>} Permissions
   */
  getRolePermissions(role) {
    return ROLE_PERMISSIONS[role] || [];
  }

  /**
   * Check if user has any of the specified permissions
   * @param {string} userId - User ID
   * @param {Array<string>} permissions - Permissions to check
   * @param {object} context - Resource context
   * @returns {Promise<boolean>} Has any permission
   */
  async hasAnyPermission(userId, permissions, context = {}) {
    for (const permission of permissions) {
      if (await this.hasPermission(userId, permission, context)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if user has all specified permissions
   * @param {string} userId - User ID
   * @param {Array<string>} permissions - Permissions to check
   * @param {object} context - Resource context
   * @returns {Promise<boolean>} Has all permissions
   */
  async hasAllPermissions(userId, permissions, context = {}) {
    for (const permission of permissions) {
      if (!await this.hasPermission(userId, permission, context)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Clear role cache
   * @param {string} userId - User ID (optional, clears all if not provided)
   */
  clearCache(userId = null) {
    if (userId) {
      this.cache.delete(`rbac:role:${userId}`);
    } else {
      this.cache.clear();
    }
    logger.info('rbac', 'cache_cleared', { userId });
  }
}

export { RBACService };
