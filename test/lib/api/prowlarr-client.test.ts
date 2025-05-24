import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProwlarrClient } from '../../../lib/api/prowlarr-client';

describe('ProwlarrClient', () => {
  const mockBaseUrl = 'http://localhost:9696';
  const mockApiKey = 'test-api-key';
  let prowlarrClient: ProwlarrClient;
  
  // Mock global fetch
  global.fetch = vi.fn();
  
  beforeEach(() => {
    vi.resetAllMocks();
    prowlarrClient = new ProwlarrClient(mockBaseUrl, mockApiKey);
  });

  describe('constructor', () => {
    it('should set baseUrl and apiKey correctly', () => {
      expect(prowlarrClient['baseUrl']).toBe(mockBaseUrl);
      expect(prowlarrClient['apiKey']).toBe(mockApiKey);
    });
  });
  
  describe('searchMovies', () => {
    it('should call fetch with correct parameters', async () => {
      // Mock response
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue([
          {
            guid: 'test-guid',
            title: 'Test Movie',
            year: 2023,
            indexer: 'test-indexer',
            size: 1000000000,
            seeders: 10,
            leechers: 5,
            quality: '1080p',
          }
        ]),
      };
      
      (global.fetch as any).mockResolvedValue(mockResponse);
      
      // Call method
      await prowlarrClient.searchMovies('Test Movie');
      
      // Assert fetch was called with correct parameters
      expect(global.fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/api/v1/search?query=Test%20Movie&categories=2000,2010,2020,2030,2040,2045,2050,2060&limit=100`,
        {
          method: 'GET',
          headers: {
            'X-Api-Key': mockApiKey,
            'Content-Type': 'application/json',
          },
        }
      );
    });
    
    it('should return normalized movie results', async () => {
      // Mock response
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue([
          {
            guid: 'test-guid',
            title: 'Test.Movie.2023.1080p.BluRay.x264',
            indexer: 'test-indexer',
            size: 1000000000,
            seeders: 10,
            leechers: 5,
          }
        ]),
      };
      
      (global.fetch as any).mockResolvedValue(mockResponse);
      
      // Call method
      const results = await prowlarrClient.searchMovies('Test Movie');
      
      // Assert results are normalized
      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        guid: 'test-guid',
        title: 'Test Movie',
        year: 2023,
        quality: '1080p',
        format: 'BluRay',
        codec: 'x264',
        size: 1000000000,
        sizeFormatted: '0.93 GB',
        indexer: 'test-indexer',
        seeders: 10,
        leechers: 5,
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
      await expect(prowlarrClient.searchMovies('Test Movie')).rejects.toThrow(
        'Failed to fetch data from Prowlarr: 500 Internal Server Error'
      );
    });
  });
});
