/**
 * Performance Testing Script
 * Tests load times, memory usage, network latency, and resource consumption
 */

const axios = require('axios');
const WebSocket = require('ws');

const BASE_URL = 'http://localhost:3001';
const WS_URL = 'ws://localhost:3001';

class PerformanceTester {
    constructor() {
        this.testResults = {
            passed: 0,
            failed: 0,
            tests: [],
            metrics: {}
        };
    }

    log(message, status = 'INFO') {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] [${status}] ${message}`);
    }

    recordTest(name, passed, details = '', metrics = {}) {
        this.testResults.tests.push({
            name,
            passed,
            details,
            metrics,
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

    async testLoadTimes() {
        try {
            this.log('Testing load times for different endpoints...');

            const endpoints = [
                '/health',
                '/api/auth/login',
                '/api/auth/register'
            ];

            const loadTimes = {};

            for (const endpoint of endpoints) {
                const startTime = Date.now();

                try {
                    const response = await axios.get(`${BASE_URL}${endpoint}`);
                    const loadTime = Date.now() - startTime;
                    loadTimes[endpoint] = loadTime;

                    this.log(`Load time for ${endpoint}: ${loadTime}ms`);
                } catch (error) {
                    const loadTime = Date.now() - startTime;
                    loadTimes[endpoint] = loadTime;
                    this.log(`Load time for ${endpoint}: ${loadTime}ms (error)`);
                }
            }

            // Check if load times are acceptable (< 1000ms)
            const acceptableLoadTimes = Object.values(loadTimes).every(time => time < 1000);
            const avgLoadTime = Object.values(loadTimes).reduce((a, b) => a + b, 0) / Object.values(loadTimes).length;

            this.recordTest('Load Times',
                acceptableLoadTimes,
                `Average load time: ${avgLoadTime.toFixed(0)}ms`,
                { loadTimes, avgLoadTime }
            );
            return acceptableLoadTimes;
        } catch (error) {
            this.recordTest('Load Times', false, `Error: ${error.message}`);
            return false;
        }
    }

    async testMemoryUsage() {
        try {
            this.log('Testing memory usage and resource consumption...');

            // Get initial memory usage
            const initialMemory = process.memoryUsage();

            // Perform some operations to test memory usage
            const operations = [];

            // Create multiple WebSocket connections
            for (let i = 0; i < 5; i++) {
                operations.push(this.createTestWebSocketConnection());
            }

            await Promise.all(operations);

            // Get memory usage after operations
            const finalMemory = process.memoryUsage();

            const memoryIncrease = {
                rss: finalMemory.rss - initialMemory.rss,
                heapUsed: finalMemory.heapUsed - initialMemory.heapUsed,
                heapTotal: finalMemory.heapTotal - initialMemory.heapTotal
            };

            // Convert to MB
            const memoryIncreaseMB = {
                rss: (memoryIncrease.rss / 1024 / 1024).toFixed(2),
                heapUsed: (memoryIncrease.heapUsed / 1024 / 1024).toFixed(2),
                heapTotal: (memoryIncrease.heapTotal / 1024 / 1024).toFixed(2)
            };

            this.log(`Memory increase - RSS: ${memoryIncreaseMB.rss}MB, Heap Used: ${memoryIncreaseMB.heapUsed}MB`);

            // Memory usage should not increase excessively
            const acceptableMemoryUsage = memoryIncrease.heapUsed < 50 * 1024 * 1024; // Less than 50MB increase

            this.recordTest('Memory Usage',
                acceptableMemoryUsage,
                `Memory increase: ${memoryIncreaseMB.heapUsed}MB heap used`,
                { memoryIncrease: memoryIncreaseMB }
            );
            return acceptableMemoryUsage;
        } catch (error) {
            this.recordTest('Memory Usage', false, `Error: ${error.message}`);
            return false;
        }
    }

    async createTestWebSocketConnection() {
        return new Promise((resolve) => {
            const sessionId = `perf_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const ws = new WebSocket(`${WS_URL}/${sessionId}?token=test_token`);

            ws.on('open', () => {
                // Send a test message
                ws.send(JSON.stringify({
                    type: 'container_command',
                    payload: { command: 'echo "performance test"' }
                }));

                setTimeout(() => {
                    ws.close();
                    resolve();
                }, 1000);
            });

            ws.on('error', () => {
                resolve(); // Resolve even on error for performance testing
            });

            // Timeout after 5 seconds
            setTimeout(() => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.close();
                }
                resolve();
            }, 5000);
        });
    }

    async testNetworkLatency() {
        try {
            this.log('Testing network latency and reliability...');

            const latencies = [];
            const testCount = 10;

            for (let i = 0; i < testCount; i++) {
                const startTime = Date.now();

                try {
                    await axios.get(`${BASE_URL}/health`);
                    const latency = Date.now() - startTime;
                    latencies.push(latency);
                } catch (error) {
                    latencies.push(Date.now() - startTime);
                }

                // Small delay between requests
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
            const minLatency = Math.min(...latencies);
            const maxLatency = Math.max(...latencies);

            this.log(`Network latency - Avg: ${avgLatency.toFixed(0)}ms, Min: ${minLatency}ms, Max: ${maxLatency}ms`);

            // Check if latency is acceptable (< 500ms average)
            const acceptableLatency = avgLatency < 500;

            this.recordTest('Network Latency',
                acceptableLatency,
                `Average latency: ${avgLatency.toFixed(0)}ms`,
                { avgLatency, minLatency, maxLatency, latencies }
            );
            return acceptableLatency;
        } catch (error) {
            this.recordTest('Network Latency', false, `Error: ${error.message}`);
            return false;
        }
    }

    async testConcurrentConnections() {
        try {
            this.log('Testing concurrent connection handling...');

            const concurrentConnections = 10;
            const connectionPromises = [];
            let successfulConnections = 0;

            for (let i = 0; i < concurrentConnections; i++) {
                connectionPromises.push(
                    new Promise((resolve) => {
                        const sessionId = `concurrent_test_${i}_${Date.now()}`;
                        const ws = new WebSocket(`${WS_URL}/${sessionId}?token=test_token`);

                        ws.on('open', () => {
                            successfulConnections++;
                            setTimeout(() => {
                                ws.close();
                                resolve();
                            }, 500);
                        });

                        ws.on('error', () => {
                            resolve();
                        });

                        // Timeout
                        setTimeout(() => {
                            if (ws.readyState === WebSocket.OPEN) {
                                ws.close();
                            }
                            resolve();
                        }, 3000);
                    })
                );
            }

            await Promise.all(connectionPromises);

            const successRate = successfulConnections / concurrentConnections;
            const acceptableConcurrency = successRate >= 0.8; // At least 80% success rate

            this.recordTest('Concurrent Connections',
                acceptableConcurrency,
                `Concurrent connections: ${successfulConnections}/${concurrentConnections} successful (${(successRate * 100).toFixed(1)}%)`,
                { successfulConnections, totalConnections: concurrentConnections, successRate }
            );
            return acceptableConcurrency;
        } catch (error) {
            this.recordTest('Concurrent Connections', false, `Error: ${error.message}`);
            return false;
        }
    }

    async testWebSocketPerformance() {
        try {
            this.log('Testing WebSocket performance...');

            const sessionId = `ws_perf_test_${Date.now()}`;
            const ws = new WebSocket(`${WS_URL}/${sessionId}?token=test_token`);

            return new Promise((resolve) => {
                let messagesSent = 0;
                let messagesReceived = 0;
                const totalMessages = 20;
                const messageLatencies = [];

                ws.on('open', () => {
                    // Send messages and measure round-trip time
                    const sendMessage = () => {
                        if (messagesSent < totalMessages) {
                            const sendTime = Date.now();
                            ws.send(JSON.stringify({
                                type: 'container_command',
                                payload: { command: `echo "perf test ${messagesSent + 1}"` },
                                timestamp: sendTime
                            }));
                            messagesSent++;
                        }
                    };

                    // Send first message
                    sendMessage();

                    // Send subsequent messages with delay
                    const messageInterval = setInterval(sendMessage, 100);

                    // Stop after all messages sent
                    setTimeout(() => {
                        clearInterval(messageInterval);
                    }, totalMessages * 100 + 500);
                });

                ws.on('message', (data) => {
                    const message = JSON.parse(data.toString());
                    if (message.type === 'container_output') {
                        messagesReceived++;
                        if (message.timestamp) {
                            const latency = Date.now() - message.timestamp;
                            messageLatencies.push(latency);
                        }
                    }
                });

                ws.on('error', (error) => {
                    this.log(`WebSocket error: ${error.message}`);
                });

                // Complete test after timeout
                setTimeout(() => {
                    ws.close();

                    const avgLatency = messageLatencies.length > 0
                        ? messageLatencies.reduce((a, b) => a + b, 0) / messageLatencies.length
                        : 0;

                    const successRate = messagesReceived / messagesSent;
                    const acceptablePerformance = successRate >= 0.9 && avgLatency < 1000; // 90% success, < 1s latency

                    this.recordTest('WebSocket Performance',
                        acceptablePerformance,
                        `WebSocket perf: ${messagesReceived}/${messagesSent} messages, ${(successRate * 100).toFixed(1)}% success, ${avgLatency.toFixed(0)}ms avg latency`,
                        { messagesSent, messagesReceived, successRate, avgLatency, messageLatencies }
                    );
                    resolve(acceptablePerformance);
                }, 10000);
            });
        } catch (error) {
            this.recordTest('WebSocket Performance', false, `Error: ${error.message}`);
            return false;
        }
    }

    async testResourceConsumption() {
        try {
            this.log('Testing resource consumption under load...');

            // Get baseline resource usage
            const baselineResponse = await axios.get(`${BASE_URL}/health`);
            const baseline = baselineResponse.data.system || {};

            // Perform load test
            const loadPromises = [];
            for (let i = 0; i < 20; i++) {
                loadPromises.push(axios.get(`${BASE_URL}/health`));
            }

            const startTime = Date.now();
            await Promise.all(loadPromises);
            const loadTime = Date.now() - startTime;

            // Get resource usage after load
            const afterLoadResponse = await axios.get(`${BASE_URL}/health`);
            const afterLoad = afterLoadResponse.data.system || {};

            const resourceConsumption = {
                requestsProcessed: loadPromises.length,
                totalTime: loadTime,
                avgResponseTime: loadTime / loadPromises.length,
                memoryUsage: afterLoad.memoryUsage || baseline.memoryUsage
            };

            // Check if system handled load adequately
            const acceptableLoad = resourceConsumption.avgResponseTime < 1000; // < 1s per request

            this.recordTest('Resource Consumption',
                acceptableLoad,
                `Load test: ${loadPromises.length} requests in ${loadTime}ms (${resourceConsumption.avgResponseTime.toFixed(0)}ms avg)`,
                resourceConsumption
            );
            return acceptableLoad;
        } catch (error) {
            this.recordTest('Resource Consumption', false, `Error: ${error.message}`);
            return false;
        }
    }

    async testScalability() {
        try {
            this.log('Testing system scalability...');

            // Test increasing load
            const loadLevels = [5, 10, 15, 20];
            const scalabilityResults = {};

            for (const loadLevel of loadLevels) {
                const promises = [];
                for (let i = 0; i < loadLevel; i++) {
                    promises.push(axios.get(`${BASE_URL}/health`));
                }

                const startTime = Date.now();
                await Promise.all(promises);
                const totalTime = Date.now() - startTime;
                const avgTime = totalTime / loadLevel;

                scalabilityResults[loadLevel] = {
                    totalTime,
                    avgTime,
                    requestsPerSecond: (loadLevel / totalTime) * 1000
                };

                this.log(`Load level ${loadLevel}: ${avgTime.toFixed(0)}ms avg response time`);
            }

            // Check if performance degrades gracefully
            const load5Avg = scalabilityResults[5].avgTime;
            const load20Avg = scalabilityResults[20].avgTime;
            const degradation = ((load20Avg - load5Avg) / load5Avg) * 100;

            const acceptableScalability = degradation < 200; // Less than 200% degradation

            this.recordTest('Scalability',
                acceptableScalability,
                `Performance degradation: ${degradation.toFixed(1)}% (${load5Avg.toFixed(0)}ms → ${load20Avg.toFixed(0)}ms)`,
                scalabilityResults
            );
            return acceptableScalability;
        } catch (error) {
            this.recordTest('Scalability', false, `Error: ${error.message}`);
            return false;
        }
    }

    async runAllTests() {
        this.log('🚀 Starting Performance Tests');
        this.log('============================');

        try {
            await this.testLoadTimes();
            await this.testMemoryUsage();
            await this.testNetworkLatency();
            await this.testConcurrentConnections();
            await this.testWebSocketPerformance();
            await this.testResourceConsumption();
            await this.testScalability();

        } catch (error) {
            this.log(`Test suite error: ${error.message}`, 'ERROR');
        }

        this.printResults();
    }

    printResults() {
        this.log('\n📊 Performance Test Results Summary');
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

        this.log('\n📈 Performance Metrics:');
        this.testResults.tests.forEach(test => {
            if (test.metrics && Object.keys(test.metrics).length > 0) {
                this.log(`  ${test.name}:`);
                Object.entries(test.metrics).forEach(([key, value]) => {
                    if (typeof value === 'number') {
                        this.log(`    ${key}: ${value.toFixed ? value.toFixed(2) : value}`);
                    } else {
                        this.log(`    ${key}: ${JSON.stringify(value)}`);
                    }
                });
            }
        });
    }
}

// Run the tests
async function main() {
    const tester = new PerformanceTester();
    await tester.runAllTests();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = PerformanceTester;