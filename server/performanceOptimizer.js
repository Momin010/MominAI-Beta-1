/**
 * MominAI Performance Optimization Service
 * Optimizes system performance for high concurrent usage
 */

class PerformanceOptimizer {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
        this.connectionPool = new Map();
        this.performanceMetrics = {
            responseTime: [],
            memoryUsage: [],
            cpuUsage: [],
            activeConnections: 0,
            cacheHitRate: 0,
            cacheMissRate: 0
        };
        
        // Start performance monitoring
        this.startPerformanceMonitoring();
        
        // Cleanup intervals
        setInterval(() => this.cleanupCache(), 60000); // Clean cache every minute
        setInterval(() => this.cleanupConnections(), 30000); // Clean connections every 30 seconds
    }

    startPerformanceMonitoring() {
        // Monitor memory usage
        setInterval(() => {
            const memUsage = process.memoryUsage();
            this.performanceMetrics.memoryUsage.push({
                timestamp: Date.now(),
                heapUsed: memUsage.heapUsed,
                heapTotal: memUsage.heapTotal,
                rss: memUsage.rss
            });

            // Keep only last 100 measurements
            if (this.performanceMetrics.memoryUsage.length > 100) {
                this.performanceMetrics.memoryUsage = this.performanceMetrics.memoryUsage.slice(-100);
            }
        }, 10000); // Every 10 seconds

        // Monitor CPU usage
        setInterval(() => {
            const cpuUsage = process.cpuUsage();
            this.performanceMetrics.cpuUsage.push({
                timestamp: Date.now(),
                user: cpuUsage.user,
                system: cpuUsage.system
            });

            if (this.performanceMetrics.cpuUsage.length > 100) {
                this.performanceMetrics.cpuUsage = this.performanceMetrics.cpuUsage.slice(-100);
            }
        }, 10000);
    }

    // Response time tracking middleware
    trackResponseTime() {
        return (req, res, next) => {
            const startTime = Date.now();
            
            res.on('finish', () => {
                const responseTime = Date.now() - startTime;
                this.performanceMetrics.responseTime.push({
                    timestamp: Date.now(),
                    path: req.path,
                    method: req.method,
                    statusCode: res.statusCode,
                    responseTime: responseTime
                });

                // Keep only last 1000 measurements
                if (this.performanceMetrics.responseTime.length > 1000) {
                    this.performanceMetrics.responseTime = this.performanceMetrics.responseTime.slice(-1000);
                }
            });

            next();
        };
    }

    // Caching middleware
    cacheMiddleware(ttl = this.cacheTimeout) {
        return (req, res, next) => {
            const cacheKey = `${req.method}:${req.path}:${JSON.stringify(req.query)}`;
            const cached = this.cache.get(cacheKey);

            if (cached && Date.now() - cached.timestamp < ttl) {
                this.performanceMetrics.cacheHitRate++;
                return res.json(cached.data);
            }

            // Store original res.json
            const originalJson = res.json.bind(res);
            
            res.json = (data) => {
                // Cache the response
                this.cache.set(cacheKey, {
                    data: data,
                    timestamp: Date.now()
                });
                
                this.performanceMetrics.cacheMissRate++;
                return originalJson(data);
            };

            next();
        };
    }

    // Connection pooling
    getConnection(userId) {
        if (!this.connectionPool.has(userId)) {
            this.connectionPool.set(userId, {
                connections: [],
                lastActivity: Date.now(),
                maxConnections: 5
            });
        }
        
        return this.connectionPool.get(userId);
    }

    addConnection(userId, connectionId) {
        const pool = this.getConnection(userId);
        
        if (pool.connections.length < pool.maxConnections) {
            pool.connections.push({
                id: connectionId,
                createdAt: Date.now(),
                lastActivity: Date.now()
            });
            pool.lastActivity = Date.now();
            this.performanceMetrics.activeConnections++;
            return true;
        }
        
        return false; // Pool is full
    }

    removeConnection(userId, connectionId) {
        const pool = this.connectionPool.get(userId);
        if (pool) {
            pool.connections = pool.connections.filter(conn => conn.id !== connectionId);
            pool.lastActivity = Date.now();
            this.performanceMetrics.activeConnections = Math.max(0, this.performanceMetrics.activeConnections - 1);
            
            // Remove empty pools
            if (pool.connections.length === 0) {
                this.connectionPool.delete(userId);
            }
        }
    }

    // Memory optimization
    optimizeMemory() {
        // Force garbage collection if available
        if (global.gc) {
            global.gc();
        }

        // Clear old cache entries
        this.cleanupCache();

        // Clear old performance metrics
        const now = Date.now();
        const maxAge = 30 * 60 * 1000; // 30 minutes

        this.performanceMetrics.responseTime = this.performanceMetrics.responseTime.filter(
            metric => now - metric.timestamp < maxAge
        );
        this.performanceMetrics.memoryUsage = this.performanceMetrics.memoryUsage.filter(
            metric => now - metric.timestamp < maxAge
        );
        this.performanceMetrics.cpuUsage = this.performanceMetrics.cpuUsage.filter(
            metric => now - metric.timestamp < maxAge
        );
    }

    cleanupCache() {
        const now = Date.now();
        for (const [key, value] of this.cache) {
            if (now - value.timestamp > this.cacheTimeout) {
                this.cache.delete(key);
            }
        }
    }

    cleanupConnections() {
        const now = Date.now();
        const maxIdleTime = 10 * 60 * 1000; // 10 minutes

        for (const [userId, pool] of this.connectionPool) {
            if (now - pool.lastActivity > maxIdleTime) {
                this.connectionPool.delete(userId);
                this.performanceMetrics.activeConnections = Math.max(0, this.performanceMetrics.activeConnections - pool.connections.length);
            }
        }
    }

    // Load balancing
    getOptimalServer() {
        // In a real implementation, this would check server load
        // and return the least loaded server
        return {
            host: 'localhost',
            port: 3001,
            load: 0.5
        };
    }

    // Rate limiting optimization
    optimizeRateLimits() {
        // Adjust rate limits based on system performance
        const avgResponseTime = this.getAverageResponseTime();
        const memoryUsage = this.getCurrentMemoryUsage();
        
        if (avgResponseTime > 1000) { // If response time is high
            return {
                windowMs: 15 * 60 * 1000,
                maxRequests: 50 // Reduce rate limit
            };
        } else if (memoryUsage > 0.8) { // If memory usage is high
            return {
                windowMs: 15 * 60 * 1000,
                maxRequests: 75
            };
        } else {
            return {
                windowMs: 15 * 60 * 1000,
                maxRequests: 100 // Normal rate limit
            };
        }
    }

    getAverageResponseTime() {
        if (this.performanceMetrics.responseTime.length === 0) return 0;
        
        const total = this.performanceMetrics.responseTime.reduce(
            (sum, metric) => sum + metric.responseTime, 0
        );
        return total / this.performanceMetrics.responseTime.length;
    }

    getCurrentMemoryUsage() {
        const memUsage = process.memoryUsage();
        return memUsage.heapUsed / memUsage.heapTotal;
    }

    // Performance analytics
    getPerformanceReport() {
        const avgResponseTime = this.getAverageResponseTime();
        const memoryUsage = this.getCurrentMemoryUsage();
        const cacheHitRate = this.performanceMetrics.cacheHitRate / 
            (this.performanceMetrics.cacheHitRate + this.performanceMetrics.cacheMissRate) * 100;

        return {
            responseTime: {
                average: avgResponseTime,
                p95: this.getPercentile(95),
                p99: this.getPercentile(99)
            },
            memory: {
                current: memoryUsage,
                heapUsed: process.memoryUsage().heapUsed,
                heapTotal: process.memoryUsage().heapTotal
            },
            connections: {
                active: this.performanceMetrics.activeConnections,
                pools: this.connectionPool.size
            },
            cache: {
                hitRate: cacheHitRate || 0,
                size: this.cache.size,
                timeout: this.cacheTimeout
            },
            recommendations: this.getPerformanceRecommendations()
        };
    }

    getPercentile(percentile) {
        if (this.performanceMetrics.responseTime.length === 0) return 0;
        
        const sorted = this.performanceMetrics.responseTime
            .map(m => m.responseTime)
            .sort((a, b) => a - b);
        
        const index = Math.ceil((percentile / 100) * sorted.length) - 1;
        return sorted[index] || 0;
    }

    getPerformanceRecommendations() {
        const recommendations = [];
        const avgResponseTime = this.getAverageResponseTime();
        const memoryUsage = this.getCurrentMemoryUsage();
        const cacheHitRate = this.performanceMetrics.cacheHitRate / 
            (this.performanceMetrics.cacheHitRate + this.performanceMetrics.cacheMissRate) * 100;

        if (avgResponseTime > 1000) {
            recommendations.push('Consider implementing more aggressive caching');
            recommendations.push('Review database query optimization');
        }

        if (memoryUsage > 0.8) {
            recommendations.push('Memory usage is high - consider increasing server resources');
            recommendations.push('Implement more frequent garbage collection');
        }

        if (cacheHitRate < 50) {
            recommendations.push('Cache hit rate is low - review caching strategy');
        }

        if (this.performanceMetrics.activeConnections > 1000) {
            recommendations.push('High connection count - consider connection pooling');
        }

        return recommendations;
    }
}

module.exports = PerformanceOptimizer;
