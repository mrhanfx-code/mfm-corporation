// Notion Tool Test Suite
// Tests for Notion API integration

import { getPage, createPage, appendToPage, queryDatabase, searchNotion } from '../src/tools/notion-tool.js';

// Mock environment for testing
const mockEnv = {
  NOTION_API_KEY: 'test-key',
  NOTION_DATABASE_ID: 'test-db-id'
};

// Test utilities
const TestUtils = {
  async assert(condition, message) {
    if (!condition) {
      throw new Error(`Assertion failed: ${message}`);
    }
  },

  async test(name, fn) {
    try {
      await fn();
      console.log(`✓ ${name}`);
    } catch (error) {
      console.error(`✗ ${name}: ${error.message}`);
    }
  }
};

// Test suite
async function runTests() {
  console.log('Running Notion Tool Tests...\n');

  await TestUtils.test('getPage returns error without API key', async () => {
    const result = await getPage('test-page-id', {});
    await TestUtils.assert(result.error === 'NOTION_API_KEY not configured.', 'Should return error');
  });

  await TestUtils.test('createPage returns error without API key', async () => {
    const result = await createPage('parent-id', 'Test Title', 'Test Content', {});
    await TestUtils.assert(result.error === 'NOTION_API_KEY not configured.', 'Should return error');
  });

  await TestUtils.test('appendToPage returns error without API key', async () => {
    const result = await appendToPage('page-id', 'Test Content', {});
    await TestUtils.assert(result.error === 'NOTION_API_KEY not configured.', 'Should return error');
  });

  await TestUtils.test('queryDatabase returns error without API key', async () => {
    const result = await queryDatabase('db-id', {});
    await TestUtils.assert(result.error === 'NOTION_API_KEY not configured.', 'Should return error');
  });

  await TestUtils.test('searchNotion returns error without API key', async () => {
    const result = await searchNotion('query', {});
    await TestUtils.assert(result.error === 'NOTION_API_KEY not configured.', 'Should return error');
  });

  console.log('\nNotion Tool Tests Complete');
}

// Run tests
runTests().catch(console.error);
