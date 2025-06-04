import SearchInput from '@/components/search/SearchInput';

export default function SearchPage() {
  const handleSearch = (query: string) => {
    // Implement search logic here (e.g., fetch results, navigate to results page)
    console.log('Search query from page:', query);
    // For now, we'll just log. Later, this could update state or trigger an API call.
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold neon-text-cyan mb-8 text-center">
        Search Movies & Series
      </h1>
      <SearchInput onSearch={handleSearch} />
      {/* Search results will be displayed below this input */}
      {/* Example placeholder for search results area */}
      {/* <div className="mt-8">
        <p className="text-slate-400 text-center">Search results will appear here.</p>
      </div> */}
    </div>
  );
}
