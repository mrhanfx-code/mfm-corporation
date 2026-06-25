// Memory Service Test Suite
// Tests for keyword-based memory system

import { storeMemory, searchMemory, getRecentMemories, pinMemory, unpinMemory, extractKeywords } from '../src/memory/memory-service.js';

// Mock environment for testing
const mockEnv = {
  db: {
    prepare: () => ({
      bind: () => ({
        run: async () => ({ meta: { changes: 1 } }),
        all: async () => ({ results: [] }),
        first: async () => null
      })
    })
  }
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
  console.log('Running Memory Service Tests...\n');

  await TestUtils.test('extractKeywords returns empty array for empty input', async () => {
    const keywords = extractKeywords('');
    await TestUtils.assert(keywords.length === 0, 'Empty input should return empty array');
  });

  await TestUtils.test('extractKeywords filters short words', async () => {
    const keywords = extractKeywords('the and is of to');
    await TestUtils.assert(keywords.length === 0, 'Short words should be filtered out');
  });

  await TestUtils.test('extractKeywords extracts meaningful words', async () => {
    const keywords = extractKeywords('MFM Corporation automation startup');
    await TestUtils.assert(keywords.includes('corporation'), 'Should extract corporation');
    await TestUtils.assert(keywords.includes('automation'), 'Should extract automation');
    await TestUtils.assert(keywords.includes('startup'), 'Should extract startup');
  });

  await TestUtils.test('extractKeywords removes stop words', async () => {
    const keywords = extractKeywords('this is about the system');
    await TestUtils.assert(!keywords.includes('this'), 'Should remove stop words');
    await TestUtils.assert(!keywords.includes('about'), 'Should remove stop words');
  });

  await TestUtils.test('extractKeywords limits to 10 keywords', async () => {
    const text = 'one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen';
    const keywords = extractKeywords(text);
    await TestUtils.assert(keywords.length <= 10, 'Should limit to 10 keywords');
  });

  await TestUtils.test('storeMemory returns null without db', async () => {
    const result = await storeMemory({}, 'test content', ['test'], 'agent');
    await TestUtils.assert(result === null, 'Should return null without db');
  });

  await TestUtils.test('searchMemory returns empty array without db', async () => {
    const result = await searchMemory({}, 'test query');
    await TestUtils.assert(result.length === 0, 'Should return empty array without db');
  });

  await TestUtils.test('getRecentMemories returns empty array without db', async () => {
    const result = await getRecentMemories({}, 'agent');
    await TestUtils.assert(result.length === 0, 'Should return empty array without db');
  });

  await TestUtils.test('pinMemory returns false without db', async () => {
    const result = await pinMemory({}, 'memory-id');
    await TestUtils.assert(result === false, 'Should return false without db');
  });

  await TestUtils.test('unpinMemory returns false without db', async () => {
    const result = await unpinMemory({}, 'memory-id');
    await TestUtils.assert(result === false, 'Should return false without db');
  });

  console.log('\nMemory Service Tests Complete');
}

// Run tests
runTests().catch(console.error);
