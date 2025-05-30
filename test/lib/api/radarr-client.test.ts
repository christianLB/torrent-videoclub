import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RadarrClient } from '../../../lib/api/radarr-client';

describe('RadarrClient', () => {
  const mockBaseUrl = 'http://localhost:7878';
  const mockApiKey = 'test-api-key';
  let radarrClient: RadarrClient;
  
  // Mock global fetch
  global.fetch = vi.fn();
  
  beforeEach(() => {
    vi.resetAllMocks();
    radarrClient = new RadarrClient(mockBaseUrl, mockApiKey);
  });

  describe('constructor', () => {
    it('should set baseUrl and apiKey correctly', () => {
      expect(radarrClient['baseUrl']).toBe(mockBaseUrl);
      expect(radarrClient['apiKey']).toBe(mockApiKey);
    });
  });
  
  describe('addMovie', () => {
    it('should call fetch with correct parameters', async () => {
      // Mock movie data
      const movieData = {
        tmdbId: 123,
        title: 'Test Movie',
        year: 2023,
        qualityProfileId: 1,
        rootFolderPath: '/movies',
        minimumAvailability: 'released',
        monitored: true,
      };
      
      // Mock response
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          id: 456,
          title: 'Test Movie',
          tmdbId: 123,
          year: 2023,
        }),
      };
      
      (global.fetch as any).mockResolvedValue(mockResponse);
      
      // Call method
      await radarrClient.addMovie(movieData);
      
      // Assert fetch was called with correct parameters
      expect(global.fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/api/v3/movie`,
        {
          method: 'POST',
          headers: {
            'X-Api-Key': mockApiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(movieData),
        }
      );
    });
    
    it('should return the added movie data', async () => {
      // Mock movie data
      const movieData = {
        tmdbId: 123,
        title: 'Test Movie',
        year: 2023,
        qualityProfileId: 1,
        rootFolderPath: '/movies',
        minimumAvailability: 'released',
        monitored: true,
      };
      
      // Mock response
      const mockResponseData = {
        id: 456,
        title: 'Test Movie',
        tmdbId: 123,
        year: 2023,
      };
      
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponseData),
      };
      
      (global.fetch as any).mockResolvedValue(mockResponse);
      
      // Call method
      const result = await radarrClient.addMovie(movieData);
      
      // Assert result matches the mock response
      expect(result).toEqual(mockResponseData);
    });
    
    it('should throw an error when fetch fails', async () => {
      // Mock movie data
      const movieData = {
        tmdbId: 123,
        title: 'Test Movie',
        year: 2023,
        qualityProfileId: 1,
        rootFolderPath: '/movies',
        minimumAvailability: 'released',
        monitored: true,
      };
      
      // Mock failed response
      const mockResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      };
      
      (global.fetch as any).mockResolvedValue(mockResponse);
      
      // Assert method throws error
      await expect(radarrClient.addMovie(movieData)).rejects.toThrow(
        'Failed to add movie to Radarr: 500 Internal Server Error'
      );
    });
  });

  describe('getLibraryTmdbIds', () => {
    it('should call fetch with correct parameters and return TMDB IDs on success', async () => {
      const mockMoviesResponse: any[] = [
        { id: 1, title: 'Movie 1', tmdbId: 101, year: 2020 },
        { id: 2, title: 'Movie 2', tmdbId: 102, year: 2021 },
      ];
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockMoviesResponse),
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      const result = await radarrClient.getLibraryTmdbIds();

      expect(global.fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/api/v3/movie`,
        {
          method: 'GET',
          headers: {
            'X-Api-Key': mockApiKey,
            'Content-Type': 'application/json',
          },
        }
      );
      expect(result).toEqual([101, 102]);
    });

    it('should return an empty array when the library is empty', async () => {
      const mockMoviesResponse: any[] = [];
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockMoviesResponse),
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      const result = await radarrClient.getLibraryTmdbIds();

      expect(result).toEqual([]);
    });

    it('should filter out items with invalid or missing tmdbId', async () => {
      const mockMoviesResponse: any[] = [
        { id: 1, title: 'Movie 1', tmdbId: 101, year: 2020 },
        { id: 2, title: 'Movie 2', tmdbId: null, year: 2021 }, // Invalid tmdbId
        { id: 3, title: 'Movie 3', year: 2022 }, // Missing tmdbId
        { id: 4, title: 'Movie 4', tmdbId: 104, year: 2023 },
        { id: 5, title: 'Movie 5', tmdbId: 'not-a-number', year: 2024 }, // Invalid tmdbId
      ];
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockMoviesResponse),
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      const result = await radarrClient.getLibraryTmdbIds();

      expect(result).toEqual([101, 104]);
    });

    it('should throw an error when fetch fails', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: vi.fn().mockResolvedValue('Radarr internal error'),
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      await expect(radarrClient.getLibraryTmdbIds()).rejects.toThrow(
        'Failed to get movies from Radarr: 500 Internal Server Error - Radarr internal error'
      );
    });

    it('should throw an error when fetch fails and response text cannot be read', async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: vi.fn().mockRejectedValue(new Error('Failed to read text')),
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      await expect(radarrClient.getLibraryTmdbIds()).rejects.toThrow(
        'Failed to get movies from Radarr: 401 Unauthorized '
      );
    });
  });
});
