import { vi } from 'vitest';

// Mock the serverConfig object
export const serverConfig = {
  'prowlarr.url': 'http://test-prowlarr-url.com',
  'prowlarr.apiKey': 'test-prowlarr-api-key',
  'tmdb.apiKey': 'test-tmdb-api-key',
  'features.useRealData': true,
  'features.useTMDb': true,
  get: vi.fn().mockImplementation((key: string, defaultValue?: any) => {
    return serverConfig[key as keyof typeof serverConfig] || defaultValue;
  })
};
