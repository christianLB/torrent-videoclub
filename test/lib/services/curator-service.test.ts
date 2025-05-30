import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { CuratorService } from '../../../lib/services/curator-service';
import { TrendingContentClient } from '../../../lib/services/trending-content-client';

// Mock the TrendingContentClient
vi.mock('../../../lib/services/trending-content-client', () => ({
  TrendingContentClient: vi.fn().mockImplementation(() => ({
    getTrendingMovies: vi.fn().mockResolvedValue([
      {
        id: 'movie1',
        title: 'Test Movie 1',
        year: 2024,
        quality: '1080p',
        seeders: 100,
        inLibrary: false,
        tmdb: null
      }
    ]),
    getPopularTV: vi.fn().mockResolvedValue([
      {
        id: 'tv1',
        title: 'Test TV Show 1',
        year: 2024,
        quality: 'HD',
        seeders: 80,
        inLibrary: false,
        tmdb: null
      }
    ]),
    getNewReleases: vi.fn().mockResolvedValue([
      {
        id: 'release1',
        title: 'New Release 1',
        year: 2025,
        quality: '4K',
        seeders: 50,
        inLibrary: false,
        tmdb: null
      }
    ]),
    get4KContent: vi.fn().mockResolvedValue([
      {
        id: '4k1',
        title: '4K Movie 1',
        year: 2024,
        quality: '4K',
        seeders: 120,
        inLibrary: false,
        tmdb: null
      }
    ]),
    getDocumentaries: vi.fn().mockResolvedValue([
      {
        id: 'doc1',
        title: 'Documentary 1',
        year: 2023,
        quality: '1080p',
        seeders: 30,
        inLibrary: false,
        tmdb: null
      }
    ])
  }))
}));

// Create a Redis service mock
const redisMock = {
  get: vi.fn().mockResolvedValue(null),  // Initially nothing in cache
  set: vi.fn().mockResolvedValue(true),
  clearByPrefix: vi.fn().mockResolvedValue(true)
};

// Mock RedisService module
vi.mock('../../../lib/services/server/redis-service', () => ({
  __esModule: true,
  default: redisMock
}));

describe('CuratorService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Force initialization with real data 
    vi.spyOn(CuratorService, 'isUsingRealData').mockReturnValue(true);
    
    // Reset the internal state of the service
    // @ts-ignore - accessing private field for testing
    CuratorService.initialized = false;
    
    // Initialize the service
    CuratorService.initialize();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('fetchFreshFeaturedContent', () => {
    it('should fetch content from all categories', async () => {
      const featuredContent = await CuratorService.fetchFreshFeaturedContent();
      
      // Check that content from each category was fetched
      expect(featuredContent).toBeDefined();
      expect(featuredContent.categories).toHaveLength(5); // 5 categories
      
      // Verify each category exists and has content
      const categoryTitles = featuredContent.categories.map(c => c.title);
      expect(categoryTitles).toContain('Trending Movies');
      expect(categoryTitles).toContain('Popular TV Shows');
      expect(categoryTitles).toContain('New Releases');
      expect(categoryTitles).toContain('4K Content');
      expect(categoryTitles).toContain('Documentaries');
      
      // Verify each category has items
      featuredContent.categories.forEach(category => {
        expect(category.items.length).toBeGreaterThan(0);
      });
    });
  });

  describe('getFeaturedContent', () => {
    it('should return cached content if available', async () => {
      // Mock the Redis service to return cached content
      const cachedContent = {
        categories: [{ id: 'trending', title: 'Trending Movies', items: [] }]
      };
      
      // Update the Redis mock to return cached content
      redisMock.get.mockResolvedValueOnce(JSON.stringify(cachedContent));
      
      const result = await CuratorService.getFeaturedContent();
      
      // Should return the cached content
      expect(result).toEqual(cachedContent);
      expect(redisMock.get).toHaveBeenCalledWith('featured:content');
    });
    
    it('should fetch fresh content if cache is empty', async () => {
      const result = await CuratorService.getFeaturedContent();
      
      // Should contain the expected categories
      expect(result.categories).toHaveLength(5);
    });
  });

  describe('clearCache', () => {
    it('should clear the featured content cache', async () => {
      await CuratorService.clearCache();
      
      expect(redisMock.clearByPrefix).toHaveBeenCalledWith('featured:');
    });
  });
});
