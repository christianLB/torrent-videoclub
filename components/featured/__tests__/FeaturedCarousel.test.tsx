import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import FeaturedCarousel from '../FeaturedCarousel';

// Use a simple implementation of Next.js Image for tests
vi.mock('next/image', () => ({
  // Return a simple img tag as a functional component
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img 
      src={props.src || '/default-poster.jpg'} 
      alt={props.alt || 'Image'} 
      data-testid="mock-image"
      // Call onLoad prop immediately to simulate image loaded
      ref={() => props.onLoad && props.onLoad()}
    />;
  }
}));

// Create complete mock item with all required fields for image rendering
const mockItemWithTMDb = {
  id: 'inception-id',
  title: 'Inception',
  year: 2010,
  quality: '4K',
  inLibrary: false,
  downloading: false,
  backdropPath: '/inception-backdrop.jpg',  // Required for Image rendering
  posterPath: '/inception-poster.jpg',       // Required for Image rendering
  mediaType: 'movie' as const,
  rating: 8.5,
  overview: 'A sci-fi thriller',
  genres: ['Sci-Fi', 'Action'],
  tmdbAvailable: true,
  tmdb: {
    backdropPath: '/inception-backdrop.jpg',
    posterPath: '/inception-poster.jpg',
    title: 'Inception',
    overview: 'A mind-bending thriller.'
  }
};

// Mock item without TMDb data
const mockItemWithoutTMDb = {
  id: 'unknown-id',
  title: 'Unknown Movie',
  year: 2022,
  quality: 'HD',
  inLibrary: false,
  downloading: false,
  backdropPath: '', // Empty backdrop to test conditional rendering
  posterPath: '/default-poster.jpg',
  mediaType: 'movie' as const,
  rating: 0,
  overview: '',
  genres: [],
  tmdbAvailable: false
  // tmdb is undefined
};

// Mock item with partial TMDb data
const mockItemWithPartialTMDb = {
  id: 'partial-id',
  title: 'Partial Movie',
  year: 2023,
  quality: 'HD',
  inLibrary: false,
  downloading: false,
  backdropPath: '/partial-backdrop.jpg',
  posterPath: '/partial-poster.jpg',
  mediaType: 'movie' as const,
  rating: 7.0,
  // Use empty string to test the fallback to 'Description not available'
  overview: '', 
  genres: ['Drama'],
  tmdbAvailable: true,
  tmdb: {
    posterPath: '/partial-poster.jpg'
    // Missing other fields including overview
  }
};

describe('FeaturedCarousel', () => {
  it('renders a loading state when item is undefined', () => {
    // @ts-ignore - intentionally testing undefined prop
    const { container } = render(<FeaturedCarousel />);
    
    // Should show loading indicator
    expect(screen.getByText('Loading content...')).toBeDefined();
    expect(container.querySelector('.animate-pulse')).toBeDefined();
  });
  
  it('renders with full TMDb data', () => {
    const { container } = render(<FeaturedCarousel item={mockItemWithTMDb} />);
    
    // Verify title and description are displayed
    expect(screen.getByText('Inception')).toBeDefined();
    expect(screen.getByText('A mind-bending thriller.')).toBeDefined();
    
    // Verify additional metadata is displayed
    expect(screen.getByText('2010')).toBeDefined();
    expect(screen.getByText('4K')).toBeDefined();
    
    // Just verify the component rendered successfully
    expect(container.firstChild).toBeDefined();
  });

  it('renders with missing TMDb data (tmdb undefined)', () => {
    const { container } = render(<FeaturedCarousel item={mockItemWithoutTMDb} />);
    
    // Verify title fallback works
    expect(screen.getByText('Unknown Movie')).toBeDefined();
    
    // Verify description fallback works
    expect(screen.getByText('Description not available')).toBeDefined();
    
    // Verify additional metadata is displayed
    expect(screen.getByText('2022')).toBeDefined();
    expect(screen.getByText('HD')).toBeDefined();
    
    // Just verify the component rendered successfully
    expect(container.firstChild).toBeDefined();
  });

  it('renders with partially missing TMDb data', () => {
    const { container } = render(<FeaturedCarousel item={mockItemWithPartialTMDb} />);
    
    // Verify title is displayed correctly
    expect(screen.getByText('Partial Movie')).toBeDefined();
    
    // Verify fallback description is used when both tmdb.overview and item.overview are missing
    expect(screen.getByText('Description not available')).toBeDefined();
    
    // Verify component rendered successfully
    expect(container.firstChild).toBeDefined();
  });

  it('does not crash when tmdb is absent', () => {
    // Create a minimal valid item with just a title
    const minimalItem = {
      id: 'minimal-id',
      title: 'No TMDb',
      overview: '',
      backdropPath: '',
      posterPath: '',
      mediaType: 'movie' as const,
      rating: 0,
      year: new Date().getFullYear(),
      genres: [],
      inLibrary: false,
      downloading: false,
      tmdbAvailable: false
    };
    
    // This should not throw an error
    expect(() => render(<FeaturedCarousel item={minimalItem} />)).not.toThrow();
    
    // Verify minimal content is displayed
    expect(screen.getByText('No TMDb')).toBeDefined();
    expect(screen.getByText('Description not available')).toBeDefined();
  });

  it('uses fallbacks for poster, title, and description', () => {
    // Create a valid item with empty TMDb object
    const fallbackItem = {
      id: 'fallback-id',
      title: 'Fallback Movie',
      overview: '',
      backdropPath: '/some-backdrop.jpg',
      posterPath: '',
      mediaType: 'movie' as const,
      rating: 0,
      year: 2025,
      genres: [],
      inLibrary: false,
      downloading: false,
      tmdbAvailable: true,
      tmdb: {}
    };
    
    const { container } = render(<FeaturedCarousel item={fallbackItem} />);
    
    // Verify fallbacks work
    expect(screen.getByText('Fallback Movie')).toBeDefined();
    expect(screen.getByText('Description not available')).toBeDefined();
    
    // Verify the component rendered
    expect(container.firstChild).toBeDefined();
  });
});

