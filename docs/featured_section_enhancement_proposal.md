# Proposal: Dynamizing the Featured Section

## 1. Introduction

The goal of this proposal is to outline a strategy for significantly enhancing the "Featured" section of the Torrent VideoClub application. By introducing dynamic content, personalized recommendations, and a more engaging user interface, we aim to improve user retention, content discovery, and overall satisfaction.

Key areas of focus include:
*   A main featured content carousel with intelligent filtering.
*   Dynamic and refreshable category rows.
*   Personalized content categories tailored to user interests or specific criteria.

This proposal leverages our existing TMDB-first approach, Redis caching infrastructure, and Radarr/Sonarr integration capabilities.

## 2. Main Featured Carousel

**Concept:** A visually prominent carousel at the top of the featured section, showcasing a curated selection of trending, high-quality, or newly added movies and TV shows.

**Key Features:**

*   **"Not in Library" Filter (Crucial):**
    *   **Mechanism:** Before displaying items in the carousel, the system will cross-reference them against the user's Radarr (movies) and Sonarr (TV shows) libraries.
    *   **Implementation:**
        *   The frontend will fetch the TMDB IDs of items in the user's libraries via the existing `/api/radarr/library` and `/api/sonarr/library` API endpoints.
        *   The backend service responsible for curating carousel content (or the frontend, if handling client-side) will filter out any item whose TMDB ID matches one from the user's libraries.
        *   This ensures the carousel primarily highlights content the user has not yet added.
*   **Content Sourcing:**
    *   **Initial:** Utilize existing TMDB API endpoints for popular movies/TV and trending movies/TV (e.g., `/api/tmdb/movies/popular`, `/api/tmdb/tv/trending`). These are already cached in Redis.
    *   **Future:** Consider a dedicated, manually curated "carousel highlights" list, potentially managed via an admin interface or a more sophisticated backend curation logic.
*   **UI/UX:**
    *   Smooth, touch-friendly navigation.
    *   High-quality poster art (leveraging TMDB's `backdrop_path`).
    *   Clear calls to action: "View Details", "Add to Library".

## 3. Dynamic Category Rows

**Concept:** Below the main carousel, display multiple rows of content, each representing a specific theme or category (e.g., "Trending Movies This Week", "Popular TV Shows", "New 4K Releases", "Critically Acclaimed Documentaries").

**Key Features:**

*   **Data Refresh Mechanisms:**
    *   **Automatic Background Cache Refresh:** Continue to use and enhance the Redis caching for TMDB data. Each category's data will have an appropriate TTL (e.g., `featured:category:trending_movies_week`, `featured:category:popular_tv`). Background jobs (e.g., cron, scheduled serverless functions) will periodically update these Redis caches from TMDB.
    *   **"Pull-to-Refresh" or Manual Refresh (Optional):** Consider a UI element (e.g., a refresh icon per category or for the entire section) that allows users to manually trigger a data refresh. This would involve an API call that invalidates the relevant Redis cache(s) and fetches fresh data on demand.
*   **Content Sourcing & Variety:**
    *   Leverage various TMDB endpoints (trending, popular, discover by genre/keyword/year, etc.).
    *   Potentially integrate Prowlarr-based data for categories like "Latest Releases Available" (though this requires careful consideration of how to blend Prowlarr items with TMDB-enriched data for display consistency).
*   **Recommendation Engine (Future Enhancement):**
    *   **Phase 1 (Current/Near-term):** Curated lists based on general popularity and trends from TMDB.
    *   **Phase 2 (Mid-term):** Simple content-based recommendations (e.g., "More like [Recently Viewed Item]" by fetching similar items from TMDB based on genre/keywords).
    *   **Phase 3 (Long-term):** Explore collaborative filtering if user interaction data (views, ratings, library additions beyond just existence) is tracked more extensively.

## 4. Personalized & Custom Categories

**Concept:** Introduce categories that are either explicitly personalized based on user behavior/preferences or dynamically generated based on specific, niche criteria.

**Key Features & Examples:**

*   **Criteria-Based Dynamic Categories:**
    *   **"Latest Movies from [Country]":** e.g., "Latest Movies from Spain".
        *   **Implementation:** Requires a new backend API endpoint (e.g., `/api/featured/custom/movies_by_region`) that uses TMDB's `/discover/movie` endpoint with `with_origin_country` (or `region` for release region) and `sort_by=primary_release_date.desc`.
    *   **"Science Fiction Classics":**
        *   **Implementation:** Another custom API endpoint using TMDB's `/discover/movie` with `with_genres` (ID for Science Fiction) and `primary_release_date.lte` (e.g., movies released before 1990), `sort_by=popularity.desc`.
    *   **"Top Rated by Genre":** e.g., "Top Rated Horror Movies".
        *   **Implementation:** TMDB `/discover/movie` with `with_genres` and `sort_by=vote_average.desc`, `vote_count.gte=[min_votes]`.
*   **User-Driven Personalization (Future):**
    *   **"Because you watched [Title]":** Requires tracking viewing history (if possible) or items added to library, then fetching TMDB recommendations for that item.
    *   **"Your Favorite Genres":** Allow users to select favorite genres, and then generate categories based on these preferences.
*   **Implementation Strategy:**
    *   **Backend API Endpoints:** Develop flexible API routes (e.g., `/api/featured/custom?params=...`) that can take various TMDB filter parameters to construct these lists. These will heavily rely on `tmdbDataService` and Redis caching.
    *   **Admin Configuration (Recommended):** An admin interface to define and manage these custom categories, allowing non-developers to create new featured rows by specifying TMDB query parameters or predefined templates.

## 5. Technical Considerations

*   **API Design:**
    *   All new endpoints serving featured content must be paginated.
    *   Responses should be optimized, returning only necessary data for display.
    *   Continue using `tmdbDataService` for TMDB interactions to ensure consistent caching and error handling.
*   **Caching Strategy:**
    *   Define clear, granular Redis cache keys for each dynamic category and carousel variant (e.g., `featured:carousel:not_in_library`, `featured:category:custom:genre_28_year_lte_1990`).
    *   Implement robust cache invalidation for manual refreshes and ensure background updates are efficient.
*   **Data Models (`FeaturedItem` / `EnhancedMediaItem`):**
    *   Ensure the `FeaturedItem` type (as defined in `lib/types/featured.ts`) can accommodate all necessary display data (TMDB ID, full image paths, display title, library status hints if pre-calculated).
*   **Performance:**
    *   Frontend: Implement lazy loading for images and potentially for entire category rows as they scroll into view.
    *   Backend: Optimize TMDB queries and ensure Redis lookups are fast.
    *   Client-side state management (e.g., React Query, SWR) should be used to handle fetching, caching, and updating of featured content on the client.

### 5.1. Configuration for Dynamic Categories (Initial Iteration)

For the initial implementation of custom and personalized categories (as outlined in Phase 2), we will use a server-side JSON configuration file. This approach allows for easy definition and modification of categories without requiring a full admin UI initially.

**File:** `config/featured_categories.json` (or similar, e.g., `lib/config/featured_categories.json`)

**Structure Example:**

```json
[
  {
    "id": "sci_fi_classics_movies",
    "title": "Science Fiction Classics",
    "type": "movie",
    "enabled": true,
    "order": 10,
    "tmdbDiscoverParams": {
      "with_genres": "878", // Science Fiction
      "sort_by": "popularity.desc",
      "primary_release_date.lte": "1990-12-31",
      "vote_count.gte": 100
    }
  },
  {
    "id": "latest_spanish_cinema",
    "title": "Latest Movies from Spain",
    "type": "movie",
    "enabled": true,
    "order": 20,
    "tmdbDiscoverParams": {
      "with_origin_country": "ES",
      "sort_by": "primary_release_date.desc",
      "primary_release_date.gte": "2023-01-01" // Example: last year
    }
  },
  {
    "id": "popular_korean_dramas",
    "title": "Popular Korean Dramas",
    "type": "tv",
    "enabled": false, // Example of a disabled category
    "order": 30,
    "tmdbDiscoverParams": {
      "with_origin_country": "KR",
      "with_genres": "18", // Drama
      "sort_by": "popularity.desc"
    }
  }
]
```

**Implementation Plan:**

1.  **Define JSON Schema:** Finalize the structure for `featured_categories.json`.
2.  **Create `FeaturedCategoryConfigService`:**
    *   Location: `lib/services/FeaturedCategoryConfigService.ts` (or similar).
    *   Responsibilities:
        *   Read and parse `featured_categories.json`.
        *   Provide a method like `getEnabledCategories()` that returns an array of valid and enabled category configurations, sorted by `order`.
        *   Include error handling for file reading and JSON parsing.
3.  **Develop Backend API Endpoint (`/api/featured/custom-categories/route.ts`):**
    *   This `GET` endpoint will:
        *   Utilize `FeaturedCategoryConfigService` to retrieve the list of enabled category definitions.
        *   Iterate through each definition:
            *   Construct a unique cache key for Redis (e.g., `featured:custom:${category.id}`).
            *   Call `tmdbDataService.discoverMedia(type, params, cacheKey)` (assuming `tmdbDataService` is extended or has a suitable method) to fetch and cache data from TMDB based on `tmdbDiscoverParams`.
        *   Return a structured response, e.g., `[{ "id": "sci_fi_classics_movies", "title": "Science Fiction Classics", "items": [...] }, ...]`, ensuring the `id` from the config is passed through for client-side keying or other purposes.
4.  **Frontend Integration (`FeaturedPage.tsx` or sub-components):**
    *   Fetch data from the new `/api/featured/custom-categories` endpoint.
    *   Render each category as a row, displaying its `title` and the fetched media items.
    *   Client-side state management (React Query/SWR) will handle data fetching, caching, and updates.
5.  **Documentation:** Update internal documentation regarding the `featured_categories.json` format and its usage.

This JSON-driven approach provides flexibility for the initial rollout, allowing for quick iteration on category definitions. A full admin UI can be considered in a later phase (Phase 3).

## 6. Phased Rollout Plan

*   **Phase 1: Core Carousel & Basic Dynamic Rows**
    *   Implement the main featured carousel.
    *   Integrate Radarr/Sonarr library checks for the "Not in Library" filter on the carousel.
    *   Populate carousel and 2-3 initial category rows using existing TMDB popular/trending feeds (e.g., "Trending Movies", "Popular TV Shows").
    *   Ensure robust Redis caching and background refresh for these initial feeds.
*   **Phase 2: JSON-Configured Custom Categories & Enhanced Management**
    *   Implement the JSON-based configuration for dynamic categories as detailed in section 5.1. This includes creating `featured_categories.json`, the `FeaturedCategoryConfigService`, and the `/api/featured/custom-categories` endpoint.
    *   Populate `featured_categories.json` with 2-3 initial custom categories (e.g., "Sci-Fi Classics", "Latest from [Specific Country]").
    *   Implement user-triggered refresh options for category rows (if deemed necessary after Phase 1 feedback).
*   **Phase 3: Advanced Personalization & Admin Tooling**
    *   Develop an admin interface for creating and managing custom featured categories.
    *   Explore user preference settings to drive personalized category generation.
    *   Begin R&D for a simple recommendation engine if desired.

## 7. Conclusion

Dynamizing the featured section as proposed will transform it from a static display into a vibrant, ever-changing discovery hub. This will significantly enhance user engagement, encourage exploration of the available content, and solidify Torrent VideoClub's position as a modern, user-centric application. We recommend proceeding with Phase 1 as a priority to deliver immediate user value.
