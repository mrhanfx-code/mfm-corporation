import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'miniflare',
    environmentOptions: {
      bindings: {
        KV: {
          // Mock KV binding
        },
        db: {
          // Mock D1 binding
        },
        'mfm-corporation-uploads': {
          // Mock R2 binding
        },
        TASK_QUEUE: {
          // Mock Queue binding
        },
      },
      vars: {
        ENVIRONMENT: 'test',
        AUTHORIZED_USER_IDS: '123456789',
      },
    },
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'tests/',
        'docs/',
        '*.config.js',
      ],
      all: true,
      lines: 40,
      functions: 40,
      branches: 40,
      statements: 40,
    },
  },
});
