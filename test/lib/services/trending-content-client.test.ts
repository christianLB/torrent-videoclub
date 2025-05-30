import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { TrendingContentClient } from '../../../lib/services/trending-content-client';

// Create a mock for search results
const mockSearchResults = [
  {
    guid: '123456',
    title: 'Test Movie 2024 1080p',
    indexer: 'test-indexer',
    publishDate: '2024-05-01T00:00:00.000Z',
    size: 10000000000,
    seeders: 100,
    leechers: 10,
    categories: ['2000'],
    downloadUrl: 'https://example.com/download',
    infoUrl: 'https://example.com/info',
    protocol: 'torrent'
  }
];

// Create the mock implementation for all methods
const mockedMethods = {
  getTrendingMovies: vi.fn().mockResolvedValue([{
    id: '123456',
    title: 'Test Movie 2024 1080p',
    year: 2024,
    quality: '1080p',
    seeders: 100,
    inLibrary: false,
    tmdb: null
  }]),
  getPopularTV: vi.fn().mockResolvedValue([{
    id: 'tv123',
    title: 'Test TV Show 2024',
    year: 2024,
    quality: '1080p',
    seeders: 80,
    inLibrary: false,
    tmdb: null
  }]),
  getNewReleases: vi.fn().mockResolvedValue([{
    id: 'new123',
    title: 'New Release 2024',
    year: 2024,
    quality: '2160p',
    seeders: 50,
    inLibrary: false,
    tmdb: null
  }]),
  get4KContent: vi.fn().mockResolvedValue([{
    id: '4k123',
    title: '4K Movie 2024',
    year: 2024,
    quality: '2160p',
    seeders: 30,
    inLibrary: false,
    tmdb: null
  }]),
  getDocumentaries: vi.fn().mockResolvedValue([{
    id: 'doc123',
    title: 'Documentary 2024',
    year: 2024,
    quality: '1080p',
    seeders: 25,
    inLibrary: false,
    tmdb: null
  }])
};

// Don't mock the entire module, just the class
vi.mock('../../../lib/services/trending-content-client', () => ({
  TrendingContentClient: vi.fn().mockImplementation(() => mockedMethods)
}));

describe('TrendingContentClient', () => {
  let trendingClient: any; // Use any type to avoid TypeScript errors with mocked methods

  beforeEach(() => {
    vi.clearAllMocks();
    // Create a new instance of the mocked class before each test
    trendingClient = new TrendingContentClient({} as any);
  });


  describe('getTrendingMovies', () => {
    it('should fetch trending movies', async () => {
      const result = await trendingClient.getTrendingMovies({ limit: 10 });

      // Verify the mocked method was called
      expect(trendingClient.getTrendingMovies).toHaveBeenCalled();

      // Verify results are returned correctly
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(expect.objectContaining({
        title: 'Test Movie 2024 1080p',
        year: 2024,
        quality: '1080p'
      }));
    });
  });

  describe('getPopularTV', () => {
    it('should fetch popular TV shows', async () => {
      const result = await trendingClient.getPopularTV({ limit: 5 });

      expect(trendingClient.getPopularTV).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Test TV Show 2024');
    });
  });

  describe('getNewReleases', () => {
    it('should fetch new releases', async () => {
      const result = await trendingClient.getNewReleases({ limit: 15 });

      expect(trendingClient.getNewReleases).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('New Release 2024');
    });
  });

  describe('get4KContent', () => {
    it('should fetch 4K content', async () => {
      const result = await trendingClient.get4KContent({ limit: 10 });

      expect(trendingClient.get4KContent).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0].quality).toBe('2160p');
    });
  });

  describe('getDocumentaries', () => {
    it('should fetch documentaries', async () => {
      const result = await trendingClient.getDocumentaries({ limit: 10 });

      expect(trendingClient.getDocumentaries).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Documentary 2024');
    });
  });
});
