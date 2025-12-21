import { createClient } from 'redis';
import { logger } from './logger';

export class RedisService {
  private client: ReturnType<typeof createClient>;
  private connected: boolean = false;
  private connectionAttempted: boolean = false;
  private errorLogged: boolean = false;

  constructor() {
    const redisUrl = process.env.REDIS_URL;
    
    this.client = createClient({
      url: redisUrl || 'redis://localhost:6379',
      socket: {
        connectTimeout: 2000,
        reconnectStrategy: (retries) => {
          if (retries > 1) {
            return false;
          }
          return 500;
        }
      }
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.client.on('connect', () => {
      logger.info('Redis client connected');
      this.connected = true;
      this.errorLogged = false;
    });

    this.client.on('ready', () => {
      logger.info('Redis client ready');
    });

    this.client.on('error', () => {
      this.connected = false;
    });

    this.client.on('end', () => {
      this.connected = false;
    });
  }

  async connect(): Promise<void> {
    if (this.connectionAttempted) return;
    this.connectionAttempted = true;
    
    try {
      await this.client.connect();
    } catch (error) {
      if (!this.errorLogged) {
        logger.warn('Redis unavailable - running without cache (this is normal in development)');
        this.errorLogged = true;
      }
    }
  }

  async disconnect(): Promise<void> {
    if (this.connected) {
      await this.client.disconnect();
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  // Cache user data
  async cacheUser(userId: number, userData: any, ttl: number = 3600): Promise<void> {
    if (!this.connected) return;
    
    try {
      const key = `user:${userId}`;
      await this.client.setEx(key, ttl, JSON.stringify(userData));
      logger.info(`Cached user data for user ${userId}`);
    } catch (error) {
      logger.error('Failed to cache user data', error);
    }
  }

  async getCachedUser(userId: number): Promise<any | null> {
    if (!this.connected) return null;
    
    try {
      const key = `user:${userId}`;
      const cached = await this.client.get(key);
      if (cached) {
        logger.info(`Retrieved cached user data for user ${userId}`);
        return JSON.parse(cached);
      }
      return null;
    } catch (error) {
      logger.error('Failed to retrieve cached user data', error);
      return null;
    }
  }

  // Cache project data
  async cacheUserProjects(userId: number, projects: any[], ttl: number = 1800): Promise<void> {
    if (!this.connected) return;
    
    try {
      const key = `projects:user:${userId}`;
      await this.client.setEx(key, ttl, JSON.stringify(projects));
      logger.info(`Cached projects for user ${userId}`);
    } catch (error) {
      logger.error('Failed to cache projects', error);
    }
  }

  async getCachedUserProjects(userId: number): Promise<any[] | null> {
    if (!this.connected) return null;
    
    try {
      const key = `projects:user:${userId}`;
      const cached = await this.client.get(key);
      if (cached) {
        logger.info(`Retrieved cached projects for user ${userId}`);
        return JSON.parse(cached);
      }
      return null;
    } catch (error) {
      logger.error('Failed to retrieve cached projects', error);
      return null;
    }
  }

  // Cache usage data
  async cacheUserUsage(userId: number, usage: any[], ttl: number = 900): Promise<void> {
    if (!this.connected) return;
    
    try {
      const key = `usage:user:${userId}`;
      await this.client.setEx(key, ttl, JSON.stringify(usage));
      logger.info(`Cached usage data for user ${userId}`);
    } catch (error) {
      logger.error('Failed to cache usage data', error);
    }
  }

  async getCachedUserUsage(userId: number): Promise<any[] | null> {
    if (!this.connected) return null;
    
    try {
      const key = `usage:user:${userId}`;
      const cached = await this.client.get(key);
      if (cached) {
        logger.info(`Retrieved cached usage data for user ${userId}`);
        return JSON.parse(cached);
      }
      return null;
    } catch (error) {
      logger.error('Failed to retrieve cached usage data', error);
      return null;
    }
  }

  // General purpose caching
  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    if (!this.connected) return;
    
    try {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      await this.client.setEx(key, ttl, serialized);
      logger.info(`Set cache key: ${key}`);
    } catch (error) {
      logger.error('Failed to set cache', error);
    }
  }

  async get(key: string): Promise<any | null> {
    if (!this.connected) return null;
    
    try {
      const cached = await this.client.get(key);
      if (cached) {
        logger.info(`Retrieved cache key: ${key}`);
        try {
          return JSON.parse(cached);
        } catch {
          return cached; // Return as string if not JSON
        }
      }
      return null;
    } catch (error) {
      logger.error('Failed to get cache', error);
      return null;
    }
  }

  async delete(key: string): Promise<void> {
    if (!this.connected) return;
    
    try {
      await this.client.del(key);
      logger.info(`Deleted cache key: ${key}`);
    } catch (error) {
      logger.error('Failed to delete cache', error);
    }
  }

  // Clear user-related cache when data changes
  async clearUserCache(userId: number): Promise<void> {
    if (!this.connected) return;
    
    const keys = [
      `user:${userId}`,
      `projects:user:${userId}`,
      `usage:user:${userId}`
    ];
    
    for (const key of keys) {
      await this.delete(key);
    }
    logger.info(`Cleared all cache for user ${userId}`);
  }

  // Get Redis client for advanced operations
  getClient() {
    return this.client;
  }
}

// Create singleton instance
export const redis = new RedisService();