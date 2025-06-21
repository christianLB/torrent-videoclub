# Migration Checklist: From Legacy Frontend to APK

This checklist outlines the exact functionalities currently handled by the frontend embedded in `torrent-videoclub` that must be migrated to the Android app (`torrent-club-android`).

Each item below corresponds to one or more API endpoints described in `api-reference.md`.

---

### ✅ Functionality to Migrate

- [ ] **Home screen layout with featured content carousel**
  - Endpoint: `/api/featured/carousel-content`

- [ ] **Category browsing and navigation**
  - Endpoints: `/api/featured`, `/api/featured/category/[id]`

- [ ] **Movie and TV series search**
  - Endpoints: `/api/movies`, `/api/series`

- [ ] **Detailed media views (movie or series)**
  - Endpoints: `/api/movies/[id]/details`, `/api/series/[id]/details`, `/api/tmdb/item/[mediaType]/[tmdbId]`

- [ ] **Add to Library**
  - Endpoints: `/api/add/movie`, `/api/add/series`, `/api/add/tv`

- [ ] **Download Now (planned feature)**
  - Expected: POST endpoint that uses Prowlarr to find torrent and push to qBittorrent

- [ ] **Status indicator for already downloaded content**
  - Endpoints: `/api/radarr/library`, `/api/sonarr/library`

- [ ] **Fallback UI for loading and error states**

---

### 🔧 Purpose

This checklist will be used to guide the migration effort and verify completion before deprecating the legacy frontend.

All functionality must be verified as working inside the Fire TV APK client (`torrent-club-android`) using real data and user interactions.

---

> Codex: treat each checkbox as an actionable task and track implementation and testing until completed.
