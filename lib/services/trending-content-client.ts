/**
 * Trending Content Client
 * 
 * A specialized client for fetching trending content data from Prowlarr
 * Provides methods for different content categories with appropriate filtering
 */
import { FeaturedItem } from '../types/featured';
import { ProwlarrClient } from './prowlarr-client';

export interface TrendingOptions {
  limit?: number;
  minSeeders?: number;
  minQuality?: string;
  daysSinceRelease?: number;
  excludeAdult?: boolean;
}

export class TrendingContentClient {
  private prowlarrClient: ProwlarrClient;
  
  /**
   * Constructor can accept either:
   * 1. A ProwlarrClient instance
   * 2. API URL and key to create a new ProwlarrClient
   */
  constructor(prowlarrClientOrUrl: ProwlarrClient | string, apiKey?: string) {
    if (typeof prowlarrClientOrUrl === 'string' && apiKey) {
      // Create a new ProwlarrClient with the provided URL and API key
      this.prowlarrClient = new ProwlarrClient(prowlarrClientOrUrl, apiKey);
    } else if (prowlarrClientOrUrl instanceof ProwlarrClient) {
      // Use the provided ProwlarrClient instance
      this.prowlarrClient = prowlarrClientOrUrl;
    } else {
      throw new Error('Invalid constructor arguments for TrendingContentClient');
    }
  }

  /**
   * Get trending movies
   * Searches for popular, high-quality movie torrents with good seeder counts
   */
  async getTrendingMovies(options: TrendingOptions = {}): Promise<FeaturedItem[]> {
    console.log('[TrendingContentClient] Fetching trending movies with options:', options);
    
    try {
      // Search for trending movies
      const results = await this.prowlarrClient.search({
        query: '2023 OR 2024 1080p OR 2160p',
        categories: ['2000', '2010', '2020', '2030', '2040', '2045', '2050', '2060'], // Movie categories
        minSeeders: options.minSeeders || 10,
        limit: options.limit || 20
      });
      
      // Convert to FeaturedItems
      const featuredItems = results.map(result => this.prowlarrClient.convertToFeaturedItem(result));
      
      // Filter out adult content if requested
      const filteredItems = options.excludeAdult 
        ? featuredItems.filter(item => !this.isAdultContent(item.title))
        : featuredItems;
      
      console.log(`[TrendingContentClient] Found ${filteredItems.length} trending movies`);
      return filteredItems;
    } catch (error) {
      console.error('[TrendingContentClient] Error fetching trending movies:', error);
      return [];
    }
  }

  /**
   * Get popular TV shows
   * Searches for popular TV shows with good seeder counts
   */
  async getPopularTV(options: TrendingOptions = {}): Promise<FeaturedItem[]> {
    console.log('[TrendingContentClient] Fetching popular TV shows with options:', options);
    
    try {
      // Search for popular TV shows
      const results = await this.prowlarrClient.search({
        query: 'S01 OR S02 OR "Season 1" OR "Season 2" 1080p',
        categories: ['5000', '5020', '5030', '5040', '5045', '5050', '5060', '5070', '5080'], // TV categories
        minSeeders: options.minSeeders || 5,
        limit: options.limit || 20
      });
      
      // Convert to FeaturedItems
      const featuredItems = results.map(result => this.prowlarrClient.convertToFeaturedItem(result));
      
      // Filter out adult content if requested
      const filteredItems = options.excludeAdult 
        ? featuredItems.filter(item => !this.isAdultContent(item.title))
        : featuredItems;
      
      console.log(`[TrendingContentClient] Found ${filteredItems.length} popular TV shows`);
      return filteredItems;
    } catch (error) {
      console.error('[TrendingContentClient] Error fetching popular TV shows:', error);
      return [];
    }
  }

  /**
   * Get new releases
   * Searches for recent movie releases with good quality
   */
  async getNewReleases(options: TrendingOptions = {}): Promise<FeaturedItem[]> {
    console.log('[TrendingContentClient] Fetching new releases with options:', options);
    
    try {
      // Search for new releases
      const results = await this.prowlarrClient.search({
        query: '2024 1080p OR 2160p',
        categories: ['2000', '2010', '2020', '2030', '2040', '2045', '2050', '2060'], // Movie categories
        minSeeders: options.minSeeders || 5,
        limit: options.limit || 20
      });
      
      // Convert to FeaturedItems
      const featuredItems = results.map(result => this.prowlarrClient.convertToFeaturedItem(result));
      
      // Filter out adult content if requested
      const filteredItems = options.excludeAdult 
        ? featuredItems.filter(item => !this.isAdultContent(item.title))
        : featuredItems;
      
      console.log(`[TrendingContentClient] Found ${filteredItems.length} new releases`);
      return filteredItems;
    } catch (error) {
      console.error('[TrendingContentClient] Error fetching new releases:', error);
      return [];
    }
  }

  /**
   * Get 4K content
   * Searches specifically for 4K/2160p content
   */
  async get4KContent(options: TrendingOptions = {}): Promise<FeaturedItem[]> {
    console.log('[TrendingContentClient] Fetching 4K content with options:', options);
    
    try {
      // Search for 4K content
      const results = await this.prowlarrClient.search({
        query: '2160p OR 4K OR UHD',
        categories: ['2000', '2010', '2020', '2030', '2040', '2045', '2050', '2060', '5000', '5020'], // Movie and TV categories
        minSeeders: options.minSeeders || 5,
        limit: options.limit || 20
      });
      
      // Convert to FeaturedItems
      const featuredItems = results.map(result => this.prowlarrClient.convertToFeaturedItem(result));
      
      // Filter out adult content if requested
      const filteredItems = options.excludeAdult 
        ? featuredItems.filter(item => !this.isAdultContent(item.title))
        : featuredItems;
      
      console.log(`[TrendingContentClient] Found ${filteredItems.length} 4K content items`);
      return filteredItems;
    } catch (error) {
      console.error('[TrendingContentClient] Error fetching 4K content:', error);
      return [];
    }
  }

  /**
   * Get documentaries
   * Searches specifically for documentary content
   */
  async getDocumentaries(options: TrendingOptions = {}): Promise<FeaturedItem[]> {
    console.log('[TrendingContentClient] Fetching documentaries with options:', options);
    
    try {
      // Search for documentaries
      const results = await this.prowlarrClient.search({
        query: 'documentary OR bbc OR national geographic OR discovery',
        categories: ['2000', '2030', '5000', '5080'], // Documentary categories
        minSeeders: options.minSeeders || 3,
        limit: options.limit || 20
      });
      
      // Convert to FeaturedItems
      const featuredItems = results.map(result => this.prowlarrClient.convertToFeaturedItem(result));
      
      // Filter out adult content if requested
      const filteredItems = options.excludeAdult 
        ? featuredItems.filter(item => !this.isAdultContent(item.title))
        : featuredItems;
      
      console.log(`[TrendingContentClient] Found ${filteredItems.length} documentaries`);
      return filteredItems;
    } catch (error) {
      console.error('[TrendingContentClient] Error fetching documentaries:', error);
      return [];
    }
  }
  
  /**
   * Check if content title appears to be adult content
   * Basic filter to exclude adult content from results
   */
  private isAdultContent(title: string): boolean {
    const adultKeywords = [
      'xxx', 'porn', 'adult', 'sex', 'erotic', 'nude', 'naked', 
      'hentai', 'brazzers', 'playboy', 'penthouse'
    ];
    
    const lowerTitle = title.toLowerCase();
    return adultKeywords.some(keyword => lowerTitle.includes(keyword));
  }
}
