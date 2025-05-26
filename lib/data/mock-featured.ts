/**
 * Mock featured content data
 */
import { FeaturedContent, FeaturedCategory, FeaturedItem } from '../types/featured';

// Content category IDs
export const CONTENT_CATEGORIES = {
  TRENDING_MOVIES: 'trending-movies',
  POPULAR_TV: 'popular-tv',
  NEW_RELEASES: 'new-releases',
  FOUR_K: '4k-content',
  DOCUMENTARIES: 'documentaries'
} as const;

export function getMockFeaturedContent(): FeaturedContent {
  return {
    featuredItem: {
      id: '1',
      title: 'Dune: Part Two',
      overview: 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.',
      backdropPath: '/api/placeholder/1920/1080',
      posterPath: '/api/placeholder/500/750',
      mediaType: 'movie',
      rating: 8.5,
      year: 2024,
      genres: ['Science Fiction', 'Adventure'],
      runtime: 166,
      inLibrary: false,
      downloading: false,
      tmdbAvailable: true
    },
    categories: [
      {
        id: CONTENT_CATEGORIES.TRENDING_MOVIES,
        title: 'Trending Movies',
        items: generateMockMovies(10, 'trending')
      },
      {
        id: CONTENT_CATEGORIES.POPULAR_TV,
        title: 'Popular TV Shows',
        items: generateMockTVShows(10, 'popular')
      },
      {
        id: CONTENT_CATEGORIES.NEW_RELEASES,
        title: 'New Releases',
        items: generateMockMovies(10, 'new')
      },
      {
        id: CONTENT_CATEGORIES.FOUR_K,
        title: '4K Content',
        items: generateMockMovies(10, '4k')
      },
      {
        id: CONTENT_CATEGORIES.DOCUMENTARIES,
        title: 'Documentaries',
        items: generateMockDocumentaries(10)
      }
    ]
  };
}

function generateMockMovies(count: number, type: string): FeaturedItem[] {
  const mockMovies = [
    { title: 'The Batman', year: 2022, rating: 7.8 },
    { title: 'Spider-Man: No Way Home', year: 2021, rating: 8.2 },
    { title: 'Top Gun: Maverick', year: 2022, rating: 8.3 },
    { title: 'Everything Everywhere All at Once', year: 2022, rating: 8.0 },
    { title: 'The Northman', year: 2022, rating: 7.1 },
    { title: 'Black Panther: Wakanda Forever', year: 2022, rating: 7.2 },
    { title: 'Avatar: The Way of Water', year: 2022, rating: 7.6 },
    { title: 'Oppenheimer', year: 2023, rating: 8.5 },
    { title: 'Barbie', year: 2023, rating: 7.0 },
    { title: 'Guardians of the Galaxy Vol. 3', year: 2023, rating: 7.9 }
  ];

  return mockMovies.slice(0, count).map((movie, index) => ({
    id: `${type}-movie-${index + 1}`,
    title: movie.title,
    overview: `An exciting ${type} movie that captivates audiences worldwide.`,
    backdropPath: '/api/placeholder/1920/1080',
    posterPath: '/api/placeholder/500/750',
    mediaType: 'movie' as const,
    rating: movie.rating,
    year: movie.year,
    genres: ['Action', 'Adventure'],
    runtime: 120 + Math.floor(Math.random() * 60),
    inLibrary: Math.random() > 0.7,
    downloading: Math.random() > 0.9,
    tmdbAvailable: true
  }));
}

function generateMockTVShows(count: number, type: string): FeaturedItem[] {
  const mockShows = [
    { title: 'The Last of Us', year: 2023, rating: 8.7 },
    { title: 'House of the Dragon', year: 2022, rating: 8.4 },
    { title: 'The Bear', year: 2022, rating: 8.5 },
    { title: 'Wednesday', year: 2022, rating: 8.1 },
    { title: 'Severance', year: 2022, rating: 8.7 },
    { title: 'The White Lotus', year: 2021, rating: 7.9 },
    { title: 'Succession', year: 2018, rating: 8.8 },
    { title: 'The Mandalorian', year: 2019, rating: 8.6 },
    { title: 'Strange Things', year: 2016, rating: 8.7 },
    { title: 'The Crown', year: 2016, rating: 8.6 }
  ];

  return mockShows.slice(0, count).map((show, index) => ({
    id: `${type}-tv-${index + 1}`,
    title: show.title,
    overview: `A compelling ${type} TV series that keeps viewers on the edge of their seats.`,
    backdropPath: '/api/placeholder/1920/1080',
    posterPath: '/api/placeholder/500/750',
    mediaType: 'tv' as const,
    rating: show.rating,
    year: show.year,
    genres: ['Drama', 'Thriller'],
    seasons: Math.floor(Math.random() * 5) + 1,
    inLibrary: Math.random() > 0.7,
    downloading: Math.random() > 0.9,
    tmdbAvailable: true
  }));
}

function generateMockDocumentaries(count: number): FeaturedItem[] {
  const mockDocs = [
    { title: 'Planet Earth III', year: 2023, rating: 9.0 },
    { title: 'The Social Dilemma', year: 2020, rating: 7.6 },
    { title: 'My Octopus Teacher', year: 2020, rating: 8.0 },
    { title: 'Free Solo', year: 2018, rating: 8.2 },
    { title: 'Won\'t You Be My Neighbor?', year: 2018, rating: 8.4 },
    { title: 'The Act of Killing', year: 2012, rating: 8.2 },
    { title: 'Icarus', year: 2017, rating: 7.9 },
    { title: 'The Cove', year: 2009, rating: 8.4 },
    { title: 'An Inconvenient Truth', year: 2006, rating: 7.4 },
    { title: 'March of the Penguins', year: 2005, rating: 7.5 }
  ];

  return mockDocs.slice(0, count).map((doc, index) => ({
    id: `documentary-${index + 1}`,
    title: doc.title,
    overview: 'An eye-opening documentary that explores important topics and changes perspectives.',
    backdropPath: '/api/placeholder/1920/1080',
    posterPath: '/api/placeholder/500/750',
    mediaType: 'movie' as const,
    rating: doc.rating,
    year: doc.year,
    genres: ['Documentary'],
    runtime: 90 + Math.floor(Math.random() * 30),
    inLibrary: Math.random() > 0.8,
    downloading: Math.random() > 0.95,
    tmdbAvailable: true
  }));
}
