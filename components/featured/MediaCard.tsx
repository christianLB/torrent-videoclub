import React, { useState } from 'react';
import Image from 'next/image';
import { TMDBMediaItem } from '@/lib/types/tmdb'; // Replaced old types
import { toast } from 'react-hot-toast';

interface MediaCardProps {
  item: TMDBMediaItem;
  inLibrary?: boolean; // Added to reflect library status
  // ProwlarrData could be added here later if we decide to fetch it per card
  onAddToLibrary?: (tmdbId: number, mediaType: 'movie' | 'tv', title: string) => void | Promise<void>; // Updated signature
  isAddingToLibraryGlobal?: boolean; // Added to reflect global loading state for add operations
}

const MediaCard: React.FC<MediaCardProps> = ({ item, onAddToLibrary, inLibrary, isAddingToLibraryGlobal }) => {
  // Destructure TMDBMediaItem fields
  const {
    tmdbId,
    mediaType,
    title,
    overview,
    posterPath,
    voteAverage,
    releaseDate, // For movies
    firstAirDate, // For TV shows
    // genres, // Available if needed
  } = item;

  // Prepare display data
  const displayTitle = title || 'Untitled';
  const displayYear = releaseDate ? new Date(releaseDate).getFullYear() : (firstAirDate ? new Date(firstAirDate).getFullYear() : undefined);
  const fullPosterPath = posterPath ? `https://image.tmdb.org/t/p/w500${posterPath}` : '/placeholder_500x750.svg';
  const displayOverview = overview || 'No description available.';
  const displayRating = voteAverage || 0;
  
  // Calculate rating with fallback
  // const rating = displayRating; // displayRating is now directly from transformed item
  
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showOverview, setShowOverview] = useState(false);
  const [isAddingToLibrary, setIsAddingToLibrary] = useState(false);

  // Handle adding to library
  const handleAddToLibrary = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (!tmdbId || !mediaType) {
      toast.error('Cannot add to library: Missing essential item data (TMDB ID or Media Type).');
      console.error('[MediaCard] Missing TMDB ID or Media Type for add to library:', { tmdbId, mediaType });
      return;
    }

    if (isAddingToLibrary) return;
    setIsAddingToLibrary(true);

    try {
      if (onAddToLibrary) {
        await onAddToLibrary(tmdbId, mediaType, displayTitle);
        // Success toast is expected to be handled by the onAddToLibrary callback (i.e., in FeaturedPage)
      } else {
        console.warn('MediaCard: onAddToLibrary prop was not provided. Add to library action will not be performed.');
        toast.error('Add to library functionality is not configured for this item.');
      }
    } catch (error) {
      console.error('[MediaCard] Error during onAddToLibrary call:', error);
      toast.error(`Failed to add ${displayTitle} to library: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsAddingToLibrary(false);
    }
  };

  return (
    <div className="group relative w-[180px] flex-shrink-0 transition-transform duration-300 hover:scale-105">
      {/* Poster Image */}
      <div className="relative w-full h-[270px] rounded-md overflow-hidden bg-gray-800">
        {fullPosterPath ? (
          <>
            {/* Loading skeleton */}
            <div className={`absolute inset-0 bg-gray-800 flex items-center justify-center transition-opacity duration-300 ${imageLoaded ? 'opacity-0' : 'opacity-100'}`}>
              <div className="w-12 h-12 rounded-full border-2 border-t-transparent border-green-500 animate-spin"></div>
            </div>

            <Image
              src={fullPosterPath}
              alt={displayTitle}
              fill
              sizes="(max-width: 768px) 30vw, 180px" /* Optimize rendering sizes */
              priority={false} /* Enable lazy loading */
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
              style={{ objectFit: 'cover' }}
              className={`group-hover:opacity-80 transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            />
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-gray-500">
            No Image
          </div>
        )}

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/70 to-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
          {/* Top section with rating */}
          {displayRating > 0 && (
            <div className="flex items-center">
              <div className="flex items-center bg-black/70 rounded px-1.5 py-0.5">
                <svg className="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                </svg>
                <span className="text-white text-xs">{displayRating.toFixed(1)}</span>
              </div>
            </div>
          )}
          
          {/* Middle section with overview */}
          {displayOverview && (
            <div 
              className="overflow-y-auto max-h-[120px] my-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent"
              onMouseEnter={() => setShowOverview(true)}
              onMouseLeave={() => setShowOverview(false)}
            >
              <p className="text-xs text-white leading-tight">
                {showOverview ? displayOverview : displayOverview.substring(0, 100) + (displayOverview.length > 100 ? '...' : '')}
              </p>
            </div>
          )}
          
          {/* Bottom section with buttons */}
          <div>
            <button 
              className="bg-green-600 hover:bg-green-700 text-white w-full py-1 rounded text-sm mb-2 flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleAddToLibrary}
              disabled={isAddingToLibrary || inLibrary || isAddingToLibraryGlobal}
              data-testid="media-card-add-to-library"
            >
              {isAddingToLibrary ? (
                <>
                  <span className="w-3 h-3 rounded-full border-2 border-t-transparent border-white animate-spin mr-1"></span>
                  Adding...
                </>
              ) : inLibrary ? (
                'In Library'
              ) : (
                'Add to Library'
              )}
            </button>
            {/* <button className="bg-gray-700 hover:bg-gray-600 text-white w-full py-1 rounded text-sm">
              Details
            </button> */}
          </div>
        </div>
      </div>
      
      {/* Title */}
      <div className="mt-2">
        <h3 className="text-sm font-medium text-white truncate">{displayTitle}</h3>
        <p className="text-xs text-gray-400">{displayYear}</p>
      </div>
    </div>
  );
};

export default MediaCard;
