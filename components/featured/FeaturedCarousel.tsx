import React, { useState } from 'react';
import Image from 'next/image';
import { TMDBMediaItem } from '@/lib/types/tmdb'; // Changed from FeaturedItem
import DownloadIndicator from './DownloadIndicator';
import LibraryIndicator from './LibraryIndicator';
import { toast } from 'react-hot-toast';

interface ProwlarrData {
  guid?: string;
  indexerId?: string | number;
  quality?: string;
  inLibrary?: boolean;
  isDownloading?: boolean;
  isProcessing?: boolean;
}

interface FeaturedCarouselProps {
  item?: TMDBMediaItem;
  prowlarrData?: ProwlarrData; // For status display (inLibrary, quality etc.)
  // onAddToLibrary now takes tmdbId, mediaType, and title
  onAddToLibrary?: (tmdbId: number, mediaType: 'movie' | 'tv', title: string) => void | Promise<void>;
}

const FeaturedCarousel: React.FC<FeaturedCarouselProps> = ({ item, prowlarrData, onAddToLibrary }) => {
  // State to track when the high-quality image has loaded
  const [imageLoaded, setImageLoaded] = useState(false);
  const [smallImageLoaded, setSmallImageLoaded] = useState(false);
  const [isAddingToLibrary, setIsAddingToLibrary] = useState(false);

  // Handle case where item is completely undefined or null
  if (!item) {
    return (
      <div className="relative w-full h-[400px] overflow-hidden rounded-lg bg-gray-900 flex items-center justify-center">
        <div className="text-center p-6">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-8 bg-gray-700 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-700 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-gray-700 rounded w-2/3 mb-2"></div>
            <div className="h-4 bg-gray-700 rounded w-1/2"></div>
          </div>
          <p className="text-gray-400 mt-4">Loading content...</p>
        </div>
      </div>
    );
  }
  
  // Destructure TMDB data from item prop
  const {
    title: displayTitle = 'Untitled Content',
    overview: displayOverview = 'No description available',
    backdropPath,
    releaseDate, // For movies
    firstAirDate, // For TV shows
    genres: displayGenres = [],
    mediaType,
    // tmdbId, // Available if needed
  } = item || {};

  // Destructure Prowlarr-specific data from prowlarrData prop
  const {
    guid,
    indexerId,
    quality,
    inLibrary = false,
    isDownloading = false,
    isProcessing = false,
  } = prowlarrData || {};

  const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w1280'; // Or 'original'
  const fullBackdropPath = backdropPath ? `${TMDB_IMAGE_BASE_URL}${backdropPath}` : '/api/placeholder/1920/1080';

  let displayYearCalc = new Date().getFullYear();
  if (item && mediaType === 'movie' && releaseDate) {
    displayYearCalc = new Date(releaseDate).getFullYear();
  } else if (item && mediaType === 'tv' && firstAirDate) {
    displayYearCalc = new Date(firstAirDate).getFullYear();
  }
  const displayYear = displayYearCalc;

  
  // Handle adding to library
  const handleAddToLibraryClick = async () => {
    console.log('[FeaturedCarousel] handleAddToLibraryClick triggered. Item:', item, 'onAddToLibrary present:', !!onAddToLibrary);
    // Check for essential TMDB data for the add action
    if (!item?.tmdbId || !item?.mediaType || !displayTitle) {
      toast.error('Cannot add to library: Missing essential TMDB item data (ID, Media Type, or Title)');
      console.error('[FeaturedCarousel] Missing essential TMDB data for add to library:', { tmdbId: item?.tmdbId, mediaType: item?.mediaType, title: displayTitle });
      return;
    }

    if (onAddToLibrary) {
      setIsAddingToLibrary(true); // Set loading state for this button
      try {
        // Call onAddToLibrary with tmdbId, mediaType, and title from the TMDBMediaItem
        await onAddToLibrary(item.tmdbId, item.mediaType, displayTitle);
        // Success toast is expected to be handled by the onAddToLibrary callback (i.e., in FeaturedPage)
      } catch (error) {
        console.error('[FeaturedCarousel] Error during onAddToLibrary call:', error);
        // Error toast is expected to be handled by the onAddToLibrary callback
      } finally {
        setIsAddingToLibrary(false); // Reset loading state for this button
      }
    } else {
      // Fallback: Direct API call
      console.warn('[FeaturedCarousel] onAddToLibrary not provided, using fallback API call. This should be handled by the parent.');
      setIsAddingToLibrary(true); // Set loading for fallback
      try {
        const response = await fetch('/api/prowlarr/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          // Fallback direct API call - this part is less likely to be used if onAddToLibrary is always provided.
          // If it were used, it would also need to be adapted to potentially find guid/indexerId first.
          // For now, keeping its structure but acknowledging it's a fallback.
          body: JSON.stringify({ tmdbId: item?.tmdbId, mediaType: item?.mediaType, title: displayTitle, message: 'Fallback - Prowlarr GUID/IndexerID would need to be resolved' })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: `Failed to add item (HTTP ${response.status})` }));
          throw new Error(errorData.message || `Failed to add item (HTTP ${response.status})`);
        }
        const result = await response.json();
        toast.success(result.message || `${displayTitle} added to library successfully.`);
      } catch (error) {
        console.error('[FeaturedCarousel] Error in fallback API call:', error);
        toast.error(`Failed to add to library: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setIsAddingToLibrary(false); // Reset loading for fallback
      }
    }
  };

  return (
    <div className="relative w-full h-[400px] overflow-hidden rounded-lg bg-gray-900">
      {/* Backdrop Image with gradient overlay */}
      <div className="absolute inset-0">
        {fullBackdropPath && (
          <>
            {/* Loading skeleton/pulse animation */}
            <div className={`absolute inset-0 bg-gray-900 transition-opacity duration-500 ${smallImageLoaded ? 'opacity-0' : 'opacity-100'}`}>
              <div className="animate-pulse w-full h-full bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900"></div>
            </div>
            
            {/* Low quality placeholder image (loads first) */}
            <Image
              src={fullBackdropPath} // Changed
              alt={`${displayTitle} small backdrop`} // Changed
              fill
              style={{ objectFit: 'cover' }}
              onLoad={() => setSmallImageLoaded(true)}
              className={`transition-opacity duration-300 opacity-50 ${smallImageLoaded ? 'opacity-50' : 'opacity-0'} ${imageLoaded ? 'opacity-0' : 'opacity-50'}`}
              priority
            />
            
            {/* High quality final image (loads after) */}
            <Image
              src={fullBackdropPath} // Changed
              alt={displayTitle} // Changed
              fill
              style={{ objectFit: 'cover' }}
              onLoad={() => setImageLoaded(true)}
              className={`transition-opacity duration-500 opacity-50 ${imageLoaded ? 'opacity-50' : 'opacity-0'}`}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 100vw" /* Optimize rendering sizes */
              priority={false}
              loading="eager" /* Still load this somewhat eagerly as it's the hero image */
            />
          </>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/80 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative h-full flex flex-col justify-end p-6">
        <div className="flex items-center space-x-2 mb-1">
          {inLibrary && <LibraryIndicator />}
          {/* Pass isProcessing to DownloadIndicator if it can handle it, or adjust logic */}
          {(isDownloading || isProcessing) && <DownloadIndicator progress={0} isProcessing={isProcessing} />}
          {quality && <span className="text-xs border border-green-500 text-green-500 px-2 py-0.5 rounded">
            {quality}
          </span>}
          {displayYear && !isNaN(displayYear) && <span className="text-xs text-gray-400">{displayYear}</span>} {/* Ensured displayYear is a number */}
          {/* Optionally display genres */}
          {displayGenres && displayGenres.length > 0 && (
            <span className="text-xs text-gray-400 hidden md:block">
              {displayGenres.join(' · ')}
            </span>
          )}
        </div>
        <h1 className="text-4xl font-bold text-white mb-2">{displayTitle}</h1> {/* Changed */}
        <p className="text-gray-300 line-clamp-3 mb-4 max-w-2xl">
          {displayOverview} {/* Changed */}
        </p>
        <div className="flex space-x-4">
          <button 
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md font-medium flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
            Play
          </button>
          <button 
            className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-2 rounded-md font-medium flex items-center"
            onClick={handleAddToLibraryClick}
            disabled={isAddingToLibrary || inLibrary}  
            data-testid="featured-add-to-library"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            {isAddingToLibrary ? 'Adding...' : inLibrary ? 'In Library' : 'Add to Library'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeaturedCarousel;
