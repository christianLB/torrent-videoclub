import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { useLibraryStatus } from '@/lib/useLibraryStatus';

// Define the expected response type for the library APIs
interface LibraryResponse {
  tmdbIds?: number[];
  error?: string;
}

// Mock server setup
const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('useLibraryStatus', () => {
  it('should initialize with loading state and empty data', () => {
    const { result } = renderHook(() => useLibraryStatus());
    expect(result.current.isLoading).toBe(true);
    expect(result.current.libraryTmdbIds.size).toBe(0);
    expect(result.current.error).toBeNull();
    expect(result.current.radarrError).toBeNull();
    expect(result.current.sonarrError).toBeNull();
  });

  it('should fetch and combine TMDB IDs from Radarr and Sonarr successfully', async () => {
    const radarrMockTmdbIds = [1, 2, 3];
    const sonarrMockTmdbIds = [3, 4, 5];
    const expectedCombinedIds = new Set([1, 2, 3, 4, 5]);

    server.use(
      http.get('/api/radarr/library', () => {
        return HttpResponse.json({ tmdbIds: radarrMockTmdbIds });
      }),
      http.get('/api/sonarr/library', () => {
        return HttpResponse.json({ tmdbIds: sonarrMockTmdbIds });
      })
    );

    const { result } = renderHook(() => useLibraryStatus());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.libraryTmdbIds).toEqual(expectedCombinedIds);
    expect(result.current.error).toBeNull();
    expect(result.current.radarrError).toBeNull();
    expect(result.current.sonarrError).toBeNull();
  });

  it('should handle Radarr API error and still fetch Sonarr data', async () => {
    const sonarrMockTmdbIds = [10, 11];
    const expectedCombinedIds = new Set([10, 11]);
    const radarrErrorMessage = 'Radarr: Server Error';

    server.use(
      http.get('/api/radarr/library', () => {
        return HttpResponse.json({ error: 'Server Error' }, { status: 500 });
      }),
      http.get('/api/sonarr/library', () => {
        return HttpResponse.json({ tmdbIds: sonarrMockTmdbIds });
      })
    );

    const { result } = renderHook(() => useLibraryStatus());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.libraryTmdbIds).toEqual(expectedCombinedIds);
    expect(result.current.radarrError).toBe(radarrErrorMessage);
    expect(result.current.sonarrError).toBeNull();
    expect(result.current.error).toBe(radarrErrorMessage);
  });

  it('should handle Sonarr API error and still fetch Radarr data', async () => {
    const radarrMockTmdbIds = [1, 2];
    const expectedCombinedIds = new Set([1, 2]);
    const sonarrErrorMessage = 'Sonarr: Not Found';

    server.use(
      http.get('/api/radarr/library', () => {
        return HttpResponse.json({ tmdbIds: radarrMockTmdbIds });
      }),
      http.get('/api/sonarr/library', () => {
        return HttpResponse.json({ error: 'Not Found' }, { status: 404 });
      })
    );

    const { result } = renderHook(() => useLibraryStatus());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.libraryTmdbIds).toEqual(expectedCombinedIds);
    expect(result.current.radarrError).toBeNull();
    expect(result.current.sonarrError).toBe(sonarrErrorMessage);
    expect(result.current.error).toBe(sonarrErrorMessage);
  });

  it('should handle errors from both Radarr and Sonarr APIs', async () => {
    const radarrErrorMessage = 'Radarr: Service Unavailable';
    const sonarrErrorMessage = 'Sonarr: Gateway Timeout';

    server.use(
      http.get('/api/radarr/library', () => {
        return HttpResponse.json({ error: 'Service Unavailable' }, { status: 503 });
      }),
      http.get('/api/sonarr/library', () => {
        return HttpResponse.json({ error: 'Gateway Timeout' }, { status: 504 });
      })
    );

    const { result } = renderHook(() => useLibraryStatus());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.libraryTmdbIds.size).toBe(0);
    expect(result.current.radarrError).toBe(radarrErrorMessage);
    expect(result.current.sonarrError).toBe(sonarrErrorMessage);
    expect(result.current.error).toBe(`${radarrErrorMessage}; ${sonarrErrorMessage}`);
  });

   it('should handle empty tmdbIds arrays from services', async () => {
    server.use(
      http.get('/api/radarr/library', () => {
        return HttpResponse.json({ tmdbIds: [] });
      }),
      http.get('/api/sonarr/library', () => {
        return HttpResponse.json({ tmdbIds: [] });
      })
    );

    const { result } = renderHook(() => useLibraryStatus());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.libraryTmdbIds.size).toBe(0);
    expect(result.current.error).toBeNull();
    expect(result.current.radarrError).toBeNull();
    expect(result.current.sonarrError).toBeNull();
  });

  it('should handle invalid response format (missing tmdbIds)', async () => {
    server.use(
      http.get('/api/radarr/library', () => {
        // Simulate a response that is successful but doesn't contain tmdbIds array
        return HttpResponse.json({ /* tmdbIds is missing */ } as Partial<LibraryResponse>);
      }),
      http.get('/api/sonarr/library', () => {
        return HttpResponse.json({ tmdbIds: [7, 8] });
      })
    );

    const { result } = renderHook(() => useLibraryStatus());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.libraryTmdbIds).toEqual(new Set([7, 8]));
    expect(result.current.radarrError).toBe('Radarr: Invalid response format.');
    expect(result.current.sonarrError).toBeNull();
    expect(result.current.error).toBe('Radarr: Invalid response format.');
  });

});
