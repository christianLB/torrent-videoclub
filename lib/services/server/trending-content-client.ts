'use server';

/**
 * Trending Content Client
 * 
 * A specialized client for fetching trending content data from Prowlarr
 * Provides methods for different content categories with appropriate filtering
 *
 * MUST only be used in server-side contexts.
 */

// Import server-only package to enforce build-time errors when imported in client components
import 'server-only';

import { FeaturedItem } from '../../types/featured';
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
   * 3. Another TrendingContentClient instance (for backward compatibility)
   */
  constructor(prowlarrClientOrUrl: ProwlarrClient | string | TrendingContentClient, apiKey?: string) {
    if (typeof prowlarrClientOrUrl === 'string' && apiKey) {
      // Create a new ProwlarrClient with the provided URL and API key
      this.prowlarrClient = new ProwlarrClient(prowlarrClientOrUrl, apiKey);
      console.log('[TrendingContentClient] Initialized with URL and API key');
    } else if (prowlarrClientOrUrl instanceof ProwlarrClient) {
      // Use the provided ProwlarrClient instance
      this.prowlarrClient = prowlarrClientOrUrl;
      console.log('[TrendingContentClient] Initialized with ProwlarrClient instance');
    } else if (prowlarrClientOrUrl instanceof TrendingContentClient) {
      // Use the ProwlarrClient from another TrendingContentClient (for backward compatibility)
      this.prowlarrClient = prowlarrClientOrUrl.prowlarrClient;
      console.log('[TrendingContentClient] Initialized with another TrendingContentClient instance');
    } else {
      console.error('[TrendingContentClient] Invalid constructor arguments:', typeof prowlarrClientOrUrl);
      throw new Error('Invalid constructor arguments for TrendingContentClient');
    }
  }

  /**
   * Get trending movies
   * Searches for popular, high-quality movie torrents with good seeder counts
   */
  async getTrendingMovies(options: TrendingOptions = {}): Promise<FeaturedItem[]> {
    console.log('[TrendingContentClient] Fetching trending movies with options:', options);
    console.log('[TrendingContentClient] Using prowlarrClient:', !!this.prowlarrClient);
    
    try {
      // Search for trending movies - use a wildcard query to ensure we get results
      const results = await this.prowlarrClient.search({
        query: '*', // Wildcard query to match everything
        type: 'movie',
        minSeeders: options.minSeeders || 5, // Reduced minimum seeders to get more results
        limit: options.limit || 20
      });
      
      console.log(`[TrendingContentClient] Raw search returned ${results.length} movie results`);
      
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
      // Search for popular TV shows with wildcard query
      const results = await this.prowlarrClient.search({
        query: '*', // Wildcard query to match everything
        type: 'tv',
        minSeeders: options.minSeeders || 5, // Reduced minimum seeders to get more results
        limit: options.limit || 20
      });
      
      console.log(`[TrendingContentClient] Raw search returned ${results.length} TV show results`);
      
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
      // Calculate date range for recent releases
      const daysAgo = options.daysSinceRelease || 60; // Default to 60 days
      
      // Search for recent releases
      const results = await this.prowlarrClient.search({
        query: '1080p OR 720p', // Focus on HD content
        type: 'movie',
        minSeeders: options.minSeeders || 3, // Lower minimum seeders to get more results
        limit: options.limit || 20
      });
      
      console.log(`[TrendingContentClient] Raw search returned ${results.length} new release results`);
      
      // Convert to FeaturedItems
      const featuredItems = results.map(result => this.prowlarrClient.convertToFeaturedItem(result));
      
      // Filter by release date if possible (looking at publishDate)
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
      
      const recentItems = featuredItems.filter(item => {
        const publishDate = new Date(item.publishDate as string);
        return !isNaN(publishDate.getTime()) && publishDate >= cutoffDate;
      });
      
      // Filter out adult content if requested
      const filteredItems = options.excludeAdult 
        ? recentItems.filter(item => !this.isAdultContent(item.title))
        : recentItems;
      
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
      // Search for 4K content (movies and TV shows in 4K)
      // Use a more comprehensive query with alternative spellings and wildcards
      const results = await this.prowlarrClient.search({
        query: '4K OR 2160p OR UHD OR "Ultra HD"', // Enhanced search for 4K keywords
        minSeeders: options.minSeeders || 3, // Lower minimum seeders to get more results
        limit: options.limit || 20
      });
      
      console.log(`[TrendingContentClient] Raw search returned ${results.length} 4K content results`);
      
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
      // Search for documentaries with improved search terms
      const results = await this.prowlarrClient.search({
        query: 'documentary OR "BBC Documentary" OR "National Geographic" OR "Discovery Channel" OR "History Channel"',
        minSeeders: options.minSeeders || 2, // Lower minimum seeders to get more results
        limit: options.limit || 20
      });
      
      console.log(`[TrendingContentClient] Raw search returned ${results.length} documentary results`);
      
      // Determine media type based on categories and set it on each item
      const featuredItems = results.map(result => {
        // Check if this item has TV-related categories
        const isTVItem = result.categories.some(cat => {
          // If category is an object with a name property, use that
          const categoryName = typeof cat === 'object' && cat !== null && 'name' in cat 
            ? String(cat.name) 
            : String(cat);

          return categoryName.toLowerCase().includes('tv') || 
                 categoryName.toLowerCase().includes('series') ||
                 categoryName.toLowerCase().includes('show');
        });
        
        // Convert to FeaturedItem and set the mediaType based on category detection
        const item = this.prowlarrClient.convertToFeaturedItem(result);
        if (isTVItem) {
          item.mediaType = 'tv';
        }
        return item;
      });
      
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
