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
});
