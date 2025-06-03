
/**
 * Server-Side Cache Service
 *
 * This service provides a high-level API for interacting with the cache (MongoDB)
 * and abstracts away the underlying MongoDB caching logic.
 * It enforces strict server-only usage.
 */

// Import server-only package to enforce build-time errors when imported in client components
import { FeaturedContent } from '../../types/featured'; // Adjusted path based on memory 1218e5c2...
import MongoService from './mongo-service';
import { MongoCuratedList } from '../../types/mongo';

/**
 * Constants for cache keys and expiration times
 */
export const MONGO_DOC_IDS = {
  FEATURED_CONTENT: 'main_featured_content_v1',
  // Category IDs will be dynamic or follow a pattern like `category_${categoryId}`
};

/**
 * Cache service for managing server-side caching primarily via MongoDB for featured content.
 */
export class CacheService {
  // Singleton instance management - ensures single CacheService instance across the app
  private static instance: CacheService | null = null;
  
  /**
   * Private constructor to prevent direct instantiation
   */
  private constructor() {}
  
  /**
   * Get the singleton instance of CacheService
   */
  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }
  /**
   * Store featured content in the cache
   */
  static async cacheFeaturedContent(content: FeaturedContent): Promise<void> {
    const ttlSeconds = process.env.FEATURED_CONTENT_TTL_SECONDS
      ? parseInt(process.env.FEATURED_CONTENT_TTL_SECONDS)
      : 3600; // Default to 1 hour

    const listId = MONGO_DOC_IDS.FEATURED_CONTENT;
    try {
      await MongoService.connect(); // Ensure connection
      const collection = MongoService.getCuratedListsCollection();

      const newDocument: Partial<MongoCuratedList> = {
        lastRefreshedAt: new Date(),
        ttlSeconds,
        title: 'Main Featured Content',
        type: 'featured_section',
        contentBlob: content,
        lastRefreshed: new Date(),
        isEnabled: true,
      };

      await collection.updateOne(
        { _id: listId },
        { $set: newDocument },
        { upsert: true }
      );
      console.log(`[CacheService] Featured content (docId: ${listId}) cached successfully in MongoDB.`);
    } catch (error) {
      console.error(`[CacheService] Failed to cache featured content (docId: ${listId}) in MongoDB:`, error);
      throw error;
    }
  }

  /**
   * Retrieve featured content from MongoDB cache.
   * This method primarily fetches the content; validity should be checked by `isFeaturedContentCacheValid`.
   */
  static async getCachedFeaturedContent(): Promise<FeaturedContent | null> {
    const listId = MONGO_DOC_IDS.FEATURED_CONTENT;
    try {
      await MongoService.connect(); // Ensure connection
      const collection = MongoService.getCuratedListsCollection();
      const document = await collection.findOne({ _id: listId });

      if (document && document.contentBlob) {
        console.log(`[CacheService] Retrieved featured content (docId: ${listId}) from MongoDB cache.`);
        return document.contentBlob as FeaturedContent;
      }
      
      console.log(`[CacheService] No cached featured content (docId: ${listId}) found in MongoDB.`);
      return null;
    } catch (error) {
      console.error(`[CacheService] Failed to retrieve cached featured content (docId: ${listId}) from MongoDB:`, error);
      return null;
    }
  }

  /**
   * Clear the featured content cache from MongoDB.
   */
  static async clearFeaturedContentCache(): Promise<void> {
    const listId = MONGO_DOC_IDS.FEATURED_CONTENT;
    try {
      await MongoService.connect();
      const collection = MongoService.getCuratedListsCollection();
      const result = await collection.deleteOne({ _id: listId });
      if (result.deletedCount === 1) {
        console.log(`[CacheService] Featured content (docId: ${listId}) deleted from MongoDB.`);
      } else {
        console.log(`[CacheService] No featured content (docId: ${listId}) found to delete from MongoDB.`);
      }
    } catch (error) {
      console.error(`[CacheService] Failed to clear featured content (docId: ${listId}) from MongoDB:`, error);
      throw error;
    }
  }

  /**
   * Check if the featured content cache in MongoDB is valid based on its TTL.
   */
  static async isFeaturedContentCacheValid(): Promise<boolean> {
    const listId = MONGO_DOC_IDS.FEATURED_CONTENT;
    try {
      await MongoService.connect();
      const collection = MongoService.getCuratedListsCollection();
      const document = await collection.findOne({ _id: listId });

      if (!document || !document.lastRefreshedAt || typeof document.ttlSeconds !== 'number') {
        console.log(`[CacheService] Featured content (docId: ${listId}) not found or TTL info missing for validity check.`);
        return false;
      }

      const expiresAt = new Date(document.lastRefreshedAt.getTime() + document.ttlSeconds * 1000);
      const isValid = expiresAt > new Date();
      console.log(`[CacheService] Featured content (docId: ${listId}) cache validity: ${isValid}. Expires at: ${expiresAt.toISOString()}`);
      return isValid;
    } catch (error) {
      console.error(`[CacheService] Error checking featured content (docId: ${listId}) cache validity:`, error);
      return false;
    }
  }

  /**
   * Get the remaining time until cache expiration in seconds for featured content in MongoDB.
   */
  static async getFeaturedContentCacheTimeRemaining(): Promise<number> {
    const listId = MONGO_DOC_IDS.FEATURED_CONTENT;
    try {
      await MongoService.connect();
      const collection = MongoService.getCuratedListsCollection();
      const document = await collection.findOne({ _id: listId });

      if (!document || !document.lastRefreshedAt || typeof document.ttlSeconds !== 'number') {
        console.log(`[CacheService] Featured content (docId: ${listId}) not found or TTL info missing for time remaining calculation.`);
        return 0;
      }

      const expiresAt = new Date(document.lastRefreshedAt.getTime() + document.ttlSeconds * 1000);
      const now = new Date();
      const remainingMilliseconds = expiresAt.getTime() - now.getTime();
      const remainingSeconds = Math.max(0, Math.floor(remainingMilliseconds / 1000));
      
      console.log(`[CacheService] Featured content (docId: ${listId}) cache time remaining: ${remainingSeconds}s. Expires at: ${expiresAt.toISOString()}`);
      return remainingSeconds;
    } catch (error) {
      console.error(`[CacheService] Error calculating cache time remaining for featured content (docId: ${listId}):`, error);
      return 0;
    }
  }

}


// Export a singleton instance (only for server-side use!)
export const cacheService = CacheService.getInstance();
