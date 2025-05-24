'use client';

import Image from 'next/image';
import { useState } from 'react';
import { RatingBadge } from './rating-badge';
import { LoadingSpinner } from './loading-spinner';

interface MediaDetailsProps {
  mediaId: number;
  mediaType: 'movie' | 'series';
  isOpen: boolean;
  onClose: () => void;
  onAdd: (id: number) => Promise<void>;
}

interface MediaDetails {
  id: number;
  title: string;
  overview: string;
  posterPath: string | null;
  backdropPath: string | null;
  releaseDate?: string;
  firstAirDate?: string;
  voteAverage: number;
  genres: { id: number; name: string }[];
  runtime?: number;
  numberOfSeasons?: number;
  numberOfEpisodes?: number;
}

export function MediaDetails({ mediaId, mediaType, isOpen, onClose, onAdd }: MediaDetailsProps) {
  const [details, setDetails] = useState<MediaDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);

  const fetchDetails = async () => {
    if (!mediaId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const endpoint = mediaType === 'movie' 
        ? `/api/movies/${mediaId}/details` 
        : `/api/series/${mediaId}/details`;
      
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      setDetails(data);
    } catch (err) {
      setError('Failed to fetch details. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch details when modal opens
  if (isOpen && !details && !loading && !error) {
    fetchDetails();
  }

  const handleAdd = async () => {
    if (!mediaId) return;
    
    setIsAdding(true);
    setError(null);
    
    try {
      await onAdd(mediaId);
      setAddSuccess(true);
      
      // Reset success message after 3 seconds
      setTimeout(() => {
        setAddSuccess(false);
      }, 3000);
    } catch (err) {
      setError('Failed to add to library. Please try again.');
      console.error(err);
    } finally {
      setIsAdding(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 overflow-auto">
      <div className="relative bg-background rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-black/50 text-white rounded-full p-1.5 hover:bg-black/70"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center h-96 space-y-4">
            <LoadingSpinner size="large" />
            <p>Loading details...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-destructive mb-4">{error}</p>
            <button
              onClick={fetchDetails}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-md"
            >
              Try Again
            </button>
          </div>
        ) : details ? (
          <>
            {/* Backdrop image */}
            {details.backdropPath && (
              <div className="relative h-64 w-full">
                <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent z-10" />
                <Image
                  src={`https://image.tmdb.org/t/p/w1280${details.backdropPath}`}
                  alt={details.title}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            
            <div className="p-6 pt-8">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Poster */}
                <div className="w-full md:w-1/3 lg:w-1/4 flex-shrink-0">
                  <div className="relative aspect-[2/3] overflow-hidden rounded-md">
                    <Image
                      src={details.posterPath ? `https://image.tmdb.org/t/p/w500${details.posterPath}` : '/placeholder-poster.svg'}
                      alt={details.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
                
                {/* Details */}
                <div className="flex-1">
                  <h2 className="text-2xl md:text-3xl font-bold mb-2">{details.title}</h2>
                  
                  <div className="flex items-center gap-3 mb-4">
                    <RatingBadge rating={details.voteAverage} size="lg" />
                    
                    {mediaType === 'movie' && details.releaseDate && (
                      <span className="text-muted-foreground">
                        {new Date(details.releaseDate).getFullYear()}
                      </span>
                    )}
                    
                    {mediaType === 'series' && details.firstAirDate && (
                      <span className="text-muted-foreground">
                        {new Date(details.firstAirDate).getFullYear()}
                      </span>
                    )}
                    
                    {mediaType === 'movie' && details.runtime && (
                      <span className="text-muted-foreground">
                        {Math.floor(details.runtime / 60)}h {details.runtime % 60}m
                      </span>
                    )}
                    
                    {mediaType === 'series' && (
                      <span className="text-muted-foreground">
                        {details.numberOfSeasons} {details.numberOfSeasons === 1 ? 'Season' : 'Seasons'}
                      </span>
                    )}
                  </div>
                  
                  {/* Genres */}
                  {details.genres && details.genres.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {details.genres.map(genre => (
                        <span 
                          key={genre.id} 
                          className="bg-muted px-2 py-1 rounded-md text-sm"
                        >
                          {genre.name}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {/* Overview */}
                  <p className="text-muted-foreground mb-6">{details.overview}</p>
                  
                  {/* Add button */}
                  <div className="flex items-center gap-4">
                    <button
                      onClick={handleAdd}
                      disabled={isAdding || addSuccess}
                      className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 disabled:opacity-50 flex items-center space-x-2"
                    >
                      {isAdding ? (
                        <>
                          <LoadingSpinner size="small" />
                          <span>Adding...</span>
                        </>
                      ) : addSuccess ? (
                        <>
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            className="h-5 w-5" 
                            viewBox="0 0 20 20" 
                            fill="currentColor"
                          >
                            <path 
                              fillRule="evenodd" 
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                              clipRule="evenodd" 
                            />
                          </svg>
                          <span>Added Successfully</span>
                        </>
                      ) : (
                        <>
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            className="h-5 w-5" 
                            viewBox="0 0 20 20" 
                            fill="currentColor"
                          >
                            <path 
                              fillRule="evenodd" 
                              d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" 
                              clipRule="evenodd" 
                            />
                          </svg>
                          <span>Add to {mediaType === 'movie' ? 'Radarr' : 'Sonarr'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="p-8 text-center">
            <p>No details available.</p>
          </div>
        )}
      </div>
    </div>
  );
}
