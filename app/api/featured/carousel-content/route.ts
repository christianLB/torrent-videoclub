import { NextResponse } from 'next/server';
import { RadarrClient } from '@/lib/api/radarr-client';
import { SonarrClient } from '@/lib/api/sonarr-client';
import { tmdbDataService } from '@/lib/services/tmdb-data-service'; // Assuming tmdbDataService is an instance or has static methods
import type { TMDBMediaItem } from '@/lib/types/tmdb'; // Assuming types from a TMDB library

const CAROUSEL_SIZE = 15;
const FETCH_COUNT_PER_TYPE = 20; // Fetch more items initially to account for filtering

interface CarouselItem {
  tmdbId: number;
  title: string;
  posterPath?: string;
  backdropPath?: string;
  overview?: string;
  mediaType: 'movie' | 'tv';
  // Add other relevant fields like release_date, vote_average if needed for display
}

// Helper function to shuffle an array (Fisher-Yates)
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export async function GET() {
  try {
    const radarrUrl = process.env.RADARR_URL;
    const radarrApiKey = process.env.RADARR_API_KEY;
    const sonarrUrl = process.env.SONARR_URL;
    const sonarrApiKey = process.env.SONARR_API_KEY;

    const libraryTmdbIds = new Set<number>();

    // Fetch Radarr library TMDB IDs
    if (radarrUrl && radarrApiKey) {
      try {
        const radarrClient = new RadarrClient(radarrUrl, radarrApiKey);
        const radarrIds = await radarrClient.getLibraryTmdbIds();
        radarrIds.forEach(id => libraryTmdbIds.add(id));
      } catch (error) {
        console.warn('[API/featured/carousel-content] Failed to fetch Radarr library:', error);
        // Continue without Radarr data if it fails, carousel will just be less personalized
      }
    }

    // Fetch Sonarr library TMDB IDs
    if (sonarrUrl && sonarrApiKey) {
      try {
        const sonarrClient = new SonarrClient(sonarrUrl, sonarrApiKey);
        const sonarrIds = await sonarrClient.getLibraryTmdbIds();
        sonarrIds.forEach(id => libraryTmdbIds.add(id));
      } catch (error) {
        console.warn('[API/featured/carousel-content] Failed to fetch Sonarr library:', error);
        // Continue without Sonarr data
      }
    }

    // Fetch popular movies and trending TV shows from tmdbDataService
    const popularMoviesItems: TMDBMediaItem[] = await tmdbDataService.getOrFetchPopularMovies(1);
    const trendingTvItems: TMDBMediaItem[] = await tmdbDataService.getOrFetchTrendingTvShows('day', 1);

    const popularMovies = popularMoviesItems.slice(0, FETCH_COUNT_PER_TYPE);
    const trendingTv = trendingTvItems.slice(0, FETCH_COUNT_PER_TYPE);

    const allPotentialItems: CarouselItem[] = [];

    popularMovies.forEach(item => {
      if (item.tmdbId && item.title && item.mediaType === 'movie') { // Ensure it's actually a movie
        allPotentialItems.push({
          tmdbId: item.tmdbId,
          title: item.title,
          posterPath: item.posterPath || undefined,
          backdropPath: item.backdropPath || undefined,
          overview: item.overview || undefined,
          mediaType: 'movie',
        });
      }
    });

    trendingTv.forEach(item => {
      if (item.tmdbId && item.title && item.mediaType === 'tv') { // Ensure it's actually a TV show
        allPotentialItems.push({
          tmdbId: item.tmdbId,
          title: item.title,
          posterPath: item.posterPath || undefined,
          backdropPath: item.backdropPath || undefined,
          overview: item.overview || undefined,
          mediaType: 'tv',
        });
      }
    });

    // Filter out items already in the library
    const filteredItems = allPotentialItems.filter(item => !libraryTmdbIds.has(item.tmdbId));

    // Shuffle and take the top N items
    const shuffledItems = shuffleArray(filteredItems);
    const carouselItems = shuffledItems.slice(0, CAROUSEL_SIZE);

    return NextResponse.json(carouselItems);

  } catch (error: unknown) {
    console.error('[API/featured/carousel-content] Error fetching carousel content:', error);
    let details = 'Unknown error';
    if (error instanceof Error) {
      details = error.message;
    }
    return NextResponse.json(
      { error: 'Failed to fetch carousel content.', details }, 
      { status: 500 }
    );
  }
}
