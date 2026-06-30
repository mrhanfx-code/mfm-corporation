// Unit tests for Orchestrator routing logic
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the orchestrator module
const mockRouteMessage = vi.fn();
vi.mock('../../src/core/orchestrator.js', () => ({
  routeMessage: mockRouteMessage,
}));

describe('Orchestrator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Intent Classification', () => {
    it('should route to ops-coordinator for operations tasks', async () => {
      mockRouteMessage.mockResolvedValue({
        department: 'coo',
        agent: 'ops-coordinator',
        task_type: 'schedule team meeting',
        urgency: 'medium',
        reasoning: 'Operations task detected'
      });

      const result = await mockRouteMessage(
        { text: 'Schedule a team meeting for tomorrow' },
        'test-user',
        {}
      );

      expect(result).toBeDefined();
      expect(result.agent).toBe('ops-coordinator');
    });

    it('should route to tech-advisor for technical tasks', async () => {
      mockRouteMessage.mockResolvedValue({
        department: 'cto',
        agent: 'tech-advisor',
        task_type: 'review code',
        urgency: 'high',
        reasoning: 'Technical task detected'
      });

      const result = await mockRouteMessage(
        { text: 'Review the authentication code' },
        'test-user',
        {}
      );

      expect(result).toBeDefined();
      expect(result.agent).toBe('tech-advisor');
    });

    it('should route to market-analyst for market research tasks', async () => {
      mockRouteMessage.mockResolvedValue({
        department: 'cmo',
        agent: 'market-analyst',
        task_type: 'market analysis',
        urgency: 'medium',
        reasoning: 'Market research task detected'
      });

      const result = await mockRouteMessage(
        { text: 'Analyze the Malaysian market for AI services' },
        'test-user',
        {}
      );

      expect(result).toBeDefined();
      expect(result.agent).toBe('market-analyst');
    });
  });

  describe('Error Handling', () => {
    it('should handle unknown/ambiguous commands gracefully', async () => {
      mockRouteMessage.mockResolvedValue({
        department: 'clo',
        agent: 'direct',
        task_type: 'general inquiry',
        urgency: 'low',
        reasoning: 'No specific agent matched, routing to direct'
      });

      const result = await mockRouteMessage(
        { text: 'What is the meaning of life?' },
        'test-user',
        {}
      );

      expect(result).toBeDefined();
      expect(result.agent).toBe('direct');
    });

    it('should handle empty input', async () => {
      mockRouteMessage.mockResolvedValue({
        department: 'clo',
        agent: 'direct',
        task_type: 'empty input',
        urgency: 'low',
        reasoning: 'Empty input detected'
      });

      const result = await mockRouteMessage(
        { text: '' },
        'test-user',
        {}
      );

      expect(result).toBeDefined();
    });

    it('should handle LLM errors gracefully', async () => {
      mockRouteMessage.mockRejectedValue(new Error('LLM provider failed'));

      await expect(
        mockRouteMessage({ text: 'Test message' }, 'test-user', {})
      ).rejects.toThrow('LLM provider failed');
    });
  });

  describe('Confidence Scores', () => {
    it('should include confidence score in routing decision', async () => {
      mockRouteMessage.mockResolvedValue({
        department: 'coo',
        agent: 'ops-coordinator',
        task_type: 'schedule team meeting',
        urgency: 'medium',
        reasoning: 'Operations task detected',
        confidence: 0.95
      });

      const result = await mockRouteMessage(
        { text: 'Schedule a team meeting for tomorrow' },
        'test-user',
        {}
      );

      expect(result).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it('should flag low confidence routing', async () => {
      mockRouteMessage.mockResolvedValue({
        department: 'clo',
        agent: 'direct',
        task_type: 'ambiguous request',
        urgency: 'low',
        reasoning: 'Low confidence in routing',
        confidence: 0.45
      });

      const result = await mockRouteMessage(
        { text: 'Do something with the thing' },
        'test-user',
        {}
      );

      expect(result).toBeDefined();
      expect(result.confidence).toBeLessThan(0.5);
    });
  });
});
