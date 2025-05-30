import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import FeaturedCarousel from '../../../components/featured/FeaturedCarousel';
import { FeaturedItem } from '../../../lib/types/featured';

// Mock next/image since it's used in the component
vi.mock('next/image', () => ({
  default: (props: any) => {
    return <img 
      src={props.src || '/default-poster.jpg'} 
      alt={props.alt || 'Image'} 
      data-testid="mock-image"
      ref={() => props.onLoad && props.onLoad()}
    />;
  }
}));

describe('FeaturedCarousel Integration Tests', () => {
  // Test with real data structure but mock content
  const createTestItem = (overrides: Partial<FeaturedItem> = {}): FeaturedItem => ({
    id: 'test-id',
    title: 'Test Movie',
    overview: 'Test overview',
    backdropPath: '/test-backdrop.jpg',
    posterPath: '/test-poster.jpg',
    mediaType: 'movie',
    rating: 8.0,
    year: 2024,
    genres: ['Action', 'Sci-Fi'],
    inLibrary: false,
    downloading: false,
    tmdbAvailable: true,
    tmdb: {
      title: 'Test Movie TMDB',
      overview: 'Test overview from TMDB',
      posterPath: '/tmdb-poster.jpg',
      backdropPath: '/tmdb-backdrop.jpg',
      voteAverage: 8.0,
    },
    ...overrides
  });

  it('renders correctly with data from the trending content client', () => {
    // This mimics what would come from TrendingContentClient via CuratorService
    const featuredItem = createTestItem({
      title: 'Trending Movie',
      year: 2024,
      quality: '4K',
      seeders: 150,
      tmdb: {
        title: 'Trending Movie (TMDB)',
        overview: 'A trending movie with TMDB data',
        backdropPath: '/trending-backdrop.jpg',
        posterPath: '/trending-poster.jpg'
      }
    });

    const { container } = render(<FeaturedCarousel item={featuredItem} />);
    
    // Should show the TMDB title, not the original title
    expect(screen.getByText('Trending Movie (TMDB)')).toBeDefined();
    expect(screen.getByText('A trending movie with TMDB data')).toBeDefined();
    
    // Should show metadata
    expect(screen.getByText('2024')).toBeDefined();
    expect(screen.getByText('4K')).toBeDefined();
    
    // Component rendered
    expect(container.firstChild).toBeDefined();
  });

  it('renders with partial data from the trending content client', () => {
    // This mimics what would come from TrendingContentClient without all TMDB data
    const featuredItem = createTestItem({
      title: 'Partial TMDB Data Movie',
      year: 2023,
      quality: 'HD',
      seeders: 75,
      tmdb: {
        // Only partial data
        posterPath: '/partial-poster.jpg'
      }
    });

    render(<FeaturedCarousel item={featuredItem} />);
    
    // Should fall back to the original title
    expect(screen.getByText('Partial TMDB Data Movie')).toBeDefined();
    
    // Should show fallback description
    expect(screen.getByText('Description not available')).toBeDefined();
  });

  it('handles missing tmdb property from trending content client', () => {
    // This mimics what would come from TrendingContentClient with no TMDB data
    const featuredItem = createTestItem({
      title: 'No TMDB Data',
      year: 2022,
      quality: '1080p',
      seeders: 50,
      tmdb: undefined
    });

    render(<FeaturedCarousel item={featuredItem} />);
    
    // Should use fallbacks
    expect(screen.getByText('No TMDB Data')).toBeDefined();
    expect(screen.getByText('Description not available')).toBeDefined();
  });
});
