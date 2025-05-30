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

export interface SonarrRootFolder {
  id: number;
  path: string;
  freeSpace?: number;
  totalSpace?: number;
  unmappedFolders?: any[]; // Or a more specific type if known
  accessible: boolean;
  [key: string]: any; // For any other properties Sonarr might send
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
    const seriesDataToUse = { ...seriesData }; // Create a mutable copy

    // If no root folder path is specified, try to get the first available one
    if (!seriesDataToUse.rootFolderPath) {
      try {
        const rootFolders = await this.getRootFolders();
        if (rootFolders.length > 0 && rootFolders[0].path) {
          seriesDataToUse.rootFolderPath = rootFolders[0].path;
          console.log(`[Sonarr AddSeries] Using Sonarr root folder path: ${rootFolders[0].path}`);
        } else {
          throw new Error('No root folders found or accessible in Sonarr. Please configure one in Sonarr.');
        }
      } catch (error) {
        console.error('[Sonarr AddSeries] Error fetching or using Sonarr root folders:', error);
        // Re-throw or handle as appropriate, ensuring the original error message is preserved or enhanced
        throw new Error(`Failed to determine Sonarr root folder: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    const url = `${this.baseUrl}/api/v3/series`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'X-Api-Key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(seriesDataToUse),
    });

    if (!response.ok) {
      let sonarrErrorMessage = '';
      try {
        const errorData = await response.json();
        // Sonarr errors are often an array of objects with a 'errorMessage' field
        if (Array.isArray(errorData) && errorData.length > 0 && errorData[0].errorMessage) {
          sonarrErrorMessage = errorData.map((err: any) => err.errorMessage || 'Unknown Sonarr error detail').join(', ');
        } else if (errorData.message) { // Or sometimes a single object with 'message'
          sonarrErrorMessage = errorData.message;
        } else if (errorData.error) { // Or 'error'
          sonarrErrorMessage = errorData.error;
        }
      } catch (e) {
        // Failed to parse error JSON, or it's not in expected format
        sonarrErrorMessage = 'Could not parse Sonarr error response.';
      }
      throw new Error(`Failed to add series to Sonarr: ${response.status} ${response.statusText}. Sonarr's message: ${sonarrErrorMessage || 'No specific message from Sonarr.'}`);
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
  /**
   * Get root folders from Sonarr.
   * @returns A promise that resolves to an array of SonarrRootFolder objects.
   */
  async getRootFolders(): Promise<SonarrRootFolder[]> {
    const url = `${this.baseUrl}/api/v3/rootfolder`;
    try {
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
        } catch (e) { /* ignore */ }
        throw new Error(`Failed to get root folders from Sonarr: ${response.status} ${response.statusText}${errorText ? ' - ' + errorText : ''}`);
      }
      const rootFolders: SonarrRootFolder[] = await response.json();
      console.log(`[SonarrClient] Found ${rootFolders.length} root folders in Sonarr.`);
      // Filter for accessible root folders if necessary, though Sonarr usually only returns accessible ones
      return rootFolders.filter(rf => rf.accessible && rf.path);
    } catch (error) {
      console.error('[SonarrClient] Error getting root folders from Sonarr:', error);
      // Depending on desired behavior, you might re-throw or return empty
      // For now, re-throwing to make it clear to the caller that this step failed.
      throw error; 
    }
  }

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
