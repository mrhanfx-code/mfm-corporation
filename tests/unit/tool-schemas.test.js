import { describe, it, expect } from 'vitest';
import { validateToolCall, getToolSchema, listToolNames } from '../../src/core/tool-schemas.js';

describe('ToolSchemas', () => {
  describe('validateToolCall', () => {
    it('should validate web-fetch with valid URL', () => {
      const result = validateToolCall('web-fetch', { url: 'https://example.com' });
      expect(result.url).toBe('https://example.com');
    });

    it('should reject web-fetch with invalid URL', () => {
      expect(() => validateToolCall('web-fetch', { url: 'not-a-url' })).toThrow('Invalid URL format');
    });

    it('should validate send-email with valid email', () => {
      const result = validateToolCall('send-email', {
        to: 'test@example.com',
        subject: 'Test',
        body: 'Test body'
      });
      expect(result.to).toBe('test@example.com');
    });

    it('should reject send-email with invalid email', () => {
      expect(() => validateToolCall('send-email', {
        to: 'not-an-email',
        subject: 'Test',
        body: 'Test body'
      })).toThrow('Invalid email address');
    });

    it('should validate social-post with valid platform', () => {
      const result = validateToolCall('social-post', { platform: 'instagram' });
      expect(result.platform).toBe('instagram');
    });

    it('should reject social-post with invalid platform', () => {
      expect(() => validateToolCall('social-post', { platform: 'invalid' })).toThrow('Invalid enum value');
    });

    it('should validate memory-search with valid query', () => {
      const result = validateToolCall('memory-search', { query: 'test query' });
      expect(result.query).toBe('test query');
    });

    it('should reject memory-search with empty query', () => {
      expect(() => validateToolCall('memory-search', { query: '' })).toThrow('Query cannot be empty');
    });

    it('should validate calendar-create with valid datetime', () => {
      const result = validateToolCall('calendar-create', {
        summary: 'Meeting',
        startDatetime: '2026-05-29T10:00:00',
        endDatetime: '2026-05-29T11:00:00'
      });
      expect(result.summary).toBe('Meeting');
    });

    it('should reject calendar-create with invalid datetime format', () => {
      expect(() => validateToolCall('calendar-create', {
        summary: 'Meeting',
        startDatetime: 'invalid',
        endDatetime: '2026-05-29T11:00:00'
      })).toThrow('Invalid datetime format');
    });

    it('should validate github-push with valid parameters', () => {
      const result = validateToolCall('github-push', {
        repo: 'test-repo',
        path: 'src/index.js',
        content: 'console.log("hello");'
      });
      expect(result.repo).toBe('test-repo');
    });

    it('should reject github-push with missing required fields', () => {
      expect(() => validateToolCall('github-push', { repo: 'test-repo' })).toThrow();
    });

    it('should validate d1-query with valid query', () => {
      const result = validateToolCall('d1-query', { query: 'SELECT * FROM tasks' });
      expect(result.query).toBe('SELECT * FROM tasks');
    });

    it('should reject d1-query with empty query', () => {
      expect(() => validateToolCall('d1-query', { query: '' })).toThrow('Query cannot be empty');
    });

    it('should accept optional parameters', () => {
      const result = validateToolCall('web-fetch', {
        url: 'https://example.com',
        maxChars: 5000
      });
      expect(result.maxChars).toBe(5000);
    });

    it('should reject unknown tool', () => {
      expect(() => validateToolCall('unknown-tool', {})).toThrow('Unknown tool');
    });

    it('should coerce numeric parameters', () => {
      const result = validateToolCall('exa-search', {
        query: 'test',
        numResults: 5
      });
      expect(result.numResults).toBe(5);
    });

    it('should validate stripe-charges with valid limit', () => {
      const result = validateToolCall('stripe-charges', { limit: 10 });
      expect(result.limit).toBe(10);
    });

    it('should reject stripe-charges with invalid limit', () => {
      expect(() => validateToolCall('stripe-charges', { limit: 200 })).toThrow();
    });

    it('should validate memory-remember with valid content', () => {
      const result = validateToolCall('memory-remember', {
        content: 'Important information',
        importance: 'high'
      });
      expect(result.importance).toBe('high');
    });

    it('should reject memory-remember with invalid importance', () => {
      expect(() => validateToolCall('memory-remember', {
        content: 'Test',
        importance: 'invalid'
      })).toThrow();
    });
  });

  describe('getToolSchema', () => {
    it('should return schema for valid tool', () => {
      const schema = getToolSchema('web-fetch');
      expect(schema).toBeDefined();
    });

    it('should return null for unknown tool', () => {
      const schema = getToolSchema('unknown-tool');
      expect(schema).toBeNull();
    });
  });

  describe('listToolNames', () => {
    it('should return array of tool names', () => {
      const names = listToolNames();
      expect(Array.isArray(names)).toBe(true);
      expect(names.length).toBeGreaterThan(0);
      expect(names).toContain('web-fetch');
      expect(names).toContain('send-email');
      expect(names).toContain('memory-search');
    });
  });

  describe('Type Safety Verification', () => {
    it('should enforce string type for string parameters', () => {
      expect(() => validateToolCall('web-fetch', { url: 123 })).toThrow();
    });

    it('should enforce number type for numeric parameters', () => {
      expect(() => validateToolCall('exa-search', { query: 'test', numResults: 'invalid' })).toThrow();
    });

    it('should enforce array type for array parameters', () => {
      expect(() => validateToolCall('d1-query', { query: 'SELECT 1', params: 'not-array' })).toThrow();
    });

    it('should enforce enum values for enum parameters', () => {
      expect(() => validateToolCall('social-post', { platform: 'invalid-platform' })).toThrow();
    });

    it('should enforce min length constraints', () => {
      expect(() => validateToolCall('send-email', {
        to: 'test@example.com',
        subject: '',
        body: 'Test'
      })).toThrow('String must contain at least 1 character');
    });

    it('should enforce max length constraints', () => {
      const longString = 'a'.repeat(10000);
      expect(() => validateToolCall('send-email', {
        to: 'test@example.com',
        subject: longString,
        body: 'Test'
      })).toThrow('Subject must be 1-500 characters');
    });

    it('should enforce min value constraints', () => {
      expect(() => validateToolCall('exa-search', { query: 'test', numResults: 0 })).toThrow();
    });

    it('should enforce max value constraints', () => {
      expect(() => validateToolCall('exa-search', { query: 'test', numResults: 100 })).toThrow();
    });
  });
});
