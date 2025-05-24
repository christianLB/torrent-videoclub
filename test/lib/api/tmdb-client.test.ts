import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TMDbClient } from '../../../lib/api/tmdb-client';

describe('TMDbClient', () => {
  const mockApiKey = 'test-api-key';
  let tmdbClient: TMDbClient;
  
  // Mock global fetch
  global.fetch = vi.fn();
  
  beforeEach(() => {
    vi.resetAllMocks();
    tmdbClient = new TMDbClient(mockApiKey);
  });

  describe('constructor', () => {
    it('should set apiKey correctly', () => {
      expect(tmdbClient['apiKey']).toBe(mockApiKey);
    });
  });
  
  describe('searchMovies', () => {
    it('should call fetch with correct parameters', async () => {
      // Mock response
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          results: [
            {
              id: 123,
              title: 'Test Movie',
              release_date: '2023-01-01',
              poster_path: '/test-poster.jpg',
              backdrop_path: '/test-backdrop.jpg',
              vote_average: 8.5,
              genre_ids: [28, 12],
              overview: 'This is a test movie',
            }
          ]
        }),
      };
      
      (global.fetch as any).mockResolvedValue(mockResponse);
      
      // Call method
      await tmdbClient.searchMovies('Test Movie');
      
      // Assert fetch was called with correct parameters
      expect(global.fetch).toHaveBeenCalledWith(
        `https://api.themoviedb.org/3/search/movie?api_key=${mockApiKey}&query=Test%20Movie&include_adult=false&language=en-US`,
        { method: 'GET' }
      );
    });
    
    it('should return normalized movie results', async () => {
      // Mock response
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          results: [
            {
              id: 123,
              title: 'Test Movie',
              release_date: '2023-01-01',
              poster_path: '/test-poster.jpg',
              backdrop_path: '/test-backdrop.jpg',
              vote_average: 8.5,
              genre_ids: [28, 12],
              overview: 'This is a test movie',
            }
          ]
        }),
      };
      
      (global.fetch as any).mockResolvedValue(mockResponse);
      
      // Call method
      const results = await tmdbClient.searchMovies('Test Movie');
      
      // Assert results are normalized
      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        id: 123,
        title: 'Test Movie',
        releaseDate: '2023-01-01',
        year: 2023,
        posterPath: 'https://image.tmdb.org/t/p/w500/test-poster.jpg',
        backdropPath: 'https://image.tmdb.org/t/p/original/test-backdrop.jpg',
        voteAverage: 8.5,
        genreIds: [28, 12],
        overview: 'This is a test movie',
      });
    });
    
    it('should throw an error when fetch fails', async () => {
      // Mock failed response
      const mockResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      };
      
      (global.fetch as any).mockResolvedValue(mockResponse);
      
      // Assert method throws error
      await expect(tmdbClient.searchMovies('Test Movie')).rejects.toThrow(
        'Failed to fetch data from TMDb: 500 Internal Server Error'
      );
    });
  });
  
  describe('getMovieDetails', () => {
    it('should call fetch with correct parameters', async () => {
      // Mock response
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          id: 123,
          title: 'Test Movie',
          release_date: '2023-01-01',
          poster_path: '/test-poster.jpg',
          backdrop_path: '/test-backdrop.jpg',
          vote_average: 8.5,
          genres: [
            { id: 28, name: 'Action' },
            { id: 12, name: 'Adventure' },
          ],
          overview: 'This is a test movie',
        }),
      };
      
      (global.fetch as any).mockResolvedValue(mockResponse);
      
      // Call method
      await tmdbClient.getMovieDetails(123);
      
      // Assert fetch was called with correct parameters
      expect(global.fetch).toHaveBeenCalledWith(
        `https://api.themoviedb.org/3/movie/123?api_key=${mockApiKey}&language=en-US`,
        { method: 'GET' }
      );
    });
    
    it('should return normalized movie details', async () => {
      // Mock response
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          id: 123,
          title: 'Test Movie',
          release_date: '2023-01-01',
          poster_path: '/test-poster.jpg',
          backdrop_path: '/test-backdrop.jpg',
          vote_average: 8.5,
          genres: [
            { id: 28, name: 'Action' },
            { id: 12, name: 'Adventure' },
          ],
          overview: 'This is a test movie',
        }),
      };
      
      (global.fetch as any).mockResolvedValue(mockResponse);
      
      // Call method
      const result = await tmdbClient.getMovieDetails(123);
      
      // Assert results are normalized
      expect(result).toEqual({
        id: 123,
        title: 'Test Movie',
        releaseDate: '2023-01-01',
        year: 2023,
        posterPath: 'https://image.tmdb.org/t/p/w500/test-poster.jpg',
        backdropPath: 'https://image.tmdb.org/t/p/original/test-backdrop.jpg',
        voteAverage: 8.5,
        genres: [
          { id: 28, name: 'Action' },
          { id: 12, name: 'Adventure' },
        ],
        overview: 'This is a test movie',
      });
    });
  });
});
