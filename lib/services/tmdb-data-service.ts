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

    // Fetch directly from TMDb
    console.log(`[TMDBDataService] Fetching ${mediaType} ID ${tmdbId} directly from TMDb.`);
    let fetchedItem: TMDBMediaItem | null = null;
    try {
      if (mediaType === 'movie') {
        fetchedItem = await this.tmdbClient.getMovieDetails(tmdbId);
      } else if (mediaType === 'tv') {
        fetchedItem = await this.tmdbClient.getTvShowDetails(tmdbId);
      }
    } catch (error) {
      console.error(`[TMDBDataService] Error fetching ${mediaType} ID ${tmdbId} from TMDb:`, error);
      return null; // Return null on error
    }

    if (fetchedItem) {
      return fetchedItem;
    }

    // If not fetched (e.g., 404 from TMDb), warn and return null
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

    // Fetch list directly from TMDb
    console.log(`[TMDBDataService] Fetching list ${listCacheKey} directly from TMDb.`);
    let fetchedItems: TMDBMediaItem[] = [];
    try {
      fetchedItems = await fetchFunction();
    } catch (error) {
      console.error(`[TMDBDataService] Error fetching list ${listCacheKey} from TMDb:`, error);
      return []; // Return empty array on error
    }

    // No caching step, just return fetched items
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

  async getOrFetchUpcomingMovies(page: number = 1): Promise<TMDBMediaItem[]> {
    const listCacheKey = `upcoming-movies:p${page}`;
    return this.getOrFetchMediaList(
      listCacheKey,
      () => this.tmdbClient.getUpcomingMovies(page),
      'movie'
    );
  }

  async getOrFetchTopRatedMovies(page: number = 1): Promise<TMDBMediaItem[]> {
    const listCacheKey = `top-rated-movies:p${page}`;
    return this.getOrFetchMediaList(
      listCacheKey,
      () => this.tmdbClient.getTopRatedMovies(page),
      'movie'
    );
  }
}

// Export a singleton instance (only for server-side use!)
export const tmdbDataService = new TMDBDataService();
