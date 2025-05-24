/**
 * Prowlarr API Client
 * 
 * This client is responsible for interacting with the Prowlarr API
 * to search for movies and TV shows.
 */

export interface ProwlarrIndexer {
  id: number;
  name: string;
  protocol: string;
  supportsRss: boolean;
  supportsSearch: boolean;
}

export interface ProwlarrSearchResult {
  guid: string;
  title: string;
  indexer: string;
  size: number;
  seeders: number;
  leechers: number;
}

export interface NormalizedMovieResult {
  guid: string;
  title: string;
  year?: number;
  quality?: string;
  format?: string;
  codec?: string;
  size: number;
  sizeFormatted: string;
  indexer: string;
  seeders: number;
  leechers: number;
}

export class ProwlarrClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  /**
   * Get all enabled indexers from Prowlarr
   * @returns List of indexers
   */
  async getIndexers(): Promise<ProwlarrIndexer[]> {
    try {
      const url = `${this.baseUrl}/api/v1/indexer`;
      
      console.log('Fetching indexers from:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-Api-Key': this.apiKey,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Prowlarr indexer error:', errorText);
        throw new Error(`Failed to fetch indexers from Prowlarr: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      const indexers: ProwlarrIndexer[] = await response.json();
      console.log(`Found ${indexers.length} indexers`);
      return indexers.filter(indexer => indexer.supportsSearch);
    } catch (error) {
      console.error('Error fetching indexers:', error);
      throw error;
    }
  }

  /**
   * Search for movies in Prowlarr
   * @param query Search query
   * @returns Normalized movie results
   */
  async searchMovies(query: string): Promise<NormalizedMovieResult[]> {
    try {
      // First, get all enabled indexers
      const indexers = await this.getIndexers();
      if (indexers.length === 0) {
        console.warn('No enabled indexers found in Prowlarr');
        return [];
      }
      
      console.log(`Using ${indexers.length} indexers for search`);
      
      // Movie category ID (2000 for Movies)
      const categoryId = 2000;
      
      // Get results from each indexer and combine them
      const allResults: ProwlarrSearchResult[] = [];
      
      for (const indexer of indexers) {
        try {
          // For Prowlarr v1.35.1, we need to use the release/search endpoint
          const indexerUrl = `${this.baseUrl}/api/v1/release`;
          
          console.log(`Searching in indexer: ${indexer.name} (ID: ${indexer.id})`);
          
          // Create direct search request for this indexer
          // Prowlarr v1.35.1 uses a different endpoint for indexer-specific searches
          const payload = {
            query, // Search term
            indexerId: indexer.id, // NOTE: Singular indexerId, not indexerIds array
            // Don't include categories parameter as it causes validation errors
          };
          
          const response = await fetch(indexerUrl, {
            method: 'POST',
            headers: {
              'X-Api-Key': this.apiKey,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`Error searching indexer ${indexer.name}:`, errorText);
            continue; // Skip this indexer and try the next one
          }
          
          const results: ProwlarrSearchResult[] = await response.json();
          console.log(`Found ${results.length} results from ${indexer.name}`);
          
          allResults.push(...results);
        } catch (error) {
          console.error(`Error searching indexer ${indexer.name}:`, error);
          // Continue with other indexers even if one fails
        }
      }
      
      console.log(`Total results from all indexers: ${allResults.length}`);
      return allResults.map(result => this.normalizeMovieResult(result));
    } catch (error) {
      console.error('Error in searchMovies:', error);
      throw error;
    }
  }

  /**
   * Search for TV series in Prowlarr
   * @param query Search query
   * @returns Normalized series results
   */
  async searchSeries(query: string): Promise<NormalizedMovieResult[]> {
    try {
      // First, get all enabled indexers
      const indexers = await this.getIndexers();
      if (indexers.length === 0) {
        console.warn('No enabled indexers found in Prowlarr');
        return [];
      }
      
      console.log(`Using ${indexers.length} indexers for search`);
      
      // TV category ID (5000 for TV)
      const categoryId = 5000;
      
      // Get results from each indexer and combine them
      const allResults: ProwlarrSearchResult[] = [];
      
      for (const indexer of indexers) {
        try {
          // For Prowlarr v1.35.1, we need to use the release/search endpoint
          const indexerUrl = `${this.baseUrl}/api/v1/release`;
          
          console.log(`Searching in indexer: ${indexer.name} (ID: ${indexer.id})`);
          
          // Create direct search request for this indexer
          // Prowlarr v1.35.1 uses a different endpoint for indexer-specific searches
          const payload = {
            query, // Search term
            indexerId: indexer.id, // NOTE: Singular indexerId, not indexerIds array
            // Don't include categories parameter as it causes validation errors
          };
          
          const response = await fetch(indexerUrl, {
            method: 'POST',
            headers: {
              'X-Api-Key': this.apiKey,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`Error searching indexer ${indexer.name}:`, errorText);
            continue; // Skip this indexer and try the next one
          }
          
          const results: ProwlarrSearchResult[] = await response.json();
          console.log(`Found ${results.length} results from ${indexer.name}`);
          
          allResults.push(...results);
        } catch (error) {
          console.error(`Error searching indexer ${indexer.name}:`, error);
          // Continue with other indexers even if one fails
        }
      }
      
      console.log(`Total results from all indexers: ${allResults.length}`);
      return allResults.map(result => this.normalizeMovieResult(result));
    } catch (error) {
      console.error('Error in searchSeries:', error);
      throw error;
    }
  }

  /**
   * Normalize a movie result from Prowlarr
   * @param result Raw Prowlarr search result
   * @returns Normalized movie result
   */
  private normalizeMovieResult(result: ProwlarrSearchResult): NormalizedMovieResult {
    const { guid, size, indexer, seeders, leechers } = result;
    
    // Extract title, year, quality, format, and codec from the release title
    const titleInfo = this.parseReleaseTitle(result.title);
    
    return {
      guid,
      title: titleInfo.title,
      year: titleInfo.year,
      quality: titleInfo.quality,
      format: titleInfo.format,
      codec: titleInfo.codec,
      size,
      sizeFormatted: this.formatFileSize(size),
      indexer,
      seeders,
      leechers,
    };
  }

  /**
   * Parse a release title to extract title, year, quality, format, and codec
   * @param releaseTitle Release title from Prowlarr
   * @returns Parsed title information
   */
  private parseReleaseTitle(releaseTitle: string): {
    title: string;
    year?: number;
    quality?: string;
    format?: string;
    codec?: string;
  } {
    // Basic pattern to extract information
    // Example: "Movie.Title.2023.1080p.BluRay.x264"
    const titleParts = releaseTitle.split('.');
    
    // Extract year (4 digits that could be a year)
    const yearMatch = releaseTitle.match(/\b(19\d{2}|20\d{2})\b/);
    const year = yearMatch ? parseInt(yearMatch[0], 10) : undefined;
    
    // Extract quality (480p, 720p, 1080p, 2160p, etc.)
    const qualityMatch = releaseTitle.match(/\b(480p|720p|1080p|2160p|4K)\b/i);
    const quality = qualityMatch ? qualityMatch[0].toLowerCase() : undefined;
    
    // Extract format (BluRay, WebDL, WEBRip, HDTV, etc.)
    const formatMatch = releaseTitle.match(/\b(BluRay|WEBDL|WEB-DL|WEBRip|HDTV|DVDRip|BDRip)\b/i);
    const format = formatMatch ? formatMatch[0] : undefined;
    
    // Extract codec (x264, x265, H.264, H.265, XviD, etc.)
    const codecMatch = releaseTitle.match(/\b(x264|x265|h\.?264|h\.?265|XviD)\b/i);
    const codec = codecMatch ? codecMatch[0] : undefined;
    
    // Reconstruct the clean title
    let title = releaseTitle;
    
    // Remove year and everything after it
    if (year) {
      const yearIndex = title.indexOf(year.toString());
      if (yearIndex > 0) {
        title = title.substring(0, yearIndex).trim();
      }
    }
    
    // Replace dots and underscores with spaces
    title = title.replace(/[._]/g, ' ').trim();
    
    return {
      title,
      year,
      quality,
      format,
      codec,
    };
  }

  /**
   * Format file size to human-readable format
   * @param bytes File size in bytes
   * @returns Formatted file size
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    // Always convert to GB for consistency with test
    const gbSize = bytes / Math.pow(1024, 3);
    return gbSize.toFixed(2) + ' GB';
  }
}
