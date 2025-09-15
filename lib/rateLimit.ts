// Browser-safe rate limiting utilities
// This is a simplified version for frontend use

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: any) => string;
}

// Simplified rate limiting for frontend use
export function createRateLimit(config: RateLimitConfig) {
  return async function rateLimitMiddleware(
    req: any,
    res: any,
    next: () => void
  ) {
    // For frontend, just pass through without rate limiting
    next();
  };
}

// Simplified auth-aware rate limiting
export function createAuthAwareRateLimit(config: {
  authenticated: RateLimitConfig;
  unauthenticated: RateLimitConfig;
}) {
  return async function authAwareRateLimit(
    req: any,
    res: any,
    next: () => void
  ) {
    // For frontend, just pass through without rate limiting
    next();
  };
}

// Pre-configured rate limiters (dummy implementations)
export const rateLimiters = {
  aiGeneration: {
    windowMs: 60 * 1000,
    maxRequests: 10
  },
  auth: {
    windowMs: 15 * 60 * 1000,
    maxRequests: 5
  },
  proxy: {
    windowMs: 60 * 1000,
    maxRequests: 100
  },
  general: {
    windowMs: 60 * 1000,
    maxRequests: 60
  }
};

// Dummy authentication functions
export function isAuthenticatedNextRequest(req: any): boolean {
  return false; // Always return false for frontend
}

export function isAuthenticatedVercelRequest(req: any): boolean {
  return false; // Always return false for frontend
}