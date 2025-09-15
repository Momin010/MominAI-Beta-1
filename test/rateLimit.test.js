// Simple test for rate limiting functionality
// Run with: node test/rateLimit.test.js

const path = require('path');
const rateLimitModule = require(path.join(__dirname, '../lib/rateLimit'));

// Clear rate limit store
rateLimitModule.rateLimitStore.clear();

console.log('🧪 Testing Rate Limiting Implementation...\n');

// Mock Next.js request/response objects
function createMockReq(ip = '127.0.0.1') {
  return {
    headers: {
      'x-forwarded-for': ip,
      'x-real-ip': ip,
      'x-client-ip': ip
    },
    connection: {
      remoteAddress: ip
    }
  };
}

function createMockRes() {
  const res = {
    statusCode: null,
    headers: {},
    body: null,
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    setHeader: function(name, value) {
      this.headers[name] = value;
    },
    json: function(data) {
      this.body = data;
      return this;
    },
    send: function(data) {
      this.body = data;
      return this;
    }
  };
  return res;
}

function createMockNext() {
  let callCount = 0;
  return function() {
    callCount++;
    return callCount;
  };
}

// Mock Vercel request
function createMockVercelReq(ip = '127.0.0.1') {
  return {
    headers: {
      get: (name) => {
        const headers = {
          'x-forwarded-for': ip,
          'x-real-ip': ip,
          'x-client-ip': ip
        };
        return headers[name];
      }
    }
  };
}

async function testBasicRateLimiting() {
  console.log('📋 Test 1: Basic rate limiting');
  const rateLimit = rateLimitModule.createRateLimit({
    windowMs: 1000, // 1 second for testing
    maxRequests: 2
  });

  const req = createMockReq();
  const res = createMockRes();
  const next = createMockNext();

  try {
    // First request should pass
    await rateLimit(req, res, next);
    console.log('  ✅ First request passed');

    // Second request should pass
    await rateLimit(req, res, next);
    console.log('  ✅ Second request passed');

    // Third request should be blocked
    await rateLimit(req, res, next);
    if (res.statusCode === 429) {
      console.log('  ✅ Third request blocked (429 Too Many Requests)');
      return true;
    } else {
      console.log('  ❌ Third request should have been blocked');
      return false;
    }
  } catch (error) {
    console.log('  ❌ Error in basic rate limiting test:', error.message);
    return false;
  }
}

async function testVercelRateLimiting() {
  console.log('📋 Test 2: Vercel rate limiting');
  const rateLimit = rateLimitModule.createVercelRateLimit({
    windowMs: 1000,
    maxRequests: 1
  });

  const req = createMockVercelReq();

  try {
    // First request should pass
    const result1 = await rateLimit(req);
    if (result1 === null) {
      console.log('  ✅ First Vercel request passed');
    } else {
      console.log('  ❌ First Vercel request should have passed');
      return false;
    }

    // Second request should be blocked
    const result2 = await rateLimit(req);
    if (result2 && result2.status === 429) {
      console.log('  ✅ Second Vercel request blocked');
      return true;
    } else {
      console.log('  ❌ Second Vercel request should have been blocked');
      return false;
    }
  } catch (error) {
    console.log('  ❌ Error in Vercel rate limiting test:', error.message);
    return false;
  }
}

async function testAuthAwareRateLimiting() {
  console.log('📋 Test 3: Auth-aware rate limiting');
  const rateLimit = rateLimitModule.createAuthAwareRateLimit({
    authenticated: {
      windowMs: 1000,
      maxRequests: 2
    },
    unauthenticated: {
      windowMs: 1000,
      maxRequests: 1
    }
  });

  const authReq = createMockReq('127.0.0.1');
  const unauthReq = createMockReq('192.168.1.1');
  const res = createMockRes();
  const next = createMockNext();

  try {
    // Mock authentication - first two calls authenticated, third unauthenticated
    let authCallCount = 0;
    rateLimitModule.isAuthenticatedNextRequest = function() {
      authCallCount++;
      return authCallCount <= 2; // First two authenticated, third unauthenticated
    };

    // Authenticated user - should allow 2 requests
    await rateLimit(authReq, res, next);
    await rateLimit(authReq, res, next);

    // Third request from authenticated user should be blocked
    await rateLimit(authReq, res, next);
    if (res.statusCode === 429) {
      console.log('  ✅ Authenticated user rate limited after 2 requests');
    } else {
      console.log('  ❌ Authenticated user should have been limited after 2 requests');
      return false;
    }

    // Reset response
    Object.assign(res, createMockRes());

    // Unauthenticated user - should allow only 1 request
    await rateLimit(unauthReq, res, next);

    // Second request from unauthenticated user should be blocked
    await rateLimit(unauthReq, res, next);
    if (res.statusCode === 429) {
      console.log('  ✅ Unauthenticated user rate limited after 1 request');
      return true;
    } else {
      console.log('  ❌ Unauthenticated user should have been limited after 1 request');
      return false;
    }
  } catch (error) {
    console.log('  ❌ Error in auth-aware rate limiting test:', error.message);
    return false;
  }
}

async function testDifferentIPs() {
  console.log('📋 Test 4: Different IPs have separate limits');
  const rateLimit = rateLimitModule.createRateLimit({
    windowMs: 1000,
    maxRequests: 1
  });

  const req1 = createMockReq('127.0.0.1');
  const req2 = createMockReq('192.168.1.1');
  const res = createMockRes();
  const next = createMockNext();

  try {
    // Both IPs should be able to make 1 request each
    await rateLimit(req1, res, next);
    await rateLimit(req2, res, next);

    // Second request from first IP should be blocked
    await rateLimit(req1, res, next);
    if (res.statusCode === 429) {
      console.log('  ✅ Different IPs have separate rate limits');
      return true;
    } else {
      console.log('  ❌ IPs should have separate rate limits');
      return false;
    }
  } catch (error) {
    console.log('  ❌ Error in different IPs test:', error.message);
    return false;
  }
}

async function runTests() {
  const tests = [
    testBasicRateLimiting,
    testVercelRateLimiting,
    testAuthAwareRateLimiting,
    testDifferentIPs
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const result = await test();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.log('  ❌ Test threw an error:', error.message);
      failed++;
    }
    console.log(''); // Empty line between tests
  }

  console.log(`📊 Test Results: ${passed} passed, ${failed} failed`);

  if (failed === 0) {
    console.log('🎉 All rate limiting tests passed! Implementation is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Please review the implementation.');
  }
}

runTests().catch(error => {
  console.error('❌ Test runner failed:', error);
});