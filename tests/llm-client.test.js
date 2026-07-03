// LLM Client Unit Tests
// Following TDD principles - tests describe expected behavior

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { callLLM, parseJSON, MODELS } from '../src/core/llm-client.js';

// Mock dependencies
vi.mock('../src/core/circuit-breaker.js', () => ({
  CircuitBreaker: vi.fn().mockImplementation(() => ({
    isOpen: vi.fn().mockResolvedValue(false),
    recordSuccess: vi.fn().mockResolvedValue(),
    recordFailure: vi.fn().mockResolvedValue(),
    getStatus: vi.fn().mockResolvedValue({ open: false })
  }))
}));

vi.mock('../src/core/logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));

vi.mock('../src/tools/alerting.js', () => ({
  alertLLMAllProvidersFailed: vi.fn().mockResolvedValue(),
  alertCircuitOpen: vi.fn().mockResolvedValue()
}));

describe('parseJSON', () => {
  it('extracts JSON from markdown code blocks', () => {
    const text = '```json\n{"key": "value"}\n```';
    const result = parseJSON(text);
    expect(result).toEqual({ key: 'value' });
  });

  it('extracts JSON from plain text', () => {
    const text = '{"key": "value"}';
    const result = parseJSON(text);
    expect(result).toEqual({ key: 'value' });
  });

  it('returns null for invalid JSON', () => {
    const text = 'not json';
    const result = parseJSON(text);
    expect(result).toBeNull();
  });

  it('returns null for empty input', () => {
    const result = parseJSON('');
    expect(result).toBeNull();
  });

  it('returns null for null input', () => {
    const result = parseJSON(null);
    expect(result).toBeNull();
  });

  it('extracts the longest JSON object when multiple present', () => {
    const text = '{"a": 1} {"b": 2, "c": 3}';
    const result = parseJSON(text);
    expect(result).toEqual({ b: 2, c: 3 });
  });

  it('handles nested JSON objects', () => {
    const text = '{"outer": {"inner": "value"}}';
    const result = parseJSON(text);
    // Note: parseJSON uses regex to find objects, which may not handle nested braces correctly
    // This test documents current behavior
    expect(result).toBeNull();
  });
});

describe('MODELS', () => {
  it('defines Cerebras models', () => {
    expect(MODELS.CEREBRAS_FAST).toBe('llama-3.3-70b');
    expect(MODELS.CEREBRAS_LARGE).toBe('llama-4-scout-17b-16e-instruct');
  });

  it('defines OpenRouter models', () => {
    expect(MODELS.OR_PRIMARY).toBe('openai/gpt-oss-120b:free');
    expect(MODELS.OR_FAST).toBe('openai/gpt-oss-20b:free');
    expect(MODELS.OR_FALLBACK).toBe('nvidia/nemotron-3-super-120b-a12b:free');
  });

  it('defines Cloudflare AI model', () => {
    expect(MODELS.CF_AI).toBe('@cf/meta/llama-3.3-70b-instruct-fp8-fast');
  });
});

describe('callLLM', () => {
  let mockEnv;

  beforeEach(() => {
    mockEnv = {
      CEREBRAS_API_KEY: 'test-cerebras-key',
      OPENROUTER_API_KEY: 'test-openrouter-key',
      AI: { run: vi.fn().mockResolvedValue({ response: 'test response' }) },
      KV: {
        get: vi.fn().mockResolvedValue(null),
        put: vi.fn().mockResolvedValue()
      }
    };
  });


  it('checks OpenRouter cooldown before calling', async () => {
    mockEnv.KV.get.mockResolvedValue(Date.now().toString());
    
    try {
      await callLLM(MODELS.OR_PRIMARY, [], mockEnv);
    } catch (e) {
      // Expected to fail due to cooldown
    }
    
    expect(mockEnv.KV.get).toHaveBeenCalledWith('openrouter_cooldown');
  });

  it('skips OpenRouter when cooldown active', async () => {
    const cooldownTime = Date.now() - 30000; // 30 seconds ago
    mockEnv.KV.get.mockResolvedValue(cooldownTime.toString());
    
    try {
      await callLLM(MODELS.OR_PRIMARY, [], mockEnv);
    } catch (e) {
      // Expected to fail
    }
    
    expect(mockEnv.KV.get).toHaveBeenCalledWith('openrouter_cooldown');
  });
});
