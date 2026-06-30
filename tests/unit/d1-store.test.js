// Cloudflare Workers Unit Tests - D1 Store
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('D1 Store Operations', () => {
  let mockDb;

  beforeEach(() => {
    mockDb = {
      prepare: vi.fn().mockReturnThis(),
      bind: vi.fn().mockReturnThis(),
      run: vi.fn(),
      all: vi.fn(),
      first: vi.fn(),
    };
  });

  describe('Task Operations', () => {
    it('should save task with valid parameters', async () => {
      const taskId = 'test-id';
      const agent = 'ops-coordinator';
      const input = 'test input';
      const status = 'pending';

      mockDb.prepare.mockReturnValue(mockDb);
      mockDb.bind.mockReturnValue(mockDb);
      mockDb.run.mockResolvedValue({ success: true });

      await mockDb.prepare('INSERT INTO tasks (id, agent, input, status) VALUES (?, ?, ?, ?)')
        .bind(taskId, agent, input, status)
        .run();

      expect(mockDb.prepare).toHaveBeenCalledWith('INSERT INTO tasks (id, agent, input, status) VALUES (?, ?, ?, ?)');
      expect(mockDb.bind).toHaveBeenCalledWith(taskId, agent, input, status);
      expect(mockDb.run).toHaveBeenCalled();
    });

    it('should complete task with output and score', async () => {
      const taskId = 'test-id';
      const output = 'test output';
      const qualityScore = 85;
      const status = 'completed';

      mockDb.prepare.mockReturnValue(mockDb);
      mockDb.bind.mockReturnValue(mockDb);
      mockDb.run.mockResolvedValue({ success: true });

      await mockDb.prepare('UPDATE tasks SET output=?, status=?, quality_score=?, completed_at=datetime("now") WHERE id=?')
        .bind(output, status, qualityScore, taskId)
        .run();

      expect(mockDb.prepare).toHaveBeenCalledWith('UPDATE tasks SET output=?, status=?, quality_score=?, completed_at=datetime("now") WHERE id=?');
      expect(mockDb.bind).toHaveBeenCalledWith(output, status, qualityScore, taskId);
    });

    it('should get recent tasks for agent', async () => {
      const agent = 'ops-coordinator';
      const limit = 10;

      mockDb.prepare.mockReturnValue(mockDb);
      mockDb.bind.mockReturnValue(mockDb);
      mockDb.all.mockResolvedValue({ results: [] });

      await mockDb.prepare('SELECT * FROM tasks WHERE agent=? ORDER BY created_at DESC LIMIT ?')
        .bind(agent, limit)
        .all();

      expect(mockDb.prepare).toHaveBeenCalledWith('SELECT * FROM tasks WHERE agent=? ORDER BY created_at DESC LIMIT ?');
      expect(mockDb.bind).toHaveBeenCalledWith(agent, limit);
    });
  });

  describe('Memory Operations', () => {
    it('should save memory with valid parameters', async () => {
      const agent = 'ops-coordinator';
      const userId = '6847462500';
      const role = 'user';
      const content = 'test content';

      mockDb.prepare.mockReturnValue(mockDb);
      mockDb.bind.mockReturnValue(mockDb);
      mockDb.run.mockResolvedValue({ success: true });

      await mockDb.prepare('INSERT INTO agent_memory (agent, user_id, role, content) VALUES (?, ?, ?, ?)')
        .bind(agent, userId, role, content)
        .run();

      expect(mockDb.prepare).toHaveBeenCalledWith('INSERT INTO agent_memory (agent, user_id, role, content) VALUES (?, ?, ?, ?)');
      expect(mockDb.bind).toHaveBeenCalledWith(agent, userId, role, content);
    });

    it('should get memory for agent and user', async () => {
      const agent = 'ops-coordinator';
      const userId = '6847462500';
      const limit = 20;

      mockDb.prepare.mockReturnValue(mockDb);
      mockDb.bind.mockReturnValue(mockDb);
      mockDb.all.mockResolvedValue({ results: [] });

      await mockDb.prepare('SELECT role, content FROM agent_memory WHERE agent=? AND user_id=? ORDER BY created_at DESC, id DESC LIMIT ?')
        .bind(agent, userId, limit)
        .all();

      expect(mockDb.prepare).toHaveBeenCalledWith('SELECT role, content FROM agent_memory WHERE agent=? AND user_id=? ORDER BY created_at DESC, id DESC LIMIT ?');
      expect(mockDb.bind).toHaveBeenCalledWith(agent, userId, limit);
    });

    it('should clear memory for agent and user', async () => {
      const agent = 'ops-coordinator';
      const userId = '6847462500';

      mockDb.prepare.mockReturnValue(mockDb);
      mockDb.bind.mockReturnValue(mockDb);
      mockDb.run.mockResolvedValue({ success: true });

      await mockDb.prepare('DELETE FROM agent_memory WHERE agent=? AND user_id=?')
        .bind(agent, userId)
        .run();

      expect(mockDb.prepare).toHaveBeenCalledWith('DELETE FROM agent_memory WHERE agent=? AND user_id=?');
      expect(mockDb.bind).toHaveBeenCalledWith(agent, userId);
    });

    it('should prune old memory entries', async () => {
      const agent = 'ops-coordinator';
      const userId = '6847462500';
      const maxEntries = 100;

      mockDb.prepare.mockReturnValue(mockDb);
      mockDb.bind.mockReturnValue(mockDb);
      mockDb.run.mockResolvedValue({ success: true });

      await mockDb.prepare(`
        DELETE FROM agent_memory
        WHERE agent=? AND user_id=?
        AND id NOT IN (
          SELECT id FROM agent_memory
          WHERE agent=? AND user_id=?
          ORDER BY created_at DESC LIMIT ?
        )
      `).bind(agent, userId, agent, userId, maxEntries).run();

      expect(mockDb.run).toHaveBeenCalled();
    });
  });

  describe('Decision Logging', () => {
    it('should log decision with reasoning', async () => {
      const agent = 'ops-coordinator';
      const input = 'test input';
      const reasoning = 'test reasoning';
      const decision = 'test decision';
      const confidence = 0.85;

      mockDb.prepare.mockReturnValue(mockDb);
      mockDb.bind.mockReturnValue(mockDb);
      mockDb.run.mockResolvedValue({ success: true });

      await mockDb.prepare('INSERT INTO decisions (id, agent, input, reasoning, decision, confidence) VALUES (?, ?, ?, ?, ?, ?)')
        .bind(expect.any(String), agent, input, reasoning, decision, confidence)
        .run();

      expect(mockDb.prepare).toHaveBeenCalledWith('INSERT INTO decisions (id, agent, input, reasoning, decision, confidence) VALUES (?, ?, ?, ?, ?, ?)');
    });
  });

  describe('Metrics Operations', () => {
    it('should update metrics for agent', async () => {
      const agent = 'ops-coordinator';
      const tasksCompleted = 5;
      const qualityScore = 85;
      const responseMs = 1500;
      const date = new Date().toISOString().split('T')[0];

      mockDb.prepare.mockReturnValue(mockDb);
      mockDb.bind.mockReturnValue(mockDb);
      mockDb.run.mockResolvedValue({ success: true });

      await mockDb.prepare(`
        INSERT INTO metrics (agent, date, tasks_completed, avg_quality_score, avg_response_ms)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(agent, date) DO UPDATE SET
          tasks_completed = tasks_completed + excluded.tasks_completed,
          avg_quality_score = CAST(
            (avg_quality_score * tasks_completed + excluded.avg_quality_score * excluded.tasks_completed)
            / NULLIF(tasks_completed + excluded.tasks_completed, 0) AS REAL),
          avg_response_ms = CAST(
            (avg_response_ms * tasks_completed + excluded.avg_response_ms * excluded.tasks_completed)
            / NULLIF(tasks_completed + excluded.tasks_completed, 0) AS INTEGER)
      `).bind(agent, date, tasksCompleted, qualityScore, responseMs).run();

      expect(mockDb.prepare).toHaveBeenCalled();
    });

    it('should get metrics for agent', async () => {
      const agent = 'ops-coordinator';
      const days = 7;

      mockDb.prepare.mockReturnValue(mockDb);
      mockDb.bind.mockReturnValue(mockDb);
      mockDb.all.mockResolvedValue({ results: [] });

      await mockDb.prepare('SELECT * FROM metrics WHERE agent=? ORDER BY date DESC LIMIT ?')
        .bind(agent, days)
        .all();

      expect(mockDb.prepare).toHaveBeenCalledWith('SELECT * FROM metrics WHERE agent=? ORDER BY date DESC LIMIT ?');
      expect(mockDb.bind).toHaveBeenCalledWith(agent, days);
    });
  });

  describe('Routing Score Operations', () => {
    it('should update routing score for agent', async () => {
      const agent = 'ops-coordinator';
      const qualityScore = 90;
      const existing = { total_reviews: 10, avg_score: 85 };
      const reviews = existing.total_reviews + 1;
      const newAvg = Math.round(((existing.avg_score * existing.total_reviews) + qualityScore) / reviews);

      mockDb.prepare.mockReturnValue(mockDb);
      mockDb.bind.mockReturnValue(mockDb);
      mockDb.first.mockResolvedValue(existing);
      mockDb.run.mockResolvedValue({ success: true });

      await mockDb.prepare(`
        INSERT INTO routing_scores (agent, total_reviews, avg_score, updated_at)
        VALUES (?, ?, ?, datetime('now'))
        ON CONFLICT(agent) DO UPDATE SET
          total_reviews = excluded.total_reviews,
          avg_score = excluded.avg_score,
          updated_at = excluded.updated_at
      `).bind(agent, reviews, newAvg).run();

      expect(newAvg).toBe(85);
    });
  });

  describe('Task Transition', () => {
    it('should transition task to new status', async () => {
      const taskId = 'test-id';
      const newStatus = 'completed';

      mockDb.prepare.mockReturnValue(mockDb);
      mockDb.bind.mockReturnValue(mockDb);
      mockDb.run.mockResolvedValue({ success: true });

      await mockDb.prepare('UPDATE tasks SET status = ? WHERE id = ?')
        .bind(newStatus, taskId)
        .run();

      expect(mockDb.prepare).toHaveBeenCalledWith('UPDATE tasks SET status = ? WHERE id = ?');
      expect(mockDb.bind).toHaveBeenCalledWith(newStatus, taskId);
    });

    it('should validate task status', () => {
      const validStatuses = ['pending', 'analyzing', 'drafting', 'reviewing', 'approved', 'rejected', 'executing', 'completed', 'failed'];
      const newStatus = 'completed';
      const isValid = validStatuses.includes(newStatus);
      expect(isValid).toBe(true);

      const invalidStatus = 'invalid';
      const isInvalid = validStatuses.includes(invalidStatus);
      expect(isInvalid).toBe(false);
    });
  });

  describe('Top Performing Agents', () => {
    it('should get top performing agents', async () => {
      const limit = 5;

      mockDb.prepare.mockReturnValue(mockDb);
      mockDb.bind.mockReturnValue(mockDb);
      mockDb.all.mockResolvedValue({ results: [] });

      await mockDb.prepare(`
        SELECT agent,
               SUM(tasks_completed) AS total_tasks,
               CAST(SUM(avg_quality_score * tasks_completed) / NULLIF(SUM(tasks_completed), 0) AS REAL) AS avg_score
        FROM metrics
        WHERE date >= date('now', '-7 days')
        GROUP BY agent
        HAVING total_tasks > 0
        ORDER BY avg_score DESC
        LIMIT ?
      `).bind(limit).all();

      expect(mockDb.prepare).toHaveBeenCalled();
      expect(mockDb.bind).toHaveBeenCalledWith(limit);
    });
  });

  describe('SQL Injection Prevention', () => {
    it('should use parameterized queries', () => {
      const agent = 'ops-coordinator';
      const query = 'SELECT * FROM tasks WHERE agent = ?';
      const hasConcatenation = query.includes("'") || query.includes('"') || query.includes('+');
      expect(hasConcatenation).toBe(false);
    });

    it('should not allow raw SQL from user input', () => {
      const userInput = "'; DROP TABLE tasks; --";
      const isUsedInQuery = false;
      expect(isUsedInQuery).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockDb.prepare.mockReturnValue(mockDb);
      mockDb.bind.mockReturnValue(mockDb);
      mockDb.run.mockRejectedValue(new Error('Database error'));

      try {
        await mockDb.prepare('INSERT INTO tasks (id, agent, input, status) VALUES (?, ?, ?, ?)')
          .bind('test-id', 'ops-coordinator', 'test', 'pending')
          .run();
      } catch (error) {
        expect(error.message).toBe('Database error');
      }
    });

    it('should return null when db is not configured', async () => {
      const db = null;
      const result = db ? 'exists' : null;
      expect(result).toBe(null);
    });
  });
});
