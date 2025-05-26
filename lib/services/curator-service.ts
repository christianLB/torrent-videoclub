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
   * Initialize the Curator Service with the necessary API clients
   * This should be called before using any other methods
   */
  static initialize(): void {
    // Skip initialization if already done
    if (this.prowlarrClient && this.trendingClient) {
      return;
    }
    
    try {
      // Initialize Prowlarr client
      const prowlarrUrl = process.env.PROWLARR_URL || '';
      const prowlarrApiKey = process.env.PROWLARR_API_KEY || '';
      if (prowlarrUrl && prowlarrApiKey) {
        this.prowlarrClient = new ProwlarrClient(prowlarrUrl, prowlarrApiKey);
        this.trendingClient = new TrendingContentClient(this.prowlarrClient);
        console.log('Prowlarr client initialized successfully');
      } else {
        console.warn('Prowlarr configuration missing, will use mock data');
        this.useRealData = false;
      }
      
      // Initialize TMDb client
      const tmdbApiKey = process.env.TMDB_API_KEY || '';
      if (tmdbApiKey) {
        this.tmdbClient = new TMDbClient(tmdbApiKey);
        console.log('TMDb client initialized successfully');
      } else {
        console.warn('TMDb configuration missing, metadata enrichment disabled');
        this.useTMDb = false;
      }
    } catch (error) {
      console.error('Error initializing Curator Service:', error);
      this.useRealData = false;
      this.useTMDb = false;
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
      const { categories } = await CuratorService.getFeaturedContent();
      return categories.find(category => category.id === categoryId) || null;
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
      const categories = [
        {
          id: CONTENT_CATEGORIES.TRENDING_MOVIES,
          title: 'Trending Movies',
          items: trendingMovies.map(movie => ({
            ...movie,
            inLibrary: this.isInLibrary(movie.guid),
            downloading: this.isDownloading(movie.guid).downloading,
            downloadProgress: this.isDownloading(movie.guid).progress,
            tmdbAvailable: true,
            tmdb: {
              id: 0,
              title: movie.title,
              releaseDate: movie.year ? `${movie.year}-01-01` : '',
              year: movie.year || new Date().getFullYear(),
              posterPath: '',
              backdropPath: '',
              voteAverage: 0,
              genreIds: [],
              overview: ''
            }
          }))
        }
      ];
      
      // Fetch popular TV shows
      const popularTV = await this.trendingClient.getPopularTV({
        minSeeders: 10,
        limit: 10
      });
      
      if (popularTV.length > 0) {
        categories.push({
          id: CONTENT_CATEGORIES.POPULAR_TV,
          title: 'Popular TV Shows',
          items: popularTV.map(show => ({
            ...show,
            inLibrary: this.isInLibrary(show.guid),
            downloading: this.isDownloading(show.guid).downloading,
            downloadProgress: this.isDownloading(show.guid).progress,
            tmdbAvailable: true,
            tmdb: {
              id: 0,
              title: show.title,
              releaseDate: show.year ? `${show.year}-01-01` : '',
              year: show.year || new Date().getFullYear(),
              posterPath: '',
              backdropPath: '',
              voteAverage: 0,
              genreIds: [],
              overview: ''
            }
          }))
        });
      }
      
      // Fetch new releases
      const newReleases = await this.trendingClient.getNewReleases({
        minSeeders: 5,
        daysSinceRelease: 30,
        limit: 10
      });
      
      if (newReleases.length > 0) {
        categories.push({
          id: CONTENT_CATEGORIES.NEW_RELEASES,
          title: 'New Releases',
          items: newReleases.map(movie => ({
            ...movie,
            inLibrary: this.isInLibrary(movie.guid),
            downloading: this.isDownloading(movie.guid).downloading,
            downloadProgress: this.isDownloading(movie.guid).progress,
            tmdbAvailable: true,
            tmdb: {
              id: 0,
              title: movie.title,
              releaseDate: movie.year ? `${movie.year}-01-01` : '',
              year: movie.year || new Date().getFullYear(),
              posterPath: '',
              backdropPath: '',
              voteAverage: 0,
              genreIds: [],
              overview: ''
            }
          }))
        });
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
