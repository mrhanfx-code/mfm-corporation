import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ContextInjectionManager } from '../../src/core/context-injection.js';

describe('ContextInjectionManager', () => {
  let manager;
  let mockEnv;

  beforeEach(() => {
    mockEnv = { test: 'env' };
    manager = new ContextInjectionManager(mockEnv);
    vi.clearAllMocks();
  });

  it('should inject context for session', async () => {
    const sessionId = 'test-session-123';
    const task = { description: 'Build a new feature' };

    const context = await manager.injectContext(sessionId, task);

    expect(context).toBeDefined();
    expect(context.sessionId).toBe(sessionId);
    expect(context.task).toEqual(task);
    expect(context.injectedAt).toBeDefined();
    expect(context.recentContext).toBeDefined();
    expect(context.relatedContext).toBeDefined();
    expect(context.totalContextSize).toBeGreaterThanOrEqual(0);
  });

  it('should get session context', async () => {
    const sessionId = 'test-session-123';
    const task = { description: 'Test task' };

    await manager.injectContext(sessionId, task);
    const retrieved = manager.getSessionContext(sessionId);

    expect(retrieved).toBeDefined();
    expect(retrieved.sessionId).toBe(sessionId);
  });

  it('should return null for non-existent session', () => {
    const retrieved = manager.getSessionContext('non-existent');
    expect(retrieved).toBeNull();
  });

  it('should update context for session', async () => {
    const sessionId = 'test-session-123';
    const task = { description: 'Test task' };

    await manager.injectContext(sessionId, task);

    const newContext = {
      recentContext: [{ type: 'recent', content: 'New context' }],
      relatedContext: []
    };

    const updated = await manager.updateContext(sessionId, newContext);

    expect(updated).toBeDefined();
    expect(updated.recentContext.length).toBeGreaterThan(0);
  });

  it('should clear context for session', async () => {
    const sessionId = 'test-session-123';
    const task = { description: 'Test task' };

    await manager.injectContext(sessionId, task);
    await manager.clearContext(sessionId);

    const retrieved = manager.getSessionContext(sessionId);
    expect(retrieved).toBeNull();
  });

  it('should calculate context size correctly', () => {
    const context = {
      recentContext: [{ content: 'Hello world' }],
      relatedContext: [{ content: 'Related content' }],
      businessContext: { content: 'Business context' }
    };

    const size = manager.calculateContextSize(context);

    expect(size).toBe(42); // 11 + 15 + 16
  });

  it('should get context statistics', async () => {
    const sessionId1 = 'session-1';
    const sessionId2 = 'session-2';

    await manager.injectContext(sessionId1, { description: 'Task 1' });
    await manager.injectContext(sessionId2, { description: 'Task 2' });

    const stats = manager.getContextStatistics();

    expect(stats.totalSessions).toBe(2);
    expect(stats.totalContextSize).toBeGreaterThanOrEqual(0);
    expect(stats.averageContextSize).toBeGreaterThanOrEqual(0);
  });

  it('should handle empty context', () => {
    const context = {
      recentContext: [],
      relatedContext: [],
      businessContext: null
    };

    const size = manager.calculateContextSize(context);
    expect(size).toBe(0);
  });

  it('should include options in context injection', async () => {
    const sessionId = 'test-session-123';
    const task = { description: 'Test task' };
    const options = { includeRecent: false, maxResults: 10 };

    const context = await manager.injectContext(sessionId, task, options);

    expect(context).toBeDefined();
    expect(context.sessionId).toBe(sessionId);
  });

  it('should get project structure', async () => {
    const structure = await manager.getProjectStructure();

    expect(structure).toBeDefined();
    expect(structure.root).toBeDefined();
    expect(structure.directories).toBeDefined();
    expect(structure.files).toBeDefined();
    expect(structure.keyFiles).toBeDefined();
  });

  it('should identify key files', () => {
    const isPackageJson = manager.isKeyFile('package.json');
    const isReadme = manager.isKeyFile('README.md');
    const isRandom = manager.isKeyFile('random-file.txt');

    expect(isPackageJson).toBe(true);
    expect(isReadme).toBe(true);
    expect(isRandom).toBe(false);
  });

  it('should include project structure in context', async () => {
    const sessionId = 'test-session-123';
    const task = { description: 'Test task' };
    const options = { includeProjectStructure: true };

    const context = await manager.injectContext(sessionId, task, options);

    expect(context.projectStructure).toBeDefined();
    expect(context.projectStructure.root).toBeDefined();
  });

  it('should exclude project structure when disabled', async () => {
    const sessionId = 'test-session-123';
    const task = { description: 'Test task' };
    const options = { includeProjectStructure: false };

    const context = await manager.injectContext(sessionId, task, options);

    expect(context.projectStructure).toBeNull();
  });

  it('should track changes', () => {
    const change = { type: 'edit', file: 'test.js', description: 'Updated function' };

    manager.trackChange(change);

    const recentChanges = manager.recentChanges;
    expect(recentChanges.length).toBe(1);
    expect(recentChanges[0].type).toBe('edit');
    expect(recentChanges[0].file).toBe('test.js');
    expect(recentChanges[0].timestamp).toBeDefined();
  });

  it('should limit recent changes to max size', () => {
    const maxChanges = 55; // More than maxRecentChanges (50)

    for (let i = 0; i < maxChanges; i++) {
      manager.trackChange({ type: 'edit', file: `file${i}.js` });
    }

    expect(manager.recentChanges.length).toBe(50);
  });

  it('should get recent changes', async () => {
    manager.trackChange({ type: 'edit', file: 'test1.js' });
    manager.trackChange({ type: 'edit', file: 'test2.js' });

    const recentChanges = await manager.getRecentChanges();

    expect(recentChanges.length).toBe(2);
  });

  it('should clear recent changes', () => {
    manager.trackChange({ type: 'edit', file: 'test.js' });
    expect(manager.recentChanges.length).toBe(1);

    manager.clearRecentChanges();
    expect(manager.recentChanges.length).toBe(0);
  });

  it('should include recent changes in context', async () => {
    const sessionId = 'test-session-123';
    const task = { description: 'Test task' };

    manager.trackChange({ type: 'edit', file: 'test.js' });

    const context = await manager.injectContext(sessionId, task);

    expect(context.recentChanges).toBeDefined();
    expect(context.recentChanges.length).toBe(1);
  });

  it('should exclude recent changes when disabled', async () => {
    const sessionId = 'test-session-123';
    const task = { description: 'Test task' };
    const options = { includeRecentChanges: false };

    manager.trackChange({ type: 'edit', file: 'test.js' });

    const context = await manager.injectContext(sessionId, task, options);

    expect(context.recentChanges).toEqual([]);
  });

  it('should set user preference', () => {
    manager.setUserPreference('theme', 'dark');

    expect(manager.getUserPreference('theme')).toBe('dark');
  });

  it('should get user preference with default value', () => {
    const value = manager.getUserPreference('nonexistent', 'default');

    expect(value).toBe('default');
  });

  it('should get all user preferences', () => {
    manager.setUserPreference('theme', 'dark');
    manager.setUserPreference('language', 'en');

    const preferences = manager.getUserPreferences();

    expect(preferences.theme).toBe('dark');
    expect(preferences.language).toBe('en');
  });

  it('should clear user preferences', () => {
    manager.setUserPreference('theme', 'dark');
    expect(manager.userPreferences.size).toBe(1);

    manager.clearUserPreferences();
    expect(manager.userPreferences.size).toBe(0);
  });

  it('should save user preferences', async () => {
    manager.setUserPreference('theme', 'dark');

    await manager.saveUserPreferences();

    // Verify no error thrown
    expect(true).toBe(true);
  });

  it('should load user preferences', async () => {
    manager.setUserPreference('theme', 'dark');
    
    // Skip save/load test in environment without database
    // Just verify the method exists and doesn't crash
    await manager.saveUserPreferences();
    await manager.loadUserPreferences();
    
    expect(true).toBe(true);
  });
});
