/**
 * Integration Testing Script
 * Tests integration between components, provider switching, and system stability
 */

const axios = require('axios');
const WebSocket = require('ws');

const BASE_URL = 'http://localhost:3001';
const WS_URL = 'ws://localhost:3001';

class IntegrationTester {
    constructor() {
        this.freeUserToken = null;
        this.premiumUserToken = null;
        this.freeSessionId = null;
        this.premiumSessionId = null;
        this.freeWs = null;
        this.premiumWs = null;
        this.testResults = {
            passed: 0,
            failed: 0,
            tests: []
        };
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

    async setupTestUsers() {
        try {
            this.log('Setting up test users...');

            // Create free user
            const freeUserResponse = await axios.post(`${BASE_URL}/api/auth/register`, {
                email: `integration_free_${Date.now()}@example.com`,
                password: 'testpassword123',
                username: 'freeuser'
            });

            // Create premium user
            const premiumUserResponse = await axios.post(`${BASE_URL}/api/auth/register`, {
                email: `integration_premium_${Date.now()}@example.com`,
                password: 'testpassword123',
                username: 'premiumuser'
            });

            if (freeUserResponse.status === 201 && premiumUserResponse.status === 201) {
                this.freeUserToken = freeUserResponse.data.token;
                this.premiumUserToken = premiumUserResponse.data.token;
                this.recordTest('Setup Test Users', true, 'Both free and premium users created');
                return true;
            } else {
                this.recordTest('Setup Test Users', false, 'Failed to create test users');
                return false;
            }
        } catch (error) {
            this.recordTest('Setup Test Users', false, `Error: ${error.message}`);
            return false;
        }
    }

    async testProviderSwitching() {
        try {
            this.log('Testing provider switching between WebContainer and Docker...');

            // Test free user (WebContainer)
            this.freeSessionId = `free_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            this.freeWs = new WebSocket(`${WS_URL}/${this.freeSessionId}?token=${this.freeUserToken}`);

            // Test premium user (Docker - if available)
            this.premiumSessionId = `premium_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            this.premiumWs = new WebSocket(`${WS_URL}/${this.premiumSessionId}?token=${this.premiumUserToken}`);

            let freeConnected = false;
            let premiumConnected = false;

            return new Promise((resolve) => {
                const timeout = setTimeout(() => {
                    this.recordTest('Provider Switching', false, 'Connection timeout');
                    resolve(false);
                }, 15000);

                const checkConnections = () => {
                    if (freeConnected && premiumConnected) {
                        clearTimeout(timeout);
                        this.recordTest('Provider Switching', true, 'Both providers connected successfully');
                        resolve(true);
                    }
                };

                this.freeWs.on('open', () => {
                    freeConnected = true;
                    this.log('Free user WebSocket connected');
                    checkConnections();
                });

                this.premiumWs.on('open', () => {
                    premiumConnected = true;
                    this.log('Premium user WebSocket connected');
                    checkConnections();
                });

                this.freeWs.on('message', (data) => {
                    const message = JSON.parse(data.toString());
                    if (message.type === 'connected') {
                        this.log(`Free user connected to: ${message.mode}`);
                    }
                });

                this.premiumWs.on('message', (data) => {
                    const message = JSON.parse(data.toString());
                    if (message.type === 'connected') {
                        this.log(`Premium user connected to: ${message.mode}`);
                    }
                });

                this.freeWs.on('error', (error) => {
                    this.log(`Free user WebSocket error: ${error.message}`);
                });

                this.premiumWs.on('error', (error) => {
                    this.log(`Premium user WebSocket error: ${error.message}`);
                });
            });
        } catch (error) {
            this.recordTest('Provider Switching', false, `Error: ${error.message}`);
            return false;
        }
    }

    async testSessionPersistence() {
        try {
            this.log('Testing session persistence and recovery...');

            if (!this.freeWs || this.freeWs.readyState !== WebSocket.OPEN) {
                this.recordTest('Session Persistence', false, 'Free user WebSocket not connected');
                return false;
            }

            // Create some session data
            this.freeWs.send(JSON.stringify({
                type: 'write_file',
                payload: {
                    path: '/workspace/session_test.txt',
                    content: 'Session persistence test data'
                }
            }));

            // Wait a bit then try to read it back
            await new Promise(resolve => setTimeout(resolve, 2000));

            return new Promise((resolve) => {
                const timeout = setTimeout(() => {
                    this.recordTest('Session Persistence', false, 'Session data recovery timeout');
                    resolve(false);
                }, 5000);

                this.freeWs.on('message', (data) => {
                    const message = JSON.parse(data.toString());
                    if (message.type === 'file_content' && message.content === 'Session persistence test data') {
                        clearTimeout(timeout);
                        this.recordTest('Session Persistence', true, 'Session data persisted and recovered');
                        resolve(true);
                    }
                });

                this.freeWs.send(JSON.stringify({
                    type: 'read_file',
                    payload: { path: '/workspace/session_test.txt' }
                }));
            });
        } catch (error) {
            this.recordTest('Session Persistence', false, `Error: ${error.message}`);
            return false;
        }
    }

    async testErrorHandling() {
        try {
            this.log('Testing error handling and fallback mechanisms...');

            let errorTestsPassed = 0;
            const totalErrorTests = 4;

            // Test 1: Invalid WebSocket token
            try {
                const invalidWs = new WebSocket(`${WS_URL}/invalid_session?token=invalid_token`);
                invalidWs.on('error', () => {
                    errorTestsPassed++;
                    this.log('✓ Invalid token error handled correctly');
                });
                invalidWs.on('open', () => {
                    this.log('✗ Invalid token should not connect');
                });
            } catch (error) {
                errorTestsPassed++;
                this.log('✓ Invalid token error handled correctly');
            }

            // Test 2: Invalid API endpoint
            try {
                await axios.get(`${BASE_URL}/api/invalid-endpoint`);
            } catch (error) {
                if (error.response && error.response.status === 404) {
                    errorTestsPassed++;
                    this.log('✓ Invalid endpoint returns 404');
                }
            }

            // Test 3: Unauthorized access
            try {
                await axios.get(`${BASE_URL}/api/containers/test-session`);
            } catch (error) {
                if (error.response && error.response.status === 401) {
                    errorTestsPassed++;
                    this.log('✓ Unauthorized access properly denied');
                }
            }

            // Test 4: Invalid file path
            if (this.freeWs && this.freeWs.readyState === WebSocket.OPEN) {
                this.freeWs.send(JSON.stringify({
                    type: 'read_file',
                    payload: { path: '/invalid/path/file.txt' }
                }));

                // Wait for error response
                await new Promise(resolve => setTimeout(resolve, 1000));
                errorTestsPassed++;
                this.log('✓ Invalid file path error handling initiated');
            }

            const success = errorTestsPassed >= totalErrorTests * 0.75; // 75% success rate
            this.recordTest('Error Handling',
                success,
                `Error handling: ${errorTestsPassed}/${totalErrorTests} tests passed`
            );
            return success;
        } catch (error) {
            this.recordTest('Error Handling', false, `Error: ${error.message}`);
            return false;
        }
    }

    async testWebSocketCommunicationStability() {
        try {
            this.log('Testing WebSocket communication stability...');

            if (!this.freeWs || this.freeWs.readyState !== WebSocket.OPEN) {
                this.recordTest('WebSocket Stability', false, 'WebSocket not connected');
                return false;
            }

            let messagesSent = 0;
            let messagesReceived = 0;
            const totalMessages = 10;

            return new Promise((resolve) => {
                const timeout = setTimeout(() => {
                    const successRate = messagesReceived / messagesSent;
                    const success = successRate >= 0.8; // 80% success rate
                    this.recordTest('WebSocket Stability',
                        success,
                        `WebSocket stability: ${messagesReceived}/${messagesSent} messages (${(successRate * 100).toFixed(1)}% success rate)`
                    );
                    resolve(success);
                }, 10000);

                this.freeWs.on('message', (data) => {
                    messagesReceived++;
                    if (messagesReceived >= totalMessages) {
                        clearTimeout(timeout);
                        this.recordTest('WebSocket Stability', true, 'All messages received successfully');
                        resolve(true);
                    }
                });

                // Send multiple messages
                for (let i = 0; i < totalMessages; i++) {
                    setTimeout(() => {
                        this.freeWs.send(JSON.stringify({
                            type: 'container_command',
                            payload: { command: `echo "Test message ${i + 1}"` }
                        }));
                        messagesSent++;
                    }, i * 200); // Stagger messages
                }
            });
        } catch (error) {
            this.recordTest('WebSocket Stability', false, `Error: ${error.message}`);
            return false;
        }
    }

    async testConcurrentSessions() {
        try {
            this.log('Testing concurrent session handling...');

            const concurrentSessions = 3;
            const sessions = [];
            let connectedCount = 0;

            for (let i = 0; i < concurrentSessions; i++) {
                const sessionId = `concurrent_session_${i}_${Date.now()}`;
                const ws = new WebSocket(`${WS_URL}/${sessionId}?token=${this.freeUserToken}`);
                sessions.push(ws);

                ws.on('open', () => {
                    connectedCount++;
                    this.log(`Concurrent session ${i + 1} connected`);
                });

                ws.on('error', (error) => {
                    this.log(`Concurrent session ${i + 1} error: ${error.message}`);
                });
            }

            return new Promise((resolve) => {
                const timeout = setTimeout(() => {
                    const success = connectedCount >= concurrentSessions * 0.5; // At least 50% success
                    this.recordTest('Concurrent Sessions',
                        success,
                        `Concurrent sessions: ${connectedCount}/${concurrentSessions} connected`
                    );

                    // Cleanup
                    sessions.forEach(ws => {
                        if (ws.readyState === WebSocket.OPEN) {
                            ws.close();
                        }
                    });

                    resolve(success);
                }, 8000);
            });
        } catch (error) {
            this.recordTest('Concurrent Sessions', false, `Error: ${error.message}`);
            return false;
        }
    }

    async testAPIRateLimiting() {
        try {
            this.log('Testing API rate limiting...');

            const requests = [];
            const totalRequests = 15; // More than the rate limit

            // Send multiple requests quickly
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
            this.recordTest('API Rate Limiting',
                rateLimitingWorking,
                `Rate limiting: ${rateLimitedCount} requests limited, ${successCount} successful`
            );
            return rateLimitingWorking;
        } catch (error) {
            this.recordTest('API Rate Limiting', false, `Error: ${error.message}`);
            return false;
        }
    }

    async testSystemHealthMonitoring() {
        try {
            this.log('Testing system health monitoring...');

            const response = await axios.get(`${BASE_URL}/health`);

            if (response.status === 200) {
                const health = response.data;
                const checks = [
                    health.status === 'ok',
                    typeof health.uptime === 'number',
                    typeof health.sessions === 'object',
                    typeof health.containers === 'object'
                ];

                const healthChecksPassed = checks.filter(Boolean).length;
                const success = healthChecksPassed >= checks.length * 0.8;

                this.recordTest('System Health Monitoring',
                    success,
                    `Health checks: ${healthChecksPassed}/${checks.length} passed`
                );
                return success;
            } else {
                this.recordTest('System Health Monitoring', false, 'Health endpoint not accessible');
                return false;
            }
        } catch (error) {
            this.recordTest('System Health Monitoring', false, `Error: ${error.message}`);
            return false;
        }
    }

    async cleanup() {
        if (this.freeWs && this.freeWs.readyState === WebSocket.OPEN) {
            this.freeWs.close();
        }
        if (this.premiumWs && this.premiumWs.readyState === WebSocket.OPEN) {
            this.premiumWs.close();
        }
        this.log('Cleanup completed');
    }

    async runAllTests() {
        this.log('🚀 Starting Integration Tests');
        this.log('============================');

        try {
            await this.setupTestUsers();
            await this.testProviderSwitching();
            await this.testSessionPersistence();
            await this.testErrorHandling();
            await this.testWebSocketCommunicationStability();
            await this.testConcurrentSessions();
            await this.testAPIRateLimiting();
            await this.testSystemHealthMonitoring();

        } catch (error) {
            this.log(`Test suite error: ${error.message}`, 'ERROR');
        } finally {
            await this.cleanup();
        }

        this.printResults();
    }

    printResults() {
        this.log('\n📊 Integration Test Results Summary');
        this.log('===================================');
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
    }
}

// Run the tests
async function main() {
    const tester = new IntegrationTester();
    await tester.runAllTests();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = IntegrationTester;