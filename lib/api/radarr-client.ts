/**
 * Radarr API Client
 * 
 * This client is responsible for interacting with the Radarr API
 * to add and manage movies.
 */

export interface RadarrMovieData {
  tmdbId: number;
  title: string;
  year: number;
  qualityProfileId: number;
  rootFolderPath: string;
  minimumAvailability: string;
  monitored: boolean;
}

export interface RadarrMovieResponse {
  id: number;
  title: string;
  tmdbId: number;
  year: number;
  [key: string]: any;
}

export class RadarrClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  /**
   * Add a movie to Radarr
   * @param movieData Movie data to add
   * @returns The added movie data
   */
  async addMovie(movieData: RadarrMovieData): Promise<RadarrMovieResponse> {
    const url = `${this.baseUrl}/api/v3/movie`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'X-Api-Key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(movieData),
    });

    if (!response.ok) {
      throw new Error(`Failed to add movie to Radarr: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }
}
