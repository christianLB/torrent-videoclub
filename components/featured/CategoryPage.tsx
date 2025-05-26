"use client";

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import MediaCard from './MediaCard';
import { FeaturedCategory } from '@/lib/types/featured-content';
import { CuratorService } from '@/lib/services/curator-service';

interface CategoryPageProps {
  categoryId: string;
}

const CategoryPage: React.FC<CategoryPageProps> = ({ categoryId }) => {
  const [category, setCategory] = useState<FeaturedCategory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  
  // Get pagination parameters
  const page = parseInt(searchParams.get('page') || '1', 10);
  const itemsPerPage = 20;
  
  useEffect(() => {
    const fetchCategoryContent = async () => {
      try {
        setIsLoading(true);
        const categoryData = await CuratorService.getCategory(categoryId);
        setCategory(categoryData);
      } catch (err) {
        console.error(`Failed to fetch category ${categoryId}:`, err);
        setError(`Failed to load category content. Please try again later.`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategoryContent();
  }, [categoryId]);

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
          <p className="text-green-500 text-lg font-medium">Loading category content...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !category) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
        <p className="text-gray-400 mb-6">{error || 'Unable to load category content'}</p>
        <button 
          onClick={() => window.location.reload()}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Calculate pagination
  const totalItems = category.items.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const currentItems = category.items.slice(startIndex, endIndex);

  return (
    <main className="bg-gray-900 text-white min-h-screen">
      <Navbar />
      
      <div className="container mx-auto py-6 px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-green-500">{category.title}</h1>
          
          {/* Filters - to be implemented */}
          <div className="flex space-x-2">
            <select className="bg-gray-800 text-white border border-gray-700 rounded-md px-3 py-1">
              <option value="seeders">Sort by Seeders</option>
              <option value="size">Sort by Size</option>
              <option value="year">Sort by Year</option>
            </select>
            <select className="bg-gray-800 text-white border border-gray-700 rounded-md px-3 py-1">
              <option value="all">All Qualities</option>
              <option value="1080p">1080p</option>
              <option value="2160p">4K</option>
            </select>
          </div>
        </div>
        
        {/* Media Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {currentItems.map((item) => (
            <MediaCard key={item.guid} item={item} />
          ))}
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-8">
            <div className="flex space-x-1">
              {page > 1 && (
                <a
                  href={`/category/${categoryId}?page=${page - 1}`}
                  className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700"
                >
                  Previous
                </a>
              )}
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <a
                  key={pageNum}
                  href={`/category/${categoryId}?page=${pageNum}`}
                  className={`px-4 py-2 rounded-md ${
                    pageNum === page
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-800 text-white hover:bg-gray-700'
                  }`}
                >
                  {pageNum}
                </a>
              ))}
              
              {page < totalPages && (
                <a
                  href={`/category/${categoryId}?page=${page + 1}`}
                  className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700"
                >
                  Next
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default CategoryPage;
