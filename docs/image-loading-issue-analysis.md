# Analysis of Production Image Loading Issues for Media Cards

## 1. Problem Description

In the production environment, images within `MediaCard` components (used for displaying individual movies/TV shows in lists) are failing to load. The browser's developer console shows HTTP 400 (Bad Request) errors for requests made to the Next.js Image Optimization endpoint (`/_next/image`).

Conversely, images displayed in the `FeaturedCarousel` component *are* loading correctly. Both components source their images primarily from TMDB (`image.tmdb.org`).

## 2. Observed Symptoms

-   **Failed Image Loads:** `MediaCard` instances do not display their poster images.
-   **Console Errors:** Multiple 400 Bad Request errors are logged for URLs similar to:
    `http://<production_host>/_next/image?url=https%3A%2F%2Fimage.tmdb.org%2Ft%2Fp%2Fw500%2F{image_filename.jpg}&w=256&q=75`
-   **Working Carousel:** The `FeaturedCarousel` component successfully displays images from the same TMDB domain.

## 3. Analysis of Configurations and Components

### 3.1. `next.config.js` - Image Remote Patterns

The `next.config.js` includes the following configuration for `image.tmdb.org`:

```javascript
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'image.tmdb.org',
      port: '',
      pathname: '/t/p/**',
    },
    // ... other patterns
  ],
},
```

This configuration *should* allow Next.js Image Optimization for URLs matching `https://image.tmdb.org/t/p/...`.

### 3.2. `MediaCard.tsx` (Failing Images)

-   **Image URL Construction:**
    ```typescript
    const imageTmdbBaseUrl = 'https://image.tmdb.org';
    let fullPosterPath = '/placeholder_500x750.svg';
    if (posterPath) {
      if (posterPath.startsWith('http')) {
        fullPosterPath = posterPath;
      } else {
        const cleanPosterPath = posterPath.startsWith('/') ? posterPath : `/${posterPath}`;
        fullPosterPath = `${imageTmdbBaseUrl}/t/p/w500${cleanPosterPath}`;
      }
    }
    ```
-   **`next/image` Usage:**
    ```jsx
    <Image
      src={fullPosterPath}
      alt={displayTitle}
      fill
      sizes="(max-width: 768px) 30vw, 180px"
      priority={false}
      loading="lazy"
      // ...
    />
    ```
    Notably, `unoptimized` is not set (defaults to `false`), so Next.js Image Optimization is used.

### 3.3. `FeaturedCarousel.tsx` (Working Images)

-   **Image URL Construction:**
    ```typescript
    const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/';
    // ...
    if (item.backdropPath) {
      if (item.backdropPath.startsWith('http')) {
        imageUrl = item.backdropPath;
      } else {
        const cleanBackdropPath = item.backdropPath.startsWith('/') ? item.backdropPath : `/${item.backdropPath}`;
        imageUrl = `${TMDB_IMAGE_BASE_URL}w1280${cleanBackdropPath}`;
      }
    } else if (item.posterPath) { /* Similar logic for posterPath */ }
    ```
-   **`next/image` Usage:**
    ```jsx
    <Image
      src={imageUrl}
      alt={item.title ?? 'Carousel item image'}
      fill
      // ...
      unoptimized={true} // KEY DIFFERENCE
    />
    ```
    The `unoptimized={true}` prop causes Next.js to serve the image directly from the `src` URL, bypassing the `/_next/image` optimization endpoint.

## 4. Hypotheses for 400 Errors in `MediaCard`

The `next.config.js` seems correct, and the `fullPosterPath` constructed in `MediaCard.tsx` (e.g., `https://image.tmdb.org/t/p/w500/some_image.jpg`) should match the `remotePatterns`.
The 400 Bad Request from `/_next/image` could be due to:

1.  **Upstream Fetch Failure by Next.js Server:** The Next.js server, when attempting to fetch the image from the `fullPosterPath` (e.g., from `image.tmdb.org`) for optimization, receives an error (like 404 Not Found, 403 Forbidden) from TMDB. Next.js might then translate this into a 400 Bad Request to the client. This could happen if some `posterPath` values are invalid, stale, or point to non-existent/restricted images on TMDB's side.
2.  **Subtle Mismatch with `remotePatterns`:** Although unlikely given the current pattern and URL structure, a very subtle deviation in the actual `fullPosterPath` values in some edge cases might cause them not to be recognized by the optimizer, despite appearing correct.
3.  **Production Environment/Build Issues:** A discrepancy in how the `next.config.js` is applied or how URLs are handled in the production environment/build compared to development.

## 5. Recommended Investigation Steps & Solutions

1.  **Verify `posterPath` Data Integrity (Highest Priority):**
    *   **Action:** Log the exact `item.posterPath` values being passed to `MediaCard` components in the production environment (or a staging environment that replicates the issue).
    *   **Verification:** For any failing image, take its logged `posterPath` and manually construct the full TMDB URL (e.g., `https://image.tmdb.org/t/p/w500/{posterPath_value}`). Attempt to open this URL directly in a browser. If it results in a 404 or other error from TMDB, the root cause is invalid data for those specific items.
    *   **Source:** Investigate the data pipeline (e.g., `app/api/featured/route.ts`, `CuratorService`) that provides data to the `MediaCard` components to ensure image paths are valid and correctly formatted.

2.  **Temporarily Use `unoptimized={true}` in `MediaCard` (Diagnostic):**
    *   **Action:** In `MediaCard.tsx`, add `unoptimized={true}` to the `<Image>` component.
    *   **Observation:** Deploy and check if images now load. If they do, it strongly confirms the issue lies within the Next.js Image Optimization pipeline's interaction with these specific image URLs (possibly due to Hypothesis 1).
    *   **Note:** This can serve as a temporary workaround but doesn't fix the underlying cause if it's data-related or an optimizer issue.

3.  **Examine Production Server Logs for `/_next/image`:**
    *   **Action:** If accessible, review the server-side logs of the Next.js application in production when these 400 errors occur. Next.js might provide more specific error messages about why it failed to process/optimize the image (e.g., "Source image not found from upstream", "Upstream server responded with 403/404").

4.  **Ensure Consistent URL Handling for Relative Paths:**
    *   The current logic in `MediaCard.tsx` for handling `posterPath` (prepending `/` if missing and then constructing the full URL) is generally good. Double-check that `posterPath` values are consistently *just the filename or path segment* (e.g., `/xyz.jpg` or `xyz.jpg`) and do not unexpectedly contain parts of the base URL or size segments, which could lead to malformed final URLs like `https://image.tmdb.org/t/p/w500//t/p/w500/xyz.jpg`.

5.  **Review and Simplify `remotePatterns` (Temporary Test):**
    *   **Action:** As a very temporary diagnostic, broaden the `pathname` for `image.tmdb.org` in `next.config.js` to `pathname: '/**'`.
    *   **Observation:** Deploy and test. If this resolves the issue, it indicates the original `pathname: '/t/p/**'` was too restrictive or not matching as expected. *This should be reverted immediately after testing due to security implications.*

6.  **Clean Build and Deployment:**
    *   **Action:** Perform a completely clean build (`rm -rf .next && npm run build` or `yarn build`) and redeploy to ensure the latest configurations and code are active, ruling out stale build artifacts.

By systematically investigating these areas, particularly the integrity of the `posterPath` data and the behavior with `unoptimized={true}`, the root cause of the 400 errors should be identifiable.

## 6. Testing and Validation

To ensure the image loading functionality is robust and to prevent regressions, the following testing strategies should be implemented:

### 6.1. Manual Testing (Post-Deployment)

*   **Visual Inspection:** After any deployment involving changes to image handling or related data sources, visually inspect pages containing `MediaCard` components across different categories and item types.
    *   Verify that poster images are loading correctly.
    *   Check the browser's developer console for any `/_next/image` errors or other image-related warnings.
*   **Test with Edge Cases:**
    *   Items with known missing `posterPath` (if applicable, to ensure placeholders are shown).
    *   Items with potentially unusual `posterPath` formats (if any are known).
*   **Cross-browser Testing:** Check on major supported browsers (Chrome, Firefox, Safari, Edge).

### 6.2. Automated Testing (Future Enhancement)

*   **Component-Level Tests (e.g., using Vitest/React Testing Library):**
    *   Mock `TMDBMediaItem` props passed to `MediaCard`.
    *   Test scenarios:
        *   Valid `posterPath`: Assert that the `next/image` component receives a correctly formatted `src` URL. If testing with `unoptimized={true}`, ensure the direct TMDB URL is passed. If testing with optimization enabled, ensure the `src` is correctly passed for the optimizer.
        *   Null/undefined `posterPath`: Assert that the placeholder image `src` is used.
        *   `posterPath` that is already a full URL: Assert it's used directly.
    *   These tests primarily validate the URL construction logic within the component.
*   **End-to-End Tests (e.g., using Playwright/Cypress):**
    *   Navigate to pages that display `MediaCard` components.
    *   Assert that `<img>` tags within the cards are present and their `src` attributes are not empty or pointing to placeholders (unless expected).
    *   Check for the absence of 400 errors related to `/_next/image` in the browser console during the test run.
    *   These tests provide higher confidence that images are rendering correctly in a live-like environment.

### 6.3. Data Source Monitoring

*   Implement checks or alerts on the backend (e.g., in `CuratorService` or data fetching routines) to identify and log items from TMDB or Prowlarr that have missing or potentially invalid image paths before they are cached or served to the frontend. This helps catch data integrity issues proactively.

By combining these testing approaches, we can increase confidence in the stability of the image loading feature.
