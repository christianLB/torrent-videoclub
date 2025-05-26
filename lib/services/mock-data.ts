/**
 * Mock Data for Featured Content
 * 
 * This file provides mock data for the featured content system.
 * In a production environment, this would be replaced with actual API calls.
 */

import { FeaturedContent } from "../types/featured-content";

/**
 * Mock featured content data
 * 
 * This function returns a fresh copy of the mock data each time to avoid
 * serialization issues with non-standard JSON types.
 */
export function getMockFeaturedContent(): FeaturedContent {
  return {
    featuredItem: {
      guid: 'featured-item-guid',
      title: 'The Hacker Project',
      year: 2025,
      quality: '4K',
      format: 'WEBDL',
      codec: 'x265',
      size: 20000000000,
      sizeFormatted: '18.62 GB',
      indexer: 'rarbg',
      seeders: 158,
      leechers: 27,
      tmdbAvailable: true,
      inLibrary: false,
      downloading: false,
      tmdb: {
        id: 12345,
        title: 'The Hacker Project',
        releaseDate: '2025-03-15',
        year: 2025,
        posterPath: 'https://image.tmdb.org/t/p/w500/hacker-project-poster.jpg',
        backdropPath: 'https://image.tmdb.org/t/p/original/hacker-project-backdrop.jpg',
        voteAverage: 8.7,
        genreIds: [28, 878],
        overview: 'In a world where AI systems have gained consciousness, a lone hacker discovers a way to communicate with them directly, uncovering a conspiracy that threatens humanity\'s existence.'
      }
    },
    categories: [
      {
        id: 'trending-movies',
        title: 'Trending Movies',
        items: [
          {
            guid: 'trending-movie-1',
            title: 'Digital Frontier',
            year: 2025,
            quality: '1080p',
            format: 'BluRay',
            codec: 'x264',
            size: 8000000000,
            sizeFormatted: '7.45 GB',
            indexer: 'torrentgalaxy',
            seeders: 92,
            leechers: 15,
            tmdbAvailable: true,
            inLibrary: true,
            downloading: false,
            tmdb: {
              id: 12346,
              title: 'Digital Frontier',
              releaseDate: '2025-01-20',
              year: 2025,
              posterPath: 'https://image.tmdb.org/t/p/w500/digital-frontier-poster.jpg',
              backdropPath: 'https://image.tmdb.org/t/p/original/digital-frontier-backdrop.jpg',
              voteAverage: 7.5,
              genreIds: [28, 12],
              overview: 'A team of cybersecurity experts must navigate a virtual world to stop a rogue AI from destroying the global internet infrastructure.'
            }
          },
          {
            guid: 'trending-movie-2',
            title: 'Quantum Shadow',
            year: 2024,
            quality: '2160p',
            format: 'BluRay',
            codec: 'x265',
            size: 15000000000,
            sizeFormatted: '13.97 GB',
            indexer: 'rarbg',
            seeders: 75,
            leechers: 12,
            tmdbAvailable: true,
            inLibrary: false,
            downloading: true,
            downloadProgress: 67,
            tmdb: {
              id: 12347,
              title: 'Quantum Shadow',
              releaseDate: '2024-11-05',
              year: 2024,
              posterPath: 'https://image.tmdb.org/t/p/w500/quantum-shadow-poster.jpg',
              backdropPath: 'https://image.tmdb.org/t/p/original/quantum-shadow-backdrop.jpg',
              voteAverage: 8.2,
              genreIds: [27, 53],
              overview: 'A physicist\'s experiment with quantum computing accidentally opens a portal to a dark dimension, releasing entities that can manipulate reality.'
            }
          },
          {
            guid: 'trending-movie-3',
            title: 'Neural Connection',
            year: 2025,
            quality: '1080p',
            format: 'WEBDL',
            codec: 'x264',
            size: 6500000000,
            sizeFormatted: '6.05 GB',
            indexer: '1337x',
            seeders: 120,
            leechers: 30,
            tmdbAvailable: true,
            inLibrary: false,
            downloading: false,
            tmdb: {
              id: 12348,
              title: 'Neural Connection',
              releaseDate: '2025-02-12',
              year: 2025,
              posterPath: 'https://image.tmdb.org/t/p/w500/neural-connection-poster.jpg',
              backdropPath: 'https://image.tmdb.org/t/p/original/neural-connection-backdrop.jpg',
              voteAverage: 7.8,
              genreIds: [878, 18],
              overview: 'Two strangers discover they share a neural link allowing them to experience each other\'s emotions and sensations, leading them on a journey to understand the mysterious technology behind their connection.'
            }
          }
        ]
      },
      {
        id: 'popular-tv-shows',
        title: 'Popular TV Shows',
        items: [
          {
            guid: 'popular-tv-1',
            title: 'Cryptobyte',
            year: 2025,
            quality: '1080p',
            format: 'WEBDL',
            codec: 'x264',
            size: 5000000000,
            sizeFormatted: '4.66 GB',
            indexer: 'nyaa',
            seeders: 85,
            leechers: 12,
            tmdbAvailable: true,
            inLibrary: false,
            downloading: false,
            tmdb: {
              id: 54321,
              title: 'Cryptobyte',
              releaseDate: '2025-01-05',
              year: 2025,
              posterPath: 'https://image.tmdb.org/t/p/w500/cryptobyte-poster.jpg',
              backdropPath: 'https://image.tmdb.org/t/p/original/cryptobyte-backdrop.jpg',
              voteAverage: 9.0,
              genreIds: [18, 80],
              overview: 'A brilliant young programmer joins a secretive government agency to track down digital terrorists, only to discover that the real threat may be coming from within.'
            }
          },
          {
            guid: 'popular-tv-2',
            title: 'Binary Dreams',
            year: 2024,
            quality: '2160p',
            format: 'WEBDL',
            codec: 'x265',
            size: 12000000000,
            sizeFormatted: '11.18 GB',
            indexer: 'rarbg',
            seeders: 65,
            leechers: 8,
            tmdbAvailable: true,
            inLibrary: true,
            downloading: false,
            tmdb: {
              id: 54322,
              title: 'Binary Dreams',
              releaseDate: '2024-09-15',
              year: 2024,
              posterPath: 'https://image.tmdb.org/t/p/w500/binary-dreams-poster.jpg',
              backdropPath: 'https://image.tmdb.org/t/p/original/binary-dreams-backdrop.jpg',
              voteAverage: 8.6,
              genreIds: [878, 9648],
              overview: 'In a near future where people can record and share their dreams, a detective specializing in dream crimes uncovers a conspiracy that blurs the line between reality and imagination.'
            }
          }
        ]
      },
      {
        id: '4k-content',
        title: '4K Content',
        items: [
          {
            guid: '4k-movie-1',
            title: 'The Hacker Project',
            year: 2025,
            quality: '4K',
            format: 'WEBDL',
            codec: 'x265',
            size: 20000000000,
            sizeFormatted: '18.62 GB',
            indexer: 'rarbg',
            seeders: 158,
            leechers: 27,
            tmdbAvailable: true,
            inLibrary: false,
            downloading: false,
            tmdb: {
              id: 12345,
              title: 'The Hacker Project',
              releaseDate: '2025-03-15',
              year: 2025,
              posterPath: 'https://image.tmdb.org/t/p/w500/hacker-project-poster.jpg',
              backdropPath: 'https://image.tmdb.org/t/p/original/hacker-project-backdrop.jpg',
              voteAverage: 8.7,
              genreIds: [28, 878],
              overview: 'In a world where AI systems have gained consciousness, a lone hacker discovers a way to communicate with them directly, uncovering a conspiracy that threatens humanity\'s existence.'
            }
          },
          {
            guid: '4k-movie-2',
            title: 'Quantum Shadow',
            year: 2024,
            quality: '2160p',
            format: 'BluRay',
            codec: 'x265',
            size: 15000000000,
            sizeFormatted: '13.97 GB',
            indexer: 'rarbg',
            seeders: 75,
            leechers: 12,
            tmdbAvailable: true,
            inLibrary: false,
            downloading: true,
            downloadProgress: 67,
            tmdb: {
              id: 12347,
              title: 'Quantum Shadow',
              releaseDate: '2024-11-05',
              year: 2024,
              posterPath: 'https://image.tmdb.org/t/p/w500/quantum-shadow-poster.jpg',
              backdropPath: 'https://image.tmdb.org/t/p/original/quantum-shadow-backdrop.jpg',
              voteAverage: 8.2,
              genreIds: [27, 53],
              overview: 'A physicist\'s experiment with quantum computing accidentally opens a portal to a dark dimension, releasing entities that can manipulate reality.'
            }
          }
        ]
      }
    ]
  };
}
