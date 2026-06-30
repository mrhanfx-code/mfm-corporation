// Test setup file for Vitest
// Provides shared test configuration and utilities

import { describe, beforeEach, afterEach, vi } from 'vitest';

// Mock Cloudflare Workers environment
global.crypto = {
  randomUUID: () => 'test-uuid-' + Math.random().toString(36),
  subtle: {
    importKey: vi.fn(),
    sign: vi.fn(),
    verify: vi.fn(),
  },
};

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

// Mock fetch for API calls
global.fetch = vi.fn();

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
});

// Cleanup after each test
afterEach(() => {
  vi.restoreAllMocks();
});
