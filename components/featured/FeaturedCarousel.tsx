import React, { useState } from 'react';
import Image from 'next/image';
import { EnhancedMediaItem } from '@/lib/types/featured-content';
import DownloadIndicator from './DownloadIndicator';
import LibraryIndicator from './LibraryIndicator';

interface FeaturedCarouselProps {
  item: EnhancedMediaItem;
}

const FeaturedCarousel: React.FC<FeaturedCarouselProps> = ({ item }) => {
  const backdropPath = item.tmdb?.backdropPath || '';
  const title = item.title;
  const overview = item.tmdb?.overview || '';
  const year = item.year;
  const quality = item.quality;
  const isInLibrary = item.inLibrary;
  const isDownloading = item.downloading;
  const downloadProgress = item.downloadProgress;
  
  // State to track when the high-quality image has loaded
  const [imageLoaded, setImageLoaded] = useState(false);
  const [smallImageLoaded, setSmallImageLoaded] = useState(false);

  return (
    <div className="relative w-full h-[400px] overflow-hidden rounded-lg bg-gray-900">
      {/* Backdrop Image with gradient overlay */}
      <div className="absolute inset-0">
        {backdropPath && (
          <>
            {/* Loading skeleton/pulse animation */}
            <div className={`absolute inset-0 bg-gray-900 transition-opacity duration-500 ${smallImageLoaded ? 'opacity-0' : 'opacity-100'}`}>
              <div className="animate-pulse w-full h-full bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900"></div>
            </div>
            
            {/* Low quality placeholder image (loads first) */}
            <Image
              src={backdropPath.startsWith('/') 
                ? `https://image.tmdb.org/t/p/w300${backdropPath}` 
                : backdropPath}
              alt={`${title} small backdrop`}
              fill
              style={{ objectFit: 'cover' }}
              onLoad={() => setSmallImageLoaded(true)}
              className={`transition-opacity duration-300 opacity-50 ${smallImageLoaded ? 'opacity-50' : 'opacity-0'} ${imageLoaded ? 'opacity-0' : 'opacity-50'}`}
              priority
            />
            
            {/* High quality final image (loads after) */}
            <Image
              src={backdropPath.startsWith('/') 
                ? `https://image.tmdb.org/t/p/w1280${backdropPath}` /* Using w1280 instead of original for better performance */
                : backdropPath}
              alt={title}
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
          {isInLibrary && <LibraryIndicator />}
          {isDownloading && <DownloadIndicator progress={downloadProgress} />}
          <span className="text-xs border border-green-500 text-green-500 px-2 py-0.5 rounded">
            {quality}
          </span>
          <span className="text-xs text-gray-400">{year}</span>
        </div>
        <h1 className="text-4xl font-bold text-white mb-2">{title}</h1>
        <p className="text-gray-300 line-clamp-3 mb-4 max-w-2xl">
          {overview}
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
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add to Library
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeaturedCarousel;
