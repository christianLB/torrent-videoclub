# Torrent Videoclub API Reference

This document lists the REST endpoints exposed under `app/api/`. Each section notes the HTTP method, path, expected input, response details, external integrations and whether it is safe for use from the Android APK frontend.

## 1. TMDB Browsing

These endpoints are used by the frontend to browse or search media through TMDB and Prowlarr.

| Method | Route | Description | Input | Output | External Services | Android Safe |
| ------ | ----- | ----------- | ----- | ------ | ----------------- | ------------ |
| GET | `/api/featured` | Returns curated featured content, falling back to cache or mock data. | None | JSON with featured items. | Prowlarr, TMDB, MongoDB cache | Yes |
| GET | `/api/featured/carousel-content` | Randomized carousel items excluding titles already in Radarr/Sonarr libraries. | None | Array of media items. | Radarr, Sonarr, TMDB | Yes |
| GET | `/api/featured/category/[id]` | Fetch a single curated category by id. | URL param `id` | Category JSON or 404. | MongoDB cache | Yes |
| GET | `/api/movies` | Search for movies. | Query: `query` (required), `year` (optional). | Array of search results. | Prowlarr, TMDB | Yes |
| GET | `/api/movies/[id]/details` | Fetch movie details from TMDB. | URL param `id` | Movie JSON or error. | TMDB | Yes |
| GET | `/api/series` | Search TV series. | Query: `query` (required), `year` (optional). | Array of search results. | Prowlarr, TMDB | Yes |
| GET | `/api/series/[id]/details` | Fetch series details from TMDB. | URL param `id` | Series JSON or error. | TMDB | Yes |
| GET | `/api/tmdb/item/[mediaType]/[tmdbId]` | Fetch a single TMDB item (`movie` or `tv`). | URL params `mediaType`, `tmdbId` | Item JSON or 404. | TMDB | Yes |
| GET | `/api/tmdb/movies/popular` | Popular movies listing. | Query: `page` | Array of movies or 503/500 on error. | TMDB | Yes |
| GET | `/api/tmdb/movies/top_rated` | Top rated movies listing. | Query: `page` | Array of movies or 503/500 on error. | TMDB | Yes |
| GET | `/api/tmdb/movies/trending` | Trending movies. | Query: `page`, `timeWindow` (`day`/`week`) | Array of movies or 503/500 on error. | TMDB | Yes |
| GET | `/api/tmdb/movies/upcoming` | Upcoming movies. | Query: `page` | Array of movies or 503/500 on error. | TMDB | Yes |
| GET | `/api/tmdb/tv/popular` | Popular TV shows. | Query: `page` | Array of shows or 503/500 on error. | TMDB | Yes |
| GET | `/api/tmdb/tv/trending` | Trending TV shows. | Query: `page`, `timeWindow` (`day`/`week`) | Array of shows or 503/500 on error. | TMDB | Yes |

## 2. Library Control

Endpoints that add content to Radarr or Sonarr or modify categories.

| Method | Route | Description | Input | Output | External Services | Android Safe |
| ------ | ----- | ----------- | ----- | ------ | ----------------- | ------------ |
| POST | `/api/add/movie` | Add a movie to Radarr. Fetches details from TMDB before adding. | JSON `{ "tmdbId": number }` | `{ success: true, movie: ... }` or error JSON. | Radarr, TMDB | Yes |
| POST | `/api/add/series` | Add a series to Sonarr. | JSON `{ "tmdbId": number }` | `{ success: true, series: ... }` or error JSON. | Sonarr, TMDB | Yes |
| POST | `/api/add/tv` | Alternative Sonarr add endpoint with extra validation. | JSON `{ "tmdbId": number }` | `{ success: true, series: ... }` or error JSON. | Sonarr, TMDB | Yes |
| GET/POST | `/api/admin/categories` | Retrieve or modify custom categories. | GET none, POST JSON body for category. | Category list or `{ success: true }`. | MongoDB | Yes (requires privileges) |

## 3. Download Control

No direct torrent download endpoints currently exist. Downloads are initiated indirectly when items are added to Radarr or Sonarr via the endpoints above.

## 4. Status Queries

Endpoints for health checks, cache status or library lists.

| Method | Route | Description | Input | Output | External Services | Android Safe |
| ------ | ----- | ----------- | ----- | ------ | ----------------- | ------------ |
| GET | `/api/health` | Basic server health check. | None | `{ status: 'ok', timestamp, uptime }` | None | Yes |
| GET | `/api/cache` | Inspect featured content cache status. | None | Cache metadata JSON. | MongoDB | Yes |
| POST | `/api/cache/refresh` | Force refresh of the featured content cache. | None | `{ success: true }` or error JSON. | Prowlarr, TMDB, MongoDB | Yes |
| GET | `/api/radarr/library` | List TMDB IDs already in Radarr. | None | `{ tmdbIds: number[] }` or error JSON. | Radarr | Yes |
| GET | `/api/sonarr/library` | List TMDB IDs already in Sonarr. | None | `{ tmdbIds: number[] }` or error JSON. | Sonarr | Yes |

