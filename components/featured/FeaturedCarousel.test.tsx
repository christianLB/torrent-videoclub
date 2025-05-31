import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import FeaturedCarousel from './FeaturedCarousel'; // The component to test

// Mocking react-hot-toast
jest.mock('react-hot-toast', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
    loading: jest.fn(),
    dismiss: jest.fn(),
  },
}));

// Mocking embla-carousel-react and autoplay
jest.mock('embla-carousel-react', () => {
  const originalModule = jest.requireActual('embla-carousel-react');
  return {
    __esModule: true,
    ...originalModule,
    default: jest.fn(() => [jest.fn(), { scrollPrev: jest.fn(), scrollNext: jest.fn(), on: jest.fn(), off: jest.fn() }]), // Added on/off mocks
  };
});
jest.mock('embla-carousel-autoplay', () => jest.fn(() => ({ init: jest.fn(), destroy: jest.fn() }))); // Simplified mock

// Mock Next.js Link component
jest.mock('next/link', () => {
  const MockedLink = ({ children, href }: { children: React.ReactNode; href: string }) => {

    return <a href={href}>{children}</a>;
  };
  MockedLink.displayName = 'MockedNextLink';
  return MockedLink;
});

global.fetch = jest.fn();

const mockCarouselItems = [
  { tmdbId: 1, title: 'Movie 1', backdropPath: '/path1.jpg', mediaType: 'movie' as 'movie' | 'tv', overview: 'Overview 1' },
  { tmdbId: 2, title: 'TV Show 2', backdropPath: '/path2.jpg', mediaType: 'tv' as 'movie' | 'tv', overview: 'Overview 2' },
];

describe('FeaturedCarousel', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
    jest.clearAllMocks(); // Clear all mocks before each test
  });

  it('should display loading state initially', () => {
    (fetch as jest.Mock).mockImplementationOnce(() => new Promise(() => {})); // Never resolves
    render(<FeaturedCarousel />);
    expect(screen.getByText(/Loading Carousel.../i)).toBeInTheDocument();
  });

  it('should fetch and display carousel items successfully', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCarouselItems,
    });

    render(<FeaturedCarousel />);

    await waitFor(() => {
      expect(screen.queryByText(/Loading Carousel.../i)).not.toBeInTheDocument();
    });

    expect(screen.getByText('Movie 1')).toBeInTheDocument();
    expect(screen.getByText('TV Show 2')).toBeInTheDocument();
    expect(screen.queryByText(/Error loading carousel/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/No items to display/i)).not.toBeInTheDocument();
  });

  it('should display "No items to display" when API returns an empty array', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    render(<FeaturedCarousel />);

    await waitFor(() => {
      expect(screen.queryByText(/Loading Carousel.../i)).not.toBeInTheDocument();
    });

    expect(screen.getByText(/No items to display in carousel./i)).toBeInTheDocument();
    expect(screen.queryByText(/Error loading carousel/i)).not.toBeInTheDocument();
  });

  it('should display error message when API call fails with non-ok response', async () => {
    const errorMessage = 'Network error';
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: errorMessage }), // Ensure API returns error in expected format
    });

    render(<FeaturedCarousel />);

    await waitFor(() => {
      expect(screen.queryByText(/Loading Carousel.../i)).not.toBeInTheDocument();
    });

    expect(screen.getByText(/Error loading carousel/i)).toBeInTheDocument();
    // The component formats the error, so we check for the generic message first
    // and then ensure the specific error from API is also shown.
    expect(screen.getByText(errorMessage)).toBeInTheDocument(); 
    expect(screen.queryByText(/No items to display/i)).not.toBeInTheDocument();
  });

  it('should display error message when fetch throws an error', async () => {
    const errorMessage = 'Fetch failed spectacularly';
    (fetch as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));

    render(<FeaturedCarousel />);

    await waitFor(() => {
      expect(screen.queryByText(/Loading Carousel.../i)).not.toBeInTheDocument();
    });

    expect(screen.getByText(/Error loading carousel/i)).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    expect(screen.queryByText(/No items to display/i)).not.toBeInTheDocument();
  });
});
