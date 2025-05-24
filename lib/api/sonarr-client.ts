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
}
