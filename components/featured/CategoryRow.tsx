import React from 'react';
import { FeaturedCategory } from '@/lib/types/featured-content';
import MediaCard from './MediaCard';

interface CategoryRowProps {
  category: FeaturedCategory;
}

const CategoryRow: React.FC<CategoryRowProps> = ({ category }) => {
  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">{category.title}</h2>
        <button className="text-sm text-gray-400 hover:text-white transition-colors">
          See All
        </button>
      </div>
      
      {/* Scrollable row of media cards */}
      <div className="relative">
        <div className="overflow-x-auto pb-4 hide-scrollbar">
          <div className="flex space-x-4">
            {category.items.map((item) => (
              <MediaCard key={item.guid} item={item} />
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
