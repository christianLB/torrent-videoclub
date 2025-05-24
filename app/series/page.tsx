'use client';

import { useState, useEffect } from 'react';
import { MediaCard } from '@/components/media-card';
import { FilterBar, FilterOptions } from '@/components/filter-bar';
import { SearchBar } from '@/components/search-bar';
import { LoadingSpinner } from '@/components/loading-spinner';
import { useNotification } from '@/components/notification-context';

interface Series {
  guid: string;
  title: string;
  year?: number;
  quality?: string;
  format?: string;
  codec?: string;
  size: number;
  sizeFormatted: string;
  indexer: string;
  seeders: number;
  leechers: number;
  tmdb?: {
    id: number;
    posterPath: string | null;
    backdropPath: string | null;
    voteAverage: number;
    genreIds: number[];
    overview: string;
  };
}

export default function SeriesPage() {
  const [series, setSeries] = useState<Series[]>([]);
  const [filteredSeries, setFilteredSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showNotification } = useNotification();
  const [searchQuery, setSearchQuery] = useState('');
  const [genres, setGenres] = useState<{ id: number; name: string }[]>([
    { id: 10759, name: 'Action & Adventure' },
    { id: 16, name: 'Animation' },
    { id: 35, name: 'Comedy' },
    { id: 80, name: 'Crime' },
    { id: 99, name: 'Documentary' },
    { id: 18, name: 'Drama' },
    { id: 10751, name: 'Family' },
    { id: 10762, name: 'Kids' },
    { id: 9648, name: 'Mystery' },
    { id: 10763, name: 'News' },
    { id: 10764, name: 'Reality' },
    { id: 10765, name: 'Sci-Fi & Fantasy' },
    { id: 10766, name: 'Soap' },
    { id: 10767, name: 'Talk' },
    { id: 10768, name: 'War & Politics' },
    { id: 37, name: 'Western' },
  ]);

  const searchSeries = async (query: string) => {
    if (!query.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/series?query=${encodeURIComponent(query)}`);
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      setSeries(data);
      setFilteredSeries(data);
      if (data.length > 0) {
        showNotification(`Found ${data.length} series matching "${query}"`, 'success');
      } else {
        showNotification(`No series found for "${query}"`, 'info');
      }
    } catch (err) {
      setError('Failed to fetch series. Please try again.');
      showNotification('Failed to fetch series. Please try again.', 'error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    searchSeries(query);
  };

  const handleFilterChange = (filters: FilterOptions) => {
    let filtered = [...series];
    
    if (filters.genre) {
      filtered = filtered.filter(
        show => show.tmdb?.genreIds.includes(filters.genre as number)
      );
    }
    
    if (filters.year) {
      filtered = filtered.filter(show => show.year === filters.year);
    }
    
    if (filters.minRating) {
      filtered = filtered.filter(
        show => (show.tmdb?.voteAverage || 0) >= (filters.minRating as number)
      );
    }
    
    if (filters.resolution) {
      filtered = filtered.filter(
        show => show.quality?.toLowerCase().includes((filters.resolution as string).toLowerCase())
      );
    }
    
    setFilteredSeries(filtered);
  };

  const handleAddSeries = async (guid: string) => {
    const show = series.find(s => s.guid === guid);
    
    if (!show || !show.tmdb) {
      setError('Could not find series details to add.');
      return;
    }
    
    try {
      const response = await fetch('/api/add/series', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tmdbId: show.tmdb.id,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      // Update UI to reflect addition
      const updatedSeries = series.map(s => 
        s.guid === guid ? { ...s, added: true } : s
      );
      
      setSeries(updatedSeries);
      setFilteredSeries(
        filteredSeries.map(s => (s.guid === guid ? { ...s, added: true } : s))
      );
      
      showNotification(`Added "${show.title}" to Sonarr successfully!`, 'success');
    } catch (err) {
      setError('Failed to add series to Sonarr. Please try again.');
      showNotification('Failed to add series to Sonarr. Please try again.', 'error');
      console.error(err);
    }
  };

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">TV Series</h1>
      
      <div className="mb-6">
        <SearchBar 
          placeholder="Search for TV series..."
          onSearch={handleSearch}
          isLoading={loading}
        />
      </div>
      
      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-6">
          {error}
        </div>
      )}
      
      {series.length > 0 && (
        <FilterBar onFilterChange={handleFilterChange} genres={genres} />
      )}
      
      {loading ? (
        <div className="flex flex-col justify-center items-center h-64 space-y-4">
          <LoadingSpinner size="large" />
          <div className="text-lg font-medium">Loading series...</div>
        </div>
      ) : filteredSeries.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredSeries.map((show) => (
            <MediaCard
              key={show.guid}
              guid={show.guid}
              title={show.title}
              year={show.year}
              posterPath={show.tmdb?.posterPath}
              rating={show.tmdb?.voteAverage}
              mediaType="series"
              quality={show.quality}
              seeders={show.seeders}
              size={show.sizeFormatted}
              tmdbId={show.tmdb?.id}
              handleAddClick={handleAddSeries}
            />
          ))}
        </div>
      ) : series.length > 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No series match your filters. Try adjusting your criteria.</p>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Search for TV series to get started.</p>
        </div>
      )}
    </div>
  );
}
