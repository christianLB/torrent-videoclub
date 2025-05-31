/**
 * Metadata Enrichment Service
 * 
 * This service is responsible for enriching content items with metadata from TMDb.
 * It uses the TMDb API client to search for and retrieve detailed information about
 * movies and TV shows.
 */

import { EnhancedMediaItem } from '../types/featured';
import { TMDbClient } from '../api/tmdb-client';
import { NormalizedMovieResult } from '../api/prowlarr-client';

// Extended type for NormalizedMovieResult with optional additional properties
type ExtendedMovieResult = NormalizedMovieResult & {
  infoUrl?: string;
  downloadUrl?: string;
  publishDate?: string;
};

// Interface for TMDb search results to avoid 'unknown' type issues
interface TMDbResult {
  id: number;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  vote_count?: number;
  genres?: Array<{ id: number; name: string }>;
  genre_ids?: number[];
  popularity?: number;
  media_type?: 'movie' | 'tv';
  number_of_seasons?: number;
  number_of_episodes?: number;
  runtime?: number;
  episode_run_time?: number[];
  external_ids?: {
    tvdb_id?: number | string;
  };
}

/**
 * Service for enriching media items with metadata from TMDb
 */
export class MetadataEnricher {
  private static tmdbClient: TMDbClient | null = null;
  private static enabled = true;
  
  /**
   * Initialize the MetadataEnricher service
   * @param tmdbClient Optional TMDb client instance
   */
  static initialize(tmdbClient?: TMDbClient): void {
    if (tmdbClient) {
      this.tmdbClient = tmdbClient;
      this.enabled = true;
    } else {
      const tmdbApiKey = process.env.TMDB_API_KEY || '';
      if (tmdbApiKey) {
        this.tmdbClient = new TMDbClient(tmdbApiKey);
        console.log('TMDb client initialized successfully in MetadataEnricher');
        this.enabled = true;
      } else {
        console.warn('TMDb API key not found, metadata enrichment disabled');
        this.enabled = false;
      }
    }
  }
  
  /**
   * Enrich a movie result with TMDb metadata
   * @param item Movie result to enrich
   * @returns Enriched media item with TMDb metadata
   */
  static async enrichMovie(item: ExtendedMovieResult): Promise<EnhancedMediaItem> {
    if (!this.enabled || !this.tmdbClient) {
      return this.createBasicEnhancedItem(item, 'movie');
    }
    
    try {
      // Search for the movie on TMDb
      const query = this.normalizeTitle(item.title);
      const year = item.year ? item.year.toString() : undefined;
      
      // TMDb client expects just the query string, we'll filter by year after
      const searchResults = await this.tmdbClient.searchMovies(query);
      
      // Filter by year if provided
      const filteredResults = year && searchResults.length > 0
        ? searchResults.filter(result => {
            // Need to convert TMDBMediaItem to match TMDbResult structure
            const releaseYear = result.releaseDate?.substring(0, 4);
            return releaseYear === year;
          })
        : searchResults;
      
      const resultsToUse = filteredResults.length > 0 ? filteredResults : searchResults;
      
      // If we found a match, get the movie details
      if (resultsToUse && resultsToUse.length > 0) {
        // Convert TMDBMediaItem[] to TMDbResult[] for the best match finder
        const resultsAsSearchFormat: TMDbResult[] = resultsToUse.map(result => ({
          id: result.tmdbId,
          title: result.title,
          overview: result.overview || '',
          poster_path: result.posterPath,
          backdrop_path: result.backdropPath,
          release_date: result.releaseDate,
          vote_average: result.voteAverage,
          genre_ids: result.genres?.map(g => g.id)
        }));
        
        const bestMatch = this.findBestMatch(resultsAsSearchFormat, item.title);
        if (!bestMatch) {
          return this.createBasicEnhancedItem(item, 'movie');
        }
        
        const movieDetails = await this.tmdbClient.getMovieDetails(bestMatch.id);
        
        // Extract year from release date if available
        const year = movieDetails?.releaseDate 
          ? parseInt(movieDetails.releaseDate.substring(0, 4), 10) 
          : (item.year || new Date().getFullYear());

        // Create the enhanced item with TMDb metadata
        const enhancedItem = this.createBasicEnhancedItem(item, 'movie');
        
        // Add TMDb info
        enhancedItem.tmdbInfo = {
          tmdbId: bestMatch.id,
          title: movieDetails?.title || bestMatch.title || item.title,
          overview: movieDetails?.overview || bestMatch.overview || '',
          posterPath: movieDetails?.posterPath || bestMatch.poster_path || undefined,
          backdropPath: movieDetails?.backdropPath || bestMatch.backdrop_path || undefined,
          voteAverage: movieDetails?.voteAverage || bestMatch.vote_average || 0,
          year: year,
          genreIds: movieDetails?.genres ? movieDetails.genres.map((g: { id: number }) => g.id) : (bestMatch.genre_ids || []),
          runtime: movieDetails?.runtime || 0
        };
        
        // Set display fields
        enhancedItem.displayTitle = enhancedItem.tmdbInfo?.title || item.title;
        enhancedItem.displayOverview = enhancedItem.tmdbInfo?.overview || '';
        enhancedItem.displayYear = enhancedItem.tmdbInfo?.year || year;
        enhancedItem.displayRating = enhancedItem.tmdbInfo?.voteAverage || 0;
        enhancedItem.displayGenres = movieDetails?.genres?.map((g: { name: string }) => g.name) || [];
        
        // Set paths for UI display
        enhancedItem.fullPosterPath = enhancedItem.tmdbInfo?.posterPath 
          ? `https://image.tmdb.org/t/p/w500${enhancedItem.tmdbInfo.posterPath}`
          : '/api/placeholder/500/750';
        
        enhancedItem.fullBackdropPath = enhancedItem.tmdbInfo?.backdropPath
          ? `https://image.tmdb.org/t/p/original${enhancedItem.tmdbInfo.backdropPath}`
          : '/api/placeholder/1920/1080';
      }
      
      // If no match was found, return a basic enhanced item
      return this.createBasicEnhancedItem(item, 'movie');
    } catch (error) {
      console.error('Error enriching movie with TMDb metadata:', error);
      return this.createBasicEnhancedItem(item, 'movie');
    }
  }
  
  /**
   * Enrich a TV series result with TMDb metadata
   * @param item TV series result to enrich
   * @returns Enriched media item with TMDb metadata
   */
  static async enrichTVSeries(item: ExtendedMovieResult): Promise<EnhancedMediaItem> {
    if (!this.enabled || !this.tmdbClient) {
      return this.createBasicEnhancedItem(item, 'tv');
    }
    
    try {
      // Clean the title for search
      const searchTitle = this.normalizeTitle(item.title);
      
      // Search for TV show by title
      const searchResults = await this.tmdbClient.searchTvShows(searchTitle);
      if (!searchResults || searchResults.length === 0) {
        console.log(`No TMDb results found for TV show: ${searchTitle}`);
        return this.createBasicEnhancedItem(item, 'tv');
      }

      // Find best match
      const resultsAsSearchFormat = searchResults.map(item => ({
        id: item.tmdbId,
        name: item.title, // For TV shows, title is stored in name in raw API results
        overview: item.overview,
        poster_path: item.posterPath,
        backdrop_path: item.backdropPath,
        first_air_date: item.firstAirDate,
        vote_average: item.voteAverage,
        genre_ids: item.genres?.map(g => g.id)
      }));
      const bestMatch = this.findBestMatch(resultsAsSearchFormat, searchTitle);
      const tvDetails = await this.tmdbClient.getTvShowDetails(bestMatch.id);
        
      // Extract year from first air date if available
      // This year variable will be used in both tmdbInfo and displayYear
      const year = tvDetails?.firstAirDate 
        ? parseInt(tvDetails.firstAirDate.substring(0, 4), 10) 
        : (item.year || this.extractYearFromTitle(item.title) || new Date().getFullYear());

      // Create the enriched item with TMDb metadata
      const enhancedItem: EnhancedMediaItem = {
        guid: item.guid || `tv-${Date.now()}`,
        indexerId: item.indexer || '', // Map indexer to indexerId
        title: item.title, // Keep original title from Prowlarr
        size: item.size,
        protocol: 'torrent', // Default protocol
        seeders: item.seeders,
        leechers: item.leechers,
        quality: item.quality,
        publishDate: new Date().toISOString(), // Default publishDate
        infoUrl: item.infoUrl || '',
        downloadUrl: item.downloadUrl || '',
        mediaType: 'tv',
        // TMDb enrichment data
        tmdbInfo: {
          tmdbId: bestMatch.id,
          title: bestMatch.name,
          overview: bestMatch.overview,
          posterPath: bestMatch.poster_path || undefined,
          backdropPath: bestMatch.backdrop_path || undefined,
          voteAverage: bestMatch.vote_average,
          year: year,
          runtime: tvDetails?.episodeRunTime?.[0],
          genreIds: tvDetails?.genres?.map(g => g.id) || bestMatch.genre_ids || []
        },
        // Display fields
        displayTitle: bestMatch.name || item.title,
        displayOverview: bestMatch.overview || '',
        displayYear: year,
        displayRating: bestMatch.vote_average,
        displayGenres: tvDetails?.genres?.map(g => g.name)
      };
      return enhancedItem;
      
      // If no match was found, return a basic enhanced item
      return this.createBasicEnhancedItem(item, 'tv');
    } catch (error) {
      console.error('Error enriching TV series with TMDb metadata:', error);
      return this.createBasicEnhancedItem(item, 'tv');
    }
  }
  
  /**
   * Create a basic enhanced media item without TMDb metadata
   * @param item Base item to enhance
   * @param mediaType Type of media ('movie' or 'tv')
   * @returns Basic enhanced media item
   */
  private static createBasicEnhancedItem(
    item: ExtendedMovieResult, 
    mediaType: 'movie' | 'tv'
  ): EnhancedMediaItem {
    // Extract or determine year from item or title
    const year = item.year || this.extractYearFromTitle(item.title) || new Date().getFullYear();
    
    return {
      guid: item.guid || `${mediaType}-${Date.now()}`,
      indexerId: item.indexer || '', // Map indexer to indexerId 
      title: item.title, // Keep original title from Prowlarr
      size: item.size,
      protocol: 'torrent', // Default to torrent
      seeders: item.seeders,
      leechers: item.leechers,
      quality: item.quality,
      publishDate: new Date().toISOString(), // Default value
      infoUrl: item.infoUrl || '',
      downloadUrl: item.downloadUrl || '',
      mediaType: mediaType,
      
      // TMDb enrichment data (placeholders)
      tmdbInfo: {
        tmdbId: 0, // Default ID
        title: item.title,
        overview: '',
        posterPath: undefined, 
        backdropPath: undefined,
        voteAverage: 0,
        year: year,
        genreIds: [],
        runtime: 0
      },
      
      // Display fields
      displayTitle: item.title,
      displayOverview: '',
      displayYear: year,
      displayRating: 0,
      displayGenres: [],
      
      // Full paths for UI
      fullPosterPath: '/api/placeholder/500/750',
      fullBackdropPath: '/api/placeholder/1920/1080',
      
      // State flags
      inLibrary: false,
      isDownloading: false
    };
  }

  /**
   * Normalize a title for search purposes
   * @param title Title to normalize
   * @returns Normalized title
   */
  /**
   * Clean a title for search purposes
   * @param title Title to clean
   * @returns Cleaned title
   */
  private static normalizeTitle(title: string): string {
    // Remove special characters and common words that might affect search
    let cleanTitle = title
      .toLowerCase()
      .replace(/\[.*?\]|\(.*?\)|[^\w\s]/g, '') // Remove brackets, parentheses, non-alphanumeric
      .replace(/\s+/g, ' ')      // Normalize whitespace
      .trim();
    
    // Remove common words and abbreviations that might affect search
    const wordsToRemove = [
      'dvdrip', 'bdrip', 'brrip', 'bluray', 'webrip', 'web-dl', 'web',
      'hdtv', 'hdrip', 'xvid', 'divx', 'x264', 'x265', 'h264', 'h265',
      '720p', '1080p', '2160p', '4k', 'uhd', 'hd', 'sd'
    ];
    
    wordsToRemove.forEach(word => {
      const regex = new RegExp(`\b${word}\b`, 'gi');
      cleanTitle = cleanTitle.replace(regex, '');
    });
    
    // Final clean-up
    return cleanTitle.trim();
  }
  
  /**
   * Find the best matching result from TMDb search results
   * @param results TMDb search results
   * @param originalTitle Original title to match against
   * @returns Best matching result
   */
  private static findBestMatch(results: TMDbResult[], originalTitle: string): TMDbResult {
    if (results.length === 1) {
      return results[0];
    }
    
    // Calculate similarity scores
    const scores = results.map(result => {
      const title = result.title || result.name || '';
      return {
        result,
        score: this.calculateSimilarity(originalTitle.toLowerCase(), title.toLowerCase())
      };
    });
    
    // Sort by similarity score (descending)
    scores.sort((a, b) => b.score - a.score);
    
    // Return the result with the highest score
    return scores[0].result;
  }
  
  /**
   * Calculate similarity between two strings
   * A simple implementation of Levenshtein distance-based similarity
   * @param str1 First string
   * @param str2 Second string
   * @returns Similarity score (0-1)
   */
  private static calculateSimilarity(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;
    
    // If either string is empty, return 0
    if (len1 === 0 || len2 === 0) {
      return 0;
    }
    
    // Calculate Levenshtein distance
    const distance = this.levenshteinDistance(str1, str2);
    
    // Convert distance to similarity score (0-1)
    return 1 - (distance / Math.max(len1, len2));
  }
  
  /**
   * Calculate Levenshtein distance between two strings
   * @param str1 First string
   * @param str2 Second string
   * @returns Levenshtein distance
   */
  private static levenshteinDistance(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;
    
    // Create a matrix of size (len1+1) x (len2+1)
    const matrix: number[][] = [];
    
    // Initialize the matrix
    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }
    
    // Fill the matrix
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i-1] === str2[j-1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i-1][j] + 1,      // deletion
          matrix[i][j-1] + 1,      // insertion
          matrix[i-1][j-1] + cost  // substitution
        );
      }
    }
    
    // Return the distance
    return matrix[len1][len2];
  }
  
  /**
   * Extract the year from a title string (e.g., "Movie Title 2020")
   * @param title Title string to extract year from
   * @returns Extracted year or undefined if not found
   */
  private static extractYearFromTitle(title: string): number | undefined {
    const yearMatch = title.match(/\b(19|20)\d{2}\b/);
    if (yearMatch && yearMatch[0]) {
      return parseInt(yearMatch[0]);
    }
    return undefined;
  }
}
