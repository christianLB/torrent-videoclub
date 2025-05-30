/**
 * Featured content types
 * 
 * This is the consolidated type definition for featured content
 * which replaces the old featured-content.ts definitions.
 */

// Import legacy types for compatibility
import { NormalizedMovieResult } from "../api/prowlarr-client";
import { TMDbSearchResult } from "../api/tmdb-client";

export interface TMDbEnrichmentData {
  tmdbId?: number;        // TMDb ID for the movie or TV show
  title?: string;         // Title from TMDb
  year?: number;          // Release year from TMDb
  posterPath?: string;    // Relative path from TMDb (e.g., /xyz.jpg)
  backdropPath?: string;  // Relative path from TMDb
  overview?: string;
  voteAverage?: number;
  genreIds?: number[];    // TMDb genre IDs
  releaseDate?: string;   // Full release date from TMDb
  runtime?: number;       // For movies, in minutes
  seasons?: number;       // For TV shows, number of seasons
  // ... other relevant TMDb fields can be added here
}

export interface ProwlarrItemData {
  guid: string;          // Unique ID from the Prowlarr indexer for the release
  indexerId: string;     // ID of the Prowlarr indexer that provided this result
  title: string;         // Release title from Prowlarr (original torrent/nzb title)
  size: number;          // Size in bytes
  seeders?: number;
  leechers?: number;
  protocol: 'torrent' | 'usenet'; // Or other relevant Prowlarr protocols
  publishDate?: string;   // ISO string format
  quality?: string;       // e.g., 1080p, 720p - from Prowlarr
  infoUrl?: string;       // URL to the release page on the indexer
  downloadUrl?: string;   // Direct download link (magnet, .torrent, .nzb)
  // ... other Prowlarr specific fields like infoHash, comments, etc.
}

/**
 * Core FeaturedItem interface. Represents an item sourced from Prowlarr,
 * potentially enriched with TMDb data, and prepared for UI display.
 */
export interface FeaturedItem extends ProwlarrItemData {
  // Prowlarr fields are inherited via ProwlarrItemData
  
  tmdbInfo?: TMDbEnrichmentData; // Optional TMDb enrichment, nested for clarity
  mediaType: 'movie' | 'tv';   // Determined during enrichment or based on Prowlarr category

  // Transformed fields (populated by frontend or backend transformation for display)
  fullPosterPath?: string;      // Full URL for poster image, ready for <Image src={...} />
  fullBackdropPath?: string;    // Full URL for backdrop image
  displayTitle?: string;        // Title to display (could be from TMDb or Prowlarr)
  displayOverview?: string;     // Overview to display (usually from TMDb)
  displayYear?: number;         // Year to display (usually from TMDb)
  displayRating?: number;       // Rating to display (usually from TMDb voteAverage)
  displayGenres?: string[];     // Genres to display (usually from TMDb, mapped from genreIds)
  
  // UI state (can be managed on frontend or derived from backend state)
  inLibrary?: boolean;          // Is this item (matched by tmdbId or guid) in the user's library?
  isDownloading?: boolean;      // Is this specific release (guid) currently downloading?
  downloadProgress?: number;    // If downloading, what's the progress?
  isProcessing?: boolean;       // Is there an ongoing action (e.g., adding to library) for this item?

  // Optional: If the item is matched to an existing library entry, its local DB ID
  libraryId?: string | number; 
}

/**
 * For backward compatibility during transition. 
 * Consider removing once all usages are updated to FeaturedItem.
 */
export type EnhancedMediaItem = FeaturedItem; 
// Note: The old FeaturedItem had a flat structure. 
// This EnhancedMediaItem will now have the new nested structure. 
// Code using EnhancedMediaItem will need to be checked.

// The TMDbMetadata interface is renamed to TMDbEnrichmentData to be more specific.
// If TMDbMetadata was used elsewhere for a different purpose, it might need to be kept or refactored.
// For now, assuming it was primarily for the structure within FeaturedItem.
// export type TMDbMetadata = TMDbEnrichmentData; // If needed for strict compatibility temporarily


export interface FeaturedCategory {
  id: string;
  title: string;
  items: FeaturedItem[];
}

export interface FeaturedContent {
  featuredItem: FeaturedItem;
  categories: FeaturedCategory[];
}
