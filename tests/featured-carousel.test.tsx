import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import FeaturedCarousel from '../components/featured/FeaturedCarousel';
import { TMDBMediaItem } from '../lib/types/tmdb';

// Mock embla-carousel-react
vi.mock('embla-carousel-react', () => ({
  __esModule: true,
  default: vi.fn(() => [vi.fn(), { scrollPrev: vi.fn(), scrollNext: vi.fn(), on: vi.fn(), off: vi.fn() }]), // Needed mocks
}));

// Mock embla-carousel-autoplay
vi.mock('embla-carousel-autoplay', () => ({
  __esModule: true,
  default: vi.fn(() => ({ init: vi.fn(), destroy: vi.fn() }))
}));

// Mock next/image
vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => {
    return <img src={src} alt={alt} />
  }
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  }
}));

// Mock the fetch function
global.fetch = vi.fn();

// Mock toast with a proper implementation
vi.mock('react-hot-toast', () => {
  const success = vi.fn();
  const error = vi.fn();
  const loading = vi.fn();
  const dismiss = vi.fn();
  return {
    default: {
      success,
      error,
      loading,
      dismiss
    },
    toast: {
      success,
      error,
      loading,
      dismiss
    },
    Toaster: () => <div data-testid="mock-toaster"></div>
  };
});

// Import after mocking
const toast = { success: vi.fn(), error: vi.fn() };

// Mock console.error
const originalConsoleError = console.error;
console.error = vi.fn();

describe('FeaturedCarousel', () => {
  // Mock the mock item for tests
  const mockItem: TMDBMediaItem = {
    tmdbId: 12345,
    title: 'Test Movie',
    posterPath: '/test-poster.jpg',
    backdropPath: '/test-backdrop.jpg',
    overview: 'Test overview',
    mediaType: 'movie',
    releaseDate: '2023-01-01'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    console.error = vi.fn();
  });
  
  afterEach(() => {
    console.error = originalConsoleError;
  });

  it('renders the featured item correctly', () => {
    render(<FeaturedCarousel item={mockItem} />);
    
    expect(screen.getByText('Test Movie')).toBeInTheDocument();
    expect(screen.getByText('Test overview')).toBeInTheDocument();
  });

  it('renders the carousel with navigation buttons when there are multiple items', async () => {
    // Multiple items case
    const multipleItems = [
      mockItem,
      {
        ...mockItem,
        tmdbId: 456,
        title: 'Another Test Movie'
      }
    ];
    
    // Mock fetch API to return multiple items
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => multipleItems
    });
    
    render(<FeaturedCarousel />);
    
    // Wait for carousel to render and check navigation buttons
    await waitFor(() => {
      // Look for buttons by their aria-label
      const prevButton = screen.getByLabelText('Previous slide');
      const nextButton = screen.getByLabelText('Next slide');
      expect(prevButton).toBeInTheDocument();
      expect(nextButton).toBeInTheDocument();
    });
  });

  it('displays the title and overview of the item', async () => {
    render(<FeaturedCarousel item={mockItem} />);

    // Look for the title and overview
    expect(screen.getByText('Test Movie')).toBeInTheDocument();
    expect(screen.getByText('Test overview')).toBeInTheDocument();
    
    // Check that the link to the detail page is correct
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/movie/12345');
  });
});
