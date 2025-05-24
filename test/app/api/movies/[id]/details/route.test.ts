import { NextRequest } from 'next/server';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/movies/[id]/details/route';

// Mock TMDbClient
vi.mock('@/lib/api/tmdb-client', () => {
  return {
    TMDbClient: vi.fn().mockImplementation(() => ({
      getMovieDetails: vi.fn().mockResolvedValue({
        id: 123,
        title: 'Test Movie',
        overview: 'This is a test movie',
        posterPath: '/path/to/poster.jpg',
        backdropPath: '/path/to/backdrop.jpg',
        releaseDate: '2023-01-01',
        voteAverage: 7.5,
        genres: [{ id: 28, name: 'Action' }],
        runtime: 120
      })
    }))
  };
});

describe('GET /api/movies/[id]/details', () => {
  let req: NextRequest;
  
  beforeEach(() => {
    req = new NextRequest('http://localhost:3000/api/movies/123/details');
  });
  
  it('should return movie details when given a valid ID', async () => {
    const params = { params: { id: '123' } };
    const response = await GET(req, params);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data).toEqual({
      id: 123,
      title: 'Test Movie',
      overview: 'This is a test movie',
      posterPath: '/path/to/poster.jpg',
      backdropPath: '/path/to/backdrop.jpg',
      releaseDate: '2023-01-01',
      voteAverage: 7.5,
      genres: [{ id: 28, name: 'Action' }],
      runtime: 120
    });
  });
  
  it('should handle invalid movie ID', async () => {
    const params = { params: { id: 'invalid' } };
    const response = await GET(req, params);
    
    expect(response.status).toBe(400);
  });
});
