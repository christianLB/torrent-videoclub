/**
 * Metadata Enrichment Service
 * 
 * This service is responsible for enriching content items with metadata from TMDb.
 * It uses the TMDb API client to search for and retrieve detailed information about
 * movies and TV shows.
 */

import { EnhancedMediaItem } from '../types/featured';
import { TMDbClient, TMDbSearchResult, TMDbMovieDetails, TMDbTvShowDetails } from '../api/tmdb-client';
import { NormalizedMovieResult } from '../api/prowlarr-client';

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
  static async enrichMovie(item: NormalizedMovieResult): Promise<EnhancedMediaItem> {
    if (!this.enabled || !this.tmdbClient) {
      return this.createBasicEnhancedItem(item);
    }
    
    try {
      // Search for the movie on TMDb
      const query = this.cleanTitleForSearch(item.title);
      const year = item.year ? item.year.toString() : undefined;
      
      // TMDb client expects just the query string, we'll filter by year after
      const searchResults = await this.tmdbClient.searchMovies(query);
      
      // Filter by year if provided
      const filteredResults = year 
        ? searchResults.filter(result => result.year?.toString() === year)
        : searchResults;
      
      const resultsToUse = filteredResults.length > 0 ? filteredResults : searchResults;
      
      // If we found a match, get the movie details
      if (resultsToUse && resultsToUse.length > 0) {
        const bestMatch = this.findBestMatch(resultsToUse, item.title);
        const movieDetails = await this.tmdbClient.getMovieDetails(bestMatch.id);
        
        // Extract year from release date if available
        const year = movieDetails?.releaseDate 
          ? parseInt(movieDetails.releaseDate.substring(0, 4), 10) 
          : (item.year || new Date().getFullYear());

        // Create the enhanced item with TMDb metadata
        return {
          id: item.guid || `movie-${Date.now()}`,
          title: movieDetails?.title || bestMatch.title || item.title,
          overview: movieDetails?.overview || bestMatch.overview || item.title,
          backdropPath: movieDetails?.backdropPath || bestMatch.backdropPath || '/api/placeholder/1920/1080',
          posterPath: movieDetails?.posterPath || bestMatch.posterPath || '/api/placeholder/500/750',
          mediaType: 'movie',
          rating: movieDetails?.voteAverage || bestMatch.voteAverage || 0,
          year,
          genres: movieDetails?.genres?.map((g: { name: string }) => g.name) || [],
          runtime: movieDetails?.runtime || 0,
          inLibrary: false,
          downloading: false,
          tmdbAvailable: true,
          tmdbId: bestMatch.id,
          tmdb: {
            id: bestMatch.id,
            title: movieDetails?.title || bestMatch.title,
            releaseDate: movieDetails?.releaseDate || bestMatch.releaseDate,
            year,
            posterPath: movieDetails?.posterPath || bestMatch.posterPath,
            backdropPath: movieDetails?.backdropPath || bestMatch.backdropPath,
            voteAverage: movieDetails?.voteAverage || bestMatch.voteAverage,
            genreIds: movieDetails?.genres 
              ? movieDetails.genres.map((g: { id: number }) => g.id) 
              : bestMatch.genreIds,
            overview: movieDetails?.overview || ''
          }
        };
      }
      
      // If no match was found, return a basic enhanced item
      return this.createBasicEnhancedItem(item);
    } catch (error) {
      console.error('Error enriching movie with TMDb metadata:', error);
      return this.createBasicEnhancedItem(item);
    }
  }
  
  /**
   * Enrich a TV series result with TMDb metadata
   * @param item TV series result to enrich
   * @returns Enriched media item with TMDb metadata
   */
  static async enrichTVSeries(item: NormalizedMovieResult): Promise<EnhancedMediaItem> {
    if (!this.enabled || !this.tmdbClient) {
      return this.createBasicEnhancedItem(item);
    }
    
    try {
      // Search for the TV series on TMDb
      const query = this.cleanTitleForSearch(item.title);
      
      const searchResults = await this.tmdbClient.searchTvShows(query);
      
      // If we found a match, get the TV series details
      if (searchResults && searchResults.length > 0) {
        const bestMatch = this.findBestMatch(searchResults, item.title);
        const tvDetails = await this.tmdbClient.getTvShowDetails(bestMatch.id);
        
        // Extract year from first air date if available
        const year = tvDetails?.firstAirDate 
          ? parseInt(tvDetails.firstAirDate.substring(0, 4), 10) 
          : (item.year || new Date().getFullYear());

        // Create the enhanced item with TMDb metadata
        return {
          id: item.guid || `tv-${Date.now()}`,
          title: tvDetails?.name || bestMatch.name || item.title,
          overview: tvDetails?.overview || bestMatch.overview || item.title,
          backdropPath: tvDetails?.backdropPath || bestMatch.backdropPath || '/api/placeholder/1920/1080',
          posterPath: tvDetails?.posterPath || bestMatch.posterPath || '/api/placeholder/500/750',
          mediaType: 'tv',
          rating: tvDetails?.voteAverage || bestMatch.voteAverage || 0,
          year,
          genres: tvDetails?.genres?.map((g: { name: string }) => g.name) || [],
          seasons: tvDetails?.number_of_seasons || 1,
          inLibrary: false,
          downloading: false,
          tmdbAvailable: true,
          tmdbId: bestMatch.id,
          tmdb: {
            id: bestMatch.id,
            title: tvDetails?.name || bestMatch.name,
            releaseDate: tvDetails?.firstAirDate || bestMatch.firstAirDate,
            year,
            posterPath: tvDetails?.posterPath || bestMatch.posterPath,
            backdropPath: tvDetails?.backdropPath || bestMatch.backdropPath,
            voteAverage: tvDetails?.voteAverage || bestMatch.voteAverage,
            genreIds: tvDetails?.genres 
              ? tvDetails.genres.map((g: { id: number }) => g.id) 
              : bestMatch.genreIds,
            overview: tvDetails?.overview || ''
          }
        };
      }
      
      // If no match was found, return a basic enhanced item
      return this.createBasicEnhancedItem(item);
    } catch (error) {
      console.error('Error enriching TV series with TMDb metadata:', error);
      return this.createBasicEnhancedItem(item);
    }
  }
  
  /**
   * Create a basic enhanced media item without TMDb metadata
   * @param item Base item to enhance
   * @returns Basic enhanced media item
   */
  private static createBasicEnhancedItem(item: NormalizedMovieResult): EnhancedMediaItem {
    return {
      id: item.guid || `movie-${Date.now()}`,
      title: item.title,
      overview: item.title, // Use title as fallback overview
      backdropPath: '/api/placeholder/1920/1080', // Placeholder path
      posterPath: '/api/placeholder/500/750', // Placeholder path
      mediaType: 'movie', // Default to movie
      rating: 0,
      year: item.year || new Date().getFullYear(),
      genres: [],
      inLibrary: false,
      downloading: false,
      tmdbAvailable: false
    };
  }
  
  /**
   * Clean a title for search purposes
   * @param title Title to clean
   * @returns Cleaned title
   */
  private static cleanTitleForSearch(title: string): string {
    // Remove special characters and common words that might affect search
    let cleanTitle = title
      .replace(/[^\w\s]/g, ' ')  // Replace special chars with spaces
      .replace(/\s+/g, ' ')      // Replace multiple spaces with single space
      .trim();
      
    // Remove common words and abbreviations that might affect search
    const wordsToRemove = [
      'dvdrip', 'bdrip', 'brrip', 'bluray', 'webrip', 'web-dl', 'web',
      'hdtv', 'hdrip', 'xvid', 'divx', 'x264', 'x265', 'h264', 'h265',
      '720p', '1080p', '2160p', '4k', 'uhd', 'hd', 'sd'
    ];
    
    wordsToRemove.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
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
  private static findBestMatch(results: any[], originalTitle: string): any {
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
}
