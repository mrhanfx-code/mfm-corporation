// Parallel Tool Executor Tests
// Tests parallel execution of independent tools

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ParallelToolExecutor } from '../../src/core/parallel-tool-executor.js';

describe('ParallelToolExecutor', () => {
  let executor;
  let mockEnv;
  let mockUseTool;

  beforeEach(() => {
    mockEnv = {
      KV: {},
      db: {}
    };

    mockUseTool = vi.fn().mockImplementation(async (tool, args) => {
      // Simulate tool execution time
      await new Promise(resolve => setTimeout(resolve, 10));
      return `[Result: ${tool}] executed with ${JSON.stringify(args)}`;
    });

    executor = new ParallelToolExecutor(mockEnv);
  });

  describe('Initialization', () => {
    it('should initialize with environment', () => {
      expect(executor.env).toBe(mockEnv);
      expect(executor.maxParallel).toBe(5);
    });
  });

  describe('Read-Only Detection', () => {
    it('should identify read-only tools', () => {
      expect(executor.isReadOnly('web-fetch')).toBe(true);
      expect(executor.isReadOnly('d1-query')).toBe(true);
      expect(executor.isReadOnly('memory-search')).toBe(true);
    });

    it('should identify write tools', () => {
      expect(executor.isReadOnly('drive-write')).toBe(false);
      expect(executor.isReadOnly('github-push')).toBe(false);
      expect(executor.isReadOnly('memory-remember')).toBe(false);
    });
  });

  describe('Dependency Detection', () => {
    it('should get dependencies for tools', () => {
      expect(executor.getDependencies('drive-write')).toEqual(['drive-read']);
      expect(executor.getDependencies('github-push')).toEqual(['github-list-repos']);
      expect(executor.getDependencies('web-fetch')).toEqual([]);
    });

    it('should return empty array for unknown tools', () => {
      expect(executor.getDependencies('unknown-tool')).toEqual([]);
    });
  });

  describe('Parallelization Check', () => {
    it('should allow parallelization of different read-only tools', () => {
      const call1 = { tool: 'web-fetch', args: { url: 'https://example.com' } };
      const call2 = { tool: 'd1-query', args: { query: 'SELECT * FROM tasks' } };
      
      expect(executor.canParallelize(call1, call2)).toBe(true);
    });

    it('should allow parallelization of same read-only tool with different args', () => {
      const call1 = { tool: 'web-fetch', args: { url: 'https://example.com' } };
      const call2 = { tool: 'web-fetch', args: { url: 'https://example.org' } };
      
      expect(executor.canParallelize(call1, call2)).toBe(true);
    });

    it('should not allow parallelization of same tool with same args', () => {
      const call1 = { tool: 'web-fetch', args: { url: 'https://example.com' } };
      const call2 = { tool: 'web-fetch', args: { url: 'https://example.com' } };
      
      expect(executor.canParallelize(call1, call2)).toBe(false);
    });

    it('should not allow parallelization of dependent tools', () => {
      const call1 = { tool: 'drive-read', args: { fileId: '123' } };
      const call2 = { tool: 'drive-write', args: { fileName: 'test.txt' } };
      
      expect(executor.canParallelize(call1, call2)).toBe(false);
    });
  });

  describe('Dependency Graph', () => {
    it('should build dependency graph for tool calls', () => {
      const toolCalls = [
        { tool: 'web-fetch', args: { url: 'https://example.com' } },
        { tool: 'd1-query', args: { query: 'SELECT * FROM tasks' } },
        { tool: 'drive-read', args: { fileId: '123' } }
      ];

      const graph = executor.buildDependencyGraph(toolCalls);
      
      expect(graph.size).toBe(3);
      expect(graph.get(toolCalls[0]).dependencies).toEqual([]);
      expect(graph.get(toolCalls[1]).dependencies).toEqual([]);
      expect(graph.get(toolCalls[2]).dependencies).toEqual([]);
    });

    it('should detect dependencies between tools', () => {
      const toolCalls = [
        { tool: 'drive-read', args: { fileId: '123' } },
        { tool: 'drive-write', args: { fileName: 'test.txt' } }
      ];

      const graph = executor.buildDependencyGraph(toolCalls);
      
      expect(graph.get(toolCalls[1]).dependencies).toContain(toolCalls[0]);
    });
  });

  describe('Topological Sort', () => {
    it('should sort tool calls by dependencies', () => {
      const toolCalls = [
        { tool: 'drive-read', args: { fileId: '123' } },
        { tool: 'drive-write', args: { fileName: 'test.txt' } }
      ];

      const graph = executor.buildDependencyGraph(toolCalls);
      const sorted = executor.topologicalSort(graph);
      
      expect(sorted[0]).toBe(toolCalls[0]); // drive-read first
      expect(sorted[1]).toBe(toolCalls[1]); // drive-write second
    });

    it('should handle circular dependencies', () => {
      const toolCalls = [
        { tool: 'tool-a', args: {} },
        { tool: 'tool-b', args: {} }
      ];

      // Manually create circular dependency
      const graph = new Map();
      graph.set(toolCalls[0], { dependencies: [toolCalls[1]], dependents: [toolCalls[1]] });
      graph.set(toolCalls[1], { dependencies: [toolCalls[0]], dependents: [toolCalls[0]] });

      expect(() => executor.topologicalSort(graph)).toThrow('Circular dependency detected');
    });
  });

  describe('Batch Grouping', () => {
    it('should group independent tools into batches', () => {
      const toolCalls = [
        { tool: 'web-fetch', args: { url: 'https://example.com' } },
        { tool: 'd1-query', args: { query: 'SELECT * FROM tasks' } },
        { tool: 'memory-search', args: { query: 'test' } }
      ];

      const graph = executor.buildDependencyGraph(toolCalls);
      const sorted = executor.topologicalSort(graph);
      const batches = executor.groupIntoBatches(sorted);
      
      expect(batches.length).toBe(1);
      expect(batches[0].length).toBe(3);
    });

    it('should respect max parallel limit', () => {
      const toolCalls = Array.from({ length: 10 }, (_, i) => ({
        tool: 'web-fetch',
        args: { url: `https://example${i}.com` }
      }));

      const graph = executor.buildDependencyGraph(toolCalls);
      const sorted = executor.topologicalSort(graph);
      const batches = executor.groupIntoBatches(sorted);
      
      expect(batches.length).toBeGreaterThan(1);
      expect(batches[0].length).toBeLessThanOrEqual(5);
    });

    it('should separate dependent tools into different batches', () => {
      const toolCalls = [
        { tool: 'drive-read', args: { fileId: '123' } },
        { tool: 'drive-write', args: { fileName: 'test.txt' } }
      ];

      const graph = executor.buildDependencyGraph(toolCalls);
      const sorted = executor.topologicalSort(graph);
      const batches = executor.groupIntoBatches(sorted);
      
      expect(batches.length).toBe(2);
      expect(batches[0]).toContain(toolCalls[0]);
      expect(batches[1]).toContain(toolCalls[1]);
    });
  });

  describe('Batch Execution', () => {
    it('should execute batch in parallel', async () => {
      const batch = [
        { tool: 'web-fetch', args: { url: 'https://example.com' } },
        { tool: 'd1-query', args: { query: 'SELECT * FROM tasks' } }
      ];

      const results = await executor.executeBatch(batch, mockUseTool);
      
      expect(results.length).toBe(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
      expect(mockUseTool).toHaveBeenCalledTimes(2);
    });

    it('should handle tool errors in batch', async () => {
      mockUseTool.mockImplementationOnce(async () => {
        throw new Error('Tool failed');
      });

      const batch = [
        { tool: 'web-fetch', args: { url: 'https://example.com' } },
        { tool: 'd1-query', args: { query: 'SELECT * FROM tasks' } }
      ];

      const results = await executor.executeBatch(batch, mockUseTool);
      
      expect(results.length).toBe(2);
      expect(results[0].success).toBe(false);
      expect(results[1].success).toBe(true);
    });
  });

  describe('Full Execution', () => {
    it('should execute single tool directly', async () => {
      const toolCalls = [
        { tool: 'web-fetch', args: { url: 'https://example.com' } }
      ];

      const result = await executor.execute(toolCalls, mockUseTool);
      
      expect(result).toContain('[Result: web-fetch]');
      expect(mockUseTool).toHaveBeenCalledTimes(1);
    });

    it('should execute multiple tools in parallel', async () => {
      const toolCalls = [
        { tool: 'web-fetch', args: { url: 'https://example.com' } },
        { tool: 'd1-query', args: { query: 'SELECT * FROM tasks' } },
        { tool: 'memory-search', args: { query: 'test' } }
      ];

      const result = await executor.execute(toolCalls, mockUseTool);
      
      expect(result).toContain('[Result: web-fetch]');
      expect(result).toContain('[Result: d1-query]');
      expect(result).toContain('[Result: memory-search]');
      expect(mockUseTool).toHaveBeenCalledTimes(3);
    });

    it('should fallback to sequential on error', async () => {
      // Mock executeBatch to fail
      vi.spyOn(executor, 'executeBatch').mockRejectedValue(new Error('Parallel execution failed'));

      const toolCalls = [
        { tool: 'web-fetch', args: { url: 'https://example.com' } },
        { tool: 'd1-query', args: { query: 'SELECT * FROM tasks' } }
      ];

      const result = await executor.execute(toolCalls, mockUseTool);
      
      // Should fallback to sequential and still execute tools
      expect(result).toContain('[Result: web-fetch]');
      expect(result).toContain('[Result: d1-query]');
    });
  });

  describe('Sequential Fallback', () => {
    it('should execute tools sequentially', async () => {
      const toolCalls = [
        { tool: 'web-fetch', args: { url: 'https://example.com' } },
        { tool: 'd1-query', args: { query: 'SELECT * FROM tasks' } }
      ];

      const result = await executor.executeSequential(toolCalls, mockUseTool);
      
      expect(result).toContain('[Result: web-fetch]');
      expect(result).toContain('[Result: d1-query]');
      expect(mockUseTool).toHaveBeenCalledTimes(2);
    });

    it('should handle errors in sequential execution', async () => {
      mockUseTool.mockImplementationOnce(async () => {
        throw new Error('Tool failed');
      });

      const toolCalls = [
        { tool: 'web-fetch', args: { url: 'https://example.com' } },
        { tool: 'd1-query', args: { query: 'SELECT * FROM tasks' } }
      ];

      const result = await executor.executeSequential(toolCalls, mockUseTool);
      
      expect(result).toContain('[Error: web-fetch]');
      expect(result).toContain('[Result: d1-query]');
    });
  });
});
