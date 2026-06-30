// Recovery Service Tests
// Tests disaster recovery procedures

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RecoveryService } from '../../src/core/recovery-service.js';

describe('RecoveryService', () => {
  let recoveryService;
  let mockDb;
  let mockKv;
  let mockR2;
  let mockBackupService;
  let mockMetadataManager;

  beforeEach(() => {
    // Mock database
    const mockStatement = {
      bind: vi.fn().mockReturnThis(),
      all: vi.fn().mockResolvedValue({ results: [] }),
      first: vi.fn().mockResolvedValue(null),
      run: vi.fn().mockResolvedValue({ success: true, meta: { changes: 0 } })
    };
    
    mockDb = {
      prepare: vi.fn().mockReturnValue(mockStatement)
    };

    // Mock KV
    mockKv = {
      list: vi.fn().mockResolvedValue({
        keys: [],
        list_complete: true,
        cursor: null
      }),
      get: vi.fn().mockImplementation((key) => {
        if (key === 'health-check') return Promise.resolve('ok');
        return Promise.resolve(null);
      }),
      put: vi.fn().mockResolvedValue()
    };

    // Mock R2
    mockR2 = {
      put: vi.fn().mockResolvedValue(),
      get: vi.fn().mockResolvedValue(null),
      delete: vi.fn().mockResolvedValue(),
      list: vi.fn().mockResolvedValue({
        objects: []
      })
    };

    // Mock backup service
    mockBackupService = {
      restoreD1: vi.fn().mockResolvedValue({ success: true }),
      restoreKV: vi.fn().mockResolvedValue({ success: true, keyCount: 0 })
    };

    // Mock metadata manager
    mockMetadataManager = {
      initialize: vi.fn().mockResolvedValue(),
      getLatestBackup: vi.fn().mockResolvedValue(null),
      recordRestore: vi.fn().mockResolvedValue('restore-id'),
      getBackup: vi.fn().mockResolvedValue(null),
      getRestoreHistory: vi.fn().mockResolvedValue([])
    };

    recoveryService = new RecoveryService(mockDb, mockKv, mockR2);
    recoveryService.backupService = mockBackupService;
    recoveryService.metadataManager = mockMetadataManager;
  });

  describe('Initialization', () => {
    it('should initialize recovery service', async () => {
      await recoveryService.initialize();
      expect(mockMetadataManager.initialize).toHaveBeenCalled();
    });
  });

  describe('Backup Retrieval', () => {
    it('should get latest backup by type', async () => {
      const mockBackup = {
        id: 'backup-1',
        type: 'd1',
        file_path: 'backups/d1/test.sql.gz',
        timestamp: Date.now()
      };
      
      mockMetadataManager.getLatestBackup.mockResolvedValue(mockBackup);
      
      const backup = await recoveryService.getLatestBackup('d1');
      expect(backup).toEqual(mockBackup);
      expect(mockMetadataManager.getLatestBackup).toHaveBeenCalledWith('d1');
    });

    it('should return null when no backup available', async () => {
      mockMetadataManager.getLatestBackup.mockResolvedValue(null);
      
      const backup = await recoveryService.getLatestBackup('d1');
      expect(backup).toBeNull();
    });
  });

  describe('D1 Recovery', () => {
    it('should perform D1 recovery', async () => {
      const mockBackup = {
        id: 'backup-1',
        type: 'd1',
        file_path: 'backups/d1/test.sql.gz',
        timestamp: Date.now()
      };
      
      mockMetadataManager.getLatestBackup.mockResolvedValue(mockBackup);
      mockBackupService.restoreD1.mockResolvedValue({ success: true });
      
      const result = await recoveryService.d1Recovery();
      
      expect(result.success).toBe(true);
      expect(result.backup).toBe(mockBackup.file_path);
      expect(mockBackupService.restoreD1).toHaveBeenCalledWith(mockBackup.file_path);
      expect(mockMetadataManager.recordRestore).toHaveBeenCalledWith(mockBackup.id, true);
    });

    it('should throw error when no D1 backup available', async () => {
      mockMetadataManager.getLatestBackup.mockResolvedValue(null);
      
      await expect(recoveryService.d1Recovery()).rejects.toThrow('No verified D1 backup available');
    });
  });

  describe('KV Recovery', () => {
    it('should perform KV recovery', async () => {
      const mockBackup = {
        id: 'backup-2',
        type: 'kv',
        file_path: 'backups/kv/test.json.gz',
        timestamp: Date.now()
      };
      
      mockMetadataManager.getLatestBackup.mockResolvedValue(mockBackup);
      mockBackupService.restoreKV.mockResolvedValue({ success: true, keyCount: 10 });
      
      const result = await recoveryService.kvRecovery();
      
      expect(result.success).toBe(true);
      expect(result.backup).toBe(mockBackup.file_path);
      expect(mockBackupService.restoreKV).toHaveBeenCalledWith(mockBackup.file_path);
      expect(mockMetadataManager.recordRestore).toHaveBeenCalledWith(mockBackup.id, true);
    });

    it('should throw error when no KV backup available', async () => {
      mockMetadataManager.getLatestBackup.mockResolvedValue(null);
      
      await expect(recoveryService.kvRecovery()).rejects.toThrow('No verified KV backup available');
    });
  });

  describe('Full System Recovery', () => {
    it('should perform full system recovery', async () => {
      const mockD1Backup = {
        id: 'backup-1',
        type: 'd1',
        file_path: 'backups/d1/test.sql.gz',
        timestamp: Date.now()
      };
      
      const mockKvBackup = {
        id: 'backup-2',
        type: 'kv',
        file_path: 'backups/kv/test.json.gz',
        timestamp: Date.now()
      };
      
      mockMetadataManager.getLatestBackup
        .mockResolvedValueOnce(mockD1Backup)
        .mockResolvedValueOnce(mockKvBackup);
      
      mockBackupService.restoreD1.mockResolvedValue({ success: true });
      mockBackupService.restoreKV.mockResolvedValue({ success: true, keyCount: 10 });
      
      const result = await recoveryService.fullSystemRecovery();
      
      expect(result.success).toBe(true);
      expect(result.d1Backup).toBe(mockD1Backup.file_path);
      expect(result.kvBackup).toBe(mockKvBackup.file_path);
      expect(mockBackupService.restoreD1).toHaveBeenCalled();
      expect(mockBackupService.restoreKV).toHaveBeenCalled();
    });

    it('should throw error when D1 backup missing', async () => {
      mockMetadataManager.getLatestBackup.mockResolvedValue(null);
      
      await expect(recoveryService.fullSystemRecovery()).rejects.toThrow('No verified D1 backup available');
    });

    it('should throw error when KV backup missing', async () => {
      const mockD1Backup = {
        id: 'backup-1',
        type: 'd1',
        file_path: 'backups/d1/test.sql.gz',
        timestamp: Date.now()
      };
      
      mockMetadataManager.getLatestBackup
        .mockResolvedValueOnce(mockD1Backup)
        .mockResolvedValueOnce(null);
      
      await expect(recoveryService.fullSystemRecovery()).rejects.toThrow('No verified KV backup available');
    });
  });

  describe('Recovery from Specific Backup', () => {
    it('should recover from specific D1 backup', async () => {
      const mockBackup = {
        id: 'backup-1',
        type: 'd1',
        file_path: 'backups/d1/test.sql.gz',
        timestamp: Date.now()
      };
      
      mockMetadataManager.getBackup.mockResolvedValue(mockBackup);
      mockBackupService.restoreD1.mockResolvedValue({ success: true });
      
      const result = await recoveryService.recoveryFromBackup('backup-1');
      
      expect(result.success).toBe(true);
      expect(result.backupId).toBe('backup-1');
      expect(result.type).toBe('d1');
      expect(mockBackupService.restoreD1).toHaveBeenCalledWith(mockBackup.file_path);
    });

    it('should recover from specific KV backup', async () => {
      const mockBackup = {
        id: 'backup-2',
        type: 'kv',
        file_path: 'backups/kv/test.json.gz',
        timestamp: Date.now()
      };
      
      mockMetadataManager.getBackup.mockResolvedValue(mockBackup);
      mockBackupService.restoreKV.mockResolvedValue({ success: true, keyCount: 5 });
      
      const result = await recoveryService.recoveryFromBackup('backup-2');
      
      expect(result.success).toBe(true);
      expect(result.backupId).toBe('backup-2');
      expect(result.type).toBe('kv');
      expect(mockBackupService.restoreKV).toHaveBeenCalledWith(mockBackup.file_path);
    });

    it('should throw error for unknown backup type', async () => {
      const mockBackup = {
        id: 'backup-3',
        type: 'unknown',
        file_path: 'backups/unknown/test.gz',
        timestamp: Date.now()
      };
      
      mockMetadataManager.getBackup.mockResolvedValue(mockBackup);
      
      await expect(recoveryService.recoveryFromBackup('backup-3')).rejects.toThrow('Unknown backup type');
    });
  });

  describe('System Health Verification', () => {
    it('should verify all systems healthy', async () => {
      const result = await recoveryService.verifySystemHealth();
      
      expect(result.allHealthy).toBe(true);
      expect(result.checks.d1).toBe(true);
      expect(result.checks.kv).toBe(true);
      expect(result.checks.r2).toBe(true);
    });

    it('should detect D1 failure', async () => {
      mockDb.prepare.mockImplementation(() => {
        throw new Error('D1 error');
      });
      
      const result = await recoveryService.verifySystemHealth();
      
      expect(result.allHealthy).toBe(false);
      expect(result.checks.d1).toBe(false);
    });

    it('should detect KV failure', async () => {
      mockKv.put.mockRejectedValue(new Error('KV error'));
      
      const result = await recoveryService.verifySystemHealth();
      
      expect(result.allHealthy).toBe(false);
      expect(result.checks.kv).toBe(false);
    });

    it('should detect R2 failure', async () => {
      mockR2.list.mockRejectedValue(new Error('R2 error'));
      
      const result = await recoveryService.verifySystemHealth();
      
      expect(result.allHealthy).toBe(false);
      expect(result.checks.r2).toBe(false);
    });
  });

  describe('Recovery Statistics', () => {
    it('should get recovery statistics', async () => {
      mockMetadataManager.getRestoreHistory.mockResolvedValue([
        { success: 1, duration: 1000 },
        { success: 1, duration: 2000 },
        { success: 0, duration: 1500 }
      ]);
      
      const stats = await recoveryService.getRecoveryStatistics();
      
      expect(stats.total).toBe(3);
      expect(stats.successful).toBe(2);
      expect(stats.failed).toBe(1);
      expect(stats.successRate).toBeCloseTo(66.67, 1);
      expect(stats.avgDuration).toBeCloseTo(1500, 0);
    });

    it('should handle empty restore history', async () => {
      mockMetadataManager.getRestoreHistory.mockResolvedValue([]);
      
      const stats = await recoveryService.getRecoveryStatistics();
      
      expect(stats.total).toBe(0);
      expect(stats.successful).toBe(0);
      expect(stats.failed).toBe(0);
      expect(stats.successRate).toBe(0);
      expect(stats.avgDuration).toBe(0);
    });
  });

  describe('Emergency Rollback', () => {
    it('should perform emergency rollback', async () => {
      const mockRestore = {
        backup_id: 'backup-1',
        success: 1,
        timestamp: Date.now()
      };
      
      mockMetadataManager.getRestoreHistory.mockResolvedValue([mockRestore]);
      mockMetadataManager.getBackup.mockResolvedValue({
        id: 'backup-1',
        type: 'd1',
        file_path: 'backups/d1/test.sql.gz'
      });
      mockBackupService.restoreD1.mockResolvedValue({ success: true });
      
      const result = await recoveryService.emergencyRollback();
      
      expect(result.success).toBe(true);
      expect(mockMetadataManager.getRestoreHistory).toHaveBeenCalledWith(1);
    });

    it('should throw error when no restore history', async () => {
      mockMetadataManager.getRestoreHistory.mockResolvedValue([]);
      
      await expect(recoveryService.emergencyRollback()).rejects.toThrow('No restore history available for rollback');
    });
  });
});
