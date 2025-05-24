'use client';

import { useState, useEffect } from 'react';
import { MediaCard } from '@/components/media-card';
import { FilterBar, FilterOptions } from '@/components/filter-bar';
import { SearchBar } from '@/components/search-bar';
import { LoadingSpinner } from '@/components/loading-spinner';
import { useNotification } from '@/components/notification-context';

interface Movie {
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

export default function MoviesPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [filteredMovies, setFilteredMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showNotification } = useNotification();
  const [searchQuery, setSearchQuery] = useState('');
  const [genres, setGenres] = useState<{ id: number; name: string }[]>([
    { id: 28, name: 'Action' },
    { id: 12, name: 'Adventure' },
    { id: 16, name: 'Animation' },
    { id: 35, name: 'Comedy' },
    { id: 80, name: 'Crime' },
    { id: 99, name: 'Documentary' },
    { id: 18, name: 'Drama' },
    { id: 10751, name: 'Family' },
    { id: 14, name: 'Fantasy' },
    { id: 36, name: 'History' },
    { id: 27, name: 'Horror' },
    { id: 10402, name: 'Music' },
    { id: 9648, name: 'Mystery' },
    { id: 10749, name: 'Romance' },
    { id: 878, name: 'Science Fiction' },
    { id: 10770, name: 'TV Movie' },
    { id: 53, name: 'Thriller' },
    { id: 10752, name: 'War' },
    { id: 37, name: 'Western' },
  ]);

  const searchMovies = async (query: string) => {
    if (!query.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/movies?query=${encodeURIComponent(query)}`);
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      setMovies(data);
      setFilteredMovies(data);
      if (data.length > 0) {
        showNotification(`Found ${data.length} movies matching "${query}"`, 'success');
      } else {
        showNotification(`No movies found for "${query}"`, 'info');
      }
    } catch (err) {
      setError('Failed to fetch movies. Please try again.');
      showNotification('Failed to fetch movies. Please try again.', 'error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    searchMovies(query);
  };

  const handleFilterChange = (filters: FilterOptions) => {
    let filtered = [...movies];
    
    if (filters.genre) {
      filtered = filtered.filter(
        movie => movie.tmdb?.genreIds.includes(filters.genre as number)
      );
    }
    
    if (filters.year) {
      filtered = filtered.filter(movie => movie.year === filters.year);
    }
    
    if (filters.minRating) {
      filtered = filtered.filter(
        movie => (movie.tmdb?.voteAverage || 0) >= (filters.minRating as number)
      );
    }
    
    if (filters.resolution) {
      filtered = filtered.filter(
        movie => movie.quality?.toLowerCase().includes((filters.resolution as string).toLowerCase())
      );
    }
    
    setFilteredMovies(filtered);
  };

  const handleAddMovie = async (guid: string) => {
    const movie = movies.find(m => m.guid === guid);
    
    if (!movie || !movie.tmdb) {
      setError('Could not find movie details to add.');
      return;
    }
    
    try {
      const response = await fetch('/api/add/movie', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tmdbId: movie.tmdb.id,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      // Update UI to reflect addition
      const updatedMovies = movies.map(m => 
        m.guid === guid ? { ...m, added: true } : m
      );
      
      setMovies(updatedMovies);
      setFilteredMovies(
        filteredMovies.map(m => (m.guid === guid ? { ...m, added: true } : m))
      );
      
      showNotification(`Added "${movie.title}" to Radarr successfully!`, 'success');
    } catch (err) {
      setError('Failed to add movie to Radarr. Please try again.');
      showNotification('Failed to add movie to Radarr. Please try again.', 'error');
      console.error(err);
    }
  };

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Movies</h1>
      
      <div className="mb-6">
        <SearchBar 
          placeholder="Search for movies..."
          onSearch={handleSearch}
          isLoading={loading}
        />
      </div>
      
      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-6">
          {error}
        </div>
      )}
      
      {movies.length > 0 && (
        <FilterBar onFilterChange={handleFilterChange} genres={genres} />
      )}
      
      {loading ? (
        <div className="flex flex-col justify-center items-center h-64 space-y-4">
          <LoadingSpinner size="large" />
          <div className="text-lg font-medium">Loading movies...</div>
        </div>
      ) : filteredMovies.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredMovies.map((movie) => (
            <MediaCard
              key={movie.guid}
              guid={movie.guid}
              title={movie.title}
              year={movie.year}
              posterPath={movie.tmdb?.posterPath}
              rating={movie.tmdb?.voteAverage}
              mediaType="movie"
              quality={movie.quality}
              seeders={movie.seeders}
              size={movie.sizeFormatted}
              tmdbId={movie.tmdb?.id}
              handleAddClick={handleAddMovie}
            />
          ))}
        </div>
      ) : movies.length > 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No movies match your filters. Try adjusting your criteria.</p>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Search for movies to get started.</p>
        </div>
      )}
    </div>
  );
}
