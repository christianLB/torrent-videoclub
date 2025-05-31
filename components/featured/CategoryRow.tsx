import React from 'react';
import Link from 'next/link';
import { TMDBMediaItem } from '@/lib/types/tmdb'; // Replaced old types
import MediaCard from './MediaCard';

interface CategoryRowProps {
  category: {
    id: string;
    title: string;
    items: TMDBMediaItem[]; // Changed from FeaturedItem[]
  };
  libraryItemIds: Set<number>; // Added to check library status
  onAddToLibrary?: (tmdbId: number, mediaType: 'movie' | 'tv', title: string) => void | Promise<void>; // Updated signature
  isAddingToLibraryGlobal?: boolean; // Added to disable add buttons globally
}

const CategoryRow: React.FC<CategoryRowProps> = ({ category, onAddToLibrary, libraryItemIds, isAddingToLibraryGlobal }) => {
  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">{category.title}</h2>
        <Link 
          href={`/category/${category.id}`} 
          className="text-sm text-gray-400 hover:text-white transition-colors flex items-center"
        >
          See All
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
      
      {/* Scrollable row of media cards */}
      <div className="relative">
        <div className="overflow-x-auto pb-4 hide-scrollbar">
          <div className="flex space-x-4">
            {category.items.map((item) => (
              // item.tmdbId should be a unique number, suitable for a key.
              // If tmdbId can be zero or not present for some reason, a fallback key would be needed.
              <MediaCard key={item.tmdbId || `media-${Math.random()}`} item={item} onAddToLibrary={onAddToLibrary} inLibrary={libraryItemIds.has(item.tmdbId)} isAddingToLibraryGlobal={isAddingToLibraryGlobal} />
            ))}
          </div>
        </div>
        
        {/* Gradient fades on the sides to indicate scrollable content */}
        <div className="absolute top-0 bottom-4 left-0 w-8 bg-gradient-to-r from-gray-900 to-transparent pointer-events-none" />
        <div className="absolute top-0 bottom-4 right-0 w-8 bg-gradient-to-l from-gray-900 to-transparent pointer-events-none" />
      </div>
    </section>
  );
};

export default CategoryRow;
