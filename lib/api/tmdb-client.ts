/**
 * TMDb API Client
 * 
 * This client is responsible for interacting with the TMDb API
 * to search for movies and get movie details.
 */
import { TMDBMediaItem, TMDBGenre } from '../types/tmdb';

// Raw TMDb API response interfaces
interface RawTMDbMovie {
  id: number;
  title: string;
  original_title?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string;
  vote_average?: number;
  vote_count?: number;
  popularity?: number;
  original_language?: string;
  runtime?: number;
  status?: string;
  tagline?: string;
  genres?: Array<{id: number; name: string}>;
  media_type?: string;
}

interface RawTMDbTvShow {
  id: number;
  name: string;
  original_name?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  first_air_date?: string;
  last_air_date?: string;
  vote_average?: number;
  vote_count?: number;
  popularity?: number;
  original_language?: string;
  number_of_episodes?: number;
  number_of_seasons?: number;
  episode_run_time?: number[];
  status?: string;
  tagline?: string;
  genres?: Array<{id: number; name: string}>;
  external_ids?: {
    tvdb_id?: number | string;
    [key: string]: unknown;
  };
  media_type?: string;
}

export class TMDbClient {
  private apiKey: string;
  private baseUrl = 'https://api.themoviedb.org/3';
  private imageBaseUrl = 'https://image.tmdb.org/t/p';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Search for movies in TMDb
   * @param query Search query
   * @returns Normalized movie results
   */
  async searchMovies(query: string): Promise<TMDBMediaItem[]> {
    try {
      // Log TMDb search (omitting API key for security)
      console.log('Searching TMDb for movies:', query);
      
      // Check if API key is empty or very short (likely invalid)
      if (!this.apiKey || this.apiKey.length < 5) {
        console.warn('TMDb API key appears to be missing or invalid - TMDb features will be limited');
        if (process.env.NODE_ENV === 'test') throw new Error('TMDb API key is missing or invalid');
        return []; 
      }
      
      const url = `${this.baseUrl}/search/movie?api_key=${this.apiKey}&query=${encodeURIComponent(query)}&include_adult=false&language=en-US`;
      const response = await fetch(url, { method: 'GET' });

      if (!response.ok) {
        const errorMessage = `Failed to fetch data from TMDb: ${response.status} ${response.statusText}`;
        try {
          const errorText = await response.text();
          if (errorText) console.error(`TMDb API error: ${response.status} ${response.statusText}`, errorText);
        } catch (textError) {
          console.error('Could not extract error text from response:', textError);
        }
        if (process.env.NODE_ENV === 'test') throw new Error(errorMessage);
        return [];
      }

      const data = await response.json();
      return data.results.map((result: unknown) => this.normalizeMovieResult(result));
    } catch (error) {
      console.error('Error searching TMDb movies:', error);
      if (process.env.NODE_ENV === 'test') throw error;
      return [];
    }
  }
  
  /**
   * Search for TV shows in TMDb
   * @param query Search query
   * @returns Normalized TV show results
   */
  async searchTvShows(query: string): Promise<TMDBMediaItem[]> {
    try {
      console.log('Searching TMDb for TV shows:', query);
      if (!this.apiKey || this.apiKey.length < 5) {
        console.warn('TMDb API key appears to be missing or invalid - TMDb features will be limited');
        if (process.env.NODE_ENV === 'test') throw new Error('TMDb API key is missing or invalid');
        return [];
      }
      
      const url = `${this.baseUrl}/search/tv?api_key=${this.apiKey}&query=${encodeURIComponent(query)}&include_adult=false&language=en-US`;
      const response = await fetch(url, { method: 'GET' });

      if (!response.ok) {
        const errorMessage = `Failed to fetch data from TMDb: ${response.status} ${response.statusText}`;
        try {
          const errorText = await response.text();
          if (errorText) console.error(`TMDb API error: ${response.status} ${response.statusText}`, errorText);
        } catch (textError) {
          console.error('Could not extract error text from response:', textError);
        }
        if (process.env.NODE_ENV === 'test') throw new Error(errorMessage);
        return [];
      }

      const data = await response.json();
      return data.results.map((result: unknown) => this.normalizeTvShowResult(result));
    } catch (error) {
      console.error('Error searching TMDb TV shows:', error);
      if (process.env.NODE_ENV === 'test') throw error;
      return [];
    }
  }

  /**
   * Get movie details from TMDb
   * @param movieId TMDb movie ID
   * @returns Normalized movie details
   */
  async getMovieDetails(movieId: number): Promise<TMDBMediaItem | null> {
    try {
      if (!this.apiKey || this.apiKey.length < 5) {
        console.warn('TMDb API key appears to be missing or invalid - Cannot fetch movie details');
        return null;
      }
      
      const url = `${this.baseUrl}/movie/${movieId}?api_key=${this.apiKey}&language=en-US`;
      const response = await fetch(url, { method: 'GET' });

      if (!response.ok) {
        console.error(`TMDb API error when fetching movie details: ${response.status} ${response.statusText}`);
        return null;
      }

      const result = await response.json();
      return this.normalizeMovieDetails(result);
    } catch (error) {
      console.error('Error fetching movie details:', error);
      return null;
    }
  }

  /**
   * Normalize a movie result from TMDb for search, popular, trending lists.
   * @param result Raw TMDb list item result for a movie
   * @returns Normalized movie item as TMDBMediaItem
   */
  private normalizeMovieResult(result: unknown): TMDBMediaItem {
    const res = result as RawTMDbMovie;
    return {
      tmdbId: res.id,
      mediaType: 'movie',
      title: res.title,
      originalTitle: res.original_title,
      overview: res.overview ?? '',
      posterPath: res.poster_path ?? null, // Store relative path
      backdropPath: res.backdrop_path ?? null, // Store relative path
      releaseDate: res.release_date,
      voteAverage: res.vote_average,
      voteCount: res.vote_count,
      popularity: res.popularity,
      originalLanguage: res.original_language,
      // genres: res.genre_ids, // TMDB search results provide genre_ids, not full genre objects.
                                 // Full genre objects are in /details. Caching TMDBMediaItem will reflect this.
    };
  }

  /**
   * Get TV show details from TMDb
   * @param tvShowId TMDb TV show ID
   * @returns Normalized TV show details
   */
  async getTvShowDetails(tvShowId: number): Promise<TMDBMediaItem | null> {
    try {
      if (!this.apiKey || this.apiKey.length < 5) {
        console.warn('TMDb API key appears to be missing or invalid - Cannot fetch TV show details');
        return null;
      }
      
      const url = `${this.baseUrl}/tv/${tvShowId}?api_key=${this.apiKey}&language=en-US&append_to_response=external_ids`;
      const response = await fetch(url, { method: 'GET' });

      if (!response.ok) {
        console.error(`TMDb API error when fetching TV show details: ${response.status} ${response.statusText}`);
        return null;
      }

      const result = await response.json();
      return this.normalizeTvShowDetails(result);
    } catch (error) {
      console.error('Error fetching TV show details:', error);
      return null;
    }
  }

  /**
   * Normalize full movie details from TMDb.
   * @param result Raw TMDb movie details result
   * @returns Normalized movie details as TMDBMediaItem
   */
  private normalizeMovieDetails(result: unknown): TMDBMediaItem {
    const res = result as RawTMDbMovie;
    return {
      tmdbId: res.id,
      mediaType: 'movie',
      title: res.title,
      originalTitle: res.original_title,
      overview: res.overview ?? '',
      posterPath: res.poster_path ?? null, // Store relative path
      backdropPath: res.backdrop_path ?? null, // Store relative path
      releaseDate: res.release_date,
      voteAverage: res.vote_average,
      voteCount: res.vote_count,
      popularity: res.popularity,
      genres: res.genres?.map(genre => ({ id: genre.id, name: genre.name })) as TMDBGenre[], // Details endpoint provides full genre objects
      runtime: res.runtime,
      status: res.status,
      tagline: res.tagline,
      originalLanguage: res.original_language,
    };
  }

  /**
   * Normalize a TV show result from TMDb
   * @param result Raw TMDb TV show result
   * @returns Normalized TV show result
   */
  private normalizeTvShowResult(result: unknown): TMDBMediaItem {
    const res = result as RawTMDbTvShow;
    return {
      tmdbId: res.id,
      mediaType: 'tv',
      title: res.name, // TV shows use 'name'
      originalTitle: res.original_name,
      overview: res.overview ?? '',
      posterPath: res.poster_path ?? null, // Store relative path
      backdropPath: res.backdrop_path ?? null, // Store relative path
      firstAirDate: res.first_air_date,
      voteAverage: res.vote_average,
      voteCount: res.vote_count,
      popularity: res.popularity,
      originalLanguage: res.original_language,
      // genres: res.genre_ids, // TMDB search results provide genre_ids, not full genre objects.
    };
  }

  /**
   * Normalize TV show details from TMDb
   * @param result Raw TMDb TV show details
   * @returns Normalized TV show details
   */
  private normalizeTvShowDetails(result: unknown): TMDBMediaItem {
    const res = result as RawTMDbTvShow;
    // Ensure external_ids and tvdb_id are handled, even if null or undefined
    const tvdbId = res.external_ids?.tvdb_id ? (typeof res.external_ids.tvdb_id === 'string' ? parseInt(res.external_ids.tvdb_id, 10) : res.external_ids.tvdb_id) : undefined;

    return {
      tmdbId: res.id,
      mediaType: 'tv',
      title: res.name, // TV shows use 'name'
      originalTitle: res.original_name,
      overview: res.overview ?? '',
      posterPath: res.poster_path ?? null, // Store relative path
      backdropPath: res.backdrop_path ?? null, // Store relative path
      firstAirDate: res.first_air_date,
      lastAirDate: res.last_air_date,
      voteAverage: res.vote_average,
      voteCount: res.vote_count,
      popularity: res.popularity,
      genres: res.genres?.map(genre => ({
        id: genre.id,
        name: genre.name
      })) as TMDBGenre[],
      numberOfEpisodes: res.number_of_episodes,
      numberOfSeasons: res.number_of_seasons,
      episodeRunTime: res.episode_run_time,
      status: res.status,
      tagline: res.tagline,
      originalLanguage: res.original_language,
      tvdb_id: tvdbId, // Added tvdb_id here
    };
  }

  // Methods for popular and trending content
  async getPopularMovies(page: number = 1): Promise<TMDBMediaItem[]> {
    return this.fetchMediaList('/movie/popular', page, this.normalizeMovieResult.bind(this));
  }

  async getTrendingMovies(timeWindow: 'day' | 'week' = 'week', page: number = 1): Promise<TMDBMediaItem[]> {
    return this.fetchMediaList(`/trending/movie/${timeWindow}`, page, this.normalizeMovieResult.bind(this));
  }

  async getPopularTvShows(page: number = 1): Promise<TMDBMediaItem[]> {
    return this.fetchMediaList('/tv/popular', page, this.normalizeTvShowResult.bind(this));
  }

  async getTrendingTvShows(timeWindow: 'day' | 'week' = 'week', page: number = 1): Promise<TMDBMediaItem[]> {
    return this.fetchMediaList(`/trending/tv/${timeWindow}`, page, this.normalizeTvShowResult.bind(this));
  }

  async getUpcomingMovies(page: number = 1): Promise<TMDBMediaItem[]> {
    return this.fetchMediaList('/movie/upcoming', page, this.normalizeMovieResult.bind(this));
  }

  async getTopRatedMovies(page: number = 1): Promise<TMDBMediaItem[]> {
    return this.fetchMediaList('/movie/top_rated', page, this.normalizeMovieResult.bind(this));
  }

  // Generic helper for fetching lists of media items
  private async fetchMediaList(
    endpoint: string, 
    page: number, 
    normalizer: (result: unknown) => TMDBMediaItem
  ): Promise<TMDBMediaItem[]> {
    try {
      if (!this.apiKey || this.apiKey.length < 5) {
        console.warn(`TMDb API key missing or invalid - Cannot fetch from ${endpoint}`);
        if (process.env.NODE_ENV === 'test') throw new Error('TMDb API key is missing or invalid');
        return [];
      }

      const url = `${this.baseUrl}${endpoint}?api_key=${this.apiKey}&language=en-US&page=${page}`;
      const response = await fetch(url, { method: 'GET' });

      if (!response.ok) {
        const errorMessage = `Failed to fetch data from TMDb (${endpoint}): ${response.status} ${response.statusText}`;
        try {
          const errorText = await response.text();
          if (errorText) console.error(`TMDb API error: ${response.status} ${response.statusText}`, errorText);
        } catch (textError) {
          console.error('Could not extract error text from response:', textError);
        }
        if (process.env.NODE_ENV === 'test') throw new Error(errorMessage);
        return [];
      }

      const data = await response.json();
      return data.results.map(normalizer);
    } catch (error) {
      console.error(`Error fetching from TMDb (${endpoint}):`, error);
      if (process.env.NODE_ENV === 'test') throw error;
      return [];
    }
  }
}
