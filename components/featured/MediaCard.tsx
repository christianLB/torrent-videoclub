import React, { useState } from 'react';
import Image from 'next/image';
import { EnhancedMediaItem } from '@/lib/types/featured-content';
import DownloadIndicator from './DownloadIndicator';
import LibraryIndicator from './LibraryIndicator';

interface MediaCardProps {
  item: EnhancedMediaItem;
}

const MediaCard: React.FC<MediaCardProps> = ({ item }) => {
  // Extract metadata from TMDb when available
  const posterPath = item.tmdb?.posterPath || '';
  const title = item.tmdb?.title || item.title;
  const year = item.tmdb?.year || item.year;
  const quality = item.quality;
  const isInLibrary = item.inLibrary;
  const isDownloading = item.downloading;
  const downloadProgress = item.downloadProgress;
  const seeders = item.seeders;
  const rating = item.tmdb?.voteAverage || 0;
  const overview = item.tmdb?.overview || '';
  const hasTmdbData = item.tmdbAvailable && !!item.tmdb;
  
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showOverview, setShowOverview] = useState(false);

  return (
    <div className="group relative w-[180px] flex-shrink-0 transition-transform duration-300 hover:scale-105">
      {/* Poster Image */}
      <div className="relative w-full h-[270px] rounded-md overflow-hidden bg-gray-800">
        {posterPath ? (
          <>
            {/* Loading skeleton */}
            <div className={`absolute inset-0 bg-gray-800 flex items-center justify-center transition-opacity duration-300 ${imageLoaded ? 'opacity-0' : 'opacity-100'}`}>
              <div className="w-12 h-12 rounded-full border-2 border-t-transparent border-green-500 animate-spin"></div>
            </div>
            
            <Image
              src={posterPath.startsWith('/') 
                ? `https://image.tmdb.org/t/p/w342${posterPath}` /* Using w342 size which is more appropriate for cards */
                : posterPath}
              alt={title}
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
        
        {/* Status Indicators */}
        <div className="absolute top-2 left-2 flex flex-col space-y-1">
          {isInLibrary && <LibraryIndicator />}
          {isDownloading && <DownloadIndicator progress={downloadProgress} />}
        </div>
        
        {/* Quality Badge */}
        <div className="absolute top-2 right-2">
          <span className="text-xs bg-black/70 border border-green-500 text-green-500 px-1.5 py-0.5 rounded">
            {quality}
          </span>
        </div>
        
        {/* Seeders Badge */}
        <div className="absolute bottom-2 right-2">
          <span className="text-xs bg-black/70 text-green-400 px-1.5 py-0.5 rounded flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            {seeders}
          </span>
        </div>
        
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/70 to-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
          {/* Top section with rating */}
          {hasTmdbData && (
            <div className="flex items-center">
              <div className="flex items-center bg-black/70 rounded px-1.5 py-0.5">
                <svg className="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                </svg>
                <span className="text-white text-xs">{rating.toFixed(1)}</span>
              </div>
            </div>
          )}
          
          {/* Middle section with overview */}
          {hasTmdbData && overview && (
            <div 
              className="overflow-y-auto max-h-[120px] my-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent"
              onMouseEnter={() => setShowOverview(true)}
              onMouseLeave={() => setShowOverview(false)}
            >
              <p className="text-xs text-white leading-tight">
                {showOverview ? overview : overview.substring(0, 100) + (overview.length > 100 ? '...' : '')}
              </p>
            </div>
          )}
          
          {/* Bottom section with buttons */}
          <div>
            <button className="bg-green-600 hover:bg-green-700 text-white w-full py-1 rounded text-sm mb-2">
              Add to Library
            </button>
            <button className="bg-gray-700 hover:bg-gray-600 text-white w-full py-1 rounded text-sm">
              Details
            </button>
          </div>
        </div>
      </div>
      
      {/* Title */}
      <div className="mt-2">
        <h3 className="text-sm font-medium text-white truncate">{title}</h3>
        <p className="text-xs text-gray-400">{year}</p>
      </div>
    </div>
  );
};

export default MediaCard;
