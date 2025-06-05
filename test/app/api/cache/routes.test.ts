const { __MONGODB_URI_SET__ } = vi.hoisted(() => {
  process.env.MONGODB_URI = 'mongodb://mock-uri';
  return { __MONGODB_URI_SET__: true };
});

vi.mock('../../../../lib/services/server/cache-service', () => ({
  CacheService: {
    isFeaturedContentCacheValid: vi.fn(),
    getFeaturedContentCacheTimeRemaining: vi.fn(),
    getCachedFeaturedContent: vi.fn()
  }
}));

vi.mock('../../../../lib/services/server/cache-scheduler', () => ({
  CacheSchedulerService: {
    refreshCache: vi.fn()
  }
}));

import { describe, it, expect, vi } from 'vitest';
import { GET } from '../../../../app/api/cache/route';
import { POST } from '../../../../app/api/cache/refresh/route';
import { CacheService } from '../../../../lib/services/server/cache-service';
import { CacheSchedulerService } from '../../../../lib/services/server/cache-scheduler';

describe('/api/cache routes', () => {
  it('GET returns cache status', async () => {
    vi.mocked(CacheService.isFeaturedContentCacheValid).mockResolvedValue(true);
    vi.mocked(CacheService.getFeaturedContentCacheTimeRemaining).mockResolvedValue(42);
    vi.mocked(CacheService.getCachedFeaturedContent).mockResolvedValue({ foo: 'bar' } as any);

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.valid).toBe(true);
    expect(data.ttl).toBe(42);
    expect(data.featuredContent).toEqual({ foo: 'bar' });
  });

  it('POST triggers cache refresh', async () => {
    vi.mocked(CacheSchedulerService.refreshCache).mockResolvedValue({ success: true } as any);

    const req = new Request('http://test', { method: 'POST' });
    const res = await POST(req as any);
    const data = await res.json();

    expect(CacheSchedulerService.refreshCache).toHaveBeenCalled();
    expect(res.status).toBe(200);
    expect(data).toEqual({ success: true });
  });
});
