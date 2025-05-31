import { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { RatingBadge } from './rating-badge';
import { MediaDetails } from './media-details';

interface MediaCardProps {
  guid: string;
  title: string;
  year?: number;
  posterPath?: string | null;
  rating?: number;
  mediaType: 'movie' | 'series';
  quality?: string;
  seeders?: number;
  size?: string;
  tmdbId?: number;
  handleAddClick: (guid: string) => void;
}

export function MediaCard({
  guid,
  title,
  year,
  posterPath,
  rating,
  mediaType,
  quality,
  seeders,
  size,
  tmdbId,
  handleAddClick,
}: MediaCardProps) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const defaultPoster = '/placeholder-poster.svg';
  
  const handleViewDetails = () => {
    if (tmdbId) {
      setIsDetailsOpen(true);
    }
  };
  
  const handleAddToLibrary = async () => {
    handleAddClick(guid);
    return Promise.resolve();
  };
  
  return (
    <>
      <Card className="overflow-hidden h-full flex flex-col transition-all hover:shadow-md cursor-pointer" onClick={handleViewDetails}>
        <div className="relative aspect-[2/3] overflow-hidden">
          <Image
            src={posterPath || defaultPoster}
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-end justify-center p-4">
            <button 
              className="bg-primary text-primary-foreground text-sm px-3 py-1 rounded-md"
              onClick={(e) => {
                e.stopPropagation();
                handleViewDetails();
              }}
            >
              View Details
            </button>
          </div>
          {quality && (
            <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
              {quality}
            </div>
          )}
          {rating && (
            <div className="absolute top-2 left-2">
              <RatingBadge rating={rating} size="sm" />
            </div>
          )}
        </div>
      
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start">
          <h3 className="font-bold leading-tight line-clamp-1">{title}</h3>
          {year && <span className="text-muted-foreground text-sm">{year}</span>}
        </div>
      </CardHeader>
      
      <CardContent className="p-4 pt-0 pb-2 flex-grow">
        
        {seeders !== undefined && (
          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
            <span className="font-medium">Seeders:</span>
            <span className={seeders > 0 ? 'text-green-500' : 'text-red-500'}>
              {seeders}
            </span>
          </div>
        )}
        
        {size && (
          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
            <span className="font-medium">Size:</span>
            <span>{size}</span>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="p-4 pt-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleAddClick(guid);
          }}
          className="w-full bg-primary text-primary-foreground rounded py-1 text-sm transition-colors hover:bg-primary/90"
        >
          Add to {mediaType === 'movie' ? 'Radarr' : 'Sonarr'}
        </button>
      </CardFooter>
    </Card>
    
    {isDetailsOpen && tmdbId && (
      <MediaDetails
        mediaId={tmdbId}
        mediaType={mediaType}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        onAdd={handleAddToLibrary}
      />
    )}
    </>
  );
}
