/**
 * Diagnostic script to analyze the exact data structure of featured items
 * Using direct imports from the codebase to ensure consistency
 */

// Direct imports from our codebase
const { CuratorService } = require('../lib/services/curator-service');
const { TrendingContentClient } = require('../lib/services/trending-content-client');
const { ProwlarrClient } = require('../lib/services/prowlarr-client');
const { TMDbClient } = require('../lib/api/tmdb-client');

async function diagnoseItemStructure() {
  console.log('==== FEATURED CONTENT ITEM STRUCTURE DIAGNOSIS ====');
  
  try {
    // Initialize required services
    const prowlarrClient = new ProwlarrClient(
      process.env.PROWLARR_URL || 'http://localhost:9696',
      process.env.PROWLARR_API_KEY || ''
    );
    
    const trendingClient = new TrendingContentClient(
      process.env.PROWLARR_URL || 'http://localhost:9696', 
      process.env.PROWLARR_API_KEY || ''
    );
    
    const tmdbClient = new TMDbClient(
      process.env.TMDB_API_KEY || ''
    );
    
    const curatorService = new CuratorService();
    curatorService.initialize(prowlarrClient, trendingClient, tmdbClient);
    
    // Fetch sample data directly
    console.log('\n1. FETCHING SAMPLE DATA FROM PROWLARR...');
    const searchResults = await prowlarrClient.search({
      query: 'avengers',
      limit: 1
    });
    
    if (!searchResults || searchResults.length === 0) {
      console.log('No search results found');
      return;
    }
    
    console.log(`Found ${searchResults.length} search results`);
    const sampleItem = searchResults[0];
    
    console.log('\n2. SAMPLE ITEM FROM PROWLARR (BEFORE TMDB ENRICHMENT):');
    console.log(JSON.stringify(sampleItem, null, 2));
    
    // Extract the TMDb ID - showing how it's done
    console.log('\n3. EXTRACTING TMDB ID:');
    let tmdbId = null;
    
    // First check: try to extract from title
    if (sampleItem.title) {
      const imdbMatch = sampleItem.title.match(/tt\d{7,8}/);
      if (imdbMatch) {
        console.log(`Found IMDB ID: ${imdbMatch[0]} in title`);
      }
    }
    
    // Convert the item to a normalized format
    console.log('\n4. CONVERTING TO NORMALIZED FORMAT:');
    const normalizedItem = prowlarrClient.convertToFeaturedItem(sampleItem);
    console.log(JSON.stringify(normalizedItem, null, 2));
    
    // Check TMDb ID property 
    console.log('\n5. CHECKING TMDB ID IN NORMALIZED ITEM:');
    console.log(`normalizedItem.tmdbId: ${normalizedItem.tmdbId}`);
    console.log(`normalizedItem.tmdb?: ${normalizedItem.tmdb ? 'exists' : 'missing'}`);
    
    // Manually enrich with TMDb data
    console.log('\n6. ENRICHING WITH TMDB DATA:');
    // Try to find the TMDb ID first through search if not already set
    if (!normalizedItem.tmdbId) {
      console.log('TMDb ID not found in item, searching by title...');
      const searchResults = await tmdbClient.searchMovies(normalizedItem.title);
      if (searchResults && searchResults.length > 0) {
        tmdbId = searchResults[0].id;
        console.log(`Found TMDb ID through search: ${tmdbId}`);
        normalizedItem.tmdbId = tmdbId;
      } else {
        console.log('Could not find TMDb ID through search');
      }
    } else {
      tmdbId = normalizedItem.tmdbId;
      console.log(`Using existing TMDb ID: ${tmdbId}`);
    }
    
    // Enrich with TMDb metadata if we have an ID
    if (tmdbId) {
      try {
        const metadata = await tmdbClient.getMediaDetails(tmdbId, normalizedItem.mediaType || 'movie');
        console.log('\n7. TMDB METADATA RETURNED:');
        console.log(JSON.stringify(metadata, null, 2));
        
        console.log('\n8. IMAGE PATH FORMAT FROM TMDB:');
        console.log(`Poster Path: ${metadata.posterPath}`);
        console.log(`Backdrop Path: ${metadata.backdropPath}`);
        
        // Enrich the item
        console.log('\n9. ENRICHING ITEM WITH TMDB DATA:');
        Object.assign(normalizedItem, {
          overview: metadata.overview || normalizedItem.overview,
          backdropPath: metadata.backdropPath,
          posterPath: metadata.posterPath,
          rating: metadata.voteAverage || normalizedItem.rating || 0,
          genres: metadata.genres || normalizedItem.genres,
          year: metadata.releaseDate ? new Date(metadata.releaseDate).getFullYear() : normalizedItem.year,
          tmdbAvailable: true,
          tmdb: {
            ...normalizedItem.tmdb,
            id: metadata.id,
            posterPath: metadata.posterPath,
            backdropPath: metadata.backdropPath,
            overview: metadata.overview,
            title: metadata.title
          }
        });
        
        console.log('\n10. FINAL ENRICHED ITEM:');
        console.log(JSON.stringify(normalizedItem, null, 2));
        
        // Check the item structure for debugging the add to library functionality
        console.log('\n11. KEY PROPERTIES FOR ADD TO LIBRARY:');
        console.log(`item.guid: ${normalizedItem.guid}`);
        console.log(`item.tmdbId: ${normalizedItem.tmdbId}`);
        console.log(`item.tmdb?.id: ${normalizedItem.tmdb?.id}`);
        
        // Check the item structure for debugging the image display
        console.log('\n12. KEY PROPERTIES FOR IMAGE DISPLAY:');
        console.log(`item.posterPath: ${normalizedItem.posterPath}`);
        console.log(`item.tmdb?.posterPath: ${normalizedItem.tmdb?.posterPath}`);
        
        // Compare paths
        console.log('\n13. COMPARING PATHS:');
        if (normalizedItem.posterPath === normalizedItem.tmdb?.posterPath) {
          console.log('posterPath and tmdb.posterPath are identical');
        } else {
          console.log('posterPath and tmdb.posterPath are DIFFERENT:');
          console.log(`item.posterPath: ${normalizedItem.posterPath}`);
          console.log(`item.tmdb.posterPath: ${normalizedItem.tmdb?.posterPath}`);
        }
        
      } catch (error) {
        console.error('Error enriching with TMDb data:', error);
      }
    }
    
  } catch (error) {
    console.error('Diagnostic error:', error);
  }
}

// Run the diagnosis
diagnoseItemStructure();
