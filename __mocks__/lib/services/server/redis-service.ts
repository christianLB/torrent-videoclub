import { vi } from 'vitest';

// Create the Redis service mock that will be used across tests
export const redisService = {
  get: vi.fn().mockResolvedValue(null),  // Initially nothing in cache
  set: vi.fn().mockResolvedValue(true),
  clearByPrefix: vi.fn().mockResolvedValue(true),
  getFeaturedContent: vi.fn().mockResolvedValue(null),
  setFeaturedContent: vi.fn().mockResolvedValue(true),
  getTMDBItem: vi.fn().mockResolvedValue(null),
  setTMDBItem: vi.fn().mockResolvedValue(true),
  getClient: vi.fn().mockReturnValue({
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue('OK'),
    del: vi.fn().mockResolvedValue(1)
  })
};
