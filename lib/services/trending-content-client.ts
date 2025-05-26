/**
 * Trending Content Client
 * 
 * A mock client for fetching trending content data
 */
import { FeaturedItem } from '../types/featured';

export interface TrendingOptions {
  limit?: number;
  minSeeders?: number;
  minQuality?: string;
  daysOld?: number;
}

export class TrendingContentClient {
  private apiUrl: string;
  private apiKey: string;

  constructor(apiUrl: string, apiKey: string) {
    this.apiUrl = apiUrl;
    this.apiKey = apiKey;
  }

  async getTrendingMovies(options: TrendingOptions = {}): Promise<FeaturedItem[]> {
    // Mock implementation
    const movies: FeaturedItem[] = [
      {
        id: 'trending-1',
        title: 'Dune: Part Two',
        overview: 'Paul Atreides unites with Chani and the Fremen while seeking revenge.',
        backdropPath: '/api/placeholder/1920/1080',
        posterPath: '/api/placeholder/500/750',
        mediaType: 'movie',
        rating: 8.5,
        year: 2024,
        genres: ['Science Fiction', 'Adventure'],
        runtime: 166,
        inLibrary: false,
        downloading: false,
        tmdbAvailable: true
      }
    ];
    
    return movies.slice(0, options.limit || 10);
  }

  async getPopularTV(options: TrendingOptions = {}): Promise<FeaturedItem[]> {
    // Mock implementation
    const shows: FeaturedItem[] = [
      {
        id: 'popular-tv-1',
        title: 'The Last of Us',
        overview: 'Twenty years after modern civilization has been destroyed.',
        backdropPath: '/api/placeholder/1920/1080',
        posterPath: '/api/placeholder/500/750',
        mediaType: 'tv',
        rating: 8.7,
        year: 2023,
        genres: ['Drama', 'Action'],
        seasons: 1,
        inLibrary: false,
        downloading: false,
        tmdbAvailable: true
      }
    ];
    
    return shows.slice(0, options.limit || 10);
  }

  async getNewReleases(options: TrendingOptions = {}): Promise<FeaturedItem[]> {
    // Mock implementation - returns recent movies
    return this.getTrendingMovies(options);
  }

  async get4KContent(options: TrendingOptions = {}): Promise<FeaturedItem[]> {
    // Mock implementation - returns 4K movies
    return this.getTrendingMovies(options);
  }

  async getDocumentaries(options: TrendingOptions = {}): Promise<FeaturedItem[]> {
    // Mock implementation
    const docs: FeaturedItem[] = [
      {
        id: 'doc-1',
        title: 'Planet Earth III',
        overview: 'Discover amazing landscapes and fascinating animals.',
        backdropPath: '/api/placeholder/1920/1080',
        posterPath: '/api/placeholder/500/750',
        mediaType: 'movie',
        rating: 9.0,
        year: 2023,
        genres: ['Documentary'],
        runtime: 300,
        inLibrary: false,
        downloading: false,
        tmdbAvailable: true
      }
    ];
    
    return docs.slice(0, options.limit || 10);
  }
}
