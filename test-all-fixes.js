/**
 * Comprehensive Test Script for MominAI 100% Vision Implementation
 * Tests all critical fixes and new features
 */

const axios = require('axios');
const WebSocket = require('ws');

const BASE_URL = 'http://localhost:3001';
const WS_URL = 'ws://localhost:3001';

class ComprehensiveTester {
    constructor() {
        this.testResults = {
            passed: 0,
            failed: 0,
            tests: []
        };
        this.testUser = null;
        this.jwtToken = null;
    }

    log(message, status = 'INFO') {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] [${status}] ${message}`);
    }

    recordTest(name, passed, details = '') {
        this.testResults.tests.push({
            name,
            passed,
            details,
            timestamp: new Date().toISOString()
        });

        if (passed) {
            this.testResults.passed++;
            this.log(`✅ ${name}`, 'PASS');
        } else {
            this.testResults.failed++;
            this.log(`❌ ${name}: ${details}`, 'FAIL');
        }
    }

    async setupTestUser() {
        try {
            this.testUser = {
                email: `test_${Date.now()}@example.com`,
                password: 'TestPassword123!',
                username: 'testuser'
            };

            const response = await axios.post(`${BASE_URL}/api/auth/register`, this.testUser);
            
            if (response.status === 201 && response.data.token) {
                this.jwtToken = response.data.token;
                this.recordTest('Test User Setup', true, 'User created successfully');
                return true;
            } else {
                this.recordTest('Test User Setup', false, 'Failed to create user');
                return false;
            }
        } catch (error) {
            this.recordTest('Test User Setup', false, `Error: ${error.message}`);
            return false;
        }
    }

    async testRateLimiting() {
        try {
            this.log('Testing enhanced rate limiting...');

            const requests = [];
            const totalRequests = 25;

            // Send requests quickly to test rate limiting
            for (let i = 0; i < totalRequests; i++) {
                requests.push(
                    axios.get(`${BASE_URL}/api/health`)
                        .then(() => 'success')
                        .catch(error => {
                            if (error.response && error.response.status === 429) {
                                return 'rate_limited';
                            }
                            return 'error';
                        })
                );
            }

            const results = await Promise.all(requests);
            const rateLimitedCount = results.filter(result => result === 'rate_limited').length;
            const successCount = results.filter(result => result === 'success').length;

            const rateLimitingWorking = rateLimitedCount > 0;
            this.recordTest('Enhanced Rate Limiting',
                rateLimitingWorking,
                `Rate limiting: ${rateLimitedCount} requests blocked, ${successCount} successful`
            );
            return rateLimitingWorking;
        } catch (error) {
            this.recordTest('Enhanced Rate Limiting', false, `Error: ${error.message}`);
            return false;
        }
    }

    async testAPIRouting() {
        try {
            this.log('Testing API routing fixes...');

            const endpoints = [
                '/api/health',
                '/api/metrics',
                '/api/alerts',
                '/api/performance',
                '/api/subscription/status',
                '/api/usage/stats',
                '/api/plans'
            ];

            let routingWorking = true;

            for (const endpoint of endpoints) {
                try {
                    const response = await axios.get(`${BASE_URL}${endpoint}`, {
                        headers: this.jwtToken ? { 'Authorization': `Bearer ${this.jwtToken}` } : {}
                    });

                    if (response.status === 200) {
                        this.log(`✓ ${endpoint} - OK`);
                    } else {
                        this.log(`✗ ${endpoint} - Status: ${response.status}`);
                        routingWorking = false;
                    }
                } catch (error) {
                    if (error.response && error.response.status === 401) {
                        this.log(`✓ ${endpoint} - Requires auth (expected)`);
                    } else {
                        this.log(`✗ ${endpoint} - Error: ${error.message}`);
                        routingWorking = false;
                    }
                }
            }

            this.recordTest('API Routing Fixes',
                routingWorking,
                routingWorking ? 'All endpoints accessible' : 'Some endpoints not working'
            );
            return routingWorking;
        } catch (error) {
            this.recordTest('API Routing Fixes', false, `Error: ${error.message}`);
            return false;
        }
    }

    async testEnhancedSecurity() {
        try {
            this.log('Testing enhanced security measures...');

            let securityTestsPassed = 0;
            const totalSecurityTests = 5;

            // Test 1: SQL injection attempt
            try {
                await axios.post(`${BASE_URL}/api/auth/login`, {
                    email: "'; DROP TABLE users; --",
                    password: 'test'
                });
            } catch (error) {
                if (error.response && error.response.status === 400) {
                    securityTestsPassed++;
                    this.log('✓ SQL injection properly blocked');
                }
            }

            // Test 2: XSS attempt
            try {
                await axios.post(`${BASE_URL}/api/auth/register`, {
                    email: `xss_test_${Date.now()}@example.com`,
                    password: 'TestPassword123!',
                    username: '<script>alert("xss")</script>'
                });
            } catch (error) {
                if (error.response && error.response.status === 400) {
                    securityTestsPassed++;
                    this.log('✓ XSS attempt properly blocked');
                }
            }

            // Test 3: Weak password
            try {
                await axios.post(`${BASE_URL}/api/auth/register`, {
                    email: `weak_pass_${Date.now()}@example.com`,
                    password: '123',
                    username: 'testuser'
                });
            } catch (error) {
                if (error.response && error.response.status === 400) {
                    securityTestsPassed++;
                    this.log('✓ Weak password properly rejected');
                }
            }

            // Test 4: Invalid email format
            try {
                await axios.post(`${BASE_URL}/api/auth/register`, {
                    email: 'invalid-email',
                    password: 'TestPassword123!',
                    username: 'testuser'
                });
            } catch (error) {
                if (error.response && error.response.status === 400) {
                    securityTestsPassed++;
                    this.log('✓ Invalid email properly rejected');
                }
            }

            // Test 5: Path traversal
            try {
                await axios.get(`${BASE_URL}/api/containers/test/../../../etc/passwd`, {
                    headers: { 'Authorization': `Bearer ${this.jwtToken}` }
                });
            } catch (error) {
                if (error.response && (error.response.status === 403 || error.response.status === 404)) {
                    securityTestsPassed++;
                    this.log('✓ Path traversal properly blocked');
                }
            }

            const securityWorking = securityTestsPassed >= totalSecurityTests * 0.8;
            this.recordTest('Enhanced Security',
                securityWorking,
                `Security tests: ${securityTestsPassed}/${totalSecurityTests} passed`
            );
            return securityWorking;
        } catch (error) {
            this.recordTest('Enhanced Security', false, `Error: ${error.message}`);
            return false;
        }
    }

    async testPaymentIntegration() {
        try {
            this.log('Testing payment integration...');

            // Test getting plans
            const plansResponse = await axios.get(`${BASE_URL}/api/plans`);
            
            if (plansResponse.status === 200 && plansResponse.data.plans) {
                this.log('✓ Plans endpoint working');
                
                const plans = plansResponse.data.plans;
                const expectedPlans = ['free', 'premium', 'team', 'enterprise'];
                const hasAllPlans = expectedPlans.every(plan => plans[plan]);
                
                if (hasAllPlans) {
                    this.log('✓ All subscription plans available');
                    this.recordTest('Payment Integration', true, 'Payment system properly configured');
                    return true;
                } else {
                    this.log('✗ Missing some subscription plans');
                    this.recordTest('Payment Integration', false, 'Missing subscription plans');
                    return false;
                }
            } else {
                this.recordTest('Payment Integration', false, 'Plans endpoint not working');
                return false;
            }
        } catch (error) {
            this.recordTest('Payment Integration', false, `Error: ${error.message}`);
            return false;
        }
    }

    async testUsageTracking() {
        try {
            this.log('Testing usage tracking...');

            // Test getting usage stats
            const usageResponse = await axios.get(`${BASE_URL}/api/usage/stats`, {
                headers: { 'Authorization': `Bearer ${this.jwtToken}` }
            });

            if (usageResponse.status === 200 && usageResponse.data.usage) {
                const usage = usageResponse.data.usage;
                const expectedMetrics = ['aiRequests', 'containerHours', 'storage', 'fileOperations'];
                const hasAllMetrics = expectedMetrics.every(metric => usage[metric]);

                if (hasAllMetrics) {
                    this.log('✓ Usage tracking metrics available');
                    this.recordTest('Usage Tracking', true, 'Usage tracking properly implemented');
                    return true;
                } else {
                    this.log('✗ Missing usage tracking metrics');
                    this.recordTest('Usage Tracking', false, 'Missing usage metrics');
                    return false;
                }
            } else {
                this.recordTest('Usage Tracking', false, 'Usage stats endpoint not working');
                return false;
            }
        } catch (error) {
            this.recordTest('Usage Tracking', false, `Error: ${error.message}`);
            return false;
        }
    }

    async testMonitoring() {
        try {
            this.log('Testing monitoring system...');

            // Test metrics endpoint
            const metricsResponse = await axios.get(`${BASE_URL}/api/metrics`, {
                headers: { 'Authorization': `Bearer ${this.jwtToken}` }
            });

            if (metricsResponse.status === 200 && metricsResponse.data) {
                this.log('✓ Metrics endpoint working');
            }

            // Test alerts endpoint
            const alertsResponse = await axios.get(`${BASE_URL}/api/alerts`, {
                headers: { 'Authorization': `Bearer ${this.jwtToken}` }
            });

            if (alertsResponse.status === 200 && alertsResponse.data.alerts) {
                this.log('✓ Alerts endpoint working');
            }

            // Test performance endpoint
            const performanceResponse = await axios.get(`${BASE_URL}/api/performance`, {
                headers: { 'Authorization': `Bearer ${this.jwtToken}` }
            });

            if (performanceResponse.status === 200 && performanceResponse.data) {
                this.log('✓ Performance endpoint working');
                this.recordTest('Monitoring System', true, 'Monitoring system properly implemented');
                return true;
            } else {
                this.recordTest('Monitoring System', false, 'Performance endpoint not working');
                return false;
            }
        } catch (error) {
            this.recordTest('Monitoring System', false, `Error: ${error.message}`);
            return false;
        }
    }

    async testPerformanceOptimization() {
        try {
            this.log('Testing performance optimization...');

            // Test performance endpoint
            const performanceResponse = await axios.get(`${BASE_URL}/api/performance`, {
                headers: { 'Authorization': `Bearer ${this.jwtToken}` }
            });

            if (performanceResponse.status === 200) {
                const performance = performanceResponse.data;
                
                // Check if performance metrics are available
                const hasResponseTime = performance.responseTime && performance.responseTime.average !== undefined;
                const hasMemory = performance.memory && performance.memory.current !== undefined;
                const hasConnections = performance.connections && performance.connections.active !== undefined;

                if (hasResponseTime && hasMemory && hasConnections) {
                    this.log('✓ Performance metrics available');
                    this.recordTest('Performance Optimization', true, 'Performance optimization working');
                    return true;
                } else {
                    this.log('✗ Missing performance metrics');
                    this.recordTest('Performance Optimization', false, 'Missing performance metrics');
                    return false;
                }
            } else {
                this.recordTest('Performance Optimization', false, 'Performance endpoint not accessible');
                return false;
            }
        } catch (error) {
            this.recordTest('Performance Optimization', false, `Error: ${error.message}`);
            return false;
        }
    }

    async testSubscriptionManagement() {
        try {
            this.log('Testing subscription management...');

            // Test subscription status
            const statusResponse = await axios.get(`${BASE_URL}/api/subscription/status`, {
                headers: { 'Authorization': `Bearer ${this.jwtToken}` }
            });

            if (statusResponse.status === 200 && statusResponse.data.subscription) {
                this.log('✓ Subscription status working');
                
                // Test premium activation
                const activationResponse = await axios.post(`${BASE_URL}/api/premium/activate`, {
                    activationCode: 'FREEPALESTINE1!'
                }, {
                    headers: { 'Authorization': `Bearer ${this.jwtToken}` }
                });

                if (activationResponse.status === 200 && activationResponse.data.success) {
                    this.log('✓ Premium activation working');
                    this.recordTest('Subscription Management', true, 'Subscription management properly implemented');
                    return true;
                } else {
                    this.log('✗ Premium activation failed');
                    this.recordTest('Subscription Management', false, 'Premium activation not working');
                    return false;
                }
            } else {
                this.recordTest('Subscription Management', false, 'Subscription status not working');
                return false;
            }
        } catch (error) {
            this.recordTest('Subscription Management', false, `Error: ${error.message}`);
            return false;
        }
    }

    async testWebSocketSecurity() {
        try {
            this.log('Testing WebSocket security...');

            // Test WebSocket connection with invalid token
            const invalidWs = new WebSocket(`${WS_URL}/test_session?token=invalid_token`);
            
            return new Promise((resolve) => {
                let connectionRejected = false;

                invalidWs.on('error', () => {
                    connectionRejected = true;
                });

                invalidWs.on('open', () => {
                    connectionRejected = false;
                    invalidWs.close();
                });

                setTimeout(() => {
                    if (connectionRejected) {
                        this.log('✓ Invalid WebSocket token properly rejected');
                        this.recordTest('WebSocket Security', true, 'WebSocket security properly implemented');
                        resolve(true);
                    } else {
                        this.log('✗ Invalid WebSocket token should have been rejected');
                        this.recordTest('WebSocket Security', false, 'WebSocket security not working');
                        resolve(false);
                    }
                }, 3000);
            });
        } catch (error) {
            this.recordTest('WebSocket Security', false, `Error: ${error.message}`);
            return false;
        }
    }

    async runAllTests() {
        this.log('🚀 Starting Comprehensive MominAI 100% Vision Tests');
        this.log('================================================');

        try {
            await this.setupTestUser();
            await this.testRateLimiting();
            await this.testAPIRouting();
            await this.testEnhancedSecurity();
            await this.testPaymentIntegration();
            await this.testUsageTracking();
            await this.testMonitoring();
            await this.testPerformanceOptimization();
            await this.testSubscriptionManagement();
            await this.testWebSocketSecurity();

        } catch (error) {
            this.log(`Test suite error: ${error.message}`, 'ERROR');
        }

        this.printResults();
    }

    printResults() {
        this.log('\n📊 Comprehensive Test Results Summary');
        this.log('=====================================');
        this.log(`Total Tests: ${this.testResults.tests.length}`);
        this.log(`Passed: ${this.testResults.passed}`);
        this.log(`Failed: ${this.testResults.failed}`);
        this.log(`Success Rate: ${((this.testResults.passed / this.testResults.tests.length) * 100).toFixed(1)}%`);

        if (this.testResults.failed > 0) {
            this.log('\n❌ Failed Tests:');
            this.testResults.tests
                .filter(test => !test.passed)
                .forEach(test => {
                    this.log(`  - ${test.name}: ${test.details}`);
                });
        }

        this.log('\n✅ Passed Tests:');
        this.testResults.tests
            .filter(test => test.passed)
            .forEach(test => {
                this.log(`  - ${test.name}`);
            });

        this.log('\n🎯 Vision Alignment Assessment:');
        if (this.testResults.passed / this.testResults.tests.length >= 0.95) {
            this.log('  🎉 EXCELLENT: 95%+ vision alignment achieved!');
            this.log('  🚀 Ready for production deployment');
        } else if (this.testResults.passed / this.testResults.tests.length >= 0.85) {
            this.log('  ✅ GOOD: 85%+ vision alignment achieved');
            this.log('  📈 Minor improvements needed before production');
        } else if (this.testResults.passed / this.testResults.tests.length >= 0.75) {
            this.log('  ⚠️  ACCEPTABLE: 75%+ vision alignment achieved');
            this.log('  🔧 Some fixes needed before production');
        } else {
            this.log('  ❌ NEEDS WORK: Less than 75% vision alignment');
            this.log('  🛠️  Significant improvements needed');
        }
    }
}

// Run the comprehensive tests
async function main() {
    const tester = new ComprehensiveTester();
    await tester.runAllTests();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = ComprehensiveTester;
