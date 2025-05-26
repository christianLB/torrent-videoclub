/**
 * Trending Content Client
 * 
 * Extends ProwlarrClient to provide methods for finding trending and popular content.
 * This is used by the Featured Content system to display curated content.
 */

import { ProwlarrClient, NormalizedMovieResult } from './prowlarr-client';

// Define categories for trending content
export const CONTENT_CATEGORIES = {
  TRENDING_MOVIES: 'trending-movies',
  POPULAR_TV: 'popular-tv',
  NEW_RELEASES: 'new-releases',
  TOP_4K: 'top-4k-content',
  POPULAR_DOCUMENTARIES: 'popular-documentaries',
};

export interface TrendingContentOptions {
  minSeeders?: number;        // Minimum number of seeders (default: 10)
  minQuality?: string;        // Minimum quality (e.g., '720p', '1080p', '2160p')
  daysSinceRelease?: number;  // Only include content released within this many days (default: 180)
  limit?: number;             // Maximum number of results (default: 20)
  excludeAdult?: boolean;     // Whether to exclude adult content (default: true)
}

const DEFAULT_OPTIONS: TrendingContentOptions = {
  minSeeders: 10,
  minQuality: '1080p',
  daysSinceRelease: 180,
  limit: 20,
  excludeAdult: true,
};

/**
 * Client for fetching trending and popular content using Prowlarr
 */
export class TrendingContentClient {
  private prowlarrClient: ProwlarrClient;
  
  constructor(prowlarrClient: ProwlarrClient) {
    this.prowlarrClient = prowlarrClient;
  }
  
  /**
   * Get trending movies based on seeders and recent releases
   * @param options Configuration options
   * @returns List of trending movies
   */
  async getTrendingMovies(options: TrendingContentOptions = {}): Promise<NormalizedMovieResult[]> {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    
    try {
      // Search for recent movies
      const searchTerm = this.generateRecentMovieSearchTerm();
      console.log(`Searching for trending movies with term: ${searchTerm}`);
      
      // Search movies using the client
      let results = await this.prowlarrClient.searchMovies(searchTerm);
      
      // Apply filters based on options
      results = this.filterResults(results, opts);
      
      // Sort by seeders (descending)
      results.sort((a, b) => b.seeders - a.seeders);
      
      // Limit results
      return results.slice(0, opts.limit || DEFAULT_OPTIONS.limit!);
    } catch (error) {
      console.error('Error getting trending movies:', error);
      return [];
    }
  }
  
  /**
   * Get popular TV shows based on seeders and recent releases
   * @param options Configuration options
   * @returns List of popular TV shows
   */
  async getPopularTV(options: TrendingContentOptions = {}): Promise<NormalizedMovieResult[]> {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    
    try {
      // Search for recent TV shows
      const searchTerm = this.generateRecentTVSearchTerm();
      console.log(`Searching for popular TV with term: ${searchTerm}`);
      
      // Search series using the client
      let results = await this.prowlarrClient.searchSeries(searchTerm);
      
      // Apply filters based on options
      results = this.filterResults(results, opts);
      
      // Sort by seeders (descending)
      results.sort((a, b) => b.seeders - a.seeders);
      
      // Limit results
      return results.slice(0, opts.limit || DEFAULT_OPTIONS.limit!);
    } catch (error) {
      console.error('Error getting popular TV:', error);
      return [];
    }
  }
  
  /**
   * Get new movie releases based on release date
   * @param options Configuration options
   * @returns List of new releases
   */
  async getNewReleases(options: TrendingContentOptions = {}): Promise<NormalizedMovieResult[]> {
    const opts = { 
      ...DEFAULT_OPTIONS, 
      ...options,
      daysSinceRelease: options.daysSinceRelease || 30 // Default to last 30 days for new releases
    };
    
    try {
      // Search for very recent movies
      const searchTerm = this.generateVeryRecentMovieSearchTerm();
      console.log(`Searching for new releases with term: ${searchTerm}`);
      
      // Search movies using the client
      let results = await this.prowlarrClient.searchMovies(searchTerm);
      
      // Apply filters based on options
      results = this.filterResults(results, opts);
      
      // Sort by year (descending) and then seeders (descending)
      results.sort((a, b) => {
        if (b.year !== a.year && b.year && a.year) {
          return b.year - a.year;
        }
        return b.seeders - a.seeders;
      });
      
      // Limit results
      return results.slice(0, opts.limit || DEFAULT_OPTIONS.limit!);
    } catch (error) {
      console.error('Error getting new releases:', error);
      return [];
    }
  }
  
  /**
   * Get top 4K content based on quality and seeders
   * @param options Configuration options
   * @returns List of 4K content
   */
  async getTop4KContent(options: TrendingContentOptions = {}): Promise<NormalizedMovieResult[]> {
    const opts = { 
      ...DEFAULT_OPTIONS, 
      ...options,
      minQuality: '2160p' // Force 4K quality
    };
    
    try {
      // Search for 4K content
      const searchTerm = "2160p OR 4K";
      console.log(`Searching for 4K content with term: ${searchTerm}`);
      
      // Search movies using the client
      let movieResults = await this.prowlarrClient.searchMovies(searchTerm);
      
      // Apply filters based on options
      movieResults = this.filterResults(movieResults, opts);
      
      // Sort by seeders (descending)
      movieResults.sort((a, b) => b.seeders - a.seeders);
      
      // Limit results
      return movieResults.slice(0, opts.limit || DEFAULT_OPTIONS.limit!);
    } catch (error) {
      console.error('Error getting 4K content:', error);
      return [];
    }
  }
  
  /**
   * Get content by category ID
   * @param categoryId Category ID from CONTENT_CATEGORIES
   * @param options Configuration options
   * @returns List of content for the category
   */
  async getContentByCategory(categoryId: string, options: TrendingContentOptions = {}): Promise<NormalizedMovieResult[]> {
    switch (categoryId) {
      case CONTENT_CATEGORIES.TRENDING_MOVIES:
        return this.getTrendingMovies(options);
      case CONTENT_CATEGORIES.POPULAR_TV:
        return this.getPopularTV(options);
      case CONTENT_CATEGORIES.NEW_RELEASES:
        return this.getNewReleases(options);
      case CONTENT_CATEGORIES.TOP_4K:
        return this.getTop4KContent(options);
      case CONTENT_CATEGORIES.POPULAR_DOCUMENTARIES:
        return this.getDocumentaries(options);
      default:
        console.error(`Unknown category ID: ${categoryId}`);
        return [];
    }
  }
  
  /**
   * Get documentary content
   * @param options Configuration options
   * @returns List of documentaries
   */
  private async getDocumentaries(options: TrendingContentOptions = {}): Promise<NormalizedMovieResult[]> {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    
    try {
      // Search for documentaries
      const searchTerm = "documentary";
      console.log(`Searching for documentaries with term: ${searchTerm}`);
      
      // Search movies using the client
      let results = await this.prowlarrClient.searchMovies(searchTerm);
      
      // Apply filters based on options
      results = this.filterResults(results, opts);
      
      // Sort by seeders (descending)
      results.sort((a, b) => b.seeders - a.seeders);
      
      // Limit results
      return results.slice(0, opts.limit || DEFAULT_OPTIONS.limit!);
    } catch (error) {
      console.error('Error getting documentaries:', error);
      return [];
    }
  }
  
  /**
   * Filter results based on options
   * @param results Results to filter
   * @param options Filter options
   * @returns Filtered results
   */
  private filterResults(results: NormalizedMovieResult[], options: TrendingContentOptions): NormalizedMovieResult[] {
    return results.filter(result => {
      // Filter by minimum seeders
      if (options.minSeeders && result.seeders < options.minSeeders) {
        return false;
      }
      
      // Filter by minimum quality
      if (options.minQuality && result.quality) {
        const qualityValue = this.getQualityValue(result.quality);
        const minQualityValue = this.getQualityValue(options.minQuality);
        if (qualityValue < minQualityValue) {
          return false;
        }
      }
      
      // Filter by days since release (using the year as a proxy since we don't have exact dates)
      if (options.daysSinceRelease && result.year) {
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1; // 1-12
        
        // If the release is from a previous year, and we're looking for recent content
        // within days (e.g., 180 days or less), check if it's too old
        if (result.year < currentYear) {
          // For simplicity, approximate: if we want content from last 6 months (180 days)
          // and we're in July (month 7) or later, then last year's content is too old
          const monthThreshold = Math.ceil(options.daysSinceRelease / 30);
          if (currentMonth > monthThreshold) {
            return false;
          }
        }
      }
      
      // Exclude adult content if requested
      if (options.excludeAdult) {
        const title = result.title.toLowerCase();
        const adultKeywords = ['xxx', 'porn', 'adult', 'sex', 'erotic'];
        return !adultKeywords.some(keyword => title.includes(keyword));
      }
      
      return true;
    });
  }
  
  /**
   * Convert quality string to numeric value for comparison
   * @param quality Quality string (e.g., '720p', '1080p')
   * @returns Numeric value for comparison
   */
  private getQualityValue(quality: string): number {
    const qualityLower = quality.toLowerCase();
    
    if (qualityLower.includes('4k') || qualityLower.includes('2160p')) {
      return 4;
    } else if (qualityLower.includes('1080p')) {
      return 3;
    } else if (qualityLower.includes('720p')) {
      return 2;
    } else if (qualityLower.includes('480p')) {
      return 1;
    }
    
    return 0; // Unknown quality
  }
  
  /**
   * Generate search term for recent movies
   * @returns Search term
   */
  private generateRecentMovieSearchTerm(): string {
    const currentYear = new Date().getFullYear();
    return `${currentYear} OR ${currentYear - 1}`;
  }
  
  /**
   * Generate search term for very recent movies (last few months)
   * @returns Search term
   */
  private generateVeryRecentMovieSearchTerm(): string {
    const currentYear = new Date().getFullYear();
    return `${currentYear}`;
  }
  
  /**
   * Generate search term for recent TV shows
   * @returns Search term
   */
  private generateRecentTVSearchTerm(): string {
    const currentYear = new Date().getFullYear();
    return `S0${currentYear.toString().substring(2)} OR ${currentYear}`;
  }
}
