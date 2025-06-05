# Backend API Reference

This document lists the API routes found under the `app/api/` directory of the project. These endpoints are used by the frontend and Android/Fire TV clients.

## Route Overview

| Path | Method | Description |
| ---- | ------ | ----------- |
| `/api/health` | `GET` | Basic health check. |
| `/api/featured` | `GET` | Returns curated featured content. |
| `/api/featured/carousel-content` | `GET` | Items for the home carousel. |
| `/api/featured/category/[id]` | `GET` | Retrieve a single category by ID. |
| `/api/movies` | `GET` | Search for movies. See parameters below. |
| `/api/movies/[id]/details` | `GET` | Movie details from TMDb. |
| `/api/series` | `GET` | Search for TV series. See parameters below. |
| `/api/series/[id]/details` | `GET` | Series details from TMDb. |
| `/api/add/movie` | `POST` | Add a movie to Radarr. |
| `/api/add/series` | `POST` | Add a series to Sonarr. |
| `/api/radarr/library` | `GET` | TMDb IDs currently in Radarr. |
| `/api/sonarr/library` | `GET` | TMDb IDs currently in Sonarr. |
| `/api/admin/categories` | `GET/POST` | Manage custom categories. |
| `/api/tmdb/item/[mediaType]/[tmdbId]` | `GET` | Fetch a TMDb item (`movie` or `tv`). |
| `/api/tmdb/movies/popular` | `GET` | Popular movies from TMDb. |
| `/api/tmdb/movies/top_rated` | `GET` | Top rated movies from TMDb. |
| `/api/tmdb/movies/trending` | `GET` | Trending movies from TMDb. |
| `/api/tmdb/movies/upcoming` | `GET` | Upcoming movies from TMDb. |
| `/api/tmdb/tv/popular` | `GET` | Popular TV shows from TMDb. |
| `/api/tmdb/tv/trending` | `GET` | Trending TV shows from TMDb. |

## Search Endpoints

### `/api/movies`
* **query** – text to search for (required).
* **year** – filter results by year (optional).

### `/api/series`
* **query** – text to search for (required).
* **year** – filter results by year (optional).

### `/api/featured`
This endpoint has no query parameters and simply returns curated content for the landing page.

## Add to Library

### `/api/add/movie`
Add a movie to Radarr using a JSON body:

```json
{ "tmdbId": 123 }
```

`RADARR_URL` and `RADARR_API_KEY` must be set in the environment for this to succeed.

### `/api/add/series`
Add a TV series to Sonarr with a JSON body:

```json
{ "tmdbId": 123 }
```

Requires `SONARR_URL` and `SONARR_API_KEY` environment variables.

## Library Status Endpoints

### `/api/radarr/library`
Returns `{ "tmdbIds": number[] }` with the list of items already present in Radarr.
The server reads `RADARR_URL` and `RADARR_API_KEY` from the environment. No additional authentication is performed.

### `/api/sonarr/library`
Returns `{ "tmdbIds": number[] }` with the list of items already present in Sonarr.
The server reads `SONARR_URL` and `SONARR_API_KEY` from the environment. No additional authentication is performed.

