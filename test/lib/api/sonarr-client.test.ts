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

  describe('getLibraryTmdbIds', () => {
    it('should call fetch with correct parameters and return TMDB IDs on success', async () => {
      const mockSeriesResponse: any[] = [
        { id: 1, title: 'Series 1', tmdbId: 201, year: 2020 },
        { id: 2, title: 'Series 2', tmdbId: 202, year: 2021 },
      ];
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockSeriesResponse),
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      const result = await sonarrClient.getLibraryTmdbIds();

      expect(global.fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/api/v3/series`,
        {
          method: 'GET',
          headers: {
            'X-Api-Key': mockApiKey,
            'Content-Type': 'application/json',
          },
        }
      );
      expect(result).toEqual([201, 202]);
    });

    it('should return an empty array when the library is empty', async () => {
      const mockSeriesResponse: any[] = [];
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockSeriesResponse),
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      const result = await sonarrClient.getLibraryTmdbIds();

      expect(result).toEqual([]);
    });

    it('should filter out items with invalid or missing tmdbId', async () => {
      const mockSeriesResponse: any[] = [
        { id: 1, title: 'Series 1', tmdbId: 201, year: 2020 },
        { id: 2, title: 'Series 2', tmdbId: null, year: 2021 }, // Invalid tmdbId
        { id: 3, title: 'Series 3', year: 2022 }, // Missing tmdbId
        { id: 4, title: 'Series 4', tmdbId: 204, year: 2023 },
        { id: 5, title: 'Series 5', tmdbId: 'not-a-number', year: 2024 }, // Invalid tmdbId
      ];
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockSeriesResponse),
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      const result = await sonarrClient.getLibraryTmdbIds();

      expect(result).toEqual([201, 204]);
    });

    it('should throw an error when fetch fails', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: vi.fn().mockResolvedValue('Sonarr internal error'),
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      await expect(sonarrClient.getLibraryTmdbIds()).rejects.toThrow(
        'Failed to get series from Sonarr: 500 Internal Server Error - Sonarr internal error'
      );
    });

    it('should throw an error when fetch fails and response text cannot be read', async () => {
      const mockResponse = {
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        text: vi.fn().mockRejectedValue(new Error('Failed to read text')),
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      await expect(sonarrClient.getLibraryTmdbIds()).rejects.toThrow(
        'Failed to get series from Sonarr: 403 Forbidden '
      );
    });
  });
});
