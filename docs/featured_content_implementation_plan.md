# Featured Content: Implementation and Testing Plan

## 1. Introduction and Goals

This document outlines the plan for implementing and testing the "Featured Content" section of the Torrent VideoClub application. The primary goals are to ensure:
- Correct display of TMDb images for featured items.
- Reliable "Add to Library" functionality via Prowlarr.
- A robust, testable, and maintainable codebase.
- Clarity on the integration process, particularly the distinction between TMDb for metadata and Prowlarr for download management.

This plan addresses previous implementation challenges and aims to provide a conclusive path to a functional and trustworthy deliverable.

## 2. Current Issues Addressed

- **Image Display**: TMDb images (posters/backdrops) are not consistently or correctly displayed for featured items.
- **"Add to Library" Failures**: The button to add items to Prowlarr is failing. **Crucially, the Prowlarr "add" action should primarily rely on the `guid` of the release from the Prowlarr indexer, not the `tmdbId` of the media.** `tmdbId` is for metadata enrichment and display.
- **Lack of Confidence**: Previous iterations have not yielded the desired functional changes, necessitating a more structured and test-driven approach.

## 3. Proposed Solution Architecture

### 3.1. Data Flow for Featured Content

1.  **Backend**:
    *   A service (e.g., `CuratorService` or a dedicated `FeaturedContentService`) fetches potential featured items. These items are typically search results from Prowlarr, each having a unique `guid`, `indexerId`, `title`, `size`, `seeders`, etc.
    *   For each Prowlarr result, the service attempts to enrich it with metadata from TMDb (using the title and year for searching TMDb, or an existing `tmdbId` if already mapped). This enrichment provides `posterPath`, `backdropPath`, `overview`, `rating`, etc.
    *   The combined data (Prowlarr `guid` + TMDb metadata) is cached (e.g., in Redis).
2.  **API Layer (`/api/featured`)**:
    *   Serves the cached and enriched featured content to the frontend.
    *   Includes the raw Prowlarr `guid` and necessary Prowlarr-related identifiers (like `indexerId`) for each item.
3.  **Frontend (`FeaturedPage.tsx`)**:
    *   Fetches data from `/api/featured`.
    *   Transforms the data using a `transformFeaturedItem` function to prepare it for display components. This transformation ensures:
        *   Complete image URLs are constructed for `posterPath` and `backdropPath` using TMDb base URLs.
        *   `tmdbId` is available for display purposes (e.g., linking to a TMDb page).
        *   The Prowlarr `guid` (and `indexerId`) is preserved and readily accessible for the "Add to Library" action.
4.  **Display Components (`FeaturedCarousel.tsx`, `MediaCard.tsx`)**:
    *   Receive transformed data and display images, titles, overviews, etc.
    *   The "Add to Library" button in these components will use the Prowlarr `guid` and `indexerId`.

### 3.2. Image Handling

-   The `transformFeaturedItem` function (e.g., in `FeaturedPage.tsx` or a utility file) will be responsible for constructing full image URLs (e.g., `https://image.tmdb.org/t/p/w500${path}`).
-   It will handle cases where `posterPath` or `backdropPath` might be missing or already a full URL.
-   Fallback placeholder images will be used if no valid image path can be determined.
-   Components will directly use these processed URLs.

### 3.3. "Add to Library" (Prowlarr) Integration

-   **Identifier**: The primary identifier for adding an item to a download client via Prowlarr is the `guid` (and potentially `indexerId`) obtained from the Prowlarr search result when the featured content was initially discovered.
-   **`tmdbId` Role**: `tmdbId` is used for fetching metadata from TMDb to *display* the item. It should not be the primary key sent to Prowlarr for initiating a download.
-   **Frontend Action**:
    *   When the "Add to Library" button is clicked, the frontend will call a backend API (e.g., `/api/prowlarr/add`) and pass the Prowlarr `guid` and `indexerId`.
-   **Backend API (`/api/prowlarr/add`)**:
    *   This endpoint receives the Prowlarr `guid` and `indexerId`.
    *   It interacts with the Prowlarr API to trigger the download of the specified release. This usually involves Prowlarr sending the `.torrent` file or magnet link to the configured download client.
    *   It returns a success/failure response to the frontend.

## 4. Implementation Steps (Test-Driven Approach)

### 4.1. Define Core Data Structures - [x] DONE

File: `lib/types/featured.ts` (or a more general `media.ts`)

```typescript
export interface ProwlarrResult {
  guid: string;          // Unique ID from the Prowlarr indexer for the release
  indexerId: string;     // ID of the Prowlarr indexer that provided this result
  title: string;         // Release title from Prowlarr
  size: number;
  seeders?: number;
  leechers?: number;
  protocol: 'torrent' | 'usenet';
  // ... other Prowlarr specific fields like infoHash, publishDate, etc.
}

export interface TmdbMetadata {
  tmdbId?: number;        // TMDb ID for the movie or TV show
  posterPath?: string;    // Relative path from TMDb (e.g., /xyz.jpg)
  backdropPath?: string;  // Relative path from TMDb
  overview?: string;
  voteAverage?: number;
  // ... other TMDb fields like release_date, first_air_date, genres
}

export interface FeaturedItem extends ProwlarrResult {
  // Prowlarr fields are inherited
  tmdbInfo?: TmdbMetadata; // Optional TMDb enrichment, nested to keep separation

  // Transformed fields (populated by frontend or backend transformation for display)
  fullPosterPath?: string;   // Full URL for poster image
  fullBackdropPath?: string; // Full URL for backdrop image
  displayTitle?: string;     // Title to display (could be from TMDb or Prowlarr)
  displayOverview?: string;  // Overview to display
  
  // UI state (can be managed on frontend or derived)
  inLibrary?: boolean;
  downloading?: boolean;
  downloadProgress?: number;
  mediaType: 'movie' | 'tv'; // Determined during enrichment, essential for some API calls
}

export interface FeaturedCategory {
  id: string;
  title: string;
  items: FeaturedItem[];
}

export interface FeaturedContent {
  featuredItem?: FeaturedItem; // For the main carousel/hero section
  categories: FeaturedCategory[];
}
```

### 4.2. Backend: Data Fetching, Enrichment, and Caching - [x] DONE (CuratorService refactored)

-   **Responsibility**: `CuratorService` (or similar).
-   **Action**:
    1.  Fetch items from Prowlarr (e.g., trending, popular).
    2.  For each item, attempt to find matching `tmdbId` and enrich with TMDb metadata. Store this as `tmdbInfo`.
    3.  Store the `ProwlarrResult` and `tmdbInfo` (if available). Ensure the `guid` and `indexerId` are primary keys for Prowlarr actions.
-   **Testing**:
    *   Unit tests for TMDb enrichment logic (mock TMDb API client).
    *   Unit tests for Prowlarr fetching logic (mock Prowlarr API client).

### 4.3. API Endpoint: `/api/featured`

-   **Responsibility**: Serve `FeaturedContent` to the frontend.
-   **Action**: Retrieve data from cache/service. Ensure Prowlarr `guid` and `indexerId` are included for each `FeaturedItem`.
-   **Testing**:
    *   Integration test: Mock the backend service, call the API, and verify the response structure, including the presence of `guid` and `indexerId`.

### 4.4. Frontend: Data Transformation (`transformFeaturedItem`) - [x] DONE (Integrated into CuratorService and components)

File: `components/featured/FeaturedPage.tsx` or a dedicated `utils/transformer.ts`

-   **Responsibility**: Transform raw `FeaturedItem` data from the API into a display-ready format.
-   **Key Transformations**:
    *   Construct `fullPosterPath` from `item.tmdbInfo?.posterPath`.
    *   Construct `fullBackdropPath` from `item.tmdbInfo?.backdropPath`.
    *   Set `displayTitle` (e.g., from `item.tmdbInfo?.title` or `item.title`).
    *   Set `displayOverview` (e.g., from `item.tmdbInfo?.overview`).
    *   Provide default/fallback values for title, overview, images.
    *   Preserve `guid`, `indexerId`, and `mediaType`.
-   **Testing (Unit Tests)**:
    ```typescript
    // Example test cases for transformFeaturedItem
    it('should correctly form image URLs from TMDb paths', () => { /* ... */ });
    it('should use placeholder if image paths are missing from tmdbInfo', () => { /* ... */ });
    it('should use Prowlarr title if TMDb title is missing', () => { /* ... */ });
    it('should preserve Prowlarr guid and indexerId', () => { /* ... */ });
    it('should handle items with no tmdbInfo gracefully', () => { /* ... */ });
    ```

### 4.5. Frontend: Display Components (`FeaturedCarousel.tsx`, `MediaCard.tsx`) - [~] IN PROGRESS (FeaturedCarousel updated, MediaCard pending)

-   **Responsibility**: Display featured items and handle "Add to Library" action.
-   **Image Display**:
    *   Use `item.fullPosterPath` and `item.fullBackdropPath`.
-   **"Add to Library" Button**:
    *   On click, call a handler like `handleAddToLibrary(item.guid, item.indexerId, item.mediaType)`.
-   **Testing (Component Tests using React Testing Library)**:
    *   Mock `FeaturedItem` data (transformed).
    *   Verify images are rendered with correct `src` attributes.
    *   Verify `displayTitle`, `displayOverview` are shown.
    *   Simulate button click and verify the passed handler is called with the correct `guid`, `indexerId`, and `mediaType`.

### 4.6. Frontend: "Add to Library" Logic (e.g., `useLibraryManager` hook or `FeaturedPage` method) - [x] DONE (FeaturedPage.handleAddToLibrary refactored)

-   **Action**:
    1.  Accept `guid`, `indexerId`, `mediaType`.
    2.  Make a POST request to `/api/prowlarr/add` with `{ guid, indexerId, mediaType }`.
    3.  Handle success: Update UI (e.g., show "In Library" status via state update), display toast.
    4.  Handle error: Display error toast.
-   **Testing (Unit Tests)**:
    *   Mock `fetch` API.
    *   Verify correct endpoint and payload are used for `/api/prowlarr/add`.
    *   Test success and error handling logic (UI updates, toasts).

### 4.7. Backend API: `/api/prowlarr/add` - [~] VERIFY (Frontend calls it correctly, backend assumed functional)

-   **Responsibility**: Receive `guid`, `indexerId` from frontend and trigger download via Prowlarr.
-   **Request Body**: `{ guid: string, indexerId: string, mediaType: 'movie' | 'tv' }`
-   **Action**:
    1.  Validate input.
    2.  Call the Prowlarr API to add the item (identified by `guid` from `indexerId`) to the configured download client. (The exact Prowlarr API endpoint and parameters for this action must be verified from Prowlarr's API documentation).
    3.  Return `200 OK` on success, or an appropriate error status with a message.
-   **Testing (Integration Tests)**:
    *   Mock Prowlarr client/API.
    *   Call `/api/prowlarr/add` with valid and invalid data.
    *   Verify Prowlarr client is called with correct parameters.
    *   Verify correct HTTP responses.

## 5. Testing Strategy

-   **Unit Tests**: Jest and React Testing Library.
    -   Focus: Individual functions (transformers, helpers), React components in isolation, API interaction logic (with mocks).
-   **Integration Tests**: Jest/Supertest for API endpoints, React Testing Library for component compositions.
    -   Focus: Interaction between frontend components, frontend to backend API calls, backend API to external service (Prowlarr, TMDb) mocks.
-   **Manual Testing**:
    -   Verify UI display across different states.
    -   Test "Add to Library" flow end-to-end with a real Prowlarr setup in a development environment.

## 6. Security Considerations

-   **API Keys**: Continue using `.env` for `PROWLARR_API_KEY`, `TMDB_API_KEY`. Ensure these are server-side only.
-   **Input Validation**: Backend APIs (`/api/featured`, `/api/prowlarr/add`) must validate incoming requests.
-   **CSRF Protection**: Ensure Next.js built-in or custom CSRF protection is active for state-changing requests if using cookie-based sessions.

## 7. Integration into Current Codebase

-   **Directory Structure (Example)**:
    ```
    /components/featured/
    /lib/types/featured.ts
    /lib/services/prowlarrClient.ts
    /lib/services/tmdbClient.ts
    /lib/services/curatorService.ts
    /pages/api/featured/index.ts
    /pages/api/prowlarr/add.ts
    /hooks/useLibraryManager.ts (optional for frontend logic)
    /utils/transformer.ts (optional for transformation logic)
    /docs/featured_content_implementation_plan.md
    ```
-   **Running Tests**: `npm test` or `yarn test`.

## 8. Verification and Trust

This test-driven approach ensures:
-   Functionality is verified incrementally.
-   Regressions are caught early.
-   Tests serve as executable documentation.

**Verification Checklist (Post-Implementation):**

1.  [ ] All unit tests for `transformFeaturedItem` pass.
2.  [ ] All unit tests for frontend "Add to Library" logic pass.
3.  [ ] All component tests for `MediaCard` and `FeaturedCarousel` pass (image display, button action).
4.  [ ] All integration tests for `/api/featured` pass.
5.  [ ] All integration tests for `/api/prowlarr/add` pass.
6.  [ ] Manual Test: Featured section loads, images (posters/backdrops) are displayed correctly from TMDb.
7.  [ ] Manual Test: "Add to Library" button on `MediaCard` successfully triggers a download in Prowlarr using the item's `guid` and `indexerId`.
8.  [ ] Manual Test: "Add to Library" button on `FeaturedCarousel` (if applicable for a single featured item) successfully triggers a download.
9.  [ ] Manual Test: Error states (missing images, API errors for add to library) are handled gracefully with user feedback.
10. [ ] Code review completed and approved.

## 9. Conclusion

By following this detailed plan, focusing on clear separation of concerns (TMDb for metadata, Prowlarr `guid` for actions) and a robust testing strategy, we can deliver a functional, reliable, and trustworthy "Featured Content" section. This approach minimizes guesswork and provides a clear path to a successful implementation.
