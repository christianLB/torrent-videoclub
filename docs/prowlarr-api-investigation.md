# Prowlarr API Integration Investigation

## Task Description

Conduct a comprehensive analysis of the Prowlarr API (v1.35.1) to determine the correct approach for integrating it with our Torrent VideoClub application. The investigation should focus on:

1. Analyzing the official API documentation
2. Reviewing community implementations and examples
3. Examining our current implementation and identifying gaps
4. Testing direct API calls to validate approaches
5. Creating a working implementation that addresses all requirements

## Current Status

- We can successfully connect to Prowlarr and retrieve indexers
- Search functionality is failing across all tested API endpoints
- Current error patterns:
  - `405 Method Not Allowed` - Indicates incorrect HTTP methods
  - `404 Not Found` - Suggests incorrect endpoint paths
  - `400 Bad Request` - Points to incorrect request formatting

## Requirements Analysis

### Our Application Requirements

- **Indexer Discovery**: Retrieve all enabled indexers from Prowlarr
- **Movie Search**: Search for movies across all or specific indexers
- **Series Search**: Search for TV series across all or specific indexers
- **Result Normalization**: Standardize results from different indexers
- **Error Handling**: Gracefully handle API failures

### Current Implementation Gaps

- Our search implementation is not compatible with Prowlarr v1.35.1
- We lack clear understanding of the correct endpoints and parameters
- Error handling is in place but we're not getting past the initial request stage

## Investigation Plan

### Phase 1: Documentation Review
- Review official Prowlarr API documentation
- Analyze any breaking changes in recent versions
- Identify the correct endpoints for our use cases

### Phase 2: Direct API Testing
- Create a series of test API calls using different methods
- Test with single indexer vs. multiple indexers
- Validate authentication methods

### Phase 3: Community Research
- Review GitHub repositories using Prowlarr
- Check forum discussions about similar issues
- Look for working examples in other languages

### Phase 4: Implementation
- Create updated API client based on findings
- Test with real-world queries
- Refine and optimize the integration

## Progress Tracking

- [ ] Documentation review completed
- [ ] Direct API testing performed
- [ ] Community research conducted
- [ ] New implementation created
- [ ] Integration tested with real-world queries
- [ ] Performance optimized

## Notes and Findings

### Initial Investigation (2025-05-24)

After reviewing the Prowlarr API documentation and wiki, I've found that there are two main approaches for searching in Prowlarr:

#### 1. Newznab/Torznab Compatible Endpoints

These are per-indexer endpoints that follow standard Newznab/Torznab conventions:

```
http://{prowlarrhost}:{prowlarrport}/{indexerid}/api?t=search&q={term}&apikey={yourkey}&cat={comma separated list}
```

Example: `http://192.168.1.62:9696/11/api?t=search&q=matrix&apikey={yourkey}&cat=5000,2000`

The API key can also be provided as a header:
```
X-Api-Key: {yourkey}
```

#### 2. Direct API v1 Search Endpoint

Prowlarr also offers a direct API endpoint for searching:

```
http://{prowlarrhost}:{prowlarrport}/api/v1/search?query={encoded term}&indexerIds={comma separated list}&categories={comma separated list}&type={searchtype}
```

Example: `http://192.168.1.62:9696/api/v1/search?query=matrix&indexerIds=-1&categories=2000&type=search`

Special values for indexerIds:
- Leave off for all indexers
- `-2` for all torrents
- `-1` for all usenet

Type options:
- `search` - Basic text query
- `tvsearch` - TV query
- `moviesearch` - Movie query

### Issues with Our Current Implementation

1. We were attempting to use endpoints that don't exist in the Prowlarr API:
   - `/api/v1/release` (405 Method Not Allowed)
   - `/api/v1/search/manual` (405 Method Not Allowed)

2. We need to use either the Newznab/Torznab compatible endpoint for each indexer or the direct search API.

### Next Steps

1. Create a new implementation that uses the correct search endpoints
2. Test both approaches (Newznab/Torznab vs. direct API) to see which works better
3. Update our client to handle the correct response format from these endpoints
