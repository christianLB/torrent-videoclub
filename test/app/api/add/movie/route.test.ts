import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../../../../../app/api/add/movie/route';
import { RadarrClient } from '../../../../../lib/api/radarr-client';
import { TMDbClient } from '../../../../../lib/api/tmdb-client';

// Mock the API clients
vi.mock('../../../../../lib/api/radarr-client');
vi.mock('../../../../../lib/api/tmdb-client');

describe('/api/add/movie route', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should add a movie to Radarr and return success response', async () => {
    // Mock TMDb movie details
    const mockTMDbDetails = {
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
    };
    
    (TMDbClient.prototype.getMovieDetails as any) = vi.fn().mockResolvedValue(mockTMDbDetails);
    
    // Mock Radarr add movie response
    const mockRadarrResponse = {
      id: 456,
      title: 'Test Movie',
      tmdbId: 123,
      year: 2023,
    };
    
    (RadarrClient.prototype.addMovie as any) = vi.fn().mockResolvedValue(mockRadarrResponse);
    
    // Create a mock request with required data
    const request = new Request('http://localhost:3000/api/add/movie', {
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
    expect(TMDbClient.prototype.getMovieDetails).toHaveBeenCalledWith(123);
    expect(RadarrClient.prototype.addMovie).toHaveBeenCalledWith({
      tmdbId: 123,
      title: 'Test Movie',
      year: 2023,
      qualityProfileId: expect.any(Number),
      rootFolderPath: expect.any(String),
      minimumAvailability: 'released',
      monitored: true,
    });
    
    // Assert response is success
    expect(response.status).toBe(200);
    expect(data).toEqual({
      success: true,
      message: 'Movie added to Radarr successfully',
      movie: mockRadarrResponse,
    });
  });
  
  it('should return 400 if tmdbId is missing', async () => {
    // Create a mock request with missing tmdbId
    const request = new Request('http://localhost:3000/api/add/movie', {
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
    (TMDbClient.prototype.getMovieDetails as any) = vi.fn().mockRejectedValue(
      new Error('Failed to fetch movie details from TMDb')
    );
    
    // Create a mock request
    const request = new Request('http://localhost:3000/api/add/movie', {
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
      error: 'Failed to fetch movie details from TMDb',
    });
  });
  
  it('should handle errors from Radarr API', async () => {
    // Mock TMDb movie details
    const mockTMDbDetails = {
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
    };
    
    (TMDbClient.prototype.getMovieDetails as any) = vi.fn().mockResolvedValue(mockTMDbDetails);
    
    // Mock Radarr to throw an error
    (RadarrClient.prototype.addMovie as any) = vi.fn().mockRejectedValue(
      new Error('Failed to add movie to Radarr')
    );
    
    // Create a mock request
    const request = new Request('http://localhost:3000/api/add/movie', {
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
      error: 'Failed to add movie to Radarr',
    });
  });
});
