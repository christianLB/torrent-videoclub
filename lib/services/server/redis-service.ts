/**
 * Server-Side Redis Service
 * 
 * This service handles all Redis operations and MUST only be used
 * in server-side contexts (API routes, server components, background jobs).
 * 
 * DO NOT import this file in any client components!
 */
import Redis from 'ioredis';

export class RedisService {
  private static instance: RedisService;
  private client: Redis;
  
  private constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    this.client = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      reconnectOnError: (err: Error) => {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
          // Only reconnect when the error contains "READONLY"
          return true;
        }
        return false;
      }
    });
    
    this.client.on('error', (error) => {
      console.error('[RedisService] Redis connection error:', error);
    });
    
    this.client.on('connect', () => {
      console.log('[RedisService] Connected to Redis server');
    });
    
    this.client.on('ready', () => {
      console.log('[RedisService] Redis client ready');
    });
  }
  
  public static getInstance(): RedisService {
    if (!RedisService.instance) {
      RedisService.instance = new RedisService();
    }
    return RedisService.instance;
  }
  
  // Cache operations
  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      
      if (ttlSeconds && ttlSeconds > 0) {
        await this.client.set(key, serialized, 'EX', ttlSeconds);
      } else {
        await this.client.set(key, serialized);
      }
      
      console.log(`[RedisService] Cached key: ${key} with TTL: ${ttlSeconds || 'none'}`);
    } catch (error) {
      console.error(`[RedisService] Error setting key ${key}:`, error);
      throw error;
    }
  }
  
  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.client.get(key);
      
      if (!data) {
        return null;
      }
      
      return JSON.parse(data) as T;
    } catch (error) {
      console.error(`[RedisService] Error getting key ${key}:`, error);
      return null;
    }
  }
  
  async exists(key: string): Promise<boolean> {
    if (!this.client) return false;
    
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`[RedisService] Error checking existence of key ${key}:`, error);
      return false;
    }
  }
  
  async delete(key: string): Promise<boolean> {
    if (!this.client) return false;
    
    try {
      const result = await this.client.del(key);
      return result === 1;
    } catch (error) {
      console.error(`[RedisService] Error deleting key ${key}:`, error);
      return false;
    }
  }
  
  async deletePattern(pattern: string): Promise<number> {
    if (!this.client) return 0;
    
    try {
      // Use SCAN to find all keys matching the pattern
      const keys: string[] = [];
      let cursor = '0';
      
      do {
        const [nextCursor, foundKeys] = await this.client.scan(
          cursor,
          'MATCH',
          pattern,
          'COUNT',
          100
        );
        cursor = nextCursor;
        keys.push(...foundKeys);
      } while (cursor !== '0');
      
      // Delete all found keys
      if (keys.length > 0) {
        await this.client.del(...keys);
        console.log(`[RedisService] Deleted ${keys.length} keys matching pattern: ${pattern}`);
      }
      
      return keys.length;
    } catch (error) {
      console.error(`[RedisService] Error deleting pattern ${pattern}:`, error);
      return 0;
    }
  }
  
  async ttl(key: string): Promise<number> {
    if (!this.client) return -1;
    
    try {
      const ttl = await this.client.ttl(key);
      return ttl;
    } catch (error) {
      console.error(`[RedisService] Error getting TTL for key ${key}:`, error);
      return -1;
    }
  }
  
  async ping(): Promise<boolean> {
    if (!this.client) return false;
    
    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch (error) {
      console.error('[RedisService] Ping failed:', error);
      return false;
    }
  }
  
  async expire(key: string, seconds: number): Promise<boolean> {
    try {
      const result = await this.client.expire(key, seconds);
      return result === 1;
    } catch (error) {
      console.error(`[RedisService] Error setting expiry for key ${key}:`, error);
      return false;
    }
  }
  
  // List operations
  async pushToList(key: string, ...values: string[]): Promise<number> {
    try {
      return await this.client.rpush(key, ...values);
    } catch (error) {
      console.error(`[RedisService] Error pushing to list ${key}:`, error);
      throw error;
    }
  }
  
  async getList(key: string, start = 0, stop = -1): Promise<string[]> {
    try {
      return await this.client.lrange(key, start, stop);
    } catch (error) {
      console.error(`[RedisService] Error getting list ${key}:`, error);
      return [];
    }
  }
  
  // Hash operations
  async setHash(key: string, field: string, value: string): Promise<number> {
    try {
      return await this.client.hset(key, field, value);
    } catch (error) {
      console.error(`[RedisService] Error setting hash field ${key}.${field}:`, error);
      throw error;
    }
  }
  
  async getHash(key: string, field: string): Promise<string | null> {
    try {
      return await this.client.hget(key, field);
    } catch (error) {
      console.error(`[RedisService] Error getting hash field ${key}.${field}:`, error);
      return null;
    }
  }
  
  async getAllHash(key: string): Promise<Record<string, string>> {
    try {
      return await this.client.hgetall(key);
    } catch (error) {
      console.error(`[RedisService] Error getting all hash fields for ${key}:`, error);
      return {};
    }
  }
  
  // Utility methods
  
  async flushAll(): Promise<void> {
    try {
      await this.client.flushall();
      console.log('[RedisService] Flushed all Redis data');
    } catch (error) {
      console.error('[RedisService] Error flushing Redis:', error);
      throw error;
    }
  }
  
  async info(): Promise<string> {
    try {
      return await this.client.info();
    } catch (error) {
      console.error('[RedisService] Error getting Redis info:', error);
      return '';
    }
  }
  
  // Get the raw Redis client for advanced operations
  getClient(): Redis {
    return this.client;
  }
}

// Export a singleton instance (only for server-side use!)
export const redisService = RedisService.getInstance();
