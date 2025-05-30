import React, { useState } from 'react';
import Image from 'next/image';
import { FeaturedItem } from '@/lib/types/featured';
import DownloadIndicator from './DownloadIndicator';
import LibraryIndicator from './LibraryIndicator';
import { toast } from 'react-hot-toast';

interface FeaturedCarouselProps {
  item?: FeaturedItem; // Make item optional to handle undefined cases
  onAddToLibrary?: (guid: string, mediaType: 'movie' | 'tv', indexerId: string | number, title: string) => void; // Updated callback
}

const FeaturedCarousel: React.FC<FeaturedCarouselProps> = ({ item, onAddToLibrary }) => {
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
  
  // Destructure with defaults from transformed data (using new field names)
  const {
    fullBackdropPath = '/api/placeholder/1920/1080',
    // fullPosterPath, // Not directly used in this component's render, but available on item
    displayTitle = 'Untitled Content',
    displayOverview = 'No description available',
    displayYear = new Date().getFullYear(),
    displayGenres = [], // New, from transformFeaturedItem
    quality, // Directly from ProwlarrItemData (item.quality)
    inLibrary = false,
    isDownloading = false,
    isProcessing = false, // Added from new type
    // downloadProgress, // Not part of new FeaturedItem, remove if not used by DownloadIndicator
    guid, // Essential for add to library
    indexerId, // Essential for add to library
    mediaType // Essential for add to library
  } = item;
  
  // Handle adding to library
  const handleAddToLibraryClick = async () => {
    console.log('[FeaturedCarousel] handleAddToLibraryClick triggered. Item:', item, 'onAddToLibrary present:', !!onAddToLibrary);
    if (!guid || indexerId === undefined || !mediaType) {
      toast.error('Cannot add to library: Missing essential item data (GUID, Indexer ID, or Media Type)');
      console.error('[FeaturedCarousel] Missing essential data for add to library:', { guid, indexerId, mediaType });
      return;
    }

    if (onAddToLibrary) {
      setIsAddingToLibrary(true); // Set loading state for this button
      try {
        await onAddToLibrary(guid, mediaType, indexerId, displayTitle);
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
          body: JSON.stringify({ guid, indexerId, mediaType, title: displayTitle })
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
          {displayYear && <span className="text-xs text-gray-400">{displayYear}</span>} {/* Changed */}
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
            disabled={isAddingToLibrary || item?.inLibrary} 
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
