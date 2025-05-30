/**
 * Test script to directly fetch data from Prowlarr API
 * This helps diagnose issues with the featured content not loading real data
 */

// Get environment variables
if (process.env.PROWLARR_URL && process.env.PROWLARR_API_KEY) {
  console.log('Using environment variables for Prowlarr connection');
} else {
  try {
    require('dotenv').config({ path: '.env' });
    console.log('Loaded environment variables from .env file');
  } catch (error) {
    console.error('Error loading .env file:', error);
  }
}

const PROWLARR_URL = process.env.PROWLARR_URL;
const PROWLARR_API_KEY = process.env.PROWLARR_API_KEY;

if (!PROWLARR_URL || !PROWLARR_API_KEY) {
  console.error('Error: PROWLARR_URL and PROWLARR_API_KEY environment variables are required');
  process.exit(1);
}

// Function to make a test search request to Prowlarr
async function testProwlarrSearch() {
  try {
    console.log('==== Testing Prowlarr API Connection ====');
    console.log(`URL: ${PROWLARR_URL}`);
    console.log(`API Key: ${PROWLARR_API_KEY.substring(0, 5)}...${PROWLARR_API_KEY.substring(PROWLARR_API_KEY.length - 3)}`);
    
    // Construct the search URL with query parameters
    const queryParams = {
      apikey: PROWLARR_API_KEY,
      query: '*',
      limit: '10',
      offset: '0',
      categories: '2000', // Movie category
    };
    
    const queryString = new URLSearchParams(queryParams).toString();
    const url = `${PROWLARR_URL}/api/v1/search?${queryString}`;
    
    console.log(`Making request to: ${url.replace(PROWLARR_API_KEY, PROWLARR_API_KEY.substring(0, 5) + '...')}`);
    
    // Make the request
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`API request failed: ${response.status} ${response.statusText}`);
      try {
        const errorText = await response.text();
        console.error(`Error response: ${errorText}`);
      } catch (e) {
        console.error('Could not read error response');
      }
      return;
    }
    
    const data = await response.json();
    
    if (!Array.isArray(data)) {
      console.error('Unexpected response format:', data);
      return;
    }
    
    console.log(`Search returned ${data.length} results`);
    
    // Display sample results
    if (data.length > 0) {
      console.log('\nSample results:');
      data.slice(0, 3).forEach((result, index) => {
        console.log(`\n[Result ${index + 1}]`);
        console.log(`Title: ${result.title}`);
        console.log(`Indexer: ${result.indexer}`);
        console.log(`Published: ${result.publishDate}`);
        console.log(`Seeders: ${result.seeders}`);
        console.log(`Categories: ${result.categories.join(', ')}`);
      });
    }
    
    console.log('\n==== Test completed successfully ====');
  } catch (error) {
    console.error('Error during test:', error);
  }
}

// Execute the test function
testProwlarrSearch();
