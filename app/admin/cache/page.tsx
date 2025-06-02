"use client"
// import { Metadata } from 'next';
import Link from 'next/link';
import React, { useState } from 'react'; // Removed useEffect as it's not used directly here
import type { FeaturedContent, FeaturedItem, FeaturedCategory } from '@/lib/types/featured';

// export const metadata: Metadata = {
//   title: 'Cache Management - Admin',
//   description: 'Manage Redis cache for Torrent VideoClub',
// };

const FeaturedItemDetails: React.FC<{ item: FeaturedItem | undefined, titlePrefix?: string }> = ({ item, titlePrefix = '' }) => {
  if (!item) return <p className="text-gray-400">No item data.</p>;

  return (
    <div className="mb-4 p-3 bg-gray-700 rounded">
      <h4 className="text-md font-semibold text-sky-300 mb-1">{titlePrefix}{item.displayTitle || item.title}</h4>
      <p className="text-xs text-gray-400">GUID: {item.guid}</p>
      <p className="text-xs text-gray-400">Indexer ID: {item.indexerId}</p>
      <p className="text-xs text-gray-400">Media Type: {item.mediaType}</p>
      <p className="text-xs text-gray-400">Quality: {item.quality}</p>
      <p className="text-xs text-gray-400">Size: {item.size ? `${(item.size / (1024 * 1024 * 1024)).toFixed(2)} GB` : 'N/A'}</p>
      {item.tmdbInfo ? (
        <div className="mt-1 pt-1 border-t border-gray-600">
          <p className="text-xs text-green-400">TMDb ID: {item.tmdbInfo.tmdbId || 'Not Available'}</p>
          <p className="text-xs text-gray-400">Poster Path: {item.tmdbInfo.posterPath || 'N/A'}</p>
          <p className="text-xs text-gray-400">Backdrop Path: {item.tmdbInfo.backdropPath || 'N/A'}</p>
        </div>
      ) : (
        <p className="text-xs text-red-400 mt-1">No TMDb Info</p>
      )}
    </div>
  );
};

const FeaturedCategoryDetails: React.FC<{ category: FeaturedCategory }> = ({ category }) => (
  <div className="mb-6 p-4 bg-gray-750 rounded-lg">
    <h3 className="text-lg font-semibold text-amber-300 mb-3">Category: {category.title} ({category.id})</h3>
    {category.items.length > 0 ? (
      category.items.map((item: FeaturedItem, index: number) => (
        <FeaturedItemDetails key={item.guid || index} item={item} />
      ))
    ) : (
      <p className="text-gray-400">No items in this category.</p>
    )}
  </div>
);

export default function AdminCachePage() {
  const [cachedData, setCachedData] = useState<FeaturedContent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCachedData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin'); // Endpoint you created
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error: ${response.status}`);
      }
      const data: FeaturedContent = await response.json();
      setCachedData(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else if (typeof err === 'string') {
        setError(err);
      } else {
        setError('An unknown error occurred');
      }
      setCachedData(null);
    }
    setIsLoading(false);
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8 text-center">Cache Management</h1>
      
      <div className="grid md:grid-cols-2 gap-8 mb-8">
        {/* Existing Cache Actions Section */}
        <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
          <h2 className="text-2xl font-semibold mb-4 text-sky-400">Redis Cache Actions</h2>
          <p className="text-gray-300 mb-6">
            Manage and refresh the Redis cache for featured content.
          </p>
          
          <div className="flex flex-col space-y-4">
            {/* Link to check status - adjust if API endpoint differs */}
            <Link 
              href="/api/cache/refresh" // This might need to be a status check endpoint if different
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded text-center font-medium transition-colors"
            >
              Check Cache Health/Status (Example)
            </Link>
            
            {/* Cache Refresh Form */}
            <form 
              className="flex flex-col space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const type = formData.get('type');
                const categoryId = formData.get('categoryId');
                alert(`Attempting to refresh: Type - ${type}, Category ID - ${categoryId || 'N/A'}`);
                try {
                  const response = await fetch('/api/cache/refresh', { // Ensure this is your refresh POST endpoint
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ type, categoryId }),
                  });
                  const data: { message?: string } = await response.json();
                  alert(data.message || 'Operation completed: ' + (response.ok ? 'Success' : 'Failed'));
                } catch (err: unknown) {
                  let errorMessage = 'An unknown error occurred';
                  if (err instanceof Error) {
                    errorMessage = err.message;
                  } else if (typeof err === 'string') {
                    errorMessage = err;
                  }
                  alert('Error submitting refresh request: ' + errorMessage);
                }
              }}
            >
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-300 mb-1">Refresh Type</label>
                <select 
                  id="type" name="type" 
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="featured">Featured Content (All)</option>
                  <option value="category">Specific Category</option>
                  {/* <option value="all">All Caches (If supported)</option> */}
                </select>
              </div>
              
              <div>
                <label htmlFor="categoryId" className="block text-sm font-medium text-gray-300 mb-1">Category ID (if refreshing specific category)</label>
                <input 
                  id="categoryId" type="text" name="categoryId" 
                  placeholder="e.g., trending-movies"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <button 
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded font-medium transition-colors"
              >
                Trigger Cache Refresh
              </button>
            </form>
          </div>
        </div>
        
        {/* Existing About Section - slightly restyled */}
        <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
          <h2 className="text-2xl font-semibold mb-4 text-sky-400">About Redis Caching</h2>
          <p className="text-gray-300 mb-6">
            Key information about the Redis caching implementation.
          </p>
          
          <div className="space-y-4">
            
            <div>
              <h3 className="text-lg font-medium text-amber-300">Automatic Cache Updates</h3>
              <p className="text-sm text-gray-400">
                The cache can be configured for automatic background refreshes. Manual refreshes are for immediate updates.
              </p>
            </div>
             <div>
              <h3 className="text-lg font-medium text-amber-300">Data Source</h3>
              <p className="text-sm text-gray-400">
                Cached data originates from Prowlarr and is optionally enriched with TMDb metadata.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* New Section for Displaying Cached Data */}
      <div className="bg-gray-850 rounded-lg p-6 shadow-xl mt-10">
        <h2 className="text-2xl font-semibold mb-6 text-center text-sky-300">View Cached Featured Content</h2>
        <div className="text-center mb-6">
          <button 
            onClick={fetchCachedData} 
            disabled={isLoading}
            className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded font-medium transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Loading Cache Data...' : 'Load/Refresh Featured Content Cache View'}
          </button>
        </div>

        {error && <p className="text-red-500 text-center mb-4">Error: {error}</p>}

        {cachedData && (
          <div className="space-y-8 mt-6">
            <div>
              <h3 className="text-xl font-semibold text-amber-400 mb-4 border-b-2 border-amber-400 pb-2">Main Featured Item (Hero)</h3>
              {cachedData.featuredItem ? (
                <FeaturedItemDetails item={cachedData.featuredItem} />
              ) : (
                <p className="text-gray-400">No main featured item in cache.</p>
              )}
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-amber-400 mb-4 border-b-2 border-amber-400 pb-2">Categories</h3>
              {cachedData.categories && cachedData.categories.length > 0 ? (
                cachedData.categories.map((category: FeaturedCategory) => (
                  <FeaturedCategoryDetails key={category.id} category={category} />
                ))
              ) : (
                <p className="text-gray-400">No categories in cache.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

