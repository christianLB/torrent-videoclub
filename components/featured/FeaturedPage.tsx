"use client"
import React, { useEffect, useState } from 'react';
import FeaturedCarousel from './FeaturedCarousel';
import CategoryRow from './CategoryRow';
import { FeaturedCategory, FeaturedContent, FeaturedItem } from '@/lib/types/featured';
import { toast } from 'react-hot-toast';

// TMDb Genre Maps (Moved outside component scope)
const GENRE_MAP_MOVIE: { [key: number]: string } = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
  99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History',
  27: 'Horror', 10402: 'Music', 9648: 'Mystery', 10749: 'Romance', 878: 'Science Fiction',
  10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western'
};
const GENRE_MAP_TV: { [key: number]: string } = {
  10759: 'Action & Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime', 99: 'Documentary',
  18: 'Drama', 10751: 'Family', 10762: 'Kids', 9648: 'Mystery', 10763: 'News',
  10764: 'Reality', 10765: 'Sci-Fi & Fantasy', 10766: 'Soap', 10767: 'Talk', 10768: 'War & Politics',
  37: 'Western'
};

// Helper function to map genre IDs to names (Moved outside component scope)
const mapGenreIdsToNames = (genreIds?: number[], mediaType?: 'movie' | 'tv'): string[] => {
  if (!genreIds || genreIds.length === 0) return [];
  const map = mediaType === 'tv' ? GENRE_MAP_TV : GENRE_MAP_MOVIE;
  return genreIds.map(id => map[id]).filter(name => !!name) as string[];
};

// Helper function to transform featured items (Moved outside component scope)
const transformFeaturedItem = (item: FeaturedItem): FeaturedItem => {
  if (!item) {
    return {
      guid: `placeholder_${Date.now()}`,
      indexerId: 'unknown_indexer',
      title: 'Content Unavailable',
      size: 0,
      protocol: 'torrent',
      mediaType: 'movie',
      displayTitle: 'Content Unavailable',
      displayOverview: 'Information for this item is currently unavailable.',
      fullPosterPath: '/api/placeholder/500/750',
      fullBackdropPath: '/api/placeholder/1920/1080',
      displayYear: new Date().getFullYear(),
      displayRating: 0,
      displayGenres: [],
      isProcessing: false,
    } as FeaturedItem;
  }
  const transformed: FeaturedItem = JSON.parse(JSON.stringify(item));
  transformed.fullPosterPath = item.tmdbInfo?.posterPath
    ? `https://image.tmdb.org/t/p/w500${item.tmdbInfo.posterPath}`
    : (item.guid === 'placeholder_hero' ? item.fullPosterPath : '/placeholder_500x750.svg');
  transformed.fullBackdropPath = item.tmdbInfo?.backdropPath
    ? `https://image.tmdb.org/t/p/w1280${item.tmdbInfo.backdropPath}`
    : (item.guid === 'placeholder_hero' ? item.fullBackdropPath : '/placeholder_1920x1080.svg');
  transformed.displayTitle = item.tmdbInfo?.title || item.title || 'Untitled';
  transformed.displayOverview = item.tmdbInfo?.overview || 'No description available.';
  transformed.displayYear = item.tmdbInfo?.year;
  transformed.displayRating = item.tmdbInfo?.voteAverage;
  transformed.displayGenres = mapGenreIdsToNames(item.tmdbInfo?.genreIds, item.mediaType);
  return transformed;
};

// FeaturedPage does not currently accept any props.
const FeaturedPage: React.FC = () => {
  
  const [featuredContent, setFeaturedContent] = useState<FeaturedContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddingToLibrary, setIsAddingToLibrary] = useState(false);
  // Server-side caching only - no client-side refresh needed

  // Handle adding items to library
  const handleAddToLibrary = async (guid: string, mediaType: 'movie' | 'tv', indexerId: string | number, title: string) => {
    console.log('[FeaturedPage] handleAddToLibrary invoked with:', { guid, mediaType, indexerId, title });
    if (isAddingToLibrary) {
      console.log('[FeaturedPage] Bailing: isAddingToLibrary is true.');
      return;
    }

    setIsAddingToLibrary(true);
    try {
      let targetItem: FeaturedItem | undefined;
      if (featuredContent?.featuredItem?.guid === guid) {
        targetItem = featuredContent.featuredItem;
      } else if (featuredContent?.categories) {
        for (const category of featuredContent.categories) {
          const found = category.items.find(i => i.guid === guid);
          if (found) {
            targetItem = found;
            break;
          }
        }
      }

      if (!targetItem) {
        throw new Error('Target item not found in local featured content.');
      }

      if (mediaType === 'movie') {
        if (!targetItem.tmdbInfo?.tmdbId) {
          toast.error(`Cannot add movie '${title}': TMDb ID is missing.`);
          setIsAddingToLibrary(false);
          return;
        }
        const tmdbId = targetItem.tmdbInfo.tmdbId;
        console.log(`[FeaturedPage] Adding MOVIE: ${title}, TMDb ID: ${tmdbId}`);

        const response = await fetch('/api/add/movie', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tmdbId }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: `HTTP error ${response.status}` }));
          throw new Error(errorData.message || `Failed to add movie (HTTP ${response.status})`);
        }

        const result = await response.json();

        if (featuredContent) {
          const updatedContent = JSON.parse(JSON.stringify(featuredContent));
          const updateItemState = (item: FeaturedItem) => {
            if (item.guid === guid) {
              return {
                ...item,
                inLibrary: result.inLibrary !== undefined ? result.inLibrary : true,
                isDownloading: result.isDownloading !== undefined ? result.isDownloading : false,
              };
            }
            return item;
          };
          if (updatedContent.featuredItem?.guid === guid) {
            updatedContent.featuredItem = updateItemState(updatedContent.featuredItem);
          }
          updatedContent.categories = updatedContent.categories.map((category: FeaturedCategory) => ({
            ...category,
            items: category.items.map(updateItemState),
          }));
          setFeaturedContent(updatedContent);
        }
        toast.success(result.message || `${title} added to library successfully.`);

      } else if (mediaType === 'tv') {
        console.log(`[FeaturedPage] Adding TV show '${title}' is not yet supported as /api/add/tv endpoint is missing.`);
        toast.error(`Adding TV shows ('${title}') is not yet implemented.`);
        setIsAddingToLibrary(false); // Release loading state
        return; 
      } else {
        toast.error(`Unsupported media type: ${mediaType}`);
        setIsAddingToLibrary(false); // Release loading state
        return;
      }

    } catch (error) {
      console.error('Error adding to library:', error);
      toast.error(`Failed to add to library: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsAddingToLibrary(false);
    }
  };

    useEffect(() => {
    const fetchFeaturedContent = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/featured');
        
        if (!response.ok) {
          throw new Error(`Error fetching featured content: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Transform the data to match the expected format for all components
        if (data) {
          // Transform featured item if it exists
          if (data.featuredItem) {
            data.featuredItem = transformFeaturedItem(data.featuredItem);
          }
          
          // Transform all items in all categories
          if (data.categories) {
            data.categories = data.categories.map((category: FeaturedCategory) => ({
              ...category,
              items: category.items.map(transformFeaturedItem)
            }));
          }
        }
        
        console.log('[FeaturedPage] fetchFeaturedContent updating featuredContent.');
        setFeaturedContent(data);
      } catch (err) {
        console.error('Failed to fetch featured content:', err);
        setError('Failed to load featured content. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeaturedContent();
    
    // No need for client-side refresh - server handles caching
  }, []);
  
  // Loading state
  if (isLoading && !featuredContent) {
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
  if (error && !featuredContent) {
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

  if (!featuredContent) {
    // This should ideally be caught by the isLoading/error states,
    // but it acts as a final guard for TypeScript and runtime safety.
    // It also handles the case where fetch completes but data is still null/undefined.
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <p className="text-gray-400">Featured content is currently unavailable.</p>
      </div>
    );
  }

  return (
    <div className="max-w-screen-2xl mx-auto px-4 pb-12 pt-6">
      {/* Featured hero carousel */}
      <section className="mb-12">
        <FeaturedCarousel 
          item={featuredContent.featuredItem} 
          onAddToLibrary={handleAddToLibrary} 
        />
      </section>
      
      {/* Categories */}
      {featuredContent.categories.map((category) => (
        <CategoryRow 
          key={category.id} 
          category={category} 
          onAddToLibrary={handleAddToLibrary} 
        />
      ))}

      {/* Empty state if no categories */}
      {featuredContent.categories.length === 0 && (
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
