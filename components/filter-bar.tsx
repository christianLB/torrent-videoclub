import { useState } from 'react';

interface FilterBarProps {
  onFilterChange: (filters: FilterOptions) => void;
  genres: { id: number; name: string }[];
}

export interface FilterOptions {
  genre?: number;
  year?: number;
  minRating?: number;
  resolution?: string;
}

export function FilterBar({ onFilterChange, genres }: FilterBarProps) {
  const [filters, setFilters] = useState<FilterOptions>({});
  
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 20 }, (_, i) => currentYear - i);
  
  const resolutions = ['480p', '720p', '1080p', '2160p', '4K'];
  
  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    const newFilters = { 
      ...filters, 
      [key]: value === '' ? undefined : key === 'minRating' || key === 'year' ? Number(value) : value 
    };
    
    setFilters(newFilters);
    onFilterChange(newFilters);
  };
  
  return (
    <div className="bg-card p-4 rounded-lg mb-6 border">
      <h2 className="text-lg font-semibold mb-4">Filters</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Genre Filter */}
        <div>
          <label htmlFor="genre" className="block text-sm font-medium mb-1">
            Genre
          </label>
          <select
            id="genre"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            onChange={(e) => handleFilterChange('genre', e.target.value)}
            value={filters.genre || ''}
          >
            <option value="">All Genres</option>
            {genres.map((genre) => (
              <option key={genre.id} value={genre.id}>
                {genre.name}
              </option>
            ))}
          </select>
        </div>
        
        {/* Year Filter */}
        <div>
          <label htmlFor="year" className="block text-sm font-medium mb-1">
            Year
          </label>
          <select
            id="year"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            onChange={(e) => handleFilterChange('year', e.target.value)}
            value={filters.year || ''}
          >
            <option value="">All Years</option>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
        
        {/* Rating Filter */}
        <div>
          <label htmlFor="rating" className="block text-sm font-medium mb-1">
            Min Rating
          </label>
          <select
            id="rating"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            onChange={(e) => handleFilterChange('minRating', e.target.value)}
            value={filters.minRating || ''}
          >
            <option value="">Any Rating</option>
            <option value="7">7+</option>
            <option value="8">8+</option>
            <option value="9">9+</option>
          </select>
        </div>
        
        {/* Resolution Filter */}
        <div>
          <label htmlFor="resolution" className="block text-sm font-medium mb-1">
            Resolution
          </label>
          <select
            id="resolution"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            onChange={(e) => handleFilterChange('resolution', e.target.value)}
            value={filters.resolution || ''}
          >
            <option value="">Any Resolution</option>
            {resolutions.map((resolution) => (
              <option key={resolution} value={resolution}>
                {resolution}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
