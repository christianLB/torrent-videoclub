/**
 * Types for TMDB API responses and data structures used for caching TMDB-first content.
 */

export interface TMDBGenre {
  id: number;
  name: string;
}

export interface TMDBMediaItem {
  id?: number;                   // Added for test compatibility, duplicate of tmdbId
  tmdbId: number;
  mediaType: 'movie' | 'tv';     // Crucial for differentiating API calls and logic
  title: string;
  originalTitle?: string;
  overview: string;
  posterPath?: string | null;    // Can be relative path from TMDB or full URL
  backdropPath?: string | null;  // Can be relative path from TMDB or full URL
  
  // Dates
  releaseDate?: string;          // For movies: YYYY-MM-DD
  firstAirDate?: string;         // For TV shows: YYYY-MM-DD
  lastAirDate?: string;          // For TV shows: YYYY-MM-DD
  year?: number;                 // Added for test compatibility, derived from releaseDate or firstAirDate
  
  // Ratings & Popularity
  voteAverage?: number;          // Average vote (0-10)
  voteCount?: number;
  popularity?: number;

  // Genres
  genres?: TMDBGenre[];          // Array of genre objects from TMDB
  genreIds?: number[];           // Added for test compatibility, array of genre IDs

  // Movie-specific
  runtime?: number;              // In minutes
  
  // TV Show-specific
  numberOfEpisodes?: number;
  numberOfSeasons?: number;
  episodeRunTime?: number[];     // Array of episode runtimes, as TMDB provides it

  // Other useful fields
  status?: string;               // e.g., "Rumored", "Planned", "In Production", "Post Production", "Released", "Canceled", "Ended"
  tagline?: string;
  originalLanguage?: string;     // e.g., "en"
  tvdb_id?: number;              // TVDB ID, useful for Sonarr integration

  // Note: UI-specific state like 'inLibrary', 'isDownloading', or transformed fields like 'fullPosterPath'
  // will not be part of this core cached object. They will be derived or added by the backend API
  // or frontend when serving/displaying the data.
}

/**
 * Represents a list of TMDB items, stored in Redis as an array of their tmdbIds.
 * Example Redis key: "tmdb:list:popular-movies"
 * Example Redis key: "tmdb:list:trending-tv"
 */
export type TMDBItemList = number[]; // An array of tmdbId numbers

/**
 * Represents a single TMDB item as stored in Redis.
 * Example Redis key: "tmdb:movie:{tmdbId}"
 * Example Redis key: "tmdb:tv:{tmdbId}"
 */
// This is essentially the TMDBMediaItem itself when cached individually.
// No separate type needed if TMDBMediaItem is directly cached.
