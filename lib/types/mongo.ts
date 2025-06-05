import { TMDBGenre } from './tmdb';

// Base document structure for MongoDB
export interface MongoBaseDocument {
  _id: string; // Typically ObjectId as a string, or a custom string ID
  createdAt?: Date;
  updatedAt?: Date;
}

// Represents a media item stored in the 'mediaItems' collection
// This will be based on TMDBMediaItem but with MongoDB specific fields
export interface MongoMediaItem extends MongoBaseDocument {
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  title: string;
  originalTitle?: string;
  overview?: string;
  posterPath?: string | null;
  backdropPath?: string | null;
  releaseDate?: string; // YYYY-MM-DD for movies
  firstAirDate?: string; // YYYY-MM-DD for TV
  lastAirDate?: string; // YYYY-MM-DD for TV
  voteAverage?: number;
  genres?: TMDBGenre[];
  runtime?: number; // Movie-specific
  numberOfSeasons?: number; // TV-specific
  numberOfEpisodes?: number; // TV-specific
  tvdb_id?: number;
  // MongoDB specific fields
  lastRefreshedFromTmdb?: Date;
  customTags?: string[];
  // Optional: Store recent Prowlarr search results for this item
  // prowlarrSearchResults?: any[]; // Define a proper type for this later
}

import { FeaturedContent } from './featured'; // Assuming FeaturedContent is in 'featured.ts'

// Represents a curated list stored in the 'curatedLists' collection
export interface MongoCuratedList extends MongoBaseDocument {
  // _id will be a unique identifier for the list, e.g., "popular_movies_tmdb", "main_featured_content"
  title: string;
  description?: string;
  // Type of list: how it's generated or managed
  type: 'dynamic_tmdb_query' | 'manual_curation' | 'featured_section' | string;
  // For lists generated from a TMDB endpoint
  sourceTmdbEndpoint?: string;
  tmdbQueryParameters?: Record<string, any>;
  // Ordered list of mediaItem _ids (referencing MongoMediaItem._id)
  // These would be strings like "<tmdbId>_movie" or "<tmdbId>_tv"
  mediaItemObjectIds?: string[]; 
  // Alternatively, if embedding some denormalized data directly:
  // items?: Partial<MongoMediaItem>[]; // Not recommended for primary storage of items
  lastRefreshed?: Date;
  refreshIntervalSeconds?: number;
  isEnabled?: boolean;
  // For UI purposes, e.g. what section this list belongs to
  uiSection?: string; 
  contentBlob?: FeaturedContent | any; // To store arbitrary blobs like the current FeaturedContent
  lastRefreshedAt?: Date; // Timestamp of the last refresh
  ttlSeconds?: number; // Cache Time-To-Live in seconds for this specific document
}

// Example of a more specific featured content structure if needed, 
// which might be a specific type of MongoCuratedList document.
// For now, CacheService will adapt to use MongoCuratedList for 'featured:content'.
// The old 'FeaturedContent' type from 'lib/types/featured.ts' might be mapped to 
// a specific document in 'curatedLists' or a structure composed from it.

export const MEDIA_ITEMS_COLLECTION = 'mediaItems';
export const CURATED_LISTS_COLLECTION = 'curatedLists';
export interface MongoFeaturedCategory extends MongoBaseDocument {
  title: string;
  type: 'movie' | 'tv';
  tmdbParams?: Record<string, any>;
  order: number;
  enabled: boolean;
}

export const FEATURED_CATEGORIES_COLLECTION = 'featuredCategories';
