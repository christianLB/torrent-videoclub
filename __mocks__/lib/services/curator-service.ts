import { vi } from 'vitest';
import { FeaturedContent, FeaturedItem } from '../../../lib/types/featured';

// Create a mock featured item
const mockFeaturedItem: FeaturedItem = {
  guid: 'test-featured-id',
  indexerId: 'test-indexer',
  size: 1000000000,
  protocol: 'torrent',
  mediaType: 'movie',
  title: 'Test Featured Movie',
  tmdbInfo: {
    tmdbId: 12345,
    title: 'Test Featured Movie',
    overview: 'Test overview',
    posterPath: '/test-poster.jpg',
    backdropPath: '/test-backdrop.jpg'
  }
};

// Create a mock featured content object
const mockFeaturedContent: FeaturedContent = {
  featuredItem: mockFeaturedItem,
  categories: [
    { id: 'trending-movies', title: 'Trending Movies', items: [mockFeaturedItem] },
    { id: 'popular-tv', title: 'Popular TV Shows', items: [mockFeaturedItem] },
    { id: 'new-releases', title: 'New Releases', items: [mockFeaturedItem] },
    { id: '4k-content', title: '4K Content', items: [mockFeaturedItem] },
    { id: 'documentaries', title: 'Documentaries', items: [mockFeaturedItem] }
  ]
};

// Export mock CuratorService
export const CuratorService = {
  initialized: false,
  initialize: vi.fn().mockImplementation(() => {
    CuratorService.initialized = true;
    return Promise.resolve();
  }),
  forceInitialize: vi.fn().mockImplementation(() => {
    CuratorService.initialized = true;
    return Promise.resolve();
  }),
  isUsingRealData: vi.fn().mockReturnValue(true),
  getFeaturedContent: vi.fn().mockResolvedValue(mockFeaturedContent),
  getCategory: vi.fn().mockImplementation((categoryId) => {
    const category = mockFeaturedContent.categories.find(c => c.id === categoryId);
    return Promise.resolve(category || null);
  }),
  fetchFreshFeaturedContent: vi.fn().mockResolvedValue(mockFeaturedContent),
  clearCache: vi.fn().mockResolvedValue(true)
};
