import { vi } from 'vitest';
import { TMDBMediaItem } from '../../../lib/types/tmdb';

// Create a mock implementation of the TMDBDataService
const mockMediaItem: TMDBMediaItem = {
  id: 123,
  tmdbId: 123,
  title: 'Test Movie',
  overview: 'Test overview',
  backdropPath: '/test-backdrop.jpg',
  posterPath: '/test-poster.jpg',
  mediaType: 'movie',
  year: 2023,
  genres: [],
  voteAverage: 7.5
};

// Mock the TMDBDataService class
class TMDBDataService {
  constructor() {
    // No checks for API key in our mock
  }

  async getOrFetchMediaItem() {
    return mockMediaItem;
  }
  
  async getOrFetchMediaList() {
    return [mockMediaItem];
  }
  
  async getOrFetchPopularMovies() {
    return [mockMediaItem];
  }
  
  async getOrFetchTrendingMovies() {
    return [mockMediaItem];
  }
  
  async getOrFetchPopularTvShows() {
    return [mockMediaItem];
  }
  
  async getOrFetchTrendingTvShows() {
    return [mockMediaItem];
  }
  
  async getOrFetchUpcomingMovies() {
    return [mockMediaItem];
  }
  
  async getOrFetchTopRatedMovies() {
    return [mockMediaItem];
  }
}

// Export a pre-mocked singleton instance
export const tmdbDataService = {
  getOrFetchMediaItem: vi.fn().mockResolvedValue(mockMediaItem),
  getOrFetchMediaList: vi.fn().mockResolvedValue([mockMediaItem]),
  getOrFetchPopularMovies: vi.fn().mockResolvedValue([mockMediaItem]),
  getOrFetchTrendingMovies: vi.fn().mockResolvedValue([mockMediaItem]),
  getOrFetchPopularTvShows: vi.fn().mockResolvedValue([mockMediaItem]),
  getOrFetchTrendingTvShows: vi.fn().mockResolvedValue([mockMediaItem]),
  getOrFetchUpcomingMovies: vi.fn().mockResolvedValue([mockMediaItem]),
  getOrFetchTopRatedMovies: vi.fn().mockResolvedValue([mockMediaItem])
};

// Also export the class for cases where it might be directly instantiated
export { TMDBDataService };
