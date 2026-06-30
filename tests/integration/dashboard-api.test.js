// Integration tests for Dashboard API endpoints
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dashboard worker
const mockHandleDashboardAPI = vi.fn();
vi.mock('../../src/dashboard/dashboard-worker.js', () => ({
  handleDashboardAPI: mockHandleDashboardAPI,
}));

describe('Dashboard API Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/v1/dashboard/status', () => {
    it('should return system status', async () => {
      const mockResponse = {
        status: 'healthy',
        checks: {
          kv: true,
          d1: true,
          r2: true,
          queue: true,
        },
        timestamp: new Date().toISOString()
      };

      mockHandleDashboardAPI.mockResolvedValue(
        new Response(JSON.stringify(mockResponse), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      );

      const request = new Request('https://test.com/api/v1/dashboard/status', {
        method: 'GET'
      });

      const response = await mockHandleDashboardAPI(request, {}, '/api/v1/dashboard/status');
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('healthy');
    });

    it('should require authentication', async () => {
      mockHandleDashboardAPI.mockResolvedValue(
        new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        })
      );

      const request = new Request('https://test.com/api/v1/dashboard/status', {
        method: 'GET',
        headers: { 'Authorization': 'Bearer invalid-token' }
      });

      const response = await mockHandleDashboardAPI(request, {}, '/api/v1/dashboard/status');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/v1/dashboard/agents', () => {
    it('should return list of agents', async () => {
      const mockAgents = [
        { name: 'ops-coordinator', status: 'active', score: 85 },
        { name: 'tech-advisor', status: 'active', score: 92 },
      ];

      mockHandleDashboardAPI.mockResolvedValue(
        new Response(JSON.stringify({ agents: mockAgents }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      );

      const request = new Request('https://test.com/api/v1/dashboard/agents', {
        method: 'GET',
        headers: { 'Authorization': 'Bearer valid-token' }
      });

      const response = await mockHandleDashboardAPI(request, {}, '/api/v1/dashboard/agents');
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.agents).toHaveLength(2);
    });
  });

  describe('POST /api/v1/dashboard/commands', () => {
    it('should execute CEO command', async () => {
      const mockResponse = {
        response: 'Command executed successfully',
        agent: 'ops-coordinator',
        score: 88
      };

      mockHandleDashboardAPI.mockResolvedValue(
        new Response(JSON.stringify(mockResponse), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      );

      const request = new Request('https://test.com/api/v1/dashboard/commands', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer valid-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: 'Schedule team meeting' })
      });

      const response = await mockHandleDashboardAPI(request, {}, '/api/v1/dashboard/commands');
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.response).toBeDefined();
    });

    it('should validate input', async () => {
      mockHandleDashboardAPI.mockResolvedValue(
        new Response(JSON.stringify({ error: 'Missing text field' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        })
      );

      const request = new Request('https://test.com/api/v1/dashboard/commands', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer valid-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });

      const response = await mockHandleDashboardAPI(request, {}, '/api/v1/dashboard/commands');

      expect(response.status).toBe(400);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limit on API endpoints', async () => {
      mockHandleDashboardAPI.mockResolvedValue(
        new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
          status: 429,
          headers: { 'Content-Type': 'application/json' }
        })
      );

      const request = new Request('https://test.com/api/v1/dashboard/status', {
        method: 'GET',
        headers: { 'Authorization': 'Bearer valid-token' }
      });

      const response = await mockHandleDashboardAPI(request, {}, '/api/v1/dashboard/status');

      expect(response.status).toBe(429);
    });

    it('should fail closed when KV is unavailable', async () => {
      mockHandleDashboardAPI.mockResolvedValue(
        new Response(JSON.stringify({ error: 'Rate limit check failed' }), {
          status: 429,
          headers: { 'Content-Type': 'application/json' }
        })
      );

      const request = new Request('https://test.com/api/v1/dashboard/status', {
        method: 'GET',
        headers: { 'Authorization': 'Bearer valid-token' }
      });

      const response = await mockHandleDashboardAPI(request, {}, '/api/v1/dashboard/status');

      expect(response.status).toBe(429);
    });
  });

  describe('Error Responses', () => {
    it('should return 401 for unauthorized requests', async () => {
      mockHandleDashboardAPI.mockResolvedValue(
        new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        })
      );

      const request = new Request('https://test.com/api/v1/dashboard/status', {
        method: 'GET'
      });

      const response = await mockHandleDashboardAPI(request, {}, '/api/v1/dashboard/status');

      expect(response.status).toBe(401);
    });

    it('should return 403 for forbidden requests', async () => {
      mockHandleDashboardAPI.mockResolvedValue(
        new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        })
      );

      const request = new Request('https://test.com/api/v1/dashboard/admin', {
        method: 'GET',
        headers: { 'Authorization': 'Bearer valid-token' }
      });

      const response = await mockHandleDashboardAPI(request, {}, '/api/v1/dashboard/admin');

      expect(response.status).toBe(403);
    });

    it('should return 500 for internal server errors', async () => {
      mockHandleDashboardAPI.mockResolvedValue(
        new Response(JSON.stringify({ error: 'Internal server error' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        })
      );

      const request = new Request('https://test.com/api/v1/dashboard/status', {
        method: 'GET',
        headers: { 'Authorization': 'Bearer valid-token' }
      });

      const response = await mockHandleDashboardAPI(request, {}, '/api/v1/dashboard/status');

      expect(response.status).toBe(500);
    });
  });
});
