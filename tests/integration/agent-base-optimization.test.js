// Integration Tests for AgentBase with Optimizations
// Tests parallel execution, caching, and context optimization in integrated environment

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AgentBase } from '../../src/core/agent-base.js';

describe('AgentBase Optimization Integration', () => {
  let mockEnv;
  let agent;

  beforeEach(() => {
    mockEnv = {
      KV: {
        get: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
        list: vi.fn()
      },
      D1: {
        prepare: vi.fn().mockReturnValue({
          bind: vi.fn().mockReturnValue({
            all: vi.fn().mockResolvedValue([])
          })
        })
      }
    };

    agent = new AgentBase({
      name: 'test-agent',
      model: 'claude-3-5-sonnet-20241022',
      systemPrompt: 'You are a test agent.',
      tools: ['web-fetch', 'd1-query', 'memory-search'],
      optimizationConfig: {
        enableParallel: true,
        enableCache: true,
        enableContextOpt: true,
        maxParallel: 5
      }
    });
  });

  describe('Initialization', () => {
    it('should initialize optimization modules with config', () => {
      expect(agent.optimizationConfig.enableParallel).toBe(true);
      expect(agent.optimizationConfig.enableCache).toBe(true);
      expect(agent.optimizationConfig.enableContextOpt).toBe(true);
      expect(agent.optimizationConfig.maxParallel).toBe(5);
    });

    it('should allow disabling optimizations via config', () => {
      const disabledAgent = new AgentBase({
        name: 'disabled-agent',
        model: 'claude-3-5-sonnet-20241022',
        systemPrompt: 'You are a test agent.',
        tools: ['web-fetch'],
        optimizationConfig: {
          enableParallel: false,
          enableCache: false,
          enableContextOpt: false
        }
      });

      expect(disabledAgent.optimizationConfig.enableParallel).toBe(false);
      expect(disabledAgent.optimizationConfig.enableCache).toBe(false);
      expect(disabledAgent.optimizationConfig.enableContextOpt).toBe(false);
    });
  });

  describe('Parallel Execution Integration', () => {
    it('should use parallel executor when enabled', async () => {
      // Mock the useTool to return results
      vi.spyOn(agent, 'useTool').mockImplementation(async (tool, args) => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return `[Result: ${tool}] data`;
      });

      // Initialize optimization modules
      await agent.run('test message', 'user-123', mockEnv, { draftMode: true });

      expect(agent.parallelExecutor).toBeDefined();
      expect(agent.optimizationConfig.enableParallel).toBe(true);
    });

    it('should fallback to sequential when parallel fails', async () => {
      vi.spyOn(agent, 'useTool').mockImplementation(async (tool, args) => {
        return `[Result: ${tool}] data`;
      });

      // Force parallel executor to fail
      if (agent.parallelExecutor) {
        vi.spyOn(agent.parallelExecutor, 'execute').mockRejectedValue(new Error('Parallel failed'));
      }

      // Should still complete with sequential fallback
      const result = await agent.run('test message', 'user-123', mockEnv, { draftMode: true });
      expect(result).toBeDefined();
    });
  });

  describe('Cache Integration', () => {
    it('should use tool cache when enabled', async () => {
      mockEnv.KV.get.mockResolvedValue(null);
      mockEnv.KV.put.mockResolvedValue();

      vi.spyOn(agent, '_executeTool').mockImplementation(async (tool, args) => {
        return `[Result: ${tool}] data`;
      });

      // Initialize optimization modules
      await agent.run('test message', 'user-123', mockEnv, { draftMode: true });

      expect(agent.toolCache).toBeDefined();
      expect(agent.optimizationConfig.enableCache).toBe(true);
    });

    it('should fallback to direct execution when cache fails', async () => {
      mockEnv.KV.get.mockRejectedValue(new Error('Cache error'));

      vi.spyOn(agent, '_executeTool').mockImplementation(async (tool, args) => {
        return `[Result: ${tool}] data`;
      });

      // Should still complete with direct execution
      const result = await agent.useTool('web-fetch', { url: 'https://example.com' }, mockEnv);
      expect(result).toBeDefined();
    });
  });

  describe('Context Optimization Integration', () => {
    it('should apply context optimization when enabled', async () => {
      // Mock LLM call
      vi.mock('../../src/core/llm-client.js', () => ({
        callLLM: vi.fn().mockResolvedValue({
          content: 'Response without tools',
          provider: 'anthropic',
          model: 'claude-3-5-sonnet-20241022'
        })
      }));

      // Mock memory
      mockEnv.D1.prepare().bind().all.mockResolvedValue([]);

      // Initialize optimization modules
      await agent.run('test message', 'user-123', mockEnv, { draftMode: true });

      expect(agent.contextOptimizer).toBeDefined();
      expect(agent.optimizationConfig.enableContextOpt).toBe(true);
    });

    it('should preserve last user message after optimization', async () => {
      vi.mock('../../src/core/llm-client.js', () => ({
        callLLM: vi.fn().mockResolvedValue({
          content: 'Response',
          provider: 'anthropic',
          model: 'claude-3-5-sonnet-20241022'
        })
      }));

      mockEnv.D1.prepare().bind().all.mockResolvedValue([]);

      await agent.run('important message', 'user-123', mockEnv, { draftMode: true });

      // Context optimizer should preserve last user message
      if (agent.contextOptimizer) {
        const testMessages = [
          { role: 'user', content: 'old message' },
          { role: 'assistant', content: 'response' },
          { role: 'user', content: 'important message' }
        ];
        const optimized = agent.contextOptimizer.optimizeContext(testMessages);
        expect(optimized[optimized.length - 1].role).toBe('user');
      }
    });
  });

  describe('Combined Optimization', () => {
    it('should work with all optimizations enabled', async () => {
      const fullOptAgent = new AgentBase({
        name: 'full-opt-agent',
        model: 'claude-3-5-sonnet-20241022',
        systemPrompt: 'You are a test agent.',
        tools: ['web-fetch', 'd1-query'],
        optimizationConfig: {
          enableParallel: true,
          enableCache: true,
          enableContextOpt: true,
          maxParallel: 5
        }
      });

      vi.mock('../../src/core/llm-client.js', () => ({
        callLLM: vi.fn().mockResolvedValue({
          content: 'Response',
          provider: 'anthropic',
          model: 'claude-3-5-sonnet-20241022'
        })
      }));

      mockEnv.D1.prepare().bind().all.mockResolvedValue([]);
      vi.spyOn(fullOptAgent, 'useTool').mockResolvedValue('[Result: web-fetch] data');

      await fullOptAgent.run('test message', 'user-123', mockEnv, { draftMode: true });

      expect(fullOptAgent.parallelExecutor).toBeDefined();
      expect(fullOptAgent.toolCache).toBeDefined();
      expect(fullOptAgent.contextOptimizer).toBeDefined();
    });

    it('should work with all optimizations disabled', async () => {
      const noOptAgent = new AgentBase({
        name: 'no-opt-agent',
        model: 'claude-3-5-sonnet-20241022',
        systemPrompt: 'You are a test agent.',
        tools: ['web-fetch'],
        optimizationConfig: {
          enableParallel: false,
          enableCache: false,
          enableContextOpt: false
        }
      });

      vi.mock('../../src/core/llm-client.js', () => ({
        callLLM: vi.fn().mockResolvedValue({
          content: 'Response',
          provider: 'anthropic',
          model: 'claude-3-5-sonnet-20241022'
        })
      }));

      mockEnv.D1.prepare().bind().all.mockResolvedValue([]);
      vi.spyOn(noOptAgent, 'useTool').mockResolvedValue('[Result: web-fetch] data');

      await noOptAgent.run('test message', 'user-123', mockEnv, { draftMode: true });

      // Should still work without optimizations
      expect(noOptAgent.parallelExecutor).toBeNull();
      expect(noOptAgent.toolCache).toBeNull();
      expect(noOptAgent.contextOptimizer).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle parallel execution errors gracefully', async () => {
      vi.spyOn(agent, 'useTool').mockResolvedValue('[Result: web-fetch] data');
      
      if (agent.parallelExecutor) {
        vi.spyOn(agent.parallelExecutor, 'execute').mockRejectedValue(new Error('Parallel error'));
      }

      vi.mock('../../src/core/llm-client.js', () => ({
        callLLM: vi.fn().mockResolvedValue({
          content: 'Response',
          provider: 'anthropic',
          model: 'claude-3-5-sonnet-20241022'
        })
      }));

      mockEnv.D1.prepare().bind().all.mockResolvedValue([]);

      const result = await agent.run('test message', 'user-123', mockEnv, { draftMode: true });
      expect(result).toBeDefined();
    });

    it('should handle cache errors gracefully', async () => {
      mockEnv.KV.get.mockRejectedValue(new Error('Cache error'));
      vi.spyOn(agent, '_executeTool').mockResolvedValue('[Result: web-fetch] data');

      const result = await agent.useTool('web-fetch', { url: 'https://example.com' }, mockEnv);
      expect(result).toBeDefined();
    });

    it('should handle context optimization errors gracefully', async () => {
      if (agent.contextOptimizer) {
        vi.spyOn(agent.contextOptimizer, 'optimizeContext').mockImplementation(() => {
          throw new Error('Optimization error');
        });
      }

      vi.mock('../../src/core/llm-client.js', () => ({
        callLLM: vi.fn().mockResolvedValue({
          content: 'Response',
          provider: 'anthropic',
          model: 'claude-3-5-sonnet-20241022'
        })
      }));

      mockEnv.D1.prepare().bind().all.mockResolvedValue([]);

      const result = await agent.run('test message', 'user-123', mockEnv, { draftMode: true });
      expect(result).toBeDefined();
    });
  });
});
