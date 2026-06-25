import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getCorsHeaders, authenticateRequest, checkRateLimit, sanitizeInput, validateCommandPayload } from '../src/dashboard/dashboard-worker.js';

describe('Dashboard API Security', () => {
  describe('CORS Headers', () => {
    it('should use DASHBOARD_ORIGIN from env if provided', () => {
      const env = { DASHBOARD_ORIGIN: 'https://custom.example.com' };
      const headers = getCorsHeaders(env);
      expect(headers['Access-Control-Allow-Origin']).toBe('https://custom.example.com');
    });

    it('should use default origin if DASHBOARD_ORIGIN not set', () => {
      const env = {};
      const headers = getCorsHeaders(env);
      expect(headers['Access-Control-Allow-Origin']).toBe('https://mfm-corp.cc.cd');
    });

    it('should include credentials support', () => {
      const env = {};
      const headers = getCorsHeaders(env);
      expect(headers['Access-Control-Allow-Credentials']).toBe('true');
    });
  });

  describe('Authentication', () => {
    it('should authenticate valid Bearer token', async () => {
      const env = { DASHBOARD_API_TOKEN: 'valid-token-123' };
      const request = {
        headers: {
          get: (header) => header === 'Authorization' ? 'Bearer valid-token-123' : null
        }
      };
      const result = await authenticateRequest(request, env);
      expect(result).toBe('valid-token-123');
    });

    it('should reject missing Authorization header', async () => {
      const env = { DASHBOARD_API_TOKEN: 'valid-token-123' };
      const request = {
        headers: {
          get: () => null
        }
      };
      const result = await authenticateRequest(request, env);
      expect(result).toBeNull();
    });

    it('should reject invalid Bearer token', async () => {
      const env = { DASHBOARD_API_TOKEN: 'valid-token-123' };
      const request = {
        headers: {
          get: (header) => header === 'Authorization' ? 'Bearer invalid-token' : null
        }
      };
      const result = await authenticateRequest(request, env);
      expect(result).toBeNull();
    });

    it('should reject non-Bearer auth', async () => {
      const env = { DASHBOARD_API_TOKEN: 'valid-token-123' };
      const request = {
        headers: {
          get: (header) => header === 'Authorization' ? 'Basic valid-token-123' : null
        }
      };
      const result = await authenticateRequest(request, env);
      expect(result).toBeNull();
    });

    it('should reject when DASHBOARD_API_TOKEN not configured', async () => {
      const env = {};
      const request = {
        headers: {
          get: (header) => header === 'Authorization' ? 'Bearer some-token' : null
        }
      };
      const result = await authenticateRequest(request, env);
      expect(result).toBeNull();
    });
  });

  describe('Input Sanitization', () => {
    it('should remove control characters', () => {
      const input = 'Hello\x00World\x1fTest';
      const result = sanitizeInput(input);
      expect(result).toBe('HelloWorldTest');
    });

    it('should limit input to 4000 characters', () => {
      const longInput = 'a'.repeat(5000);
      const result = sanitizeInput(longInput);
      expect(result.length).toBe(4000);
    });

    it('should trim whitespace', () => {
      const input = '  Hello World  ';
      const result = sanitizeInput(input);
      expect(result).toBe('Hello World');
    });

    it('should handle non-string input', () => {
      expect(sanitizeInput(123)).toBe('');
      expect(sanitizeInput(null)).toBe('');
      expect(sanitizeInput(undefined)).toBe('');
      expect(sanitizeInput({})).toBe('');
    });

    it('should handle empty string', () => {
      expect(sanitizeInput('')).toBe('');
    });
  });

  describe('Command Payload Validation', () => {
    it('should validate valid payload', () => {
      const body = {
        command_type: 'test_command',
        target: 'test_agent',
        payload: { task: 'test task' }
      };
      const result = validateCommandPayload(body);
      expect(result.valid).toBe(true);
      expect(result.sanitized.command_type).toBe('test_command');
      expect(result.sanitized.target).toBe('test_agent');
    });

    it('should reject missing command_type', () => {
      const body = {
        target: 'test_agent',
        payload: {}
      };
      const result = validateCommandPayload(body);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Missing or invalid command_type');
    });

    it('should reject missing target', () => {
      const body = {
        command_type: 'test_command',
        payload: {}
      };
      const result = validateCommandPayload(body);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Missing or invalid target');
    });

    it('should reject invalid payload type', () => {
      const body = 'invalid';
      const result = validateCommandPayload(body);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid payload');
    });

    it('should sanitize string payload', () => {
      const body = {
        command_type: 'test_command',
        target: 'test_agent',
        payload: 'Hello\x00World'
      };
      const result = validateCommandPayload(body);
      expect(result.valid).toBe(true);
      expect(result.sanitized.payload).toBe('HelloWorld');
    });

    it('should sanitize object payload strings', () => {
      const body = {
        command_type: 'test_command',
        target: 'test_agent',
        payload: { task: 'Test\x00Task', userId: 'user123' }
      };
      const result = validateCommandPayload(body);
      expect(result.valid).toBe(true);
      expect(result.sanitized.payload.task).toBe('TestTask');
    });
  });
});
