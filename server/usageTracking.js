/**
 * MominAI Usage Tracking Service
 * Tracks premium feature usage and enforces limits
 */

class UsageTrackingService {
    constructor() {
        this.usage = new Map(); // userId -> usage data
        this.limits = {
            free: {
                aiRequests: 100,
                containerHours: 10,
                storage: 1024 * 1024 * 1024, // 1GB
                fileOperations: 1000
            },
            premium: {
                aiRequests: 500,
                containerHours: 100,
                storage: 10 * 1024 * 1024 * 1024, // 10GB
                fileOperations: 10000
            },
            team: {
                aiRequests: 1000,
                containerHours: 500,
                storage: 50 * 1024 * 1024 * 1024, // 50GB
                fileOperations: 50000
            },
            enterprise: {
                aiRequests: Infinity,
                containerHours: Infinity,
                storage: Infinity,
                fileOperations: Infinity
            }
        };
    }

    getUserUsage(userId, subscription = 'free') {
        if (!this.usage.has(userId)) {
            this.usage.set(userId, {
                aiRequests: 0,
                containerHours: 0,
                storage: 0,
                fileOperations: 0,
                lastReset: Date.now(),
                subscription: subscription
            });
        }
        
        return this.usage.get(userId);
    }

    canUseFeature(userId, feature, subscription = 'free') {
        const userUsage = this.getUserUsage(userId, subscription);
        const limits = this.limits[subscription] || this.limits.free;

        switch (feature) {
            case 'aiRequest':
                return userUsage.aiRequests < limits.aiRequests;
            case 'container':
                return userUsage.containerHours < limits.containerHours;
            case 'storage':
                return userUsage.storage < limits.storage;
            case 'fileOperation':
                return userUsage.fileOperations < limits.fileOperations;
            default:
                return false;
        }
    }

    recordUsage(userId, feature, amount = 1) {
        const userUsage = this.getUserUsage(userId);
        
        switch (feature) {
            case 'aiRequest':
                userUsage.aiRequests += amount;
                break;
            case 'container':
                userUsage.containerHours += amount;
                break;
            case 'storage':
                userUsage.storage += amount;
                break;
            case 'fileOperation':
                userUsage.fileOperations += amount;
                break;
        }

        this.usage.set(userId, userUsage);
    }

    getUsageStats(userId, subscription = 'free') {
        const userUsage = this.getUserUsage(userId, subscription);
        const limits = this.limits[subscription] || this.limits.free;

        return {
            aiRequests: {
                used: userUsage.aiRequests,
                limit: limits.aiRequests,
                remaining: Math.max(0, limits.aiRequests - userUsage.aiRequests),
                percentage: (userUsage.aiRequests / limits.aiRequests) * 100
            },
            containerHours: {
                used: userUsage.containerHours,
                limit: limits.containerHours,
                remaining: Math.max(0, limits.containerHours - userUsage.containerHours),
                percentage: (userUsage.containerHours / limits.containerHours) * 100
            },
            storage: {
                used: userUsage.storage,
                limit: limits.storage,
                remaining: Math.max(0, limits.storage - userUsage.storage),
                percentage: (userUsage.storage / limits.storage) * 100
            },
            fileOperations: {
                used: userUsage.fileOperations,
                limit: limits.fileOperations,
                remaining: Math.max(0, limits.fileOperations - userUsage.fileOperations),
                percentage: (userUsage.fileOperations / limits.fileOperations) * 100
            }
        };
    }

    resetUsage(userId) {
        const userUsage = this.getUserUsage(userId);
        userUsage.aiRequests = 0;
        userUsage.containerHours = 0;
        userUsage.storage = 0;
        userUsage.fileOperations = 0;
        userUsage.lastReset = Date.now();
        
        this.usage.set(userId, userUsage);
    }

    // Reset usage for all users (called daily)
    resetAllUsage() {
        for (const [userId, userUsage] of this.usage) {
            this.resetUsage(userId);
        }
    }

    getUsageLimitReached(userId, subscription = 'free') {
        const stats = this.getUsageStats(userId, subscription);
        
        return {
            aiRequests: stats.aiRequests.percentage >= 100,
            containerHours: stats.containerHours.percentage >= 100,
            storage: stats.storage.percentage >= 100,
            fileOperations: stats.fileOperations.percentage >= 100
        };
    }

    // Middleware to check usage limits
    checkUsageLimit(feature) {
        return (req, res, next) => {
            const userId = req.user.id;
            const subscription = req.user.subscription || 'free';
            
            if (!this.canUseFeature(userId, feature, subscription)) {
                const stats = this.getUsageStats(userId, subscription);
                const limits = this.limits[subscription] || this.limits.free;
                
                return res.status(429).json({
                    error: 'Usage limit reached',
                    feature: feature,
                    used: stats[feature]?.used || 0,
                    limit: limits[feature] || 0,
                    upgradeUrl: '/upgrade',
                    message: `You've reached your ${subscription} plan limit for ${feature}`
                });
            }
            
            next();
        };
    }

    // Middleware to record usage after successful operation
    recordUsageAfter(feature, amount = 1) {
        return (req, res, next) => {
            const originalSend = res.send;
            
            res.send = function(data) {
                // Only record usage if the response was successful
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    const userId = req.user?.id;
                    if (userId) {
                        // This would need to be injected into the request
                        // In a real implementation, you'd pass the service instance
                        // For now, we'll handle this in the route handlers
                    }
                }
                
                originalSend.call(this, data);
            };
            
            next();
        };
    }
}

module.exports = UsageTrackingService;
