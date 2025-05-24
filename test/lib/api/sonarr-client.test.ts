import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SonarrClient } from '../../../lib/api/sonarr-client';

describe('SonarrClient', () => {
  const mockBaseUrl = 'http://localhost:8989';
  const mockApiKey = 'test-api-key';
  let sonarrClient: SonarrClient;
  
  // Mock global fetch
  global.fetch = vi.fn();
  
  beforeEach(() => {
    vi.resetAllMocks();
    sonarrClient = new SonarrClient(mockBaseUrl, mockApiKey);
  });

  describe('constructor', () => {
    it('should set baseUrl and apiKey correctly', () => {
      expect(sonarrClient['baseUrl']).toBe(mockBaseUrl);
      expect(sonarrClient['apiKey']).toBe(mockApiKey);
    });
  });
  
  describe('addSeries', () => {
    it('should call fetch with correct parameters', async () => {
      // Mock series data
      const seriesData = {
        tvdbId: 123,
        title: 'Test Series',
        year: 2023,
        qualityProfileId: 1,
        rootFolderPath: '/tv',
        seasonFolder: true,
        monitored: true,
        addOptions: {
          ignoreEpisodesWithFiles: false,
          ignoreEpisodesWithoutFiles: false,
          searchForMissingEpisodes: true,
        },
      };
      
      // Mock response
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          id: 456,
          title: 'Test Series',
          tvdbId: 123,
          year: 2023,
        }),
      };
      
      (global.fetch as any).mockResolvedValue(mockResponse);
      
      // Call method
      await sonarrClient.addSeries(seriesData);
      
      // Assert fetch was called with correct parameters
      expect(global.fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/api/v3/series`,
        {
          method: 'POST',
          headers: {
            'X-Api-Key': mockApiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(seriesData),
        }
      );
    });
    
    it('should return the added series data', async () => {
      // Mock series data
      const seriesData = {
        tvdbId: 123,
        title: 'Test Series',
        year: 2023,
        qualityProfileId: 1,
        rootFolderPath: '/tv',
        seasonFolder: true,
        monitored: true,
        addOptions: {
          ignoreEpisodesWithFiles: false,
          ignoreEpisodesWithoutFiles: false,
          searchForMissingEpisodes: true,
        },
      };
      
      // Mock response
      const mockResponseData = {
        id: 456,
        title: 'Test Series',
        tvdbId: 123,
        year: 2023,
      };
      
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponseData),
      };
      
      (global.fetch as any).mockResolvedValue(mockResponse);
      
      // Call method
      const result = await sonarrClient.addSeries(seriesData);
      
      // Assert result matches the mock response
      expect(result).toEqual(mockResponseData);
    });
    
    it('should throw an error when fetch fails', async () => {
      // Mock series data
      const seriesData = {
        tvdbId: 123,
        title: 'Test Series',
        year: 2023,
        qualityProfileId: 1,
        rootFolderPath: '/tv',
        seasonFolder: true,
        monitored: true,
        addOptions: {
          ignoreEpisodesWithFiles: false,
          ignoreEpisodesWithoutFiles: false,
          searchForMissingEpisodes: true,
        },
      };
      
      // Mock failed response
      const mockResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      };
      
      (global.fetch as any).mockResolvedValue(mockResponse);
      
      // Assert method throws error
      await expect(sonarrClient.addSeries(seriesData)).rejects.toThrow(
        'Failed to add series to Sonarr: 500 Internal Server Error'
      );
    });
  });
});
