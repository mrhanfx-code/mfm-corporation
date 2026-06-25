import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MultiModelManager } from '../../src/core/multi-model-support.js';

describe('MultiModelManager', () => {
  let manager;
  let mockEnv;

  beforeEach(() => {
    mockEnv = { test: 'env' };
    manager = new MultiModelManager(mockEnv);
    vi.clearAllMocks();
  });

  it('should register a model', () => {
    const config = {
      name: 'Test Model',
      provider: 'anthropic',
      endpoint: 'https://api.anthropic.com',
      apiKey: 'test-key',
      maxTokens: 4096,
      temperature: 0.7,
      capabilities: ['general-purpose'],
      costPerToken: 0.0001,
      priority: 'high'
    };

    const model = manager.registerModel('test-model', config);

    expect(model).toBeDefined();
    expect(model.id).toBe('test-model');
    expect(model.name).toBe('Test Model');
    expect(model.provider).toBe('anthropic');
    expect(model.available).toBe(true);
  });

  it('should get registered model', () => {
    manager.registerModel('test-model', { name: 'Test Model' });

    const model = manager.getModel('test-model');

    expect(model).toBeDefined();
    expect(model.id).toBe('test-model');
  });

  it('should return null for non-existent model', () => {
    const model = manager.getModel('non-existent');

    expect(model).toBeNull();
  });

  it('should get all models', () => {
    manager.registerModel('model-1', { name: 'Model 1' });
    manager.registerModel('model-2', { name: 'Model 2' });

    const models = manager.getAllModels();

    expect(models.length).toBe(2);
  });

  it('should get available models only', () => {
    manager.registerModel('model-1', { name: 'Model 1', available: true });
    manager.registerModel('model-2', { name: 'Model 2', available: false });

    const available = manager.getAvailableModels();

    expect(available.length).toBe(1);
    expect(available[0].id).toBe('model-1');
  });

  it('should set default model', () => {
    manager.registerModel('test-model', { name: 'Test Model' });

    const model = manager.setDefaultModel('test-model');

    expect(manager.defaultModel).toBe('test-model');
    expect(model.id).toBe('test-model');
  });

  it('should get default model', () => {
    manager.registerModel('test-model', { name: 'Test Model' });
    manager.setDefaultModel('test-model');

    const model = manager.getDefaultModel();

    expect(model).toBeDefined();
    expect(model.id).toBe('test-model');
  });

  it('should estimate tokens', () => {
    const text = 'This is a test message for token estimation';

    const tokens = manager.estimateTokens(text);

    expect(tokens).toBeGreaterThan(0);
    expect(tokens).toBe(Math.ceil(text.length / 4));
  });

  it('should update model availability', () => {
    manager.registerModel('test-model', { name: 'Test Model', available: true });

    const model = manager.updateModelAvailability('test-model', false);

    expect(model.available).toBe(false);
  });

  it('should get cost estimate', () => {
    manager.registerModel('test-model', { name: 'Test Model', costPerToken: 0.0001 });

    const estimate = manager.getCostEstimate('test-model', 1000, 500);

    expect(estimate.modelId).toBe('test-model');
    expect(estimate.promptTokens).toBe(1000);
    expect(estimate.completionTokens).toBe(500);
    expect(estimate.totalTokens).toBe(1500);
    expect(estimate.estimatedCost).toBe(0.15);
  });

  it('should select best model for task type', () => {
    manager.registerModel('model-1', {
      name: 'Model 1',
      capabilities: ['code-generation'],
      priority: 'high',
      available: true
    });
    manager.registerModel('model-2', {
      name: 'Model 2',
      capabilities: ['general-purpose'],
      priority: 'medium',
      available: true
    });

    const bestModel = manager.selectBestModel('coding', {});

    expect(bestModel).toBeDefined();
    expect(bestModel.id).toBe('model-1');
  });

  it('should get model stats', () => {
    manager.registerModel('test-model', { name: 'Test Model' });

    const stats = manager.getModelStats('test-model');

    expect(stats).toBeDefined();
    expect(stats.calls).toBe(0);
    expect(stats.tokens).toBe(0);
    expect(stats.errors).toBe(0);
  });

  it('should get all model stats', () => {
    manager.registerModel('model-1', { name: 'Model 1' });
    manager.registerModel('model-2', { name: 'Model 2' });

    const stats = manager.getAllModelStats();

    expect(Object.keys(stats).length).toBe(2);
    expect(stats['model-1']).toBeDefined();
    expect(stats['model-2']).toBeDefined();
  });

  it('should find fallback model', () => {
    manager.registerModel('primary', {
      name: 'Primary',
      provider: 'anthropic',
      priority: 'high',
      available: true
    });
    manager.registerModel('fallback', {
      name: 'Fallback',
      provider: 'anthropic',
      priority: 'medium',
      available: true
    });

    const fallback = manager.findFallbackModel('primary');

    expect(fallback).toBeDefined();
    expect(fallback.id).toBe('fallback');
  });

  it('should return null when no fallback available', () => {
    manager.registerModel('primary', {
      name: 'Primary',
      provider: 'anthropic',
      priority: 'high',
      available: true
    });

    const fallback = manager.findFallbackModel('primary');

    expect(fallback).toBeNull();
  });
});
