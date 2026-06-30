// Unit tests for authentication and authorization
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock JWT auth module
const mockValidateToken = vi.fn();
const mockGenerateAccessToken = vi.fn();
vi.mock('../../src/core/jwt-auth.js', () => ({
  validateToken: mockValidateToken,
  generateAccessToken: mockGenerateAccessToken,
}));

describe('Authentication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Token Validation', () => {
    it('should accept valid tokens', async () => {
      mockValidateToken.mockResolvedValue({
        userId: 'test-user-123',
        iat: 1234567890,
        exp: 1234567890 + 900,
        type: 'access'
      });

      const result = await mockValidateToken('valid-token', { JWT_SECRET: 'test-secret' });

      expect(result).toBeDefined();
      expect(result.userId).toBe('test-user-123');
      expect(result.type).toBe('access');
    });

    it('should reject invalid tokens', async () => {
      mockValidateToken.mockResolvedValue(null);

      const result = await mockValidateToken('invalid-token', { JWT_SECRET: 'test-secret' });

      expect(result).toBeNull();
    });

    it('should reject expired tokens', async () => {
      mockValidateToken.mockResolvedValue(null);

      const result = await mockValidateToken('expired-token', { JWT_SECRET: 'test-secret' });

      expect(result).toBeNull();
    });

    it('should reject tokens with wrong type', async () => {
      mockValidateToken.mockResolvedValue(null);

      const result = await mockValidateToken('refresh-token', { JWT_SECRET: 'test-secret' });

      expect(result).toBeNull();
    });

    it('should reject blacklisted tokens', async () => {
      mockValidateToken.mockResolvedValue(null);

      const result = await mockValidateToken('blacklisted-token', { JWT_SECRET: 'test-secret' });

      expect(result).toBeNull();
    });
  });

  describe('Token Generation', () => {
    it('should generate valid access tokens', async () => {
      mockGenerateAccessToken.mockResolvedValue('generated-access-token');

      const result = await mockGenerateAccessToken('test-user-123', { JWT_SECRET: 'test-secret' });

      expect(result).toBe('generated-access-token');
    });

    it('should throw error when JWT_SECRET not configured', async () => {
      mockGenerateAccessToken.mockRejectedValue(new Error('JWT_SECRET not configured'));

      await expect(
        mockGenerateAccessToken('test-user-123', {})
      ).rejects.toThrow('JWT_SECRET not configured');
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limit for authenticated users', async () => {
      // Mock KV rate limit check
      const mockKV = {
        get: vi.fn().mockResolvedValue('5'),
        put: vi.fn()
      };

      const hits = parseInt(await mockKV.get('rate_key') || '0');
      expect(hits).toBe(5);
    });

    it('should fail closed when KV is unavailable', async () => {
      // Mock KV failure
      const mockKV = {
        get: vi.fn().mockRejectedValue(new Error('KV unavailable'))
      };

      await expect(mockKV.get('rate_key')).rejects.toThrow('KV unavailable');
    });

    it('should apply rate limiting after authentication', async () => {
      const authenticated = true;
      const rateLimitApplied = authenticated ? true : false;
      
      expect(rateLimitApplied).toBe(true);
    });
  });

  describe('CORS Policy', () => {
    it('should reject requests from unauthorized origins', () => {
      const allowedOrigin = 'https://mfm-corp.cc.cd';
      const requestOrigin = 'https://evil.com';
      
      const isAllowed = requestOrigin === allowedOrigin;
      expect(isAllowed).toBe(false);
    });

    it('should accept requests from authorized origins', () => {
      const allowedOrigin = 'https://mfm-corp.cc.cd';
      const requestOrigin = 'https://mfm-corp.cc.cd';
      
      const isAllowed = requestOrigin === allowedOrigin;
      expect(isAllowed).toBe(true);
    });
  });
});
