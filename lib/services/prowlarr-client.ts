/**
 * ProwlarrClient
 * 
 * A client for interacting with the Prowlarr API to search for torrents
 */
import { FeaturedItem } from '../types/featured';

// Define category object type as returned by some indexers
interface ProwlarrCategory {
  id: number;
  name: string;
}

// Define the shape of a Prowlarr search result
interface ProwlarrResult {
  guid: string;
  title: string;
  indexer: string;
  publishDate: string;
  size: number;
  seeders: number;
  leechers: number;
  categories: (string | ProwlarrCategory)[]; // Categories can be strings or objects with name property
  downloadUrl: string;
  infoUrl: string;
  protocol: string;
}

// Define search parameters
export interface SearchParams {
  query?: string;
  categories?: string[];
  limit?: number;
  offset?: number;
  minSeeders?: number;
  type?: 'movie' | 'tv' | 'search';
}

export class ProwlarrClient {
  private apiUrl: string;
  private apiKey: string;
  
  constructor(apiUrl: string, apiKey: string) {
    // Ensure apiUrl doesn't end with a slash
    this.apiUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
    this.apiKey = apiKey;
  }
  
  /**
   * Search for torrents using the Prowlarr API
   */
  async search(params: SearchParams): Promise<ProwlarrResult[]> {
    try {
      console.log(`[ProwlarrClient] Searching with params:`, {
        query: params.query,
        categories: params.categories,
        limit: params.limit,
        type: params.type
      });
      
      // Construct the search URL with query parameters
      const queryParams: Record<string, string> = {
        apikey: this.apiKey,
        query: params.query || '*',
        limit: (params.limit || 100).toString(),
        offset: (params.offset || 0).toString()
      };
      
      // Add categories if specified
      if (params.categories && params.categories.length > 0) {
        queryParams.categories = params.categories.join(',');
      }
      
      // Add type-specific parameters
      if (params.type === 'movie') {
        queryParams.type = 'movie';
        // Ensure we're searching in movie categories if none specified
        if (!params.categories || params.categories.length === 0) {
          queryParams.categories = '2000';
        }
      } else if (params.type === 'tv') {
        queryParams.type = 'tvsearch';
        // Ensure we're searching in TV categories if none specified
        if (!params.categories || params.categories.length === 0) {
          queryParams.categories = '5000';
        }
      }
      
      const queryString = new URLSearchParams(queryParams).toString();
      const url = `${this.apiUrl}/api/v1/search?${queryString}`;
      
      // Log the full URL (with API key partially hidden for security)
      const logUrl = url.replace(this.apiKey, this.apiKey.substring(0, 5) + '...' + this.apiKey.substring(this.apiKey.length - 3));
      console.log(`[ProwlarrClient] Making API request to: ${logUrl}`);
      
      // Make the request
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error(`[ProwlarrClient] API request failed: ${response.status} ${response.statusText}`);
        try {
          const errorText = await response.text();
          console.error(`[ProwlarrClient] Error response: ${errorText}`);
        } catch (e) {
          console.error('[ProwlarrClient] Could not read error response');
        }
        return [];
      }
      
      console.log(`[ProwlarrClient] API request successful: ${response.status}`);
      
      
      const data = await response.json();
      
      if (!Array.isArray(data)) {
        console.warn('[ProwlarrClient] Unexpected response format:', data);
        return [];
      }
      
      // Filter results by minimum seeders if specified
      let results = data as ProwlarrResult[];
      
      if (params.minSeeders && params.minSeeders > 0) {
        results = results.filter(result => result.seeders >= (params.minSeeders || 0));
      }
      
      console.log(`[ProwlarrClient] Search returned ${results.length} results`);
      return results;
    } catch (error) {
      console.error('[ProwlarrClient] Search error:', error);
      return [];
    }
  }
  
  /**
   * Convert a Prowlarr result to a FeaturedItem
   */
  convertToFeaturedItem(result: ProwlarrResult): FeaturedItem {
    // Extract year from title if possible
    const yearMatch = result.title.match(/\b(19|20)\d{2}\b/);
    const year = yearMatch ? parseInt(yearMatch[0]) : new Date().getFullYear();
    
    // Extract quality from title if possible
    const qualityMatch = result.title.match(/\b(720p|1080p|2160p|4K)\b/i);
    const quality = qualityMatch ? qualityMatch[0].toLowerCase() : undefined;
    
    // Determine media type based on categories
    // Handle both string categories and object categories with name property
    const isTV = result.categories.some(cat => {
      // Check if category is an object with a name property
      const categoryStr = typeof cat === 'object' && cat !== null && cat.name ? 
        cat.name.toString() : 
        (typeof cat === 'string' ? cat : String(cat));
      
      return categoryStr.toLowerCase().includes('tv') || 
             categoryStr.toLowerCase().includes('series') ||
             categoryStr.toLowerCase().includes('show');
    });
    
    // Generate a unique ID
    const id = `prowlarr-${result.guid.replace(/[^a-zA-Z0-9]/g, '')}`;
    
    // Create a basic featured item
    return {
      id,
      guid: result.guid,
      title: this.cleanTitle(result.title),
      overview: result.title, // Use full title as overview initially
      backdropPath: '/api/placeholder/1920/1080', // Placeholder until enriched
      posterPath: '/api/placeholder/500/750', // Placeholder until enriched
      mediaType: isTV ? 'tv' : 'movie',
      rating: 0, // Will be enriched later
      year,
      genres: [], // Will be enriched later
      quality,
      size: result.size,
      seeders: result.seeders,
      leechers: result.leechers,
      publishDate: result.publishDate,
      downloadUrl: result.downloadUrl,
      infoUrl: result.infoUrl,
      inLibrary: false, // Will be checked later
      downloading: false, // Will be checked later
      tmdbAvailable: false // Will be enriched later
    };
  }
  
  /**
   * Clean up torrent title to make it more presentable
   */
  private cleanTitle(title: string): string {
    // Remove common torrent naming patterns
    let cleaned = title
      .replace(/\b(720p|1080p|2160p|4K|HDTV|WEB-DL|WEBRip|BRRip|BluRay|x264|x265|HEVC|AAC|AC3|REMUX)\b/gi, '')
      .replace(/\b(XviD|DTS|DD5\.1|FLAC|YIFY|RARBG|SPARKS|DRONES|AMIABLE|FGT|VYNDROS)\b/gi, '')
      .replace(/\[.*?\]|\(.*?\)|\{.*?\}/g, '')
      .replace(/\.\w{2,4}$/, '') // Remove file extension
      .replace(/\./g, ' ')
      .replace(/-/g, ' ')
      .replace(/_/g, ' ')
      .replace(/\s+/g, ' ') // Replace multiple spaces with a single space
      .trim();
    
    // Capitalize first letter of each word
    cleaned = cleaned.replace(/\b\w/g, c => c.toUpperCase());
    
    return cleaned;
  }
}
