const { __MONGODB_URI_SET__ } = vi.hoisted(() => {
  process.env.MONGODB_URI = 'mongodb://mock-uri';
  return { __MONGODB_URI_SET__: true };
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchFreshFeaturedContent } from '../../../lib/services/server/curator-service';
import { CategoryConfigService } from '../../../lib/services/server/category-config-service';
import { TrendingContentClient } from '../../../lib/services/server/trending-content-client';

vi.mock('../../../lib/services/server/category-config-service');
vi.mock('../../../lib/services/server/trending-content-client');

const mockClient = {
  getTrendingMovies: vi.fn().mockResolvedValue([{ guid: 'a', indexerId: '1', title: 'A', protocol: 'torrent', mediaType: 'movie' }]),
  getPopularTV: vi.fn().mockResolvedValue([{ guid: 'b', indexerId: '1', title: 'B', protocol: 'torrent', mediaType: 'tv' }]),
  getNewReleases: vi.fn().mockResolvedValue([]),
  get4KContent: vi.fn().mockResolvedValue([]),
  getDocumentaries: vi.fn().mockResolvedValue([])
};

vi.mocked(TrendingContentClient).mockImplementation(() => mockClient as any);

describe('CuratorService with category config', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(CategoryConfigService.getAllCategories).mockResolvedValue([
      { _id: 'trending-now', title: 'Trending', type: 'movie', order: 1, enabled: true, tmdbParams: { source: 'trendingMovies' } },
      { _id: 'popular-tv', title: 'Popular TV', type: 'tv', order: 2, enabled: true, tmdbParams: { source: 'popularTV' } },
      { _id: 'disabled', title: 'Disabled', type: 'movie', order: 3, enabled: false, tmdbParams: { source: 'newReleases' } }
    ] as any);
  });

  it('orders and filters categories', async () => {
    const result = await fetchFreshFeaturedContent(new TrendingContentClient({} as any));
    expect(result.categories[0].id).toBe('trending-now');
    expect(result.categories).toHaveLength(2);
  });
});
