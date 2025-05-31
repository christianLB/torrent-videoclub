'use client';

import { useState } from 'react';
import { FilterBar, FilterOptions } from '@/components/filter-bar';
import { SearchBar } from '@/components/search-bar';
import { useNotification } from '@/components/notification-context';
import { HackerMediaCard } from '@/components/hacker-media-card';
import { HackerLoadingSpinner } from '@/components/hacker-loading-spinner';

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
  const [genres] = useState<{ id: number; name: string }[]>([ // setGenres was unused
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
        series => series.tmdb?.genreIds.includes(filters.genre as number)
      );
    }
    
    if (filters.year) {
      filtered = filtered.filter(series => series.year === filters.year);
    }
    
    if (filters.minRating) {
      filtered = filtered.filter(
        series => (series.tmdb?.voteAverage || 0) >= (filters.minRating as number)
      );
    }
    
    if (filters.resolution) {
      filtered = filtered.filter(
        series => series.quality?.toLowerCase().includes((filters.resolution as string).toLowerCase())
      );
    }
    
    setFilteredSeries(filtered);
  };

  const handleAddSeries = async (guid: string) => {
    const seriesItem = series.find(s => s.guid === guid);
    
    if (!seriesItem || !seriesItem.tmdb) {
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
          tvdbId: seriesItem.tmdb.id,
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
      
      showNotification(`Added "${seriesItem.title}" to Sonarr successfully!`, 'success');
    } catch (err) {
      setError('Failed to add series to Sonarr. Please try again.');
      showNotification('Failed to add series to Sonarr. Please try again.', 'error');
      console.error(err);
    }
  };

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6 font-mono text-green-500">Series Catalog <span className="text-xs text-green-700 ml-2">[BETA]</span></h1>
      
      <div className="mb-6">
        <SearchBar 
          placeholder="Scan for TV series..."
          onSearch={handleSearch}
          isLoading={loading}
        />
      </div>
      
      {error && (
        <div className="bg-red-900/20 text-red-500 p-4 rounded-md mb-6 font-mono border border-red-900/50">
          <span className="text-red-400 mr-2">[ERROR]</span> {error}
        </div>
      )}
      
      {series.length > 0 && (
        <FilterBar onFilterChange={handleFilterChange} genres={genres} />
      )}
      
      {loading ? (
        <div className="flex flex-col justify-center items-center h-64 space-y-4">
          <HackerLoadingSpinner size="large" message="Accessing secure feeds" />
        </div>
      ) : filteredSeries.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredSeries.map((series) => (
            <HackerMediaCard
              key={series.guid}
              guid={series.guid}
              title={series.title}
              year={series.year}
              posterPath={series.tmdb?.posterPath}
              rating={series.tmdb?.voteAverage}
              mediaType="series"
              quality={series.quality}
              seeders={series.seeders}
              size={series.sizeFormatted}
              tmdbId={series.tmdb?.id}
              handleAddClick={handleAddSeries}
            />
          ))}
        </div>
      ) : series.length > 0 ? (
        <div className="text-center py-12 font-mono">
          <p className="text-green-600">[ERROR] No matching results found</p>
          <p className="text-green-400 mt-2">Adjust filtering parameters and try again.</p>
        </div>
      ) : (
        <div className="text-center py-12 font-mono">
          <p className="text-green-500">{'_>'} Enter search query to begin scan</p>
          <p className="text-green-800 mt-2 text-xs">SYSTEM IDLE - WAITING FOR INPUT</p>
        </div>
      )}
    </div>
  );
}
