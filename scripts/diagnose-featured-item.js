/**
 * Diagnostic script to analyze featured item data structure
 * 
 * This script will:
 * 1. Fetch a featured item directly from the API
 * 2. Log its structure before and after TMDb enrichment
 * 3. Specifically check image path formats and TMDb ID locations
 */

// Using built-in fetch

async function diagnoseFeaturedItem() {
  try {
    console.log('==== FEATURED ITEM DIAGNOSTIC ====');
    
    // Fetch featured content from API
    console.log('Fetching featured content from API...');
    const response = await fetch('http://localhost:3000/api/featured');
    
    if (!response.ok) {
      throw new Error(`Error fetching featured content: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Check if we have any featured content
    if (!data || !data.categories || data.categories.length === 0) {
      console.log('No featured content available for diagnosis');
      return;
    }
    
    // Get first item from first category for analysis
    const category = data.categories[0];
    console.log(`\nExamining category: ${category.title}`);
    
    if (!category.items || category.items.length === 0) {
      console.log('No items in this category');
      return;
    }
    
    const item = category.items[0];
    console.log(`\nDiagnosing item: ${item.title}`);
    
    // Analyze TMDb data structure
    console.log('\n=== TMDb DATA STRUCTURE ===');
    console.log(`item.tmdbId: ${item.tmdbId}`);
    console.log(`item.tmdb: ${item.tmdb ? 'exists' : 'missing'}`);
    
    if (item.tmdb) {
      console.log(`item.tmdb.id: ${item.tmdb.id}`);
      console.log(`item.tmdb structure: ${JSON.stringify(item.tmdb, null, 2)}`);
    }
    
    // Analyze image paths
    console.log('\n=== IMAGE PATH STRUCTURE ===');
    console.log(`item.posterPath: ${item.posterPath}`);
    console.log(`item.backdropPath: ${item.backdropPath}`);
    
    if (item.tmdb) {
      console.log(`item.tmdb.posterPath: ${item.tmdb.posterPath}`);
      console.log(`item.tmdb.backdropPath: ${item.tmdb.backdropPath}`);
    }
    
    // Full item dump for thorough analysis
    console.log('\n=== COMPLETE ITEM STRUCTURE ===');
    console.log(JSON.stringify(item, null, 2));
    
  } catch (error) {
    console.error('Error in diagnosis:', error);
  }
}

diagnoseFeaturedItem();
