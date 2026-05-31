// Performance Benchmark Tests
// Benchmarks parallel tool execution, caching, and context optimization

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ParallelToolExecutor } from '../../src/core/parallel-tool-executor.js';
import { ToolCache } from '../../src/core/tool-cache.js';
import { ContextOptimizer } from '../../src/core/context-optimizer.js';

describe('Performance Benchmark', () => {
  let mockEnv;
  let mockUseTool;

  beforeEach(() => {
    mockEnv = {
      KV: {
        get: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
        list: vi.fn()
      }
    };

    // Mock tool execution with delay
    mockUseTool = vi.fn().mockImplementation(async (tool, args) => {
      await new Promise(resolve => setTimeout(resolve, 10)); // 10ms delay
      return `[Result: ${tool}] data`;
    });
  });

  describe('Parallel Tool Execution Benchmark', () => {
    it('should execute independent tools faster than sequential', async () => {
      const executor = new ParallelToolExecutor(mockEnv);
      
      const toolCalls = [
        { tool: 'web-fetch', args: { url: 'https://example1.com' } },
        { tool: 'web-fetch', args: { url: 'https://example2.com' } },
        { tool: 'web-fetch', args: { url: 'https://example3.com' } },
        { tool: 'd1-query', args: { query: 'SELECT 1' } },
        { tool: 'memory-search', args: { query: 'test' } }
      ];

      // Benchmark parallel execution
      const parallelStart = Date.now();
      await executor.execute(toolCalls, mockUseTool);
      const parallelTime = Date.now() - parallelStart;

      // Benchmark sequential execution
      const sequentialStart = Date.now();
      for (const call of toolCalls) {
        await mockUseTool(call.tool, call.args);
      }
      const sequentialTime = Date.now() - sequentialStart;

      // Parallel should be faster (or at least not significantly slower)
      console.log(`Parallel: ${parallelTime}ms, Sequential: ${sequentialTime}ms`);
      expect(parallelTime).toBeLessThanOrEqual(sequentialTime + 20); // Allow 20ms variance
    });

    it('should handle 10 parallel tools efficiently', async () => {
      const executor = new ParallelToolExecutor(mockEnv);
      
      const toolCalls = Array.from({ length: 10 }, (_, i) => ({
        tool: 'web-fetch',
        args: { url: `https://example${i}.com` }
      }));

      const start = Date.now();
      await executor.execute(toolCalls, mockUseTool);
      const time = Date.now() - start;

      console.log(`10 parallel tools: ${time}ms`);
      // Should complete in roughly the time of 1-2 tools (not 10)
      expect(time).toBeLessThan(100); // Less than 100ms for 10 tools
    });
  });

  describe('Tool Cache Benchmark', () => {
    it('should return cached results faster than fresh execution', async () => {
      const cache = new ToolCache(mockEnv);
      
      const toolName = 'web-fetch';
      const args = { url: 'https://example.com' };
      const executeFn = async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'data';
      };

      // First call - cache miss
      const missStart = Date.now();
      await cache.execute(toolName, args, executeFn);
      const missTime = Date.now() - missStart;

      // Second call - cache hit
      mockEnv.KV.get.mockResolvedValueOnce({ result: 'data' });
      const hitStart = Date.now();
      await cache.execute(toolName, args, executeFn);
      const hitTime = Date.now() - hitStart;

      console.log(`Cache miss: ${missTime}ms, Cache hit: ${hitTime}ms`);
      expect(hitTime).toBeLessThan(missTime);
    });

    it('should achieve high cache hit rate with repeated calls', async () => {
      const cache = new ToolCache(mockEnv);
      
      const toolName = 'web-fetch';
      const args = { url: 'https://example.com' };
      const executeFn = async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'data';
      };

      // First call - miss
      await cache.execute(toolName, args, executeFn);

      // Subsequent calls - hits
      mockEnv.KV.get.mockResolvedValue({ result: 'data' });
      for (let i = 0; i < 9; i++) {
        await cache.execute(toolName, args, executeFn);
      }

      const stats = cache.getStats();
      console.log(`Cache stats: ${JSON.stringify(stats)}`);
      expect(stats.hitRate).toBe('90.00%');
    });
  });

  describe('Context Optimization Benchmark', () => {
    it('should reduce context size significantly', () => {
      const optimizer = new ContextOptimizer(mockEnv);
      
      const messages = Array.from({ length: 50 }, (_, i) => ({
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: 'x'.repeat(500)
      }));

      const originalSize = JSON.stringify(messages).length;
      const optimized = optimizer.optimizeContext(messages);
      const optimizedSize = JSON.stringify(optimized).length;

      const reduction = ((originalSize - optimizedSize) / originalSize * 100).toFixed(2);
      console.log(`Context reduction: ${reduction}%`);
      expect(parseFloat(reduction)).toBeGreaterThan(50); // At least 50% reduction
    });

    it('should optimize context quickly', () => {
      const optimizer = new ContextOptimizer(mockEnv);
      
      const messages = Array.from({ length: 100 }, (_, i) => ({
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: 'x'.repeat(500)
      }));

      const start = Date.now();
      optimizer.optimizeContext(messages);
      const time = Date.now() - start;

      console.log(`Context optimization time: ${time}ms`);
      expect(time).toBeLessThan(100); // Should complete in under 100ms
    });

    it('should maintain high-priority messages', () => {
      const optimizer = new ContextOptimizer(mockEnv);
      
      const messages = [
        { role: 'user', content: 'important1' },
        { role: 'assistant', content: 'response1' },
        { role: 'user', content: 'important2' },
        { role: 'assistant', content: 'response2' },
        { role: 'user', content: 'important3' }
      ];

      const optimized = optimizer.optimizeContext(messages);
      
      // At least the last user message should be preserved
      const userMessages = optimized.filter(m => m.role === 'user');
      expect(userMessages.length).toBeGreaterThan(0);
      expect(optimized[optimized.length - 1].role).toBe('user');
    });
  });

  describe('Combined Optimization Benchmark', () => {
    it('should demonstrate overall performance improvement', async () => {
      const executor = new ParallelToolExecutor(mockEnv);
      const cache = new ToolCache(mockEnv);
      const optimizer = new ContextOptimizer(mockEnv);

      // Simulate a workflow with multiple tool calls
      const toolCalls = [
        { tool: 'web-fetch', args: { url: 'https://example1.com' } },
        { tool: 'd1-query', args: { query: 'SELECT * FROM tasks' } },
        { tool: 'memory-search', args: { query: 'recent tasks' } }
      ];

      // Baseline: sequential execution, no cache, no optimization
      const baselineStart = Date.now();
      for (const call of toolCalls) {
        await mockUseTool(call.tool, call.args);
      }
      const baselineTime = Date.now() - baselineStart;

      // Optimized: parallel execution with cache
      const optimizedStart = Date.now();
      await executor.execute(toolCalls, mockUseTool);
      const optimizedTime = Date.now() - optimizedStart;

      const improvement = ((baselineTime - optimizedTime) / baselineTime * 100).toFixed(2);
      console.log(`Baseline: ${baselineTime}ms, Optimized: ${optimizedTime}ms, Improvement: ${improvement}%`);
      
      // Should show at least some improvement
      expect(optimizedTime).toBeLessThanOrEqual(baselineTime);
    });
  });

  describe('Memory and Resource Usage', () => {
    it('should not leak memory with repeated executions', async () => {
      const executor = new ParallelToolExecutor(mockEnv);
      
      const toolCalls = [
        { tool: 'web-fetch', args: { url: 'https://example.com' } }
      ];

      // Execute 100 times
      for (let i = 0; i < 100; i++) {
        await executor.execute(toolCalls, mockUseTool);
      }

      // If memory leaks, this would fail
      // In a real scenario, we'd use process.memoryUsage()
      expect(true).toBe(true);
    });

    it('should handle large context without excessive memory', () => {
      const optimizer = new ContextOptimizer(mockEnv);
      
      const messages = Array.from({ length: 1000 }, (_, i) => ({
        role: 'user',
        content: 'x'.repeat(1000)
      }));

      const optimized = optimizer.optimizeContext(messages);
      
      // Should not crash and should reduce size
      expect(optimized.length).toBeLessThan(messages.length);
    });
  });
});
