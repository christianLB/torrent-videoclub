'use client';

import React, { useState } from 'react';
import { Search } from 'lucide-react'; // Using lucide-react for icons

interface SearchInputProps {
  onSearch?: (query: string) => void;
  initialQuery?: string;
}

const SearchInput: React.FC<SearchInputProps> = ({ onSearch, initialQuery = '' }) => {
  const [query, setQuery] = useState(initialQuery);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (onSearch) {
      onSearch(query);
    }
    // Add search logic or navigation here if needed directly
    console.log('Search submitted:', query);
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-xl mx-auto">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder="Search for movies, series..."
          className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 text-white rounded-lg focus:outline-none focus:neon-border-cyan focus:border-transparent transition-colors duration-150 placeholder-slate-500"
        />
        <div className="absolute left-4 top-1/2 -translate-y-1/2">
          <Search className="w-5 h-5 text-slate-500" />
        </div>
      </div>
      {/* Hidden submit button to allow form submission on enter, or make the icon a button type='submit' */}
      <button type="submit" className="hidden">Search</button>
    </form>
  );
};

export default SearchInput;
