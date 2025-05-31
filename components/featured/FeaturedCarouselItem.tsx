import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { TMDBMediaItem } from '../../lib/types/tmdb';

const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/';

interface FeaturedCarouselItemProps {
  item: TMDBMediaItem;
}

const FeaturedCarouselItem: React.FC<FeaturedCarouselItemProps> = ({ item }) => {
  if (!item) {
    return (
      <div className="w-full h-64 md:h-96 flex items-center justify-center bg-gray-800 rounded-lg shadow-lg">
        <p className="text-gray-400 text-lg">No item available</p>
      </div>
    );
  }

  // Extract year from releaseDate or firstAirDate
  const year = item.releaseDate 
    ? new Date(item.releaseDate).getFullYear()
    : item.firstAirDate 
      ? new Date(item.firstAirDate).getFullYear() 
      : undefined;

  return (
    <div className="relative w-full mx-auto overflow-hidden rounded-lg shadow-2xl">
      <div className="relative flex-[0_0_100%] aspect-[16/7]">
        <Link href={`/${item.mediaType}/${item.tmdbId}`} legacyBehavior>
          <a className="block w-full h-full">
            {item.backdropPath ? (
              <Image
                src={item.backdropPath.startsWith('http') 
                  ? item.backdropPath 
                  : `${TMDB_IMAGE_BASE_URL}w1280${item.backdropPath}`}
                alt={item.title ?? 'Carousel item backdrop'}
                fill
                style={{ objectFit: 'cover', objectPosition: 'center' }}
                className="transition-transform duration-300 ease-in-out group-hover:scale-105"
                unoptimized={true}
              />
            ) : (
              <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                <p className="text-white text-xl">{item.title || (item.mediaType === 'movie' ? 'Untitled Movie' : 'Untitled TV Show')}</p>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-4 md:p-8 flex flex-col justify-end">
              <h3 className="text-white text-xl md:text-3xl lg:text-4xl font-bold drop-shadow-lg">
                {item.title || (item.mediaType === 'movie' ? 'Untitled Movie' : 'Untitled TV Show')}
              </h3>
              <p className="text-gray-300 text-xs md:text-sm mt-1 md:mt-2 line-clamp-2 md:line-clamp-3 drop-shadow-md">
                {item.overview || 'No description available'}
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {year && (
                  <span className="text-xs md:text-sm text-white bg-black/50 px-2 py-1 rounded">
                    {year}
                  </span>
                )}
                {item.genres && item.genres.length > 0 && item.genres.map(genre => (
                  <span key={genre.id} className="text-xs md:text-sm text-white bg-black/50 px-2 py-1 rounded">
                    {genre.name}
                  </span>
                ))}
              </div>
            </div>
          </a>
        </Link>
      </div>
    </div>
  );
};

export default FeaturedCarouselItem;
