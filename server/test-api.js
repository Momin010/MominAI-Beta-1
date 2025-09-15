#!/usr/bin/env node

/**
 * Simple API Test Script for MominAI Backend
 * Tests the main endpoints and WebSocket functionality
 */

const WebSocket = require('ws');
const http = require('http');

const BASE_URL = 'http://localhost:3001';
const WS_URL = 'ws://localhost:3001';

// Test data
const testUser = {
    email: 'test@example.com',
    password: 'testpassword',
    username: 'testuser'
};

let authToken = '';
let sessionId = '';

console.log('🚀 Starting MominAI Backend API Tests...\n');

// Test 1: Health Check
function testHealthCheck() {
    console.log('📊 Testing Health Check...');
    return new Promise((resolve) => {
        const req = http.get(`${BASE_URL}/health`, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const health = JSON.parse(data);
                    console.log('✅ Health Check:', health.status);
                    console.log('   Sessions:', health.sessions.total);
                    console.log('   Containers:', health.containers.total);
                    console.log('   Docker:', health.containers.docker ? 'Available' : 'Unavailable');
                    resolve(true);
                } catch (error) {
                    console.log('❌ Health Check failed:', error.message);
                    resolve(false);
                }
            });
        });

        req.on('error', (error) => {
            console.log('❌ Health Check connection failed:', error.message);
            resolve(false);
        });

        req.setTimeout(5000, () => {
            console.log('❌ Health Check timeout');
            req.destroy();
            resolve(false);
        });
    });
}

// Test 2: User Registration
function testUserRegistration() {
    console.log('\n👤 Testing User Registration...');
    return new Promise((resolve) => {
        const postData = JSON.stringify(testUser);

        const options = {
            hostname: 'localhost',
            port: 3001,
            path: '/api/auth/register',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    if (response.token) {
                        authToken = response.token;
                        console.log('✅ User Registration successful');
                        console.log('   Token received:', authToken.substring(0, 20) + '...');
                        resolve(true);
                    } else {
                        console.log('❌ Registration failed:', response.error || 'Unknown error');
                        resolve(false);
                    }
                } catch (error) {
                    console.log('❌ Registration response parsing failed:', error.message);
                    resolve(false);
                }
            });
        });

        req.on('error', (error) => {
            console.log('❌ Registration request failed:', error.message);
            resolve(false);
        });

        req.write(postData);
        req.end();
    });
}

// Test 3: WebSocket Connection
function testWebSocketConnection() {
    console.log('\n🌐 Testing WebSocket Connection...');
    return new Promise((resolve) => {
        if (!authToken) {
            console.log('❌ No auth token available for WebSocket test');
            resolve(false);
            return;
        }

        const wsUrl = `${WS_URL}/ws?token=${authToken}`;
        const ws = new WebSocket(wsUrl);

        ws.on('open', () => {
            console.log('✅ WebSocket connection established');
            sessionId = `test_session_${Date.now()}`;
            ws.close();
            resolve(true);
        });

        ws.on('error', (error) => {
            console.log('❌ WebSocket connection failed:', error.message);
            resolve(false);
        });

        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                console.log('📨 Received message:', message.type);
            } catch (error) {
                console.log('❌ Failed to parse WebSocket message:', error.message);
            }
        });
    });
}

// Test 4: Container Creation (requires auth)
function testContainerCreation() {
    console.log('\n🐳 Testing Container Creation...');
    return new Promise((resolve) => {
        if (!authToken) {
            console.log('❌ No auth token available for container test');
            resolve(false);
            return;
        }

        const postData = JSON.stringify({
            image: 'node:20-bullseye',
            name: 'test-container'
        });

        const options = {
            hostname: 'localhost',
            port: 3001,
            path: '/api/containers',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    if (response.sessionId) {
                        sessionId = response.sessionId;
                        console.log('✅ Container creation successful');
                        console.log('   Session ID:', sessionId);
                        console.log('   Container ID:', response.containerId || 'N/A');
                        resolve(true);
                    } else {
                        console.log('❌ Container creation failed:', response.error || 'Unknown error');
                        resolve(false);
                    }
                } catch (error) {
                    console.log('❌ Container creation response parsing failed:', error.message);
                    resolve(false);
                }
            });
        });

        req.on('error', (error) => {
            console.log('❌ Container creation request failed:', error.message);
            resolve(false);
        });

        req.write(postData);
        req.end();
    });
}

// Run all tests
async function runTests() {
    console.log('='.repeat(50));
    console.log('🧪 MominAI Backend API Test Suite');
    console.log('='.repeat(50));

    const results = [];

    // Test 1: Health Check
    results.push(await testHealthCheck());

    // Test 2: User Registration
    results.push(await testUserRegistration());

    // Test 3: WebSocket Connection
    results.push(await testWebSocketConnection());

    // Test 4: Container Creation
    results.push(await testContainerCreation());

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 Test Results Summary');
    console.log('='.repeat(50));

    const passed = results.filter(r => r).length;
    const total = results.length;

    console.log(`✅ Passed: ${passed}/${total}`);
    console.log(`❌ Failed: ${total - passed}/${total}`);

    if (passed === total) {
        console.log('\n🎉 All tests passed! Backend is ready.');
    } else {
        console.log('\n⚠️  Some tests failed. Check server logs for details.');
    }

    console.log('\n📝 Next Steps:');
    console.log('1. Start the server: npm start');
    console.log('2. Test with frontend application');
    console.log('3. Configure Docker for production use');
    console.log('4. Set up proper environment variables');

    process.exit(passed === total ? 0 : 1);
}

// Handle script execution
if (require.main === module) {
    runTests().catch((error) => {
        console.error('💥 Test suite failed:', error);
        process.exit(1);
    });
}

module.exports = { runTests, testHealthCheck, testUserRegistration, testWebSocketConnection, testContainerCreation };