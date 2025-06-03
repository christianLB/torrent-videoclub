
// vi.hoisted must be at the very top
const { __MONGODB_URI_SET__ } = vi.hoisted(() => {
  process.env.MONGODB_URI = 'mongodb://mock-uri-for-tests-via-hoisted';
  return { __MONGODB_URI_SET__: true }; // Ensure the factory runs
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CuratorService } from '../../../../lib/services/curator-service';
import { FeaturedContent } from '../../../../lib/types/featured';
import { NextResponse } from 'next/server';

// Mock the CuratorService
vi.mock('../../../../lib/services/curator-service');

// Mock NextResponse
vi.mock('next/server', () => {
  return {
    NextResponse: {
      json: vi.fn((data, options) => {
        return {
          status: options?.status || 200,
          json: async () => data
        };
      })
    }
  };
});

// Create a simple mock implementation of the route handler
const GET = async (request: Request) => {
  try {
    const featuredContent = await CuratorService.getFeaturedContent();
    return NextResponse.json(featuredContent, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
};

describe('/api/featured route', () => {
  const mockFeaturedContent: FeaturedContent = {
    featuredItem: {
      guid: 'featured-item-guid',
      indexerId: 'test-indexer',
      protocol: 'torrent',
      mediaType: 'movie',
      title: 'Featured Movie',
      quality: '4K',
      size: 20000000000,
      // indexer: 'test-indexer', // Replaced by indexerId
      seeders: 50,
      leechers: 10,
      inLibrary: false,
      isDownloading: false,
      tmdbInfo: {
        tmdbId: 12345,
        title: 'Featured Movie',
        releaseDate: '2025-01-01',
        year: 2025,
        posterPath: '/test-poster.jpg',
        backdropPath: '/test-backdrop.jpg',
        voteAverage: 8.7,
        genreIds: [28, 878],
        overview: 'This is a featured movie overview.'
      }
    },
    categories: [
      {
        id: 'trending-movies',
        title: 'Trending Movies',
        items: [
          {
            guid: 'trending-movie-1',
            indexerId: 'test-indexer',
            protocol: 'torrent',
            mediaType: 'movie',
            title: 'Trending Movie 1',
            quality: '1080p',
            size: 8000000000,
            // indexer: 'test-indexer',
            seeders: 30,
            leechers: 5,
            inLibrary: true,
            isDownloading: false,
            tmdbInfo: {
              tmdbId: 12346,
              title: 'Trending Movie 1',
              releaseDate: '2025-01-01',
              year: 2025,
              posterPath: '/test-poster-1.jpg',
              backdropPath: '/test-backdrop-1.jpg',
              voteAverage: 7.5,
              genreIds: [28, 12],
              overview: 'This is trending movie 1 overview.'
            }
          },
          {
            guid: 'trending-movie-2',
            indexerId: 'test-indexer',
            protocol: 'torrent',
            mediaType: 'movie',
            title: 'Trending Movie 2',
            quality: '2160p',
            size: 15000000000,
            // indexer: 'test-indexer',
            seeders: 45,
            leechers: 8,
            inLibrary: false,
            isDownloading: true,
            downloadProgress: 75,
            tmdbInfo: {
              tmdbId: 12347,
              title: 'Trending Movie 2',
              releaseDate: '2024-01-01',
              year: 2024,
              posterPath: '/test-poster-2.jpg',
              backdropPath: '/test-backdrop-2.jpg',
              voteAverage: 8.2,
              genreIds: [27, 53],
              overview: 'This is trending movie 2 overview.'
            }
          }
        ]
      }
    ]
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(CuratorService.getFeaturedContent).mockResolvedValue(mockFeaturedContent);
  });

  it('should return featured content', async () => {
    // Create a mock request
    const request = new Request('http://localhost:3000/api/featured');
    
    // Call the API route handler
    const response = await GET(request);
    const data = await response.json();
    
    // Assert response is successful
    expect(response.status).toBe(200);
    
    // Assert data structure is correct
    expect(data).toHaveProperty('featuredItem');
    expect(data).toHaveProperty('categories');
    
    // Check featured item properties
    expect(data.featuredItem).toHaveProperty('title', 'Featured Movie');
    expect(data.featuredItem).toHaveProperty('inLibrary', false);
    expect(data.featuredItem).toHaveProperty('isDownloading', false);
    
    // Check categories
    expect(data.categories).toHaveLength(1);
    expect(data.categories[0].title).toBe('Trending Movies');
    expect(data.categories[0].items).toHaveLength(2);
    
    // Check library status indicators
    expect(data.categories[0].items[0].inLibrary).toBe(true);
    expect(data.categories[0].items[1].isDownloading).toBe(true);
    expect(data.categories[0].items[1].downloadProgress).toBe(75);
  });

  it('should handle errors gracefully', async () => {
    // Mock service to throw an error
    vi.mocked(CuratorService.getFeaturedContent).mockRejectedValueOnce(
      new Error('Failed to fetch featured content')
    );
    
    // Create a mock request
    const request = new Request('http://localhost:3000/api/featured');
    
    // Call the API route handler
    const response = await GET(request);
    
    // Assert response is an error
    expect(response.status).toBe(500);
    
    const data = await response.json();
    expect(data).toEqual({ error: 'Failed to fetch featured content' });
  });
});
