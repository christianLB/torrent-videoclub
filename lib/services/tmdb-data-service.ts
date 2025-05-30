/**
 * Server-Side TMDB Data Service with Caching
 *
 * This service orchestrates fetching data from TMDb (via TMDbClient)
 * and caching it using RedisService. It implements a cache-aside strategy.
 * 
 * MUST only be used in server-side contexts.
 */
import { TMDbClient } from '../api/tmdb-client';
import { TMDBMediaItem } from '../types/tmdb';
import { redisService } from './server/redis-service';

const TMDB_API_KEY = process.env.TMDB_API_KEY;

class TMDBDataService {
  private tmdbClient: TMDbClient;

  constructor() {
    if (!TMDB_API_KEY) {
      const errorMessage = '[TMDBDataService] TMDB_API_KEY is not set. This service requires a TMDB API key to function.';
      console.error(errorMessage);
      throw new Error(errorMessage);
    }
    this.tmdbClient = new TMDbClient(TMDB_API_KEY);
  }

  /**
   * Retrieves a single media item (movie or TV show) from cache or fetches from TMDb API.
   * @param tmdbId The TMDB ID of the item.
   * @param mediaType The media type ('movie' or 'tv').
   * @returns The TMDBMediaItem or null if not found or an error occurs.
   */
  async getOrFetchMediaItem(tmdbId: number, mediaType: 'movie' | 'tv'): Promise<TMDBMediaItem | null> {
    if (!TMDB_API_KEY) return null; // Do not proceed if API key is missing

    // 1. Try to get from cache
    const cachedItem = await redisService.getTMDBItem(tmdbId, mediaType);
    if (cachedItem) {
      console.log(`[TMDBDataService] Cache hit for ${mediaType} ID ${tmdbId}`);
      return cachedItem;
    }

    console.log(`[TMDBDataService] Cache miss for ${mediaType} ID ${tmdbId}. Fetching from TMDb.`);

    // 2. If not in cache, fetch from TMDb
    let fetchedItem: TMDBMediaItem | null = null;
    try {
      if (mediaType === 'movie') {
        fetchedItem = await this.tmdbClient.getMovieDetails(tmdbId);
      } else if (mediaType === 'tv') {
        fetchedItem = await this.tmdbClient.getTvShowDetails(tmdbId); // Corrected tvShowId to tmdbId
      }
    } catch (error) {
      console.error(`[TMDBDataService] Error fetching ${mediaType} ID ${tmdbId} from TMDb:`, error);
      return null;
    }

    // 3. If fetched successfully, cache it
    if (fetchedItem) {
      console.log(`[TMDBDataService] Fetched ${mediaType} ID ${tmdbId} from TMDb. Caching now.`);
      await redisService.setTMDBItem(fetchedItem);
      return fetchedItem;
    }

    console.warn(`[TMDBDataService] Could not find ${mediaType} ID ${tmdbId} from TMDb.`);
    return null;
  }

  // --- List Fetching Methods ---

  private async getOrFetchMediaList(
    listCacheKey: string,
    fetchFunction: () => Promise<TMDBMediaItem[]>,
    mediaType: 'movie' | 'tv'
  ): Promise<TMDBMediaItem[]> {
    if (!TMDB_API_KEY) return [];

    // 1. Try to get list of IDs from cache
    const cachedIdList = await redisService.getTMDBIdList(listCacheKey);

    if (cachedIdList) {
      console.log(`[TMDBDataService] Cache hit for ID list: ${listCacheKey}`);
      const items: TMDBMediaItem[] = [];
      for (const id of cachedIdList) {
        const item = await this.getOrFetchMediaItem(id, mediaType);
        if (item) {
          items.push(item);
        }
      }
      return items;
    }

    console.log(`[TMDBDataService] Cache miss for ID list: ${listCacheKey}. Fetching from TMDb.`);

    // 2. If ID list not in cache, fetch full items from TMDb
    let fetchedItems: TMDBMediaItem[] = [];
    try {
      fetchedItems = await fetchFunction();
    } catch (error) {
      console.error(`[TMDBDataService] Error fetching list ${listCacheKey} from TMDb:`, error);
      return [];
    }

    // 3. If fetched successfully, cache IDs and individual items
    if (fetchedItems.length > 0) {
      console.log(`[TMDBDataService] Fetched ${fetchedItems.length} items for ${listCacheKey}. Caching now.`);
      const idsToCache = fetchedItems.map(item => item.tmdbId);
      await redisService.setTMDBIdList(listCacheKey, idsToCache);
      
      // Cache each individual item (getOrFetchMediaItem would also do this, but batching here can be efficient)
      for (const item of fetchedItems) {
        // Check if item is already cached to avoid redundant set operations if getOrFetchMediaItem was somehow called prior
        // This is a small optimization and might not be strictly necessary if setTMDBItem is idempotent and cheap.
        const alreadyCached = await redisService.getTMDBItem(item.tmdbId, mediaType);
        if (!alreadyCached) {
           await redisService.setTMDBItem(item);
        }
      }
    }
    return fetchedItems;
  }

  async getOrFetchPopularMovies(page: number = 1): Promise<TMDBMediaItem[]> {
    const listCacheKey = `popular-movies:p${page}`;
    return this.getOrFetchMediaList(
      listCacheKey,
      () => this.tmdbClient.getPopularMovies(page),
      'movie'
    );
  }

  async getOrFetchTrendingMovies(timeWindow: 'day' | 'week' = 'week', page: number = 1): Promise<TMDBMediaItem[]> {
    const listCacheKey = `trending-movies-${timeWindow}:p${page}`;
    return this.getOrFetchMediaList(
      listCacheKey,
      () => this.tmdbClient.getTrendingMovies(timeWindow, page),
      'movie'
    );
  }

  async getOrFetchPopularTvShows(page: number = 1): Promise<TMDBMediaItem[]> {
    const listCacheKey = `popular-tv:p${page}`;
    return this.getOrFetchMediaList(
      listCacheKey,
      () => this.tmdbClient.getPopularTvShows(page),
      'tv'
    );
  }

  async getOrFetchTrendingTvShows(timeWindow: 'day' | 'week' = 'week', page: number = 1): Promise<TMDBMediaItem[]> {
    const listCacheKey = `trending-tv-${timeWindow}:p${page}`;
    return this.getOrFetchMediaList(
      listCacheKey,
      () => this.tmdbClient.getTrendingTvShows(timeWindow, page),
      'tv'
    );
  }
}

// Export a singleton instance (only for server-side use!)
export const tmdbDataService = new TMDBDataService();
