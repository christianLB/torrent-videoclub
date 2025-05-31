# Featured Section Refactor and Bug Fix Plan

## 1. Current State & Observed Errors

The featured section of the application is currently experiencing significant issues, primarily related to data fetching for both the main carousel and the category rows. This leads to a degraded user experience.

**Observed Errors (as of 2025-05-30):**

1.  **Carousel Error:** The UI displays "Error loading carousel: Failed to fetch carousel content."
    *   This indicates that the `FeaturedCarousel.tsx` component is unable to retrieve data from its designated API endpoint: `/api/featured/carousel-content`.
2.  **Category Loading Errors:** The UI displays "Error Loading Categories: Failed to fetch /movies/top_rated with status 404."
    *   The network console shows a `GET` request to `http://localhost:3000/api/tmdb/movies/upcoming?page=1` (and likely similar requests for other categories like popular movies, trending TV, top-rated movies) returning a `404 Not Found` error.
    *   This implies that the internal API routes that `FeaturedPage.tsx` attempts to call for fetching category-specific data are missing or misconfigured.
3.  **Persistent Lint Error:** In `FeaturedPage.tsx`, there's an ongoing lint error: `Cannot find module './FeaturedCarousel' or its corresponding type declarations.` despite the file seemingly existing and being exported correctly.

## 2. Root Causes

1.  **Missing Internal API Routes for Categories:** The primary cause for category loading failures (`404` errors) is that the backend API routes (e.g., `/api/tmdb/movies/popular`, `/api/tmdb/movies/upcoming`, `/api/tmdb/tv/trending`, `/api/tmdb/movies/top_rated`) that `FeaturedPage.tsx` expects to call do not exist or are not correctly routed. These routes are intended to act as proxies to the actual TMDB API, handled by `tmdbDataService`.
2.  **Issues with Carousel Content API:** The `/api/featured/carousel-content` route might have internal errors, issues with its dependencies (RadarrClient, SonarrClient, tmdbDataService), or problems in processing and returning data, leading to the "Failed to fetch carousel content" error on the frontend.
3.  **Frontend Import Resolution:** The `FeaturedCarousel` import issue in `FeaturedPage.tsx` might be an environment-specific problem (IDE/TypeScript server cache) or a subtle path/configuration issue.

## 3. Proposed Solutions & Implementation Steps

### 3.1. Backend API Fixes

**A. Create Internal API Routes for TMDB Categories:**
   - For each category data type required by `FeaturedPage.tsx`, create a corresponding `route.ts` file within the `app/api/tmdb/` directory structure.
   - **Endpoints to create/verify:**
       - `app/api/tmdb/movies/popular/route.ts` (handles `GET /api/tmdb/movies/popular`)
       - `app/api/tmdb/movies/upcoming/route.ts` (handles `GET /api/tmdb/movies/upcoming`)
       - `app/api/tmdb/movies/top_rated/route.ts` (handles `GET /api/tmdb/movies/top_rated`)
       - `app/api/tmdb/tv/trending/route.ts` (handles `GET /api/tmdb/tv/trending`)
       - `app/api/tmdb/tv/popular/route.ts` (if needed, similar to movies/popular)
       - `app/api/tmdb/tv/top_rated/route.ts` (if needed, similar to movies/top_rated)
   - Each route will:
       - Import `NextResponse` and `tmdbDataService`.
       - Define an async `GET(request: Request)` handler.
       - Extract query parameters (e.g., `page`, `timeWindow`) from `request.url`.
       - Call the appropriate method on `tmdbDataService` (e.g., `getPopularMovies({ page })`, `getUpcomingMovies({ page })`, `getTrendingTv({ time_window: 'week', page })`).
       - Return the fetched data using `NextResponse.json(data)` or an error response `NextResponse.json({ error: '...' }, { status: ... })`.
       - Implement proper error handling (try-catch blocks) for TMDB API calls.

**B. Review and Stabilize `/api/featured/carousel-content/route.ts`:**
   - Verify that `RadarrClient`, `SonarrClient`, and `tmdbDataService` are correctly initialized and used.
   - Ensure error handling is robust for calls to these services (e.g., if Radarr/Sonarr are unavailable, the route should still attempt to return TMDB content or a graceful error).
   - Confirm that the data transformation into `CarouselItem[]` is correct.
   - Check import paths (user has already updated these to use `@/lib/...` aliases, which is good).

### 3.2. Frontend Component Fixes

**A. `FeaturedPage.tsx`:**
   - **Data Fetching:** Confirm that `fetchFromInternalAPI` is called with the correct paths for the newly established internal API routes for categories.
     ```typescript
     // Example calls within fetchData in FeaturedPage.tsx
     const popularMovies = await fetchFromInternalAPI('/api/tmdb/movies/popular?page=1');
     const trendingTv = await fetchFromInternalAPI('/api/tmdb/tv/trending?timeWindow=week&page=1');
     const upcomingMovies = await fetchFromInternalAPI('/api/tmdb/movies/upcoming?page=1');
     const topRatedMovies = await fetchFromInternalAPI('/api/tmdb/movies/top_rated?page=1');
     ```
   - **Error Handling:** Enhance error messages displayed to the user to be more specific if a particular category fails to load.
   - **`FeaturedCarousel` Import:** Re-verify the import path. If the lint error persists after backend fixes and IDE/TS server restart, consider alternative import path resolutions or check `tsconfig.json` for path alias issues related to component imports.

**B. `FeaturedCarousel.tsx`:**
   - Ensure robust handling of loading and error states returned from `/api/featured/carousel-content`.
   - Display clear user feedback if carousel items cannot be loaded.

### 3.3. General Code Health

- Ensure all new API routes and modified components include necessary type definitions and interfaces.
- Add console logging for critical steps in API routes for easier debugging during development.

## 4. Testing Strategy

1.  **Backend API Routes:**
    *   Test each internal category API route directly (e.g., using a browser or API client like Postman/Insomnia) to ensure they return correct data and handle errors gracefully.
    *   Test `/api/featured/carousel-content` similarly.
2.  **Frontend - Featured Section:**
    *   Load the main page and verify the carousel loads and displays content.
    *   Verify all category rows load and display content.
    *   Test error states: Simulate API errors (e.g., by temporarily breaking an API route) to ensure the frontend displays appropriate error messages for the carousel and individual categories.
    *   Test the "Add to Library" functionality from `MediaCard` components within `CategoryRow` and potentially from the carousel if applicable.
    *   Check browser console for any errors.
3.  **Linting:** Ensure all lint errors are resolved.

By following these steps, we aim to create a stable, functional, and robust featured section.
