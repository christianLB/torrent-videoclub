import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import FeaturedCarousel from './FeaturedCarousel'; // The component to test
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mocking react-hot-toast
vi.mock('react-hot-toast', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
  },
  Toaster: () => <div data-testid="mock-toaster"></div>
}));

// Mocking embla-carousel-react and autoplay
vi.mock('embla-carousel-react', () => ({
  __esModule: true,
  default: vi.fn(() => [vi.fn(), { scrollPrev: vi.fn(), scrollNext: vi.fn(), on: vi.fn(), off: vi.fn() }]), // Added on/off mocks
}));
vi.mock('embla-carousel-autoplay', () => ({
  __esModule: true,
  default: vi.fn(() => ({ init: vi.fn(), destroy: vi.fn() }))
})); // Simplified mock

// Mock Next.js Link component
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  }
}));

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => {
    return <img src={src} alt={alt} />
  }
}));

global.fetch = vi.fn();

const mockCarouselItems = [
  { tmdbId: 1, title: 'Movie 1', backdropPath: '/path1.jpg', mediaType: 'movie' as 'movie' | 'tv', overview: 'Overview 1' },
  { tmdbId: 2, title: 'TV Show 2', backdropPath: '/path2.jpg', mediaType: 'tv' as 'movie' | 'tv', overview: 'Overview 2' },
];

describe('FeaturedCarousel', () => {
  beforeEach(() => {
    vi.resetAllMocks(); // Clear all mocks before each test
  });

  it('should display loading state initially', () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockImplementationOnce(() => new Promise(() => {})); // Never resolves
    render(<FeaturedCarousel />);
    expect(screen.getByText(/Loading Carousel.../i)).toBeDefined();
  });

  it('should fetch and display carousel items successfully', async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCarouselItems,
    });

    render(<FeaturedCarousel />);

    await waitFor(() => {
      expect(screen.queryByText(/Loading Carousel.../i)).toBe(null);
    });

    expect(screen.getByText('Movie 1')).toBeDefined();
    expect(screen.getByText('TV Show 2')).toBeDefined();
    expect(screen.queryByText(/Error loading carousel/i)).toBe(null);
    expect(screen.queryByText(/No items to display/i)).toBe(null);
  });

  it('should display "No items to display" when API returns an empty array', async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    render(<FeaturedCarousel />);

    await waitFor(() => {
      expect(screen.queryByText(/Loading Carousel.../i)).toBe(null);
    });

    expect(screen.getByText(/No items to display in carousel./i)).toBeDefined();
    expect(screen.queryByText(/Error loading carousel/i)).toBe(null);
  });

  it('should display error message when API call fails with non-ok response', async () => {
    const errorMessage = 'Network error';
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: errorMessage }), // Ensure API returns error in expected format
    });

    render(<FeaturedCarousel />);

    await waitFor(() => {
      expect(screen.queryByText(/Loading Carousel.../i)).toBe(null);
    });

    expect(screen.getByText(/Error loading carousel/i)).toBeDefined();
    // The component formats the error, so we check for the generic message first
    // and then ensure the specific error from API is also shown.
    expect(screen.getByText(errorMessage)).toBeDefined(); 
    expect(screen.queryByText(/No items to display/i)).toBe(null);
  });

  it('should display error message when fetch throws an error', async () => {
    const errorMessage = 'Fetch failed spectacularly';
    (fetch as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error(errorMessage));

    render(<FeaturedCarousel />);

    await waitFor(() => {
      expect(screen.queryByText(/Loading Carousel.../i)).toBe(null);
    });

    expect(screen.getByText(/Error loading carousel/i)).toBeDefined();
    expect(screen.getByText(errorMessage)).toBeDefined();
    expect(screen.queryByText(/No items to display/i)).toBe(null);
  });
});
