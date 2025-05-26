/**
 * Featured content types
 * 
 * This is the consolidated type definition for featured content
 * which replaces the old featured-content.ts definitions.
 */

// Import legacy types for compatibility
import { NormalizedMovieResult } from "../api/prowlarr-client";
import { TMDbSearchResult } from "../api/tmdb-client";

export interface TMDbMetadata {
  id?: number;
  title?: string;
  releaseDate?: string;
  year?: number;
  posterPath?: string;
  backdropPath?: string;
  voteAverage?: number;
  genreIds?: number[];
  overview?: string;
}

/**
 * Core FeaturedItem interface that contains all the necessary properties
 * for displaying items in the UI.
 */
export interface FeaturedItem {
  id: string;
  title: string;
  overview: string;
  backdropPath: string;
  posterPath: string;
  mediaType: 'movie' | 'tv';
  rating: number;
  year: number;
  genres: string[];
  runtime?: number; // For movies
  seasons?: number; // For TV shows
  inLibrary: boolean;
  downloading: boolean;
  downloadProgress?: number;
  tmdbAvailable: boolean;
  tmdbId?: number;
  imdbId?: string;
  tmdb?: TMDbMetadata; // Optional TMDb metadata
  
  // Legacy properties from NormalizedMovieResult for compatibility
  guid?: string;
  quality?: string;
  format?: string;
  codec?: string;
  size?: number;
  sizeFormatted?: string;
  indexer?: string;
  seeders?: number;
  leechers?: number;
  publishDate?: string;
  downloadUrl?: string;
  infoUrl?: string;
}

/**
 * For backward compatibility, EnhancedMediaItem is now equivalent to FeaturedItem
 * This allows existing code to work without changes
 */
export type EnhancedMediaItem = FeaturedItem;

export interface FeaturedCategory {
  id: string;
  title: string;
  items: FeaturedItem[];
}

export interface FeaturedContent {
  featuredItem: FeaturedItem;
  categories: FeaturedCategory[];
}
