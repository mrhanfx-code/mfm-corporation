// Model Router Test Suite
// Tests for cost optimization and model routing

import { classifyComplexity, selectModel, calculateCost } from '../src/core/model-router.js';

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
  console.log('Running Model Router Tests...\n');

  await TestUtils.test('classifyComplexity returns high for complex tasks', async () => {
    const result = classifyComplexity('Analyze the strategic implications of this decision');
    await TestUtils.assert(result === 'high', 'Should classify as high complexity');
  });

  await TestUtils.test('classifyComplexity returns low for simple tasks', async () => {
    const result = classifyComplexity('List all files in the repository');
    await TestUtils.assert(result === 'low', 'Should classify as low complexity');
  });

  await TestUtils.test('classifyComplexity returns medium for unknown tasks', async () => {
    const result = classifyComplexity('Do something random');
    await TestUtils.assert(result === 'medium', 'Should classify as medium complexity');
  });

  await TestUtils.test('selectModel uses fast model for low complexity', async () => {
    const model = selectModel('low');
    await TestUtils.assert(model === 'openai/gpt-oss-20b:free', 'Should select fast model');
  });

  await TestUtils.test('selectModel uses balanced model for medium complexity', async () => {
    const model = selectModel('medium');
    await TestUtils.assert(model === 'llama-3.3-70b', 'Should select balanced model');
  });

  await TestUtils.test('selectModel uses large model for high complexity', async () => {
    const model = selectModel('high');
    await TestUtils.assert(model === 'llama-4-scout-17b-16e-instruct', 'Should select large model');
  });

  await TestUtils.test('selectModel respects preferred model', async () => {
    const model = selectModel('low', 'custom-model');
    await TestUtils.assert(model === 'custom-model', 'Should use preferred model');
  });

  await TestUtils.test('calculateCost returns 0 for free models', async () => {
    const cost = calculateCost('openai/gpt-oss-20b:free', { prompt_tokens: 1000, completion_tokens: 500 });
    await TestUtils.assert(cost === 0, 'Free models should have zero cost');
  });

  await TestUtils.test('calculateCost computes cost correctly', async () => {
    const cost = calculateCost('llama-3.3-70b', { prompt_tokens: 1000, completion_tokens: 500 });
    const expected = (1500 / 1_000_000) * 0.10;
    await TestUtils.assert(Math.abs(cost - expected) < 0.0001, 'Cost calculation should be accurate');
  });

  await TestUtils.test('calculateCost handles missing usage', async () => {
    const cost = calculateCost('llama-3.3-70b', {});
    await TestUtils.assert(cost === 0, 'Missing usage should return zero cost');
  });

  console.log('\nModel Router Tests Complete');
}

// Run tests
runTests().catch(console.error);
