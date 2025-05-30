/**
 * Comprehensive diagnostic script for featured content pipeline
 * This script will test each step of the featured content data flow
 */

// Load environment variables
require('dotenv').config();

// Using built-in fetch API (Node.js 18+)
const { ProwlarrClient } = require('../lib/services/prowlarr-client');
const { TrendingContentClient } = require('../lib/services/trending-content-client');

// Get environment variables
const PROWLARR_URL = process.env.PROWLARR_URL;
const PROWLARR_API_KEY = process.env.PROWLARR_API_KEY;
const TMDB_API_KEY = process.env.TMDB_API_KEY;

console.log('==== Torrent VideoClub Featured Content Diagnostic ====');
console.log('Testing the entire featured content pipeline\n');

// Step 1: Validate environment variables
console.log('Step 1: Validating environment variables...');
if (!PROWLARR_URL) {
  console.error('❌ PROWLARR_URL is not set');
  process.exit(1);
}
if (!PROWLARR_API_KEY) {
  console.error('❌ PROWLARR_API_KEY is not set');
  process.exit(1);
}
console.log('✅ Environment variables validated');
console.log(`PROWLARR_URL: ${PROWLARR_URL}`);
console.log(`PROWLARR_API_KEY: ${PROWLARR_API_KEY.substring(0, 5)}...${PROWLARR_API_KEY.substring(PROWLARR_API_KEY.length - 3)}`);
console.log(`TMDB_API_KEY: ${TMDB_API_KEY ? (TMDB_API_KEY.substring(0, 5) + '...' + TMDB_API_KEY.substring(TMDB_API_KEY.length - 3)) : 'Not set'}\n`);

async function runDiagnostic() {
  try {
    // Step 2: Test base Prowlarr API connection
    console.log('Step 2: Testing direct Prowlarr API connection...');
    const prowlarrClient = new ProwlarrClient(PROWLARR_URL, PROWLARR_API_KEY);
    let results;
    
    try {
      results = await prowlarrClient.search({
        query: '',
        limit: 5,
        type: 'movie'
      });
      
      if (results && results.length > 0) {
        console.log(`✅ Prowlarr API connection successful (${results.length} results)`);
        console.log(`  Sample result: "${results[0].title}"`);
      } else {
        console.warn('⚠️ Prowlarr API connection successful but returned no results');
      }
    } catch (error) {
      console.error(`❌ Prowlarr API connection failed: ${error.message}`);
      process.exit(1);
    }
    
    // Step 3: Test TrendingContentClient
    console.log('\nStep 3: Testing TrendingContentClient...');
    const trendingClient = new TrendingContentClient(PROWLARR_URL, PROWLARR_API_KEY);
    
    // Test trending movies
    try {
      console.log('  Testing getTrendingMovies()...');
      const trendingMovies = await trendingClient.getTrendingMovies({ limit: 5 });
      
      if (trendingMovies && trendingMovies.length > 0) {
        console.log(`  ✅ getTrendingMovies() successful (${trendingMovies.length} results)`);
        console.log(`    Sample movie: "${trendingMovies[0].title}" (${trendingMovies[0].year})`);
      } else {
        console.warn('  ⚠️ getTrendingMovies() returned no results');
      }
    } catch (error) {
      console.error(`  ❌ getTrendingMovies() failed: ${error.message}`);
    }
    
    // Test popular TV
    try {
      console.log('  Testing getPopularTV()...');
      const popularTV = await trendingClient.getPopularTV({ limit: 5 });
      
      if (popularTV && popularTV.length > 0) {
        console.log(`  ✅ getPopularTV() successful (${popularTV.length} results)`);
        console.log(`    Sample TV show: "${popularTV[0].title}" (${popularTV[0].year})`);
      } else {
        console.warn('  ⚠️ getPopularTV() returned no results');
      }
    } catch (error) {
      console.error(`  ❌ getPopularTV() failed: ${error.message}`);
    }
    
    // Step 4: Test featured API endpoint
    console.log('\nStep 4: Testing /api/featured endpoint...');
    try {
      // Use a timeout to avoid hanging indefinitely
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch('http://localhost:3001/api/featured', { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.error(`  ❌ /api/featured request failed: ${response.status} ${response.statusText}`);
        try {
          const errorText = await response.text();
          console.error(`  Error response: ${errorText}`);
        } catch (e) {
          console.error('  Could not read error response');
        }
        return;
      }
      
      const data = await response.json();
      console.log('  ✅ /api/featured request successful');
      
      // Analyze the response
      console.log('\nStep 5: Analyzing featured content response...');
      
      // Check if we have a featuredItem
      if (data.featuredItem) {
        console.log('  ✅ featuredItem exists');
        console.log(`    Title: ${data.featuredItem.title}`);
        console.log(`    Media Type: ${data.featuredItem.mediaType}`);
        console.log(`    Year: ${data.featuredItem.year}`);
        
        // Check if it's using real data (mock data usually has IDs starting with 'mock-')
        const isRealData = !data.featuredItem.id.startsWith('mock-');
        console.log(`    Using real data: ${isRealData ? 'Yes ✅' : 'No ❌'}`);
      } else {
        console.error('  ❌ featuredItem is missing');
      }
      
      // Check categories
      if (data.categories && Array.isArray(data.categories)) {
        console.log(`  ✅ Categories exist (${data.categories.length} categories)`);
        
        // Log each category
        data.categories.forEach((category, index) => {
          console.log(`    Category ${index + 1}: ${category.title} (${category.items.length} items)`);
          
          // Check if first item is using real data
          if (category.items.length > 0) {
            const firstItem = category.items[0];
            const isRealData = !firstItem.id.startsWith('mock-');
            console.log(`      First item: "${firstItem.title}" - Using real data: ${isRealData ? 'Yes ✅' : 'No ❌'}`);
          }
        });
      } else {
        console.error('  ❌ Categories are missing or not an array');
      }
      
    } catch (error) {
      console.error(`  ❌ /api/featured request failed: ${error.message}`);
    }
    
    console.log('\n==== Diagnostic Complete ====');
    
  } catch (error) {
    console.error('Diagnostic failed with error:', error);
  }
}

// Run the diagnostic
runDiagnostic();
