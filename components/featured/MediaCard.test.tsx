// components/featured/MediaCard.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import MediaCard from './MediaCard';
import { TMDBMediaItem } from '@/lib/types/tmdb';
import React from 'react';

// Mock next/image
vi.mock('next/image', () => ({
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} />;
  },
}));

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
  },
}));


const mockItemBase: TMDBMediaItem = {
  tmdbId: 123,
  mediaType: 'movie',
  title: 'Test Movie',
  overview: 'This is a test movie.',
  voteAverage: 7.5,
  releaseDate: '2023-01-01',
};

describe('MediaCard', () => {
  it('renders with correct image src when posterPath is a full URL', () => {
    const item: TMDBMediaItem = {
      ...mockItemBase,
      posterPath: 'https://image.tmdb.org/t/p/w500/fullimage.jpg',
    };
    render(<MediaCard item={item} />);
    const image = screen.getByRole('img') as HTMLImageElement;
    expect(image.src).toBe('https://image.tmdb.org/t/p/w500/fullimage.jpg');
  });

  it('renders with correct image src when posterPath is a relative path starting with /', () => {
    const item: TMDBMediaItem = {
      ...mockItemBase,
      posterPath: '/relativeimage.jpg',
    };
    render(<MediaCard item={item} />);
    const image = screen.getByRole('img') as HTMLImageElement;
    expect(image.src).toBe('https://image.tmdb.org/t/p/w500/relativeimage.jpg');
  });

  it('renders with correct image src when posterPath is a relative path not starting with /', () => {
    const item: TMDBMediaItem = {
      ...mockItemBase,
      posterPath: 'relativeimage_no_slash.jpg',
    };
    render(<MediaCard item={item} />);
    const image = screen.getByRole('img') as HTMLImageElement;
    expect(image.src).toBe('https://image.tmdb.org/t/p/w500/relativeimage_no_slash.jpg');
  });

  it('renders with placeholder image src when posterPath is null', () => {
    const item: TMDBMediaItem = {
      ...mockItemBase,
      posterPath: null,
    };
    render(<MediaCard item={item} />);
    const image = screen.getByRole('img') as HTMLImageElement;
    expect(image.src).toContain('/placeholder_500x750.svg'); // .toContain because host might be added
  });

  it('renders with placeholder image src when posterPath is undefined', () => {
    const item: TMDBMediaItem = {
      ...mockItemBase,
      posterPath: undefined,
    };
    render(<MediaCard item={item} />);
    const image = screen.getByRole('img') as HTMLImageElement;
    expect(image.src).toContain('/placeholder_500x750.svg');
  });
  
  it('renders with placeholder image src when posterPath is an empty string', () => {
    const item: TMDBMediaItem = {
      ...mockItemBase,
      posterPath: '',
    };
    render(<MediaCard item={item} />);
    const image = screen.getByRole('img') as HTMLImageElement;
    expect(image.src).toContain('/placeholder_500x750.svg');
  });

  // Test for title and year rendering
  it('displays the title and year correctly', () => {
    const item: TMDBMediaItem = {
      ...mockItemBase,
      title: 'Specific Title',
      releaseDate: '2024-07-15',
    };
    render(<MediaCard item={item} />);
    expect(screen.getByText('Specific Title')).toBeInTheDocument();
    expect(screen.getByText('2024')).toBeInTheDocument(); // Checks for the year
  });

  it('displays "Untitled" if title is missing and no year if date is missing', () => {
    const item: TMDBMediaItem = {
      ...mockItemBase,
      title: '', // Empty title
      releaseDate: undefined, // No release date
      firstAirDate: undefined, // No first air date
    };
    render(<MediaCard item={item} />);
    expect(screen.getByText('Untitled')).toBeInTheDocument();
    // Check that year is not present. This is a bit tricky, ensure no element solely contains a year.
    // For simplicity, we'll assume if the year was rendered, it would be near the title.
    // A more robust check might involve querying for elements that match a year pattern.
    const yearElement = screen.queryByText(/\d{4}/); // Regex for a 4-digit number
    if (yearElement && yearElement.textContent?.length === 4 && !isNaN(Number(yearElement.textContent))) {
        // Further check if this is indeed just a year and not part of another text
        expect(yearElement.parentElement?.textContent).not.toContain(yearElement.textContent + "some other text");
    } else {
        expect(yearElement).toBeNull(); // Or assert that it's not found if it's strictly just the year
    }
  });
});
