/**
 * Types for the featured content system
 */

import { NormalizedMovieResult } from "../api/prowlarr-client";
import { TMDBMediaItem } from "../types/tmdb";

/**
 * Extends the NormalizedMovieResult with library status information
 */
export interface EnhancedMediaItem extends NormalizedMovieResult {
  // Library status indicators
  inLibrary: boolean;
  downloading: boolean;
  downloadProgress?: number; // 0-100 percentage
  
  // TMDb integration
  tmdbAvailable: boolean;
  tmdb?: TMDBMediaItem;
}

/**
 * Category of content for the featured page
 */
export interface FeaturedCategory {
  id: string;
  title: string;
  items: EnhancedMediaItem[];
}

/**
 * Complete featured content response
 */
export interface FeaturedContent {
  featuredItem: EnhancedMediaItem;
  categories: FeaturedCategory[];
}
