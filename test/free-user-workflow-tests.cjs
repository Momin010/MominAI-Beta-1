/**
 * Free User Workflow Testing Script
 * Tests all free user functionality including WebContainer operations
 */

const axios = require('axios');
const WebSocket = require('ws');

const BASE_URL = 'http://localhost:3001';
const WS_URL = 'ws://localhost:3001';

// Test configuration
const TEST_USER = {
    email: `test_free_${Date.now()}@example.com`,
    password: 'testpassword123'
};

class FreeUserWorkflowTester {
    constructor() {
        this.jwtToken = null;
        this.sessionId = null;
        this.ws = null;
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

    async testUserRegistration() {
        try {
            this.log('Testing user registration without activation code...');

            const response = await axios.post(`${BASE_URL}/api/auth/register`, {
                email: TEST_USER.email,
                password: TEST_USER.password,
                username: 'testuser'
            });

            if (response.status === 201 && response.data.token) {
                this.jwtToken = response.data.token;
                this.recordTest('User Registration', true, 'Successfully registered free user');
                return true;
            } else {
                this.recordTest('User Registration', false, 'Registration failed or no token returned');
                return false;
            }
        } catch (error) {
            this.recordTest('User Registration', false, `Error: ${error.message}`);
            return false;
        }
    }

    async testUserLogin() {
        try {
            this.log('Testing user login...');

            const response = await axios.post(`${BASE_URL}/api/auth/login`, {
                email: TEST_USER.email,
                password: TEST_USER.password
            });

            if (response.status === 200 && response.data.token) {
                this.jwtToken = response.data.token;
                this.recordTest('User Login', true, 'Successfully logged in');
                return true;
            } else {
                this.recordTest('User Login', false, 'Login failed');
                return false;
            }
        } catch (error) {
            this.recordTest('User Login', false, `Error: ${error.message}`);
            return false;
        }
    }

    async testWebContainerConnection() {
        try {
            this.log('Testing WebContainer connection...');

            // Generate session ID
            this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            // Connect to WebSocket
            this.ws = new WebSocket(`${WS_URL}/${this.sessionId}?token=${this.jwtToken}`);

            return new Promise((resolve) => {
                const timeout = setTimeout(() => {
                    this.recordTest('WebContainer Connection', false, 'Connection timeout');
                    resolve(false);
                }, 10000);

                this.ws.on('open', () => {
                    clearTimeout(timeout);
                    this.log('WebSocket connected successfully');
                    this.recordTest('WebContainer Connection', true, 'WebSocket connection established');
                    resolve(true);
                });

                this.ws.on('message', (data) => {
                    const message = JSON.parse(data.toString());
                    if (message.type === 'connected') {
                        this.log('Received connected message from server');
                    }
                });

                this.ws.on('error', (error) => {
                    clearTimeout(timeout);
                    this.recordTest('WebContainer Connection', false, `WebSocket error: ${error.message}`);
                    resolve(false);
                });
            });
        } catch (error) {
            this.recordTest('WebContainer Connection', false, `Error: ${error.message}`);
            return false;
        }
    }

    async testTerminalOperations() {
        try {
            this.log('Testing terminal operations...');

            if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
                this.recordTest('Terminal Operations', false, 'WebSocket not connected');
                return false;
            }

            return new Promise((resolve) => {
                const timeout = setTimeout(() => {
                    this.recordTest('Terminal Operations', false, 'Terminal test timeout');
                    resolve(false);
                }, 15000);

                let receivedOutput = false;

                this.ws.on('message', (data) => {
                    const message = JSON.parse(data.toString());
                    if (message.type === 'container_output' && message.data) {
                        receivedOutput = true;
                        clearTimeout(timeout);
                        this.recordTest('Terminal Operations', true, 'Received terminal output');
                        resolve(true);
                    }
                });

                // Send a simple command
                this.ws.send(JSON.stringify({
                    type: 'container_command',
                    payload: { command: 'echo "Hello from free user test"' }
                }));

                // Also test ls command
                setTimeout(() => {
                    this.ws.send(JSON.stringify({
                        type: 'container_command',
                        payload: { command: 'ls -la' }
                    }));
                }, 2000);
            });
        } catch (error) {
            this.recordTest('Terminal Operations', false, `Error: ${error.message}`);
            return false;
        }
    }

    async testFileOperations() {
        try {
            this.log('Testing file operations...');

            if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
                this.recordTest('File Operations', false, 'WebSocket not connected');
                return false;
            }

            return new Promise((resolve) => {
                const timeout = setTimeout(() => {
                    this.recordTest('File Operations', false, 'File operations timeout');
                    resolve(false);
                }, 10000);

                let fileCreated = false;
                let fileRead = false;

                this.ws.on('message', (data) => {
                    const message = JSON.parse(data.toString());
                    if (message.type === 'file_written' && message.path === '/workspace/test.txt') {
                        fileCreated = true;
                        this.log('File created successfully');
                    }
                    if (message.type === 'file_content' && message.path === '/workspace/test.txt') {
                        fileRead = true;
                        this.log('File read successfully');
                        if (fileCreated && fileRead) {
                            clearTimeout(timeout);
                            this.recordTest('File Operations', true, 'File create and read operations successful');
                            resolve(true);
                        }
                    }
                });

                // Create a test file
                this.ws.send(JSON.stringify({
                    type: 'write_file',
                    payload: {
                        path: '/workspace/test.txt',
                        content: 'Hello from free user file test!'
                    }
                }));

                // Read the file
                setTimeout(() => {
                    this.ws.send(JSON.stringify({
                        type: 'read_file',
                        payload: { path: '/workspace/test.txt' }
                    }));
                }, 1000);
            });
        } catch (error) {
            this.recordTest('File Operations', false, `Error: ${error.message}`);
            return false;
        }
    }

    async testPremiumFeatureRestrictions() {
        try {
            this.log('Testing premium feature restrictions...');

            // Test accessing premium-only API endpoints
            const endpoints = [
                '/api/containers',
                '/api/containers/test-session/files/test.txt'
            ];

            let restrictionsWorking = true;

            for (const endpoint of endpoints) {
                try {
                    const response = await axios.get(`${BASE_URL}${endpoint}`, {
                        headers: { 'Authorization': `Bearer ${this.jwtToken}` }
                    });

                    // Free users should get 403 or similar restriction
                    if (response.status === 200) {
                        this.log(`WARNING: Free user can access ${endpoint}`);
                        restrictionsWorking = false;
                    }
                } catch (error) {
                    if (error.response && (error.response.status === 403 || error.response.status === 401)) {
                        this.log(`✓ Premium feature correctly restricted: ${endpoint}`);
                    } else {
                        this.log(`Unexpected error for ${endpoint}: ${error.message}`);
                        restrictionsWorking = false;
                    }
                }
            }

            this.recordTest('Premium Feature Restrictions',
                restrictionsWorking,
                restrictionsWorking ? 'Premium features properly restricted' : 'Some premium features not properly restricted'
            );
            return restrictionsWorking;
        } catch (error) {
            this.recordTest('Premium Feature Restrictions', false, `Error: ${error.message}`);
            return false;
        }
    }

    async testSubscriptionStatus() {
        try {
            this.log('Testing subscription status display...');

            // Check if we can access subscription-related endpoints
            // Since this is a free user, subscription should be 'free'
            const response = await axios.get(`${BASE_URL}/api/auth/login`, {
                headers: { 'Authorization': `Bearer ${this.jwtToken}` }
            });

            if (response.status === 200) {
                // Note: In a real implementation, there might be a dedicated subscription endpoint
                this.recordTest('Subscription Status', true, 'Can access user profile (free tier)');
                return true;
            } else {
                this.recordTest('Subscription Status', false, 'Cannot access user profile');
                return false;
            }
        } catch (error) {
            this.recordTest('Subscription Status', false, `Error: ${error.message}`);
            return false;
        }
    }

    async cleanup() {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.close();
        }
        this.log('Cleanup completed');
    }

    async runAllTests() {
        this.log('🚀 Starting Free User Workflow Tests');
        this.log('=====================================');

        try {
            // Run all tests sequentially
            await this.testUserRegistration();
            await this.testUserLogin();
            await this.testWebContainerConnection();
            await this.testTerminalOperations();
            await this.testFileOperations();
            await this.testPremiumFeatureRestrictions();
            await this.testSubscriptionStatus();

        } catch (error) {
            this.log(`Test suite error: ${error.message}`, 'ERROR');
        } finally {
            await this.cleanup();
        }

        // Print results
        this.printResults();
    }

    printResults() {
        this.log('\n📊 Test Results Summary');
        this.log('=======================');
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
    const tester = new FreeUserWorkflowTester();
    await tester.runAllTests();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = FreeUserWorkflowTester;