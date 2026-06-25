// RBAC Service Tests
// Tests role-based access control functionality

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RBACService, ROLES, PERMISSIONS } from '../../src/core/rbac.js';

describe('RBACService', () => {
  let rbac;
  let mockDb;
  let mockKv;

  beforeEach(() => {
    // Mock database
    mockDb = {
      prepare: vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnValue({
          first: vi.fn(),
          run: vi.fn()
        })
      })
    };

    // Mock KV
    mockKv = {};

    rbac = new RBACService(mockDb, mockKv);
  });

  describe('Role Definitions', () => {
    it('should have all required roles defined', () => {
      expect(ROLES.CEO).toBe('ceo');
      expect(ROLES.C_LEVEL).toBe('c_level');
      expect(ROLES.TEAM_LEAD).toBe('team_lead');
      expect(ROLES.AGENT).toBe('agent');
      expect(ROLES.SYSTEM).toBe('system');
    });

    it('should have all required permissions defined', () => {
      expect(PERMISSIONS.TASKS_READ).toBe('tasks:read');
      expect(PERMISSIONS.TASKS_WRITE).toBe('tasks:write');
      expect(PERMISSIONS.TASKS_DELETE).toBe('tasks:delete');
      expect(PERMISSIONS.AGENTS_READ).toBe('agents:read');
      expect(PERMISSIONS.AGENTS_WRITE).toBe('agents:write');
      expect(PERMISSIONS.USERS_READ).toBe('users:read');
      expect(PERMISSIONS.USERS_WRITE).toBe('users:write');
      expect(PERMISSIONS.AUDIT_READ).toBe('audit:read');
      expect(PERMISSIONS.SETTINGS_READ).toBe('settings:read');
      expect(PERMISSIONS.SETTINGS_WRITE).toBe('settings:write');
    });
  });

  describe('Permission Checks', () => {
    it('CEO should have wildcard access', () => {
      const granted = rbac.checkRolePermission(ROLES.CEO, PERMISSIONS.TASKS_READ);
      expect(granted).toBe(true);
    });

    it('C-Level should have task permissions', () => {
      const readGranted = rbac.checkRolePermission(ROLES.C_LEVEL, PERMISSIONS.TASKS_READ);
      const writeGranted = rbac.checkRolePermission(ROLES.C_LEVEL, PERMISSIONS.TASKS_WRITE);
      const deleteGranted = rbac.checkRolePermission(ROLES.C_LEVEL, PERMISSIONS.TASKS_DELETE);
      
      expect(readGranted).toBe(true);
      expect(writeGranted).toBe(true);
      expect(deleteGranted).toBe(true);
    });

    it('C-Level should not have user management permissions', () => {
      const usersRead = rbac.checkRolePermission(ROLES.C_LEVEL, PERMISSIONS.USERS_READ);
      const usersWrite = rbac.checkRolePermission(ROLES.C_LEVEL, PERMISSIONS.USERS_WRITE);
      
      expect(usersRead).toBe(false);
      expect(usersWrite).toBe(false);
    });

    it('Team Lead should have limited task permissions', () => {
      const readGranted = rbac.checkRolePermission(ROLES.TEAM_LEAD, PERMISSIONS.TASKS_READ);
      const writeGranted = rbac.checkRolePermission(ROLES.TEAM_LEAD, PERMISSIONS.TASKS_WRITE);
      const deleteGranted = rbac.checkRolePermission(ROLES.TEAM_LEAD, PERMISSIONS.TASKS_DELETE);
      
      expect(readGranted).toBe(true);
      expect(writeGranted).toBe(true);
      expect(deleteGranted).toBe(false);
    });

    it('Agent should only have read permissions', () => {
      const readGranted = rbac.checkRolePermission(ROLES.AGENT, PERMISSIONS.TASKS_READ);
      const writeGranted = rbac.checkRolePermission(ROLES.AGENT, PERMISSIONS.TASKS_WRITE);
      
      expect(readGranted).toBe(true);
      expect(writeGranted).toBe(false);
    });

    it('System should have read-only access', () => {
      const tasksRead = rbac.checkRolePermission(ROLES.SYSTEM, PERMISSIONS.TASKS_READ);
      const tasksWrite = rbac.checkRolePermission(ROLES.SYSTEM, PERMISSIONS.TASKS_WRITE);
      const settingsRead = rbac.checkRolePermission(ROLES.SYSTEM, PERMISSIONS.SETTINGS_READ);
      const settingsWrite = rbac.checkRolePermission(ROLES.SYSTEM, PERMISSIONS.SETTINGS_WRITE);
      
      expect(tasksRead).toBe(true);
      expect(tasksWrite).toBe(false);
      expect(settingsRead).toBe(true);
      expect(settingsWrite).toBe(false);
    });
  });

  describe('Context-Aware Permissions', () => {
    it('C-Level should access audit logs for their department', () => {
      const context = {
        department: 'technology',
        resourceDepartment: 'technology'
      };
      
      const granted = rbac.checkContextPermission(
        ROLES.C_LEVEL,
        PERMISSIONS.AUDIT_READ,
        context
      );
      
      expect(granted).toBe(true);
    });

    it('C-Level should not access audit logs for other departments', () => {
      const context = {
        department: 'technology',
        resourceDepartment: 'marketing'
      };
      
      const granted = rbac.checkContextPermission(
        ROLES.C_LEVEL,
        PERMISSIONS.AUDIT_READ,
        context
      );
      
      expect(granted).toBe(false);
    });

    it('Team Lead should access audit logs for their team', () => {
      const context = {
        team: 'development',
        resourceTeam: 'development'
      };
      
      const granted = rbac.checkContextPermission(
        ROLES.TEAM_LEAD,
        PERMISSIONS.AUDIT_READ,
        context
      );
      
      expect(granted).toBe(true);
    });

    it('Team Lead should not access audit logs for other teams', () => {
      const context = {
        team: 'development',
        resourceTeam: 'marketing'
      };
      
      const granted = rbac.checkContextPermission(
        ROLES.TEAM_LEAD,
        PERMISSIONS.AUDIT_READ,
        context
      );
      
      expect(granted).toBe(false);
    });
  });

  describe('Permission Helpers', () => {
    it('hasAnyPermission should return true if any permission granted', async () => {
      mockDb.prepare.mockReturnValue({
        bind: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue({ role: ROLES.C_LEVEL })
        })
      });

      const granted = await rbac.hasAnyPermission('user123', [
        PERMISSIONS.TASKS_READ,
        PERMISSIONS.USERS_WRITE
      ]);

      expect(granted).toBe(true);
    });

    it('hasAllPermissions should return true only if all granted', async () => {
      mockDb.prepare.mockReturnValue({
        bind: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue({ role: ROLES.C_LEVEL })
        })
      });

      const granted = await rbac.hasAllPermissions('user123', [
        PERMISSIONS.TASKS_READ,
        PERMISSIONS.TASKS_WRITE
      ]);

      expect(granted).toBe(true);
    });

    it('hasAllPermissions should return false if any denied', async () => {
      mockDb.prepare.mockReturnValue({
        bind: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue({ role: ROLES.C_LEVEL })
        })
      });

      const granted = await rbac.hasAllPermissions('user123', [
        PERMISSIONS.TASKS_READ,
        PERMISSIONS.USERS_WRITE
      ]);

      expect(granted).toBe(false);
    });
  });

  describe('Role Assignment', () => {
    it('should assign role to user', async () => {
      mockDb.prepare.mockReturnValue({
        bind: vi.fn().mockReturnValue({
          run: vi.fn().mockResolvedValue({ success: true })
        })
      });

      // Mock CEO role for assigner
      mockDb.prepare.mockReturnValueOnce({
        bind: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue({ role: ROLES.CEO })
        })
      });

      const result = await rbac.assignRole('user123', ROLES.C_LEVEL, 'ceo_user');
      expect(result).toBe(true);
    });

    it('should deny role assignment from non-CEO', async () => {
      mockDb.prepare.mockReturnValue({
        bind: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue({ role: ROLES.C_LEVEL }),
          run: vi.fn()
        })
      });

      const result = await rbac.assignRole('user123', ROLES.AGENT, 'c_level_user');
      expect(result).toBe(false);
    });

    it('should reject invalid role', async () => {
      const result = await rbac.assignRole('user123', 'invalid_role', 'ceo_user');
      expect(result).toBe(false);
    });
  });

  describe('Caching', () => {
    it('should cache user role', async () => {
      mockDb.prepare.mockReturnValue({
        bind: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue({ role: ROLES.C_LEVEL })
        })
      });

      await rbac.getUserRole('user123');
      const cached = rbac.cache.get('rbac:role:user123');
      
      expect(cached).toBeDefined();
      expect(cached.role).toBe(ROLES.C_LEVEL);
    });

    it('should clear cache for specific user', () => {
      rbac.cache.set('rbac:role:user123', { role: ROLES.C_LEVEL, timestamp: Date.now() });
      rbac.clearCache('user123');
      
      expect(rbac.cache.has('rbac:role:user123')).toBe(false);
    });

    it('should clear all cache', () => {
      rbac.cache.set('rbac:role:user123', { role: ROLES.C_LEVEL, timestamp: Date.now() });
      rbac.cache.set('rbac:role:user456', { role: ROLES.AGENT, timestamp: Date.now() });
      rbac.clearCache();
      
      expect(rbac.cache.size).toBe(0);
    });
  });

  describe('Role Permissions Retrieval', () => {
    it('should return permissions for CEO', () => {
      const permissions = rbac.getRolePermissions(ROLES.CEO);
      expect(permissions).toContain('*');
    });

    it('should return permissions for Agent', () => {
      const permissions = rbac.getRolePermissions(ROLES.AGENT);
      expect(permissions).toContain(PERMISSIONS.TASKS_READ);
      expect(permissions).not.toContain(PERMISSIONS.TASKS_WRITE);
    });

    it('should return empty array for invalid role', () => {
      const permissions = rbac.getRolePermissions('invalid_role');
      expect(permissions).toEqual([]);
    });
  });
});
