/**
 * Mock featured content data
 */
import { FeaturedContent, FeaturedItem, TMDbEnrichmentData } from '../types/featured';

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
      guid: 'featured-dune-part-two',
      title: 'Dune: Part Two',
      indexerId: '1',
      size: 15000000000,
      seeders: 150,
      leechers: 15,
      protocol: 'torrent',
      publishDate: '2024-03-01',
      quality: '4K',
      mediaType: 'movie',
      inLibrary: false,
      isDownloading: false,
      tmdbInfo: {
        tmdbId: 693134,
        title: 'Dune: Part Two',
        overview: 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.',
        backdropPath: '/api/placeholder/1920/1080',
        posterPath: '/api/placeholder/500/750',
        voteAverage: 8.5,
        year: 2024,
        releaseDate: '2024-03-01',
        runtime: 166
      },
      displayTitle: 'Dune: Part Two (2024)',
      fullPosterPath: 'https://image.tmdb.org/t/p/w500/api/placeholder/500/750',
      fullBackdropPath: 'https://image.tmdb.org/t/p/original/api/placeholder/1920/1080'
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

  return mockMovies.slice(0, count).map((movie, index) => {
    const tmdbId = 100000 + index;
    const tmdbInfo: TMDbEnrichmentData = {
      tmdbId: tmdbId,
      title: movie.title,
      overview: `An exciting ${type} movie that captivates audiences worldwide.`,
      backdropPath: '/api/placeholder/1920/1080',
      posterPath: '/api/placeholder/500/750',
      voteAverage: movie.rating,
      year: movie.year,
      releaseDate: `${movie.year}-01-01`,
      runtime: 120 + Math.floor(Math.random() * 60),
      genreIds: [28, 12] // Action, Adventure
    };
    
    return {
      guid: `${type}-movie-${index + 1}`,
      title: `${movie.title} (${movie.year}) ${type}`,
      indexerId: String(index + 1),

      size: 5000000000 + Math.floor(Math.random() * 10000000000),
      sizeFormatted: '5.0 GB',
      quality: Math.random() > 0.3 ? '1080p' : '4K',
      protocol: 'torrent',
      publishDate: `${movie.year}-01-01`,
      seeders: 10 + Math.floor(Math.random() * 100),
      leechers: 1 + Math.floor(Math.random() * 20),
      mediaType: 'movie',
      inLibrary: Math.random() > 0.7,
      isDownloading: Math.random() > 0.9,
      tmdbInfo: tmdbInfo,
      displayTitle: `${movie.title} (${movie.year})`,
      fullPosterPath: `https://image.tmdb.org/t/p/w500/api/placeholder/500/750`,
      fullBackdropPath: `https://image.tmdb.org/t/p/original/api/placeholder/1920/1080`
    };
  });
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

  return mockShows.slice(0, count).map((show, index) => {
    const tmdbId = 200000 + index;
    const tmdbInfo: TMDbEnrichmentData = {
      tmdbId: tmdbId,
      title: show.title,
      overview: `A compelling ${type} TV series that keeps viewers on the edge of their seats.`,
      backdropPath: '/api/placeholder/1920/1080',
      posterPath: '/api/placeholder/500/750',
      voteAverage: show.rating,
      year: show.year,
      releaseDate: `${show.year}-01-01`,
      seasons: Math.floor(Math.random() * 5) + 1,
      genreIds: [18, 53] // Drama, Thriller
    };
    
    return {
      guid: `${type}-tv-${index + 1}`,
      title: `${show.title} S01 (${show.year}) ${type}`,
      indexerId: String(index + 1),

      size: 2000000000 + Math.floor(Math.random() * 5000000000),
      sizeFormatted: '2.5 GB',
      quality: Math.random() > 0.3 ? '1080p' : '4K',
      protocol: 'torrent',
      publishDate: `${show.year}-01-01`,
      seeders: 10 + Math.floor(Math.random() * 100),
      leechers: 1 + Math.floor(Math.random() * 20),
      mediaType: 'tv',
      inLibrary: Math.random() > 0.7,
      isDownloading: Math.random() > 0.9,
      tmdbInfo: tmdbInfo,
      displayTitle: `${show.title} (${show.year})`,
      fullPosterPath: `https://image.tmdb.org/t/p/w500/api/placeholder/500/750`,
      fullBackdropPath: `https://image.tmdb.org/t/p/original/api/placeholder/1920/1080`
    };
  });
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

  return mockDocs.slice(0, count).map((doc, index) => {
    const tmdbId = 300000 + index;
    const tmdbInfo: TMDbEnrichmentData = {
      tmdbId: tmdbId,
      title: doc.title,
      overview: 'An eye-opening documentary that explores important topics and changes perspectives.',
      backdropPath: '/api/placeholder/1920/1080',
      posterPath: '/api/placeholder/500/750',
      voteAverage: doc.rating,
      year: doc.year,
      releaseDate: `${doc.year}-01-01`,
      runtime: 90 + Math.floor(Math.random() * 30),
      genreIds: [99] // Documentary
    };
    
    return {
      guid: `documentary-${index + 1}`,
      title: `${doc.title} (${doc.year})`,
      indexerId: String(index + 1),

      size: 3000000000 + Math.floor(Math.random() * 5000000000),
      sizeFormatted: '3.5 GB',
      quality: Math.random() > 0.3 ? '1080p' : '4K',
      protocol: 'torrent',
      publishDate: `${doc.year}-01-01`,
      seeders: 5 + Math.floor(Math.random() * 50),
      leechers: 1 + Math.floor(Math.random() * 10),
      mediaType: 'movie',
      inLibrary: Math.random() > 0.8,
      isDownloading: Math.random() > 0.95,
      tmdbInfo: tmdbInfo,
      displayTitle: `${doc.title} (${doc.year})`,
      fullPosterPath: `https://image.tmdb.org/t/p/w500/api/placeholder/500/750`,
      fullBackdropPath: `https://image.tmdb.org/t/p/original/api/placeholder/1920/1080`
    };
  });
}
