import { NextRequest } from 'next/server';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/series/[id]/details/route';

// Mock TMDbClient
vi.mock('@/lib/api/tmdb-client', () => {
  return {
    TMDbClient: vi.fn().mockImplementation(() => ({
      getTvShowDetails: vi.fn().mockResolvedValue({
        id: 123,
        title: 'Test Series',
        overview: 'This is a test series',
        posterPath: '/path/to/poster.jpg',
        backdropPath: '/path/to/backdrop.jpg',
        firstAirDate: '2023-01-01',
        voteAverage: 8.2,
        genres: [{ id: 18, name: 'Drama' }],
        numberOfSeasons: 3,
        numberOfEpisodes: 24
      })
    }))
  };
});

describe('GET /api/series/[id]/details', () => {
  let req: NextRequest;
  
  beforeEach(() => {
    req = new NextRequest('http://localhost:3000/api/series/123/details');
  });
  
  it('should return series details when given a valid ID', async () => {
    const params = { params: { id: '123' } };
    const response = await GET(req, params);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data).toEqual({
      id: 123,
      title: 'Test Series',
      overview: 'This is a test series',
      posterPath: '/path/to/poster.jpg',
      backdropPath: '/path/to/backdrop.jpg',
      firstAirDate: '2023-01-01',
      voteAverage: 8.2,
      genres: [{ id: 18, name: 'Drama' }],
      numberOfSeasons: 3,
      numberOfEpisodes: 24
    });
  });
  
  it('should handle invalid series ID', async () => {
    const params = { params: { id: 'invalid' } };
    const response = await GET(req, params);
    
    expect(response.status).toBe(400);
  });
});
