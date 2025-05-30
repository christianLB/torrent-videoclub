import { POST } from '../route'; // Adjust path as necessary
import { NextResponse } from 'next/server';
import { SonarrClient } from '../../../../../lib/api/sonarr-client';
import { TMDbClient } from '../../../../../lib/api/tmdb-client';
import { TMDBMediaItem } from '../../../../../lib/types/tmdb';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the external clients
vi.mock('../../../../../lib/api/sonarr-client');
vi.mock('../../../../../lib/api/tmdb-client');

// Mock process.env
const mockProcessEnv = {
  TMDB_API_KEY: 'test_tmdb_key',
  SONARR_URL: 'http://localhost:8989',
  SONARR_API_KEY: 'test_sonarr_key',
  SONARR_ROOT_FOLDER_PATH: '/tv',
};

const originalProcessEnv = { ...process.env };

describe('/api/add/tv POST endpoint', () => {
  let mockTmdbClientInstance: any;
  let mockSonarrClientInstance: any;

  beforeEach(() => {
    // Restore original process.env and then set mocks for each test
    process.env = { ...originalProcessEnv, ...mockProcessEnv };

    // Reset mocks and instances before each test
    vi.clearAllMocks();

    // Mock TMDbClient methods
    mockTmdbClientInstance = {
      getTvShowDetails: vi.fn(),
    };
    (TMDbClient as any).mockImplementation(() => mockTmdbClientInstance);

    // Mock SonarrClient methods
    mockSonarrClientInstance = {
      addSeries: vi.fn(),
      getQualityProfiles: vi.fn(), // Add mock for getQualityProfiles
    };
    (SonarrClient as any).mockImplementation(() => mockSonarrClientInstance);

    // Default mock for getQualityProfiles - can be overridden in specific tests
    mockSonarrClientInstance.getQualityProfiles.mockResolvedValue([
      { id: 1, name: 'SD' },
      { id: 2, name: 'HD-720p' },
      { id: 3, name: 'Standard' }, // A potential default name
      { id: 4, name: 'Any' },      // Another potential default name
    ]);
  });

  afterEach(() => {
    // Restore original process.env after each test
    process.env = { ...originalProcessEnv };
  });

  it('should successfully add a TV show if valid tmdbId is provided and services succeed', async () => {
    const mockTmdbId = 123;
    const mockTvShowDetails: TMDBMediaItem = {
      tmdbId: mockTmdbId,
      mediaType: 'tv',
      title: 'Test Show',
      tvdb_id: 789,
      firstAirDate: '2023-01-01',
      // ... other necessary fields
    } as TMDBMediaItem; // Cast to satisfy type, add more fields as needed by SonarrClient

    mockTmdbClientInstance.getTvShowDetails.mockResolvedValue(mockTvShowDetails);
    mockSonarrClientInstance.addSeries.mockResolvedValue({ id: 1, title: 'Test Show' });

    const request = new Request('http://localhost/api/add/tv', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tmdbId: mockTmdbId }),
    });

    const response = await POST(request);
    const responseBody = await response.json();

    expect(response.status).toBe(200);
    expect(responseBody.success).toBe(true);
    expect(responseBody.message).toContain('added to Sonarr successfully');
    expect(mockTmdbClientInstance.getTvShowDetails).toHaveBeenCalledWith(mockTmdbId);
    expect(mockSonarrClientInstance.getQualityProfiles).toHaveBeenCalled();
    expect(mockSonarrClientInstance.addSeries).toHaveBeenCalledWith(expect.objectContaining({
      tvdbId: mockTvShowDetails.tvdb_id,
      title: mockTvShowDetails.title,
      qualityProfileId: 4, // Expecting 'Any' profile (id: 4) to be chosen from default mock
    }));
  });

  it('should return 404 if TMDB ID is not found', async () => {
    const mockTmdbId = 404;
    mockTmdbClientInstance.getTvShowDetails.mockResolvedValue(null);

    const request = new Request('http://localhost/api/add/tv', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tmdbId: mockTmdbId }),
    });

    const response = await POST(request);
    const responseBody = await response.json();

    expect(response.status).toBe(404);
    expect(responseBody.error).toContain(`TV series with TMDb ID ${mockTmdbId} not found`);
    expect(mockSonarrClientInstance.addSeries).not.toHaveBeenCalled();
  });

  it('should return 404 if tvdb_id is missing from TMDB details', async () => {
    const mockTmdbId = 789;
    const mockTvShowDetailsPartial: Partial<TMDBMediaItem> = {
      tmdbId: mockTmdbId,
      mediaType: 'tv',
      title: 'Test Show Without TVDBID',
      firstAirDate: '2023-01-01',
      tvdb_id: undefined, // Explicitly undefined
    };

    mockTmdbClientInstance.getTvShowDetails.mockResolvedValue(mockTvShowDetailsPartial as TMDBMediaItem);

    const request = new Request('http://localhost/api/add/tv', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tmdbId: mockTmdbId }),
    });

    const response = await POST(request);
    const responseBody = await response.json();

    expect(response.status).toBe(404); // Or 422 if preferred for validation errors
    expect(responseBody.error).toContain(`Cannot add to Sonarr: TVDB ID missing for '${mockTvShowDetailsPartial.title}'`);
    expect(mockSonarrClientInstance.addSeries).not.toHaveBeenCalled();
  });

  it('should return 500 if Sonarr API call fails', async () => {
    const mockTmdbId = 123;
    const mockTvShowDetails: TMDBMediaItem = {
      tmdbId: mockTmdbId,
      mediaType: 'tv',
      title: 'Test Show',
      tvdb_id: 789,
      firstAirDate: '2023-01-01',
    } as TMDBMediaItem;

    mockTmdbClientInstance.getTvShowDetails.mockResolvedValue(mockTvShowDetails);
    mockSonarrClientInstance.addSeries.mockRejectedValue(new Error('Sonarr API Error'));

    const request = new Request('http://localhost/api/add/tv', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tmdbId: mockTmdbId }),
    });

    const response = await POST(request);
    const responseBody = await response.json();

    expect(response.status).toBe(500);
    expect(responseBody.error).toContain('Could not connect to Sonarr. Please check configuration and ensure Sonarr is running.');
  });

  it('should return 400 if tmdbId is missing from the request body', async () => {
    const request = new Request('http://localhost/api/add/tv', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}), // Empty body
    });

    const response = await POST(request);
    const responseBody = await response.json();

    expect(response.status).toBe(400);
    expect(responseBody.error).toContain('Valid TMDb ID (number) is required');
    expect(mockTmdbClientInstance.getTvShowDetails).not.toHaveBeenCalled();
    expect(mockSonarrClientInstance.addSeries).not.toHaveBeenCalled();
  });

  it('should return 400 if tmdbId is not a number', async () => {
    const request = new Request('http://localhost/api/add/tv', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tmdbId: 'not-a-number' }),
    });

    const response = await POST(request);
    const responseBody = await response.json();

    expect(response.status).toBe(400);
    expect(responseBody.error).toContain('Valid TMDb ID (number) is required');
    expect(mockTmdbClientInstance.getTvShowDetails).not.toHaveBeenCalled();
    expect(mockSonarrClientInstance.addSeries).not.toHaveBeenCalled();
  });

  it('should return 500 if required environment variables are missing', async () => {
    // Unset a required environment variable for this test
    delete process.env.SONARR_API_KEY;

    const mockTmdbId = 123;
    // No need to mock client calls as it should fail before that

    const request = new Request('http://localhost/api/add/tv', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tmdbId: mockTmdbId }),
    });

    const response = await POST(request);
    const responseBody = await response.json();

    expect(response.status).toBe(500);
    expect(responseBody.error).toContain('Server configuration error: Sonarr connection details missing');
    // Restore for other tests, though beforeEach/afterEach should handle this
    process.env.SONARR_API_KEY = mockProcessEnv.SONARR_API_KEY;
  });

  it('should use the first quality profile if no preferred names are found', async () => {
    const mockTmdbId = 777;
    const mockTvShowDetails: TMDBMediaItem = { tmdbId: mockTmdbId, mediaType: 'tv', title: 'Show With Specific Profile', tvdb_id: 1011 } as TMDBMediaItem;
    mockTmdbClientInstance.getTvShowDetails.mockResolvedValue(mockTvShowDetails);
    mockSonarrClientInstance.getQualityProfiles.mockResolvedValue([
      { id: 10, name: 'Specific1' },
      { id: 11, name: 'Specific2' },
    ]);
    mockSonarrClientInstance.addSeries.mockResolvedValue({ id: 1, title: 'Test Show' });

    const request = new Request('http://localhost/api/add/tv', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tmdbId: mockTmdbId }),
    });
    await POST(request);
    expect(mockSonarrClientInstance.addSeries).toHaveBeenCalledWith(expect.objectContaining({ qualityProfileId: 10 }));
  });

  it('should use fallback quality profile ID 1 if getQualityProfiles returns empty array', async () => {
    const mockTmdbId = 888;
    const mockTvShowDetails: TMDBMediaItem = { tmdbId: mockTmdbId, mediaType: 'tv', title: 'Show With Empty Profiles', tvdb_id: 1213 } as TMDBMediaItem;
    mockTmdbClientInstance.getTvShowDetails.mockResolvedValue(mockTvShowDetails);
    mockSonarrClientInstance.getQualityProfiles.mockResolvedValue([]);
    mockSonarrClientInstance.addSeries.mockResolvedValue({ id: 1, title: 'Test Show' });

    const request = new Request('http://localhost/api/add/tv', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tmdbId: mockTmdbId }),
    });
    await POST(request);
    expect(mockSonarrClientInstance.addSeries).toHaveBeenCalledWith(expect.objectContaining({ qualityProfileId: 1 }));
  });

  it('should use fallback quality profile ID 1 if getQualityProfiles fails', async () => {
    const mockTmdbId = 999;
    const mockTvShowDetails: TMDBMediaItem = { tmdbId: mockTmdbId, mediaType: 'tv', title: 'Show With Profile Fetch Error', tvdb_id: 1415 } as TMDBMediaItem;
    mockTmdbClientInstance.getTvShowDetails.mockResolvedValue(mockTvShowDetails);
    mockSonarrClientInstance.getQualityProfiles.mockRejectedValue(new Error('API down'));
    mockSonarrClientInstance.addSeries.mockResolvedValue({ id: 1, title: 'Test Show' });

    const request = new Request('http://localhost/api/add/tv', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tmdbId: mockTmdbId }),
    });
    await POST(request);
    expect(mockSonarrClientInstance.addSeries).toHaveBeenCalledWith(expect.objectContaining({ qualityProfileId: 1 }));
  });

});


