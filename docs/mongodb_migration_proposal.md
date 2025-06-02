# Proposal: Migrating Torrent VideoClub Cache from Redis to MongoDB

**Date:** June 1, 2025
**Author:** Cascade (AI Coding Assistant)
**Status:** Proposed
**Urgency:** High

## 1. Introduction

This document outlines the rationale and a detailed plan for migrating the primary caching and near-real-time data storage mechanism for the Torrent VideoClub application from Redis to MongoDB. This proposal addresses critical limitations encountered with the current Redis implementation, particularly concerning complex data models, querying capabilities, and the associated operational and development costs. The goal is to establish a more robust, scalable, and flexible data backend that better supports the application's evolving feature set and data requirements.

## 2. Problem Statement: Limitations of the Current Redis Implementation

The Torrent VideoClub application currently leverages Redis for caching various types of data, including TMDB media information, curated featured content lists, and category-specific content. While Redis excels at simple key-value lookups and offers high performance for basic caching scenarios, its architecture presents significant challenges as the application's data complexity and querying needs grow:

*   **Inadequate Support for Complex Data Models and Relationships:**
    *   Redis, as a key-value store, does not natively support rich data models or relationships between different data entities (e.g., movies, TV shows, genres, actors). The application currently stores complex objects like `FeaturedContent` as large JSON blobs in single Redis keys (e.g., `featured:content`) or individual `TMDBMediaItem` objects.
    *   **Impact:** Managing consistency, performing relational queries (e.g., "find all movies in 'Action' genre released after 2020"), or updating nested data within these blobs is inefficient and requires significant application-side logic. This complexity has likely contributed to development overhead and potential data integrity issues, translating to increased costs.

*   **Limited Querying Capabilities:**
    *   Retrieving data from Redis is primarily based on known keys. Advanced searching, filtering based on multiple attributes, sorting, and aggregation are not well-supported or performant.
    *   **Impact:** Implementing features like advanced search, personalized recommendations, or dynamic content filtering based on multiple criteria becomes extremely challenging and resource-intensive. This limits the application's ability to provide a rich user experience and likely incurs costs in terms of missed feature opportunities or complex, inefficient workarounds.

*   **Data Duplication and Denormalization Challenges:**
    *   To work around query limitations, data often needs to be denormalized and duplicated across multiple keys or within large JSON structures. For instance, TMDB item details might exist both in a specific `tmdb:item:*` key and embedded within the `featured:content` blob.
    *   **Impact:** This increases storage overhead and complicates data updates, as changes need to be propagated to all relevant cached locations, risking inconsistencies. The `CuratorService` currently fetches and enriches TMDB data but doesn't seem to fully utilize individual TMDB item caching for its main `featured:content` object, potentially leading to repeated TMDB API calls if not managed carefully.

*   **Scalability of Complex Operations:**
    *   Operations on large JSON blobs (read, deserialize, modify, serialize, write) are not atomic beyond a single key and can be inefficient, especially for partial updates. As data volume and complexity grow, this can lead to performance degradation.
    *   **Impact:** Increased latency, higher Redis CPU usage, and potential bottlenecks, contributing to operational costs.

*   **Development and Maintenance Overhead:**
    *   Developers must implement complex logic within the application to simulate database-like functionalities (joins, complex filtering, relationship management) that Redis does not provide.
    *   **Impact:** This increases development time, code complexity, and the likelihood of bugs, directly impacting project timelines and costs. The "models weren't capable of solving" likely refers to this impedance mismatch between application data structures and Redis's capabilities.

These limitations collectively hinder the application's ability to evolve, introduce sophisticated features, and manage data efficiently, leading to both direct (development, infrastructure) and indirect (missed opportunities, user experience) costs.

## 3. Proposed Solution: Migration to MongoDB

We propose migrating the application's caching and dynamic data storage from Redis to MongoDB. MongoDB, a document-oriented NoSQL database, offers a compelling solution to the identified problems:

*   **Rich Document Model:** MongoDB stores data in BSON documents (similar to JSON), allowing for complex, nested data structures and arrays. This aligns well with the application's existing data models (`TMDBMediaItem`, `FeaturedItem`).
*   **Flexible Schema:** Schemas in MongoDB are dynamic, allowing for easier evolution of data structures as application requirements change.
*   **Powerful Query Language:** MongoDB provides a rich query language, supporting field-based queries, range queries, regular expressions, and complex logical operations.
*   **Indexing:** Comprehensive indexing capabilities (single field, compound, geospatial, text) enable high-performance queries on large datasets.
*   **Aggregation Framework:** Allows for complex data processing and analysis directly within the database.
*   **Scalability:** MongoDB is designed for horizontal scalability through sharding.
*   **Atomic Operations:** Supports atomic operations at the document level.

By leveraging MongoDB, we can define clear, queryable "models" directly in the database, significantly simplifying application logic and enabling more advanced features.

## 4. Proposed MongoDB Schema Design

We will transition from Redis keys to MongoDB collections. The following collections are proposed as a starting point:

### 4.1. `mediaItems` Collection
    *   **Purpose:** Stores detailed information for individual movies and TV shows, sourced primarily from TMDB and enriched as needed. Replaces `tmdb:item:*` Redis keys and the `TMDBMediaItem` structure.
    *   **Example Document Structure:**
        ```json
        {
          "_id": "<tmdbId_mediaType>", // e.g., "123_movie", "456_tv" (custom ID for uniqueness)
          "tmdbId": 123,
          "mediaType": "movie", // 'movie' or 'tv'
          "title": "Inception",
          "originalTitle": "Inception",
          "overview": "A thief who steals corporate secrets through use of dream-sharing technology...",
          "posterPath": "/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg",
          "backdropPath": "/s3TBrRGB1iav7gFOCNx3H31MoES.jpg",
          "releaseDate": "2010-07-15", // For movies
          "firstAirDate": "2019-11-12", // For TV
          "lastAirDate": "2020-12-18",  // For TV
          "voteAverage": 8.3,
          "genres": [{ "id": 28, "name": "Action" }, { "id": 878, "name": "Science Fiction" }],
          "runtime": 148, // Movie-specific
          "numberOfSeasons": 2, // TV-specific
          "tvdb_id": 12345,
          // Other relevant fields from TMDBMediaItem
          "lastRefreshedFromTmdb": "2025-06-01T10:00:00Z",
          "customTags": ["highly_rated", "mind_bending"], // Example for future use
          "prowlarrSearchResults": [ // Optional: Store recent Prowlarr search results for this item
            // { guid, indexerId, title, quality, size, publishDate, ... }
          ]
        }
        ```
    *   **Indexes:**
        *   `{ "tmdbId": 1, "mediaType": 1 }` (Unique)
        *   `{ "title": "text", "originalTitle": "text" }` (For text search)
        *   `{ "mediaType": 1, "releaseDate": -1 }`
        *   `{ "mediaType": 1, "firstAirDate": -1 }`
        *   `{ "genres.name": 1 }`
        *   `{ "voteAverage": -1 }`

### 4.2. `curatedLists` Collection
    *   **Purpose:** Stores definitions and ordered content for curated lists, such as "popular movies," "trending TV shows," or custom dynamic categories. Replaces `featured:content` and `tmdb:list:*` concepts.
    *   **Example Document Structure:**
        ```json
        {
          "_id": "popular_movies_tmdb", // Unique identifier for the list
          "title": "Popular Movies (from TMDB)",
          "description": "Currently popular movies as sourced from TMDB.",
          "type": "dynamic_tmdb_query", // or "manual_curation"
          "sourceTmdbEndpoint": "/movie/popular", // If dynamic
          "tmdbQueryParameters": { "page": 1, "region": "US" }, // If dynamic
          "mediaItemIds": [ // Ordered list of mediaItem _id references
            "123_movie", 
            "789_movie",
            // ...
          ],
          "lastRefreshed": "2025-06-01T12:00:00Z",
          "refreshIntervalSeconds": 3600,
          "isEnabled": true
        }
        ```
    *   **Indexes:**
        *   `{ "_id": 1 }` (Unique)
        *   `{ "title": 1 }`
        *   `{ "isEnabled": 1, "lastRefreshed": 1 }` (For refresh scheduling)

### 4.3. `appConfig` Collection (Optional)
    *   **Purpose:** Store global application configurations if any are currently in Redis or would benefit from DB storage.
    *   **Example Document Structure:**
        ```json
        {
          "_id": "featuredContentConfig",
          "defaultCarouselListId": "main_carousel_mixed",
          "maxCarouselItems": 15
        }
        ```

## 5. Migration Plan

The migration will be executed in a phased approach to minimize disruption and risk.

**Phase 1: Setup and Core Service Development**

1.  **Setup MongoDB Environment:**
    *   Provision a MongoDB instance (e.g., MongoDB Atlas, local Docker container for development).
    *   Create the necessary database and initial collections (`mediaItems`, `curatedLists`).
    *   Configure connection strings and environment variables (e.g., `MONGODB_URI`).
2.  **Develop `MongoService`:**
    *   Create a new service `lib/services/server/mongo-service.ts`.
    *   Implement methods for connecting to MongoDB, and performing CRUD operations on the defined collections (e.g., `findMediaItemById`, `findMediaItems`, `updateMediaItem`, `createCuratedList`, `getCuratedListWithPopulatedItems`).
    *   Utilize the official MongoDB Node.js driver. Consider Mongoose for schema definition and validation if preferred.
3.  **Refactor/Replace `CacheService` (e.g., to `DataService`):**
    *   The existing `CacheService` is tightly coupled with Redis. We will likely create a new `DataService` or adapt `CacheService` to interact with `MongoService`.
    *   Its role will shift from a simple cache abstraction to a more comprehensive data access layer.
    *   Update method signatures to reflect MongoDB's capabilities (e.g., accepting query objects).

**Phase 2: Refactoring Application Logic**

4.  **Refactor `CuratorService`:**
    *   Modify `initializeClients` to potentially remove direct Redis dependency if all its data moves to MongoDB.
    *   Rewrite `fetchFreshFeaturedContent` and `enrichWithTmdbMetadata`:
        *   When fetching data from Prowlarr/TMDB, store/update individual items in the `mediaItems` collection via `MongoService`.
        *   TMDB enrichment should directly update documents in `mediaItems`.
    *   Rewrite `getFeaturedContent` and `getCategory`:
        *   These methods will now query the `curatedLists` and `mediaItems` collections in MongoDB to assemble the required content. For example, `getFeaturedContent` might fetch a specific "main_carousel" document from `curatedLists` and then populate its `mediaItemIds` by querying `mediaItems`.
    *   Remove direct calls to `redisService`.
5.  **Refactor API Endpoints:**
    *   Identify all API routes currently using `redisService` or `cacheService` (e.g., `app/api/featured/*`, `app/api/tmdb/*`, `app/api/cache/*`).
    *   Update these routes to use the new `MongoService` or refactored `DataService`.
    *   The `/api/cache/*` routes for managing Redis cache will need to be re-evaluated. We might need new admin endpoints for MongoDB (e.g., triggering list refreshes, viewing collection stats).
6.  **Update `tmdbDataService` (if separate and uses Redis):**
    *   If `lib/services/server/tmdb-data-service.ts` (mentioned in memory `d4fcf316-ea5f-42f3-8db9-a1d0596d79d4`) uses Redis for caching TMDB API responses, it should be updated to use the `mediaItems` collection in MongoDB as its primary store and cache.

**Phase 3: Data Migration and Go-Live**

7.  **Data Migration Strategy:**
    *   **Option 1 (Fresh Fetch):** Forgo direct Redis-to-MongoDB data migration. Rely on the refactored services to populate MongoDB with fresh data from TMDB/Prowlarr upon first request or via a background priming process. This is simpler but may result in an initially "cold" system.
    *   **Option 2 (Scripted Migration):** Develop a one-time script to read relevant data from Redis (e.g., `tmdb:item:*` keys) and transform/insert it into the new MongoDB collections. This can preserve existing cached data but adds complexity.
    *   **Recommendation:** For `TMDBMediaItem` data, a scripted migration might be beneficial if a large volume of unique items is already cached in Redis. For `featured:content` or `tmdb:list:*`, it's likely better to re-curate/fetch fresh into the new `curatedLists` structure.
8.  **Configuration and Environment Updates:**
    *   Ensure `MONGODB_URI` and other necessary MongoDB-related environment variables are set in all environments (development, staging, production).
    *   Remove Redis-specific environment variables if Redis is being fully decommissioned for these purposes.
9.  **Comprehensive Testing:**
    *   **Unit Tests:** For `MongoService`, refactored `CuratorService`, and other modified components.
    *   **Integration Tests:** Test interactions between services and the MongoDB database.
    *   **End-to-End Tests:** Verify that API endpoints return correct data and frontend features function as expected.
    *   **Performance Testing:** Assess query performance and system load with MongoDB.
10. **Deployment Strategy:**
    *   Employ a blue/green deployment or canary release strategy if possible to minimize production impact.
    *   Monitor logs and performance closely post-deployment.
11. **Decommission Redis (for these use cases):**
    *   Once MongoDB is stable and validated in production, Redis instances used for this caching can be decommissioned or repurposed.

**Phase 4: Post-Migration**

12. **Monitoring and Optimization:**
    *   Set up MongoDB monitoring (e.g., using MongoDB Atlas tools, or other monitoring solutions).
    *   Regularly review query performance and optimize indexes as needed.
13. **Background Refresh Mechanisms:**
    *   Implement or adapt existing background jobs (e.g., `CacheRefreshService`) to periodically refresh data in `curatedLists` and `mediaItems` from external sources (TMDB, Prowlarr) and update MongoDB.

## 6. Impact Analysis

*   **Key Files/Modules to be Modified:**
    *   `lib/services/server/redis-service.ts` (to be replaced or heavily refactored if parts of Redis remain for other uses)
    *   `lib/services/server/cache-service.ts` (to be refactored or replaced by a `DataService`)
    *   `lib/services/server/curator-service.ts` (significant refactoring)
    *   `lib/services/server/tmdb-data-service.ts` (if it uses Redis)
    *   Various API routes in `app/api/`
    *   Environment configuration files/systems.
    *   Potentially frontend components if data structures change significantly (though the goal is to improve backend flexibility without major frontend contract changes initially).
*   **Dependencies:**
    *   Add MongoDB Node.js driver (e.g., `mongodb`) to `package.json`.
    *   Remove `ioredis` if Redis is fully decommissioned for these features.

## 7. Addressing the "Cost" Issue

This migration directly addresses the "cost" issues associated with Redis by:

*   **Reducing Development Cost & Time:** Simplifying application logic by offloading complex data querying and relationship management to MongoDB. This means less custom code to write, debug, and maintain.
*   **Improving Performance for Complex Queries:** Efficiently handling queries that were slow or impractical with Redis, potentially reducing infrastructure costs associated with high CPU load on the application servers trying to process data in-memory.
*   **Enabling Faster Feature Development:** A more flexible and capable data backend allows for quicker implementation of new data-driven features.
*   **Enhancing Data Integrity:** MongoDB's document model and atomic operations (at document level) can lead to better data consistency compared to manually managing relationships across Redis keys.
*   **Scalability:** MongoDB's architecture is designed for scaling, accommodating future growth in data volume and complexity more effectively than the current Redis setup for these use cases.

## 8. Rollback Strategy (High-Level)

Given the significant architectural change, a full immediate rollback would be complex. The deployment strategy should include:

*   Thorough testing in pre-production environments.
*   Feature flags or routing mechanisms to gradually shift traffic to the MongoDB-backed services, allowing for monitoring and quick rollback of the routing if major issues arise.
*   Maintaining the Redis-backed path for a short period post-migration (if feasible) as a fallback, though this adds complexity.

## 9. Timeline Estimate (High-Level & Urgent)

Given the stated urgency, an aggressive but realistic timeline is crucial. Assuming dedicated resources:

*   **Phase 1 (Setup & Core Service Dev):** 1-2 weeks
*   **Phase 2 (Application Logic Refactoring):** 3-5 weeks (this is the largest part, depends on complexity and number of services/endpoints)
*   **Phase 3 (Data Migration, Testing & Go-Live Prep):** 1-2 weeks
*   **Deployment & Initial Monitoring:** 1 week

**Total Estimated Time: 6-10 weeks.**
This can be expedited with parallel work streams where possible, but the core refactoring of services like `CuratorService` will be sequential.

## 10. Conclusion

Migrating from Redis to MongoDB for caching and dynamic content storage represents a strategic investment in the Torrent VideoClub application's future. It will address fundamental limitations of the current system, reduce ongoing development and operational friction, and provide a solid foundation for building more sophisticated, data-rich features. This move is critical to resolving the issues related to data modeling and querying that have impacted the project.
