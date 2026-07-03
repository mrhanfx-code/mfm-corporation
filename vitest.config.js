import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/agents/**',
        'tests/api.test.js',
        'tests/memory-service.test.js',
        'tests/model-router.test.js',
        'tests/notion-tool.test.js',
        'tests/comprehensive-agent-test.js',
        'tests/comprehensive-agent-test.py',
        'tests/live-agent-test.js',
        'tests/telegram-bot-test.js',
        'dashboard/',
        'mfm-design-app/',
        'automation/',
        'public/',
        'docs/',
        'plan/',
        'scripts/',
        '*.config.js'
      ],
      // Coverage threshold disabled for baseline measurement
      // TODO: Enable thresholds incrementally as test coverage improves
      // thresholds: {
      //   lines: 50,
      //   functions: 50,
      //   branches: 50,
      //   statements: 50
      // },
      // All files in src/ are included
      include: ['src/**/*.{js,mjs,cjs}']
    }
  }
});
