import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRepo, createRepoAndPush } from '../src/tools/github-tool.js';

describe('GitHub Tool Security', () => {
  describe('createRepo', () => {
    it('should not log token presence', async () => {
      const env = { GITHUB_TOKEN: 'test-token' };
      const consoleSpy = vi.spyOn(console, 'log');
      
      await createRepo('test-repo', 'Test description', env);
      
      const logCalls = consoleSpy.mock.calls.map(call => call[0]);
      const hasTokenLog = logCalls.some(call => call.includes('hasToken'));
      
      expect(hasTokenLog).toBe(false);
      consoleSpy.mockRestore();
    });

    it('should log repo name without token info', async () => {
      const env = { GITHUB_TOKEN: 'test-token' };
      const consoleSpy = vi.spyOn(console, 'log');
      
      // Mock the fetch to avoid actual API call
      global.fetch = vi.fn(() => Promise.resolve({
        ok: true,
        status: 201,
        json: () => Promise.resolve({
          html_url: 'https://github.com/test/test-repo',
          clone_url: 'https://github.com/test/test-repo.git',
          full_name: 'test/test-repo'
        })
      }));
      
      await createRepo('test-repo', 'Test description', env);
      
      const logCalls = consoleSpy.mock.calls.map(call => call[0]);
      const nameLog = logCalls.some(call => call.includes('test-repo'));
      
      expect(nameLog).toBe(true);
      consoleSpy.mockRestore();
      global.fetch.mockRestore();
    });

    it('should return error when GITHUB_TOKEN not configured', async () => {
      const env = {};
      const result = await createRepo('test-repo', 'Test description', env);
      
      expect(result.error).toBe('GITHUB_TOKEN not configured.');
    });
  });

  describe('createRepoAndPush', () => {
    it('should not log token presence', async () => {
      const env = { GITHUB_TOKEN: 'test-token' };
      const consoleSpy = vi.spyOn(console, 'log');
      
      // Mock the functions to avoid actual API calls
      vi.mock('../src/tools/github-tool.js', () => ({
        createRepo: vi.fn(() => Promise.resolve({ url: 'https://github.com/test/test-repo' })),
        pushMultipleFiles: vi.fn(() => Promise.resolve({ success: 1, failed: 0 }))
      }));
      
      await createRepoAndPush('test-repo', 'Test description', [], env);
      
      const logCalls = consoleSpy.mock.calls.map(call => call[0]);
      const hasTokenLog = logCalls.some(call => call.includes('hasToken'));
      
      expect(hasTokenLog).toBe(false);
      consoleSpy.mockRestore();
    });
  });
});
