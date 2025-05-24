import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../../../../app/api/series/route';
import { ProwlarrClient } from '../../../../lib/api/prowlarr-client';
import { TMDbClient } from '../../../../lib/api/tmdb-client';

// Mock the API clients
vi.mock('../../../../lib/api/prowlarr-client');
vi.mock('../../../../lib/api/tmdb-client');

describe('/api/series route', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should return series with enriched metadata', async () => {
    // Mock ProwlarrClient implementation
    const mockProwlarrSeries = [
      {
        guid: 'test-guid-1',
        title: 'Test Series',
        year: 2023,
        quality: '1080p',
        format: 'WEBDL',
        codec: 'x264',
        size: 2000000000,
        sizeFormatted: '1.86 GB',
        indexer: 'test-indexer',
        seeders: 15,
        leechers: 3,
      }
    ];
    
    (ProwlarrClient.prototype.searchSeries as any) = vi.fn().mockResolvedValue(mockProwlarrSeries);
    
    // Mock TMDbClient implementation
    const mockTMDbSeries = [
      {
        id: 123,
        title: 'Test Series',
        releaseDate: '2023-01-01',
        year: 2023,
        posterPath: 'https://image.tmdb.org/t/p/w500/test-poster.jpg',
        backdropPath: 'https://image.tmdb.org/t/p/original/test-backdrop.jpg',
        voteAverage: 8.5,
        genreIds: [28, 12],
        overview: 'This is a test series',
      }
    ];
    
    (TMDbClient.prototype.searchTvShows as any) = vi.fn().mockResolvedValue(mockTMDbSeries);
    
    // Create a mock request with search parameters
    const request = new Request('http://localhost:3000/api/series?query=test');
    
    // Call the API route handler
    const response = await GET(request);
    const data = await response.json();
    
    // Verify API clients were called
    expect(ProwlarrClient.prototype.searchSeries).toHaveBeenCalledWith('test');
    expect(TMDbClient.prototype.searchTvShows).toHaveBeenCalledWith('test');
    
    // Assert response contains enriched data
    expect(data).toHaveLength(1);
    expect(data[0]).toEqual({
      guid: 'test-guid-1',
      title: 'Test Series',
      year: 2023,
      quality: '1080p',
      format: 'WEBDL',
      codec: 'x264',
      size: 2000000000,
      sizeFormatted: '1.86 GB',
      indexer: 'test-indexer',
      seeders: 15,
      leechers: 3,
      tmdb: {
        id: 123,
        posterPath: 'https://image.tmdb.org/t/p/w500/test-poster.jpg',
        backdropPath: 'https://image.tmdb.org/t/p/original/test-backdrop.jpg',
        voteAverage: 8.5,
        genreIds: [28, 12],
        overview: 'This is a test series',
      }
    });
  });
  
  it('should handle errors gracefully', async () => {
    // Mock ProwlarrClient to throw an error
    (ProwlarrClient.prototype.searchSeries as any) = vi.fn().mockRejectedValue(
      new Error('Failed to fetch data from Prowlarr')
    );
    
    // Create a mock request
    const request = new Request('http://localhost:3000/api/series?query=test');
    
    // Call the API route handler
    const response = await GET(request);
    
    // Assert response is an error
    expect(response.status).toBe(500);
    
    const data = await response.json();
    expect(data).toEqual({ error: 'Failed to fetch data from Prowlarr' });
  });
  
  it('should filter by year if provided', async () => {
    // Mock ProwlarrClient implementation
    const mockProwlarrSeries = [
      {
        guid: 'test-guid-1',
        title: 'Test Series 2023',
        year: 2023,
        quality: '1080p',
        format: 'WEBDL',
        codec: 'x264',
        size: 2000000000,
        sizeFormatted: '1.86 GB',
        indexer: 'test-indexer',
        seeders: 15,
        leechers: 3,
      },
      {
        guid: 'test-guid-2',
        title: 'Test Series 2022',
        year: 2022,
        quality: '1080p',
        format: 'WEBDL',
        codec: 'x264',
        size: 2000000000,
        sizeFormatted: '1.86 GB',
        indexer: 'test-indexer',
        seeders: 10,
        leechers: 5,
      }
    ];
    
    (ProwlarrClient.prototype.searchSeries as any) = vi.fn().mockResolvedValue(mockProwlarrSeries);
    
    // Mock TMDbClient implementation
    const mockTMDbSeries = [
      {
        id: 123,
        title: 'Test Series 2023',
        releaseDate: '2023-01-01',
        year: 2023,
        posterPath: 'https://image.tmdb.org/t/p/w500/test-poster-1.jpg',
        backdropPath: 'https://image.tmdb.org/t/p/original/test-backdrop-1.jpg',
        voteAverage: 8.5,
        genreIds: [28, 12],
        overview: 'This is a test series from 2023',
      },
      {
        id: 456,
        title: 'Test Series 2022',
        releaseDate: '2022-01-01',
        year: 2022,
        posterPath: 'https://image.tmdb.org/t/p/w500/test-poster-2.jpg',
        backdropPath: 'https://image.tmdb.org/t/p/original/test-backdrop-2.jpg',
        voteAverage: 7.5,
        genreIds: [28, 12],
        overview: 'This is a test series from 2022',
      }
    ];
    
    (TMDbClient.prototype.searchTvShows as any) = vi.fn().mockResolvedValue(mockTMDbSeries);
    
    // Create a mock request with search parameters and year filter
    const request = new Request('http://localhost:3000/api/series?query=test&year=2023');
    
    // Call the API route handler
    const response = await GET(request);
    const data = await response.json();
    
    // Verify year filter was applied
    expect(data).toHaveLength(1);
    expect(data[0].year).toBe(2023);
    expect(data[0].title).toBe('Test Series 2023');
  });
});
