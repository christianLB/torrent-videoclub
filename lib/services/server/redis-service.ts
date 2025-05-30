/**
 * Server-Side Redis Service
 * 
 * This service handles all Redis operations and MUST only be used
 * in server-side contexts (API routes, server components, background jobs).
 * 
 * DO NOT import this file in any client components!
 */
import Redis from 'ioredis';
import { TMDBMediaItem } from '../../types/tmdb'; // Added for TMDB caching

// TMDB Caching Constants
const TMDB_ITEM_PREFIX = 'tmdb:item:';
const TMDB_LIST_PREFIX = 'tmdb:list:';
const DEFAULT_TMDB_TTL_SECONDS = parseInt(process.env.REDIS_TMDB_TTL_SECONDS || '3600', 10); // Default 1 hour

// Helper functions for TMDB cache keys
const getTMDBItemKey = (tmdbId: number, mediaType: 'movie' | 'tv'): string => {
  return `${TMDB_ITEM_PREFIX}${mediaType}:${tmdbId}`;
};

const getTMDBListKey = (listName: string): string => {
  // Sanitize listName to prevent issues with special characters in keys, though Redis is generally flexible.
  // For simplicity, we'll assume listName is already a safe string (e.g., 'popular-movies', 'trending-tv-week').
  return `${TMDB_LIST_PREFIX}${listName}`;
};

export class RedisService {
  private static instance: RedisService;
  private client: Redis;
  
  private constructor() {
    try {
      // First try the environment variable
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      console.log(`[RedisService] Attempting to connect to Redis at ${redisUrl}`);
      
      // Parse the Redis URL to extract host, port, etc.
      const url = new URL(redisUrl);
      
      // Get password if provided, but ONLY if it's not an empty string
      let password = process.env.REDIS_PASSWORD || url.password || undefined;
      
      // If password exists but is empty, set it to undefined to avoid authentication attempts
      if (password === '') {
        password = undefined;
      }
      
      console.log(`[RedisService] Password supplied: ${password ? 'Yes (not shown)' : 'No'}`); 
      
      // Create the Redis client with the appropriate configuration
      this.client = new Redis({
        host: url.hostname,
        port: url.port ? parseInt(url.port) : 6379,
        password: password || undefined, // Only provide password if it actually exists
        maxRetriesPerRequest: null, // Allow retryStrategy to control retries
        connectTimeout: 10000, // 10 seconds timeout for initial connection attempt
        retryStrategy: (times: number) => {
          const maxRetries = 10;
          if (times > maxRetries) {
            console.error(`[RedisService] Exceeded max retries (${maxRetries}). Could not connect to Redis.`);
            return null; // Stop retrying
          }
          // Exponential backoff with a cap
          const delay = Math.min(times * 500, 5000); // Start with 500ms, up to 5s
          console.log(`[RedisService] Connection attempt ${times} failed. Retrying in ${delay}ms...`);
          return delay;
        },
        // The existing conditional retry for 'redis' hostname can be kept or integrated
        // For now, the above general retry strategy will be primary.
        // We can refine the part below if needed:
        // if (times > 3 && url.hostname === 'redis') { ... }
        reconnectOnError: (err: Error) => {
          const errorMsg = err.message;
          console.error('[RedisService] Reconnect on error:', errorMsg);
          
          // If the error is about authentication when no password is needed,
          // reconnect without password
          if (errorMsg.includes('AUTH') && errorMsg.includes('without any password configured')) {
            console.log('[RedisService] Redis server does not require authentication. Reconnecting without password...');
            
            // Create a new client without a password and replace the current one
            const newClient = new Redis({
              host: url.hostname,
              port: url.port ? parseInt(url.port) : 6379,
              maxRetriesPerRequest: 3,
              connectTimeout: 5000
            });
            
            this.client = newClient;
            return false; // Don't reconnect with the original client
          }
          
          return true; // Otherwise attempt to reconnect
        }
      });
    } catch (error) {
      console.error('[RedisService] Error initializing Redis client:', error);
      // Create a minimal client that will at least not crash the app
      this.client = new Redis({
        host: 'localhost',
        port: 6379,
        maxRetriesPerRequest: 3, // Basic retry for fallback
        connectTimeout: 5000,
        retryStrategy: (times: number) => {
          if (times > 3) return null;
          return Math.min(times * 200, 2000); // Simple retry for fallback
        }
      });
    }
    
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
  
  /**
   * Get all keys matching a pattern
   * @param pattern Pattern to match (e.g., 'featured:*')
   * @returns Array of matching keys
   */
  async getKeys(pattern: string): Promise<string[]> {
    try {
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
      
      return keys;
    } catch (error) {
      console.error(`[RedisService] Error getting keys matching pattern ${pattern}:`, error);
      return [];
    }
  }
  
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

  // --- TMDB Specific Caching Methods ---

  /**
   * Caches a single TMDBMediaItem.
   * @param item The TMDBMediaItem to cache.
   * @param ttlSeconds Optional TTL in seconds. Defaults to DEFAULT_TMDB_TTL_SECONDS.
   */
  async setTMDBItem(item: TMDBMediaItem, ttlSeconds?: number): Promise<void> {
    if (!item || typeof item.tmdbId === 'undefined' || !item.mediaType) {
      console.error('[RedisService] Invalid TMDBMediaItem for caching:', item);
      return;
    }
    const key = getTMDBItemKey(item.tmdbId, item.mediaType as 'movie' | 'tv');
    const ttl = ttlSeconds ?? DEFAULT_TMDB_TTL_SECONDS;
    console.log(`[RedisService] Caching TMDB item: ${key} with TTL: ${ttl}s`);
    return this.set<TMDBMediaItem>(key, item, ttl);
  }

  /**
   * Retrieves a single TMDBMediaItem from cache.
   * @param tmdbId The TMDB ID of the item.
   * @param mediaType The media type ('movie' or 'tv').
   * @returns The cached TMDBMediaItem or null if not found.
   */
  async getTMDBItem(tmdbId: number, mediaType: 'movie' | 'tv'): Promise<TMDBMediaItem | null> {
    const key = getTMDBItemKey(tmdbId, mediaType);
    return this.get<TMDBMediaItem>(key);
  }

  /**
   * Deletes a single TMDBMediaItem from cache.
   * @param tmdbId The TMDB ID of the item.
   * @param mediaType The media type ('movie' or 'tv').
   * @returns True if deleted, false otherwise.
   */
  async deleteTMDBItem(tmdbId: number, mediaType: 'movie' | 'tv'): Promise<boolean> {
    const key = getTMDBItemKey(tmdbId, mediaType);
    return this.delete(key);
  }

  /**
   * Caches a list of TMDB IDs (e.g., for popular movies, trending TV shows).
   * @param listName A descriptive name for the list (e.g., 'popular-movies', 'trending-tv-week').
   * @param ids An array of TMDB IDs.
   * @param ttlSeconds Optional TTL in seconds. Defaults to DEFAULT_TMDB_TTL_SECONDS.
   */
  async setTMDBIdList(listName: string, ids: number[], ttlSeconds?: number): Promise<void> {
    const key = getTMDBListKey(listName);
    const ttl = ttlSeconds ?? DEFAULT_TMDB_TTL_SECONDS;
    console.log(`[RedisService] Caching TMDB ID list: ${key} with ${ids.length} items, TTL: ${ttl}s`);
    return this.set<number[]>(key, ids, ttl);
  }

  /**
   * Retrieves a list of TMDB IDs from cache.
   * @param listName The descriptive name of the list.
   * @returns An array of TMDB IDs or null if not found.
   */
  async getTMDBIdList(listName: string): Promise<number[] | null> {
    const key = getTMDBListKey(listName);
    return this.get<number[]>(key);
  }

  /**
   * Deletes a TMDB ID list from cache.
   * @param listName The descriptive name of the list.
   * @returns True if deleted, false otherwise.
   */
  async deleteTMDBList(listName: string): Promise<boolean> {
    const key = getTMDBListKey(listName);
    return this.delete(key);
  }
}

// Export a singleton instance (only for server-side use!)
export const redisService = RedisService.getInstance();
