import { useState, useEffect } from 'react';

interface LibraryStatus {
  libraryTmdbIds: Set<number>;
  isLoading: boolean;
  error: string | null;
  radarrError: string | null;
  sonarrError: string | null;
}

export function useLibraryStatus(): LibraryStatus {
  // These state variables are not currently used in the component
  // const [radarrTmdbIds, setRadarrTmdbIds] = useState<number[]>([]);
  // const [sonarrTmdbIds, setSonarrTmdbIds] = useState<number[]>([]);
  const [libraryTmdbIds, setLibraryTmdbIds] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [radarrError, setRadarrError] = useState<string | null>(null);
  const [sonarrError, setSonarrError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLibraryStatus = async () => {
      setIsLoading(true);
      // Initialize local error trackers for this fetch operation
      let currentRadarrError: string | null = null;
      let currentSonarrError: string | null = null;
      const combinedIds = new Set<number>();
      let overallFetchFailed = false; // Tracks if any fetch threw a network-level error

      try {
        // Fetch Radarr library TMDB IDs
        const radarrResponse = await fetch('/api/radarr/library');
        if (!radarrResponse.ok) {
          const radarrData = await radarrResponse.json().catch(() => ({ error: 'Failed to parse Radarr error response' }));
          currentRadarrError = `Radarr: ${radarrData.error || radarrResponse.statusText}`;
          console.error('Error fetching Radarr library:', currentRadarrError);
        } else {
          const radarrData = await radarrResponse.json();
          if (radarrData.tmdbIds && Array.isArray(radarrData.tmdbIds)) {
            // setRadarrTmdbIds(radarrData.tmdbIds); // Not strictly needed for combined set
            radarrData.tmdbIds.forEach((id: number) => combinedIds.add(id));
          } else {
            console.warn('Radarr library response did not contain expected tmdbIds array:', radarrData);
            currentRadarrError = 'Radarr: Invalid response format.';
          }
        }
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'Network error';
        currentRadarrError = `Radarr: ${errorMessage}`;
        console.error('Network error fetching Radarr library:', e);
        overallFetchFailed = true;
      }

      try {
        // Fetch Sonarr library TMDB IDs
        const sonarrResponse = await fetch('/api/sonarr/library');
        if (!sonarrResponse.ok) {
          const sonarrData = await sonarrResponse.json().catch(() => ({ error: 'Failed to parse Sonarr error response' }));
          currentSonarrError = `Sonarr: ${sonarrData.error || sonarrResponse.statusText}`;
          console.error('Error fetching Sonarr library:', currentSonarrError);
        } else {
          const sonarrData = await sonarrResponse.json();
          if (sonarrData.tmdbIds && Array.isArray(sonarrData.tmdbIds)) {
            // setSonarrTmdbIds(sonarrData.tmdbIds); // Not strictly needed for combined set
            sonarrData.tmdbIds.forEach((id: number) => combinedIds.add(id));
          } else {
            console.warn('Sonarr library response did not contain expected tmdbIds array:', sonarrData);
            currentSonarrError = 'Sonarr: Invalid response format.';
          }
        }
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'Network error';
        currentSonarrError = `Sonarr: ${errorMessage}`;
        console.error('Network error fetching Sonarr library:', e);
        overallFetchFailed = true;
      }
      
      // Set states based on the results of this fetch operation
      setRadarrError(currentRadarrError);
      setSonarrError(currentSonarrError);
      setLibraryTmdbIds(combinedIds);

      if (currentRadarrError || currentSonarrError) {
        const combinedErrorMessage = [];
        if (currentRadarrError) combinedErrorMessage.push(currentRadarrError);
        if (currentSonarrError) combinedErrorMessage.push(currentSonarrError);
        setError(combinedErrorMessage.join('; '));
      } else if (overallFetchFailed) {
        // This case should ideally be covered by specific errors now,
        // but kept as a fallback.
        setError('One or more library fetches failed.');
      } else {
        setError(null); // Clear any previous global error if all successful
      }
      setIsLoading(false);
    };

    fetchLibraryStatus();
  }, []); // Empty dependency array means this effect runs once on mount

  return { libraryTmdbIds, isLoading, error, radarrError, sonarrError };
}
