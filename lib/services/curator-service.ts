/**
 * CuratorService manages and provides featured content for the application
 * 
 * This service is responsible for curating content that appears in the featured section,
 * integrating with both Prowlarr (for torrent data) and TMDb (for metadata enrichment).
 * 
 * It uses a caching strategy to minimize API calls and ensure fast response times.
 */
import { getMockFeaturedContent, CONTENT_CATEGORIES } from '../data/mock-featured';
import { 
  FeaturedContent, 
  FeaturedCategory, 
  FeaturedItem, 
  EnhancedMediaItem,
  ProwlarrItemData, // Added import
  TMDbEnrichmentData // Added import
} from '../types/featured';
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
    const result = this.useRealData && !!this.prowlarrClient && !!this.trendingClient;
    console.log(`[CuratorService] isUsingRealData() => ${result}`, {
      initialized: this.initialized,
      useRealData: this.useRealData,
      hasProwlarrClient: !!this.prowlarrClient,
      hasTrendingClient: !!this.trendingClient
    });
    return result;
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
    
    console.log('[CuratorService] Starting initialization from environment variables...');

    try {
      const { prowlarr, tmdb } = serverConfig;
      
      // Debug server config values
      console.log('[CuratorService] Server config loaded:', {
        prowlarrUrl: prowlarr?.url || 'NOT SET',
        prowlarrApiKeyPresent: !!prowlarr?.apiKey,
        tmdbApiKeyPresent: !!tmdb?.apiKey
      });
      
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
      // Use the static initialize method instead of instantiating
      MetadataEnricher.initialize();
      this.tmdbClient = MetadataEnricher;
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
    const usingRealData = this.isUsingRealData();
    console.log(`[CuratorService] fetchFreshFeaturedContent - Using real data: ${usingRealData}`);

    if (!usingRealData) {
      console.log('[CuratorService] Using mock data for featured content');
      return getMockFeaturedContent(); // Ensure mock data also aligns or is handled
    }

    try {
      console.log('[CuratorService] Fetching fresh featured content from APIs');
      if (!this.trendingClient) {
        throw new Error('TrendingContentClient not initialized');
      }

      // Helper to map raw Prowlarr-like items to the new FeaturedItem structure
      const mapRawToFeaturedItem = (rawItem: any, mediaTypeOverride: 'movie' | 'tv'): FeaturedItem => {
        const prowlarrData: ProwlarrItemData = {
          guid: rawItem.guid || `guid_placeholder_${Date.now()}_${Math.random()}`,
          indexerId: rawItem.indexerId || rawItem.indexer || 'unknown_indexer',
          title: rawItem.title || 'Unknown Title',
          size: rawItem.size || 0,
          protocol: rawItem.protocol || 'torrent',
          publishDate: rawItem.publishDate,
          quality: rawItem.quality,
          infoUrl: rawItem.infoUrl,
          downloadUrl: rawItem.downloadUrl,
          seeders: rawItem.seeders,
          leechers: rawItem.leechers,
        };

        return {
          ...prowlarrData,
          mediaType: rawItem.mediaType || mediaTypeOverride,
          tmdbInfo: rawItem.tmdbId ? { tmdbId: Number(rawItem.tmdbId) } : undefined,
          inLibrary: rawItem.inLibrary || false,
          isDownloading: rawItem.downloading || false,
          isProcessing: false,
        };
      };

      const [rawTrendingMovies, rawPopularTV, rawNewReleases, rawTop4K, rawDocumentaries] = await Promise.all([
        this.trendingClient.getTrendingMovies({ limit: 20 }),
        this.trendingClient.getPopularTV({ limit: 20 }),
        this.trendingClient.getNewReleases({ limit: 20 }),
        this.trendingClient.get4KContent({ limit: 20 }),
        this.trendingClient.getDocumentaries({ limit: 20 }),
      ]);

      const trendingMovies = rawTrendingMovies.map(item => mapRawToFeaturedItem(item, 'movie'));
      const popularTV = rawPopularTV.map(item => mapRawToFeaturedItem(item, 'tv'));
      const newReleases = rawNewReleases.map(item => mapRawToFeaturedItem(item, 'movie')); // Assuming new releases are movies by default
      const top4KContent = rawTop4K.map(item => mapRawToFeaturedItem(item, 'movie')); // Assuming 4K are movies
      const documentaries = rawDocumentaries.map(item => mapRawToFeaturedItem(item, 'movie'));

      console.log('[CuratorService] Mapped content from APIs:', {
        trendingMovies: trendingMovies.length,
        popularTV: popularTV.length,
        newReleases: newReleases.length,
        top4KContent: top4KContent.length,
        documentaries: documentaries.length
      });
      
      const heroItemFallback: FeaturedItem = {
        guid: 'placeholder_hero',
        indexerId: 'placeholder_indexer',
        title: 'Featured Content Unavailable',
        size: 0,
        protocol: 'torrent',
        mediaType: 'movie',
        displayTitle: 'Featured Content Unavailable',
        fullPosterPath: '/api/placeholder/500/750',
        fullBackdropPath: '/api/placeholder/1920/1080',
        isProcessing: false,
      };

      const featuredItem: FeaturedItem = trendingMovies[0] || heroItemFallback;

      const featuredContent: FeaturedContent = {
        featuredItem,
        categories: [
          { id: 'trending-now', title: 'Trending Now', items: trendingMovies },
          { id: 'popular-tv', title: 'Popular TV Shows', items: popularTV },
          { id: 'new-releases', title: 'New Releases', items: newReleases },
          { id: 'top-4k', title: 'Top 4K Content', items: top4KContent },
          { id: 'documentaries', title: 'Documentaries', items: documentaries },
        ],
      };

      if (this.useTMDb && this.tmdbClient) {
        console.log('[CuratorService] Enriching content with TMDb metadata');
        await this.enrichWithTmdbMetadata(featuredContent);
      }

      return featuredContent;
    } catch (error) {
      console.error('[CuratorService] Error fetching fresh featured content:', error);
      return getMockFeaturedContent(); // Ensure mock data aligns
    }
  }
  
  /**
   * Enrich featured content with TMDb metadata
   * @param content The content to enrich
   * @private
   */
  private static async enrichWithTmdbMetadata(content: FeaturedContent): Promise<void> {
    try {
      if (!this.tmdbClient) {
        console.log('[CuratorService] TMDb client not available, skipping enrichment.');
        return;
      }

      const allItems = [
        ...(content.featuredItem ? [content.featuredItem] : []),
        ...content.categories.flatMap(category => category.items)
      ].filter(item => item.guid !== 'placeholder_hero'); // Exclude pure placeholders

      // Helper to map TMDb API response to TMDbEnrichmentData
      const mapTmdbApiResponseToEnrichmentData = (apiResponse: any): Partial<TMDbEnrichmentData> => ({
        tmdbId: apiResponse.id,
        title: apiResponse.title || apiResponse.name,
        year: apiResponse.release_date ? new Date(apiResponse.release_date).getFullYear() : (apiResponse.first_air_date ? new Date(apiResponse.first_air_date).getFullYear() : undefined),
        posterPath: apiResponse.poster_path,
        backdropPath: apiResponse.backdrop_path,
        overview: apiResponse.overview,
        voteAverage: apiResponse.vote_average,
        genreIds: apiResponse.genres?.map((g: any) => g.id) || [],
        releaseDate: apiResponse.release_date || apiResponse.first_air_date,
        runtime: apiResponse.runtime || (apiResponse.episode_run_time && apiResponse.episode_run_time[0]),
        seasons: apiResponse.number_of_seasons,
      });

      const itemsToEnrich = allItems.filter(item => item.tmdbInfo?.tmdbId);
      if (itemsToEnrich.length === 0) {
        console.log('[CuratorService] No items with tmdbId found in tmdbInfo for enrichment.');
        // Optional: Attempt enrichment based on title/year if tmdbInfo.tmdbId is missing
      }

      console.log(`[CuratorService] Attempting to enrich ${itemsToEnrich.length} items with TMDb metadata using tmdbInfo.tmdbId.`);

      for (const item of allItems) { // Iterate allItems to potentially enrich those without initial tmdbId via title/year
        try {
          let tmdbApiResult: any;
          if (item.tmdbInfo?.tmdbId) {
            tmdbApiResult = await this.tmdbClient.getMediaDetails(item.tmdbInfo.tmdbId, item.mediaType);
          } else if (item.title && item.publishDate) { // Fallback to title/year based search if no tmdbId
            // This assumes tmdbClient has a method like searchMedia or similar
            // For simplicity, this part is conceptual. Actual implementation depends on tmdbClient capabilities.
            // console.log(`[CuratorService] Attempting title/year enrichment for: ${item.title}`);
            // tmdbApiResult = await this.tmdbClient.searchMedia(item.title, new Date(item.publishDate).getFullYear(), item.mediaType);
            // if (tmdbApiResult && tmdbApiResult.results && tmdbApiResult.results.length > 0) tmdbApiResult = tmdbApiResult.results[0]; else tmdbApiResult = null;
          }

          if (tmdbApiResult) {
            const enrichmentData = mapTmdbApiResponseToEnrichmentData(tmdbApiResult);
            item.tmdbInfo = { ...(item.tmdbInfo || {}), ...enrichmentData };
            // mediaType could be refined here based on TMDb result if necessary
            if (tmdbApiResult.media_type && item.mediaType !== tmdbApiResult.media_type) {
              // console.log(`[CuratorService] Refining mediaType for ${item.title} from ${item.mediaType} to ${tmdbApiResult.media_type}`);
              // item.mediaType = tmdbApiResult.media_type;
            }
          } else if (item.tmdbInfo?.tmdbId) {
            console.warn(`[CuratorService] No TMDb data found for tmdbId: ${item.tmdbInfo.tmdbId}`);
          }
        } catch (error) {
          const SENSITIVE_ERROR_MESSAGE = error instanceof Error ? error.message : String(error);
          console.warn(`[CuratorService] Failed to enrich item (GUID: ${item.guid}, Title: ${item.title}) with TMDb data: ${SENSITIVE_ERROR_MESSAGE}`);
        }
      }
    } catch (error) {
      console.error('[CuratorService] General error during TMDb enrichment process:', error);
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

    const cacheKey = 'featured:content';
    
    try {
      // Try to get from cache first
      try {
        const cached = await redisService.get<FeaturedContent>(cacheKey);
        if (cached) {
          console.log('[CuratorService] Returning cached featured content');
          return cached;
        }
      } catch (redisError) {
        console.warn('[CuratorService] Redis error, will fetch fresh data:', redisError);
        // Continue execution to fetch fresh data
      }
      
      // If not in cache, fetch fresh
      console.log('[CuratorService] No cached data found, fetching fresh content');
      const freshContent = await this.fetchFreshFeaturedContent();
      
      // Try to cache the result
      try {
        const ttl = process.env.REDIS_FEATURED_CONTENT_TTL 
          ? parseInt(process.env.REDIS_FEATURED_CONTENT_TTL) 
          : 3600; // 1 hour default

        await redisService.set(cacheKey, freshContent, ttl);
        console.log(`[CuratorService] Cached fresh content with TTL ${ttl}s`);
      } catch (redisError) {
        // Just log the error but continue with fresh data
        console.warn('[CuratorService] Failed to cache content, but continuing with fresh data');
      }
      
      return freshContent;
    } catch (error) {
      console.error('[CuratorService] Error getting featured content:', error);
      
      // Make one more attempt to fetch fresh data directly
      try {
        console.log('[CuratorService] Attempting to fetch fresh data as fallback');
        return await this.fetchFreshFeaturedContent();
      } catch (fallbackError) {
        console.error('[CuratorService] Fallback fetch also failed, using mock data:', fallbackError);
        // As a last resort, return mock data
        return getMockFeaturedContent();
      }
    }
  }

  /**
   * Get a specific category of featured content
   * @param category The category to get
   * @returns The featured content for the specified category
   */
  static async getCategory(category: string): Promise<FeaturedCategory | undefined> {
    try {
      console.log(`[CuratorService] Fetching category: ${category}`);
      const content = await this.getFeaturedContent();
      
      // Check if content is defined and has categories
      if (!content || !content.categories || !Array.isArray(content.categories)) {
        console.error('[CuratorService] Invalid content structure:', content);
        return undefined;
      }
      
      // For special case 'featured', return the featured item category
      if (category === 'featured' && content.featuredItem) {
        return {
          id: 'featured',
          title: 'Featured Content',
          items: [content.featuredItem]
        };
      }
      
      // Find the requested category
      const foundCategory = content.categories.find(cat => cat.id === category);
      
      if (!foundCategory) {
        console.log(`[CuratorService] Category not found: ${category}`);
      } else {
        console.log(`[CuratorService] Category found: ${category} with ${foundCategory.items.length} items`);
      }
      
      return foundCategory;
    } catch (error) {
      console.error(`[CuratorService] Error getting category ${category}:`, error);
      return undefined;
    }
  }

  /**
   * Initialize the service (alias for initializeFromEnv for backward compatibility)
   */
  static initialize(): void {
    this.initializeFromEnv();
  }
}
