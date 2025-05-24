import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../../../../../app/api/add/series/route';
import { SonarrClient } from '../../../../../lib/api/sonarr-client';
import { TMDbClient } from '../../../../../lib/api/tmdb-client';

// Mock the API clients
vi.mock('../../../../../lib/api/sonarr-client');
vi.mock('../../../../../lib/api/tmdb-client');

describe('/api/add/series route', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should add a series to Sonarr and return success response', async () => {
    // Mock TMDb TV show details
    const mockTMDbDetails = {
      id: 123,
      name: 'Test Series',
      releaseDate: '2023-01-01',
      year: 2023,
      posterPath: 'https://image.tmdb.org/t/p/w500/test-poster.jpg',
      backdropPath: 'https://image.tmdb.org/t/p/original/test-backdrop.jpg',
      voteAverage: 8.5,
      genres: [
        { id: 28, name: 'Action' },
        { id: 12, name: 'Adventure' },
      ],
      overview: 'This is a test series',
    };
    
    (TMDbClient.prototype.getTvShowDetails as any) = vi.fn().mockResolvedValue(mockTMDbDetails);
    
    // Mock Sonarr add series response
    const mockSonarrResponse = {
      id: 456,
      title: 'Test Series',
      tvdbId: 123,
      year: 2023,
    };
    
    (SonarrClient.prototype.addSeries as any) = vi.fn().mockResolvedValue(mockSonarrResponse);
    
    // Create a mock request with required data
    const request = new Request('http://localhost:3000/api/add/series', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tmdbId: 123,
      }),
    });
    
    // Call the API route handler
    const response = await POST(request);
    const data = await response.json();
    
    // Verify API clients were called
    expect(TMDbClient.prototype.getTvShowDetails).toHaveBeenCalledWith(123);
    expect(SonarrClient.prototype.addSeries).toHaveBeenCalledWith({
      tvdbId: 123,
      title: 'Test Series',
      year: 2023,
      qualityProfileId: expect.any(Number),
      rootFolderPath: expect.any(String),
      seasonFolder: true,
      monitored: true,
      addOptions: {
        ignoreEpisodesWithFiles: false,
        ignoreEpisodesWithoutFiles: false,
        searchForMissingEpisodes: true,
      },
    });
    
    // Assert response is success
    expect(response.status).toBe(200);
    expect(data).toEqual({
      success: true,
      message: 'Series added to Sonarr successfully',
      series: mockSonarrResponse,
    });
  });
  
  it('should return 400 if tmdbId is missing', async () => {
    // Create a mock request with missing tmdbId
    const request = new Request('http://localhost:3000/api/add/series', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });
    
    // Call the API route handler
    const response = await POST(request);
    const data = await response.json();
    
    // Assert response is error
    expect(response.status).toBe(400);
    expect(data).toEqual({
      error: 'TMDb ID is required',
    });
  });
  
  it('should handle errors from TMDb API', async () => {
    // Mock TMDb to throw an error
    (TMDbClient.prototype.getTvShowDetails as any) = vi.fn().mockRejectedValue(
      new Error('Failed to fetch TV show details from TMDb')
    );
    
    // Create a mock request
    const request = new Request('http://localhost:3000/api/add/series', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tmdbId: 123,
      }),
    });
    
    // Call the API route handler
    const response = await POST(request);
    const data = await response.json();
    
    // Assert response is error
    expect(response.status).toBe(500);
    expect(data).toEqual({
      error: 'Failed to fetch TV show details from TMDb',
    });
  });
  
  it('should handle errors from Sonarr API', async () => {
    // Mock TMDb TV show details
    const mockTMDbDetails = {
      id: 123,
      name: 'Test Series',
      releaseDate: '2023-01-01',
      year: 2023,
      posterPath: 'https://image.tmdb.org/t/p/w500/test-poster.jpg',
      backdropPath: 'https://image.tmdb.org/t/p/original/test-backdrop.jpg',
      voteAverage: 8.5,
      genres: [
        { id: 28, name: 'Action' },
        { id: 12, name: 'Adventure' },
      ],
      overview: 'This is a test series',
    };
    
    (TMDbClient.prototype.getTvShowDetails as any) = vi.fn().mockResolvedValue(mockTMDbDetails);
    
    // Mock Sonarr to throw an error
    (SonarrClient.prototype.addSeries as any) = vi.fn().mockRejectedValue(
      new Error('Failed to add series to Sonarr')
    );
    
    // Create a mock request
    const request = new Request('http://localhost:3000/api/add/series', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tmdbId: 123,
      }),
    });
    
    // Call the API route handler
    const response = await POST(request);
    const data = await response.json();
    
    // Assert response is error
    expect(response.status).toBe(500);
    expect(data).toEqual({
      error: 'Failed to add series to Sonarr',
    });
  });
});
