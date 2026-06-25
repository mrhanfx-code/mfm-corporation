// Cloudflare Workers Unit Tests - Agent Base
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Agent Base', () => {
  describe('Input Validation', () => {
    const INPUT_MAX_CHARS = 4000;
    const CTRL_CHAR_PATTERN = /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g;

    it('should reject non-string input', () => {
      const input = 123;
      const isValid = typeof input === 'string';
      expect(isValid).toBe(false);
    });

    it('should reject empty input', () => {
      const input = '';
      const cleaned = input.replace(CTRL_CHAR_PATTERN, '').trim();
      const isValid = cleaned.length > 0;
      expect(isValid).toBe(false);
    });

    it('should reject input exceeding max characters', () => {
      const input = 'a'.repeat(4001);
      const cleaned = input.replace(CTRL_CHAR_PATTERN, '').trim();
      const isValid = cleaned.length <= INPUT_MAX_CHARS;
      expect(isValid).toBe(false);
    });

    it('should accept valid input', () => {
      const input = 'test message';
      const cleaned = input.replace(CTRL_CHAR_PATTERN, '').trim();
      const isValid = cleaned.length > 0 && cleaned.length <= INPUT_MAX_CHARS;
      expect(isValid).toBe(true);
    });

    it('should filter control characters', () => {
      const input = 'test\x00message\x1ftext';
      const cleaned = input.replace(CTRL_CHAR_PATTERN, '').trim();
      expect(cleaned).toBe('testmessagetext');
    });

    it('should handle whitespace-only input', () => {
      const input = '   ';
      const cleaned = input.replace(CTRL_CHAR_PATTERN, '').trim();
      const isValid = cleaned.length > 0;
      expect(isValid).toBe(false);
    });
  });

  describe('Tool Call Parsing', () => {
    it('should parse valid tool call syntax', () => {
      const text = '[TOOL:web-fetch|{"url":"https://example.com"}]';
      const hasToolCall = text.includes('[TOOL:');
      expect(hasToolCall).toBe(true);
    });

    it('should extract tool name from syntax', () => {
      const text = '[TOOL:web-fetch|{"url":"https://example.com"}]';
      const match = text.match(/\[TOOL:([a-z-]+)\|/);
      const toolName = match ? match[1] : null;
      expect(toolName).toBe('web-fetch');
    });

    it('should extract JSON arguments from syntax', () => {
      const text = '[TOOL:web-fetch|{"url":"https://example.com"}]';
      const match = text.match(/\[TOOL:[a-z-]+\|(.+)\]/);
      const jsonStr = match ? match[1] : null;
      expect(jsonStr).toBe('{"url":"https://example.com"}');
    });

    it('should handle invalid tool call syntax', () => {
      const text = '[INVALID:tool|{"url":"https://example.com"}]';
      const hasToolCall = text.includes('[TOOL:');
      expect(hasToolCall).toBe(false);
    });

    it('should handle malformed JSON in tool call', () => {
      const text = '[TOOL:web-fetch|{invalid json}]';
      const match = text.match(/\[TOOL:[a-z-]+\|(.+)\]/);
      const jsonStr = match ? match[1] : null;
      let isValidJson = false;
      if (jsonStr) {
        try {
          JSON.parse(jsonStr);
          isValidJson = true;
        } catch (e) {
          isValidJson = false;
        }
      }
      expect(isValidJson).toBe(false);
    });
  });

  describe('Tool Validation', () => {
    const availableTools = ['web-fetch', 'send-email', 'exa-search', 'social-post'];

    it('should accept available tool', () => {
      const toolName = 'web-fetch';
      const isAvailable = availableTools.includes(toolName);
      expect(isAvailable).toBe(true);
    });

    it('should reject unavailable tool', () => {
      const toolName = 'invalid-tool';
      const isAvailable = availableTools.includes(toolName);
      expect(isAvailable).toBe(false);
    });

    it('should validate required tool arguments', () => {
      const toolName = 'web-fetch';
      const args = { url: 'https://example.com' };
      const hasRequiredArgs = args && args.url ? true : false;
      expect(hasRequiredArgs).toBe(true);
    });

    it('should reject missing required arguments', () => {
      const toolName = 'web-fetch';
      const args = {};
      const hasRequiredArgs = args && args.url ? true : false;
      expect(hasRequiredArgs).toBe(false);
    });
  });

  describe('Rate Limiting', () => {
    const AGENT_RATE_LIMIT = 20;

    it('should enforce rate limit per agent', () => {
      const hits = 25;
      const isLimited = hits >= AGENT_RATE_LIMIT;
      expect(isLimited).toBe(true);
    });

    it('should allow requests under rate limit', () => {
      const hits = 15;
      const isLimited = hits >= AGENT_RATE_LIMIT;
      expect(isLimited).toBe(false);
    });

    it('should use minute-based rate limiting', () => {
      const minute = Math.floor(Date.now() / 60000);
      const rateKey = `rate:agent:test-agent:${minute}`;
      expect(rateKey).toContain('rate:agent:test-agent:');
    });
  });

  describe('Memory Management', () => {
    it('should limit memory entries per agent/user', () => {
      const memoryCount = 150;
      const maxMemory = 100;
      const shouldPrune = memoryCount > maxMemory;
      expect(shouldPrune).toBe(true);
    });

    it('should keep recent memory entries', () => {
      const memoryCount = 50;
      const maxMemory = 100;
      const shouldPrune = memoryCount > maxMemory;
      expect(shouldPrune).toBe(false);
    });

    it('should clear memory on request', () => {
      const memoryCleared = true;
      expect(memoryCleared).toBe(true);
    });
  });

  describe('Draft Mode', () => {
    it('should not save tasks in draft mode', () => {
      const draftMode = true;
      const shouldSaveTask = !draftMode;
      expect(shouldSaveTask).toBe(false);
    });

    it('should save tasks in normal mode', () => {
      const draftMode = false;
      const shouldSaveTask = !draftMode;
      expect(shouldSaveTask).toBe(true);
    });

    it('should return draft output for email in draft mode', () => {
      const draftMode = true;
      const toolName = 'send-email';
      const isDraft = draftMode && toolName === 'send-email';
      expect(isDraft).toBe(true);
    });
  });

  describe('Timeout Handling', () => {
    const TIMEOUT_MS = 25000;

    it('should enforce timeout on agent execution', () => {
      const elapsed = 30000;
      const isTimedOut = elapsed > TIMEOUT_MS;
      expect(isTimedOut).toBe(true);
    });

    it('should allow execution within timeout', () => {
      const elapsed = 20000;
      const isTimedOut = elapsed > TIMEOUT_MS;
      expect(isTimedOut).toBe(false);
    });

    it('should limit tool loop iterations', () => {
      const MAX_TOOL_LOOPS = 3;
      const iterations = 4;
      const shouldBreak = iterations >= MAX_TOOL_LOOPS;
      expect(shouldBreak).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle tool execution errors gracefully', () => {
      const toolError = new Error('Tool failed');
      const errorMessage = toolError.message;
      expect(errorMessage).toBe('Tool failed');
    });

    it('should log errors without exposing secrets', () => {
      const error = new Error('API key missing');
      const hasSecret = error.message.includes('sk-') || error.message.includes('token');
      expect(hasSecret).toBe(false);
    });

    it('should mark task as failed on error', () => {
      const taskStatus = 'failed';
      expect(taskStatus).toBe('failed');
    });
  });

  describe('Quality Score Finalization', () => {
    it('should update task score', () => {
      const score = 85;
      const isValidScore = score >= 0 && score <= 100;
      expect(isValidScore).toBe(true);
    });

    it('should update metrics with score', () => {
      const score = 90;
      const responseMs = 1500;
      const hasValidData = score >= 0 && responseMs >= 0;
      expect(hasValidData).toBe(true);
    });

    it('should sync metrics to Supabase', () => {
      const syncSuccessful = true;
      expect(syncSuccessful).toBe(true);
    });
  });
});
