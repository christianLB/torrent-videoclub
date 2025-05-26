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

/**
 * Service for curating and providing featured content
 */
export class CuratorService {
  // API client instances
  private static prowlarrClient: TrendingContentClient | null = null;
  private static trendingClient: TrendingContentClient | null = null;
  private static tmdbClient: any | null = null;
  
  // Configuration options
  private static useRealData = true; // Set to true to use real data, false to use mock data
  private static useTMDb = true; // Set to true to enrich results with TMDb data
  private static initialized = false; // Track if service has been initialized
  
  /**
   * Check if the service is using real data or mock data
   * @returns true if using real data, false if using mock data
   */
  static isUsingRealData(): boolean {
    return this.initialized && this.useRealData && !!this.prowlarrClient && !!this.trendingClient;
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
    
    // Initialize Prowlarr clients
    if (prowlarrUrl && prowlarrApiKey) {
      // First initialize the Prowlarr client
      this.prowlarrClient = new TrendingContentClient(prowlarrUrl, prowlarrApiKey);
      
      // Then initialize the TrendingContentClient with the Prowlarr client instance
      this.trendingClient = new TrendingContentClient(this.prowlarrClient);
      
      this.useRealData = true;
      console.log('[CuratorService] ProwlarrClient and TrendingContentClient force initialized');
    }
    
    // Initialize TMDb client
    if (tmdbApiKey) {
      this.tmdbClient = new MetadataEnricher(tmdbApiKey);
      this.useTMDb = true;
      console.log('[CuratorService] TMDbClient force initialized');
    }
    
    // Mark as initialized
    this.initialized = true;
    console.log('[CuratorService] Force initialization complete, using real data:', this.useRealData);
  }
  
  /**
   * Utility method to clear all caches
   * This is useful for debugging and testing
   */
  static async clearCache(): Promise<void> {
    console.log('[CuratorService] Clearing all caches');
    // Clear both legacy cache and Redis cache
    CacheService.clearFeaturedContentCache();
    await redisService.deletePattern('featured:*');
  }
  
  /**
   * Initialize the Curator Service with the necessary API clients
   * This should be called before using any other methods
   */
  static initialize(): void {
    // If already initialized, don't reinitialize
    if (this.initialized) {
      console.log('[CuratorService] Already initialized, skipping initialization');
      return;
    }
    
    // Log environment variables for debugging
    console.log('[CuratorService] Environment variables check:', {
      hasProwlarrUrl: !!process.env.PROWLARR_URL,
      hasProwlarrApiKey: !!process.env.PROWLARR_API_KEY,
      hasTmdbApiKey: !!process.env.TMDB_API_KEY,
    });
    
    const prowlarrUrl = process.env.PROWLARR_URL || '';
    const prowlarrApiKey = process.env.PROWLARR_API_KEY || '';
    const tmdbApiKey = process.env.TMDB_API_KEY || '';
    
    // Only initialize clients if API keys are available
    if (prowlarrUrl && prowlarrApiKey) {
      // First initialize the Prowlarr client
      this.prowlarrClient = new TrendingContentClient(prowlarrUrl, prowlarrApiKey);
      
      // Then initialize the TrendingContentClient with the Prowlarr client instance
      this.trendingClient = new TrendingContentClient(this.prowlarrClient);
      
      this.useRealData = true;
      console.log('[CuratorService] ProwlarrClient and TrendingContentClient initialized successfully');
    } else {
      console.warn('[CuratorService] Prowlarr URL or API key not found, API clients not initialized');
      this.useRealData = false;
    }
    
    // Initialize TMDb client
    if (tmdbApiKey) {
      this.tmdbClient = new MetadataEnricher(tmdbApiKey);
      this.useTMDb = true;
      console.log('[CuratorService] TMDbClient initialized successfully');
    } else {
      console.warn('[CuratorService] TMDb API key not found, TMDb client not initialized');
      this.useTMDb = false;
    }
    
    // Mark as initialized
    this.initialized = true;
    console.log('[CuratorService] Initialization complete, using real data:', this.useRealData);
  }
  /**
   * Get the featured content for the homepage
   * 
   * Uses Redis caching to improve performance and reduce API calls
   * If real data integration is enabled, fetches from Prowlarr and TMDb
   * Falls back to mock data if real data is unavailable
   */
  static async getFeaturedContent(): Promise<FeaturedContent> {
    try {
      // Make sure the service is initialized
      this.initialize();
      
      // First check Redis cache
      const redisKey = 'featured:content';
      const redisCachedContent = await redisService.get<FeaturedContent>(redisKey);
      
      if (redisCachedContent) {
        console.log('[CuratorService] Using Redis cached featured content');
        return redisCachedContent;
      }
      
      // Then check legacy cache as fallback
      const legacyCachedContent = CacheService.getCachedFeaturedContent();
      if (legacyCachedContent) {
        console.log('[CuratorService] Using legacy cached featured content');
        // Store in Redis for next time
        await redisService.set(redisKey, legacyCachedContent, 
          parseInt(process.env.REDIS_FEATURED_CONTENT_TTL || '3600')
        );
        return legacyCachedContent;
      }

      console.log('[CuratorService] Cache miss - fetching fresh featured content');
      
      // Fetch fresh content using real APIs when available
      // This method will fallback to mock data if needed
      const featuredContent = await this.fetchFreshFeaturedContent();
      
      // Cache the results in both systems
      CacheService.cacheFeaturedContent(featuredContent); // Legacy cache
      await redisService.set(redisKey, featuredContent, 
        parseInt(process.env.REDIS_FEATURED_CONTENT_TTL || '3600')
      ); // Redis cache
      
      return featuredContent;
    } catch (error) {
      console.error('Error in CuratorService.getFeaturedContent:', error);
      
      // If there's an error, try to use cached content as a fallback
      const cachedContent = CacheService.getCachedFeaturedContent();
      if (cachedContent) {
        console.log('Using cached content as fallback after error');
        return cachedContent;
      }
      
      // As a last resort, return mock data
      console.warn('No cache available, using mock data as final fallback');
      return getMockFeaturedContent();
    }
  }

  /**
   * Get a specific category of featured content
   * @param categoryId The ID of the category to retrieve
   */
  static async getCategory(categoryId: string): Promise<FeaturedCategory | null> {
    try {
      // Make sure the service is initialized
      this.initialize();

      // Step 1: Check Redis cache specifically for this category
      const categoryRedisKey = `featured:category:${categoryId}`;
      const redisCachedCategory = await redisService.get<FeaturedCategory>(categoryRedisKey);
      
      if (redisCachedCategory) {
        console.log(`[CuratorService] Using Redis cached category '${categoryId}'`);
        return redisCachedCategory;
      }
      
      console.log(`[CuratorService] Cache miss for category '${categoryId}' - checking featured content`);

      // Step 2: Try to get from Redis cached featured content
      const featuredRedisKey = 'featured:content';
      const redisCachedContent = await redisService.get<FeaturedContent>(featuredRedisKey);
      
      if (redisCachedContent && redisCachedContent.categories) {
        const category = redisCachedContent.categories.find((c: FeaturedCategory) => c.id === categoryId);
        if (category) {
          console.log(`[CuratorService] Found category '${categoryId}' in Redis cached featured content`);
          // Cache this category separately
          await redisService.set(categoryRedisKey, category, 
            parseInt(process.env.REDIS_FEATURED_CONTENT_TTL || '3600')
          );
          return category;
        }
      }
      
      // Step 3: Try legacy cache as fallback
      const legacyCachedContent = CacheService.getCachedFeaturedContent();
      
      if (legacyCachedContent && legacyCachedContent.categories) {
        const category = legacyCachedContent.categories.find((c: FeaturedCategory) => c.id === categoryId);
        if (category) {
          console.log(`[CuratorService] Found category '${categoryId}' in legacy cached featured content`);
          // Cache this category in Redis for next time
          await redisService.set(categoryRedisKey, category, 
            parseInt(process.env.REDIS_FEATURED_CONTENT_TTL || '3600')
          );
          return category;
        }
      }
      
      console.log(`[CuratorService] Category '${categoryId}' not found in any cache, fetching directly`);
      
      // Step 4: If we reach here, the category was not found in any cache
      // We'll try to fetch it directly based on category ID
      if (this.useRealData && this.trendingClient) {
        try {
          console.log(`Fetching category '${categoryId}' directly using real data`);
          
          // Fetch data based on category ID
          let items: EnhancedMediaItem[] = [];
          let title = 'Unknown Category';
          
          // Determine which data to fetch based on category ID
          switch (categoryId) {
            case CONTENT_CATEGORIES.TRENDING_MOVIES:
              title = 'Trending Movies';
              const trendingMovies = await this.trendingClient.getTrendingMovies({ limit: 50 });
              
              // Enrich with TMDb data if available
              if (this.useTMDb) {
                console.log('Enriching trending movies with TMDb metadata');
                items = await Promise.all(
                  trendingMovies.map(async (movie) => {
                    try {
                      const enriched = await MetadataEnricher.enrichMovie(movie);
                      enriched.inLibrary = this.isInLibrary(movie.guid);
                      const downloadStatus = this.isDownloading(movie.guid);
                      enriched.downloading = downloadStatus.downloading;
                      enriched.downloadProgress = downloadStatus.progress;
                      return enriched;
                    } catch (err) {
                      console.error('Error enriching movie:', err);
                      return {
                        ...movie,
                        inLibrary: this.isInLibrary(movie.guid),
                        downloading: this.isDownloading(movie.guid).downloading,
                        downloadProgress: this.isDownloading(movie.guid).progress,
                        tmdbAvailable: false
                      };
                    }
                  })
                );
              } else {
                items = trendingMovies.map(movie => ({
                  ...movie,
                  inLibrary: this.isInLibrary(movie.guid),
                  downloading: this.isDownloading(movie.guid).downloading,
                  downloadProgress: this.isDownloading(movie.guid).progress,
                  tmdbAvailable: false
                }));
              }
              break;
              
            case CONTENT_CATEGORIES.POPULAR_TV:
              title = 'Popular TV Shows';
              const popularTV = await this.trendingClient.getPopularTV({ limit: 50 });
              
              // Enrich with TMDb data if available
              if (this.useTMDb) {
                console.log('Enriching TV shows with TMDb metadata');
                items = await Promise.all(
                  popularTV.map(async (show) => {
                    try {
                      const enriched = await MetadataEnricher.enrichTVSeries(show);
                      enriched.inLibrary = this.isInLibrary(show.guid);
                      const downloadStatus = this.isDownloading(show.guid);
                      enriched.downloading = downloadStatus.downloading;
                      enriched.downloadProgress = downloadStatus.progress;
                      return enriched;
                    } catch (err) {
                      console.error('Error enriching TV show:', err);
                      return {
                        ...show,
                        inLibrary: this.isInLibrary(show.guid),
                        downloading: this.isDownloading(show.guid).downloading,
                        downloadProgress: this.isDownloading(show.guid).progress,
                        tmdbAvailable: false
                      };
                    }
                  })
                );
              } else {
                items = popularTV.map(show => ({
                  ...show,
                  inLibrary: this.isInLibrary(show.guid),
                  downloading: this.isDownloading(show.guid).downloading,
                  downloadProgress: this.isDownloading(show.guid).progress,
                  tmdbAvailable: false
                }));
              }
              break;
              
            case CONTENT_CATEGORIES.NEW_RELEASES:
              title = 'New Releases';
              const newReleases = await this.trendingClient.getNewReleases({ limit: 50 });
              
              // Enrich with TMDb data if available
              if (this.useTMDb) {
                console.log('Enriching new releases with TMDb metadata');
                items = await Promise.all(
                  newReleases.map(async (movie) => {
                    try {
                      const enriched = await MetadataEnricher.enrichMovie(movie);
                      enriched.inLibrary = this.isInLibrary(movie.guid);
                      const downloadStatus = this.isDownloading(movie.guid);
                      enriched.downloading = downloadStatus.downloading;
                      enriched.downloadProgress = downloadStatus.progress;
                      return enriched;
                    } catch (err) {
                      console.error('Error enriching new release:', err);
                      return {
                        ...movie,
                        inLibrary: this.isInLibrary(movie.guid),
                        downloading: this.isDownloading(movie.guid).downloading,
                        downloadProgress: this.isDownloading(movie.guid).progress,
                        tmdbAvailable: false
                      };
                    }
                  })
                );
              } else {
                items = newReleases.map(movie => ({
                  ...movie,
                  inLibrary: this.isInLibrary(movie.guid),
                  downloading: this.isDownloading(movie.guid).downloading,
                  downloadProgress: this.isDownloading(movie.guid).progress,
                  tmdbAvailable: false
                }));
              }
              break;
              
            default:
              console.warn(`Unknown category ID: ${categoryId}`);
              break;
          }
          
          // If we successfully fetched items, return the category
          if (items.length > 0) {
            const category: FeaturedCategory = {
              id: categoryId,
              title,
              items
            };
            
            // Cache this individual category in Redis
            const categoryRedisKey = `featured:category:${categoryId}`;
            await redisService.set(categoryRedisKey, category, 
              parseInt(process.env.REDIS_FEATURED_CONTENT_TTL || '3600')
            );
            
            // Update both caches
            // 1. First check if we have featured content in Redis
            const featuredRedisKey = 'featured:content';
            const redisFeaturedContent = await redisService.get<FeaturedContent>(featuredRedisKey);
            
            if (redisFeaturedContent && redisFeaturedContent.categories) {
              // Update the category in Redis cached content
              const updatedRedisCategories = redisFeaturedContent.categories.map((c: FeaturedCategory) => 
                c.id === categoryId ? category : c
              );
              
              // If the category doesn't exist in Redis cache, add it
              if (!updatedRedisCategories.some((c: FeaturedCategory) => c.id === categoryId)) {
                updatedRedisCategories.push(category);
              }
              
              // Update the Redis cache
              const updatedRedisContent = {
                ...redisFeaturedContent,
                categories: updatedRedisCategories
              };
              
              await redisService.set(featuredRedisKey, updatedRedisContent, 
                parseInt(process.env.REDIS_FEATURED_CONTENT_TTL || '3600')
              );
            }
            
            // 2. Then update legacy cache for backward compatibility
            const legacyCachedContent = CacheService.getCachedFeaturedContent();
            
            if (legacyCachedContent && legacyCachedContent.categories) {
              // Update the category in legacy cached content
              const updatedLegacyCategories = legacyCachedContent.categories.map((c: FeaturedCategory) => 
                c.id === categoryId ? category : c
              );
              
              // If the category doesn't exist in legacy cache, add it
              if (!updatedLegacyCategories.some((c: FeaturedCategory) => c.id === categoryId)) {
                updatedLegacyCategories.push(category);
              }
              
              // Update the legacy cache
              const updatedLegacyContent = {
                ...legacyCachedContent,
                categories: updatedLegacyCategories
              };
              
              CacheService.cacheFeaturedContent(updatedLegacyContent);
            }
            
            return category;
          }
        } catch (fetchError) {
          console.error(`Error directly fetching category '${categoryId}':`, fetchError);
          // Will continue to fallback methods below
        }
      }
      
      // Fallback: try getting the category from the full featured content
      console.log(`Falling back to getting category '${categoryId}' from full featured content`);
      const { categories } = await CuratorService.getFeaturedContent();
      const foundCategory = categories.find(category => category.id === categoryId);
      
      if (foundCategory) {
        return foundCategory;
      }
      
      // Final fallback: use mock data
      console.log(`Category '${categoryId}' not found in real data, checking mock data`);
      const mockData = getMockFeaturedContent();
      return mockData.categories.find(category => category.id === categoryId) || null;
    } catch (error) {
      console.error(`Error in CuratorService.getCategory(${categoryId}):`, error);
      throw new Error(`Failed to fetch category: ${categoryId}`);
    }
  }

  /**
   * Check if a media item is in the user's library
   * In this implementation, we're using mock data
   * 
   * @param guid The unique identifier of the media item
   */
  static isInLibrary(guid: string): boolean {
    // In a future implementation, this would check Radarr/Sonarr APIs
    // For now, we're using the pre-defined status in our mock data
    const mockData = getMockFeaturedContent();
    
    // Check the featured item
    if (mockData.featuredItem.guid === guid) {
      return mockData.featuredItem.inLibrary;
    }
    
    // Check all categories
    for (const category of mockData.categories) {
      const item = category.items.find((item: EnhancedMediaItem) => item.guid === guid);
      if (item) {
        return item.inLibrary;
      }
    }
    
    return false;
  }

  /**
   * Check if a media item is currently downloading
   * In this implementation, we're using mock data
   * 
   * @param guid The unique identifier of the media item
   */
  static isDownloading(guid: string): { downloading: boolean; progress?: number } {
    // In a future implementation, this would check Radarr/Sonarr APIs
    // For now, we're using the pre-defined status in our mock data
    const mockData = getMockFeaturedContent();
    
    // Check the featured item
    if (mockData.featuredItem.guid === guid) {
      return {
        downloading: mockData.featuredItem.downloading,
        progress: mockData.featuredItem.downloadProgress
      };
    }
    
    // Check all categories
    for (const category of mockData.categories) {
      const item = category.items.find((item: EnhancedMediaItem) => item.guid === guid);
      if (item) {
        return {
          downloading: item.downloading,
          progress: item.downloadProgress
        };
      }
    }
    
    return { downloading: false };
  }

  /**
   * Fetch fresh featured content, bypassing the cache
   * This is used by the cache refresh service to update the cache
   */
  static async fetchFreshFeaturedContent(): Promise<FeaturedContent> {
    try {
      // Make sure the service is initialized
      this.initialize();
      
      // If real data is disabled or clients aren't available, use mock data
      if (!this.useRealData || !this.trendingClient) {
        console.log('Using mock data for featured content (real data disabled or clients unavailable)');
        return getMockFeaturedContent();
      }
      
      console.log('Fetching real featured content from Prowlarr');
      
      // Prepare the result structure
      const result: FeaturedContent = {
        featuredItem: null!,
        categories: []
      };
      
      // 1. Fetch trending movies for the featured item
      const trendingMovies = await this.trendingClient.getTrendingMovies({ 
        minSeeders: 20,
        minQuality: '1080p',
        limit: 10
      });
      
      if (trendingMovies.length > 0) {
        // Use the first trending movie as the featured item
        const featuredMovie = trendingMovies[0];
        
        // Enrich with additional properties
        result.featuredItem = {
          ...featuredMovie,
          inLibrary: this.isInLibrary(featuredMovie.guid),
          downloading: this.isDownloading(featuredMovie.guid).downloading,
          downloadProgress: this.isDownloading(featuredMovie.guid).progress,
          tmdbAvailable: true, // For now, assume TMDb is available
          tmdb: {
            id: 0, // This would be populated from TMDb
            title: featuredMovie.title,
            releaseDate: featuredMovie.year ? `${featuredMovie.year}-01-01` : '',
            year: featuredMovie.year || new Date().getFullYear(),
            posterPath: '',  // This would be populated from TMDb
            backdropPath: '', // This would be populated from TMDb
            voteAverage: 0,  // This would be populated from TMDb
            genreIds: [],    // This would be populated from TMDb
            overview: ''     // This would be populated from TMDb
          }
        };
        
        // Remove the featured movie from trending movies to avoid duplication
        trendingMovies.shift();
      } else {
        // Fallback to mock data for the featured item if no trending movies
        const mockData = getMockFeaturedContent();
        result.featuredItem = mockData.featuredItem;
      }
      
      // 2. Fetch content for each category
      // Create categories array with trending movies
      const trendingMoviesCategory: FeaturedCategory = {
        id: CONTENT_CATEGORIES.TRENDING_MOVIES,
        title: 'Trending Movies',
        items: [] as EnhancedMediaItem[]
      };
      
      // Enrich trending movies with TMDb metadata if available
      if (this.useTMDb) {
        console.log('Enriching trending movies with TMDb metadata');
        const enrichedItems = await Promise.all(
          trendingMovies.map(async (movie) => {
            try {
              // Use MetadataEnricher to get TMDb data
              const enriched = await MetadataEnricher.enrichMovie(movie);
              
              // Add library status
              enriched.inLibrary = this.isInLibrary(movie.guid);
              const downloadStatus = this.isDownloading(movie.guid);
              enriched.downloading = downloadStatus.downloading;
              enriched.downloadProgress = downloadStatus.progress;
              
              return enriched;
            } catch (error) {
              console.error('Error enriching movie:', error);
              // Fallback to basic item if enrichment fails
              return {
                ...movie,
                inLibrary: this.isInLibrary(movie.guid),
                downloading: this.isDownloading(movie.guid).downloading,
                downloadProgress: this.isDownloading(movie.guid).progress,
                tmdbAvailable: false
              };
            }
          })
        );
        trendingMoviesCategory.items = enrichedItems;
      } else {
        // Basic metadata without TMDb enrichment
        trendingMoviesCategory.items = trendingMovies.map(movie => ({
          ...movie,
          inLibrary: this.isInLibrary(movie.guid),
          downloading: this.isDownloading(movie.guid).downloading,
          downloadProgress: this.isDownloading(movie.guid).progress,
          tmdbAvailable: false
        }));
      }
      
      const categories = [trendingMoviesCategory];
      
      // Fetch popular TV shows
      const popularTV = await this.trendingClient.getPopularTV({
        minSeeders: 10,
        limit: 10
      });
      
      if (popularTV.length > 0) {
        // Create TV shows category
        const popularTVCategory: FeaturedCategory = {
          id: CONTENT_CATEGORIES.POPULAR_TV,
          title: 'Popular TV Shows',
          items: [] as EnhancedMediaItem[]
        };
        
        // Enrich TV shows with TMDb metadata if available
        if (this.useTMDb) {
          console.log('Enriching TV shows with TMDb metadata');
          const enrichedTVItems = await Promise.all(
            popularTV.map(async (show) => {
              try {
                // Use MetadataEnricher to get TMDb data
                const enriched = await MetadataEnricher.enrichTVSeries(show);
                
                // Add library status
                enriched.inLibrary = this.isInLibrary(show.guid);
                const downloadStatus = this.isDownloading(show.guid);
                enriched.downloading = downloadStatus.downloading;
                enriched.downloadProgress = downloadStatus.progress;
                
                return enriched;
              } catch (error) {
                console.error('Error enriching TV show:', error);
                // Fallback to basic item if enrichment fails
                return {
                  ...show,
                  inLibrary: this.isInLibrary(show.guid),
                  downloading: this.isDownloading(show.guid).downloading,
                  downloadProgress: this.isDownloading(show.guid).progress,
                  tmdbAvailable: false
                };
              }
            })
          );
          popularTVCategory.items = enrichedTVItems;
        } else {
          // Basic metadata without TMDb enrichment
          popularTVCategory.items = popularTV.map(show => ({
            ...show,
            inLibrary: this.isInLibrary(show.guid),
            downloading: this.isDownloading(show.guid).downloading,
            downloadProgress: this.isDownloading(show.guid).progress,
            tmdbAvailable: false
          }));
        }
        
        // Add to categories
        categories.push(popularTVCategory);
      }
      
      // Fetch new releases
      const newReleases = await this.trendingClient.getNewReleases({
        minSeeders: 5,
        daysSinceRelease: 30,
        limit: 10
      });
      
      if (newReleases.length > 0) {
        // Create new releases category
        const newReleasesCategory: FeaturedCategory = {
          id: CONTENT_CATEGORIES.NEW_RELEASES,
          title: 'New Releases',
          items: [] as EnhancedMediaItem[]
        };
        
        // Enrich new releases with TMDb metadata if available
        if (this.useTMDb) {
          console.log('Enriching new releases with TMDb metadata');
          const enrichedNewReleases = await Promise.all(
            newReleases.map(async (movie) => {
              try {
                // Use MetadataEnricher to get TMDb data
                const enriched = await MetadataEnricher.enrichMovie(movie);
                
                // Add library status
                enriched.inLibrary = this.isInLibrary(movie.guid);
                const downloadStatus = this.isDownloading(movie.guid);
                enriched.downloading = downloadStatus.downloading;
                enriched.downloadProgress = downloadStatus.progress;
                
                return enriched;
              } catch (error) {
                console.error('Error enriching new release:', error);
                // Fallback to basic item if enrichment fails
                return {
                  ...movie,
                  inLibrary: this.isInLibrary(movie.guid),
                  downloading: this.isDownloading(movie.guid).downloading,
                  downloadProgress: this.isDownloading(movie.guid).progress,
                  tmdbAvailable: false
                };
              }
            })
          );
          newReleasesCategory.items = enrichedNewReleases;
        } else {
          // Basic metadata without TMDb enrichment
          newReleasesCategory.items = newReleases.map(movie => ({
            ...movie,
            inLibrary: this.isInLibrary(movie.guid),
            downloading: this.isDownloading(movie.guid).downloading,
            downloadProgress: this.isDownloading(movie.guid).progress,
            tmdbAvailable: false
          }));
        }
        
        // Add to categories
        categories.push(newReleasesCategory);
      }
      
      // Add the categories to the result
      result.categories = categories;
      
      // If we have no real data (empty categories), fallback to mock data
      if (result.categories.length === 0 || !result.featuredItem) {
        console.warn('No real data available, falling back to mock data');
        return getMockFeaturedContent();
      }
      
      return result;
    } catch (error) {
      console.error('Error fetching fresh featured content:', error);
      console.warn('Falling back to mock data due to error');
      return getMockFeaturedContent();
    }
  }
}
