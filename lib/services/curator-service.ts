/**
 * CuratorService manages and provides featured content for the application
 * 
 * This service is responsible for curating content that appears in the featured section,
 * integrating with both Prowlarr (for torrent data) and TMDb (for metadata enrichment).
 * 
 * It uses a caching strategy to minimize API calls and ensure fast response times.
 */
import { getMockFeaturedContent, CONTENT_CATEGORIES } from '../data/mock-featured';
import { FeaturedContent, FeaturedCategory, FeaturedItem, EnhancedMediaItem } from '../types/featured';
import { CacheService } from './cache-service';
import { redisService } from './server/redis-service';
import { TrendingContentClient } from './trending-content-client';
import { MetadataEnricher } from './metadata-enricher';
import { serverConfig } from '../config';

/**
 * Service for curating and providing featured content
 */
export class CuratorService {
  // API client instances
  private static prowlarrClient: TrendingContentClient | null = null;
  private static trendingClient: TrendingContentClient | null = null;
  private static tmdbClient: any | null = null;
  
  // Configuration options
  private static useRealData = false; // Will be set to true if environment variables are properly loaded
  private static useTMDb = true; // Set to true to enrich results with TMDb data
  private static initialized = false; // Track if service has been initialized

  /**
   * Check if the service is using real data or mock data
   * @returns true if using real data, false if using mock data
   */
  static isUsingRealData(): boolean {
    if (!this.initialized) {
      this.initializeFromEnv();
    }
    return this.useRealData && !!this.prowlarrClient && !!this.trendingClient;
  }

  /**
   * Initialize the service with environment variables
   * @private
   */
  private static initializeFromEnv(): void {
    if (this.initialized) {
      console.log('[CuratorService] Already initialized, skipping initialization');
      return;
    }

    try {
      const { prowlarr, tmdb } = serverConfig;
      
      if (!prowlarr.url || !prowlarr.apiKey || !tmdb.apiKey) {
        throw new Error('Missing required API configuration');
      }

      console.log('[CuratorService] Initializing with real data');
      
      // Initialize API clients with the configuration
      this.initializeClients(prowlarr.url, prowlarr.apiKey, tmdb.apiKey);
      
      this.useRealData = true;
      console.log('[CuratorService] Successfully initialized with real data');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.warn('[CuratorService] Using mock data:', errorMessage);
      this.useRealData = false;
    } finally {
      this.initialized = true; // Always mark as initialized
    }
  }
  
  /**
   * Initialize API clients with provided credentials
   * @private
   */
  private static initializeClients(prowlarrUrl: string, prowlarrApiKey: string, tmdbApiKey: string): void {
    console.log('[CuratorService] Initializing API clients');
    
    // Initialize Prowlarr clients
    if (prowlarrUrl && prowlarrApiKey) {
      this.prowlarrClient = new TrendingContentClient(prowlarrUrl, prowlarrApiKey);
      this.trendingClient = new TrendingContentClient(prowlarrUrl, prowlarrApiKey);
      console.log('[CuratorService] Prowlarr clients initialized');
    } else {
      console.warn('[CuratorService] Missing Prowlarr URL or API key');
    }
    
    // Initialize TMDb client if API key is provided
    if (tmdbApiKey) {
      this.tmdbClient = new MetadataEnricher(tmdbApiKey);
      console.log('[CuratorService] TMDb client initialized');
    } else {
      console.warn('[CuratorService] Missing TMDb API key');
      this.useTMDb = false;
    }
  }

  /**
   * Force initialization with specific credentials
   * This is useful for testing or when environment variables aren't available
   * @param options The initialization options
   * @param options.prowlarrUrl The Prowlarr URL
   * @param options.prowlarrApiKey The Prowlarr API key
   * @param options.tmdbApiKey The TMDb API key
   */
  static forceInitialize(options: {
    prowlarrUrl: string;
    prowlarrApiKey: string;
    tmdbApiKey: string;
  }): void {
    console.log('[CuratorService] Force initializing with provided credentials');
    
    try {
      const { prowlarrUrl, prowlarrApiKey, tmdbApiKey } = options;
      
      if (!prowlarrUrl || !prowlarrApiKey || !tmdbApiKey) {
        throw new Error('Missing required parameters for force initialization');
      }
      
      // Update the server config with the provided values
      serverConfig.prowlarr.url = prowlarrUrl;
      serverConfig.prowlarr.apiKey = prowlarrApiKey;
      serverConfig.tmdb.apiKey = tmdbApiKey;
      
      // Re-initialize from the updated config
      this.initializeFromEnv();
      
      console.log('[CuratorService] Successfully force initialized');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[CuratorService] Failed to force initialize:', errorMessage);
      this.useRealData = false;
      this.initialized = true; // Mark as initialized to prevent repeated errors
    }
  }

  /**
   * Clear the cache for featured content
   */
  static async clearCache(): Promise<void> {
    if (redisService && 'clearByPrefix' in redisService) {
      // @ts-ignore - We've checked that the method exists
      await redisService.clearByPrefix('featured:');
    }
  }

  /**
   * Fetch fresh featured content from the API
   * @returns The fetched featured content
   */
  static async fetchFreshFeaturedContent(): Promise<FeaturedContent> {
    if (!this.isUsingRealData()) {
      return getMockFeaturedContent();
    }
    
    try {
      // Implementation for fetching fresh content from the API
      // This is a placeholder - replace with actual implementation
      return getMockFeaturedContent();
    } catch (error) {
      console.error('[CuratorService] Error fetching fresh featured content:', error);
      throw error;
    }
  }

  /**
   * Get featured content, using cache if available
   * @returns The featured content
   */
  static async getFeaturedContent(): Promise<FeaturedContent> {
    if (!this.isUsingRealData()) {
      return getMockFeaturedContent();
    }

    const cacheKey = 'featured:all';
    
    try {
      // Try to get from cache first
      if (redisService) {
        const cached = await redisService.get<FeaturedContent>(cacheKey);
        if (cached) {
          return cached;
        }
      }
      
      // If not in cache, fetch fresh
      const freshContent = await this.fetchFreshFeaturedContent();
      
      // Cache the result
      if (redisService) {
        await redisService.set(
          cacheKey, 
          freshContent, 
          3600 // 1 hour TTL
        );
      }
      
      return freshContent;
    } catch (error) {
      console.error('[CuratorService] Error getting featured content:', error);
      // Fall back to mock data if there's an error
      return getMockFeaturedContent();
    }
  }

  /**
   * Get a specific category of featured content
   * @param category The category to get
   * @returns The featured content for the specified category
   */
  static async getCategory(category: string): Promise<FeaturedCategory | undefined> {
    const content = await this.getFeaturedContent();
    // @ts-ignore - We know content is an array
    return content.find((cat: FeaturedCategory) => cat.id === category);
  }

  /**
   * Initialize the service (alias for initializeFromEnv for backward compatibility)
   */
  static initialize(): void {
    this.initializeFromEnv();
  }
}
