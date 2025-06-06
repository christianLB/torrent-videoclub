import React, { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { toast } from 'react-hot-toast';
import { TMDBMediaItem } from '../../lib/types/tmdb';

export interface CarouselItem {
  tmdbId: number;
  title?: string;
  posterPath?: string;
  backdropPath?: string;
  overview?: string;
  mediaType: 'movie' | 'tv';
}

const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/';

interface FeaturedCarouselProps {
  item?: TMDBMediaItem; // Optional item for testing purposes
}

const FeaturedCarousel: React.FC<FeaturedCarouselProps> = ({ item }) => {
  const [carouselItems, setCarouselItems] = useState<CarouselItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [Autoplay()]);

  useEffect(() => {
    // If we have an item prop, use it directly (for testing)
    if (item) {
      // Convert TMDBMediaItem to CarouselItem with appropriate fallbacks
      const carouselItem: CarouselItem = {
        tmdbId: item.tmdbId || item.id || 0,
        title: item.title || '',
        posterPath: item.posterPath || undefined,
        backdropPath: item.backdropPath || undefined,
        overview: item.overview || '',
        mediaType: (item.mediaType as 'movie' | 'tv') || 'movie'
      };
      setCarouselItems([carouselItem]);
      setIsLoading(false);
      return;
    }

    const fetchCarouselContent = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/featured/carousel-content');
        if (!response.ok) {
          let message = `HTTP error! status: ${response.status}`;
          try {
            const errorData = await response.json();
            if (errorData && errorData.error) {
              message = errorData.error;
            } else if (errorData && errorData.message) { // Check for message property as a fallback
              message = errorData.message;
            }
          } catch (jsonError) {
            console.error('Failed to parse error JSON from API:', jsonError);
            // Stick with the original HTTP status error if JSON parsing fails
          }
          throw new Error(message);
        }
        const data: CarouselItem[] = await response.json();
        setCarouselItems(data);
      } catch (err: unknown) {
        console.error('Failed to fetch carousel content:', err);
        let errorMessage = 'Failed to load items.';
        if (err instanceof Error) {
          errorMessage = err.message;
        } else if (typeof err === 'string') {
          errorMessage = err;
        }
        setError(errorMessage);
        toast.error(`Error loading carousel: ${errorMessage}`);
      }
      setIsLoading(false);
    };

    fetchCarouselContent();
  }, [item]);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  if (isLoading) {
    return (
      <div className="w-full h-64 md:h-96 flex items-center justify-center bg-transparent rounded-lg">
        <p className="text-slate-500 text-lg">Loading Carousel...</p>
        {/* You could add a spinner here */}
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-64 md:h-96 flex flex-col items-center justify-center bg-pink-950 text-pink-400 p-4 rounded-lg">
        <p className="text-xl font-semibold neon-text-pink">Error loading carousel</p>
        <p>{error}</p>
      </div>
    );
  }

  // Ensure carouselItems is an array
  const items = Array.isArray(carouselItems) ? carouselItems : [];
  
  if (items.length === 0) {
    return (
      <div className="w-full h-64 md:h-96 flex items-center justify-center bg-transparent rounded-lg">
        <p className="text-slate-500">No items to display in carousel.</p>
      </div>
    );
  }

  return (
    <div className="relative w-full mx-auto overflow-hidden rounded-lg shadow-2xl embla">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex embla__container">
          {items.map((item) => (
            <div key={item.tmdbId} className="embla__slide relative flex-[0_0_100%] aspect-[16/7]">
              <Link href={`/${item.mediaType}/${item.tmdbId}`} legacyBehavior>
                <a className="block w-full h-full">
                  {(() => {
                    let imageUrl = '';
                    if (item.backdropPath) {
                      if (item.backdropPath.startsWith('http')) {
                        imageUrl = item.backdropPath;
                      } else {
                        const cleanBackdropPath = item.backdropPath.startsWith('/') ? item.backdropPath : `/${item.backdropPath}`;
                        imageUrl = `${TMDB_IMAGE_BASE_URL}w1280${cleanBackdropPath}`;
                      }
                    } else if (item.posterPath) { // Fallback to posterPath
                      if (item.posterPath.startsWith('http')) {
                        imageUrl = item.posterPath;
                      } else {
                        const cleanPosterPath = item.posterPath.startsWith('/') ? item.posterPath : `/${item.posterPath}`;
                        imageUrl = `${TMDB_IMAGE_BASE_URL}w780${cleanPosterPath}`; // Using w780 for poster fallback
                      }
                    }

                    return imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={item.title ?? 'Carousel item image'}
                        fill
                        style={{ objectFit: 'cover', objectPosition: 'center' }}
                        className="transition-transform duration-300 ease-in-out group-hover:scale-105"
                        loading="lazy"
                        unoptimized={true}
                      />
                    ) : (
                      // Original fallback if no backdropPath or posterPath
                      <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                        <p className="text-white text-xl">{item.title || (item.mediaType === 'movie' ? 'Untitled Movie' : 'Untitled TV Show')}</p>
                      </div>
                    );
                  })()}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-4 md:p-8 flex flex-col justify-end">
                    <h3 className="neon-text-pink text-xl md:text-3xl lg:text-4xl font-bold">
                      {item.title || (item.mediaType === 'movie' ? 'Untitled Movie' : 'Untitled TV Show')}
                    </h3>
                    <p className="text-gray-300 text-sm md:text-base mt-1 md:mt-2 line-clamp-2 md:line-clamp-3 drop-shadow-md">
                      {item.overview || 'Overview not available.'}
                    </p>
                  </div>
                </a>
              </Link>
            </div>
          ))}
        </div>
      </div>

      {items.length > 1 && (
        <>
          <button
            className="embla__prev absolute top-1/2 left-2 md:left-4 transform -translate-y-1/2 neon-border-cyan neon-text-cyan hover:bg-neon-cyan/10 p-3 md:p-4 rounded-full focus:outline-none transition-all duration-300 z-10"
            onClick={scrollPrev}
            aria-label="Previous slide"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 md:w-8 md:h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <button
            className="embla__next absolute top-1/2 right-2 md:right-4 transform -translate-y-1/2 neon-border-cyan neon-text-cyan hover:bg-neon-cyan/10 p-3 md:p-4 rounded-full focus:outline-none transition-all duration-300 z-10"
            onClick={scrollNext}
            aria-label="Next slide"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 md:w-8 md:h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </>
      )}
      {/* Add Embla dots or other navigation if desired */}
    </div>
  );
};

export default FeaturedCarousel;
