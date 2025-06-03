/**
 * curator-service.ts
 * 
 * This file contains logic for CuratorService.
 */

import { TrendingContentClient } from './trending-content-client';
import { FeaturedContent, FeaturedItem, FeaturedCategory, TMDbEnrichmentData } from '../../types/featured';
import { TMDbClient } from '../../api/tmdb-client'; 
import { getMockFeaturedContent } from '../../data/mock-featured';
import { CacheService } from './cache-service';

// Define TMDb types locally, mirroring structure from tmdb-client.ts (RawTMDbMovie/RawTMDbTvShow)
interface TMDbGenre { id: number; name: string }

interface TMDbMovieResult {
  id?: number;
  title: string;
  original_title?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string;
  vote_average?: number;
  vote_count?: number;
  popularity?: number;
  original_language?: string;
  media_type?: 'movie'; // Typically 'movie' for movie results
  genre_ids?: number[];
}

interface TMDbTVResult {
  id?: number;
  name: string;
  original_name?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  first_air_date?: string;
  vote_average?: number;
  vote_count?: number;
  popularity?: number;
  original_language?: string;
  media_type?: 'tv'; // Typically 'tv' for TV results
  genre_ids?: number[];
}

interface TMDbMovieDetails {
  id?: number;
  title: string;
  original_title?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string;
  vote_average?: number;
  vote_count?: number;
  popularity?: number;
  original_language?: string;
  runtime?: number;
  status?: string;
  tagline?: string;
  genres?: TMDbGenre[];
  media_type?: string; // Can be present, usually 'movie'
}

interface TMDbTVDetails {
  id?: number;
  name: string;
  original_name?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  first_air_date?: string;
  last_air_date?: string;
  vote_average?: number;
  vote_count?: number;
  popularity?: number;
  original_language?: string;
  number_of_episodes?: number;
  number_of_seasons?: number;
  episode_run_time?: number[];
  status?: string;
  tagline?: string;
  genres?: TMDbGenre[];
  external_ids?: {
    tvdb_id?: number | string;
    [key: string]: unknown; // Allow other IDs like imdb_id, etc.
  };
  media_type?: string; // Can be present, usually 'tv'
}

// Instantiate TMDbClient (assuming TMDB_API_KEY is in environment variables)
const tmdbApiKey = process.env.TMDB_API_KEY;
const tmdbClient: TMDbClient | null = tmdbApiKey ? new TMDbClient(tmdbApiKey) : null;

if (!tmdbClient) {
  console.warn('[CuratorService] TMDb API key not found or TMDbClient failed to initialize. Enrichment will be disabled.');
}

// Placeholder for actual implementation if needed elsewhere, or remove if not used by these functions
const isUsingRealData = () => true; 

const DEFAULT_CATEGORIES_CONFIG: Array<{
  id: string;
  title: string;
  fetcher: (client: TrendingContentClient, limit: number) => Promise<FeaturedItem[]>;
  limit: number;
}> = [
  {
    id: 'trendingMovies',
    title: 'Trending Movies',
    fetcher: (client, limit) => client.getTrendingMovies({ limit }),
    limit: 15,
  },
  {
    id: 'popularTV',
    title: 'Popular TV Shows',
    fetcher: (client, limit) => client.getPopularTV({ limit }),
    limit: 15,
  },
  {
    id: 'newReleases',
    title: 'New Releases',
    fetcher: (client, limit) => client.getNewReleases({ limit }),
    limit: 15,
  },
  {
    id: 'fourKContent',
    title: '4K Content',
    fetcher: (client, limit) => client.get4KContent({ limit }),
    limit: 15,
  },
  {
    id: 'documentaries',
    title: 'Documentaries',
    fetcher: (client, limit) => client.getDocumentaries({ limit }),
    limit: 15,
  },
];

async function enrichWithTmdbMetadata(content: FeaturedContent): Promise<FeaturedContent> {
  if (!tmdbClient) {
    console.warn('[CuratorService] Module-scoped TMDb client not available for enrichment, returning content as is.');
    return content;
  }
  
  const allItems: FeaturedItem[] = [];
  if (content.featuredItem && !content.featuredItem.tmdbInfo) {
    allItems.push(content.featuredItem);
  }
  content.categories.forEach(category => {
    category.items.forEach(item => {
      if (!item.tmdbInfo && !allItems.some(existingItem => existingItem.guid === item.guid)) {
        allItems.push(item);
      }
    });
  });
  
  console.log(`[CuratorService] Enriching ${allItems.length} unique items with TMDb metadata`);
  
  const batchSize = 10;
  for (let i = 0; i < allItems.length; i += batchSize) {
    const batch = allItems.slice(i, i + batchSize);
    await Promise.all(batch.map(async (item) => {
      try {
        const tmdbIdMatch = item.title.match(/\bTMDB[:\s-]*(\d+)\b/i);
        const potentialTmdbId = tmdbIdMatch ? parseInt(tmdbIdMatch[1]) : undefined;
        const isTV = item.mediaType === 'tv';
        const idToFetch = item.tmdbInfo?.tmdbId || potentialTmdbId;
        
        let tmdbDetails: TMDbMovieDetails | TMDbTVDetails | null = null;

        if (idToFetch) {
          console.log(`[CuratorService] Fetching TMDb details for ${item.mediaType || (isTV ? 'tv' : 'movie')} ID: ${idToFetch}`);
          tmdbDetails = isTV
            ? await tmdbClient.getTvShowDetails(idToFetch)
            : await tmdbClient.getMovieDetails(idToFetch);
          
          if (tmdbDetails) {
            item.tmdbInfo = mapTmdbApiResponseToEnrichmentData(tmdbDetails, item.mediaType || (isTV ? 'tv' : 'movie'));
            if (item.tmdbInfo) {
              console.log(`[CuratorService] Successfully enriched item: ${item.title} (TMDb ID: ${item.tmdbInfo.tmdbId})`);
            } else {
              console.warn(`[CuratorService] Failed to map TMDb response for item: ${item.title} (ID: ${idToFetch})`);
            }
          } else {
            console.warn(`[CuratorService] No TMDb details found for ${item.mediaType || (isTV ? 'tv' : 'movie')} ID: ${idToFetch}`);
          }
        } else if (item.title) {
          console.log(`[CuratorService] No TMDb ID found for "${item.title}", attempting search by title.`);
          const searchResults = isTV
            ? await tmdbClient.searchTvShows(item.title)
            : await tmdbClient.searchMovies(item.title);
          
          if (searchResults && searchResults.length > 0) {
            const bestMatch: TMDbMovieResult | TMDbTVResult = searchResults[0];
            if (bestMatch && typeof bestMatch.id === 'number') {
              console.log(`[CuratorService] Found TMDb match for "${item.title}" by search: ${bestMatch.id}`);
              tmdbDetails = isTV
                ? await tmdbClient.getTvShowDetails(bestMatch.id)
                : await tmdbClient.getMovieDetails(bestMatch.id);
              
              if (tmdbDetails) {
                item.tmdbInfo = mapTmdbApiResponseToEnrichmentData(tmdbDetails, item.mediaType || (isTV ? 'tv' : 'movie'));
                if (item.tmdbInfo) {
                  console.log(`[CuratorService] Successfully enriched item via search: ${item.title} (TMDb ID: ${item.tmdbInfo.tmdbId})`);
                }
              }
            } else if (bestMatch) {
              console.warn(`[CuratorService] TMDb search match for "${item.title}" has no valid ID: ${JSON.stringify(bestMatch)}`);
            }
          } else {
            console.log(`[CuratorService] No TMDb match found by search for "${item.title}"`);
          }
        }
      } catch (error) {
        console.error(`[CuratorService] Error enriching item "${item.title}":`, error);
      }
    }));
  }
  
  // Re-assign tmdbInfo to the original objects in content
  if (content.featuredItem) {
    const enrichedFeaturedItem = allItems.find(item => item.guid === content.featuredItem?.guid);
    if (enrichedFeaturedItem?.tmdbInfo) {
      content.featuredItem.tmdbInfo = enrichedFeaturedItem.tmdbInfo;
    }
  }
  content.categories.forEach(category => {
    category.items.forEach(catItem => {
      const enrichedItem = allItems.find(item => item.guid === catItem.guid);
      if (enrichedItem?.tmdbInfo) {
        catItem.tmdbInfo = enrichedItem.tmdbInfo;
      }
    });
  });
  console.log('[CuratorService] TMDb enrichment process completed.');
  return content;
}

export async function fetchFreshFeaturedContent(trendingClientInstance: TrendingContentClient | null): Promise<FeaturedContent> {
  if (!isUsingRealData()) {
    console.log('[CuratorService] Using mock data for fetchFreshFeaturedContent');
    return getMockFeaturedContent();
  }
  
  if (!trendingClientInstance) {
    console.warn('[CuratorService] TrendingContentClient not initialized, using mock data');
    return getMockFeaturedContent();
  }
  
  console.log('[CuratorService] Fetching fresh featured content from APIs using DEFAULT_CATEGORIES_CONFIG');
  
  try {
    const categoryPromises = DEFAULT_CATEGORIES_CONFIG.map(async (catConfig) => {
      try {
        const items: FeaturedItem[] = await catConfig.fetcher(trendingClientInstance, catConfig.limit);
        console.log(`[CuratorService] Fetched ${items.length} items for category: ${catConfig.title}`);
        return { id: catConfig.id, title: catConfig.title, items };
      } catch (error) {
        console.error(`[CuratorService] Error fetching category ${catConfig.title}:`, error);
        return { id: catConfig.id, title: catConfig.title, items: [] };
      }
    });

    const resolvedCategoriesData = await Promise.all(categoryPromises);
    
    const featuredCategories: FeaturedCategory[] = resolvedCategoriesData.map(categoryData => ({
      id: categoryData.id,
      title: categoryData.title,
      items: Array.isArray(categoryData.items) ? categoryData.items : [], 
    }));
    
    console.log(`[CuratorService] Processed ${featuredCategories.length} categories.`);
    
    const allItems = featuredCategories.reduce((acc, category) => acc.concat(category.items), [] as FeaturedItem[]); 
    const randomFeaturedItem: FeaturedItem | null = allItems.length > 0 ? allItems[Math.floor(Math.random() * allItems.length)] : null;
    
    if (randomFeaturedItem) {
      console.log(`[CuratorService] Selected random featured item: ${randomFeaturedItem.title}`);
    } else {
      console.log('[CuratorService] No items available to select a random featured item.');
    }
    
    let contentToReturn: FeaturedContent = {
      featuredItem: randomFeaturedItem,
      categories: featuredCategories,
    };

    if (tmdbClient) { 
      console.log('[CuratorService] Enriching content with TMDb data');
      contentToReturn = await enrichWithTmdbMetadata(contentToReturn);
    } else {
      console.log('[CuratorService] TMDb enrichment skipped (not enabled or client not available)');
    }
    
    return contentToReturn;
  } catch (error) {
    console.error('[CuratorService] Error in fetchFreshFeaturedContent:', error);
    return getMockFeaturedContent();
  }
}

export async function getFeaturedContent(
  trendingClientInstance: TrendingContentClient | null, 
  currentCacheService: typeof CacheService
): Promise<FeaturedContent> {
  // If in build environment (NODE_ENV is 'production' during 'next build'),
  // return mock data immediately to prevent timeouts from DB/API calls.
  if (process.env.NODE_ENV === 'production') {
    console.log('[CuratorService] Build environment detected (NODE_ENV=production), returning mock featured content.');
    return getMockFeaturedContent();
  }

  try {
    console.log('[CuratorService] Attempting to get featured content from MongoDB cache');
    const cachedData = await currentCacheService.getCachedFeaturedContent();
    
    if (cachedData && await currentCacheService.isFeaturedContentCacheValid()) {
      console.log('[CuratorService] Valid cache found in MongoDB, returning cached content');
      return cachedData;
    } else {
      if (cachedData) {
        console.log('[CuratorService] Cache found but invalid, fetching fresh content');
      } else {
        console.log('[CuratorService] Cache not found, fetching fresh content');
      }
      const freshContent = await fetchFreshFeaturedContent(trendingClientInstance); 
      await currentCacheService.cacheFeaturedContent(freshContent);
      console.log('[CuratorService] Cached fresh content to MongoDB');
      return freshContent;
    }
  } catch (error) {
    console.error('[CuratorService] Error in getFeaturedContent:', error);
    try {
      console.warn('[CuratorService] Attempting to fetch fresh data as fallback:', error);
      const freshContent = await fetchFreshFeaturedContent(trendingClientInstance);
      try {
          await currentCacheService.cacheFeaturedContent(freshContent);
          console.log('[CuratorService] Cached fresh content to MongoDB after fallback');
      } catch (cacheError) {
          console.error('[CuratorService] Failed to cache during fallback:', cacheError);
      }
      return freshContent;
    } catch (fallbackError) {
      console.error('[CuratorService] Fallback fetch also failed, using mock data:', fallbackError);
      return getMockFeaturedContent();
    }
  }
}

function mapTmdbApiResponseToEnrichmentData(apiResponseItem: TMDbMovieDetails | TMDbTVDetails, mediaType: 'movie' | 'tv'): TMDbEnrichmentData | undefined {
  if (!apiResponseItem || !apiResponseItem.id) return undefined;
  
  let enrichmentData: TMDbEnrichmentData | undefined = undefined;
  
  if (mediaType === 'movie' && 'title' in apiResponseItem) {
    const movieDetails = apiResponseItem as TMDbMovieDetails;
    enrichmentData = {
      tmdbId: movieDetails.id,
      title: movieDetails.title,
      overview: movieDetails.overview || '',
      posterPath: movieDetails.poster_path === null ? null : movieDetails.poster_path,
      backdropPath: movieDetails.backdrop_path === null ? null : movieDetails.backdrop_path,
      releaseDate: movieDetails.release_date,
      voteAverage: movieDetails.vote_average,
      genreIds: movieDetails.genres?.map((g: { id: number; name: string }) => g.id) || [],
      runtime: movieDetails.runtime,
    };
  } else if (mediaType === 'tv' && 'name' in apiResponseItem) {
    const tvDetails = apiResponseItem as TMDbTVDetails;
    enrichmentData = {
      tmdbId: tvDetails.id,
      title: tvDetails.name, 
      overview: tvDetails.overview || '',
      posterPath: tvDetails.poster_path === null ? null : tvDetails.poster_path,
      backdropPath: tvDetails.backdrop_path === null ? null : tvDetails.backdrop_path,
      voteAverage: tvDetails.vote_average,
      genreIds: tvDetails.genres?.map((g: { id: number; name: string }) => g.id) || [],
      seasons: tvDetails.number_of_seasons,
      firstAirDate: tvDetails.first_air_date,
    };
  }
  return enrichmentData;
}

export async function getEnrichedFeaturedItemById(
  id: string | number, 
  mediaType: 'movie' | 'tv'
): Promise<FeaturedItem | null> {
  console.log(`[CuratorService] Attempting to get enriched item by ID: ${id}, Type: ${mediaType}`);
  
  if (!tmdbClient) {
    console.warn('[CuratorService] Module-scoped TMDb client not available for getEnrichedFeaturedItemById, cannot fetch fresh details.');
    return null;
  }

  try {
    let tmdbDetails: TMDbMovieDetails | TMDbTVDetails | null = null;
    if (typeof id === 'number') { 
      tmdbDetails = mediaType === 'tv'
        ? await tmdbClient.getTvShowDetails(id)
        : await tmdbClient.getMovieDetails(id);
    } else {
      console.warn(`[CuratorService] Fetching by Prowlarr GUID (${id}) not fully implemented. This function currently only supports TMDb ID for direct fetching.`);
      return null; 
    }

    if (tmdbDetails) {
      const enrichmentData = mapTmdbApiResponseToEnrichmentData(tmdbDetails, mediaType);
      if (enrichmentData) {
        const partialFeaturedItem: Partial<FeaturedItem> = {
          tmdbInfo: enrichmentData,
          mediaType: mediaType,
          title: enrichmentData.title || 'Unknown Title',
          guid: typeof id === 'string' ? id : `tmdb-${id}`,
          indexerId: 'tmdb-placeholder',
          size: 0,
          protocol: 'torrent' 
        };
        console.log(`[CuratorService] Successfully created partial enriched item for ID: ${id}`);
        return partialFeaturedItem as FeaturedItem;
      }
    }
    console.warn(`[CuratorService] Could not find or enrich item for ID: ${id}`);
    return null;
  } catch (error) {
    console.error(`[CuratorService] Error in getEnrichedFeaturedItemById for ID ${id}:`, error);
    return null;
  }
}

// Main service object or export individual functions as needed
const CuratorService = {
  getFeaturedContent,
  fetchFreshFeaturedContent, // Primarily internal, but can be exported if direct access is needed
  getEnrichedFeaturedItemById,
  // enrichWithTmdbMetadata is internal and used by fetchFreshFeaturedContent
};

export default CuratorService;
