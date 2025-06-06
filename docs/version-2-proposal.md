# Torrent VideoClub 2.0 - Feature Proposal

**Date:** May 26, 2025  
**Version:** 1.5  
**Status:** Implementation In Progress  

## 1. Introduction

This document outlines the vision and implementation plan for Torrent VideoClub 2.0, evolving from the current proof-of-concept search tool into a comprehensive content discovery platform. Building on the foundation of version 1.0, this update focuses on enhancing the user experience through a configurable "Featured Content" system inspired by popular torrent indexing sites like yts.rs and rarbg.to, while maintaining the project's hacker aesthetic and technical excellence.

## 2. Current State Assessment

### 2.1 Capabilities

Torrent VideoClub 1.0 currently provides:

- Integration with Prowlarr for torrent search capabilities
- Optional TMDb integration for enhanced metadata
- Responsive hacker-themed UI with green-on-black terminal aesthetics
- Error handling with graceful degradation when APIs are unavailable
- Test-driven development approach ensuring code reliability

### 2.2 Limitations

The current implementation functions primarily as a reactive search tool, requiring users to:

- Know what content they are looking for
- Manually initiate searches for each item of interest
- Navigate from an empty starting state

## 3. Version 2.0 Core Features

### 3.1 Featured Content System

The centerpiece of version 2.0 will be a configurable home page displaying curated content selections without requiring user search input.

#### Key Components:

**Featured Carousel:**
- Full-width, visually striking presentation of 5-8 high-quality recent releases
- Auto-rotating carousel with manual navigation controls
- Rich metadata display including title, year, quality, and brief synopsis

**Category Rows:**
- Horizontally scrollable rows organized by configurable categories
- Each row displays 6-10 items with pagination for additional content
- Categories can be based on genre, quality, release timeframe, or popularity

**Enhanced Media Cards:**
- Improved visual presentation with hover effects
- Quick-access buttons for instant actions (add to Radarr/Sonarr)
- Visual indicators for content state (in library, currently downloading)
- Compact yet informative display of key metadata

### 3.2 Content Curation Approaches

#### API-Driven Curation:
- Automated retrieval of top content from Prowlarr based on configurable parameters:
  - Seeder count threshold
  - Quality filters (1080p, 4K, etc.)
  - Release date ranges
- Integration with TMDb "trending" and "popular" endpoints where available
- Intelligent mapping between Prowlarr results and TMDb metadata

#### Configuration System:
- User-defined categories and filters determining what appears in featured sections
- Adjustable thresholds for content quality and popularity
- Options for content refresh frequency and display preferences

#### Caching Layer:
- Periodic background refreshing of featured content
- Local storage of curated lists to minimize API calls
- Intelligent update system that prioritizes freshness while conserving resources

## 4. Technical Architecture

### 4.1 System Overview

```
┌─────────────────────────────────────────────────┐
│ Client Application                              │
├─────────────────────────────────────────────────┤
│ ┌─────────────┐  ┌─────────────┐  ┌───────────┐ │
│ │ Featured    │  │ Search      │  │ Detail    │ │
│ │ Dashboard   │  │ Interface   │  │ Views     │ │
│ └─────────────┘  └─────────────┘  └───────────┘ │
└───────────────────────┬─────────────────────────┘
                        │
┌───────────────────────┼─────────────────────────┐
│ API Layer             │                         │
├───────────────────────┼─────────────────────────┤
│ ┌─────────────┐  ┌────┴────────┐  ┌───────────┐ │
│ │ Featured    │  │ Search      │  │ Detail    │ │
│ │ API         │  │ API         │  │ API       │ │
│ └──────┬──────┘  └──────┬──────┘  └─────┬─────┘ │
└────────┼───────────────┬┼──────────────┬┼───────┘
         │               ││              ││
┌────────┼───────────────┼┼──────────────┼┼───────┐
│ Core Services          ││              ││       │
├────────┼───────────────┼┼──────────────┼┼───────┤
│ ┌──────┴──────┐  ┌─────┴┴─────┐  ┌─────┴┴─────┐ │
│ │ Curator     │  │ Content    │  │ Metadata   │ │
│ │ Service     │  │ Fetcher    │  │ Service    │ │
│ └──────┬──────┘  └─────┬──────┘  └──────┬─────┘ │
│        │               │                │       │
│ ┌──────┴───────────────┴────────────────┴─────┐ │
│ │              Cache Manager                  │ │
│ └──────┬───────────────┬────────────────┬─────┘ │
└────────┼───────────────┼────────────────┼───────┘
         │               │                │
┌────────┼───────────────┼────────────────┼───────┐
│ External│Integrations  │                │       │
├────────┼───────────────┼────────────────┼───────┤
│ ┌──────┴──────┐  ┌─────┴──────┐  ┌──────┴─────┐ │
│ │ Prowlarr    │  │ TMDb       │  │ Radarr/    │ │
│ │ Client      │  │ Client     │  │ Sonarr     │ │
│ └─────────────┘  └────────────┘  └────────────┘ │
└─────────────────────────────────────────────────┘
```

### 4.2 Key Components

**Curator Service:**
- Responsible for selecting and organizing featured content
- Implements configurable rules for content selection
- Maintains category organization and featured highlights

**Content Fetcher:**
- Handles API communication with Prowlarr
- Implements pagination and filtering logic
- Normalizes results from different sources

**Metadata Service:**
- Enriches content with TMDb data when available
- Handles image optimization and formatting
- Provides fallback data when external services are unavailable

**Library Status Service:**
- Simulates content library status using mock data (first iteration)
- Provides placeholders for download status indicators
- Prepared for future integration with Radarr/Sonarr
- Will eventually maintain real-time information on download progress

**Cache Manager:**
- Implements tiered caching strategy:
  - In-memory cache for active browsing session
  - Persistent cache for featured content
  - Refresh strategies based on content type and age

## 5. User Interface Design

### 5.1 Home Page Layout

```
┌────────────────────────────────────────────────┐
│ ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐ │
│   TERMINAL VIDEOCLUB v2.0 █                    │
│ └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘ │
│                                                │
│ ┌────────────────────────────────────────────┐ │
│ │                                            │ │
│ │               FEATURED ITEM                │ │
│ │                                            │ │
│ │    Title: The Matrix Resurrections         │ │
│ │    Year: 2021 | Quality: 2160p | ▓▓▓▓▓░░░  │ │
│ │                                            │ │
│ └────────────────────────────────────────────┘ │
│                                                │
│ > TRENDING MOVIES                     [view_all]│
│ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐     │
│ │    │ │    │ │    │ │    │ │    │ │    │ >   │
│ │    │ │    │ │    │ │    │ │    │ │    │     │
│ └────┘ └────┘ └────┘ └────┘ └────┘ └────┘     │
│                                                │
│ > TOP TV SHOWS                        [view_all]│
│ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐     │
│ │    │ │    │ │    │ │    │ │    │ │    │ >   │
│ │    │ │    │ │    │ │    │ │    │ │    │     │
│ └────┘ └────┘ └────┘ └────┘ └────┘ └────┘     │
│                                                │
│ > 4K CONTENT                          [view_all]│
│ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐     │
│ │    │ │    │ │    │ │    │ │    │ │    │ >   │
│ │    │ │    │ │    │ │    │ │    │ │    │     │
│ └────┘ └────┘ └────┘ └────┘ └────┘ └────┘     │
└────────────────────────────────────────────────┘
```

### 5.2 Media Card Design

```
┌──────────────────────────┐
│                          │
│      ┌────────────┐      │
│      │IN LIBRARY  │      │
│      └────────────┘      │
│       Poster Image       │
│                          │
├──────────────────────────┤
│ Title: Movie Name        │
│ Year: 2023 | Rating: 8.5 │
│ Quality: 2160p | 12.4 GB │
│ [✓ Added] [▶ Details]    │
└──────────────────────────┘
```

Or for content being downloaded:

```
┌──────────────────────────┐
│                          │
│      ┌────────────┐      │
│      │DOWNLOADING │      │
│      │    67%     │      │
│      └────────────┘      │
│       Poster Image       │
├──────────────────────────┤
│ Title: Movie Name        │
│ Year: 2023 | Rating: 8.5 │
│ Quality: 2160p | 12.4 GB │
│ [⟳ Pause] [▶ Details]    │
└──────────────────────────┘
```

### 5.3 Configuration Interface

```
┌─────────────────────────────────────────────────┐
│ FEATURED CONTENT CONFIGURATION                  │
├─────────────────────────────────────────────────┤
│                                                 │
│ > CONTENT CATEGORIES                            │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ │
│ │ Trending│ │ TV Shows│ │ 4K Films│ │ + Add   │ │
│ │ Movies  │ │         │ │         │ │ Category│ │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘ │
│                                                 │
│ > QUALITY FILTERS                               │
│ Min Quality: [ 1080p       ▼ ]                  │
│ Min Seeders: [ 20          ▲ ] ▓▓▓▓▓▓░░░░       │
│                            ▼                    │
│ > TIME RANGE                                    │
│ Include releases from: [ Last 30 days  ▼ ]      │
│                                                 │
│ > REFRESH SETTINGS                              │
│ (●) Auto-refresh: Every [ 12 ] hours            │
│ ( ) Manual refresh only                         │
│                                                 │
│ [ SAVE CONFIGURATION ] [ TEST SETTINGS ]        │
└─────────────────────────────────────────────────┘
```

## 6. Implementation Plan

### 6.0 Implementation Strategy

For the first iteration of Version 2.0, the application will **not** depend on external services for persistence. Instead:

- Library and download status functionality will be implemented as placeholders
- Static configuration files will be used instead of databases
- In-memory caching will be used for session persistence
- Mock data will provide simulated content states

This approach allows for rapid development and testing of the UI and user experience without external dependencies. Integration with actual persistence services will be implemented in subsequent iterations after core functionality has been validated.

### 6.1 Phase 1: Foundation (2-3 weeks) - COMPLETED ✓
- ✓ Create API endpoints for featured content retrieval
  - Implemented `/api/featured` endpoint to serve curated content
  - Added test suite following TDD methodology
- ✓ Build core curator service logic with mock data support
  - Created `CuratorService` with static methods for content management
  - Implemented `getMockFeaturedContent()` function for development
- ✓ Develop type system for featured content
  - Defined interfaces for `EnhancedMediaItem`, `FeaturedCategory`, and `FeaturedContent`
  - Added properties for library status indicators (inLibrary, downloading, downloadProgress)

### 6.2 Phase 2: UI Development (3-4 weeks) - COMPLETED ✓
- ✓ Implement featured carousel component
  - Created `FeaturedCarousel` component with backdrop image and content details
  - Added play and add-to-library buttons
- ✓ Create category rows with horizontal scrolling
  - Implemented `CategoryRow` component with horizontal scrolling
  - Added CSS for hiding scrollbars while maintaining scroll functionality
- ✓ Design enhanced media cards with library/download status indicators
  - Created `MediaCard` component with poster images and metadata
  - Implemented `LibraryIndicator` and `DownloadIndicator` components
  - Added hover effects with quick-action buttons
- ✓ Main featured page component
  - Created `FeaturedPage` component to fetch and display featured content
  - Implemented loading and error states
  - Integrated all UI components into a cohesive experience

### 6.3 Phase 3: Integration (2-3 weeks) - IN PROGRESS
- ✓ Connect UI components to API endpoints
  - Set up data fetching in the `FeaturedPage` component
  - Implemented proper error handling
- ✓ Implement persistent caching strategies
  - Created `CacheService` using localStorage for persistent storage
  - Added cache expiration (1 hour default)
  - Implemented fallback to cached content when API requests fail
- ✓ Add background refresh system
  - Implemented `CacheRefreshService` for periodic background data refreshing (30-minute interval)
  - Added clean-up on component unmount
- ✓ Optimize image loading and processing
  - Added lazy loading for media card images
  - Implemented progressive image loading with low-quality placeholders
  - Created loading skeletons/animations for better visual feedback
  - Optimized image sizes and added proper sizing hints

### 6.4 Phase 4: Refinement and Real Service Integration (3-4 weeks) - IN PROGRESS
- ⚠️ UI Navigation Improvements (PENDING)
  - Fix duplicate navigation issues
  - Integrate Featured section into main navigation
  - Ensure consistent layout across the application
- ⚠️ "See All" Functionality (PENDING)
  - Create dedicated category pages
  - Implement pagination and filtering
  - Add sorting options
- ⚠️ Connect to Prowlarr API (PENDING)
  - Replace mock data with real Prowlarr search queries
  - Implement trending and popular content algorithms
  - Set up search categories based on genres and quality
- ⚠️ Integrate with TMDb API (PENDING)
  - Enhance Prowlarr results with rich metadata
  - Implement proper image fallback mechanisms
  - Add genre and rating filtering
- ⚠️ Connect to Radarr/Sonarr (PENDING)
  - Query for real library status
  - Implement actual download status monitoring
  - Create real-time progress updates
- ⚠️ Configuration Interface (PENDING)
  - Create UI for customizing featured content
  - Implement settings persistence
  - Add category management
- ⚠️ Cross-browser and responsive testing
  - Test on various browsers and screen sizes
  - Fix any responsiveness issues

## 7. Future Considerations

Beyond version 2.0, potential enhancements could include:

- Implementation of actual persistence layer replacing placeholder functionality
- Full integration with Radarr/Sonarr for real library status
- User accounts with personalized recommendations
- Watch history and favorites tracking
- Content filtering based on user preferences
- Integration with additional metadata sources
- Community features (ratings, comments)
- Subtitle availability indicators

## 8. Conclusion

Torrent VideoClub 2.0 transforms the application from a simple search utility into a comprehensive content discovery platform. By implementing a featured content system with configurable curation, the platform provides immediate value upon launch while maintaining the technical excellence and hacker aesthetic established in version 1.0.

The modular approach ensures that the application can continue to evolve with additional features in future releases, creating a sustainable foundation for ongoing development.
