"use client"
import React, { useEffect, useState } from 'react';
import FeaturedCarousel from './FeaturedCarousel';
import CategoryRow from './CategoryRow';
import { FeaturedContent, FeaturedItem, FeaturedCategory } from '@/lib/types/featured';
// No need for client-side cache refresh

const FeaturedPage: React.FC = () => {
  const [featuredContent, setFeaturedContent] = useState<FeaturedContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Server-side caching only - no client-side refresh needed

  useEffect(() => {
    const fetchFeaturedContent = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/featured');
        
        if (!response.ok) {
          throw new Error(`Error fetching featured content: ${response.status}`);
        }
        
        const data = await response.json();
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
    
    // No need to set up refresh intervals - handled by server-side scheduler
    
    // No cleanup needed
  }, []); // No dependencies needed

  // Loading state
  if (isLoading) {
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
  if (error || !featuredContent) {
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

  return (
    <div className="max-w-screen-2xl mx-auto px-4 pb-12 pt-6">
      {/* Featured hero carousel */}
      <section className="mb-12">
        <FeaturedCarousel item={featuredContent.featuredItem} />
      </section>
      
      {/* Categories */}
      {featuredContent.categories.map((category) => (
        <CategoryRow key={category.id} category={category} />
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
