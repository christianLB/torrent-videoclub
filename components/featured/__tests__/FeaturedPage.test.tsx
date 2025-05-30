import React from 'react';
/// <reference types="vitest/globals" />
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import FeaturedPage from '../FeaturedPage'; // Adjust path as necessary
import { FeaturedContent, FeaturedItem } from '@/lib/types/featured';
import { vi, Mock } from 'vitest'; // Import vi and Mock

// Mock next/image
vi.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    const { src, alt, width, height, style, ...rest } = props;
    // Attempt to provide some basic styling if dimensions are available
    const imgStyle = {
      width: width ? `${width}px` : 'auto',
      height: height ? `${height}px` : 'auto',
      ...style,
    };
    // eslint-disable-next-line jsx-a11y/alt-text
    return <img src={src as string} alt={alt as string} style={imgStyle} {...rest} />;
  },
}));

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  }
}));

// Mock global fetch
global.fetch = vi.fn();

const mockFeaturedItem: FeaturedItem = {
  title: 'Test Movie Prowlarr Title', // Original title from Prowlarr
  guid: 'hero123',
  indexerId: '1', // Example Prowlarr indexer ID for the hero item',
  mediaType: 'movie',
  size: 1000,
  protocol: 'torrent',
  displayTitle: 'Test Movie Display Title',
  displayOverview: 'This is a test movie.',
  fullPosterPath: '/poster.jpg',
  fullBackdropPath: '/backdrop.jpg',
  displayYear: 2023,
  displayRating: 8.5,
  displayGenres: ['Action', 'Adventure'],
  inLibrary: false,
  isDownloading: false,
  isProcessing: false,
  tmdbInfo: {
    tmdbId: 123, // Numeric TMDb ID123',
    title: 'Test Movie TMDB',
    overview: 'TMDB overview.',
    posterPath: '/tmdb_poster.jpg',
    backdropPath: '/tmdb_backdrop.jpg',
    releaseDate: '2023-01-01',
    voteAverage: 8.5,
    genreIds: [28, 12],
    year: 2023,
  }
};

const mockFeaturedContent: FeaturedContent = {
  featuredItem: mockFeaturedItem,
  categories: [
    {
      id: 'cat1_movies',
      title: 'Trending Movies', // Category title: 'Test Category',
      items: [mockFeaturedItem]
    }
  ]
};


describe('FeaturedPage', () => {
  beforeEach(() => {
    // Reset mocks before each test
    (fetch as Mock).mockClear();
    vi.clearAllMocks(); // Clears toast mocks as well
  });

  it('should call /api/add with correct parameters when adding an item from featured hero', async () => {
    (fetch as Mock)
      .mockResolvedValueOnce({ // For initial content fetch
        ok: true,
        json: async () => mockFeaturedContent,
      })
      .mockResolvedValueOnce({ // For /api/add
        ok: true,
        json: async () => ({ message: 'Successfully added', inLibrary: true }),
      });

    render(<FeaturedPage />);

    // Wait for the featured content to load
    // Wait for the featured item title to ensure swrData has been processed into featuredContent state
    await screen.findByText(mockFeaturedItem.displayTitle!, {}, { timeout: 3000 });

    // Click the 'Add to Library' button on the hero/featured item
    const addButton = await screen.findByTestId('featured-add-to-library');
    fireEvent.click(addButton);
    
    // Check if the button is associated with the hero item
    // This is a simplified check; more robust would be to ensure it's the hero's button
    expect(addButton).toBeInTheDocument();


    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guid: mockFeaturedItem.guid,
          indexerId: mockFeaturedItem.indexerId,
          mediaType: mockFeaturedItem.mediaType,
          title: mockFeaturedItem.displayTitle, // Title for notification
        }),
      });
    });

    await waitFor(() => {
        expect(require('react-hot-toast').toast.success).toHaveBeenCalledWith('Successfully added');
    });
  });

  // Add more tests for:
  // - Adding item from category row
  // - API error handling when adding item
  // - Initial content fetch error handling
  // - UI updates after adding item (e.g., button state changes, inLibrary status)
});
