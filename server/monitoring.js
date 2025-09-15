/**
 * MominAI Monitoring and Alerting System
 * Comprehensive monitoring for production deployment
 */

const fs = require('fs').promises;
const path = require('path');

class MonitoringService {
    constructor() {
        this.metrics = {
            requests: {
                total: 0,
                successful: 0,
                failed: 0,
                rateLimited: 0
            },
            users: {
                active: 0,
                total: 0,
                premium: 0
            },
            containers: {
                active: 0,
                created: 0,
                destroyed: 0,
                errors: 0
            },
            performance: {
                avgResponseTime: 0,
                memoryUsage: 0,
                cpuUsage: 0
            },
            errors: {
                auth: 0,
                container: 0,
                filesystem: 0,
                websocket: 0
            }
        };
        
        this.alerts = [];
        this.startTime = Date.now();
        this.logFile = path.join(__dirname, 'logs', 'monitoring.log');
        
        // Ensure logs directory exists
        this.ensureLogDirectory();
        
        // Start monitoring intervals
        this.startMonitoring();
    }

    async ensureLogDirectory() {
        try {
            await fs.mkdir(path.dirname(this.logFile), { recursive: true });
        } catch (error) {
            console.error('Failed to create logs directory:', error);
        }
    }

    startMonitoring() {
        // Update metrics every 30 seconds
        setInterval(() => {
            this.updateSystemMetrics();
        }, 30000);

        // Check for alerts every minute
        setInterval(() => {
            this.checkAlerts();
        }, 60000);

        // Log metrics every 5 minutes
        setInterval(() => {
            this.logMetrics();
        }, 300000);
    }

    updateSystemMetrics() {
        const memUsage = process.memoryUsage();
        this.metrics.performance.memoryUsage = memUsage.heapUsed / 1024 / 1024; // MB
        this.metrics.performance.cpuUsage = process.cpuUsage().user / 1000000; // seconds
    }

    recordRequest(success = true, rateLimited = false) {
        this.metrics.requests.total++;
        if (rateLimited) {
            this.metrics.requests.rateLimited++;
        } else if (success) {
            this.metrics.requests.successful++;
        } else {
            this.metrics.requests.failed++;
        }
    }

    recordUserAction(action, isPremium = false) {
        switch (action) {
            case 'login':
                this.metrics.users.active++;
                this.metrics.users.total++;
                if (isPremium) this.metrics.users.premium++;
                break;
            case 'logout':
                this.metrics.users.active = Math.max(0, this.metrics.users.active - 1);
                break;
        }
    }

    recordContainerAction(action) {
        switch (action) {
            case 'created':
                this.metrics.containers.created++;
                this.metrics.containers.active++;
                break;
            case 'destroyed':
                this.metrics.containers.destroyed++;
                this.metrics.containers.active = Math.max(0, this.metrics.containers.active - 1);
                break;
            case 'error':
                this.metrics.containers.errors++;
                break;
        }
    }

    recordError(type) {
        if (this.metrics.errors[type] !== undefined) {
            this.metrics.errors[type]++;
        }
    }

    checkAlerts() {
        const now = Date.now();
        const uptime = (now - this.startTime) / 1000 / 60; // minutes

        // High error rate alert
        const errorRate = this.metrics.requests.failed / Math.max(this.metrics.requests.total, 1);
        if (errorRate > 0.1) { // 10% error rate
            this.createAlert('high_error_rate', `Error rate is ${(errorRate * 100).toFixed(1)}%`);
        }

        // High memory usage alert
        if (this.metrics.performance.memoryUsage > 500) { // 500MB
            this.createAlert('high_memory', `Memory usage is ${this.metrics.performance.memoryUsage.toFixed(1)}MB`);
        }

        // High rate limiting alert
        const rateLimitRate = this.metrics.requests.rateLimited / Math.max(this.metrics.requests.total, 1);
        if (rateLimitRate > 0.2) { // 20% rate limited
            this.createAlert('high_rate_limiting', `Rate limiting is ${(rateLimitRate * 100).toFixed(1)}%`);
        }

        // Container errors alert
        if (this.metrics.containers.errors > 10) {
            this.createAlert('container_errors', `${this.metrics.containers.errors} container errors`);
        }
    }

    createAlert(type, message) {
        const alert = {
            id: Date.now().toString(),
            type,
            message,
            timestamp: new Date().toISOString(),
            severity: this.getAlertSeverity(type)
        };

        this.alerts.push(alert);
        this.logAlert(alert);

        // Keep only last 100 alerts
        if (this.alerts.length > 100) {
            this.alerts = this.alerts.slice(-100);
        }
    }

    getAlertSeverity(type) {
        const severityMap = {
            'high_error_rate': 'critical',
            'high_memory': 'warning',
            'high_rate_limiting': 'warning',
            'container_errors': 'error'
        };
        return severityMap[type] || 'info';
    }

    async logAlert(alert) {
        const logEntry = `[${alert.timestamp}] [${alert.severity.toUpperCase()}] ${alert.type}: ${alert.message}\n`;
        try {
            await fs.appendFile(this.logFile, logEntry);
        } catch (error) {
            console.error('Failed to write alert to log:', error);
        }
    }

    async logMetrics() {
        const metricsEntry = {
            timestamp: new Date().toISOString(),
            uptime: (Date.now() - this.startTime) / 1000,
            metrics: { ...this.metrics }
        };

        const logEntry = `[${metricsEntry.timestamp}] METRICS: ${JSON.stringify(metricsEntry)}\n`;
        try {
            await fs.appendFile(this.logFile, logEntry);
        } catch (error) {
            console.error('Failed to write metrics to log:', error);
        }
    }

    getMetrics() {
        return {
            ...this.metrics,
            uptime: (Date.now() - this.startTime) / 1000,
            alerts: this.alerts.slice(-10) // Last 10 alerts
        };
    }

    getHealthStatus() {
        const errorRate = this.metrics.requests.failed / Math.max(this.metrics.requests.total, 1);
        const memoryUsage = this.metrics.performance.memoryUsage;

        let status = 'healthy';
        let issues = [];

        if (errorRate > 0.1) {
            status = 'degraded';
            issues.push(`High error rate: ${(errorRate * 100).toFixed(1)}%`);
        }

        if (memoryUsage > 500) {
            status = 'degraded';
            issues.push(`High memory usage: ${memoryUsage.toFixed(1)}MB`);
        }

        if (this.alerts.some(alert => alert.severity === 'critical')) {
            status = 'unhealthy';
            issues.push('Critical alerts present');
        }

        return {
            status,
            issues,
            metrics: this.getMetrics()
        };
    }
}

module.exports = MonitoringService;
