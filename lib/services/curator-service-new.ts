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
import { ensureEnvLoaded } from '../utils/env';

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

    console.log('[CuratorService] Initializing from environment variables');
    
    try {
      // This will throw if environment variables are not properly set
      ensureEnvLoaded();
      
      const prowlarrUrl = process.env.PROWLARR_URL;
      const prowlarrApiKey = process.env.PROWLARR_API_KEY;
      const tmdbApiKey = process.env.TMDB_API_KEY;
      
      if (!prowlarrUrl || !prowlarrApiKey || !tmdbApiKey) {
        throw new Error('Missing required environment variables');
      }
      
      this.initializeClients(prowlarrUrl, prowlarrApiKey, tmdbApiKey);
      this.initialized = true;
      this.useRealData = true;
      console.log('[CuratorService] Successfully initialized with environment variables');
    } catch (error) {
      console.error('[CuratorService] Failed to initialize from environment variables:', error);
      this.useRealData = false;
      this.initialized = true; // Mark as initialized to prevent repeated errors
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
   * @param prowlarrUrl The Prowlarr URL
   * @param prowlarrApiKey The Prowlarr API key
   * @param tmdbApiKey The TMDb API key
   */
  static forceInitialize(prowlarrUrl: string, prowlarrApiKey: string, tmdbApiKey: string): void {
    console.log('[CuratorService] Force initializing with provided credentials');
    
    try {
      this.initializeClients(prowlarrUrl, prowlarrApiKey, tmdbApiKey);
      this.initialized = true;
      this.useRealData = true;
      console.log('[CuratorService] Successfully force initialized');
    } catch (error) {
      console.error('[CuratorService] Failed to force initialize:', error);
      this.useRealData = false;
      this.initialized = true; // Mark as initialized to prevent repeated errors
    }
  }

  // ... rest of the CuratorService implementation ...
  // [Previous implementation methods can be added here]
  
  // This is a placeholder for the rest of the implementation
  // You'll need to add back all the other methods from the original file
  // that aren't related to initialization
}
