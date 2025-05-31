"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import FeaturedCarousel from './FeaturedCarousel';
import CategoryRow from './CategoryRow';
import { TMDBMediaItem } from '@/lib/types/tmdb';
import { useLibraryStatus } from '@/lib/useLibraryStatus';

const FeaturedPage: React.FC = () => {
  const [categoryRows, setCategoryRows] = useState<Array<{ id: string; title: string; items: TMDBMediaItem[] }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddingToLibraryGlobal, setIsAddingToLibraryGlobal] = useState(false);
  const [libraryItemIds, setLibraryItemIds] = useState<Set<number>>(new Set());
  const { libraryTmdbIds: fetchedLibraryTmdbIds, error: libraryError } = useLibraryStatus();

  const handleAddToLibrary = async (tmdbId: number, mediaType: 'movie' | 'tv', title: string) => {
    if (isAddingToLibraryGlobal) return;
    setIsAddingToLibraryGlobal(true);
    const toastId = `add-to-library-${tmdbId}`;
    toast.loading(`Adding '${title}' to library...`, { id: toastId });

    try {
      let apiEndpoint = '';
      if (mediaType === 'movie') apiEndpoint = '/api/add/movie';
      else if (mediaType === 'tv') apiEndpoint = '/api/add/tv';
      else {
        toast.error('Unsupported media type.', { id: toastId });
        setIsAddingToLibraryGlobal(false);
        return;
      }

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tmdbId }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || `Failed to add '${title}' to ${mediaType === 'movie' ? 'Radarr' : 'Sonarr'}`);
      }
      
      toast.success(`'${title}' added successfully!`, { id: toastId });
      setLibraryItemIds(prev => new Set(prev).add(tmdbId));
    } catch (err) {
      console.error(`[FeaturedPage] Error adding ${mediaType} (ID: ${tmdbId}, Title: ${title}) to library:`, err);
      toast.error(
        `Failed to add '${title}': ${err instanceof Error ? err.message : 'Unknown error'}`,
        { id: toastId }
      );
    } finally {
      setIsAddingToLibraryGlobal(false);
    }
  };

  useEffect(() => {
    if (fetchedLibraryTmdbIds && fetchedLibraryTmdbIds.size > 0) {
      setLibraryItemIds(prevIds => new Set([...Array.from(prevIds), ...Array.from(fetchedLibraryTmdbIds)]));
    }
  }, [fetchedLibraryTmdbIds]);

  useEffect(() => {
    if (libraryError) {
      console.error("[FeaturedPage] Library status hook error:", libraryError);
      // toast.error(`Error fetching library status: ${libraryError}`, { duration: 5000 });
    }
  }, [libraryError]);

  const fetchFromInternalAPI = useCallback(async (apiRoute: string, queryParams: string = '') => {
    const response = await fetch(`/api/tmdb${apiRoute}${queryParams ? `?${queryParams}` : ''}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: `Failed to fetch ${apiRoute} with status ${response.status}` }));
      throw new Error(errorData.error || `Failed to fetch ${apiRoute}`);
    }
    return response.json();
  }, []);

  const fetchData = useCallback(async () => {
    console.log('[FeaturedPage] Fetching TMDB data for category rows...');
    setIsLoading(true);
    setError(null);
    try {
      const popularMoviesPromise = fetchFromInternalAPI('/movies/popular', 'page=1');
      const trendingTVPromise = fetchFromInternalAPI('/tv/trending', 'timeWindow=week&page=1');
      const upcomingMoviesPromise = fetchFromInternalAPI('/movies/upcoming', 'page=1');
      const topRatedMoviesPromise = fetchFromInternalAPI('/movies/top_rated', 'page=1');

      const [
        popularMoviesData, 
        trendingTVData, 
        upcomingMoviesData, 
        topRatedMoviesData
      ] = await Promise.all([
        popularMoviesPromise,
        trendingTVPromise,
        upcomingMoviesPromise,
        topRatedMoviesPromise
      ]);

      const newCategoryRows = [
        { id: 'popular-movies', title: 'Popular Movies', items: popularMoviesData?.slice(0, 10) || [] },
        { id: 'trending-tv', title: 'Trending TV Shows', items: trendingTVData?.slice(0, 10) || [] },
        { id: 'upcoming-movies', title: 'Upcoming Movies', items: upcomingMoviesData?.slice(0, 10) || [] },
        { id: 'top-rated-movies', title: 'Top Rated Movies', items: topRatedMoviesData?.slice(0, 10) || [] },
      ].filter(row => row.items.length > 0);

      if (newCategoryRows.length === 0) {
        console.log('[FeaturedPage] No items found for any category.');
      }
      setCategoryRows(newCategoryRows);

    } catch (err) {
      console.error('[FeaturedPage] Error fetching category data:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred while fetching data.');
    } finally {
      setIsLoading(false);
    }
  }, [fetchFromInternalAPI]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="container mx-auto px-4 py-8">
      <Toaster position="top-center" reverseOrder={false} />
      <FeaturedCarousel />

      {isLoading && (
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center px-4">
          <svg className="animate-spin h-10 w-10 text-white mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-white">Loading featured content...</p>
        </div>
      )}

      {!isLoading && error && (
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center px-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-lg font-bold text-white mb-2">Error Loading Categories</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button 
            onClick={fetchData}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors duration-150"
          >
            Retry Categories
          </button>
        </div>
      )}

      {!isLoading && !error && categoryRows.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium text-white mb-2">No Featured Content Available</h3>
          <p className="text-gray-400 max-w-md">It seems there's nothing to show right now. Please check back later or try a search.</p>
        </div>
      )}

      {!isLoading && !error && categoryRows.length > 0 && (
        <>
          {categoryRows.map((row) => (
            <CategoryRow 
              key={row.id} 
              category={{ id: row.id, title: row.title, items: row.items }} 
              onAddToLibrary={handleAddToLibrary} 
              libraryItemIds={libraryItemIds}
              isAddingToLibraryGlobal={isAddingToLibraryGlobal}
            />
          ))}
        </>
      )}
    </div>
  );
};

export default FeaturedPage;
