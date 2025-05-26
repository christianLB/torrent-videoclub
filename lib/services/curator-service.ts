/**
 * Curator Service
 * 
 * Responsible for managing and providing featured content for the application.
 * This service integrates with Prowlarr to fetch real trending content data
 * while maintaining mock data as a fallback option.
 */
import { getMockFeaturedContent } from './mock-data';
import { FeaturedContent, EnhancedMediaItem, FeaturedCategory } from '../types/featured-content';
import { CacheService } from './cache-service';
import { ProwlarrClient } from '../api/prowlarr-client';
import { TrendingContentClient, CONTENT_CATEGORIES } from '../api/trending-content-client';
import { TMDbClient } from '../api/tmdb-client';
import { MetadataEnricher } from './metadata-enricher';

/**
 * Service for curating and providing featured content
 */
export class CuratorService {
  // API client instances
  private static prowlarrClient: ProwlarrClient | null = null;
  private static trendingClient: TrendingContentClient | null = null;
  private static tmdbClient: TMDbClient | null = null;
  
  // Configuration options
  private static useRealData = true; // Set to true to use real data, false to use mock data
  private static useTMDb = true; // Set to true to enrich results with TMDb data
  
  /**
   * Utility method to clear all caches
   * This is useful for debugging and testing
   */
  static clearAllCaches(): void {
    console.log('[CuratorService] Clearing all caches');
    CacheService.clearFeaturedContentCache();
  }
  
  /**
   * Initialize the Curator Service with the necessary API clients
   * This should be called before using any other methods
   */
  static initialize(): void {
    const prowlarrUrl = process.env.PROWLARR_URL || '';
    const prowlarrApiKey = process.env.PROWLARR_API_KEY || '';
    const tmdbApiKey = process.env.TMDB_API_KEY || '';
    
    // Only initialize clients if API keys are available
    if (prowlarrUrl && prowlarrApiKey) {
      // First initialize the Prowlarr client
      this.prowlarrClient = new ProwlarrClient(prowlarrUrl, prowlarrApiKey);
      
      // Then initialize the TrendingContentClient with the Prowlarr client instance
      this.trendingClient = new TrendingContentClient(this.prowlarrClient);
      
      this.useRealData = true;
      console.log('ProwlarrClient and TrendingContentClient initialized successfully');
    } else {
      console.warn('Prowlarr URL or API key not found, API clients not initialized');
      this.useRealData = false;
    }
    
    // Initialize TMDb client
    if (tmdbApiKey) {
      this.tmdbClient = new TMDbClient(tmdbApiKey);
      this.useTMDb = true;
      console.log('TMDbClient initialized successfully');
      
      // Initialize the MetadataEnricher with the TMDb client
      MetadataEnricher.initialize(this.tmdbClient);
    } else {
      console.warn('TMDb API key not found, TMDb client not initialized');
      this.useTMDb = false;
      
      // Initialize the MetadataEnricher without a TMDb client (will use mock data)
      MetadataEnricher.initialize();
    }
  }
  /**
   * Get the featured content for the homepage
   * 
   * Uses caching to improve performance and reduce API calls
   * If real data integration is enabled, fetches from Prowlarr and TMDb
   * Falls back to mock data if real data is unavailable
   */
  static async getFeaturedContent(): Promise<FeaturedContent> {
    try {
      // Make sure the service is initialized
      this.initialize();
      
      // First check if we have valid cached content
      const cachedContent = CacheService.getCachedFeaturedContent();
      if (cachedContent) {
        console.log('Using cached featured content');
        return cachedContent;
      }

      console.log('Cache miss - fetching fresh featured content');
      
      // Fetch fresh content using real APIs when available
      // This method will fallback to mock data if needed
      const featuredContent = await this.fetchFreshFeaturedContent();
      
      // Cache the results for future use
      CacheService.cacheFeaturedContent(featuredContent);
      
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
      
      // First check if category exists in cached content
      const cachedContent = CacheService.getCachedFeaturedContent();
      if (cachedContent) {
        const cachedCategory = cachedContent.categories.find(category => category.id === categoryId);
        if (cachedCategory && cachedCategory.items.length > 0) {
          console.log(`Retrieved category '${categoryId}' from cache`);
          return cachedCategory;
        }
      }
      
      console.log(`Cache miss for category '${categoryId}' - fetching directly`);
      
      // If category not found in cache, we'll try to fetch it directly based on category ID
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
            
            // Cache this individual category to avoid refetching
            if (cachedContent) {
              // Update the category in the cached content
              const updatedCategories = cachedContent.categories.map(c => 
                c.id === categoryId ? category : c
              );
              
              // If the category doesn't exist in the cache, add it
              if (!updatedCategories.some(c => c.id === categoryId)) {
                updatedCategories.push(category);
              }
              
              // Update the cache
              const updatedContent = {
                ...cachedContent,
                categories: updatedCategories
              };
              
              CacheService.cacheFeaturedContent(updatedContent);
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
