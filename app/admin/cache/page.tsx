import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Cache Management - Admin',
  description: 'Manage Redis cache for Torrent VideoClub',
};

export default function AdminCachePage() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Cache Management</h1>
      
      <div className="grid gap-6">
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-2">Redis Cache</h2>
          <p className="text-gray-300 mb-6">
            Torrent VideoClub uses Redis as the single source of truth for caching featured content.
          </p>
          
          <div className="flex flex-col space-y-4">
            <Link 
              href="/api/cache/refresh" 
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-center"
            >
              Check Cache Status
            </Link>
            
            <form 
              action="/api/cache/refresh" 
              method="post"
              className="flex flex-col space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                fetch('/api/cache/refresh', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    type: formData.get('type'),
                    categoryId: formData.get('categoryId'),
                  }),
                })
                .then(response => response.json())
                .then(data => {
                  alert(data.message || 'Operation completed');
                })
                .catch(err => {
                  alert('Error: ' + err.message);
                });
              }}
            >
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Refresh Type</label>
                <select 
                  name="type" 
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="featured">Featured Content</option>
                  <option value="category">Specific Category</option>
                  <option value="all">All Caches</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Category ID (if applicable)</label>
                <input 
                  type="text" 
                  name="categoryId" 
                  placeholder="e.g., trending-movies" 
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              
              <button 
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
              >
                Refresh Cache
              </button>
            </form>
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-2">About Redis Caching</h2>
          <p className="text-gray-300 mb-4">
            Information about the Redis caching implementation
          </p>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium">Cache TTL Settings</h3>
              <p className="text-sm text-gray-400">
                Featured content is cached for 24 hours by default. This can be configured via the 
                REDIS_FEATURED_CONTENT_TTL environment variable.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium">Automatic Cache Updates</h3>
              <p className="text-sm text-gray-400">
                The cache is automatically refreshed in the background at regular intervals.
                You only need to manually refresh the cache if you want to immediately see updates.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
