import { Request, Response, NextFunction } from 'express';
import { redis } from '../redis';
import { logger } from '../logger';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  keyGenerator?: (req: Request) => string;
  condition?: (req: Request, res: Response) => boolean;
}

// Cache middleware for API responses
export function cacheMiddleware(options: CacheOptions = {}) {
  const {
    ttl = 300, // 5 minutes default
    keyGenerator = (req) => `api:${req.method}:${req.path}:${req.user?.id || 'anonymous'}`,
    condition = (req, res) => req.method === 'GET' && res.statusCode === 200
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    if (!redis.isConnected()) {
      return next();
    }

    const cacheKey = keyGenerator(req);

    // Try to get from cache for GET requests
    if (req.method === 'GET') {
      try {
        const cachedResponse = await redis.get(cacheKey);
        if (cachedResponse) {
          logger.info(`Cache hit for key: ${cacheKey}`);
          return res.json(cachedResponse);
        }
      } catch (error) {
        logger.error('Cache retrieval error', error);
      }
    }

    // Store original res.json method
    const originalJson = res.json.bind(res);

    // Override res.json to cache successful responses
    res.json = function(body: any) {
      // Cache the response if conditions are met
      if (condition(req, res)) {
        redis.set(cacheKey, body, ttl).catch(error => {
          logger.error('Cache storage error', error);
        });
        logger.info(`Cached response for key: ${cacheKey}`);
      }

      return originalJson(body);
    };

    next();
  };
}

// Cache invalidation middleware
export function invalidateCacheMiddleware(patterns: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!redis.isConnected()) {
      return next();
    }

    // Store original res.end method
    const originalEnd = res.end.bind(res);

    res.end = function(...args: any[]) {
      // Invalidate cache patterns after successful operations
      if (res.statusCode >= 200 && res.statusCode < 300) {
        patterns.forEach(async (pattern) => {
          try {
            const userId = (req as any).user?.id;
            const cacheKey = pattern.replace(':userId', userId?.toString() || '');
            await redis.delete(cacheKey);
            logger.info(`Invalidated cache for pattern: ${cacheKey}`);
          } catch (error) {
            logger.error('Cache invalidation error', error);
          }
        });
      }

      return originalEnd(...args);
    };

    next();
  };
}

// Specific cache middleware for user data
export const userCacheMiddleware = cacheMiddleware({
  ttl: 3600, // 1 hour
  keyGenerator: (req) => `user:${req.user?.id}`,
  condition: (req, res) => req.method === 'GET' && res.statusCode === 200 && !!req.user
});

// Specific cache middleware for projects
export const projectsCacheMiddleware = cacheMiddleware({
  ttl: 1800, // 30 minutes
  keyGenerator: (req) => `projects:user:${req.user?.id}`,
  condition: (req, res) => req.method === 'GET' && res.statusCode === 200 && !!req.user
});

// Specific cache middleware for usage data
export const usageCacheMiddleware = cacheMiddleware({
  ttl: 900, // 15 minutes
  keyGenerator: (req) => `usage:user:${req.user?.id}`,
  condition: (req, res) => req.method === 'GET' && res.statusCode === 200 && !!req.user
});