/**
 * Sonarr API Client
 * 
 * This client is responsible for interacting with the Sonarr API
 * to add and manage TV series.
 */

export interface SonarrSeriesData {
  tvdbId: number;
  title: string;
  year: number;
  qualityProfileId: number;
  rootFolderPath: string;
  seasonFolder: boolean;
  monitored: boolean;
  addOptions: {
    ignoreEpisodesWithFiles: boolean;
    ignoreEpisodesWithoutFiles: boolean;
    searchForMissingEpisodes: boolean;
  };
}

export interface SonarrSeriesResponse {
  id: number;
  title: string;
  tvdbId: number;
  year: number;
  [key: string]: any;
}

export interface SonarrQualityProfile {
  id: number;
  name: string;
  // Add other relevant fields from Sonarr's API if needed
}

export class SonarrClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  /**
   * Add a TV series to Sonarr
   * @param seriesData Series data to add
   * @returns The added series data
   */
  async addSeries(seriesData: SonarrSeriesData): Promise<SonarrSeriesResponse> {
    const url = `${this.baseUrl}/api/v3/series`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'X-Api-Key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(seriesData),
    });

    if (!response.ok) {
      throw new Error(`Failed to add series to Sonarr: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get all quality profiles from Sonarr
   * @returns A list of quality profiles
   */
  async getQualityProfiles(): Promise<SonarrQualityProfile[]> {
    const url = `${this.baseUrl}/api/v3/qualityprofile`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Api-Key': this.apiKey,
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch quality profiles from Sonarr: ${response.status} ${response.statusText}`);
      // Return an empty array or throw an error based on desired error handling
      return []; 
    }
    return await response.json();
  }

  /**
   * Get all TMDB IDs of series in the Sonarr library
   * @returns A promise that resolves to an array of TMDB IDs
   */
  async getLibraryTmdbIds(): Promise<number[]> {
    try {
      const url = `${this.baseUrl}/api/v3/series`;
      console.log(`[SonarrClient] Fetching all series from Sonarr: ${url}`);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-Api-Key': this.apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        let errorText = '';
        try {
          errorText = await response.text();
        } catch (e) {
          // Ignore if can't read text
        }
        throw new Error(
          `Failed to get series from Sonarr: ${response.status} ${response.statusText} ${errorText ? '- ' + errorText : ''}`
        );
      }

      const seriesList: SonarrSeriesResponse[] = await response.json();
      // Sonarr's series objects should have a tmdbId field.
      const tmdbIds = seriesList
        .map(series => series.tmdbId) // Assuming tmdbId is directly available and is a number
        .filter(id => typeof id === 'number' && !isNaN(id));
      
      console.log(`[SonarrClient] Found ${tmdbIds.length} series in Sonarr library with TMDB IDs.`);
      return tmdbIds;
    } catch (error) {
      console.error('[SonarrClient] Error getting library TMDB IDs from Sonarr:', error);
      throw error; // Rethrow to let the caller handle it
    }
  }
}
