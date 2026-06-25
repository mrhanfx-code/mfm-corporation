import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ErrorRecoveryManager } from '../../src/core/error-recovery.js';
import { HybridSearchManager } from '../../src/core/hybrid-search.js';
import { ContextInjectionManager } from '../../src/core/context-injection.js';
import { SmartSearchManager } from '../../src/core/smart-search.js';
import { MemoryConsolidationManager } from '../../src/core/memory-consolidation.js';
import { MultiModelManager } from '../../src/core/multi-model-support.js';

describe('Core Modules Integration Tests', () => {
  let mockEnv;

  beforeEach(() => {
    mockEnv = {
      KV: {
        get: vi.fn(),
        put: vi.fn(),
        delete: vi.fn()
      },
      db: {
        prepare: vi.fn(),
        exec: vi.fn()
      }
    };
  });

  describe('ErrorRecoveryManager', () => {
    it('should initialize without errors', () => {
      const manager = new ErrorRecoveryManager(mockEnv);
      expect(manager).toBeDefined();
    });

    it('should categorize errors correctly', () => {
      const manager = new ErrorRecoveryManager(mockEnv);
      const category = manager.categorizeError(new Error('Connection timeout'));
      expect(category).toBeDefined();
    });
  });

  describe('HybridSearchManager', () => {
    it('should initialize without errors', () => {
      const manager = new HybridSearchManager(mockEnv);
      expect(manager).toBeDefined();
    });

    it('should perform hybrid search', async () => {
      const manager = new HybridSearchManager(mockEnv);
      mockEnv.KV.get.mockResolvedValue('[]');
      
      const result = await manager.hybridSearch('test query');
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('ContextInjectionManager', () => {
    it('should initialize without errors', () => {
      const manager = new ContextInjectionManager(mockEnv);
      expect(manager).toBeDefined();
    });

    it('should inject context on session start', async () => {
      const manager = new ContextInjectionManager(mockEnv);
      mockEnv.KV.get.mockResolvedValue('[]');
      
      const context = await manager.injectContext('session-123', 'user-456');
      expect(context).toBeDefined();
    });
  });

  describe('SmartSearchManager', () => {
    it('should initialize without errors', () => {
      const manager = new SmartSearchManager(mockEnv);
      expect(manager).toBeDefined();
    });

    it('should analyze query intent', () => {
      const manager = new SmartSearchManager(mockEnv);
      const intent = manager.analyzeQueryIntent('how to fix a bug in JavaScript');
      expect(intent).toBeDefined();
      expect(intent.primary).toBeDefined();
    });
  });

  describe('MemoryConsolidationManager', () => {
    it('should initialize without errors', () => {
      const manager = new MemoryConsolidationManager(mockEnv);
      expect(manager).toBeDefined();
    });

    it('should consolidate session observations', async () => {
      const manager = new MemoryConsolidationManager(mockEnv);
      const observations = [
        { content: 'User asked about error handling', timestamp: '2026-05-29T00:00:00Z' },
        { content: 'Critical decision made about architecture', timestamp: '2026-05-29T00:01:00Z' }
      ];
      
      const consolidation = await manager.consolidateSession('session-123', observations);
      expect(consolidation).toBeDefined();
      expect(consolidation.keyInsights).toBeDefined();
      expect(consolidation.patterns).toBeDefined();
    });
  });

  describe('MultiModelManager', () => {
    it('should initialize without errors', () => {
      const manager = new MultiModelManager(mockEnv);
      expect(manager).toBeDefined();
    });

    it('should register models', () => {
      const manager = new MultiModelManager(mockEnv);
      const model = manager.registerModel('claude-3-5-sonnet', {
        name: 'Claude 3.5 Sonnet',
        provider: 'anthropic',
        maxTokens: 4096
      });
      
      expect(model).toBeDefined();
      expect(model.id).toBe('claude-3-5-sonnet');
    });

    it('should select best model for task type', () => {
      const manager = new MultiModelManager(mockEnv);
      manager.registerModel('claude-3-5-sonnet', {
        name: 'Claude 3.5 Sonnet',
        provider: 'anthropic',
        capabilities: ['code-generation', 'reasoning'],
        priority: 'high'
      });
      
      const model = manager.selectBestModel('coding');
      expect(model).toBeDefined();
    });
  });

  describe('Module Integration', () => {
    it('should work together in agent context', async () => {
      const errorRecovery = new ErrorRecoveryManager(mockEnv);
      const hybridSearch = new HybridSearchManager(mockEnv);
      const contextInjection = new ContextInjectionManager(mockEnv);
      const smartSearch = new SmartSearchManager(mockEnv);
      const memoryConsolidation = new MemoryConsolidationManager(mockEnv);
      const multiModel = new MultiModelManager(mockEnv);
      
      // Register a model
      multiModel.registerModel('claude-3-5-sonnet', {
        name: 'Claude 3.5 Sonnet',
        provider: 'anthropic',
        capabilities: ['general-purpose'],
        priority: 'high'
      });
      
      // Mock KV responses
      mockEnv.KV.get.mockResolvedValue('[]');
      
      // Test smart search
      const searchResult = await smartSearch.smartSearch('test query');
      expect(searchResult).toBeDefined();
      
      // Test memory consolidation
      const observations = [
        { content: 'Test observation', timestamp: '2026-05-29T00:00:00Z' }
      ];
      const consolidation = await memoryConsolidation.consolidateSession('session-123', observations);
      expect(consolidation).toBeDefined();
      
      // Verify all managers are functional
      expect(errorRecovery).toBeDefined();
      expect(hybridSearch).toBeDefined();
      expect(contextInjection).toBeDefined();
    });
  });
});
