# Media Stack Frontend Refactoring Plan

## Overview

The current implementation of the media frontend relies on fetching data from indexers (via Prowlarr), enriching it with TMDB metadata, and caching the results in Redis. This approach has significant drawbacks in visual consistency and data accuracy.

The new approach flips this workflow, making TMDB the primary source for frontend content. Users interact with visually enriched content from TMDB, and actions trigger specific searches in Prowlarr when necessary.

---

## Current Workflow (Indexer → TMDB → Redis)

### Issues:

* Inconsistent or missing TMDB enrichment due to unreliable title matching.
* Poor frontend visuals and metadata reliability.
* Complex logic needed for matching indexer content with TMDB data.

### Current Flow:

1. Query content from indexers via Prowlarr.
2. Attempt to match results to TMDB (title/year).
3. Enrich matched results with TMDB data.
4. Cache in Redis.
5. Frontend consumes Redis-cached data.

---

## Desired Workflow (TMDB → Redis → Indexer on-demand)

### Benefits:

* Consistent visual presentation.
* Accurate metadata directly from TMDB.
* Simplified frontend logic.
* Clear user actions.

### Desired Flow:

1. Fetch enriched content directly from TMDB.
2. Store enriched data directly in Redis.
3. Frontend exclusively reads from Redis.
4. User selects content in the frontend.

   * Option: "Add to Library" triggers automated monitoring in Sonarr/Radarr.
   * Option: "Download Now" triggers immediate indexer search via Prowlarr and initiates a download in qBittorrent.

---

## User Actions and Definitions

* **Add to Library**:

  * Sends TMDB ID to Sonarr/Radarr.
  * Sonarr/Radarr manages automatic searching via Prowlarr.
  * Ideal for ongoing series or future content.

* **Download Now**:

  * Performs immediate search in Prowlarr using TMDB title/year.
  * Retrieves magnet link.
  * Initiates immediate download in qBittorrent.

---

## Step-by-Step Refactoring Plan

### Phase 1: Establish TMDB-centric Redis Caching

*   [ ] **Define Data Structures:**
    *   [ ] Finalize the schema for TMDB-enriched items to be stored in Redis (e.g., `CachedTMDBItem`). This should prioritize TMDB data and include fields like `tmdbId`, `title`, `overview`, `posterPath`, `backdropPath`, `releaseDate`, `mediaType`, etc.
    *   [ ] Consider how lists of items (e.g., "trending movies", "popular TV shows") will be stored (e.g., an array of `tmdbId`s or compact `CachedTMDBItem` objects).
*   [ ] **Develop `TMDBService`:**
    *   [ ] Create or enhance a `TMDBService` responsible for fetching data from the TMDB API (e.g., popular, trending, movie/TV details).
    *   [ ] Implement methods to fetch various categories of content (e.g., `getPopularMovies()`, `getTrendingTVShows()`, `getMovieDetails(tmdbId)`, `getTVShowDetails(tmdbId)`).
*   [ ] **Update `RedisService` and Caching Logic:**
    *   [ ] Modify the existing `RedisService` to support storing and retrieving the new `CachedTMDBItem` structures.
    *   [ ] Implement new Redis cache keys using TMDB ID as the primary identifier (e.g., `tmdb:movie:{tmdbId}`, `tmdb:tv:{tmdbId}`, `tmdb:list:popular-movies`).
    *   [ ] Implement logic (likely in an orchestrating service or `TMDBService` itself) to fetch data from TMDB and populate the Redis cache.
    *   [ ] Configure appropriate TTLs for different types of cached TMDB data (e.g., individual items vs. lists), potentially using environment variables (e.g., `REDIS_TMDB_ITEM_TTL`, `REDIS_TMDB_LIST_TTL`).
*   [ ] **Background Cache Refresh Mechanism:**
    *   [ ] Design and implement a mechanism for periodically refreshing TMDB-sourced data in Redis (e.g., using cron jobs or a background worker process that calls `TMDBService` methods).
*   [ ] **Testing:**
    *   [ ] Unit test `TMDBService` methods for fetching and transforming data.
    *   [ ] Unit test `RedisService` methods for storing and retrieving new data structures.
    *   [ ] Verify Redis data integrity, TMDB ID as primary key, and correct TTLs.

### Phase 2: Frontend Refactoring for TMDB-First Data

*   [ ] **Backend API for Frontend Consumption:**
    *   [ ] Create new Next.js API routes (e.g., `/api/featured/movies/popular`, `/api/featured/tv/trending`, `/api/items/movie/[tmdbId]`) that read data exclusively from the new TMDB-centric Redis cache (populated in Phase 1). These routes will serve data to the frontend.
*   [ ] **Update Frontend Data Fetching:**
    *   [ ] Refactor frontend components (e.g., `FeaturedPage`, item display cards, detail views) to fetch data from these new backend API routes.
    *   [ ] Update or replace existing data fetching hooks (e.g., React Query, SWR) accordingly.
    *   [ ] Remove all frontend logic that directly processes or relies on Prowlarr/indexer-first data for initial display.
*   [ ] **Adapt UI Components:**
    *   [ ] Update frontend TypeScript types (e.g., `FeaturedItem` or create new ones like `DisplayItem`) to reflect the TMDB-first data structure.
    *   [ ] Modify UI components to correctly display data from `CachedTMDBItem` (e.g., titles, posters, overviews).
*   [ ] **Implement Action Buttons:**
    *   [ ] Design and implement distinct "Add to Library" and "Download Now" buttons/actions in the UI for each media item.
    *   [ ] Ensure the UI clearly communicates the purpose of each action.
*   [ ] **Testing:**
    *   [ ] Test new frontend API routes for correct data retrieval from Redis.
    *   [ ] Verify frontend components display TMDB data accurately.
    *   [ ] Ensure old data fetching paths are removed.

### Phase 3: Implement Backend Actions (Library & Download)

*   [ ] **"Add to Library" Endpoints (Radarr/Sonarr):**
    *   [ ] **Movies:** Review and update the existing `/app/api/add/movie/route.ts` to ensure it correctly uses `tmdbId` to add movies to Radarr.
    *   [ ] **TV Shows:** Create a new API route `/app/api/add/tv/route.ts` that accepts a `{ tmdbId: number }` and adds the TV show to Sonarr.
    *   [ ] Ensure both endpoints interact with their respective services (`RadarrService`, `SonarrService`) and provide clear success/error responses.
*   [ ] **"Download Now" - Prowlarr Search Endpoint:**
    *   [ ] Create a new API route (e.g., `/api/prowlarr/search/route.ts`).
    *   [ ] Inputs: `{ tmdbId: number, title: string, year?: number, type: 'movie' | 'tv' }`.
    *   [ ] This route will use the `ProwlarrService` (leveraging `ProwlarrClient`) to search for releases matching the TMDB item.
    *   [ ] The endpoint should return a list of matching releases, including `guid`, `indexerId`, title, quality, size, seeders, and magnet link (if available directly) or other identifiers needed for download.
*   [ ] **"Download Now" - Send to Download Client Endpoint:**
    *   [ ] Create a new API route (e.g., `/api/download/start/route.ts` or `/api/prowlarr/send-to-client/route.ts`).
    *   [ ] Inputs: Prowlarr-specific identifiers for the chosen release (e.g., `{ guid: string, indexerId: number }`) and target download client (e.g. qBittorrent).
    *   [ ] This route will use `ProwlarrService` to trigger the "send to client" action in Prowlarr, or directly use a `QbittorrentService` if handling magnet links.
    *   [ ] Ensure robust error handling for Prowlarr and download client interactions.
*   [ ] **Service Layer:**
    *   [ ] Ensure all interactions with external tools (Radarr, Sonarr, Prowlarr, qBittorrent) are encapsulated within dedicated services.
*   [ ] **Testing:**
    *   [ ] Unit test new API endpoints for request handling, parameter validation, and service calls.
    *   [ ] Mock external service interactions (Radarr, Sonarr, Prowlarr, qBittorrent) to test endpoint logic in isolation.

### Phase 4: Integrate Frontend Actions with Backend

*   [ ] **"Add to Library" Button Integration:**
    *   [ ] Connect the "Add to Library" button in the frontend to call the `/api/add/movie` or `/api/add/tv` backend endpoints with the item's `tmdbId`.
    *   [ ] Implement UI feedback mechanisms (e.g., toast notifications, button state changes) for success, pending, and error states.
*   [ ] **"Download Now" Button Integration & Workflow:**
    *   [ ] **Step 1 (Search):** Connect the "Download Now" button to an action that first calls the `/api/prowlarr/search` endpoint.
    *   [ ] **Step 2 (Selection UI - Optional but Recommended):** If the search returns multiple results, implement a UI (e.g., modal dialog) to display these releases and allow the user to select one. If no/one result, proceed automatically.
    *   [ ] **Step 3 (Start Download):** After a release is selected (or if only one good match), call the `/api/download/start` (or `/api/prowlarr/send-to-client`) endpoint with the chosen release's identifiers.
    *   [ ] Implement comprehensive UI feedback throughout this multi-step process.
*   [ ] **State Management:**
    *   [ ] Update frontend state management to reflect items being added to library or downloads being initiated.
*   [ ] **Error Handling:**
    *   [ ] Implement robust error handling in the frontend for API call failures, displaying user-friendly messages.
*   [ ] **Testing:**
    *   [ ] End-to-end test the "Add to Library" flow for movies and TV shows.
    *   [ ] End-to-end test the "Download Now" flow, including search, selection (if applicable), and download initiation.
    *   [ ] Validate all UI feedback mechanisms.

---

## Testing Strategy

### Unit Tests

* Redis data integrity (TMDB enrichment consistency).
* Backend API endpoints (TMDB ID handling, Prowlarr search responses, qBittorrent magnet acceptance).

### Integration Tests

* End-to-end "Add to Library" scenario:

  * TMDB → Redis → API → Radarr/Sonarr.

* End-to-end "Download Now" scenario:

  * TMDB → Redis → API → Prowlarr → qBittorrent.

### Visual and Functional Tests

* Frontend display consistency with TMDB.
* Action button behaviors and UI clarity.
* Real-world tests confirming downloads start correctly and library additions function as expected.

---

## Validation and Acceptance Criteria

* All frontend content visually matches TMDB data.
* User actions clearly trigger intended backend workflows.
* Redis reliably caches and serves TMDB-enriched data.
* "Add to Library" successfully updates Sonarr/Radarr.
* "Download Now" successfully initiates and completes downloads via qBittorrent.

This comprehensive plan ensures the successful transition to a robust, visually consistent, and logically simplified media frontend.
