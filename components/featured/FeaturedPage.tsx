"use client"
import React, { useEffect, useState } from 'react';
import FeaturedCarousel from './FeaturedCarousel';
import CategoryRow from './CategoryRow';
import { TMDBMediaItem } from '@/lib/types/tmdb';
import { useLibraryStatus } from '@/lib/useLibraryStatus'; // Replaced old types
import { toast } from 'react-hot-toast';

// Genre maps and transformation functions are removed as TMDBMediaItem is expected to be self-contained
// or genre names are directly provided by the backend API as part of TMDBMediaItem.

// FeaturedPage does not currently accept any props.
const FeaturedPage: React.FC = () => {
  const [heroItem, setHeroItem] = useState<TMDBMediaItem | null>(null);
  const [categoryRows, setCategoryRows] = useState<Array<{ id: string; title: string; items: TMDBMediaItem[] }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddingToLibraryGlobal, setIsAddingToLibraryGlobal] = useState(false); // Renamed to avoid conflict if local isAdding used in carousel
  const [libraryItemIds, setLibraryItemIds] = useState<Set<number>>(new Set());
  const { libraryTmdbIds: fetchedLibraryTmdbIds, isLoading: isLoadingLibrary, error: libraryError } = useLibraryStatus();

  // Handle adding items to library (signature changed for TMDB context)
  const handleAddToLibrary = async (tmdbId: number, mediaType: 'movie' | 'tv', title: string) => {
    console.log('[FeaturedPage] handleAddToLibrary invoked with:', { tmdbId, mediaType, title });
    if (isAddingToLibraryGlobal) {
      console.log('[FeaturedPage] Bailing: isAddingToLibraryGlobal is true.');
      return;
    }

    setIsAddingToLibraryGlobal(true);
    toast.loading(`Adding '${title}' to library...`, { id: 'add-to-library-toast' });

    try {
      let apiEndpoint = '';
      if (mediaType === 'movie') {
        apiEndpoint = '/api/add/movie';
      } else if (mediaType === 'tv') {
        apiEndpoint = '/api/add/tv'; // Use the new TV endpoint
      } else {
        toast.error('Unsupported media type for library addition.', { id: 'add-to-library-toast' });
        setIsAddingToLibraryGlobal(false);
        return;
      }

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tmdbId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Failed to add '${title}' to library`);
      }

      toast.success(`'${title}' added to library successfully!`, { id: 'add-to-library-toast' });
      setLibraryItemIds(prev => new Set(prev).add(tmdbId)); // Update library status

    } catch (error) {
      console.error('Error adding to library:', error);
      toast.error(`Failed to add to library: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsAddingToLibraryGlobal(false);
    }
  };

  useEffect(() => {
    // Update local libraryItemIds when fetchedLibraryTmdbIds from the hook changes.
    // This merges optimistic updates from handleAddToLibrary with the fetched state.
    setLibraryItemIds(prevIds => new Set([...Array.from(prevIds), ...Array.from(fetchedLibraryTmdbIds)]));
  }, [fetchedLibraryTmdbIds]);

  useEffect(() => {
    if (libraryError) {
      console.error("[FeaturedPage] Library status error:", libraryError);
      // Optionally, you could show a non-blocking toast here for UI feedback
      // toast.error(`Library status: ${libraryError}`, { duration: 4000 });
    }
  }, [libraryError]);

    useEffect(() => {
    const fetchData = async () => {
      console.log('[FeaturedPage] Fetching TMDB data...');
      setIsLoading(true);
      setError(null);
      try {
        // Fetch hero item (e.g., first trending movie of the day)
        const heroResponse = await fetch('/api/tmdb/movies/trending?timeWindow=day&page=1');
        if (!heroResponse.ok) throw new Error(`Failed to fetch hero items: ${heroResponse.statusText}`);
        const heroItems: TMDBMediaItem[] = await heroResponse.json();
        if (heroItems.length > 0) {
          setHeroItem(heroItems[0]);
        }

        // Fetch data for category rows
        const rowsToFetch = [
          { id: 'popular-tv', title: 'Popular TV Shows', endpoint: '/api/tmdb/tv/popular?page=1' },
          { id: 'popular-movies', title: 'Popular Movies', endpoint: '/api/tmdb/movies/popular?page=1' },
          { id: 'trending-tv-week', title: 'Trending TV This Week', endpoint: '/api/tmdb/tv/trending?timeWindow=week&page=1' },
        ];

        const fetchedCategoryRows = await Promise.all(
          rowsToFetch.map(async (rowInfo) => {
            const response = await fetch(rowInfo.endpoint);
            if (!response.ok) {
              console.error(`Failed to fetch ${rowInfo.title}: ${response.statusText}`);
              return { ...rowInfo, items: [] }; // Return empty items on error for this row
            }
            const items: TMDBMediaItem[] = await response.json();
            return { ...rowInfo, items };
          })
        );
        setCategoryRows(fetchedCategoryRows.filter(row => row.items.length > 0));

      } catch (err) {
        console.error('Failed to fetch TMDB content:', err);
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        setError(`Failed to load content: ${errorMessage}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);
  
  // Loading state
  if (isLoading && !heroItem && categoryRows.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-32 w-32 rounded-full bg-gray-700 mb-4 flex items-center justify-center">
            <svg className="animate-spin h-12 w-12 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <p className="text-green-500 text-lg font-medium">Loading featured content...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && (!heroItem && categoryRows.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
        <p className="text-gray-400 mb-6">{error || 'Unable to load featured content'}</p>
        <button 
          onClick={() => window.location.reload()}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!isLoading && !error && !heroItem && categoryRows.length === 0) {
    // Handles the case where fetch completes, no error, but no data was returned for any section
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
         <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        <h2 className="text-xl font-bold text-white mb-2">No Content Available</h2>
        <p className="text-gray-400">We couldn't find any featured content at the moment. Please check back later.</p>
      </div>
    );
  }

  return (
    <div className="max-w-screen-2xl mx-auto px-4 pb-12 pt-6">
      {/* Featured hero carousel */}
      {heroItem && (
        <section className="mb-12">
          <FeaturedCarousel 
            item={heroItem} 
            onAddToLibrary={handleAddToLibrary} 
            prowlarrData={heroItem ? { inLibrary: libraryItemIds.has(heroItem.tmdbId) } : {}}
          />
        </section>
      )}
      
      {/* Categories */}
      {categoryRows.map((row) => (
        <CategoryRow 
          key={row.id} 
          category={{ id: row.id, title: row.title, items: row.items }} 
          onAddToLibrary={handleAddToLibrary} 
          libraryItemIds={libraryItemIds}
        />
      ))}

      {/* Empty state if no categories were successfully fetched and hero is also missing */}
      {!heroItem && categoryRows.length === 0 && !isLoading && !error && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
          <h3 className="text-lg font-medium text-white mb-2">No featured categories available</h3>
          <p className="text-gray-400 max-w-md">Check back later for new featured content or try searching for specific titles.</p>
        </div>
      )}
    </div>
  );
};

export default FeaturedPage;
