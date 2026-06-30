import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    pool: '@cloudflare/vitest-pool-workers',
    poolOptions: {
      workers: {
        singleWorker: true,
        miniflareOptions: {
          compatibilityDate: '2024-01-01',
          compatibilityFlags: ['nodejs_compat', 'export_commonjs_default'],
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
