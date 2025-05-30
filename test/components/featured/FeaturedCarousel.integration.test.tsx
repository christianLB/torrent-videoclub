import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import FeaturedCarousel from '../../../components/featured/FeaturedCarousel';
import { TMDBMediaItem, TMDBGenre } from '../../../lib/types/tmdb';

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
  // Helper to create a mock TMDBMediaItem object for testing
  const createTestTmdbItem = (overrides: Partial<TMDBMediaItem> = {}): TMDBMediaItem => ({
    tmdbId: 12345, // Default tmdbId
    mediaType: 'movie',
    title: 'Default Test Title',
    overview: 'This is a default test overview for the movie or series.',
    posterPath: '/defaultPoster.jpg',
    backdropPath: '/defaultBackdrop.jpg',
    releaseDate: '2024-01-15', // Default for movies
    firstAirDate: undefined, // Default for movies
    voteAverage: 7.5,
    genres: [{ id: 28, name: 'Action' }, { id: 12, name: 'Adventure' }] as TMDBGenre[],
    // Add other TMDBMediaItem fields with defaults if necessary
    ...overrides
  });

  it('renders correctly with full TMDB data', () => {
    const testItem = createTestTmdbItem({
      title: 'Awesome Movie Title',
      overview: 'An awesome overview of an awesome movie.',
      releaseDate: '2024-05-20',
      genres: [{ id: 878, name: 'Science Fiction' }]
    });

    const { container } = render(<FeaturedCarousel item={testItem} />);
    
    expect(screen.getByText('Awesome Movie Title')).toBeDefined();
    expect(screen.getByText('An awesome overview of an awesome movie.')).toBeDefined();
    expect(screen.getByText('2024')).toBeDefined(); // Year derived from releaseDate
    expect(screen.getByText('Science Fiction')).toBeDefined(); // Genre name
    
    expect(container.firstChild).toBeDefined();
  });

    it('renders with partial data, showing fallbacks', () => {
    const testItem = createTestTmdbItem({
      title: 'Movie With Minimal Info',
      overview: undefined, // Explicitly undefined to test fallback
      releaseDate: '2023-03-10',
      genres: [], // Empty genres
      posterPath: '/minimal-poster.jpg' // Has a poster though
    });

    render(<FeaturedCarousel item={testItem} />);
    
    expect(screen.getByText('Movie With Minimal Info')).toBeDefined();
    // Check for the component's internal fallback for overview
    expect(screen.getByText('No description available')).toBeDefined(); 
    expect(screen.getByText('2023')).toBeDefined();
    // Ensure genres are not displayed if empty or not provided, or handle as appropriate
    // For example, if an empty genre list means nothing is rendered for genres:
    expect(screen.queryByText('Action')).toBeNull(); // Assuming 'Action' was a default genre
  });

    it('handles item with undefined overview to use component default', () => {
    const testItem = createTestTmdbItem({
      title: 'Item With No Overview Provided',
      overview: undefined, // Key to test component's internal default
      releaseDate: '2022-07-01'
    });

    render(<FeaturedCarousel item={testItem} />);
    
    expect(screen.getByText('Item With No Overview Provided')).toBeDefined();
    expect(screen.getByText('No description available')).toBeDefined(); // Component's default
    expect(screen.getByText('2022')).toBeDefined();
  });
});
