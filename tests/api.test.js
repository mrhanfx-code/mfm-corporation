// MFM Corporation - API Test Suite
// Comprehensive test coverage for all endpoints

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'https://mfm-corporation-api.mrhan-fx.workers.dev',
  timeout: 10000,
  retries: 3
};

// Test utilities
const TestUtils = {
  async makeRequest(endpoint, options = {}) {
    const url = `${TEST_CONFIG.baseUrl}${endpoint}`;
    const config = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'MFM-Test-Suite/1.0'
      },
      ...options
    };

    try {
      const response = await fetch(url, config);
      return {
        status: response.status,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
        data: await response.json().catch(() => response.text())
      };
    } catch (error) {
      return {
        status: 0,
        ok: false,
        error: error.message,
        data: null
      };
    }
  },

  async assert(condition, message) {
    if (!condition) {
      throw new Error(`Assertion failed: ${message}`);
    }
  },

  async testEndpoint(name, endpoint, expectedStatus = 200, validator = null) {
    console.log(`Testing: ${name}`);
    const response = await this.makeRequest(endpoint);
    
    await this.assert(response.status === expectedStatus, 
      `Expected status ${expectedStatus}, got ${response.status}`);
    
    if (validator) {
      await validator(response.data);
    }
    
    console.log(`✅ ${name} - PASSED`);
    return response;
  }
};

// Test Suite
class APITestSuite {
  constructor() {
    this.tests = [];
    this.results = {
      passed: 0,
      failed: 0,
      total: 0
    };
  }

  addTest(name, testFunction) {
    this.tests.push({ name, testFunction });
  }

  async runTest(test) {
    try {
      await test.testFunction();
      this.results.passed++;
      return { name: test.name, status: 'PASSED', error: null };
    } catch (error) {
      this.results.failed++;
      return { name: test.name, status: 'FAILED', error: error.message };
    } finally {
      this.results.total++;
    }
  }

  async runAllTests() {
    console.log('🧪 Running MFM Corporation API Test Suite');
    console.log('='.repeat(50));
    
    const results = [];
    for (const test of this.tests) {
      const result = await this.runTest(test);
      results.push(result);
    }

    console.log('='.repeat(50));
    console.log(`📊 Test Results: ${this.results.passed}/${this.results.total} passed`);
    console.log(`✅ Success Rate: ${((this.results.passed / this.results.total) * 100).toFixed(1)}%`);
    
    if (this.results.failed > 0) {
      console.log('\n❌ Failed Tests:');
      results.filter(r => r.status === 'FAILED').forEach(test => {
        console.log(`  - ${test.name}: ${test.error}`);
      });
    }

    return results;
  }
}

// Initialize test suite
const testSuite = new APITestSuite();

// Status API Tests
testSuite.addTest('Status API - Basic functionality', async () => {
  await TestUtils.testEndpoint('/api/status', 200, (data) => {
    TestUtils.assert(data.system === 'MFM Corporation', 'System name mismatch');
    TestUtils.assert(data.version, 'Version missing');
    TestUtils.assert(data.features, 'Features object missing');
    TestUtils.assert(data.features.database === true, 'Database feature missing');
    TestUtils.assert(data.features.kv_storage === true, 'KV storage feature missing');
    TestUtils.assert(data.features.r2_storage === true, 'R2 storage feature missing');
  });
});

testSuite.addTest('Status API - Response headers', async () => {
  const response = await TestUtils.makeRequest('/api/status');
  TestUtils.assert(response.headers['content-type']?.includes('application/json'), 
    'Content-Type header missing');
  TestUtils.assert(response.headers['cache-control'], 'Cache-Control header missing');
});

// User Preferences Tests
testSuite.addTest('User Preferences - GET default', async () => {
  await TestUtils.testEndpoint('/api/user/preferences', 200, (data) => {
    TestUtils.assert(typeof data === 'object' || data === '{}', 'Invalid response format');
  });
});

testSuite.addTest('User Preferences - GET with userId', async () => {
  await TestUtils.testEndpoint('/api/user/preferences?userId=testuser', 200);
});

testSuite.addTest('User Preferences - POST valid data', async () => {
  const testData = { theme: 'dark', language: 'en' };
  const response = await TestUtils.makeRequest('/api/user/preferences', {
    method: 'POST',
    body: JSON.stringify(testData)
  });
  
  TestUtils.assert(response.status === 200, `Expected 200, got ${response.status}`);
  TestUtils.assert(response.data.success === true, 'Success flag missing');
});

testSuite.addTest('User Preferences - POST invalid JSON', async () => {
  const response = await TestUtils.makeRequest('/api/user/preferences', {
    method: 'POST',
    body: '{"invalid": json}'
  });
  
  TestUtils.assert(response.status === 400 || response.status === 500, 
    `Expected 400/500 for invalid JSON, got ${response.status}`);
});

// Tools Search Tests
testSuite.addTest('Tools Search - Basic search', async () => {
  await TestUtils.testEndpoint('/api/tools/search?q=figma', 200, (data) => {
    TestUtils.assert(Array.isArray(data.results), 'Results should be an array');
    TestUtils.assert(data.results.length > 0, 'Results array should not be empty');
    TestUtils.assert(data.results[0].id, 'Result should have id field');
    TestUtils.assert(data.results[0].name, 'Result should have name field');
  });
});

testSuite.addTest('Tools Search - Empty search', async () => {
  await TestUtils.testEndpoint('/api/tools/search?q=', 200, (data) => {
    TestUtils.assert(Array.isArray(data.results), 'Results should be an array');
  });
});

testSuite.addTest('Tools Search - Category filter', async () => {
  await TestUtils.testEndpoint('/api/tools/search?q=figma&category=ui-design', 200);
});

// Analytics Tests
testSuite.addTest('Analytics - Basic analytics', async () => {
  await TestUtils.testEndpoint('/api/analytics', 200, (data) => {
    TestUtils.assert(typeof data.page_views === 'number', 'page_views should be number');
    TestUtils.assert(typeof data.unique_visitors === 'number', 'unique_visitors should be number');
    TestUtils.assert(Array.isArray(data.popular_tools), 'popular_tools should be array');
    TestUtils.assert(data.timestamp, 'timestamp should be present');
  });
});

// Security Tests
testSuite.addTest('Security - Invalid endpoint', async () => {
  const response = await TestUtils.makeRequest('/api/invalid');
  TestUtils.assert(response.status === 404, `Expected 404 for invalid endpoint, got ${response.status}`);
});

testSuite.addTest('Security - Invalid method', async () => {
  const response = await TestUtils.makeRequest('/api/status', { method: 'PATCH' });
  TestUtils.assert(response.status === 405, `Expected 405 for PATCH method, got ${response.status}`);
});

testSuite.addTest('Security - Large payload', async () => {
  const largePayload = 'x'.repeat(2000000); // 2MB
  const response = await TestUtils.makeRequest('/api/user/preferences', {
    method: 'POST',
    body: largePayload
  });
  TestUtils.assert(response.status === 413 || response.status === 500, 
    `Expected 413/500 for large payload, got ${response.status}`);
});

testSuite.addTest('Security - CORS headers', async () => {
  const response = await TestUtils.makeRequest('/api/status', {
    headers: { 'Origin': 'https://mfm-corporation.pages.dev' }
  });
  TestUtils.assert(response.headers['access-control-allow-origin'], 
    'CORS header missing');
});

// Performance Tests
testSuite.addTest('Performance - Response time', async () => {
  const start = Date.now();
  await TestUtils.makeRequest('/api/status');
  const duration = Date.now() - start;
  TestUtils.assert(duration < 1000, `Response time ${duration}ms exceeds 1000ms limit`);
});

testSuite.addTest('Performance - Concurrent requests', async () => {
  const promises = [];
  for (let i = 0; i < 10; i++) {
    promises.push(TestUtils.makeRequest('/api/status'));
  }
  
  const results = await Promise.all(promises);
  const successCount = results.filter(r => r.status === 200).length;
  TestUtils.assert(successCount >= 8, `Only ${successCount}/10 concurrent requests succeeded`);
});

// Error Handling Tests
testSuite.addTest('Error Handling - Malformed request', async () => {
  const response = await TestUtils.makeRequest('/api/user/preferences', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: 'not-json'
  });
  TestUtils.assert(response.status >= 400, `Expected error status, got ${response.status}`);
});

// Export for use in different environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { APITestSuite, TestUtils };
} else {
  // Auto-run in browser/worker environment
  testSuite.runAllTests().then(results => {
    console.log('\n🎯 Test suite completed');
  }).catch(error => {
    console.error('❌ Test suite failed:', error);
  });
}
